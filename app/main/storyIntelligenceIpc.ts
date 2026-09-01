import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import path from 'node:path';

import {
  STORY_INTELLIGENCE_CHANNELS,
  type CheckStoryIntelligencePermissionRequestV1,
  type GetStoryIntelligenceRequestV1,
  type StoryIntelligenceErrorCodeV1,
  type StoryIntelligenceFailureV1,
  type StoryIntelligencePermissionResultEnvelopeV1,
  type StoryIntelligenceProjectBindingV1,
  type StoryIntelligenceReadResultV1,
  type WriteStoryIntelligenceRequestV1,
  type StoryIntelligenceWriteResultV1,
} from '../shared/ipc/storyIntelligence.js';
import {
  PERMISSION_OPERATIONS_V1,
  SOURCE_CLASSES_V1,
  checkStoryIntelligencePermission,
  validateStoryIntelligenceDocument,
  StoryIntelligenceValidationError,
} from '../shared/storyIntelligencePolicy.js';
import type { ProjectSpineSessionSnapshot, ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import { StoryIntelligenceRepository, StoryIntelligenceRepositoryError } from './storyIntelligenceRepository.js';

export interface RegisterStoryIntelligenceIpcOptions {
  readonly resolveWindowRole: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly getWritingSnapshot: () => ProjectSpineSessionSnapshot;
  readonly repositoryFactory?: (projectPath: string) => StoryIntelligenceRepository;
}

let options: RegisterStoryIntelligenceIpcOptions | null = null;

function fail(code: StoryIntelligenceErrorCodeV1, message: string): StoryIntelligenceFailureV1 {
  return { ok: false, error: { code, message } };
}

function samePath(left: string, right: string): boolean {
  const normalize = (value: string) => {
    const resolved = path.resolve(value);
    return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
  };
  return normalize(left) === normalize(right);
}

function validBinding(request: StoryIntelligenceProjectBindingV1): boolean {
  return Boolean(request) &&
    typeof request.operationId === 'string' && request.operationId.trim().length > 0 &&
    typeof request.projectId === 'string' && request.projectId.trim().length > 0 &&
    typeof request.projectPath === 'string' && request.projectPath.trim().length > 0 &&
    Number.isInteger(request.generation) && request.generation >= 0;
}

function validPermissionRequest(request: CheckStoryIntelligencePermissionRequestV1): boolean {
  return validBinding(request) &&
    SOURCE_CLASSES_V1.includes(request.sourceClass) &&
    PERMISSION_OPERATIONS_V1.includes(request.operation);
}

function activeProject(
  event: IpcMainInvokeEvent,
  request: StoryIntelligenceProjectBindingV1,
): { readonly snapshot: ProjectSpineSessionSnapshot; readonly repository: StoryIntelligenceRepository } | StoryIntelligenceFailureV1 {
  if (!options || options.resolveWindowRole(event.sender.id) !== 'writing') {
    return fail('NOT_WRITING_STUDIO', 'Story intelligence is available only in Writing Studio.');
  }
  if (!validBinding(request)) return fail('INVALID_REQUEST', 'The story-intelligence request is incomplete.');
  const snapshot = options.getWritingSnapshot();
  if (!snapshot.project) return fail('NO_ACTIVE_PROJECT', 'Open a project before using story intelligence.');
  if (
    snapshot.project.projectId !== request.projectId ||
    !samePath(snapshot.project.path, request.projectPath) ||
    snapshot.generation !== request.generation
  ) return fail('STALE_SESSION', 'The active project changed before the story-intelligence request completed.');
  return {
    snapshot,
    repository: (options.repositoryFactory ?? ((projectPath: string) => new StoryIntelligenceRepository(projectPath)))(snapshot.project.path),
  };
}

function isFailure(value: ReturnType<typeof activeProject>): value is StoryIntelligenceFailureV1 {
  return 'ok' in value;
}

function repositoryFailure(error: unknown): StoryIntelligenceFailureV1 {
  if (error instanceof StoryIntelligenceRepositoryError) {
    if (error.code === 'STALE') return fail('STORY_INTELLIGENCE_STALE', error.message);
    if (error.code === 'UNAVAILABLE') return fail('STORY_INTELLIGENCE_UNAVAILABLE', error.message);
    return fail('STORY_INTELLIGENCE_WRITE_FAILED', error.message);
  }
  return fail('STORY_INTELLIGENCE_WRITE_FAILED', 'The story-intelligence operation could not be completed.');
}

async function read(event: IpcMainInvokeEvent, request: GetStoryIntelligenceRequestV1): Promise<StoryIntelligenceReadResultV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  try {
    return { ok: true, data: await active.repository.read(active.snapshot.project!.projectId) };
  } catch (error) {
    return repositoryFailure(error);
  }
}

async function write(event: IpcMainInvokeEvent, request: WriteStoryIntelligenceRequestV1): Promise<StoryIntelligenceWriteResultV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!Number.isInteger(request.expectedRevision) || request.expectedRevision < 0) {
    return fail('INVALID_REQUEST', 'The story-intelligence expected revision is invalid.');
  }
  try {
    const validated = validateStoryIntelligenceDocument(request.document, active.snapshot.project!.projectId);
    return { ok: true, data: await active.repository.write(active.snapshot.project!.projectId, request.expectedRevision, validated) };
  } catch (error) {
    if (error instanceof StoryIntelligenceValidationError) return fail('INVALID_REQUEST', 'The story-intelligence document is invalid.');
    return repositoryFailure(error);
  }
}

async function checkPermission(
  event: IpcMainInvokeEvent,
  request: CheckStoryIntelligencePermissionRequestV1,
): Promise<StoryIntelligencePermissionResultEnvelopeV1> {
  const active = activeProject(event, request);
  if (isFailure(active)) return active;
  if (!validPermissionRequest(request)) return { ok: false, error: { code: 'INVALID_REQUEST', message: 'The story-intelligence permission request is invalid.' } };
  try {
    const document = await active.repository.read(active.snapshot.project!.projectId);
    const result = checkStoryIntelligencePermission(
      request.sourceClass,
      request.operation,
      document.settings.analysisPolicy,
    );
    return { ok: true, data: result };
  } catch (error) {
    return repositoryFailure(error);
  }
}

export function registerStoryIntelligenceIpc(nextOptions: RegisterStoryIntelligenceIpcOptions): void {
  options = nextOptions;
  for (const channel of Object.values(STORY_INTELLIGENCE_CHANNELS)) ipcMain.removeHandler(channel);
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.read, (event, request: unknown) => read(event, request as GetStoryIntelligenceRequestV1));
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.write, (event, request: unknown) => write(event, request as WriteStoryIntelligenceRequestV1));
  ipcMain.handle(STORY_INTELLIGENCE_CHANNELS.checkPermission, (event, request: unknown) => checkPermission(event, request as CheckStoryIntelligencePermissionRequestV1));
}

export function resetStoryIntelligenceIpcForTests(): void {
  for (const channel of Object.values(STORY_INTELLIGENCE_CHANNELS)) ipcMain.removeHandler(channel);
  options = null;
}
