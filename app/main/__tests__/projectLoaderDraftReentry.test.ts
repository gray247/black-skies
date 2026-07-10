import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
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

import { loadProjectFromDisk, saveProjectDraft } from '../projectLoaderIpc';

const tempRoots: string[] = [];

const BASELINE = `---
id: sc_0001
title: Arrival
order: 1
---
Original project-open text.
`;

const SAVED = `---
id: sc_0001
title: Arrival
order: 1
---
Saved text returned by normal project re-entry.
`;

async function createProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-normal-reentry-'));
  tempRoots.push(root);
  await mkdir(join(root, 'drafts'));
  await writeFile(
    join(root, 'project.json'),
    JSON.stringify({
      schema_version: 'ProjectMetadataSchema v1',
      project_id: 'proj_normal_reentry',
      name: 'Normal Re-entry',
    }),
    'utf8',
  );
  await writeFile(
    join(root, 'outline.json'),
    JSON.stringify({
      schema_version: 'OutlineSchema v1',
      outline_id: 'out_normal_reentry',
      project_id: 'proj_normal_reentry',
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

describe('normal project re-entry after manual draft save', () => {
  it('returns the durably saved Markdown under unchanged project and scene identity', async () => {
    const projectPath = await createProject();

    const firstLoad = await loadProjectFromDisk(projectPath);
    expect(firstLoad.project).toMatchObject({
      path: projectPath,
      projectId: 'proj_normal_reentry',
      name: 'Normal Re-entry',
    });
    expect(firstLoad.project.drafts.sc_0001).toBe(BASELINE);

    await saveProjectDraft({
      projectPath: firstLoad.project.path,
      projectId: firstLoad.project.projectId!,
      sceneId: 'sc_0001',
      expectedMarkdown: firstLoad.project.drafts.sc_0001,
      markdown: SAVED,
    });

    const secondLoad = await loadProjectFromDisk(projectPath);
    expect(secondLoad.project).toMatchObject({
      path: projectPath,
      projectId: 'proj_normal_reentry',
      name: 'Normal Re-entry',
    });
    expect(secondLoad.project.scenes.map((scene) => scene.id)).toContain('sc_0001');
    expect(secondLoad.project.drafts.sc_0001).toBe(SAVED);
    expect(secondLoad.issues).toEqual([]);
  });
});
