import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, rename, rm, access, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import type { OutlineFile, ProjectIssue } from '../shared/ipc/projectLoader';

export const PROJECT_METADATA_SCHEMA_VERSION = 'ProjectMetadataSchema v1';
export const BOOTSTRAP_INVALID_MARKER = 'bootstrap.invalid.json';
export const BOOTSTRAP_MAX_ATTEMPTS = 8;
export const STARTER_SCAFFOLD_TEMPLATE = 'starter-scaffold-v1';

export type ProjectBootstrapState = 'empty' | 'scaffold_initialized';

export type ProjectBootstrapErrorCode =
  | 'INVALID_PARENT_PATH'
  | 'INVALID_TITLE'
  | 'NESTED_PROJECT_ROOT'
  | 'PROJECT_CONFLICT'
  | 'BOOTSTRAP_FAILED';

export class ProjectBootstrapError extends Error {
  constructor(
    message: string,
    readonly code: ProjectBootstrapErrorCode,
    readonly issues: ProjectIssue[] = [],
  ) {
    super(message);
    this.name = 'ProjectBootstrapError';
  }
}

export interface ProjectBootstrapRequest {
  parentPath: string;
  title: string;
  initialState?: ProjectBootstrapState;
}

export interface ProjectBootstrapResult {
  projectPath: string;
  projectId: string;
  projectName: string;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function sanitizeProjectTitle(rawTitle: string): string {
  return collapseWhitespace(
    rawTitle
      .normalize('NFKC')
      .replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/[\\/]+/g, ' '),
  );
}

export function sanitizeProjectSlug(rawTitle: string): string {
  const normalized = sanitizeProjectTitle(rawTitle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.length > 0 ? normalized.slice(0, 48) : 'project';
}

export function generateProjectId(rawTitle: string): string {
  const slug = sanitizeProjectSlug(rawTitle);
  const suffix = randomUUID().replace(/-/g, '').slice(0, 10);
  return `proj_${slug}_${suffix}`;
}

export function buildProjectBootstrapMetadata(
  projectId: string,
  projectTitle: string,
  initialState: ProjectBootstrapState = 'empty',
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    schema_version: PROJECT_METADATA_SCHEMA_VERSION,
    project_id: projectId,
    name: projectTitle,
    bootstrap_state: initialState,
  };
  if (initialState === 'scaffold_initialized') {
    metadata.bootstrap_template = STARTER_SCAFFOLD_TEMPLATE;
  }
  return metadata;
}

export function buildBlankOutline(projectId: string): OutlineFile {
  return {
    schema_version: 'OutlineSchema v1',
    outline_id: `outline_${projectId}`,
    project_id: projectId,
    acts: [],
    chapters: [],
    scenes: [],
  };
}

export function buildStarterOutline(projectId: string): OutlineFile {
  return {
    schema_version: 'OutlineSchema v1',
    outline_id: `outline_${projectId}`,
    project_id: projectId,
    acts: ['Act I'],
    chapters: [
      {
        id: 'ch_0001',
        order: 1,
        title: 'Chapter 1',
      },
    ],
    scenes: [
      {
        id: 'sc_0001',
        order: 1,
        title: 'Scene 1',
        chapter_id: 'ch_0001',
      },
    ],
  };
}

