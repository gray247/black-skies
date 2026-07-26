import { app, dialog, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { IpcMainInvokeEvent } from 'electron';
import type { LoadedProject, OutlineFile, SceneDraftMetadata } from '../shared/ipc/projectLoader';
import {
  PROJECT_SPINE_CHANNELS,
  type CaptureRecoveryCheckpointRequest,
  type CreateManuscriptUnitRequest,
  type CreateProjectRequest,
  type DeleteManuscriptUnitRequest,
  type ExportMarkdownRequest,
  type ExportMarkdownResultData,
  type OpenProjectRequest,
  type ProjectSpineError,
  type ProjectSpineCloseConfirmationResponse,
  type ProjectSpineResult,
  type ProjectSpineSessionSnapshot,
  type ProjectSpineWindowRole,
  type RecentProjectReference,
  type RecoveryCandidateDecisionRequest,
  type RecoveryCandidateDecisionResultData,
  type RemoveRecentProjectRequest,
  type RenameManuscriptUnitRequest,
  type ReorderManuscriptUnitsRequest,
  type SaveManuscriptUnitRequest,
  type SaveManuscriptUnitResultData,
  type SelectManuscriptUnitRequest,
  type SetManuscriptUnitDirtyRequest,
} from '../shared/ipc/projectSpine';
import {
  bootstrapFreshProject,
  PROJECT_METADATA_SCHEMA_VERSION,
} from './projectBootstrap';
import {
  loadProjectFromDisk,
  ProjectDraftSaveError,
  saveProjectDraft,
} from './projectLoaderIpc';
import {
  ProjectSessionCoordinator,
  ProjectSessionError,
  toProjectSpineError,
} from './projectSessionCoordinator';
import {
  buildMarkdownExportArtifact,
  destinationExists,
  MarkdownExportError,
  normalizeSelectedMarkdownPath,
  suggestMarkdownFilename,
  writeMarkdownAtomic,
} from './projectSpineMarkdownExport';
import {
  clearPendingCloseRequest,
  grantCoordinatedCloseAllowance,
  revokeCoordinatedCloseAllowance,
  resetCloseConfirmationState,
  validateCloseConfirmationResponse,
} from './closeConfirmationCoordinator';
import {
  extractRecoveryProse,
  ProjectSpineRecoveryCheckpointError,
  ProjectSpineRecoveryCheckpointService,
  type ProjectSpineRecoveryCheckpointContext,
} from './projectSpineRecoveryCheckpoints';

const RECENT_STORE_SCHEMA_VERSION = 1;
const RECENT_STORE_FILENAME = 'black-skies-recent-projects-v1.json';
const CONTROL_CHARACTER_CLASS = `${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}`;
const UNSUPPORTED_CONTROL_CHARACTERS = new RegExp(`[${CONTROL_CHARACTER_CLASS}]`);
const UNSUPPORTED_CONTROL_CHARACTERS_GLOBAL = new RegExp(`[${CONTROL_CHARACTER_CLASS}]`, 'g');

export interface RegisterProjectSpineIpcOptions {
  readonly originSessionId: string;
  readonly resolveWindowRole?: (webContentsId: number) => ProjectSpineWindowRole | null;
  readonly publishSession?: (sourceWebContentsId?: number) => void;
  readonly recentStorePath?: string;
  readonly coordinator?: ProjectSessionCoordinator;
  readonly loadProject?: (projectPath: string) => Promise<LoadedProject>;
  readonly initiateCoordinatedShutdown?: () => void;
  readonly recoveryCheckpoints?: ProjectSpineRecoveryCheckpointService;
  readonly writeMarkdownFile?: typeof writeMarkdownAtomic;
}

interface ProjectMetadataV1 {
  readonly schema_version: typeof PROJECT_METADATA_SCHEMA_VERSION;
  readonly project_id: string;
  readonly name: string;
}

let coordinator = new ProjectSessionCoordinator();
let registrationOptions: Partial<RegisterProjectSpineIpcOptions> = {};
let recoveryCheckpoints: ProjectSpineRecoveryCheckpointService | null = null;
let recentStorePath: string | null = null;
let recentStoreReady: Promise<void> = Promise.resolve();
let latestLifecycleOperationId: string | null = null;
let recoveryDetectionReady: {
  readonly generation: number;
  readonly promise: Promise<void>;
} | null = null;

function roleForEvent(event: IpcMainInvokeEvent): ProjectSpineWindowRole {
  const resolved = registrationOptions.resolveWindowRole?.(event.sender.id);
  if (resolved) {
    return resolved;
  }
  if (registrationOptions.resolveWindowRole) {
    throw new ProjectSessionError('WRONG_WINDOW_ROLE', 'This window is not part of the active writing session.');
  }
  return 'writing';
}

function requireWritingRole(event: IpcMainInvokeEvent): ProjectSpineWindowRole {
  const role = roleForEvent(event);
  if (role !== 'writing') {
    throw new ProjectSessionError(
      'WRONG_WINDOW_ROLE',
      'Command Center cannot mutate project or manuscript truth.',
    );
  }
  return role;
}

function requireOperationId(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ProjectSessionError('INVALID_REQUEST', 'A project operation id is required.');
  }
  return value.trim();
}

function publish(sourceWebContentsId?: number): void {
  registrationOptions.publishSession?.(sourceWebContentsId);
}

