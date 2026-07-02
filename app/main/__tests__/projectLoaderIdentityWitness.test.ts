import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it, vi } from 'vitest';

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

import { buildBlankOutline } from '../projectBootstrap';
import { loadProjectFromDisk } from '../projectLoaderIpc';

const tempRoots: string[] = [];

async function createTempProjectRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  tempRoots.push(root);
  await mkdir(join(root, 'drafts'));
  return root;
}

async function writeJson(targetPath: string, payload: unknown): Promise<void> {
  await writeFile(targetPath, JSON.stringify(payload, null, 2), 'utf8');
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((root) =>
      rm(root, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe('project loader identity witnesses', () => {
  it('returns a loaded project without projectId when project.json omits project_id', async () => {
    const projectRoot = await createTempProjectRoot('black-skies-loader-missing-id-');
    const outline = buildBlankOutline('proj_missing_identity_reference');

    await writeJson(join(projectRoot, 'outline.json'), outline);
    await writeJson(join(projectRoot, 'project.json'), {
      schema_version: 'ProjectMetadataSchema v1',
      name: 'Missing Identity Story',
    });

    const loaded = await loadProjectFromDisk(projectRoot);

    expect(loaded.project).toMatchObject({
      path: projectRoot,
      projectId: undefined,
      name: 'Missing Identity Story',
      bootstrapState: 'empty',
    });
    expect(loaded.project.drafts).toEqual({});
    expect(loaded.project.scenes).toEqual([]);
    expect(loaded.issues).toEqual([]);
  });

  it('preserves metadata projectId and filesystem path when directory basename differs from project_id', async () => {
    const projectRoot = await createTempProjectRoot('black-skies-loader-path-divergence-');
    const explicitProjectId = 'proj_alpha';

    expect(basename(projectRoot)).not.toBe(explicitProjectId);

    await writeJson(join(projectRoot, 'outline.json'), buildBlankOutline(explicitProjectId));
    await writeJson(join(projectRoot, 'project.json'), {
      schema_version: 'ProjectMetadataSchema v1',
      project_id: explicitProjectId,
      name: 'Alpha Divergence Story',
    });

    const loaded = await loadProjectFromDisk(projectRoot);

    expect(loaded.project).toMatchObject({
      path: projectRoot,
      projectId: explicitProjectId,
      name: 'Alpha Divergence Story',
      bootstrapState: 'empty',
    });
    expect(loaded.project.drafts).toEqual({});
    expect(loaded.project.scenes).toEqual([]);
    expect(loaded.issues).toEqual([]);
  });
});
