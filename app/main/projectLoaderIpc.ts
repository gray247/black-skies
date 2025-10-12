import { app, dialog, ipcMain } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  LoadedProject,
  OutlineFile,
  ProjectDialogResult,
  ProjectIssue,
  ProjectLoadRequest,
  ProjectLoadResponse,
  ProjectLoadFailure,
  SceneDraftMetadata,
  PROJECT_LOADER_CHANNELS,
} from '../shared/ipc/projectLoader';

const ISSUE_PREFIX = '[projectLoader]';
export const MAX_SCENE_READ_CONCURRENCY = 8;

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

  ipcMain.handle(
    PROJECT_LOADER_CHANNELS.openDialog,
    async (): Promise<ProjectDialogResult> => {
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
      const samplePath = await resolveSampleProjectPath();
      return samplePath;
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

async function loadProjectFromDisk(projectPath: string): Promise<{
  project: LoadedProject;
  issues: ProjectIssue[];
}> {
  const normalizedPath = path.resolve(projectPath);
  const outline = await readOutline(normalizedPath);
  const { scenes, issues, drafts } = await readScenes(normalizedPath);
  const project: LoadedProject = {
    path: normalizedPath,
    name: path.basename(normalizedPath),
    outline,
    scenes,
    drafts,
  };
  return { project, issues };
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
    path.resolve(process.cwd(), knownRelative),
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