function success<T>(
  role: ProjectSpineWindowRole,
  data: T,
): ProjectSpineResult<T> {
  return { ok: true, data, snapshot: coordinator.snapshot(role) };
}

function failure<T>(
  role: ProjectSpineWindowRole,
  error: unknown,
  targetPath?: string,
): ProjectSpineResult<T> {
  const normalized = mapProjectSpineError(error);
  if (
    normalized.code !== 'STALE_SESSION' &&
    normalized.code !== 'WRONG_WINDOW_ROLE' &&
    !normalized.code.startsWith('RECOVERY_') &&
    !normalized.code.startsWith('EXPORT_')
  ) {
    coordinator.noteFailure(normalized, targetPath);
  }
  return { ok: false, error: normalized, snapshot: coordinator.snapshot(role) };
}

function mapProjectSpineError(error: unknown): ProjectSpineError {
  if (error instanceof MarkdownExportError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof ProjectSpineRecoveryCheckpointError) {
    return { code: error.code, message: error.message };
  }
  if (error instanceof ProjectDraftSaveError) {
    const code = error.code === 'STALE_DRAFT'
      ? 'STALE_DRAFT'
      : error.code === 'PROJECT_ID_MISMATCH'
        ? 'PROJECT_ID_MISMATCH'
        : error.code === 'SCENE_NOT_FOUND'
          ? 'UNIT_NOT_FOUND'
          : error.code === 'SCENE_INVALID'
            ? 'UNIT_INVALID'
            : error.code === 'SAVE_FAILED'
              ? 'SAVE_FAILED'
              : 'PROJECT_INVALID';
    return { code, message: error.message };
  }
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate?.code === 'string' ? candidate.code : null;
  if (
    code === 'PROJECT_NOT_FOUND' ||
    code === 'PROJECT_INVALID' ||
    code === 'PROJECT_UNSUPPORTED_VERSION'
  ) {
    return {
      code,
      message: typeof candidate.message === 'string' ? candidate.message : 'Unable to open project.',
    };
  }
  if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
    return { code: 'PROJECT_NOT_FOUND', message: 'The selected project folder no longer exists.' };
  }
  return toProjectSpineError(error);
}

async function readStrictProjectMetadata(projectPath: string): Promise<ProjectMetadataV1> {
  const metadataPath = path.join(projectPath, 'project.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(await fs.readFile(metadataPath, 'utf8')) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      throw new ProjectSessionError(
        'PROJECT_INVALID',
        'This folder is not a supported Black Skies project because project.json is missing.',
      );
    }
    throw new ProjectSessionError(
      'PROJECT_INVALID',
      'This Black Skies project appears damaged: project.json cannot be read as valid metadata.',
    );
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ProjectSessionError(
      'PROJECT_INVALID',
      'This Black Skies project appears damaged: project.json has an invalid metadata shape.',
    );
  }
  const metadata = parsed as Record<string, unknown>;
  if (metadata.schema_version !== PROJECT_METADATA_SCHEMA_VERSION) {
    throw new ProjectSessionError(
      'PROJECT_UNSUPPORTED_VERSION',
      'This project uses an unsupported or legacy Black Skies metadata version. It cannot be opened by this version of the app.',
    );
  }
  const projectId = typeof metadata.project_id === 'string' ? metadata.project_id.trim() : '';
  const name = typeof metadata.name === 'string' ? metadata.name.trim() : '';
  if (!projectId) {
    throw new ProjectSessionError('PROJECT_INVALID', 'project.json is missing project_id.');
  }
  if (projectId.length > 160 || UNSUPPORTED_CONTROL_CHARACTERS.test(projectId)) {
    throw new ProjectSessionError('PROJECT_INVALID', 'project_id contains unsupported characters.');
  }
  if (!name) {
    throw new ProjectSessionError('PROJECT_INVALID', 'project.json is missing the project title.');
  }
  return {
    schema_version: PROJECT_METADATA_SCHEMA_VERSION,
    project_id: projectId,
    name,
  };
}

function validateAndJoinManuscript(
  loaded: LoadedProject,
  metadata: ProjectMetadataV1,
): LoadedProject {
  const outline = loaded.outline;
  if (!outline.project_id || outline.project_id !== metadata.project_id) {
    throw new ProjectSessionError(
      'PROJECT_INVALID',
      'outline.json must bind to the same durable project_id as project.json.',
    );
  }
  if (!Array.isArray(outline.acts) || !Array.isArray(outline.chapters) || !Array.isArray(outline.scenes)) {
    throw new ProjectSessionError('PROJECT_INVALID', 'outline.json contains an invalid structural shape.');
  }
  const ids = new Set<string>();
  const orders = new Set<number>();
  const diskMetadata = new Map(loaded.scenes.map((scene) => [scene.id, scene]));
  const scenes: SceneDraftMetadata[] = [];
  const drafts: Record<string, string> = {};
  for (const outlineUnit of [...outline.scenes].sort((left, right) => left.order - right.order)) {
    const id = typeof outlineUnit.id === 'string' ? outlineUnit.id.trim() : '';
    const order = Number(outlineUnit.order);
    if (!id || !/^[A-Za-z0-9_-]+$/.test(id) || !Number.isInteger(order) || order < 1) {
      throw new ProjectSessionError('PROJECT_INVALID', 'outline.json contains an invalid manuscript unit.');
    }
    if (ids.has(id) || orders.has(order)) {
      throw new ProjectSessionError(
        'PROJECT_INVALID',
        'outline.json contains duplicate manuscript identity or order values.',
      );
    }
    ids.add(id);
    orders.add(order);
    const parsedDraft = diskMetadata.get(id);
    const markdown = loaded.drafts[id];
    if (!parsedDraft || typeof markdown !== 'string') {
      throw new ProjectSessionError(
        'PROJECT_INVALID',
        `Manuscript unit ${id} is referenced by outline.json but has no valid draft file.`,
      );
    }
    scenes.push({
      ...parsedDraft,
      id,
      title: typeof outlineUnit.title === 'string' ? outlineUnit.title : '',
      order,
      chapter_id: outlineUnit.chapter_id,
    });
    drafts[id] = markdown;
  }
  return {
    ...loaded,
    path: path.resolve(loaded.path),
    projectId: metadata.project_id,
    name: metadata.name,
    scenes,
    drafts,
  };
}

