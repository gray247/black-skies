import { createHash } from 'node:crypto';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  FEEDBACK_NOTE_CHANNELS,
  FEEDBACK_NOTE_MAX_BODY_LENGTH,
  type CreateRevisionItemInput,
  type CreateFeedbackNoteFromCritiqueRequest,
  type CreateRevisionItemRequest,
  type CreateRevisionRecurrenceRequest,
  type FeedbackNoteError,
  type FeedbackNoteFailure,
  type FeedbackNoteMutationResult,
  type FeedbackNoteResult,
  type FeedbackNotesDocument,
  type FeedbackNotesListResult,
  type FeedbackRevisionLifecycle,
  type ListRevisionItemsRequest,
  type ListFeedbackNotesRequest,
  type RevisionItem,
  type RevisionItemMutationRequest,
  type RevisionItemRecheckRequest,
  type RevisionItemResult,
  type RevisionItemsListResult,
  type SetRevisionLifecycleRequest,
} from '../shared/ipc/feedbackNotes.js';
import {
  PROGRAM7_SOURCE_BINDING_SCHEMA_VERSION,
  resolveProgram7SourceBinding,
  type Program7SourceBindingResolutionV1,
  type Program7SourceEnvelopeV1,
} from '../shared/program7SourceBinding.js';
import { SOURCE_CLASSES_V1, isStoryPositionRefV1 } from '../shared/storyIntelligencePolicy.js';
import {
  PROGRAM7_LOCAL_INFERENCE_BOUNDS,
  PROGRAM7_LOCAL_INFERENCE_MODEL,
  PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
} from '../shared/localInference.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { completedAiCritiqueForSender } from './aiCritiqueIpc.js';
import {
  FeedbackNotesRepository,
  FeedbackNotesRepositoryError,
} from './feedbackNotesRepository.js';
import type { Program7LocalInferenceService } from './program7LocalInferenceService.js';

export interface RegisterFeedbackNotesIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => FeedbackNotesRepository;
  readonly localInferenceService?: Program7LocalInferenceService;
}

let options: RegisterFeedbackNotesIpcOptions | null = null;

