import { app, dialog, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  LoadedProject,
  OutlineFile,
  ProjectBootstrapRequest,
  ProjectBootstrapResponse,
  ProjectDialogResult,
  ProjectDraftSaveFailure,
  ProjectDraftSaveRequest,
  ProjectDraftSaveResponse,
  ProjectIssue,
  ProjectLoadRequest,
  ProjectLoadResponse,
  ProjectLoadFailure,
  ProjectBootstrapFailure,
  SceneDraftMetadata,
  PROJECT_LOADER_CHANNELS,
} from '../shared/ipc/projectLoader';
import { authorizeProjectPath } from './layoutIpc.js';
import {
  bootstrapFreshProject,
  BOOTSTRAP_INVALID_MARKER,
  PROJECT_METADATA_SCHEMA_VERSION,
  ProjectBootstrapError,
} from './projectBootstrap.js';
import { createMainProcessSessionTruthSnapshot } from './runtimeSessionTruth.js';

const ISSUE_PREFIX = '[projectLoader]';
export const MAX_SCENE_READ_CONCURRENCY = 8;
let devProjectPathOverride: string | null = null;

type ProjectLoadErrorCode = ProjectLoadFailure['error']['code'];

function logIssue(issue: ProjectIssue): void {
  const scope = issue.level === 'error' ? 'error' : 'warn';
  console[scope](
    ISSUE_PREFIX,
    issue.message,
    issue.path ? `(${issue.path})` : '',
    issue.detail ?? '',
  );
}