export async function loadProjectForSpine(projectPath: string): Promise<LoadedProject> {
  if (typeof projectPath !== 'string' || projectPath.trim().length === 0) {
    throw new ProjectSessionError('INVALID_REQUEST', 'A project folder is required.');
  }
  let canonicalPath: string;
  try {
    canonicalPath = await fs.realpath(path.resolve(projectPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      throw new ProjectSessionError('PROJECT_NOT_FOUND', 'The selected project folder no longer exists.');
    }
    throw error;
  }
  const metadata = await readStrictProjectMetadata(canonicalPath);
  const { project } = await loadProjectFromDisk(canonicalPath);
  return validateAndJoinManuscript(project, metadata);
}

function normalizeTitle(title: unknown): string {
  if (typeof title !== 'string') {
    throw new ProjectSessionError('UNIT_INVALID', 'A manuscript-unit title must be text.');
  }
  return title
    .normalize('NFKC')
    .replace(UNSUPPORTED_CONTROL_CHARACTERS_GLOBAL, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function serializeUnitDraft(unitId: string, title: string, order: number, body = ''): string {
  const normalizedBody = body.replace(/\r\n/g, '\n');
  const bodyWithNewline = normalizedBody.length === 0 || normalizedBody.endsWith('\n')
    ? normalizedBody
    : `${normalizedBody}\n`;
  return `---\nid: ${unitId}\ntitle: ${JSON.stringify(title)}\norder: ${order}\n---\n${bodyWithNewline}`;
}

function extractDraftBody(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') {
    return markdown;
  }
  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closingIndex < 0) {
    return markdown;
  }
  return lines.slice(closingIndex + 2).join('\n');
}

async function writeFileExclusiveSynced(targetPath: string, contents: string): Promise<void> {
  const handle = await fs.open(targetPath, 'wx');
  try {
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeJsonAtomic(targetPath: string, payload: unknown): Promise<void> {
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${randomUUID()}.tmp`,
  );
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(temporaryPath, 'wx');
    await handle.writeFile(`${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(temporaryPath, targetPath);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function readOutlineForMutation(projectPath: string): Promise<OutlineFile> {
  const parsed = JSON.parse(await fs.readFile(path.join(projectPath, 'outline.json'), 'utf8')) as OutlineFile;
  if (parsed.schema_version !== 'OutlineSchema v1' || !Array.isArray(parsed.scenes)) {
    throw new ProjectSessionError('PROJECT_INVALID', 'outline.json is not a supported structural manifest.');
  }
  return parsed;
}

export async function createManuscriptUnit(
  project: LoadedProject,
  title: string,
): Promise<{ project: LoadedProject; unitId: string }> {
  const normalizedTitle = normalizeTitle(title);
  const outline = await readOutlineForMutation(project.path);
  const unitId = `unit_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const order = outline.scenes.length + 1;
  const draftPath = path.join(project.path, 'drafts', `${unitId}.md`);
  await writeFileExclusiveSynced(draftPath, serializeUnitDraft(unitId, normalizedTitle, order));
  try {
    await writeJsonAtomic(path.join(project.path, 'outline.json'), {
      ...outline,
      scenes: [...outline.scenes, { id: unitId, title: normalizedTitle, order }],
    });
  } catch (error) {
    await fs.rm(draftPath, { force: true }).catch(() => undefined);
    throw error;
  }
  return { project: await loadProjectForSpine(project.path), unitId };
}

export async function renameManuscriptUnit(
  project: LoadedProject,
  unitId: string,
  title: string,
): Promise<LoadedProject> {
  const normalizedTitle = normalizeTitle(title);
  const outline = await readOutlineForMutation(project.path);
  if (!outline.scenes.some((unit) => unit.id === unitId)) {
    throw new ProjectSessionError('UNIT_NOT_FOUND', 'The manuscript unit no longer exists.');
  }
  await writeJsonAtomic(path.join(project.path, 'outline.json'), {
    ...outline,
    scenes: outline.scenes.map((unit) =>
      unit.id === unitId ? { ...unit, title: normalizedTitle } : unit,
    ),
  });
  return loadProjectForSpine(project.path);
}

export async function reorderManuscriptUnits(
  project: LoadedProject,
  orderedUnitIds: readonly string[],
): Promise<LoadedProject> {
  const outline = await readOutlineForMutation(project.path);
  const currentIds = outline.scenes.map((unit) => unit.id);
  const requested = [...orderedUnitIds];
  if (
    requested.length !== currentIds.length ||
    new Set(requested).size !== requested.length ||
    requested.some((unitId) => !currentIds.includes(unitId))
  ) {
    throw new ProjectSessionError(
      'UNIT_INVALID',
      'Reorder must contain every current manuscript unit exactly once.',
    );
  }
  const byId = new Map(outline.scenes.map((unit) => [unit.id, unit]));
  await writeJsonAtomic(path.join(project.path, 'outline.json'), {
    ...outline,
    scenes: requested.map((unitId, index) => ({ ...byId.get(unitId)!, order: index + 1 })),
  });
  return loadProjectForSpine(project.path);
}

export async function deleteManuscriptUnit(
  project: LoadedProject,
  unitId: string,
  confirmNonEmpty: boolean,
): Promise<{ project: LoadedProject; nextActiveUnitId: string | null }> {
  const outline = await readOutlineForMutation(project.path);
  const ordered = [...outline.scenes].sort((left, right) => left.order - right.order);
  const index = ordered.findIndex((unit) => unit.id === unitId);
  if (index < 0) {
    throw new ProjectSessionError('UNIT_NOT_FOUND', 'The manuscript unit no longer exists.');
  }
  const draftPath = path.join(project.path, 'drafts', `${unitId}.md`);
  const markdown = await fs.readFile(draftPath, 'utf8');
  if (extractDraftBody(markdown).trim().length > 0 && !confirmNonEmpty) {
    throw new ProjectSessionError(
      'UNIT_NOT_EMPTY',
      'This manuscript unit contains prose and requires explicit deletion confirmation.',
    );
  }
  const remaining = ordered
    .filter((unit) => unit.id !== unitId)
    .map((unit, nextIndex) => ({ ...unit, order: nextIndex + 1 }));
  const retiredDraftPath = path.join(
    path.dirname(draftPath),
    `.${path.basename(draftPath)}.${randomUUID()}.deleted`,
  );
  await fs.rename(draftPath, retiredDraftPath);
  try {
    await writeJsonAtomic(path.join(project.path, 'outline.json'), {
      ...outline,
      scenes: remaining,
    });
  } catch (error) {
    await fs.rename(retiredDraftPath, draftPath).catch(() => undefined);
    throw error;
  }
  await fs.rm(retiredDraftPath, { force: true }).catch(() => undefined);
  const nextActiveUnitId = remaining[index]?.id ?? remaining[index - 1]?.id ?? null;
  return { project: await loadProjectForSpine(project.path), nextActiveUnitId };
}

async function readRecentStore(storePath: string): Promise<RecentProjectReference[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(storePath, 'utf8')) as {
      schemaVersion?: unknown;
      recentProjects?: unknown;
    };
    if (parsed.schemaVersion !== RECENT_STORE_SCHEMA_VERSION || !Array.isArray(parsed.recentProjects)) {
      return [];
    }
    return parsed.recentProjects.filter((entry): entry is RecentProjectReference =>
      Boolean(
        entry &&
        typeof entry === 'object' &&
        typeof (entry as RecentProjectReference).path === 'string' &&
        typeof (entry as RecentProjectReference).title === 'string' &&
        typeof (entry as RecentProjectReference).lastOpened === 'number',
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return [];
    }
    return [];
  }
}

async function persistRecentStore(): Promise<void> {
  if (!recentStorePath) {
    return;
  }
  await fs.mkdir(path.dirname(recentStorePath), { recursive: true });
  await writeJsonAtomic(recentStorePath, {
    schemaVersion: RECENT_STORE_SCHEMA_VERSION,
    recentProjects: coordinator.getRecentProjects(),
  });
}

async function prepareRecentStore(): Promise<void> {
  if (!recentStorePath) {
    return;
  }
  coordinator.setRecentProjects(await readRecentStore(recentStorePath));
}

export function getProjectSpineSnapshot(role: ProjectSpineWindowRole): ProjectSpineSessionSnapshot {
  return coordinator.snapshot(role);
}

export function projectSpineHasUnsavedWork(): boolean {
  return coordinator.hasUnsavedWork();
}

function requireRecoveryCheckpoints(): ProjectSpineRecoveryCheckpointService {
  if (!recoveryCheckpoints) {
    throw new ProjectSessionError('RECOVERY_UNAVAILABLE', 'Recovery protection is not available.');
  }
  return recoveryCheckpoints;
}

function recoveryContextFor(
  binding: {
    readonly projectId: string;
    readonly projectPath: string;
    readonly generation: number;
    readonly operationId: string;
  },
  unitId?: string,
): ProjectSpineRecoveryCheckpointContext {
  return coordinator.getRecoveryCheckpointContext(binding, unitId);
}

function activeRecoveryContext(operationId: string, unitId?: string): ProjectSpineRecoveryCheckpointContext {
  const active = coordinator.getActiveProject();
  if (!active?.projectId) {
    throw new ProjectSessionError('STALE_SESSION', 'No active project is available for recovery cleanup.');
  }
  return recoveryContextFor({
    projectId: active.projectId,
    projectPath: active.path,
    generation: coordinator.getGeneration(),
    operationId,
  }, unitId);
}

function recoveryCanonicalPathKey(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLocaleLowerCase('en-US') : resolved;
}

async function activateProjectWithRecoveryCleanup(
  project: LoadedProject,
  discardUnsaved: boolean,
  operationId: string,
): Promise<ReturnType<ProjectSessionCoordinator['activateProject']>> {
  const active = coordinator.getActiveProject();
  const sameActiveProject = Boolean(
    active?.projectId &&
    project.projectId === active.projectId &&
    recoveryCanonicalPathKey(project.path) === recoveryCanonicalPathKey(active.path),
  );
  if (!discardUnsaved || !active?.projectId || sameActiveProject) {
    return coordinator.activateProject(project, discardUnsaved);
  }
  return requireRecoveryCheckpoints().withIntentionalCleanup(
    () => activeRecoveryContext(`project-switch:${operationId}`),
    null,
    async () => {
      if (latestLifecycleOperationId !== operationId) {
        throw new ProjectSessionError('STALE_SESSION', 'A newer project lifecycle request superseded this result.');
      }
      return coordinator.activateProject(project, true);
    },
  );
}

function activeBinding(operationId: string): {
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly operationId: string;
} {
  const active = coordinator.getActiveProject();
  if (!active?.projectId) throw new ProjectSessionError('STALE_SESSION', 'No active project is available.');
  return {
    projectId: active.projectId,
    projectPath: active.path,
    generation: coordinator.getGeneration(),
    operationId,
  };
}

async function detectRecoveryAfterActivation(
  activation: ReturnType<ProjectSessionCoordinator['activateProject']>,
  operationId: string,
): Promise<void> {
  if (activation.activation === 'already-active') {
    if (recoveryDetectionReady?.generation === activation.generation) {
      await recoveryDetectionReady.promise;
    }
    return;
  }
  const binding = activeBinding(`recovery-detect:${operationId}`);
  const promise = (async () => {
    const state = await requireRecoveryCheckpoints().detectPriorSessionRecovery(
      () => recoveryContextFor(binding),
    );
    coordinator.installRecoveryState(binding, state);
  })();
  recoveryDetectionReady = { generation: activation.generation, promise };
  await promise;
}

export function resetProjectSpineForTests(nextCoordinator = new ProjectSessionCoordinator()): void {
  resetCloseConfirmationState();
  coordinator = nextCoordinator;
  latestLifecycleOperationId = null;
  recoveryDetectionReady = null;
  recentStorePath = null;
  recentStoreReady = Promise.resolve();
  registrationOptions = {};
  recoveryCheckpoints = null;
}

export function registerProjectSpineIpc(options: RegisterProjectSpineIpcOptions): void {
  if (!options.originSessionId?.trim()) {
    throw new TypeError('A Project Spine recovery origin session id is required.');
  }
  registrationOptions = options;
  coordinator = options.coordinator ?? coordinator;
  recoveryCheckpoints = options.recoveryCheckpoints
    ?? new ProjectSpineRecoveryCheckpointService(options.originSessionId);
  recentStorePath = options.recentStorePath ?? path.join(app.getPath('userData'), RECENT_STORE_FILENAME);
  recentStoreReady = prepareRecentStore();

  for (const channel of Object.values(PROJECT_SPINE_CHANNELS)) {
    if (channel !== PROJECT_SPINE_CHANNELS.sessionChanged) {
      ipcMain.removeHandler(channel);
    }
  }

  ipcMain.handle(PROJECT_SPINE_CHANNELS.chooseDirectory, async (event) => {
    requireWritingRole(event);
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
    return { canceled: result.canceled, path: result.filePaths?.[0] };
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.closeConfirmationResponse, async (event, value: unknown) => {
    const role = roleForEvent(event);
    try {
      if (role !== 'writing') {
        throw new ProjectSessionError('WRONG_WINDOW_ROLE', 'Only Writing Studio may answer a close confirmation.');
      }
      if (!value || typeof value !== 'object') {
        throw new ProjectSessionError('INVALID_REQUEST', 'A close-confirmation response is required.');
      }
      const response = value as Partial<ProjectSpineCloseConfirmationResponse>;
      if (
        typeof response.correlationId !== 'string' || !response.correlationId.trim() ||
        typeof response.projectId !== 'string' || !response.projectId.trim() ||
        !Number.isInteger(response.generation) || Number(response.generation) < 0 ||
        (response.decision !== 'keep-editing' && response.decision !== 'discard')
      ) {
        throw new ProjectSessionError('INVALID_REQUEST', 'The close-confirmation response is invalid.');
      }
      const typedResponse = response as ProjectSpineCloseConfirmationResponse;
      if (!validateCloseConfirmationResponse(typedResponse, event.sender.id)) {
        throw new ProjectSessionError('STALE_SESSION', 'The close-confirmation response is stale or unsolicited.');
      }
      if (typedResponse.decision === 'keep-editing') {
        clearPendingCloseRequest();
        return success(role, {});
      }
      await requireRecoveryCheckpoints().withIntentionalCleanup(
        () => activeRecoveryContext(`close-discard:${typedResponse.correlationId}`),
        null,
        async () => {
          const discarded = coordinator.discardUnsavedBuffers(
            typedResponse.projectId,
            typedResponse.generation,
          );
          grantCoordinatedCloseAllowance();
          try {
            registrationOptions.initiateCoordinatedShutdown?.();
          } catch (shutdownError) {
            revokeCoordinatedCloseAllowance();
            coordinator.restoreDiscardedUnsavedBuffers(discarded);
            throw shutdownError;
          }
        },
      );
      clearPendingCloseRequest();
      return success(role, {});
    } catch (error) {
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.getSession, async (event) => {
    await recentStoreReady;
    return coordinator.snapshot(roleForEvent(event));
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.openProject, async (event, request: OpenProjectRequest) => {
    const role = requireWritingRole(event);
    const operationId = requireOperationId(request?.operationId);
    const targetPath = typeof request?.path === 'string' ? request.path : '';
    latestLifecycleOperationId = operationId;
    await recentStoreReady;
    try {
      const project = await (registrationOptions.loadProject ?? loadProjectForSpine)(targetPath);
      if (latestLifecycleOperationId !== operationId) {
        throw new ProjectSessionError('STALE_SESSION', 'A newer project-open request superseded this result.');
      }
      const activation = await activateProjectWithRecoveryCleanup(
        project,
        request.discardUnsaved === true,
        operationId,
      );
      await detectRecoveryAfterActivation(activation, operationId);
      if (latestLifecycleOperationId !== operationId) {
        throw new ProjectSessionError('STALE_SESSION', 'A newer project-open request superseded this result.');
      }
      await persistRecentStore();
      publish(event.sender.id);
      return success(role, { activation: activation.activation });
    } catch (error) {
      if (latestLifecycleOperationId !== operationId) {
        return {
          ok: false,
          error: {
            code: 'STALE_SESSION',
            message: 'A newer project-open request superseded this result.',
          },
          snapshot: coordinator.snapshot(role),
        } satisfies ProjectSpineResult<{ activation: 'activated' | 'already-active' }>;
      }
      const result = failure<{ activation: 'activated' | 'already-active' }>(role, error, targetPath);
      await persistRecentStore().catch(() => undefined);
      publish(event.sender.id);
      return result;
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.createProject, async (event, request: CreateProjectRequest) => {
    const role = requireWritingRole(event);
    const operationId = requireOperationId(request?.operationId);
    latestLifecycleOperationId = operationId;
    await recentStoreReady;
    try {
      if (coordinator.hasUnsavedWork() && request.discardUnsaved !== true) {
        throw new ProjectSessionError('UNSAVED_CHANGES', 'The active project has unsaved manuscript changes.');
      }
      const created = await bootstrapFreshProject({
        parentPath: request?.parentPath,
        title: request?.title,
        initialState: 'empty',
      });
      const project = await loadProjectForSpine(created.projectPath);
      if (latestLifecycleOperationId !== operationId) {
        throw new ProjectSessionError('STALE_SESSION', 'A newer project lifecycle request superseded this result.');
      }
      const activation = await activateProjectWithRecoveryCleanup(
        project,
        request.discardUnsaved === true,
        operationId,
      );
      await detectRecoveryAfterActivation(activation, operationId);
      if (latestLifecycleOperationId !== operationId) {
        throw new ProjectSessionError('STALE_SESSION', 'A newer project lifecycle request superseded this result.');
      }
      await persistRecentStore();
      publish(event.sender.id);
      return success(role, { activation: 'activated' as const });
    } catch (error) {
      if (latestLifecycleOperationId !== operationId) {
        return {
          ok: false,
          error: {
            code: 'STALE_SESSION',
            message: 'A newer project lifecycle request superseded this result.',
          },
          snapshot: coordinator.snapshot(role),
        } satisfies ProjectSpineResult<{ activation: 'activated' }>;
      }
      const result = failure<{ activation: 'activated' }>(role, error);
      publish(event.sender.id);
      return result;
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.removeRecent, async (event, request: RemoveRecentProjectRequest) => {
    const role = requireWritingRole(event);
    await recentStoreReady;
    try {
      requireOperationId(request?.operationId);
      if (!request?.path) {
        throw new ProjectSessionError('INVALID_REQUEST', 'A recent-project path is required.');
      }
      coordinator.removeRecent(request.path);
      await persistRecentStore();
      publish(event.sender.id);
      return success(role, {});
    } catch (error) {
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.selectUnit, async (event, request: SelectManuscriptUnitRequest) => {
    const role = roleForEvent(event);
    try {
      if (role === 'writing') coordinator.assertRecoveryMutationAllowed(request);
      coordinator.selectUnit(request, request?.unitId ?? null);
      publish(event.sender.id);
      return success(role, {});
    } catch (error) {
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.setUnitDirty, async (event, request: SetManuscriptUnitDirtyRequest) => {
    const role = requireWritingRole(event);
    try {
      coordinator.assertRecoveryMutationAllowed(request);
      coordinator.setUnitDirty(request, request.unitId, request.dirty);
      publish(event.sender.id);
      return success(role, {});
    } catch (error) {
      return failure(role, error);
    }
  });

  ipcMain.handle(
    PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint,
    async (event, request: CaptureRecoveryCheckpointRequest) => {
      const role = requireWritingRole(event);
      try {
        requireOperationId(request?.operationId);
        if (!request || typeof request.prose !== 'string' || typeof request.unitId !== 'string') {
          throw new ProjectSessionError('INVALID_REQUEST', 'A manuscript recovery checkpoint is required.');
        }
        coordinator.assertRecoveryMutationAllowed(request);
        const data = await requireRecoveryCheckpoints().capture(
          () => recoveryContextFor(request, request.unitId),
          request.unitId,
          request.prose,
          (candidate) => coordinator.noteRecoveryCheckpoint(request, request.unitId, candidate),
        );
        return success(role, data);
      } catch (error) {
        return failure(role, error);
      }
    },
  );

  ipcMain.handle(
    PROJECT_SPINE_CHANNELS.acceptRecoveryCandidate,
    async (event, request: RecoveryCandidateDecisionRequest) => {
      const role = requireWritingRole(event);
      let token: ReturnType<ProjectSessionCoordinator['beginRecoveryDecision']> | null = null;
      try {
        requireOperationId(request?.operationId);
        token = coordinator.beginRecoveryDecision(request, request?.unitId);
        const activeToken = token;
        const data = await requireRecoveryCheckpoints().acceptPriorSessionCandidate(
          () => recoveryContextFor(request, request.unitId),
          request,
          (candidate) => coordinator.selectRecoveryCandidate(activeToken, candidate),
          (candidates) => coordinator.completeRecoveryAcceptance(activeToken, candidates),
        );
        coordinator.finishRecoveryDecision(activeToken);
        publish(event.sender.id);
        return success<RecoveryCandidateDecisionResultData>(role, data);
      } catch (error) {
        if (token) coordinator.failRecoveryDecision(token);
        publish(event.sender.id);
        return failure<RecoveryCandidateDecisionResultData>(role, error);
      }
    },
  );

  ipcMain.handle(
    PROJECT_SPINE_CHANNELS.rejectRecoveryCandidate,
    async (event, request: RecoveryCandidateDecisionRequest) => {
      const role = requireWritingRole(event);
      let token: ReturnType<ProjectSessionCoordinator['beginRecoveryDecision']> | null = null;
      try {
        requireOperationId(request?.operationId);
        token = coordinator.beginRecoveryDecision(request, request?.unitId);
        const activeToken = token;
        const data = await requireRecoveryCheckpoints().rejectPriorSessionCandidate(
          () => recoveryContextFor(request, request.unitId),
          request,
          (candidate) => coordinator.rejectRecoveryCandidate(activeToken, candidate),
          (candidates) => coordinator.completeRecoveryAcceptance(activeToken, candidates),
        );
        coordinator.finishRecoveryDecision(activeToken);
        publish(event.sender.id);
        return success<RecoveryCandidateDecisionResultData>(role, data);
      } catch (error) {
        if (token) coordinator.failRecoveryDecision(token);
        publish(event.sender.id);
        return failure<RecoveryCandidateDecisionResultData>(role, error);
      }
    },
  );

  ipcMain.handle(PROJECT_SPINE_CHANNELS.saveUnit, async (event, request: SaveManuscriptUnitRequest) => {
    const role = requireWritingRole(event);
    let token: ReturnType<ProjectSessionCoordinator['beginSave']> | null = null;
    try {
      if (typeof request?.submittedProse !== 'string') {
        throw new ProjectSessionError('INVALID_REQUEST', 'The exact submitted manuscript prose is required.');
      }
      coordinator.assertRecoveryMutationAllowed(request);
      const normalizedSubmittedProse = request.submittedProse.replace(/\r\n/g, '\n');
      const serializedSubmittedProse = normalizedSubmittedProse.endsWith('\n')
        ? normalizedSubmittedProse
        : `${normalizedSubmittedProse}\n`;
      if (extractRecoveryProse(request.markdown) !== serializedSubmittedProse) {
        throw new ProjectSessionError(
          'INVALID_REQUEST',
          'The submitted manuscript prose does not match the durable save payload.',
        );
      }
      token = coordinator.beginSave(request, request.unitId);
      publish();
      const saved = await saveProjectDraft({
        projectPath: request.projectPath,
        projectId: request.projectId,
        sceneId: request.unitId,
        expectedMarkdown: request.expectedMarkdown,
        markdown: request.markdown,
      });
      coordinator.completeSave(token, saved.markdown);
      publish();
      const recovery = await requireRecoveryCheckpoints().reconcileSuccessfulSave(
        () => recoveryContextFor(request, request.unitId),
        request.unitId,
        request.submittedProse,
        (status, candidate) => {
          if (status !== 'degraded') {
            coordinator.noteRecoverySaveReconciliation(request, request.unitId, status, candidate);
          }
        },
      );
      publish();
      return success<SaveManuscriptUnitResultData>(role, { recovery });
    } catch (error) {
      if (token) {
        coordinator.failSave(token, mapProjectSpineError(error).message);
      }
      publish();
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.createUnit, async (event, request: CreateManuscriptUnitRequest) => {
    const role = requireWritingRole(event);
    let token: ReturnType<ProjectSessionCoordinator['beginStructureMutation']> | null = null;
    try {
      coordinator.assertRecoveryMutationAllowed(request);
      token = coordinator.beginStructureMutation(request);
      const active = coordinator.getActiveProject()!;
      const created = await createManuscriptUnit(active, request.title);
      coordinator.completeStructureMutation(token, created.project, created.unitId);
      publish();
      return success(role, { unitId: created.unitId });
    } catch (error) {
      if (token) {
        coordinator.failStructureMutation(token, mapProjectSpineError(error).message);
      }
      publish();
      return failure<{ unitId: string }>(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.renameUnit, async (event, request: RenameManuscriptUnitRequest) => {
    const role = requireWritingRole(event);
    let token: ReturnType<ProjectSessionCoordinator['beginStructureMutation']> | null = null;
    try {
      coordinator.assertRecoveryMutationAllowed(request);
      token = coordinator.beginStructureMutation(request);
      const active = coordinator.getActiveProject()!;
      const updated = await renameManuscriptUnit(active, request.unitId, request.title);
      coordinator.completeStructureMutation(token, updated, request.unitId);
      publish();
      return success(role, {});
    } catch (error) {
      if (token) coordinator.failStructureMutation(token, mapProjectSpineError(error).message);
      publish();
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.reorderUnits, async (event, request: ReorderManuscriptUnitsRequest) => {
    const role = requireWritingRole(event);
    let token: ReturnType<ProjectSessionCoordinator['beginStructureMutation']> | null = null;
    try {
      coordinator.assertRecoveryMutationAllowed(request);
      token = coordinator.beginStructureMutation(request);
      const active = coordinator.getActiveProject()!;
      const updated = await reorderManuscriptUnits(active, request.orderedUnitIds);
      coordinator.completeStructureMutation(token, updated, coordinator.snapshot('writing').activeUnitId);
      publish();
      return success(role, {});
    } catch (error) {
      if (token) coordinator.failStructureMutation(token, mapProjectSpineError(error).message);
      publish();
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.deleteUnit, async (event, request: DeleteManuscriptUnitRequest) => {
    const role = requireWritingRole(event);
    let token: ReturnType<ProjectSessionCoordinator['beginStructureMutation']> | null = null;
    try {
      coordinator.assertRecoveryMutationAllowed(request);
      await requireRecoveryCheckpoints().withIntentionalCleanup(
        () => recoveryContextFor(request, request.unitId),
        [request.unitId],
        async () => {
          token = coordinator.beginStructureMutation(request);
          const active = coordinator.getActiveProject()!;
          const deleted = await deleteManuscriptUnit(active, request.unitId, request.confirmNonEmpty);
          coordinator.completeStructureMutation(token, deleted.project, deleted.nextActiveUnitId);
        },
      );
      publish();
      return success(role, {});
    } catch (error) {
      if (token) coordinator.failStructureMutation(token, mapProjectSpineError(error).message);
      publish();
      return failure(role, error);
    }
  });

  ipcMain.handle(PROJECT_SPINE_CHANNELS.exportMarkdown, async (event, request: ExportMarkdownRequest) => {
    const role = roleForEvent(event);
    try {
      if (role !== 'writing') {
        throw new ProjectSessionError('WRONG_WINDOW_ROLE', 'Only Writing Studio may export the manuscript.');
      }
      if (!request || typeof request.revision !== 'number') {
        throw new ProjectSessionError('INVALID_REQUEST', 'A bound Markdown export request is required.');
      }
      coordinator.assertExportReady(request, request.revision);
      const activeProject = coordinator.getActiveProject()!;
      const destination = await dialog.showSaveDialog({
        title: 'Export Markdown manuscript',
        defaultPath: suggestMarkdownFilename(activeProject.name),
        buttonLabel: 'Export',
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
      if (destination.canceled || !destination.filePath) {
        return success<ExportMarkdownResultData>(role, {
          status: 'cancelled',
          projectId: request.projectId,
          generation: request.generation,
          revision: request.revision,
          operationId: request.operationId,
        });
      }
      const targetPath = normalizeSelectedMarkdownPath(destination.filePath);
      const replacementRequired = await destinationExists(targetPath);
      if (replacementRequired) {
        const replacement = await dialog.showMessageBox({
          type: 'warning',
          title: 'Replace existing Markdown file?',
          message: 'A file already exists at this destination.',
          detail: targetPath,
          buttons: ['Replace', 'Cancel'],
          defaultId: 1,
          cancelId: 1,
          noLink: true,
        });
        if (replacement.response !== 0) {
          return success<ExportMarkdownResultData>(role, {
            status: 'cancelled',
            projectId: request.projectId,
            generation: request.generation,
            revision: request.revision,
            operationId: request.operationId,
          });
        }
      }
      const source = coordinator.createExportSnapshot(request, request.revision);
      const artifact = buildMarkdownExportArtifact({
        projectId: source.project.projectId,
        projectTitle: source.project.name,
        generation: source.generation,
        revision: source.revision,
        units: source.project.scenes.map((unit) => ({
          id: unit.id,
          title: unit.title,
          order: unit.order,
          markdown: source.project.drafts[unit.id] ?? '',
        })),
      });
      await (registrationOptions.writeMarkdownFile ?? writeMarkdownAtomic)(
        targetPath,
        artifact.bytes,
        replacementRequired,
      );
      return success<ExportMarkdownResultData>(role, {
        status: 'completed',
        projectId: source.project.projectId,
        generation: source.generation,
        revision: source.revision,
        operationId: request.operationId,
        destinationPath: targetPath,
        byteLength: artifact.bytes.length,
        unitCount: artifact.unitCount,
        sha256: artifact.sha256,
        orderedUnitIds: artifact.orderedUnitIds,
        sourceSnapshotFingerprint: artifact.sourceSnapshotFingerprint,
        completedAt: new Date().toISOString(),
      });
    } catch (error) {
      return failure<ExportMarkdownResultData>(role, error);
    }
  });
}