function fail(code: FeedbackNoteError['code'], message: string): FeedbackNoteFailure {
  return { ok: false, error: { code, message } };
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

const REVISION_ITEM_ACTIVE_LIFECYCLES = new Set<FeedbackRevisionLifecycle>([
  'active',
  'review',
  'intended',
  'underway',
  'ready_for_recheck',
  'stale',
  'recheck_pending',
]);

const AUTHOR_LIFECYCLE_ACTIONS = new Set<FeedbackRevisionLifecycle>([
  'review',
  'intended',
  'underway',
  'ready_for_recheck',
  'parked',
  'dismissed',
  'resolved',
  'abandoned',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function isAnchor(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;
  return value.schemaVersion === 1 &&
    (value.anchorKind === 'position' || value.anchorKind === 'span') &&
    Number.isInteger(value.selectionStart) && Number(value.selectionStart) >= 0 &&
    Number.isInteger(value.selectionEnd) && Number(value.selectionEnd) >= Number(value.selectionStart) &&
    typeof value.selectionSearchFingerprint === 'string' && /^[a-f0-9]{8}$/u.test(value.selectionSearchFingerprint) &&
    isSha256(value.sourceFingerprint) && isSha256(value.selectionFingerprint) &&
    Number.isInteger(value.prefixLength) && Number(value.prefixLength) >= 0 && Number(value.prefixLength) <= 32 &&
    Number.isInteger(value.suffixLength) && Number(value.suffixLength) >= 0 && Number(value.suffixLength) <= 32 &&
    typeof value.prefixSearchFingerprint === 'string' && /^[a-f0-9]{8}$/u.test(value.prefixSearchFingerprint) &&
    isSha256(value.prefixFingerprint) &&
    typeof value.suffixSearchFingerprint === 'string' && /^[a-f0-9]{8}$/u.test(value.suffixSearchFingerprint) &&
    isSha256(value.suffixFingerprint);
}

function validSourceEnvelope(
  value: unknown,
  projectId: string,
  generation: number,
  unitId: string,
): value is Program7SourceEnvelopeV1 {
  if (!isRecord(value)) return false;
  const source = value as Partial<Program7SourceEnvelopeV1>;
  return source.schemaVersion === PROGRAM7_SOURCE_BINDING_SCHEMA_VERSION &&
    source.projectId === projectId && source.generation === generation && source.unitId === unitId &&
    isRecord(source.protection) && typeof source.protection.sourceClass === 'string' &&
    SOURCE_CLASSES_V1.includes(source.protection.sourceClass as (typeof SOURCE_CLASSES_V1)[number]) &&
    typeof source.protection.metadataOnly === 'boolean' &&
    isStoryPositionRefV1(source.sourceRef, projectId) &&
    (source.sourceRef.unitId === undefined || source.sourceRef.unitId === unitId) &&
    (source.bodySha256 === undefined || isSha256(source.bodySha256)) &&
    isAnchor(source.anchor) &&
    (source.selectionStart === undefined || Number.isInteger(source.selectionStart)) &&
    (source.selectionEnd === undefined || Number.isInteger(source.selectionEnd)) &&
    (source.text === undefined || (typeof source.text === 'string' && source.text.length <= 50_000)) &&
    (!source.protection.metadataOnly || source.text === undefined);
}

function validProjectBinding(value: unknown): value is {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
} {
  if (!isRecord(value)) return false;
  return typeof value.operationId === 'string' && value.operationId.trim().length > 0 &&
    typeof value.projectId === 'string' && value.projectId.trim().length > 0 &&
    typeof value.projectPath === 'string' && value.projectPath.trim().length > 0 &&
    Number.isInteger(value.generation) && Number(value.generation) >= 0;
}

function validExpectedRevision(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function activeRevisionProject(
  event: IpcMainInvokeEvent,
  request: unknown,
): { readonly snapshot: ProjectSpineSessionSnapshot; readonly repository: FeedbackNotesRepository } | FeedbackNoteFailure {
  const role = options?.resolveWindowRole(event.sender.id);
  if (!options || (role !== 'writing' && role !== 'command')) {
    return fail('NOT_WRITING_STUDIO', 'Revision items are available only in the Stage 19 project surfaces.');
  }
  if (!validProjectBinding(request)) {
    return fail('INVALID_REQUEST', 'The revision-item request is incomplete.');
  }
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using revision items.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) {
    return fail('STALE_SESSION', 'The active project changed before the revision-item action completed.');
  }
  return {
    snapshot,
    repository: (options.repositoryFactory ?? ((projectPath: string) => new FeedbackNotesRepository(projectPath)))(
      snapshot.project.path,
    ),
  };
}

function repositoryFailure(error: unknown): FeedbackNoteFailure {
  if (error instanceof FeedbackNotesRepositoryError) {
    switch (error.code) {
      case 'STALE': return fail('STALE_REVISION', error.message);
      case 'UNKNOWN_ITEM': return fail('REVISION_ITEM_NOT_FOUND', error.message);
      case 'INVALID': return fail('INVALID_REQUEST', error.message);
      case 'UNAVAILABLE': return fail('FEEDBACK_NOTES_UNAVAILABLE', error.message);
      case 'WRITE_FAILED': return fail('FEEDBACK_NOTE_WRITE_FAILED', error.message);
    }
  }
  return fail('FEEDBACK_NOTE_WRITE_FAILED', 'The revision-item operation could not be completed.');
}

function normalizeSource(value: string): string {
  return value.replace(/\r\n?/gu, '\n');
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function sourceTextFor(
  snapshot: ProjectSpineSessionSnapshot,
  unitId: string,
): string | undefined {
  const text = snapshot.project?.drafts?.[unitId];
  return typeof text === 'string' ? normalizeSource(text) : undefined;
}

async function resolveCurrentSource(
  snapshot: ProjectSpineSessionSnapshot,
  source: Program7SourceEnvelopeV1,
): Promise<Program7SourceBindingResolutionV1> {
  return resolveProgram7SourceBinding(source, sourceTextFor(snapshot, source.unitId));
}

function sourceReadyForRevision(
  resolution: Program7SourceBindingResolutionV1,
): boolean {
  return resolution.status === 'current' || resolution.status === 'exact' ||
    resolution.status === 'relocated' || resolution.status === 'protected';
}

function sourceFailure(
  resolution: Program7SourceBindingResolutionV1,
): FeedbackNoteFailure {
  return fail(
    resolution.status === 'protected' ? 'INVALID_REQUEST' : 'SOURCE_STALE',
    resolution.status === 'protected'
      ? 'Protected source metadata can be reviewed, but it cannot be used for this action.'
      : resolution.message,
  );
}

function sourceEnvelopeForItem(item: RevisionItem): Program7SourceEnvelopeV1 | null {
  const sourceClass = item.sourceClass ?? (item.protection?.protected ? 'protected' : 'included');
  if (!SOURCE_CLASSES_V1.includes(sourceClass as (typeof SOURCE_CLASSES_V1)[number])) return null;
  const sourceFingerprint = item.anchor?.sourceFingerprint ?? item.sourceBodyFingerprint;
  if (!sourceFingerprint) return null;
  const sourceRef = {
    projectId: item.projectId,
    sourceKind: (item.sourceKind ?? 'manuscript') as Program7SourceEnvelopeV1['sourceRef']['sourceKind'],
    sourceId: item.sourceId ?? item.unitId,
    sourceRevision: item.sourceRevision ?? item.sourceGeneration ?? 0,
    sourceFingerprint,
    unitId: item.unitId,
    ...(item.sourceBodyFingerprint ? { bodySha256: item.sourceBodyFingerprint } : {}),
    ...(item.anchor ? {
      selectionFingerprint: item.anchor.selectionFingerprint,
      selectionStart: item.anchor.selectionStart,
      selectionEnd: item.anchor.selectionEnd,
    } : {}),
  };
  return {
    schemaVersion: PROGRAM7_SOURCE_BINDING_SCHEMA_VERSION,
    projectId: item.projectId,
    generation: item.sourceGeneration ?? 0,
    sourceRef,
    unitId: item.unitId,
    ...(item.sourceBodyFingerprint ? { bodySha256: item.sourceBodyFingerprint } : {}),
    protection: { sourceClass: sourceClass as Program7SourceEnvelopeV1['protection']['sourceClass'], metadataOnly: item.protection?.protected === true },
    ...(item.anchor ? { anchor: item.anchor, selectionStart: item.anchor.selectionStart, selectionEnd: item.anchor.selectionEnd } : {}),
  };
}

function revisionInput(
  request: CreateRevisionItemRequest | CreateRevisionRecurrenceRequest,
  snapshot: ProjectSpineSessionSnapshot,
  provenanceSource: 'program6_finding' | 'recurrence',
): CreateRevisionItemInput {
  const source = request.source;
  const sourceBodyFingerprint = source.bodySha256 ?? source.anchor?.sourceFingerprint ?? source.sourceRef.bodySha256;
  return {
    projectId: source.projectId,
    unitId: source.unitId,
    body: request.body.trim(),
    ...(source.findingId ? { sourceFindingId: source.findingId } : {}),
    ...(source.lens ? { lens: source.lens } : {}),
    ...(source.evidenceSummary ? { evidence: source.evidenceSummary } : {}),
    provenance: {
      source: provenanceSource,
      ...(source.findingId ? { findingId: source.findingId } : {}),
      ...(source.lens ? { lens: source.lens } : {}),
      ...(source.evidenceSummary ? { evidence: source.evidenceSummary } : {}),
      origin: source.protection.sourceClass === 'local-only' ? 'local-inference' : 'program6',
    },
    protection: {
      protected: source.protection.metadataOnly,
      ...(source.protection.metadataOnly ? { reason: `source-class:${source.protection.sourceClass}` } : {}),
    },
    ...(source.anchor ? { anchor: source.anchor } : {}),
    ...(sourceBodyFingerprint ? { sourceBodyFingerprint } : {}),
    sourceRevision: source.sourceRef.sourceRevision,
    sourceKind: source.sourceRef.sourceKind,
    sourceId: source.sourceRef.sourceId,
    sourceClass: source.protection.sourceClass,
    sourceGeneration: snapshot.generation,
    sessionId: request.operationId,
    documentRevision: snapshot.revision,
    sessionBinding: `${source.projectId}:${snapshot.generation}:${source.unitId}`,
  };
}

function revisionMutationSuccess(
  result: FeedbackNoteMutationResult,
): RevisionItemResult {
  if (!result.note || result.note.advisory) {
    return fail('FEEDBACK_NOTE_WRITE_FAILED', 'The revision-item owner returned no mutation result.');
  }
  return { ok: true, data: result.note, revision: result.document.revision };
}

function validRequest(request: CreateFeedbackNoteFromCritiqueRequest): boolean {
  return Boolean(
    request &&
    typeof request.operationId === 'string' && request.operationId.trim() &&
    typeof request.projectId === 'string' && request.projectId.trim() &&
    typeof request.projectPath === 'string' && request.projectPath.trim() &&
    Number.isInteger(request.generation) && request.generation >= 0 &&
    typeof request.unitId === 'string' && request.unitId.trim() &&
    typeof request.sourceCritiqueRequestId === 'string' && request.sourceCritiqueRequestId.trim() &&
    typeof request.selectionFingerprint === 'string' && request.selectionFingerprint.trim() &&
    typeof request.body === 'string' && request.body.trim() &&
    request.body.length <= FEEDBACK_NOTE_MAX_BODY_LENGTH,
  );
}

function createFromCritique(
  event: IpcMainInvokeEvent,
  request: CreateFeedbackNoteFromCritiqueRequest,
): Promise<FeedbackNoteResult> {
  if (!options || options.resolveWindowRole(event.sender.id) !== 'writing') {
    return Promise.resolve(fail('NOT_WRITING_STUDIO', 'Feedback notes are available only in Writing Studio.'));
  }
  if (!validRequest(request)) {
    return Promise.resolve(fail('INVALID_REQUEST', 'The feedback note request is incomplete.'));
  }
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project || !snapshot.activeUnitId) {
    return Promise.resolve(fail('NO_ACTIVE_PROJECT', 'Open a manuscript unit before saving a feedback note.'));
  }
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation ||
    snapshot.activeUnitId !== request.unitId
  ) {
    return Promise.resolve(fail('STALE_SESSION', 'The project or manuscript unit changed before the note was saved.'));
  }
  const source = completedAiCritiqueForSender(event.sender.id, request.sourceCritiqueRequestId);
  if (!source || source.selectionFingerprint !== request.selectionFingerprint) {
    return Promise.resolve(fail('CRITIQUE_UNAVAILABLE', 'The completed critique is no longer available for this selection.'));
  }
  const repository = (options.repositoryFactory ?? ((projectPath: string) => new FeedbackNotesRepository(projectPath)))(
    snapshot.project.path,
  );
  return repository.create({
    projectId: snapshot.project.projectId,
    unitId: snapshot.activeUnitId,
    sourceCritiqueRequestId: source.requestId,
    selectionFingerprint: source.selectionFingerprint,
    body: request.body.trim(),
  }).then((note) => ({ ok: true, data: note } as const)).catch((error: unknown) => {
    if (error instanceof FeedbackNotesRepositoryError) {
      return fail(
        error.code === 'WRITE_FAILED' ? 'FEEDBACK_NOTE_WRITE_FAILED' : 'FEEDBACK_NOTES_UNAVAILABLE',
        error.message,
      );
    }
    return fail('FEEDBACK_NOTE_WRITE_FAILED', 'The feedback note could not be saved.');
  });
}

function list(
  event: IpcMainInvokeEvent,
  request: ListFeedbackNotesRequest,
): Promise<FeedbackNotesListResult> {
  if (!options || options.resolveWindowRole(event.sender.id) !== 'writing') {
    return Promise.resolve(fail('NOT_WRITING_STUDIO', 'Feedback notes are available only in Writing Studio.'));
  }
  if (!request || typeof request.operationId !== 'string' || !request.operationId.trim() ||
    typeof request.projectId !== 'string' || !request.projectId.trim() ||
    typeof request.projectPath !== 'string' || !request.projectPath.trim() ||
    !Number.isInteger(request.generation) || request.generation < 0) {
    return Promise.resolve(fail('INVALID_REQUEST', 'The feedback-note list request is incomplete.'));
  }
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return Promise.resolve(fail('NO_ACTIVE_PROJECT', 'Open a project before viewing feedback notes.'));
  if (snapshot.project.projectId !== request.projectId || !samePath(snapshot.project.path, request.projectPath) || snapshot.generation !== request.generation) {
    return Promise.resolve(fail('STALE_SESSION', 'The project changed before feedback notes were loaded.'));
  }
  const repository = (options.repositoryFactory ?? ((projectPath: string) => new FeedbackNotesRepository(projectPath)))(snapshot.project.path);
  return repository.list(snapshot.project.projectId)
    .then((notes) => ({ ok: true, data: notes } as const))
    .catch((error: unknown) => {
      if (error instanceof FeedbackNotesRepositoryError) return fail('FEEDBACK_NOTES_UNAVAILABLE', error.message);
      return fail('FEEDBACK_NOTES_UNAVAILABLE', 'Saved feedback notes could not be loaded.');
    });
}

async function createRevisionItem(
  event: IpcMainInvokeEvent,
  request: CreateRevisionItemRequest,
): Promise<RevisionItemResult> {
  const active = activeRevisionProject(event, request);
  if ('ok' in active) return active;
  if (!validExpectedRevision(request.expectedRevision) ||
    typeof request.body !== 'string' || !request.body.trim() ||
    request.body.length > FEEDBACK_NOTE_MAX_BODY_LENGTH ||
    !validSourceEnvelope(request.source, request.projectId, request.generation, request.source?.unitId ?? '')) {
    return fail('INVALID_REQUEST', 'The revision-item request has invalid author or source data.');
  }
  const source = request.source;
  const resolution = await resolveCurrentSource(active.snapshot, source);
  if (!sourceReadyForRevision(resolution)) return sourceFailure(resolution);
  try {
    const result = await active.repository.createRevisionItem(
      revisionInput(request, active.snapshot, 'program6_finding'),
      request.expectedRevision,
    );
    return revisionMutationSuccess(result);
  } catch (error) {
    return repositoryFailure(error);
  }
}

function revisionListForScope(
  document: FeedbackNotesDocument,
  scope: ListRevisionItemsRequest['scope'],
): readonly RevisionItem[] {
  const revisions = document.notes.filter((note): note is RevisionItem => note.advisory === false);
  if (scope === 'all') return revisions;
  if (scope === 'active') return revisions.filter((item) => REVISION_ITEM_ACTIVE_LIFECYCLES.has(item.lifecycle));
  return revisions.filter((item) => !REVISION_ITEM_ACTIVE_LIFECYCLES.has(item.lifecycle));
}

async function listRevisionItems(
  event: IpcMainInvokeEvent,
  request: ListRevisionItemsRequest,
): Promise<RevisionItemsListResult> {
  const active = activeRevisionProject(event, request);
  if ('ok' in active) return active;
  if (!['active', 'history', 'all'].includes(request.scope)) {
    return fail('INVALID_REQUEST', 'The revision-item list scope is invalid.');
  }
  try {
    const document = await active.repository.read(active.snapshot.project!.projectId);
    return { ok: true, data: revisionListForScope(document, request.scope), revision: document.revision };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function readRevisionItem(
  repository: FeedbackNotesRepository,
  projectId: string,
  itemId: string,
): Promise<{ readonly document: FeedbackNotesDocument; readonly item: RevisionItem } | FeedbackNoteFailure> {
  const document = await repository.read(projectId);
  const item = document.notes.find((note): note is RevisionItem => note.advisory === false && note.id === itemId);
  return item ? { document, item } : fail('REVISION_ITEM_NOT_FOUND', 'The revision item does not exist.');
}

function validMutationRequest(value: unknown): value is RevisionItemMutationRequest {
  return validProjectBinding(value) && validExpectedRevision((value as RevisionItemMutationRequest).expectedRevision) &&
    typeof (value as RevisionItemMutationRequest).itemId === 'string' &&
    (value as RevisionItemMutationRequest).itemId.trim().length > 0;
}

async function setLifecycle(
  event: IpcMainInvokeEvent,
  request: SetRevisionLifecycleRequest,
): Promise<RevisionItemResult> {
  const active = activeRevisionProject(event, request);
  if ('ok' in active) return active;
  if (!validMutationRequest(request) || !AUTHOR_LIFECYCLE_ACTIONS.has(request.lifecycle)) {
    return fail('INVALID_REQUEST', 'The author lifecycle action is invalid.');
  }
  try {
    const current = await readRevisionItem(active.repository, active.snapshot.project!.projectId, request.itemId);
    if ('ok' in current) return current;
    const source = sourceEnvelopeForItem(current.item);
    if (!source) return fail('SOURCE_STALE', 'This revision item has no safely re-checkable source binding.');
    const resolution = await resolveCurrentSource(active.snapshot, source);
    if (!sourceReadyForRevision(resolution)) return sourceFailure(resolution);
    const result = await active.repository.setLifecycle(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      current.item.id,
      request.lifecycle,
      request.reason?.trim() || undefined,
    );
    return revisionMutationSuccess(result);
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function recordDeterministicRecheck(
  event: IpcMainInvokeEvent,
  request: RevisionItemRecheckRequest,
): Promise<RevisionItemResult> {
  const active = activeRevisionProject(event, request);
  if ('ok' in active) return active;
  if (!validMutationRequest(request)) return fail('INVALID_REQUEST', 'The deterministic recheck request is invalid.');
  try {
    const current = await readRevisionItem(active.repository, active.snapshot.project!.projectId, request.itemId);
    if ('ok' in current) return current;
    const source = sourceEnvelopeForItem(current.item);
    if (!source) return fail('SOURCE_STALE', 'This revision item has no safely re-checkable source binding.');
    const resolution = await resolveCurrentSource(active.snapshot, source);
    const status = sourceReadyForRevision(resolution) ? 'not_run' : 'unavailable';
    const evidence = sourceReadyForRevision(resolution)
      ? `Deterministic source check: ${resolution.message} No semantic resolution judgment was made.`
      : `Deterministic source check unavailable: ${resolution.message}`;
    const result = await active.repository.recordRecheck(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      current.item.id,
      status,
      evidence,
      { method: 'deterministic', sourceStatus: resolution.status },
    );
    return revisionMutationSuccess(result);
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function runLocalRecheck(
  event: IpcMainInvokeEvent,
  request: RevisionItemRecheckRequest,
): Promise<RevisionItemResult> {
  const active = activeRevisionProject(event, request);
  if ('ok' in active) return active;
  if (!validMutationRequest(request)) return fail('INVALID_REQUEST', 'The local recheck request is invalid.');
  if (!options?.localInferenceService) return fail('LOCAL_INFERENCE_UNAVAILABLE', 'Local recheck is not configured.');
  try {
    const current = await readRevisionItem(active.repository, active.snapshot.project!.projectId, request.itemId);
    if ('ok' in current) return current;
    const source = sourceEnvelopeForItem(current.item);
    if (!source) return fail('SOURCE_STALE', 'This revision item has no safely re-checkable source binding.');
    const resolution = await resolveCurrentSource(active.snapshot, source);
    if (resolution.status === 'protected') return sourceFailure(resolution);
    if (!sourceReadyForRevision(resolution) ||
      (source.anchor && (resolution.selectionStart === undefined || resolution.selectionEnd === undefined))) {
      return sourceFailure(resolution);
    }
    const sourceText = sourceTextFor(active.snapshot, source.unitId);
    if (!sourceText) return fail('SOURCE_STALE', 'The source unit is unavailable for local recheck.');
    const selected = source.anchor && resolution.selectionStart !== undefined && resolution.selectionEnd !== undefined
      ? sourceText.slice(resolution.selectionStart, resolution.selectionEnd)
      : sourceText;
    const inputLimit = PROGRAM7_LOCAL_INFERENCE_BOUNDS.revision_recheck.inputChars;
    if (!selected || selected.length > inputLimit) {
      return fail('LOCAL_INFERENCE_UNAVAILABLE', 'The source passage is too large for the bounded local recheck.');
    }
    const response = await options.localInferenceService.run({
      schema: PROGRAM7_LOCAL_INFERENCE_REQUEST_SCHEMA,
      operation: 'revision_recheck',
      model: PROGRAM7_LOCAL_INFERENCE_MODEL,
      requestId: `${request.operationId}:${request.itemId}:${request.expectedRevision}`,
      projectId: active.snapshot.project!.projectId,
      source: { unitId: source.unitId, bodySha256: sha256(selected), text: selected },
      purpose: request.purpose?.trim() || current.item.body,
      limits: PROGRAM7_LOCAL_INFERENCE_BOUNDS.revision_recheck,
      protection: { excluded: false, class: 'ordinary' },
    }, { authorInvoked: true });
    if (response.status !== 'appears_resolved' && response.status !== 'still_appears_present') {
      return fail('LOCAL_INFERENCE_UNAVAILABLE', response.reason || 'Local recheck did not return an allowed advisory assessment.');
    }
    const result = await active.repository.recordRecheck(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      current.item.id,
      response.status,
      response.reason?.trim().slice(0, 240) || undefined,
      { method: 'local-ai', sourceStatus: resolution.status },
    );
    return revisionMutationSuccess(result);
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function createRecurrence(
  event: IpcMainInvokeEvent,
  request: CreateRevisionRecurrenceRequest,
): Promise<RevisionItemResult> {
  const active = activeRevisionProject(event, request);
  if ('ok' in active) return active;
  if (!validMutationRequest(request) || typeof request.body !== 'string' || !request.body.trim() ||
    request.body.length > FEEDBACK_NOTE_MAX_BODY_LENGTH ||
    !validSourceEnvelope(request.source, request.projectId, request.generation, request.source.unitId)) {
    return fail('INVALID_REQUEST', 'The recurrence request has invalid author or source data.');
  }
  const resolution = await resolveCurrentSource(active.snapshot, request.source);
  if (!sourceReadyForRevision(resolution)) return sourceFailure(resolution);
  try {
    const result = await active.repository.createRecurrence(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      request.itemId,
      revisionInput(request, active.snapshot, 'recurrence'),
    );
    return revisionMutationSuccess(result);
  } catch (error) {
    return repositoryFailure(error);
  }
}

export function registerFeedbackNotesIpc(nextOptions: RegisterFeedbackNotesIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(FEEDBACK_NOTE_CHANNELS)) ipcMain.removeHandler(channel);
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.createFromCritique, (event, request: unknown) =>
    createFromCritique(event, request as CreateFeedbackNoteFromCritiqueRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.list, (event, request: unknown) =>
    list(event, request as ListFeedbackNotesRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.createRevisionItem, (event, request: unknown) =>
    createRevisionItem(event, request as CreateRevisionItemRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.listRevisionItems, (event, request: unknown) =>
    listRevisionItems(event, request as ListRevisionItemsRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.setLifecycle, (event, request: unknown) =>
    setLifecycle(event, request as SetRevisionLifecycleRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.deterministicRecheck, (event, request: unknown) =>
    recordDeterministicRecheck(event, request as RevisionItemRecheckRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.localRecheck, (event, request: unknown) =>
    runLocalRecheck(event, request as RevisionItemRecheckRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.createRecurrence, (event, request: unknown) =>
    createRecurrence(event, request as CreateRevisionRecurrenceRequest),
  );
}

export function resetFeedbackNotesIpcForTests(): void {
  for (const channel of Object.values(FEEDBACK_NOTE_CHANNELS)) ipcMain.removeHandler(channel);
  options = null;
}
