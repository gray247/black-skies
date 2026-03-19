import { app, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  EditorialCarryoverSnapshot,
  EditorialReviewSnapshot,
  EditorialRetryActionState,
  LoadedProject,
  OutlineFile,
  ProjectDialogResult,
  ProjectIssue,
  ProjectLoadRequest,
  ProjectLoadResponse,
  ProjectLoadFailure,
  SceneDraftMetadata,
  SceneEditorialReview,
  PROJECT_LOADER_CHANNELS,
} from '../shared/ipc/projectLoader';
import { authorizeProjectPath } from './layoutIpc.js';

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
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.getSamplePath);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.setDevProjectPath);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.acceptCurrentText);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.regenerateLocalRepair);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.markManualRewrite);
  ipcMain.removeHandler(PROJECT_LOADER_CHANNELS.clearManualRewrite);

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
        return { ok: true, project, issues };
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
        };
      }
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.getSamplePath,
    async (): Promise<string | null> => {
      if (devProjectPathOverride) {
        try {
          const stats = await fs.stat(devProjectPathOverride);
          if (stats.isDirectory()) {
            return devProjectPathOverride;
          }
        } catch {
          // fall through to regular sample path resolution
        }
      }
      const samplePath = await resolveSampleProjectPath();
      return samplePath;
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.acceptCurrentText,
    async (_event, request: { projectPath: string; sceneId: string }): Promise<{ ok: true }> => {
      await updateAcceptedReviewState(request.projectPath, request.sceneId, true);
      return { ok: true };
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.regenerateLocalRepair,
    async (
      _event,
      request: { projectPath: string; sceneId: string; chunkId: string },
    ): Promise<EditorialRetryActionState> => {
      return runRegenerateLocalRepair(request.projectPath, request.sceneId, request.chunkId);
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.markManualRewrite,
    async (_event, request: { projectPath: string; sceneId: string }): Promise<{ ok: true }> => {
      await updateManualReviewState(request.projectPath, request.sceneId, true);
      return { ok: true };
    },
  );

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.clearManualRewrite,
    async (_event, request: { projectPath: string; sceneId: string }): Promise<{ ok: true }> => {
      await updateManualReviewState(request.projectPath, request.sceneId, false);
      return { ok: true };
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
  const normalizedPath = path.resolve(projectPath);
  const outline = await readOutline(normalizedPath);
  const { scenes, issues, drafts } = await readScenes(normalizedPath);
  const metadata = await readProjectMetadata(normalizedPath);
  const editorialReviews = await readEditorialReviews(normalizedPath);
  const project: LoadedProject = {
    path: normalizedPath,
    name: metadata.name ?? path.basename(normalizedPath),
    outline,
    scenes,
    drafts,
    editorialReviews,
  };
  return { project, issues };
}

function manualReviewPath(projectPath: string): string {
  return path.join(projectPath, '.blackskies', 'long_form', 'manual_review.json');
}

function acceptedReviewPath(projectPath: string): string {
  return path.join(projectPath, '.blackskies', 'long_form', 'accepted_review.json');
}

function reviewActionStatePath(projectPath: string): string {
  return path.join(projectPath, '.blackskies', 'long_form', 'review_action_state.json');
}

async function readManualReviewState(projectPath: string): Promise<Record<string, boolean>> {
  const target = manualReviewPath(projectPath);
  try {
    const parsed = JSON.parse(await fs.readFile(target, 'utf8')) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed || {}).map(([sceneId, value]) => [sceneId, Boolean(value)]),
    );
  } catch {
    return {};
  }
}

async function readAcceptedReviewState(projectPath: string): Promise<Record<string, boolean>> {
  const target = acceptedReviewPath(projectPath);
  try {
    const parsed = JSON.parse(await fs.readFile(target, 'utf8')) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed || {}).map(([sceneId, value]) => [sceneId, Boolean(value)]),
    );
  } catch {
    return {};
  }
}

async function readRetryActionState(
  projectPath: string,
): Promise<Record<string, EditorialRetryActionState>> {
  const target = reviewActionStatePath(projectPath);
  try {
    const parsed = JSON.parse(await fs.readFile(target, 'utf8')) as Record<string, EditorialRetryActionState>;
    return Object.fromEntries(
      Object.entries(parsed || {}).map(([sceneId, value]) => [sceneId, value]),
    );
  } catch {
    return {};
  }
}

async function writeRetryActionState(
  projectPath: string,
  payload: Record<string, EditorialRetryActionState>,
): Promise<void> {
  const target = reviewActionStatePath(projectPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(payload, null, 2), 'utf8');
}

