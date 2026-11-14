import { createHash } from 'node:crypto';
import { extractProjectSpineDraftBody } from '../shared/projectSpineDraft.js';
import { isWritingGroups, sameWritingAnchor, validGapWritingOperation } from '../shared/writingRanges.js';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  LIVING_OUTLINE_CHANNELS,
  LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION,
  LIVING_OUTLINE_MAX_LABEL_LENGTH,
  type CreateLivingOutlineItemRequest,
  type ReplaceWritingStateRequest,
  type DeleteLivingOutlineItemRequest,
  type GetLivingOutlineRequest,
  type LinkLivingOutlineItemRequest,
  type LivingOutlineError,
  type LivingOutlineProjectBinding,
  type LivingOutlineResult,
  type MoveLivingOutlineItemRequest,
  type UpdateLivingOutlineItemRequest,
  type PrepareGapRequest,
  type FinishGapRequest,
  type RestoreLivingOutlineItemRequest,
} from '../shared/ipc/livingOutline.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { LivingOutlineRepository, LivingOutlineRepositoryError } from './livingOutlineRepository.js';

export interface RegisterLivingOutlineIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => LivingOutlineRepository;
}

let options: RegisterLivingOutlineIpcOptions | null = null;

function fail(code: LivingOutlineError['code'], message: string): LivingOutlineResult {
  return { ok: false, error: { code, message } };
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function validBinding(request: LivingOutlineProjectBinding): boolean {
  return Boolean(
    request &&
    typeof request.operationId === 'string' && request.operationId.trim() &&
    typeof request.projectId === 'string' && request.projectId.trim() &&
    typeof request.projectPath === 'string' && request.projectPath.trim() &&
    Number.isInteger(request.generation) && request.generation >= 0,
  );
}

function activeProject(
  event: IpcMainInvokeEvent,
  request: LivingOutlineProjectBinding,
): { snapshot: ProjectSpineSessionSnapshot; repository: LivingOutlineRepository } | LivingOutlineResult {
  if (!options || options.resolveWindowRole(event.sender.id) !== 'writing') {
    return fail('NOT_WRITING_STUDIO', 'The story plan is available only in Writing Studio.');
  }
  if (!validBinding(request)) return fail('INVALID_REQUEST', 'The story plan request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using the story plan.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) {
    return fail('STALE_SESSION', 'The active project changed before the story plan request completed.');
  }
  return {
    snapshot,
    repository: (options.repositoryFactory ?? ((projectPath: string) => new LivingOutlineRepository(projectPath)))(
      snapshot.project.path,
    ),
  };
}

function isFailure(value: ReturnType<typeof activeProject>): value is LivingOutlineResult {
  return 'ok' in value;
}

function validRevision(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function validLabel(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= LIVING_OUTLINE_MAX_LABEL_LENGTH;
}

function validKind(value: unknown): boolean {
  return value === 'fragment' || value === 'gap' || value === 'container';
}

function validState(value: unknown): boolean {
  return value === 'authored' || value === 'planned' || value === 'inferred' || value === 'proposed';
}

function validItemId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validUnitReference(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.trim().length > 0);
}

function validSourceAnchor(value: CreateLivingOutlineItemRequest['sourceAnchor']): boolean {
  if (value === null || value === undefined) return true;
  return value.schemaVersion === LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION &&
    validItemId(value.unitId) &&
    (value.anchorKind === 'position' || value.anchorKind === 'span') &&
    Number.isInteger(value.selectionStart) && value.selectionStart >= 0 &&
    Number.isInteger(value.selectionEnd) && value.selectionEnd >= value.selectionStart &&
    (value.anchorKind === 'position'
      ? value.selectionEnd === value.selectionStart
      : value.selectionEnd > value.selectionStart) &&
    /^[a-f0-9]{64}$/i.test(value.sourceFingerprint) &&
    /^[a-f0-9]{64}$/i.test(value.selectionFingerprint) &&
    /^[a-f0-9]{8}$/i.test(value.selectionSearchFingerprint) &&
    Number.isInteger(value.prefixLength) && value.prefixLength >= 0 && value.prefixLength <= 32 &&
    /^[a-f0-9]{8}$/i.test(value.prefixSearchFingerprint) &&
    /^[a-f0-9]{64}$/i.test(value.prefixFingerprint) &&
    Number.isInteger(value.suffixLength) && value.suffixLength >= 0 && value.suffixLength <= 32 &&
    /^[a-f0-9]{8}$/i.test(value.suffixSearchFingerprint) &&
    /^[a-f0-9]{64}$/i.test(value.suffixFingerprint);
}

function unitExists(snapshot: ProjectSpineSessionSnapshot, unitId: string | null): boolean {
  return unitId === null || Boolean(snapshot.project?.units.some((unit) => unit.id === unitId));
}

function repositoryFailure(error: unknown): LivingOutlineResult {
  if (error instanceof LivingOutlineRepositoryError) {
    if (error.code === 'STALE') return fail('STALE_OUTLINE', error.message);
    if (error.code === 'UNKNOWN_ITEM') return fail('UNKNOWN_OUTLINE_ITEM', error.message);
    if (error.code === 'UNAVAILABLE') return fail('LIVING_OUTLINE_UNAVAILABLE', error.message);
    return fail('LIVING_OUTLINE_WRITE_FAILED', error.message);
  }
  return fail('LIVING_OUTLINE_WRITE_FAILED', 'The story plan operation could not be completed.');
}

async function get(event: IpcMainInvokeEvent, request: GetLivingOutlineRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  try {
    return { ok: true, data: await active.repository.read(active.snapshot.project!.projectId) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function createItem(event: IpcMainInvokeEvent, request: CreateLivingOutlineItemRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (
    !validRevision(request.expectedRevision) || !validLabel(request.label) ||
    !validKind(request.kind) || !validState(request.state) ||
    (request.noteScope !== undefined && !['whole-story', 'unattached', 'passage'].includes(request.noteScope)) ||
    (request.sourceWasSpan !== undefined && typeof request.sourceWasSpan !== 'boolean') ||
    ((request.noteScope === 'whole-story' || request.noteScope === 'unattached') && (request.manuscriptUnitId !== null || request.sourceAnchor != null || request.sourceAnchors !== undefined)) ||
    (request.sourceAnchors !== undefined && (!Array.isArray(request.sourceAnchors) || !request.sourceAnchors.length || request.sourceAnchors.some((anchor) => !anchor || !validSourceAnchor(anchor) || !unitExists(active.snapshot, anchor.unitId)) || request.sourceAnchors[0]?.unitId !== request.manuscriptUnitId || !sameWritingAnchor(request.sourceAnchor, request.sourceAnchors[0]))) || !validUnitReference(request.manuscriptUnitId) ||
    !validSourceAnchor(request.sourceAnchor) ||
    (request.sourceAnchor != null && request.sourceAnchor.unitId !== request.manuscriptUnitId) ||
    (request.body !== undefined && (typeof request.body !== 'string' || request.body.length > 4000))
  ) return fail('INVALID_REQUEST', 'The new note is incomplete.');
  if (!unitExists(active.snapshot, request.manuscriptUnitId)) {
    return fail('UNKNOWN_MANUSCRIPT_UNIT', 'The linked manuscript unit no longer exists.');
  }
  if (request.sourceAnchors) {
    const sourceFailure = verifyWritingSources(active.snapshot, request.sourceAnchors);
    if (sourceFailure) return sourceFailure;
  }
  try {
    return { ok: true, data: await active.repository.create(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      {
        label: request.label,
        noteScope: request.noteScope,
        sourceWasSpan: request.sourceWasSpan,
        body: request.body,
        kind: request.kind,
        state: request.state,
        manuscriptUnitId: request.manuscriptUnitId,
        sourceAnchor: request.sourceAnchor ?? null,
        sourceAnchors: request.sourceAnchors,
      },
    ) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function updateItem(event: IpcMainInvokeEvent, request: UpdateLivingOutlineItemRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (
    !validRevision(request.expectedRevision) || !validItemId(request.itemId) ||
    !validLabel(request.label) || !validKind(request.kind) || !validState(request.state) ||
    (request.body !== undefined && (typeof request.body !== 'string' || request.body.length > 4000))
  ) return fail('INVALID_REQUEST', 'The note update is incomplete.');
  try {
    return { ok: true, data: await active.repository.update(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      request.itemId,
      { label: request.label, body: request.body, kind: request.kind, state: request.state },
    ) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function moveItem(event: IpcMainInvokeEvent, request: MoveLivingOutlineItemRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !validItemId(request.itemId) || (request.direction !== -1 && request.direction !== 1)) {
    return fail('INVALID_REQUEST', 'The outline movement request is incomplete.');
  }
  try {
    return { ok: true, data: await active.repository.move(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      request.itemId,
      request.direction,
    ) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function linkItem(event: IpcMainInvokeEvent, request: LinkLivingOutlineItemRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !validItemId(request.itemId) || !validUnitReference(request.manuscriptUnitId)) {
    return fail('INVALID_REQUEST', 'The outline link request is incomplete.');
  }
  if (!unitExists(active.snapshot, request.manuscriptUnitId)) {
    return fail('UNKNOWN_MANUSCRIPT_UNIT', 'The linked manuscript unit no longer exists.');
  }
  try {
    return { ok: true, data: await active.repository.link(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      request.itemId,
      request.manuscriptUnitId,
    ) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function deleteItem(event: IpcMainInvokeEvent, request: DeleteLivingOutlineItemRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !validItemId(request.itemId)) {
    return fail('INVALID_REQUEST', 'The outline deletion request is incomplete.');
  }
  try {
    return { ok: true, data: await active.repository.delete(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      request.itemId,
    ) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

function verifyWritingSources(snapshot: ProjectSpineSessionSnapshot, anchors: readonly NonNullable<CreateLivingOutlineItemRequest['sourceAnchor']>[], bodies: Readonly<Record<string, string>> = {}): LivingOutlineResult | null {
  const sources = new Map<string, { body: string; fingerprint: string }>();
  const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
  for (const anchor of anchors) {
    const raw = snapshot.project!.drafts?.[anchor.unitId];
    if (!unitExists(snapshot, anchor.unitId) || typeof raw !== 'string') return fail('UNKNOWN_MANUSCRIPT_UNIT', 'A writing source is no longer available.');
    let source = sources.get(anchor.unitId);
    if (!source) {
      const body = bodies[anchor.unitId] ?? extractProjectSpineDraftBody(raw);
      source = { body, fingerprint: sha(body) };
      sources.set(anchor.unitId, source);
    }
    if (anchor.selectionEnd > source.body.length || source.fingerprint !== anchor.sourceFingerprint || sha(source.body.slice(anchor.selectionStart, anchor.selectionEnd)) !== anchor.selectionFingerprint) {
      return fail('STALE_OUTLINE', 'Save the affected writing before saving these ranges. The saved source does not match.');
    }
  }
  return null;
}

async function prepareGap(event: IpcMainInvokeEvent, request: PrepareGapRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !validGapWritingOperation(request.pending, validSourceAnchor) ||
      request.pending.id !== request.operationId || typeof request.proposedProse !== 'string') return fail('INVALID_REQUEST', 'The gap operation is incomplete.');
  const op = request.pending;
  const raw = active.snapshot.project!.drafts?.[op.unitId];
  if (typeof raw !== 'string') return fail('UNKNOWN_MANUSCRIPT_UNIT', 'The gap writing section is unavailable.');
  const before = extractProjectSpineDraftBody(raw), after = request.proposedProse;
  const sha = (body: string) => createHash('sha256').update(body, 'utf8').digest('hex');
  const boundary = (at: number) => !(before.charCodeAt(at - 1) >= 0xd800 && before.charCodeAt(at - 1) <= 0xdbff && before.charCodeAt(at) >= 0xdc00 && before.charCodeAt(at) <= 0xdfff);
  if (sha(before) !== op.beforeFingerprint || sha(after) !== op.afterFingerprint || op.to > before.length ||
      after.length !== before.length - (op.to - op.from) + op.insertedLength ||
      before.slice(0, op.from) !== after.slice(0, op.from) || before.slice(op.to) !== after.slice(op.from + op.insertedLength) ||
      !boundary(op.from) || !boundary(op.to) || after.startsWith('\n') || (op.direction === 'fill' ? op.from !== op.to || op.insertedLength === 0 : op.insertedLength !== 0))
    return fail('STALE_OUTLINE', 'The saved gap source or proposed insertion changed. Nothing was applied.');
  const invalidSource = verifyWritingSources(active.snapshot, op.groups.flatMap(group => group.spans).concat(op.noteAnchors.flatMap(note => note.anchors ?? [note.anchor]), [op.target.anchor]), { [op.unitId]: after });
  if (invalidSource) return invalidSource;
  try { return { ok: true, data: await active.repository.prepareGap(request.projectId, request.expectedRevision, op) }; }
  catch (error) { return repositoryFailure(error); }
}

async function finishGap(event: IpcMainInvokeEvent, request: FinishGapRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision)) return fail('INVALID_REQUEST', 'The gap save is incomplete.');
  try {
    const stored = await active.repository.read(request.projectId);
    const op = stored.document.pendingGap;
    if (!op && stored.document.items.some(item => item.completedGapOperationId === request.operationId)) return { ok: true, data: stored };
    if (!op || op.id !== request.operationId) return fail('STALE_OUTLINE', 'The pending gap changed.');
    const current = activeProject(event, request);
    if (isFailure(current)) return current;
    const raw = current.snapshot.project!.drafts?.[op.unitId];
    if (typeof raw !== 'string' || createHash('sha256').update(extractProjectSpineDraftBody(raw), 'utf8').digest('hex') !== op.afterFingerprint)
      return fail('STALE_OUTLINE', 'The gap source is not the saved proposed writing. Recovery and the original gap are retained.');
    const invalidSource = verifyWritingSources(current.snapshot, op.groups.flatMap(group => group.spans).concat(op.noteAnchors.flatMap(note => note.anchors ?? [note.anchor]), [op.target.anchor]));
    if (invalidSource) return invalidSource;
    return { ok: true, data: await current.repository.finishGap(request.projectId, request.expectedRevision, request.operationId) };
  } catch (error) { return repositoryFailure(error); }
}

async function restoreItem(event: IpcMainInvokeEvent, request: RestoreLivingOutlineItemRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !request.item || !validItemId(request.item.id) ||
      !(request.beforeId === null || validItemId(request.beforeId))) return fail('INVALID_REQUEST', 'The deleted Note is incomplete.');
  try { return { ok: true, data: await active.repository.restore(request.projectId, request.expectedRevision, request.item, request.beforeId) }; }
  catch (error) { return repositoryFailure(error); }
}

async function replaceWritingState(event: IpcMainInvokeEvent, request: ReplaceWritingStateRequest): Promise<LivingOutlineResult> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !isWritingGroups(request.groups, validSourceAnchor) || !Array.isArray(request.noteAnchors) ||
      request.noteAnchors.some((item) => !item || !item.anchor || !validItemId(item.itemId) || !validSourceAnchor(item.anchor) || (item.anchors !== undefined && (!Array.isArray(item.anchors) || !item.anchors.length || item.anchors.some((anchor: ReplaceWritingStateRequest['noteAnchors'][number]['anchor']) => !anchor || !validSourceAnchor(anchor)) || !sameWritingAnchor(item.anchors[0], item.anchor))) || (item.reconnect !== undefined && typeof item.reconnect !== 'boolean'))) {
    return fail('INVALID_REQUEST', 'The writing ranges are invalid or overlap.');
  }
  const previous = await active.repository.read(request.projectId);
  if (previous.availability !== 'ready') return fail('LIVING_OUTLINE_UNAVAILABLE', previous.message ?? 'The linked writing record is unavailable.');
  const current = activeProject(event, request);
  if (isFailure(current)) return current;
  // Existing unresolved groups can be retained unchanged while an unrelated
  // Note is reconnected. New or changed source memberships still require proof.
  const changedGroups = request.groups.filter((group) => !previous.document.writingGroups?.some((old) => old.id === group.id && JSON.stringify(old.spans) === JSON.stringify(group.spans)));
  const anchors = changedGroups.flatMap((group) => group.spans).concat(request.noteAnchors.flatMap((item) => item.anchors ?? [item.anchor]));
  const sourceFailure = verifyWritingSources(current.snapshot, anchors);
  if (sourceFailure) return sourceFailure;
  try {
    return { ok: true, data: await active.repository.replaceWritingState(request.projectId, request.expectedRevision, request) };
  } catch (error) { return repositoryFailure(error); }
}

export function registerLivingOutlineIpc(nextOptions: RegisterLivingOutlineIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(LIVING_OUTLINE_CHANNELS)) ipcMain.removeHandler(channel);
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.prepareGap, (event, request: PrepareGapRequest) => prepareGap(event, request));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.finishGap, (event, request: FinishGapRequest) => finishGap(event, request));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.restoreItem, (event, request: RestoreLivingOutlineItemRequest) => restoreItem(event, request));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.replaceWritingState, (event, request: unknown) => replaceWritingState(event, request as ReplaceWritingStateRequest));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.get, (event, request: unknown) => get(event, request as GetLivingOutlineRequest));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.createItem, (event, request: unknown) => createItem(event, request as CreateLivingOutlineItemRequest));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.updateItem, (event, request: unknown) => updateItem(event, request as UpdateLivingOutlineItemRequest));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.moveItem, (event, request: unknown) => moveItem(event, request as MoveLivingOutlineItemRequest));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.linkItem, (event, request: unknown) => linkItem(event, request as LinkLivingOutlineItemRequest));
  ipcMain.handle(LIVING_OUTLINE_CHANNELS.deleteItem, (event, request: unknown) => deleteItem(event, request as DeleteLivingOutlineItemRequest));
}

export function resetLivingOutlineIpcForTests(): void {
  for (const channel of Object.values(LIVING_OUTLINE_CHANNELS)) ipcMain.removeHandler(channel);
  options = null;
}