export function registerProjectLoaderIpc(): void {
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.openDialog);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.loadProject);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.createProject);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.saveDraft);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.getSamplePath);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.setDevProjectPath);

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.openDialog,
    async (): Promise<ProjectDialogResult> => {
      const override = devProjectPathOverride;
      if (override) {
        try {
          const stats = await fs.stat(override);
          if (stats.isDirectory()) {
            return {
              canceled: false,
              filePath: override,
            };
          }
        } catch (error) {
          console.warn('[projectLoader] dev override path invalid', error);
        }
      }

      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      return {
        canceled: result.canceled,
        filePath: result.filePaths?.[0],
      };
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.setDevProjectPath,
    async (_event, nextPath: unknown): Promise<void> => {
      if (typeof nextPath === 'string' && nextPath.trim().length > 0) {
        devProjectPathOverride = path.resolve(nextPath);
      } else {
        devProjectPathOverride = null;
      }
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.loadProject,
    async (_event, request: ProjectLoadRequest): Promise<ProjectLoadResponse> => {
      if (!request?.path) {
        return {
          ok: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project path is required.',
          },
        };
      }

      try {
        const { project, issues } = await loadProjectFromDisk(request.path);
        issues.forEach(logIssue);
        authorizeProjectPath(project.path);
        return {
          ok: true,
          project,
          issues,
          sessionTruth: createMainProcessSessionTruthSnapshot({
            kind: 'project-load-success',
            project,
            issues,
          }).truth,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const aggregate =
          error instanceof ProjectLoaderAggregateError ? error : undefined;
        const fallbackCode = mapSystemErrorCode((error as { code?: string })?.code);
        const mappedCode = aggregate?.code ?? fallbackCode;
        const issues = aggregate?.issues;
        issues?.forEach(logIssue);
        return {
          ok: false,
          error: {
            code: mappedCode,
            message,
            issues,
          },
          sessionTruth: createMainProcessSessionTruthSnapshot({
            kind: 'project-load-failure',
            errorCode: mappedCode,
            issues: issues ?? [],
          }).truth,
        };
      }
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.createProject,
    async (_event, request: ProjectBootstrapRequest): Promise<ProjectBootstrapResponse> => {
      try {
        const created = await bootstrapFreshProject({
          parentPath: request?.parentPath,
          title: request?.title,
          initialState: request?.initialState,
        });
        const { project, issues } = await loadProjectFromDisk(created.projectPath);
        issues.forEach(logIssue);
        authorizeProjectPath(project.path);
        return {
          ok: true,
          project,
          issues,
        };
      } catch (error) {
        return {
          ok: false,
          error: normalizeBootstrapFailure(error),
        };
      }
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.getSamplePath,
    async (): Promise<string | null> => {
      const samplePath = await resolveSampleProjectPath();
      return samplePath;
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.saveDraft,
    async (_event, request: ProjectDraftSaveRequest): Promise<ProjectDraftSaveResponse> => {
      try {
        return await saveProjectDraft(request);
      } catch (error) {
        if (error instanceof ProjectDraftSaveError) {
          return {
            ok: false,
            error: { code: error.code, message: error.message },
          };
        }
        return {
          ok: false,
          error: {
            code: 'UNKNOWN',
            message: error instanceof Error ? error.message : String(error),
          },
        };
      }
    },
  );
}

class ProjectLoaderAggregateError extends Error {
  constructor(
    message: string,
    readonly issues: ProjectIssue[],
    readonly code: ProjectLoadErrorCode = 'UNKNOWN',
  ) {
    super(message);
    this.name = 'ProjectLoaderAggregateError';
  }
}

type ProjectDraftSaveErrorCode = Exclude<
  ProjectDraftSaveFailure['error']['code'],
  'UNKNOWN'
>;

export class ProjectDraftSaveError extends Error {
  constructor(
    message: string,
    readonly code: ProjectDraftSaveErrorCode,
  ) {
    super(message);
    this.name = 'ProjectDraftSaveError';
  }
}

function normalizeSavedMarkdown(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, '\n');
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

function validateDraftSaveMarkdown(sceneId: string, markdown: string): void {
  const frontMatter = extractFrontMatter(markdown);
  if (!frontMatter) {
    throw new ProjectDraftSaveError('Scene Markdown is missing front matter.', 'SCENE_INVALID');
  }
  const submittedId = ensureString(frontMatter.id);
  const order = Number(frontMatter.order);
  if (submittedId !== sceneId) {
    throw new ProjectDraftSaveError(
      'Scene identity does not match the save target.',
      'SCENE_INVALID',
    );
  }
  if (
    !Object.prototype.hasOwnProperty.call(frontMatter, 'title') ||
    typeof frontMatter.title !== 'string' ||
    Number.isNaN(order)
  ) {
    throw new ProjectDraftSaveError(
      'Scene front matter must retain title and numeric order.',
      'SCENE_INVALID',
    );
  }
}

export async function saveProjectDraft(
  request: ProjectDraftSaveRequest,
): Promise<Extract<ProjectDraftSaveResponse, { ok: true }>> {
  const projectPath = typeof request?.projectPath === 'string' ? request.projectPath.trim() : '';
  const projectId = typeof request?.projectId === 'string' ? request.projectId.trim() : '';
  const sceneId = typeof request?.sceneId === 'string' ? request.sceneId.trim() : '';
  if (
    !projectPath ||
    !projectId ||
    !sceneId ||
    typeof request.expectedMarkdown !== 'string' ||
    typeof request.markdown !== 'string'
  ) {
    throw new ProjectDraftSaveError(
      'Project, scene, baseline, and Markdown are required.',
      'INVALID_REQUEST',
    );
  }
  if (!/^[A-Za-z0-9_-]+$/.test(sceneId)) {
    throw new ProjectDraftSaveError(
      'Scene identity contains invalid filename characters.',
      'SCENE_INVALID',
    );
  }

  let resolvedProjectPath: string;
  try {
    resolvedProjectPath = (await resolveProjectRootPath(projectPath)).projectPath;
  } catch (error) {
    if (error instanceof ProjectLoaderAggregateError) {
      throw new ProjectDraftSaveError(error.message, 'PROJECT_NOT_FOUND');
    }
    throw error;
  }
  if (path.resolve(projectPath) !== resolvedProjectPath) {
    throw new ProjectDraftSaveError(
      'Draft saves require the canonical project root.',
      'PROJECT_INVALID',
    );
  }

  let metadata: Awaited<ReturnType<typeof readProjectMetadata>>;
  try {
    metadata = await readProjectMetadata(resolvedProjectPath);
  } catch (error) {
    if (error instanceof ProjectLoaderAggregateError) {
      throw new ProjectDraftSaveError(error.message, 'PROJECT_INVALID');
    }
    throw error;
  }
  if (!metadata.projectId || metadata.projectId !== projectId) {
    throw new ProjectDraftSaveError(
      'Loaded project identity no longer matches the save request.',
      'PROJECT_ID_MISMATCH',
    );
  }

  const targetPath = path.join(resolvedProjectPath, 'drafts', `${sceneId}.md`);
  let currentMarkdown: string;
  try {
    currentMarkdown = await fs.readFile(targetPath, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    throw new ProjectDraftSaveError(
      code === 'ENOENT'
        ? 'The selected scene draft no longer exists.'
        : 'Unable to read the selected scene draft.',
      code === 'ENOENT' ? 'SCENE_NOT_FOUND' : 'SAVE_FAILED',
    );
  }
  if (currentMarkdown !== request.expectedMarkdown) {
    throw new ProjectDraftSaveError(
      'The scene changed on disk after it was loaded. Reload before saving.',
      'STALE_DRAFT',
    );
  }

  const normalizedMarkdown = normalizeSavedMarkdown(request.markdown);
  validateDraftSaveMarkdown(sceneId, normalizedMarkdown);

  const tempPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.${randomUUID()}.tmp`,
  );
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(tempPath, 'wx');
    await handle.writeFile(normalizedMarkdown, { encoding: 'utf8' });
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(tempPath, targetPath);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await fs.rm(tempPath, { force: true }).catch(() => undefined);
    throw new ProjectDraftSaveError(
      error instanceof Error
        ? `Unable to save scene draft: ${error.message}`
        : 'Unable to save scene draft.',
      'SAVE_FAILED',
    );
  }

  return {
    ok: true,
    projectPath: resolvedProjectPath,
    projectId,
    sceneId,
    markdown: normalizedMarkdown,
  };
}

function mapSystemErrorCode(code?: string): ProjectLoadErrorCode {
  switch (code) {
    case 'ENOENT':
      return 'PROJECT_NOT_FOUND';
    default:
      return 'UNKNOWN';
  }
}

export async function loadProjectFromDisk(projectPath: string): Promise<{
  project: LoadedProject;
  issues: ProjectIssue[];
}> {
  const { projectPath: normalizedPath, issues: rootIssues } = await resolveProjectRootPath(projectPath);
  await ensureNotInvalidBootstrap(normalizedPath);
  const outline = await readOutline(normalizedPath);
  const { scenes, issues, drafts } = await readScenes(normalizedPath);
  const metadata = await readProjectMetadata(normalizedPath);
  const classification = classifyProjectBootstrapState(metadata, outline, scenes, drafts);
  const project: LoadedProject = {
    path: normalizedPath,
    projectId: metadata.projectId,
    name: metadata.name ?? path.basename(normalizedPath),
    outline,
    scenes,
    drafts,
    bootstrapState: classification.bootstrapState,
    bootstrapTemplate: metadata.bootstrapTemplate,
  };
  return { project, issues: [...rootIssues, ...issues, ...classification.issues] };
}

async function ensureNotInvalidBootstrap(projectPath: string): Promise<void> {
  const markerPath = path.join(projectPath, BOOTSTRAP_INVALID_MARKER);
  try {
    const stats = await fs.stat(markerPath);
    if (stats.isFile()) {
      throw new ProjectLoaderAggregateError(
        'Project bootstrap was marked invalid.',
        [
          {
            level: 'error',
            message: 'Project bootstrap marker indicates invalid project state.',
            path: markerPath,
          },
        ],
        'PROJECT_INVALID',
      );
    }
  } catch (error) {
    if (error instanceof ProjectLoaderAggregateError) {
      throw error;
    }
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function hasOutlineMarker(projectPath: string): Promise<boolean> {
  return fileExists(path.join(projectPath, 'outline.json'));
}

async function hasProjectMetadata(projectPath: string): Promise<boolean> {
  return fileExists(path.join(projectPath, 'project.json'));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveProjectRootPath(projectPath: string): Promise<{
  projectPath: string;
  issues: ProjectIssue[];
}> {
  const normalizedPath = path.resolve(projectPath);
  let currentPath = normalizedPath;
  while (true) {
    if ((await hasOutlineMarker(currentPath)) && (await hasProjectMetadata(currentPath))) {
      return currentPath === normalizedPath
        ? { projectPath: currentPath, issues: [] }
        : {
            projectPath: currentPath,
            issues: [
              {
                level: 'warning',
                message: 'Selected folder was nested inside a project root.',
                detail: `Using project root: ${currentPath}`,
                path: normalizedPath,
              },
            ],
          };
    }
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      break;
    }
    currentPath = parentPath;
  }

  currentPath = normalizedPath;
  while (true) {
    if (await hasOutlineMarker(currentPath)) {
      return currentPath === normalizedPath
        ? { projectPath: currentPath, issues: [] }
        : {
            projectPath: currentPath,
            issues: [
              {
                level: 'warning',
                message: 'Selected folder was nested inside a project root.',
                detail: `Using project root: ${currentPath}`,
                path: normalizedPath,
              },
            ],
          };
    }
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      break;
    }
    currentPath = parentPath;
  }

  return { projectPath: normalizedPath, issues: [] };
}

export async function readProjectMetadata(projectPath: string): Promise<{
  name?: string;
  projectId?: string;
  bootstrapState?: 'empty' | 'scaffold_initialized';
  bootstrapStateRaw?: string;
  bootstrapTemplate?: string;
}> {
  const metadataPath = path.join(projectPath, 'project.json');
  let parsed: {
    name?: string;
    project_id?: string;
    schema_version?: string;
    bootstrap_state?: string;
    bootstrap_template?: string;
  };
  try {
    const raw = await fs.readFile(metadataPath, 'utf8');
    parsed = JSON.parse(raw) as { name?: string; project_id?: string; schema_version?: string };
  } catch {
    // best effort: ignore missing or invalid metadata
    return {};
  }

  const schemaVersion = typeof parsed.schema_version === 'string' ? parsed.schema_version.trim() : '';
  if (schemaVersion && schemaVersion !== PROJECT_METADATA_SCHEMA_VERSION) {
    throw new ProjectLoaderAggregateError(
      'project.json uses an unsupported schema version.',
      [
        {
          level: 'error',
          message: `Expected schema_version "${PROJECT_METADATA_SCHEMA_VERSION}" but received "${schemaVersion}".`,
          path: metadataPath,
        },
      ],
      'PROJECT_UNSUPPORTED_VERSION',
    );
  }

  const projectId = typeof parsed.project_id === 'string' ? parsed.project_id.trim() : '';
  const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
  const bootstrapState =
    parsed.bootstrap_state === 'scaffold_initialized' || parsed.bootstrap_state === 'empty'
      ? parsed.bootstrap_state
      : undefined;
  const bootstrapStateRaw =
    typeof parsed.bootstrap_state === 'string' && !bootstrapState
      ? parsed.bootstrap_state.trim()
      : undefined;
  const bootstrapTemplate =
    typeof parsed.bootstrap_template === 'string' && parsed.bootstrap_template.trim().length > 0
      ? parsed.bootstrap_template.trim()
      : undefined;
  const metadata: {
    name?: string;
    projectId?: string;
    bootstrapState?: 'empty' | 'scaffold_initialized';
    bootstrapStateRaw?: string;
    bootstrapTemplate?: string;
  } = {};
  if (projectId.length > 0) {
    metadata.projectId = projectId;
  }
  if (name.length > 0) {
    metadata.name = name;
  }
  if (bootstrapState) {
    metadata.bootstrapState = bootstrapState;
  }
  if (bootstrapStateRaw) {
    metadata.bootstrapStateRaw = bootstrapStateRaw;
  }
  if (bootstrapTemplate) {
    metadata.bootstrapTemplate = bootstrapTemplate;
  }
  return metadata;
}

function classifyProjectBootstrapState(
  metadata: { bootstrapState?: 'empty' | 'scaffold_initialized'; bootstrapStateRaw?: string },
  outline: OutlineFile,
  scenes: SceneDraftMetadata[],
  drafts: Record<string, string>,
): {
  bootstrapState: 'empty' | 'scaffold_initialized' | 'partial';
  issues: ProjectIssue[];
} {
  const issues: ProjectIssue[] = [];
  const outlineSceneCount = outline.scenes.length;
  const parsedSceneCount = scenes.length;
  const draftCount = Object.keys(drafts).length;
  const hasOutlineStructure = outline.acts.length > 0 || outline.chapters.length > 0 || outlineSceneCount > 0;
  const hasPersistentContent = hasOutlineStructure || parsedSceneCount > 0 || draftCount > 0;
  const derivedState =
    !hasPersistentContent
      ? 'empty'
      : outlineSceneCount === parsedSceneCount && parsedSceneCount > 0
        ? 'scaffold_initialized'
        : 'partial';

  if (metadata.bootstrapStateRaw) {
    issues.push({
      level: 'warning',
      message: 'Project bootstrap metadata records an unsupported bootstrap state.',
      detail: `Unsupported bootstrap_state value: ${metadata.bootstrapStateRaw}.`,
    });
    if (!metadata.bootstrapState) {
      return {
        bootstrapState: 'partial',
        issues,
      };
    }
  }

  if (metadata.bootstrapState && metadata.bootstrapState !== derivedState) {
    issues.push({
      level: 'warning',
      message: 'Project bootstrap state does not match the persisted project structure.',
      detail: `Metadata says ${metadata.bootstrapState} but filesystem structure resolves to ${derivedState}.`,
    });
    return {
      bootstrapState: 'partial',
      issues,
    };
  }

  return {
    bootstrapState: metadata.bootstrapState ?? derivedState,
    issues,
  };
}

function normalizeBootstrapFailure(error: unknown): ProjectBootstrapFailure['error'] {
  if (error instanceof ProjectBootstrapError) {
    return {
      code: error.code,
      message: error.message,
      issues: error.issues,
    };
  }

  if (error instanceof ProjectLoaderAggregateError) {
    return {
      code: error.code === 'PROJECT_INVALID' || error.code === 'PROJECT_UNSUPPORTED_VERSION'
        ? error.code
        : 'BOOTSTRAP_FAILED',
      message: error.message,
      issues: error.issues,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return {
    code: 'BOOTSTRAP_FAILED',
    message,
  };
}

async function readOutline(projectPath: string): Promise<OutlineFile> {
  const outlinePath = path.join(projectPath, 'outline.json');
  let raw: string;
  try {
    raw = await fs.readFile(outlinePath, 'utf8');
  } catch (error) {
    const err = new ProjectLoaderAggregateError(
      'Unable to read outline.json for the selected project.',
      [
        {
          level: 'error',
          message: 'outline.json could not be read.',
          detail: error instanceof Error ? error.message : String(error),
          path: outlinePath,
        },
      ],
      'OUTLINE_NOT_FOUND',
    );
    if (error instanceof Error && 'code' in error) {
      (err as { originalCode?: string }).originalCode = (error as { code?: string }).code;
    }
    throw err;
  }

  let parsed: OutlineFile;
  try {
    parsed = JSON.parse(raw) as OutlineFile;
  } catch (error) {
    throw new ProjectLoaderAggregateError(
      'outline.json is not valid JSON.',
      [
        {
          level: 'error',
          message: 'outline.json failed to parse.',
          detail: error instanceof Error ? error.message : String(error),
          path: outlinePath,
        },
      ],
      'OUTLINE_INVALID',
    );
  }

  if (parsed.schema_version !== 'OutlineSchema v1') {
    throw new ProjectLoaderAggregateError(
      'outline.json uses an unsupported schema version.',
      [
        {
          level: 'error',
          message: `Expected schema_version "OutlineSchema v1" but received "${parsed.schema_version}".`,
          path: outlinePath,
        },
      ],
      'OUTLINE_INVALID',
    );
  }

  if (!Array.isArray(parsed.scenes)) {
    throw new ProjectLoaderAggregateError(
      'outline.json is missing a scenes array.',
      [
        {
          level: 'error',
          message: 'outline.json missing scenes array.',
          path: outlinePath,
        },
      ],
      'OUTLINE_INVALID',
    );
  }

  return parsed;
}

export async function runWithConcurrency<T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const effectiveConcurrency = Math.max(1, Math.min(concurrency, items.length));
  let index = 0;

  const runner = async () => {
    while (true) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) {
        return;
      }
      await worker(items[currentIndex]);
    }
  };

  await Promise.all(Array.from({ length: effectiveConcurrency }, runner));
}

async function readScenes(projectPath: string): Promise<{
  scenes: SceneDraftMetadata[];
  issues: ProjectIssue[];
  drafts: Record<string, string>;
}> {
  const draftsPath = path.join(projectPath, 'drafts');
  let entries: string[];
  try {
    entries = await fs.readdir(draftsPath);
  } catch (error) {
    const err = new ProjectLoaderAggregateError(
      'Could not read drafts directory.',
      [
        {
          level: 'error',
          message: 'drafts folder missing or inaccessible.',
          detail: error instanceof Error ? error.message : String(error),
          path: draftsPath,
        },
      ],
      'DRAFTS_NOT_FOUND',
    );
    if (error instanceof Error && 'code' in error) {
      (err as { originalCode?: string }).originalCode = (error as { code?: string }).code;
    }
    throw err;
  }

  const scenes: SceneDraftMetadata[] = [];
  const issues: ProjectIssue[] = [];
  const drafts: Record<string, string> = {};

  const markdownEntries = entries
    .filter((entry) => entry.toLowerCase().endsWith('.md'))
    .map((entry) => ({
      entry,
      filePath: path.join(draftsPath, entry),
    }));

  await runWithConcurrency(markdownEntries, MAX_SCENE_READ_CONCURRENCY, async ({ entry, filePath }) => {
    try {
      const scene = await parseSceneFile(filePath, entry);
      scenes.push(scene.metadata);
      drafts[scene.metadata.id] = scene.markdown;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const issue: ProjectIssue = {
        level: 'warning',
        message: 'Unable to parse scene metadata.',
        detail,
        path: filePath,
      };
      issues.push(issue);
    }
  });

  scenes.sort((a, b) => a.order - b.order);
  return { scenes, issues, drafts };
}

async function parseSceneFile(
  filePath: string,
  entry: string,
): Promise<{ metadata: SceneDraftMetadata; markdown: string }> {
  const raw = await fs.readFile(filePath, 'utf8');
  const meta = extractFrontMatter(raw);
  if (!meta) {
    throw new Error('Missing front matter header.');
  }

  const id = ensureString(meta.id);
  const title = ensureString(meta.title);
  const orderValue = meta.order;
  const order = typeof orderValue === 'number' ? orderValue : Number(orderValue);

  if (
    !id ||
    !Object.prototype.hasOwnProperty.call(meta, 'title') ||
    typeof meta.title !== 'string' ||
    Number.isNaN(order)
  ) {
    throw new Error('Front matter missing required fields (id, title, order).');
  }

  const expectedId = entry.replace(/\.md$/i, '');
  if (expectedId !== id) {
    throw new Error(
      `Scene id mismatch: expected ${expectedId} but front matter declared ${id}.`,
    );
  }

  const scene: SceneDraftMetadata = {
    id,
    title,
    order,
  };

  const optionalKeys: Array<keyof SceneDraftMetadata> = [
    'slug',
    'pov',
    'purpose',
    'goal',
    'conflict',
    'turn',
    'emotion_tag',
    'chapter_id',
  ];

  for (const key of optionalKeys) {
    const value = meta[key as keyof typeof meta];
    if (typeof value === 'string' && value.length > 0) {
      scene[key] = value as never;
    }
  }

  if (typeof meta.word_target === 'number') {
    scene.word_target = meta.word_target;
  } else if (typeof meta.word_target === 'string') {
    const parsedWordTarget = Number(meta.word_target);
    if (!Number.isNaN(parsedWordTarget)) {
      scene.word_target = parsedWordTarget;
    }
  }

  if (Array.isArray(meta.beats)) {
    scene.beats = meta.beats.map((beat) => ensureString(beat)).filter(Boolean);
  } else if (typeof meta.beats === 'string') {
    scene.beats = meta.beats
      .split(',')
      .map((beat) => ensureString(beat))
      .filter(Boolean);
  }

  return { metadata: scene, markdown: raw };
}

type FrontMatterRecord = Record<string, unknown>;

export function extractFrontMatter(raw: string): FrontMatterRecord | null {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return null;
  }

  const frontMatterLines: string[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '---') {
      break;
    }
    frontMatterLines.push(line);
  }

  const data: FrontMatterRecord = {};
  let currentKey: string | null = null;
  let buffer: string[] = [];

  const commitBuffer = () => {
    if (!currentKey) {
      return;
    }
    const value = parseFrontMatterValue(buffer.join('\n'));
    data[currentKey] = value;
    currentKey = null;
    buffer = [];
  };

  for (const line of frontMatterLines) {
    if (/^\s/.test(line)) {
      buffer.push(line.trim());
      continue;
    }

    if (currentKey) {
      commitBuffer();
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    currentKey = line.slice(0, separatorIndex).trim();
    const remainder = line.slice(separatorIndex + 1).trim();

    if (remainder.length === 0) {
      buffer = [];
      continue;
    }

    buffer = [remainder];
    commitBuffer();
  }

  if (currentKey) {
    commitBuffer();
  }

  return data;
}

export function parseFrontMatterValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }
    return inner
      .split(',')
      .map((item) => item.trim())
      .map((item) => item.replace(/^['"]|['"]$/g, ''))
      .filter((item) => item.length > 0);
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }

  return trimmed;
}

function ensureString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return '';
}

async function resolveSampleProjectPath(): Promise<string | null> {
  const knownRelative = path.join('sample_project', 'Esther_Estate');
  const candidates = [
    path.resolve(app.getAppPath(), '..', knownRelative),
    path.resolve(app.getAppPath(), knownRelative),
    path.resolve(app.getAppPath(), '..', '..', knownRelative),
    path.resolve(process.cwd(), knownRelative),
    path.resolve(process.cwd(), '..', knownRelative),
    path.resolve(process.cwd(), '..', '..', knownRelative),
  ];

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      // ignore and continue
    }
  }

  return null;
}