async function updateManualReviewState(
  projectPath: string,
  sceneId: string,
  marked: boolean,
): Promise<void> {
  const target = manualReviewPath(projectPath);
  const current = await readManualReviewState(projectPath);
  if (marked) {
    current[sceneId] = true;
  } else {
    delete current[sceneId];
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(current, null, 2), 'utf8');
}

async function updateAcceptedReviewState(
  projectPath: string,
  sceneId: string,
  accepted: boolean,
): Promise<void> {
  const target = acceptedReviewPath(projectPath);
  const current = await readAcceptedReviewState(projectPath);
  if (accepted) {
    current[sceneId] = true;
  } else {
    delete current[sceneId];
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(current, null, 2), 'utf8');
}

function currentServicePort(): number | null {
  const raw = process.env.BLACKSKIES_SERVICES_PORT ?? process.env.BLACKSKIES_E2E_PORT;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

async function performServiceJsonRequest(
  pathSuffix: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const port = currentServicePort();
  if (!port) {
    throw new Error('Service port is unavailable.');
  }
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/${pathSuffix}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Service responded with HTTP ${response.status}.`;
    try {
      const payload = (await response.json()) as { message?: unknown };
      if (typeof payload.message === 'string' && payload.message.trim()) {
        message = payload.message;
      }
    } catch {
      // keep generic message
    }
    throw new Error(message);
  }
  return (await response.json()) as Record<string, unknown>;
}

export async function runRegenerateLocalRepair(
  projectPath: string,
  sceneId: string,
  chunkId: string,
): Promise<EditorialRetryActionState> {
  const reviews = await readEditorialReviews(projectPath);
  const currentReview = reviews[sceneId];
  if (!currentReview?.review_snapshot?.failure_class) {
    throw new Error('Scene is not currently eligible for local repair retry.');
  }
  if (currentReview.accepted_review?.accepted) {
    throw new Error('Accepted scenes are not eligible for local repair retry.');
  }
  const failureClass = currentReview.review_snapshot.failure_class;
  const flagStateKey = `${chunkId}:${failureClass}`;
  const currentState = await readRetryActionState(projectPath);
  const existing = currentState[sceneId];
  if (existing && existing.flag_state_key === flagStateKey && existing.attempt_count >= 1) {
    return existing;
  }

  const requestedAt = new Date().toISOString();
  currentState[sceneId] = {
    action: 'regenerate_local_repair',
    status: 'running',
    scene_id: sceneId,
    chunk_id: chunkId,
    flag_state_key: flagStateKey,
    source_failure_class: failureClass,
    attempt_count: 1,
    requested_at: requestedAt,
  };
  await writeRetryActionState(projectPath, currentState);

  try {
    const result = await performServiceJsonRequest('long-form/retry-local-repair', {
      project_path: projectPath,
      chunk_id: chunkId,
    });
    const nextState: EditorialRetryActionState = {
      action: 'regenerate_local_repair',
      status: String(result.status || 'failed') as EditorialRetryActionState['status'],
      scene_id: sceneId,
      chunk_id: chunkId,
      flag_state_key: flagStateKey,
      source_failure_class: failureClass,
      attempt_count: 1,
      requested_at: requestedAt,
      completed_at: new Date().toISOString(),
      retry_snapshot: (result.retry_snapshot as Record<string, unknown> | null) ?? null,
      retry_result_review_snapshot:
        (result.retry_result_review_snapshot as EditorialReviewSnapshot | null) ?? null,
      retry_result_carryover_snapshot:
        (result.retry_result_carryover_snapshot as EditorialCarryoverSnapshot | null) ?? null,
      carryover_changed: Boolean(result.carryover_changed),
    };
    currentState[sceneId] = nextState;
    await writeRetryActionState(projectPath, currentState);
    return nextState;
  } catch (error) {
    const failedState: EditorialRetryActionState = {
      action: 'regenerate_local_repair',
      status: 'failed',
      scene_id: sceneId,
      chunk_id: chunkId,
      flag_state_key: flagStateKey,
      source_failure_class: failureClass,
      attempt_count: 1,
      requested_at: requestedAt,
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : String(error),
    };
    currentState[sceneId] = failedState;
    await writeRetryActionState(projectPath, currentState);
    return failedState;
  }
}

export async function readEditorialReviews(
  projectPath: string,
): Promise<Record<string, SceneEditorialReview>> {
  const chunksDir = path.join(projectPath, '.blackskies', 'long_form', 'chunks');
  try {
    const manualReviewState = await readManualReviewState(projectPath);
    const acceptedReviewState = await readAcceptedReviewState(projectPath);
    const retryActionState = await readRetryActionState(projectPath);
    const entries = await fs.readdir(chunksDir);
    const reviewByScene = new Map<
      string,
      { order: number; review: SceneEditorialReview }
    >();

    for (const entry of entries) {
      if (!entry.toLowerCase().endsWith('.json')) {
        continue;
      }
      const filePath = path.join(chunksDir, entry);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as Record<string, unknown>;
      } catch {
        continue;
      }
      const sceneIds = Array.isArray(parsed.scene_ids)
        ? parsed.scene_ids.map((value) => String(value))
        : [];
      if (sceneIds.length === 0) {
        continue;
      }
      const reviewSnapshot = parsed.review_snapshot as EditorialReviewSnapshot | undefined;
      const carryoverSnapshot = parsed.carryover_snapshot as EditorialCarryoverSnapshot | undefined;
      if (!reviewSnapshot && !carryoverSnapshot) {
        continue;
      }
        const review: SceneEditorialReview = {
          chunk_id: String(parsed.chunk_id ?? entry.replace(/\.json$/i, '')),
          review_snapshot: reviewSnapshot ?? null,
          carryover_snapshot: carryoverSnapshot ?? null,
          accepted_review: null,
          manual_review: null,
          retry_action_state: null,
        };
      const order =
        typeof parsed.order === 'number' ? parsed.order : Number(parsed.order ?? 0);
      for (const sceneId of sceneIds) {
        const existing = reviewByScene.get(sceneId);
        if (!existing || order >= existing.order) {
          reviewByScene.set(sceneId, { order, review });
        }
      }
    }

    return Object.fromEntries(
      Array.from(reviewByScene.entries()).map(([sceneId, value]) => {
        const review = value.review;
        if (acceptedReviewState[sceneId]) {
          review.accepted_review = {
            accepted: true,
            status: 'accepted_current_text',
          };
          review.carryover_snapshot = {
            carryover_risk: 'safe',
            carryover_mode: 'safe',
            carryover_allowed: true,
            failure_class:
              review.carryover_snapshot?.failure_class ??
              review.review_snapshot?.failure_class,
          };
        }
        if (manualReviewState[sceneId]) {
          review.manual_review = {
            marked: true,
            status: 'manual_rewrite_requested',
          };
        }
        if (retryActionState[sceneId]) {
          review.retry_action_state = retryActionState[sceneId];
          if (
            !review.accepted_review?.accepted &&
            (review.retry_action_state.status === 'succeeded' ||
              review.retry_action_state.status === 'still_flagged') &&
            review.retry_action_state.retry_result_carryover_snapshot
          ) {
            review.carryover_snapshot = review.retry_action_state.retry_result_carryover_snapshot;
          }
        }
        return [sceneId, review];
      }),
    );
  } catch {
    const manualReviewState = await readManualReviewState(projectPath);
    const acceptedReviewState = await readAcceptedReviewState(projectPath);
    const retryActionState = await readRetryActionState(projectPath);
    return Object.fromEntries(
      Array.from(
        new Set([
          ...Object.keys(manualReviewState),
          ...Object.keys(acceptedReviewState),
          ...Object.keys(retryActionState),
        ]),
      ).map((sceneId) => [
        sceneId,
        {
          chunk_id: `manual:${sceneId}`,
          review_snapshot: null,
          carryover_snapshot: acceptedReviewState[sceneId]
            ? {
                carryover_risk: 'safe',
                carryover_mode: 'safe',
                carryover_allowed: true,
              }
            : null,
          accepted_review: acceptedReviewState[sceneId]
            ? {
                accepted: true,
                status: 'accepted_current_text',
              }
            : null,
          manual_review: manualReviewState[sceneId]
            ? {
                marked: true,
                status: 'manual_rewrite_requested',
              }
            : null,
          retry_action_state: retryActionState[sceneId] ?? null,
        },
      ]),
    );
  }
}

async function readProjectMetadata(projectPath: string): Promise<{ name?: string }> {
  const metadataPath = path.join(projectPath, 'project.json');
  try {
    const raw = await fs.readFile(metadataPath, 'utf8');
    const parsed = JSON.parse(raw) as { name?: string };
    if (typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
      return { name: parsed.name };
    }
  } catch {
    // best effort: ignore missing or invalid metadata
  }
  return {};
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

  if (!id || !title || Number.isNaN(order)) {
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