export function buildStarterSceneDraft(projectId: string): Record<string, string> {
  return {
    'sc_0001.md': `---
id: sc_0001
title: Scene 1
order: 1
chapter_id: ch_0001
---
Starter scaffold scene for ${projectId}.
`,
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function writeJsonAtomic(targetPath: string, payload: unknown): Promise<void> {
  const directory = dirname(targetPath);
  await mkdir(directory, { recursive: true });
  const tempPath = join(directory, `.${basename(targetPath)}.${randomUUID().replace(/-/g, '')}.tmp`);
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(tempPath, serialized, 'utf8');
  await rename(tempPath, targetPath);
}

async function cleanupPath(targetPath: string): Promise<void> {
  await rm(targetPath, { recursive: true, force: true });
}

async function writeBootstrapInvalidMarker(
  projectPath: string,
  details: Record<string, unknown>,
): Promise<void> {
  const markerPath = join(projectPath, BOOTSTRAP_INVALID_MARKER);
  await writeJsonAtomic(markerPath, {
    schema_version: 'ProjectBootstrapInvalid v1',
    status: 'invalid',
    ...details,
  });
}

export async function bootstrapFreshProject(
  request: ProjectBootstrapRequest,
): Promise<ProjectBootstrapResult> {
  const rawParentPath = typeof request.parentPath === 'string' ? request.parentPath.trim() : '';
  if (!rawParentPath) {
    throw new ProjectBootstrapError('Project parent path is required.', 'INVALID_PARENT_PATH');
  }
  const parentPath = resolve(rawParentPath);

  const projectTitle = sanitizeProjectTitle(request.title ?? '');
  if (!projectTitle) {
    throw new ProjectBootstrapError('Project title is required.', 'INVALID_TITLE');
  }

  const nestedProjectRoot = await findContainingProjectRoot(parentPath);
  if (nestedProjectRoot) {
    throw new ProjectBootstrapError(
      'Selected folder is inside an existing project root.',
      'NESTED_PROJECT_ROOT',
      [
        {
          level: 'error',
          message: 'Selected folder is inside an existing project root.',
          detail: `Choose a folder outside ${nestedProjectRoot}.`,
          path: parentPath,
        },
      ],
    );
  }

  try {
    await mkdir(parentPath, { recursive: true });
  } catch (error) {
    throw new ProjectBootstrapError(
      'Project parent path is not writable.',
      'INVALID_PARENT_PATH',
      [
        {
          level: 'error',
          message: 'Unable to create the project parent directory.',
          detail: error instanceof Error ? error.message : String(error),
          path: parentPath,
        },
      ],
    );
  }

  let lastConflictPath: string | null = null;
  for (let attempt = 0; attempt < BOOTSTRAP_MAX_ATTEMPTS; attempt += 1) {
    const projectId = generateProjectId(projectTitle);
    const projectPath = join(parentPath, projectId);
    lastConflictPath = projectPath;

    if (await pathExists(projectPath)) {
      continue;
    }

    const tempPrefix = join(parentPath, `.${projectId}.bootstrap-`);
    const tempWorkspace = await mkdtemp(tempPrefix);

    try {
      await createWorkspaceSkeletonWithIdentity(
        tempWorkspace,
        projectId,
        projectTitle,
        request.initialState ?? 'empty',
      );
      await rename(tempWorkspace, projectPath);
      return { projectPath, projectId, projectName: projectTitle };
    } catch (error) {
      await cleanupPath(tempWorkspace).catch(async () => {
        // If cleanup is unsafe or impossible, leave an explicit invalid marker behind.
        await writeBootstrapInvalidMarker(tempWorkspace, {
          project_id: projectId,
          project_title: projectTitle,
          parent_path: parentPath,
          reason: error instanceof Error ? error.message : String(error),
        }).catch(() => undefined);
      });

      if (await pathExists(projectPath)) {
        await cleanupPath(projectPath).catch(async () => {
          await writeBootstrapInvalidMarker(projectPath, {
            project_id: projectId,
            project_title: projectTitle,
            parent_path: parentPath,
            reason: error instanceof Error ? error.message : String(error),
          }).catch(() => undefined);
        });
      }

      const conflictDetected =
        error instanceof Error &&
        ((error as NodeJS.ErrnoException).code === 'EEXIST' ||
          (error as NodeJS.ErrnoException).code === 'EPERM');
      if (conflictDetected) {
        continue;
      }
      throw new ProjectBootstrapError(
        'Failed to create a fresh project bootstrap workspace.',
        'BOOTSTRAP_FAILED',
      );
    }
  }

  throw new ProjectBootstrapError(
    `Unable to create a unique project id after ${BOOTSTRAP_MAX_ATTEMPTS} attempts.`,
    'PROJECT_CONFLICT',
    lastConflictPath
      ? [
          {
            level: 'error',
            message: 'Project id collision could not be resolved.',
            path: lastConflictPath,
          },
        ]
      : [],
  );
}

async function createWorkspaceSkeletonWithIdentity(
  workspacePath: string,
  projectId: string,
  projectTitle: string,
  initialState: ProjectBootstrapState,
): Promise<void> {
  await mkdir(workspacePath, { recursive: true });
  await mkdir(join(workspacePath, 'drafts'), { recursive: true });
  await writeJsonAtomic(join(workspacePath, 'project.json'), buildProjectBootstrapMetadata(projectId, projectTitle, initialState));
  if (initialState === 'scaffold_initialized') {
    await writeJsonAtomic(join(workspacePath, 'outline.json'), buildStarterOutline(projectId));
    const starterDrafts = buildStarterSceneDraft(projectId);
    for (const [filename, contents] of Object.entries(starterDrafts)) {
      await writeFile(join(workspacePath, 'drafts', filename), contents, 'utf8');
    }
    return;
  }

  await writeJsonAtomic(join(workspacePath, 'outline.json'), buildBlankOutline(projectId));
}

async function findContainingProjectRoot(targetPath: string): Promise<string | null> {
  let currentPath = resolve(targetPath);

  while (true) {
    if (
      (await pathExists(join(currentPath, 'outline.json'))) &&
      (await pathExists(join(currentPath, 'project.json')))
    ) {
      return currentPath;
    }

    const parentPath = dirname(currentPath);
    if (parentPath === currentPath) {
      break;
    }
    currentPath = parentPath;
  }

  return null;
}
