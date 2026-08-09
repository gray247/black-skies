import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  LIVING_OUTLINE_CHANNELS,
  LIVING_OUTLINE_MAX_LABEL_LENGTH,
  type CreateLivingOutlineItemRequest,
  type DeleteLivingOutlineItemRequest,
  type GetLivingOutlineRequest,
  type LinkLivingOutlineItemRequest,
  type LivingOutlineError,
  type LivingOutlineProjectBinding,
  type LivingOutlineResult,
  type MoveLivingOutlineItemRequest,
  type UpdateLivingOutlineItemRequest,
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
    return fail('NOT_WRITING_STUDIO', 'The Living Outline is available only in Writing Studio.');
  }
  if (!validBinding(request)) return fail('INVALID_REQUEST', 'The Living Outline request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using the Living Outline.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) {
    return fail('STALE_SESSION', 'The active project changed before the Living Outline request completed.');
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
  return fail('LIVING_OUTLINE_WRITE_FAILED', 'The Living Outline operation could not be completed.');
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
    !validKind(request.kind) || !validState(request.state) || !validUnitReference(request.manuscriptUnitId)
  ) return fail('INVALID_REQUEST', 'The new outline item is incomplete.');
  if (!unitExists(active.snapshot, request.manuscriptUnitId)) {
    return fail('UNKNOWN_MANUSCRIPT_UNIT', 'The linked manuscript unit no longer exists.');
  }
  try {
    return { ok: true, data: await active.repository.create(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      {
        label: request.label,
        kind: request.kind,
        state: request.state,
        manuscriptUnitId: request.manuscriptUnitId,
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
    !validLabel(request.label) || !validKind(request.kind) || !validState(request.state)
  ) return fail('INVALID_REQUEST', 'The outline item update is incomplete.');
  try {
    return { ok: true, data: await active.repository.update(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      request.itemId,
      { label: request.label, kind: request.kind, state: request.state },
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

export function registerLivingOutlineIpc(nextOptions: RegisterLivingOutlineIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(LIVING_OUTLINE_CHANNELS)) ipcMain.removeHandler(channel);
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
