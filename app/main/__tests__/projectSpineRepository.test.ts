import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { bootstrapFreshProject } from '../projectBootstrap';
import { saveProjectDraft } from '../projectLoaderIpc';
import {
  createManuscriptUnit,
  deleteManuscriptUnit,
  loadProjectForSpine,
  renameManuscriptUnit,
  reorderManuscriptUnits,
} from '../projectSpineIpc';

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-stage19-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function blankProject(title = 'Local Project') {
  const root = await temporaryRoot();
  const created = await bootstrapFreshProject({ parentPath: root, title, initialState: 'empty' });
  return { root, created, project: await loadProjectForSpine(created.projectPath) };
}

describe('Stage 19 project-spine repository', () => {
  it('loads exact supported metadata with durable identity distinct from title and path', async () => {
    const { created, project } = await blankProject('The Display Title');

    expect(project).toMatchObject({
      path: created.projectPath,
      projectId: created.projectId,
      name: 'The Display Title',
      scenes: [],
      drafts: {},
    });
    expect(project.projectId).not.toBe(project.name);
  });

  it('rejects missing, invalid, unsupported, and cross-bound metadata honestly', async () => {
    const root = await temporaryRoot();
    const created = await bootstrapFreshProject({ parentPath: root, title: 'Invalid Cases' });
    const metadataPath = join(created.projectPath, 'project.json');

    await writeFile(metadataPath, '{not json', 'utf8');
    await expect(loadProjectForSpine(created.projectPath)).rejects.toMatchObject({ code: 'PROJECT_INVALID' });

    await writeFile(
      metadataPath,
      JSON.stringify({ schema_version: 'ProjectMetadataSchema v99', project_id: created.projectId, name: 'Future' }),
      'utf8',
    );
    await expect(loadProjectForSpine(created.projectPath)).rejects.toMatchObject({
      code: 'PROJECT_UNSUPPORTED_VERSION',
    });

    await writeFile(
      metadataPath,
      JSON.stringify({ schema_version: 'ProjectMetadataSchema v1', project_id: 'proj_other', name: 'Mismatch' }),
      'utf8',
    );
    await expect(loadProjectForSpine(created.projectPath)).rejects.toMatchObject({ code: 'PROJECT_INVALID' });
  });

  it('creates and honestly displays an untitled stable manuscript unit', async () => {
    const { project } = await blankProject();
    const created = await createManuscriptUnit(project, '');

    expect(created.unitId).toMatch(/^unit_[a-f0-9]{16}$/);
    expect(created.project.scenes).toEqual([
      expect.objectContaining({ id: created.unitId, title: '', order: 1 }),
    ]);
    expect(created.project.drafts[created.unitId]).toContain('title: ""');

    const reopened = await loadProjectForSpine(project.path);
    expect(reopened.scenes[0]).toMatchObject({ id: created.unitId, title: '', order: 1 });
  });

  it('rejects duplicate structural identity and ignores unreferenced draft files', async () => {
    const { project } = await blankProject();
    const created = await createManuscriptUnit(project, 'Canonical Unit');
    const orphanId = 'unit_orphan';
    await writeFile(
      join(project.path, 'drafts', `${orphanId}.md`),
      `---\nid: ${orphanId}\ntitle: "Orphan"\norder: 99\n---\nIgnored prose.\n`,
      'utf8',
    );
    const withoutOrphan = await loadProjectForSpine(project.path);
    expect(withoutOrphan.scenes.map((unit) => unit.id)).toEqual([created.unitId]);
    expect(withoutOrphan.drafts[orphanId]).toBeUndefined();

    const outlinePath = join(project.path, 'outline.json');
    const outline = JSON.parse(await readFile(outlinePath, 'utf8')) as {
      scenes: Array<Record<string, unknown>>;
    };
    await writeFile(
      outlinePath,
      JSON.stringify({ ...outline, scenes: [...outline.scenes, { ...outline.scenes[0] }] }),
      'utf8',
    );
    await expect(loadProjectForSpine(project.path)).rejects.toMatchObject({
      code: 'PROJECT_INVALID',
      message: expect.stringContaining('duplicate'),
    });
  });

  it('renames and reorders units without changing stable identity or crossing prose', async () => {
    const { project } = await blankProject();
    const first = await createManuscriptUnit(project, 'First');
    const second = await createManuscriptUnit(first.project, 'Second');
    const firstMarkdown = second.project.drafts[first.unitId];
    const secondMarkdown = second.project.drafts[second.unitId];

    const renamed = await renameManuscriptUnit(second.project, first.unitId, 'Renamed First');
    const reordered = await reorderManuscriptUnits(renamed, [second.unitId, first.unitId]);

    expect(reordered.scenes.map((unit) => [unit.id, unit.title, unit.order])).toEqual([
      [second.unitId, 'Second', 1],
      [first.unitId, 'Renamed First', 2],
    ]);
    expect(reordered.drafts[first.unitId]).toBe(firstMarkdown);
    expect(reordered.drafts[second.unitId]).toBe(secondMarkdown);
  });

  it('requires confirmation for prose deletion and reopens the remaining structure exactly', async () => {
    const { project } = await blankProject();
    const first = await createManuscriptUnit(project, 'Keep');
    const second = await createManuscriptUnit(first.project, 'Delete');
    const expectedMarkdown = second.project.drafts[second.unitId];
    const editedMarkdown = `${expectedMarkdown}Words that must not disappear silently.\n`;
    await saveProjectDraft({
      projectPath: second.project.path,
      projectId: second.project.projectId!,
      sceneId: second.unitId,
      expectedMarkdown,
      markdown: editedMarkdown,
    });
    const withProse = await loadProjectForSpine(second.project.path);

    await expect(deleteManuscriptUnit(withProse, second.unitId, false)).rejects.toMatchObject({
      code: 'UNIT_NOT_EMPTY',
    });
    expect(await readFile(join(withProse.path, 'drafts', `${second.unitId}.md`), 'utf8')).toContain(
      'Words that must not disappear silently.',
    );

    const deleted = await deleteManuscriptUnit(withProse, second.unitId, true);
    expect(deleted.nextActiveUnitId).toBe(first.unitId);
    const reopened = await loadProjectForSpine(withProse.path);
    expect(reopened.scenes.map((unit) => unit.id)).toEqual([first.unitId]);
    expect(reopened.drafts[first.unitId]).toBe(withProse.drafts[first.unitId]);
  });

  it('never saves Project A content into Project B', async () => {
    const a = await blankProject('Project A');
    const aUnit = await createManuscriptUnit(a.project, 'A Unit');
    const b = await blankProject('Project B');
    const bUnit = await createManuscriptUnit(b.project, 'B Unit');
    const bBefore = bUnit.project.drafts[bUnit.unitId];

    await expect(
      saveProjectDraft({
        projectPath: bUnit.project.path,
        projectId: aUnit.project.projectId!,
        sceneId: bUnit.unitId,
        expectedMarkdown: bBefore,
        markdown: `${bBefore}Project A text\n`,
      }),
    ).rejects.toMatchObject({ code: 'PROJECT_ID_MISMATCH' });

    expect((await loadProjectForSpine(bUnit.project.path)).drafts[bUnit.unitId]).toBe(bBefore);
    expect((await loadProjectForSpine(aUnit.project.path)).drafts[aUnit.unitId]).toBe(
      aUnit.project.drafts[aUnit.unitId],
    );
  });
});
