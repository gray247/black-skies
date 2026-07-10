import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: { getAppPath: vi.fn(() => process.cwd()) },
  dialog: { showOpenDialog: vi.fn() },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

import { saveProjectDraft } from '../projectLoaderIpc';

const tempRoots: string[] = [];

const BASELINE = `---
id: sc_0001
title: Arrival
order: 1
---
Original scene text.
`;

const EDITED = `---
id: sc_0001
title: Arrival
order: 1
---
Durably saved scene text.
`;

async function createProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-draft-save-'));
  tempRoots.push(root);
  await mkdir(join(root, 'drafts'));
  await writeFile(
    join(root, 'project.json'),
    JSON.stringify({
      schema_version: 'ProjectMetadataSchema v1',
      project_id: 'proj_save_test',
      name: 'Save Test',
    }),
    'utf8',
  );
  await writeFile(
    join(root, 'outline.json'),
    JSON.stringify({
      schema_version: 'OutlineSchema v1',
      outline_id: 'out_save_test',
      project_id: 'proj_save_test',
      acts: [],
      chapters: [],
      scenes: [{ id: 'sc_0001', order: 1, title: 'Arrival' }],
    }),
    'utf8',
  );
  await writeFile(join(root, 'drafts', 'sc_0001.md'), BASELINE, 'utf8');
  return root;
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('project loader draft save', () => {
  it('atomically replaces one validated scene draft', async () => {
    const projectPath = await createProject();

    const result = await saveProjectDraft({
      projectPath,
      projectId: 'proj_save_test',
      sceneId: 'sc_0001',
      expectedMarkdown: BASELINE,
      markdown: EDITED,
    });

    expect(result).toEqual({
      ok: true,
      projectPath,
      projectId: 'proj_save_test',
      sceneId: 'sc_0001',
      markdown: EDITED,
    });
    await expect(readFile(join(projectPath, 'drafts', 'sc_0001.md'), 'utf8')).resolves.toBe(
      EDITED,
    );
  });

  it('rejects a mismatched project identity without changing disk', async () => {
    const projectPath = await createProject();

    await expect(
      saveProjectDraft({
        projectPath,
        projectId: 'proj_wrong',
        sceneId: 'sc_0001',
        expectedMarkdown: BASELINE,
        markdown: EDITED,
      }),
    ).rejects.toMatchObject({ code: 'PROJECT_ID_MISMATCH' });
    await expect(readFile(join(projectPath, 'drafts', 'sc_0001.md'), 'utf8')).resolves.toBe(
      BASELINE,
    );
  });

  it('maps invalid project metadata to a project-invalid save failure', async () => {
    const projectPath = await createProject();
    await writeFile(
      join(projectPath, 'project.json'),
      JSON.stringify({
        schema_version: 'ProjectMetadataSchema v9',
        project_id: 'proj_save_test',
        name: 'Save Test',
      }),
      'utf8',
    );

    await expect(
      saveProjectDraft({
        projectPath,
        projectId: 'proj_save_test',
        sceneId: 'sc_0001',
        expectedMarkdown: BASELINE,
        markdown: EDITED,
      }),
    ).rejects.toMatchObject({ code: 'PROJECT_INVALID' });
    await expect(readFile(join(projectPath, 'drafts', 'sc_0001.md'), 'utf8')).resolves.toBe(
      BASELINE,
    );
  });

  it('rejects a stale baseline without overwriting newer disk content', async () => {
    const projectPath = await createProject();
    const newerDiskContent = BASELINE.replace('Original scene text.', 'Newer disk text.');
    await writeFile(join(projectPath, 'drafts', 'sc_0001.md'), newerDiskContent, 'utf8');

    await expect(
      saveProjectDraft({
        projectPath,
        projectId: 'proj_save_test',
        sceneId: 'sc_0001',
        expectedMarkdown: BASELINE,
        markdown: EDITED,
      }),
    ).rejects.toMatchObject({ code: 'STALE_DRAFT' });
    await expect(readFile(join(projectPath, 'drafts', 'sc_0001.md'), 'utf8')).resolves.toBe(
      newerDiskContent,
    );
  });

  it('rejects submitted front matter that changes scene identity', async () => {
    const projectPath = await createProject();

    await expect(
      saveProjectDraft({
        projectPath,
        projectId: 'proj_save_test',
        sceneId: 'sc_0001',
        expectedMarkdown: BASELINE,
        markdown: EDITED.replace('id: sc_0001', 'id: sc_9999'),
      }),
    ).rejects.toMatchObject({ code: 'SCENE_INVALID' });
    await expect(readFile(join(projectPath, 'drafts', 'sc_0001.md'), 'utf8')).resolves.toBe(
      BASELINE,
    );
  });
});
