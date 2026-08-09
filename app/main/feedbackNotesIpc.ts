import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  FEEDBACK_NOTE_CHANNELS,
  FEEDBACK_NOTE_MAX_BODY_LENGTH,
  type CreateFeedbackNoteFromCritiqueRequest,
  type FeedbackNoteError,
  type FeedbackNoteFailure,
  type FeedbackNoteResult,
  type FeedbackNotesListResult,
  type ListFeedbackNotesRequest,
} from '../shared/ipc/feedbackNotes.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { completedAiCritiqueForSender } from './aiCritiqueIpc.js';
import { FeedbackNotesRepository, FeedbackNotesRepositoryError } from './feedbackNotesRepository.js';

export interface RegisterFeedbackNotesIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => FeedbackNotesRepository;
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

export function registerFeedbackNotesIpc(nextOptions: RegisterFeedbackNotesIpcOptions): void {
  options = nextOptions;
  ipcMain.removeHandler(FEEDBACK_NOTE_CHANNELS.createFromCritique);
  ipcMain.removeHandler(FEEDBACK_NOTE_CHANNELS.list);
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.createFromCritique, (event, request: unknown) =>
    createFromCritique(event, request as CreateFeedbackNoteFromCritiqueRequest),
  );
  ipcMain.handle(FEEDBACK_NOTE_CHANNELS.list, (event, request: unknown) =>
    list(event, request as ListFeedbackNotesRequest),
  );
}

export function resetFeedbackNotesIpcForTests(): void {
  ipcMain.removeHandler(FEEDBACK_NOTE_CHANNELS.createFromCritique);
  ipcMain.removeHandler(FEEDBACK_NOTE_CHANNELS.list);
  options = null;
}
