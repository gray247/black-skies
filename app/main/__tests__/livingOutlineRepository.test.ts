import fs, { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LIVING_OUTLINE_SCHEMA_VERSION } from '../../shared/ipc/livingOutline';
import { buildLivingOutlineSourceAnchor } from '../../shared/livingOutlineAnchors';
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
    vi.restoreAllMocks();
    await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it('edge: a temporary replacement lock does not discard a valid Note save', async () => {
    const projectPath = await temporaryProject();
    const repo = new LivingOutlineRepository(projectPath);
    const input = { label: 'First thought', kind: 'fragment' as const, state: 'authored' as const, manuscriptUnitId: null };
    const first = await repo.create('project-a', 0, input);
    const originalRename = fs.rename.bind(fs);
    const rename = vi.spyOn(fs, 'rename').mockImplementation(originalRename)
      .mockRejectedValueOnce(Object.assign(new Error('Temporarily locked'), { code: 'EPERM' }));
    const saved = await repo.create('project-a', 1, { ...input, label: 'Second thought' });
    expect(saved.document.items).toHaveLength(2);
    expect(saved.document.items[0]).toEqual(first.document.items[0]);
    expect(rename).toHaveBeenCalledTimes(2);
    expect(await new LivingOutlineRepository(projectPath).read('project-a')).toEqual(saved);
  });

  async function gapFixture() {
    const projectPath = await temporaryProject();
    const repo = new LivingOutlineRepository(projectPath);
    const before = 'forest', after = 'bridge\n\nforest';
    const position = await buildLivingOutlineSourceAnchor('a', before, 0, 0);
    const filled = await buildLivingOutlineSourceAnchor('a', after, 0, 6);
    const created = await repo.create('project-a', 0, { label: 'Bridge plan', body: 'Keep the original intention.',
      kind: 'gap', state: 'planned', manuscriptUnitId: 'a', sourceAnchor: position, sourceAnchors: [position] });
    const gap = created.document.items[0]!;
    const pending = { id: 'fill-once', gapId: gap.id, unitId: 'a', direction: 'fill' as const,
      beforeFingerprint: position.sourceFingerprint, afterFingerprint: filled.sourceFingerprint,
      from: 0, to: 0, insertedLength: 8, groupId: 'bridge-group', groups: [{ id: 'bridge-group', label: 'bridge', spans: [filled] }],
      noteAnchors: [{ itemId: gap.id, anchor: filled, anchors: [filled], reconnect: true }], target: { kind: 'fragment' as const, state: 'authored' as const, anchor: filled } };
    await writeFile(join(projectPath, 'draft.md'), before);
    return { projectPath, repo, before, after, gap, pending, position };
  }

  it('gap: a failed preparation preserves original gap bytes and never writes prose', async () => {
    const f = await gapFixture(), target = join(f.projectPath, LIVING_OUTLINE_FILENAME);
    const original = await readFile(target, 'utf8');
    vi.spyOn(fs, 'rename').mockRejectedValue(Object.assign(new Error('No replacement'), { code: 'EACCES' }));
    await expect(f.repo.prepareGap('project-a', 1, f.pending)).rejects.toMatchObject({ code: 'WRITE_FAILED' });
    expect(await readFile(target, 'utf8')).toBe(original);
    expect(await readFile(join(f.projectPath, 'draft.md'), 'utf8')).toBe(f.before);
    expect((await f.repo.read('project-a')).document.items[0]).toEqual(f.gap);
  });

  it('gap: reopening before prose persistence retains one pending operation and blocks unrelated metadata overwrite', async () => {
    const f = await gapFixture();
    await f.repo.prepareGap('project-a', 1, f.pending);
    const reopened = await new LivingOutlineRepository(f.projectPath).read('project-a');
    expect(reopened.document.pendingGap).toEqual(f.pending);
    expect(reopened.document.items[0]).toEqual(f.gap);
    expect(await readFile(join(f.projectPath, 'draft.md'), 'utf8')).toBe(f.before);
    expect(JSON.stringify(reopened.document)).not.toContain('proposedProse');
    await expect(f.repo.delete('project-a', 2, f.gap.id)).rejects.toMatchObject({ code: 'STALE' });
    expect((await f.repo.read('project-a')).document).toEqual(reopened.document);
  });

  it('gap: metadata failure after prose persistence survives restart and finishes idempotently without reinsertion', async () => {
    const f = await gapFixture();
    await f.repo.prepareGap('project-a', 1, f.pending);
    await writeFile(join(f.projectPath, 'draft.md'), f.after);
    const target = join(f.projectPath, LIVING_OUTLINE_FILENAME), pendingBytes = await readFile(target, 'utf8');
    const rename = vi.spyOn(fs, 'rename').mockRejectedValue(Object.assign(new Error('Metadata lock'), { code: 'EBUSY' }));
    await expect(f.repo.finishGap('project-a', 2, f.pending.id)).rejects.toMatchObject({ code: 'WRITE_FAILED' });
    expect(await readFile(target, 'utf8')).toBe(pendingBytes);
    rename.mockRestore();
    const repo = new LivingOutlineRepository(f.projectPath);
    const saved = await repo.finishGap('project-a', 2, f.pending.id);
    expect(saved.document.items[0]).toMatchObject({ id: f.gap.id, label: f.gap.label, body: f.gap.body, kind: 'fragment', state: 'authored', sourceAnchor: f.pending.target.anchor });
    expect(saved.document.writingGroups).toHaveLength(1);
    expect(saved.document.pendingGap).toBeNull();
    expect(await repo.finishGap('project-a', 2, f.pending.id)).toEqual(saved);
    expect(await readFile(join(f.projectPath, 'draft.md'), 'utf8')).toBe(f.after);
  });

  it('gap: interrupted Undo retains filled Note, then restores the same gap identity and planning information', async () => {
    const f = await gapFixture();
    await f.repo.prepareGap('project-a', 1, f.pending);
    await writeFile(join(f.projectPath, 'draft.md'), f.after);
    await f.repo.finishGap('project-a', 2, f.pending.id);
    const undo = { ...f.pending, id: 'undo-once', direction: 'undo' as const, beforeFingerprint: f.pending.afterFingerprint,
      afterFingerprint: f.pending.beforeFingerprint, from: 0, to: 8, insertedLength: 0, groups: [],
      noteAnchors: [{ itemId: f.gap.id, anchor: f.position, anchors: [f.position], reconnect: true }],
      target: { kind: 'gap' as const, state: 'planned' as const, anchor: f.position } };
    await f.repo.prepareGap('project-a', 3, undo);
    const repo = new LivingOutlineRepository(f.projectPath);
    expect((await repo.read('project-a')).document.items[0]!.kind).toBe('fragment');
    await writeFile(join(f.projectPath, 'draft.md'), f.before);
    const result = await repo.finishGap('project-a', 4, undo.id);
    expect(result.document.items[0]).toMatchObject({ id: f.gap.id, kind: 'gap', label: f.gap.label, body: f.gap.body, sourceAnchor: f.position });
    expect(result.document.writingGroups).toEqual([]);
    expect(await repo.finishGap('project-a', 4, undo.id)).toEqual(result);
  });

  it('edge: a persistent replacement failure is bounded and preserves prior bytes', async () => {
    const projectPath = await temporaryProject();
    const repo = new LivingOutlineRepository(projectPath);
    const input = { label: 'Kept thought', kind: 'fragment' as const, state: 'authored' as const, manuscriptUnitId: null };
    await repo.create('project-a', 0, input);
    const target = join(projectPath, LIVING_OUTLINE_FILENAME);
    const before = await readFile(target, 'utf8');
    const rename = vi.spyOn(fs, 'rename').mockRejectedValue(Object.assign(new Error('Still locked'), { code: 'EACCES' }));
    await expect(repo.create('project-a', 1, { ...input, label: 'Unsaved thought' })).rejects.toMatchObject({ code: 'WRITE_FAILED' });
    expect(rename).toHaveBeenCalledTimes(3);
    expect(await readFile(target, 'utf8')).toBe(before);
    expect((await fs.readdir(projectPath)).filter(name => name.endsWith('.tmp'))).toEqual([]);
  });

  it('Notebook: restores only the deleted identity and placement after intervening edits, retaining duplicate labels', async () => {
    const projectPath = await temporaryProject(), repo = new LivingOutlineRepository(projectPath);
    const input = { label: 'Same title', body: 'First', kind: 'fragment' as const, state: 'authored' as const, manuscriptUnitId: null, noteScope: 'whole-story' as const };
    const first = (await repo.create('project-a', 0, input)).document.items[0]!;
    const second = (await repo.create('project-a', 1, { ...input, body: 'Second', noteScope: 'unattached' })).document.items[1]!;
    await repo.delete('project-a', 2, first.id);
    await repo.update('project-a', 3, second.id, { ...second, body: 'Changed second' });
    const third = (await repo.create('project-a', 4, { ...input, body: 'Later thought' })).document.items[1]!;
    const restored = await repo.restore('project-a', 5, first, second.id);
    expect(restored.document.items).toEqual([first, { ...second, body: 'Changed second', updatedAt: expect.any(String) }, third]);
    const bytes = await readFile(join(projectPath, LIVING_OUTLINE_FILENAME), 'utf8');
    await expect(repo.restore('project-a', 5, first, null)).rejects.toMatchObject({ code: 'STALE' });
    await expect(repo.restore('project-a', 6, first, null)).rejects.toMatchObject({ code: 'STALE' });
    expect(await readFile(join(projectPath, LIVING_OUTLINE_FILENAME), 'utf8')).toBe(bytes);
    expect(await new LivingOutlineRepository(projectPath).read('project-a')).toEqual(restored);
  });

  it('Notebook: restores original uncertain passage references and rejects contradictory intentional scopes', async () => {
    const projectPath = await temporaryProject(), repo = new LivingOutlineRepository(projectPath);
    const anchor = await buildLivingOutlineSourceAnchor('removed-unit', 'Original passage', 0, 8);
    const input = { label: 'Source thought', body: 'Preserve the source relationship', kind: 'fragment' as const, state: 'authored' as const,
      manuscriptUnitId: 'removed-unit', sourceAnchor: anchor, sourceAnchors: [anchor], noteScope: 'passage' as const, sourceWasSpan: true };
    const original = (await repo.create('project-a', 0, input)).document.items[0]!;
    await repo.delete('project-a', 1, original.id);
    expect((await repo.restore('project-a', 2, original, 'missing-neighbor')).document.items).toEqual([original]);
    const bytes = await readFile(join(projectPath, LIVING_OUTLINE_FILENAME), 'utf8');
    await expect(repo.create('project-a', 3, { ...input, noteScope: 'whole-story' })).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    await expect(repo.restore('project-a', 3, { ...original, id: 'bad', noteScope: 'unattached' }, null)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    expect(await readFile(join(projectPath, LIVING_OUTLINE_FILENAME), 'utf8')).toBe(bytes);
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

    await repository.create('project-a', 0, {
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

  it('persists source anchors without duplicating manuscript prose and clears them on relink', async () => {
    const projectPath = await temporaryProject();
    const repository = new LivingOutlineRepository(projectPath, () => new Date('2026-08-09T12:00:00.000Z'));
    const source = 'The signal crossed the water without a sound.';
    const sourceAnchor = await buildLivingOutlineSourceAnchor('unit-a', source, 4, 10);
    const created = await repository.create('project-a', 0, {
      label: 'Signal', kind: 'fragment', state: 'authored', manuscriptUnitId: 'unit-a', sourceAnchor,
    });
    const raw = await readFile(join(projectPath, LIVING_OUTLINE_FILENAME), 'utf8');

    expect(created.document.items[0]?.sourceAnchor).toEqual(sourceAnchor);
    expect(raw).not.toContain('signal');
    await expect(new LivingOutlineRepository(projectPath).read('project-a')).resolves.toEqual(created);
    const relinked = await repository.link('project-a', 1, created.document.items[0]!.id, 'unit-b');
    expect(relinked.document.items[0]?.sourceAnchor).toBeNull();
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
