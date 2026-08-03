import { mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
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
    expect(result.projectPath).toBe(await realpath(join(workspaceRoot, result.projectId)));
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
      bootstrapState: 'empty',
    });
    expect(loaded.project.scenes).toEqual([]);
    expect(loaded.project.drafts).toEqual({});
    expect(loaded.issues).toEqual([]);
  });

  it('round-trips a freshly created blank project through the loader without changing bootstrap state', async () => {
    const result = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Round Trip Blank',
    });

    const firstLoad = await loadProjectFromDisk(result.projectPath);
    const secondLoad = await loadProjectFromDisk(result.projectPath);

    expect(firstLoad.project).toMatchObject({
      path: result.projectPath,
      projectId: result.projectId,
      bootstrapState: 'empty',
    });
    expect(secondLoad.project).toMatchObject({
      path: result.projectPath,
      projectId: result.projectId,
      bootstrapState: 'empty',
    });
    expect(secondLoad.project.bootstrapTemplate).toBeUndefined();
    expect(secondLoad.issues).toEqual([]);
  });

  it('creates an explicit starter scaffold without inheriting sample-project state', async () => {
    const result = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: '  Starter / Scaffold  ',
      initialState: 'scaffold_initialized',
    });

    expect(result.projectName).toBe('Starter Scaffold');
    expect(result.projectId).toMatch(/^proj_starter-scaffold_[a-f0-9]{10}$/);

    const projectJson = await readJson(join(result.projectPath, 'project.json'));
    const outlineJson = await readJson(join(result.projectPath, 'outline.json'));
    const starterDraft = await readFile(join(result.projectPath, 'drafts', 'sc_0001.md'), 'utf8');

    expect(projectJson).toMatchObject({
      schema_version: 'ProjectMetadataSchema v1',
      project_id: result.projectId,
      name: 'Starter Scaffold',
      bootstrap_state: 'scaffold_initialized',
      bootstrap_template: 'starter-scaffold-v1',
    });
    expect(outlineJson).toMatchObject({
      schema_version: 'OutlineSchema v1',
      outline_id: `outline_${result.projectId}`,
      project_id: result.projectId,
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
    });
    expect(starterDraft).toContain('id: sc_0001');
    expect(starterDraft).toContain('chapter_id: ch_0001');
    await expect(stat(join(result.projectPath, 'history'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(stat(join(result.projectPath, 'recovery'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(stat(join(result.projectPath, 'snapshots'))).rejects.toMatchObject({
      code: 'ENOENT',
    });

    const loaded = await loadProjectFromDisk(result.projectPath);
    expect(loaded.project).toMatchObject({
      path: result.projectPath,
      projectId: result.projectId,
      name: 'Starter Scaffold',
      bootstrapState: 'scaffold_initialized',
      bootstrapTemplate: 'starter-scaffold-v1',
    });
    expect(loaded.project.scenes).toHaveLength(1);
    expect(loaded.project.drafts).toHaveProperty('sc_0001');
    expect(loaded.issues).toEqual([]);
  });

  it('round-trips a freshly created starter scaffold through the loader without changing bootstrap state', async () => {
    const result = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Round Trip Scaffold',
      initialState: 'scaffold_initialized',
    });

    const firstLoad = await loadProjectFromDisk(result.projectPath);
    const secondLoad = await loadProjectFromDisk(result.projectPath);

    expect(firstLoad.project).toMatchObject({
      path: result.projectPath,
      projectId: result.projectId,
      bootstrapState: 'scaffold_initialized',
      bootstrapTemplate: 'starter-scaffold-v1',
    });
    expect(secondLoad.project).toMatchObject({
      path: result.projectPath,
      projectId: result.projectId,
      bootstrapState: 'scaffold_initialized',
      bootstrapTemplate: 'starter-scaffold-v1',
    });
    expect(secondLoad.project.scenes).toHaveLength(1);
    expect(secondLoad.project.drafts).toHaveProperty('sc_0001');
    expect(secondLoad.issues).toEqual([]);
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

  it('classifies unsupported bootstrap metadata as partial with an explicit warning', async () => {
    const created = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Unsupported Story',
    });

    await writeFile(
      join(created.projectPath, 'project.json'),
      JSON.stringify(
        {
          schema_version: 'ProjectMetadataSchema v1',
          project_id: created.projectId,
          name: created.projectName,
          bootstrap_state: 'template_seeded',
        },
        null,
        2,
      ),
      'utf8',
    );

    const loaded = await loadProjectFromDisk(created.projectPath);
    expect(loaded.project.bootstrapState).toBe('partial');
    expect(loaded.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'warning',
          message: 'Project bootstrap metadata records an unsupported bootstrap state.',
        }),
      ]),
    );
  });

  it('classifies mismatched scaffold state as partial rather than silently repairing it', async () => {
    const created = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Partial Scaffold',
      initialState: 'scaffold_initialized',
    });

    await rm(join(created.projectPath, 'drafts', 'sc_0001.md'));

    const loaded = await loadProjectFromDisk(created.projectPath);
    expect(loaded.project.bootstrapState).toBe('partial');
    expect(loaded.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'warning',
          message: 'Project bootstrap state does not match the persisted project structure.',
        }),
      ]),
    );
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

  it('fails closed when the selected create location is inside an existing project root', async () => {
    const existingProject = await bootstrapFreshProject({
      parentPath: workspaceRoot,
      title: 'Existing Story',
    });
    const nestedParent = join(existingProject.projectPath, 'nested-save-location');

    await expect(
      bootstrapFreshProject({
        parentPath: nestedParent,
        title: 'Nested Story',
      }),
    ).rejects.toMatchObject({
      code: 'NESTED_PROJECT_ROOT',
    });

    await expect(stat(nestedParent)).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect((await stat(existingProject.projectPath)).isDirectory()).toBe(true);
    expect(await readJson(join(existingProject.projectPath, 'project.json'))).toMatchObject({
      project_id: existingProject.projectId,
      name: 'Existing Story',
    });
  });
});
