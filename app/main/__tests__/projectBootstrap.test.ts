import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => process.cwd()),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

import {
  bootstrapFreshProject,
  buildBlankOutline,
  buildProjectBootstrapMetadata,
  generateProjectId,
  sanitizeProjectSlug,
  sanitizeProjectTitle,
} from '../projectBootstrap';
import { loadProjectFromDisk } from '../projectLoaderIpc';

async function readJson(targetPath: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(targetPath, 'utf8')) as Record<string, unknown>;
}

describe('project bootstrap contract', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    workspaceRoot = await mkdtemp(join(tmpdir(), 'black-skies-bootstrap-'));
  });

  afterEach(async () => {
    await rm(workspaceRoot, { recursive: true, force: true });
  });

  it('sanitizes titles and generates collision-resistant project ids', () => {
    expect(sanitizeProjectTitle('  My / Story  ')).toBe('My Story');
    expect(sanitizeProjectSlug('  My / Story  ')).toMatch(/^my-story$/);
    expect(generateProjectId('My Story')).toMatch(/^proj_my-story_[a-f0-9]{10}$/);
    expect(buildProjectBootstrapMetadata('proj_alpha', 'Alpha')).toMatchObject({
      schema_version: 'ProjectMetadataSchema v1',
      project_id: 'proj_alpha',
      name: 'Alpha',
    });
    expect(buildBlankOutline('proj_alpha')).toMatchObject({
      schema_version: 'OutlineSchema v1',
      outline_id: 'outline_proj_alpha',
      project_id: 'proj_alpha',
      acts: [],
      chapters: [],
      scenes: [],
    });
  });

  it('creates a minimal loader-valid blank project without inheriting runtime state', async () => {
    const result = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: '  Brand / New Story  ',
    });

    expect(result.projectName).toBe('Brand New Story');
    expect(result.projectPath).toBe(join(workspaceRoot, result.projectId));
    expect(result.projectId).toMatch(/^proj_brand-new-story_[a-f0-9]{10}$/);

    expect((await stat(result.projectPath)).isDirectory()).toBe(true);
    expect((await stat(join(result.projectPath, 'drafts'))).isDirectory()).toBe(true);
    expect((await stat(join(result.projectPath, 'project.json'))).isFile()).toBe(true);
    expect((await stat(join(result.projectPath, 'outline.json'))).isFile()).toBe(true);

    await expect(stat(join(result.projectPath, 'history'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(stat(join(result.projectPath, 'recovery'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(stat(join(result.projectPath, 'snapshots'))).rejects.toMatchObject({
      code: 'ENOENT',
    });

    const projectJson = await readJson(join(result.projectPath, 'project.json'));
    const outlineJson = await readJson(join(result.projectPath, 'outline.json'));

    expect(projectJson).toMatchObject({
      schema_version: 'ProjectMetadataSchema v1',
      project_id: result.projectId,
      name: 'Brand New Story',
    });
    expect(outlineJson).toMatchObject({
      schema_version: 'OutlineSchema v1',
      outline_id: `outline_${result.projectId}`,
      project_id: result.projectId,
      acts: [],
      chapters: [],
      scenes: [],
    });

    const loaded = await loadProjectFromDisk(result.projectPath);
    expect(loaded.project).toMatchObject({
      path: result.projectPath,
      projectId: result.projectId,
      name: 'Brand New Story',
    });
    expect(loaded.project.scenes).toEqual([]);
    expect(loaded.project.drafts).toEqual({});
    expect(loaded.issues).toEqual([]);
  });

  it('generates unique ids for repeated same-title bootstrap requests', async () => {
    const first = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Same Title',
    });
    const second = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Same Title',
    });

    expect(first.projectId).not.toBe(second.projectId);
    expect(first.projectPath).not.toBe(second.projectPath);
    expect((await stat(first.projectPath)).isDirectory()).toBe(true);
    expect((await stat(second.projectPath)).isDirectory()).toBe(true);
  });

  it('fails closed on invalid titles and unsupported metadata versions', async () => {
    await expect(
      bootstrapFreshProject({
        parentPath: workspaceRoot,
        title: '   ',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_TITLE' });

    const created = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Versioned Story',
    });

    await writeFile(
      join(created.projectPath, 'project.json'),
      JSON.stringify(
        {
          schema_version: 'ProjectMetadataSchema v9',
          project_id: created.projectId,
          name: created.projectName,
        },
        null,
        2,
      ),
      'utf8',
    );

    await expect(loadProjectFromDisk(created.projectPath)).rejects.toMatchObject({
      code: 'PROJECT_UNSUPPORTED_VERSION',
    });
  });

  it('treats an explicit invalid bootstrap marker as a rejected project', async () => {
    const created = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Marked Story',
    });

    await writeFile(
      join(created.projectPath, 'bootstrap.invalid.json'),
      JSON.stringify({ status: 'invalid' }, null, 2),
      'utf8',
    );

    await expect(loadProjectFromDisk(created.projectPath)).rejects.toMatchObject({
      code: 'PROJECT_INVALID',
    });
  });

  it('rejects a non-directory parent path before creating a project', async () => {
    const blockedParent = join(workspaceRoot, 'parent-file');
    await writeFile(blockedParent, 'locked', 'utf8');

    await expect(
      bootstrapFreshProject({
        parentPath: blockedParent,
        title: 'Blocked Story',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_PARENT_PATH',
    });
  });
});
