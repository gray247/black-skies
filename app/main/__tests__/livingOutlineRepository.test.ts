import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { LIVING_OUTLINE_SCHEMA_VERSION } from '../../shared/ipc/livingOutline';
import {
  LIVING_OUTLINE_FILENAME,
  LivingOutlineRepository,
  LivingOutlineRepositoryError,
} from '../livingOutlineRepository';

const temporaryRoots: string[] = [];

async function temporaryProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'black-skies-living-outline-'));
  temporaryRoots.push(root);
  return root;
}

describe('Living Outline project-local planning sidecar', () => {
  afterEach(async () => {
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('treats a missing sidecar as a valid empty optional outline', async () => {
    const projectPath = await temporaryProject();
    await expect(new LivingOutlineRepository(projectPath).read('project-a')).resolves.toEqual({
      availability: 'ready',
      document: {
        schemaVersion: LIVING_OUTLINE_SCHEMA_VERSION,
        projectId: 'project-a',
        revision: 0,
        items: [],
      },
      message: null,
    });
  });

  it('creates, links, moves, and reopens planning without touching manuscript truth files', async () => {
    const projectPath = await temporaryProject();
    const protectedFiles = {
      'project.json': '{"project":"unchanged"}\n',
      'outline.json': '{"outline":"unchanged"}\n',
      'draft.md': 'Protected manuscript prose.\n',
    };
    await Promise.all(Object.entries(protectedFiles).map(([name, body]) => writeFile(join(projectPath, name), body)));
    const repository = new LivingOutlineRepository(projectPath, () => new Date('2026-08-09T12:00:00.000Z'));

    const first = await repository.create('project-a', 0, {
      label: 'Opening signal', kind: 'fragment', state: 'authored', manuscriptUnitId: 'unit-a',
    });
    const second = await repository.create('project-a', 1, {
      label: 'Unknown middle', kind: 'gap', state: 'planned', manuscriptUnitId: null,
    });
    const moved = await repository.move('project-a', 2, second.document.items[1]!.id, -1);
    const linked = await repository.link('project-a', 3, moved.document.items[0]!.id, 'unit-b');

    expect(linked.document.items.map((item) => [item.label, item.manuscriptUnitId, item.kind, item.state])).toEqual([
      ['Unknown middle', 'unit-b', 'gap', 'planned'],
      ['Opening signal', 'unit-a', 'fragment', 'authored'],
    ]);
    await expect(new LivingOutlineRepository(projectPath).read('project-a')).resolves.toEqual(linked);
    for (const [name, body] of Object.entries(protectedFiles)) {
      await expect(readFile(join(projectPath, name), 'utf8')).resolves.toBe(body);
    }
  });

  it('keeps malformed and wrong-project files intact while writing remains independently available', async () => {
    const projectPath = await temporaryProject();
    const filePath = join(projectPath, LIVING_OUTLINE_FILENAME);
    await writeFile(filePath, '{not valid JSON');
    const repository = new LivingOutlineRepository(projectPath);

    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { items: [] } });
    await expect(repository.create('project-a', 0, {
      label: 'Do not overwrite', kind: 'fragment', state: 'planned', manuscriptUnitId: null,
    })).rejects.toMatchObject({ code: 'UNAVAILABLE' } satisfies Partial<LivingOutlineRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe('{not valid JSON');

    await writeFile(filePath, JSON.stringify({
      schemaVersion: LIVING_OUTLINE_SCHEMA_VERSION,
      projectId: 'project-b',
      revision: 0,
      items: [],
    }));
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded' });
  });

  it('rejects stale revisions instead of losing a concurrent planning change', async () => {
    const projectPath = await temporaryProject();
    const repository = new LivingOutlineRepository(projectPath);
    await repository.create('project-a', 0, {
      label: 'First', kind: 'fragment', state: 'planned', manuscriptUnitId: null,
    });
    await expect(repository.create('project-a', 0, {
      label: 'Stale', kind: 'fragment', state: 'planned', manuscriptUnitId: null,
    })).rejects.toMatchObject({ code: 'STALE' } satisfies Partial<LivingOutlineRepositoryError>);
  });

  it('serializes concurrent writers so the same expected revision cannot win twice', async () => {
    const projectPath = await temporaryProject();
    const first = new LivingOutlineRepository(projectPath);
    const second = new LivingOutlineRepository(projectPath);
    const attempts = await Promise.allSettled([
      first.create('project-a', 0, { label: 'First', kind: 'fragment', state: 'planned', manuscriptUnitId: null }),
      second.create('project-a', 0, { label: 'Second', kind: 'fragment', state: 'planned', manuscriptUnitId: null }),
    ]);
    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await expect(new LivingOutlineRepository(projectPath).read('project-a')).resolves.toMatchObject({
      availability: 'ready', document: { revision: 1, items: [{ label: expect.any(String) }] },
    });
  });
});
