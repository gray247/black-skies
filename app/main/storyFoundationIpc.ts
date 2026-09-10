import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  STORY_FOUNDATION_CHANNELS,
  STORY_FOUNDATION_MAX_ANSWER_LENGTH,
  STORY_FOUNDATION_QUESTIONS,
  type ArchiveStoryFoundationAnswerRequest,
  type GetStoryFoundationRequest,
  type RestoreStoryFoundationAnswerRequest,
  type SetStoryFoundationAnswerRequest,
  type StoryFoundationError,
  type StoryFoundationPosture,
  type StoryFoundationProjectBinding,
  type StoryFoundationQuestionId,
  type StoryFoundationResult,
} from '../shared/ipc/storyFoundation.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { StoryFoundationRepository, StoryFoundationRepositoryError } from './storyFoundationRepository.js';

export interface RegisterStoryFoundationIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => StoryFoundationRepository;
}

let options: RegisterStoryFoundationIpcOptions | null = null;
const questionIds = new Set<string>(STORY_FOUNDATION_QUESTIONS.map((question) => question.id));

function hasExactKeys(value: unknown, keys: readonly string[]): boolean {
  if (!value || typeof value !== 'object') return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function fail(code: StoryFoundationError['code'], message: string): StoryFoundationResult {
  return { ok: false, error: { code, message } };
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function validBinding(request: StoryFoundationProjectBinding): boolean {
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
  request: StoryFoundationProjectBinding,
  mutation: boolean,
): { snapshot: ProjectSpineSessionSnapshot; repository: StoryFoundationRepository } | StoryFoundationResult {
  if (!options) return fail('NOT_AUTHORIZED', 'Story Foundation is not registered.');
  const role = options.resolveWindowRole(event.sender.id);
  if (role !== 'writing' && role !== 'command') {
    return fail('NOT_AUTHORIZED', 'Story Foundation is available only in Black Skies project surfaces.');
  }
  if (mutation && role !== 'writing') {
    return fail('NOT_AUTHORIZED', 'Story Foundation changes must originate in Writing Studio.');
  }
  if (!validBinding(request)) return fail('INVALID_REQUEST', 'The Story Foundation request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using Story Foundation.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) {
    return fail('STALE_SESSION', 'The active project changed before the Story Foundation request completed.');
  }
  return {
    snapshot,
    repository: (options.repositoryFactory ?? ((projectPath: string) => new StoryFoundationRepository(projectPath)))(
      snapshot.project.path,
    ),
  };
}

function isFailure(value: ReturnType<typeof activeProject>): value is StoryFoundationResult {
  return 'ok' in value;
}

function validRevision(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function validQuestionId(value: unknown): value is StoryFoundationQuestionId {
  return typeof value === 'string' && questionIds.has(value);
}

function validPosture(value: unknown): value is StoryFoundationPosture {
  return value === 'blank' || value === 'unknown' || value === 'undecided' || value === 'answered';
}

function validAnswer(posture: StoryFoundationPosture, text: unknown): text is string {
  if (typeof text !== 'string' || text.length > STORY_FOUNDATION_MAX_ANSWER_LENGTH) return false;
  if (posture === 'blank') return text.trim().length === 0;
  if (posture === 'answered') return text.trim().length > 0;
  return true;
}

function repositoryFailure(error: unknown): StoryFoundationResult {
  if (error instanceof StoryFoundationRepositoryError) {
    if (error.code === 'STALE') return fail('STALE_FOUNDATION', error.message);
    if (error.code === 'UNKNOWN_QUESTION') return fail('UNKNOWN_QUESTION', error.message);
    if (error.code === 'ARCHIVED') return fail('ANSWER_ARCHIVED', error.message);
    if (error.code === 'INVALID') return fail('INVALID_REQUEST', error.message);
    if (error.code === 'UNAVAILABLE') return fail('FOUNDATION_UNAVAILABLE', error.message);
    return fail('FOUNDATION_WRITE_FAILED', error.message);
  }
  return fail('FOUNDATION_WRITE_FAILED', 'The Story Foundation operation could not be completed.');
}

async function get(event: IpcMainInvokeEvent, request: GetStoryFoundationRequest): Promise<StoryFoundationResult> {
  if (!hasExactKeys(request, ['operationId', 'projectId', 'projectPath', 'generation'])) {
    return fail('INVALID_REQUEST', 'The Story Foundation request is incomplete.');
  }
  const active = activeProject(event, request, false);
  if (isFailure(active)) return active;
  try {
    return { ok: true, data: await active.repository.read(active.snapshot.project!.projectId) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function setAnswer(
  event: IpcMainInvokeEvent,
  request: SetStoryFoundationAnswerRequest,
): Promise<StoryFoundationResult> {
  if (!hasExactKeys(request, [
    'operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'questionId', 'posture', 'text',
  ])) return fail('INVALID_REQUEST', 'The Story Foundation answer is invalid or incomplete.');
  const active = activeProject(event, request, true);
  if (isFailure(active)) return active;
  if (
    !validRevision(request.expectedRevision) ||
    !validQuestionId(request.questionId) ||
    !validPosture(request.posture) ||
    !validAnswer(request.posture, request.text)
  ) return fail('INVALID_REQUEST', 'The Story Foundation answer is invalid or incomplete.');
  try {
    return { ok: true, data: await active.repository.setAnswer(
      active.snapshot.project!.projectId,
      request.expectedRevision,
      { questionId: request.questionId, posture: request.posture, text: request.text },
    ) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function changeArchive(
  event: IpcMainInvokeEvent,
  request: ArchiveStoryFoundationAnswerRequest | RestoreStoryFoundationAnswerRequest,
  restore: boolean,
): Promise<StoryFoundationResult> {
  if (!hasExactKeys(request, [
    'operationId', 'projectId', 'projectPath', 'generation', 'expectedRevision', 'questionId',
  ])) return fail('INVALID_REQUEST', 'The Story Foundation archive request is incomplete.');
  const active = activeProject(event, request, true);
  if (isFailure(active)) return active;
  if (!validRevision(request.expectedRevision) || !validQuestionId(request.questionId)) {
    return fail('INVALID_REQUEST', 'The Story Foundation archive request is incomplete.');
  }
  try {
    const data = restore
      ? await active.repository.restoreAnswer(active.snapshot.project!.projectId, request.expectedRevision, request.questionId)
      : await active.repository.archiveAnswer(active.snapshot.project!.projectId, request.expectedRevision, request.questionId);
    return { ok: true, data };
  } catch (error) {
    return repositoryFailure(error);
  }
}

export function registerStoryFoundationIpc(nextOptions: RegisterStoryFoundationIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(STORY_FOUNDATION_CHANNELS)) ipcMain.removeHandler(channel);
  ipcMain.handle(STORY_FOUNDATION_CHANNELS.get, (event, request: unknown) => get(event, request as GetStoryFoundationRequest));
  ipcMain.handle(STORY_FOUNDATION_CHANNELS.setAnswer, (event, request: unknown) => setAnswer(event, request as SetStoryFoundationAnswerRequest));
  ipcMain.handle(STORY_FOUNDATION_CHANNELS.archiveAnswer, (event, request: unknown) => changeArchive(event, request as ArchiveStoryFoundationAnswerRequest, false));
  ipcMain.handle(STORY_FOUNDATION_CHANNELS.restoreAnswer, (event, request: unknown) => changeArchive(event, request as RestoreStoryFoundationAnswerRequest, true));
}

export function resetStoryFoundationIpcForTests(): void {
  for (const channel of Object.values(STORY_FOUNDATION_CHANNELS)) ipcMain.removeHandler(channel);
  options = null;
}
