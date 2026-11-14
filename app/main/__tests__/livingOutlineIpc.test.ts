import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LIVING_OUTLINE_CHANNELS } from '../../shared/ipc/livingOutline';
import { buildLivingOutlineSourceAnchor } from '../../shared/livingOutlineAnchors';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: { sender: { id: number } }, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: { sender: { id: number } }, request?: unknown) => Promise<unknown> | unknown) => handlers.set(channel, handler)),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({ ipcMain: electronMocks }));

import { LivingOutlineRepositoryError } from '../livingOutlineRepository';
import { registerLivingOutlineIpc, resetLivingOutlineIpcForTests } from '../livingOutlineIpc';

const projectPath = 'C:/projects/a';
const binding = {
  operationId: 'outline-op',
  projectId: 'project-a',
  projectPath,
  generation: 2,
};
const ready = {
  availability: 'ready' as const,
  document: {
    schemaVersion: 'BlackSkiesLivingOutline v1' as const,
    projectId: 'project-a',
    revision: 1,
    items: [],
  },
  message: null,
};

function snapshot() {
  return {
    schemaVersion: 1 as const,
    role: 'writing' as const,
    generation: 2,
    revision: 4,
    project: {
      projectId: 'project-a', path: projectPath, title: 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 1 }],
      drafts: { 'unit-a': 'Protected manuscript prose.' },
    },
    activeUnitId: 'unit-a', recentProjects: [], dirtyUnitIds: [],
    saveState: { status: 'clean' as const, unitId: null, message: null }, lastError: null,
    recovery: { status: 'none' as const, candidates: [] as const },
  };
}

function invoke(channel: string, senderId: number, request: unknown): Promise<unknown> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing handler: ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('Living Outline IPC authority', () => {
  const repository = {
    prepareGap: vi.fn(), finishGap: vi.fn(), restore: vi.fn(),
    replaceWritingState: vi.fn(), read: vi.fn(), create: vi.fn(), update: vi.fn(), move: vi.fn(), link: vi.fn(), delete: vi.fn(),
  };

  beforeEach(() => {
    resetLivingOutlineIpcForTests();
    electronMocks.handlers.clear();
    Object.values(repository).forEach((mock) => mock.mockReset().mockResolvedValue(ready));
    registerLivingOutlineIpc({
      resolveWindowRole: (id) => id === 1 ? 'writing' : id === 2 ? 'command' : null,
      getWritingSnapshot: snapshot,
      repositoryFactory: () => repository as never,
    });
  });

  it('exposes every operation only to the writing window and binds reads to the active project', async () => {
    await expect(invoke(LIVING_OUTLINE_CHANNELS.get, 2, binding)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.get, 1, binding)).resolves.toEqual({ ok: true, data: ready });
    expect(repository.read).toHaveBeenCalledWith('project-a');
  });

  it('gap: validates insertion and project authority; refuses finish before the exact proposed source is saved', async () => {
    const before = 'Protected manuscript prose.', after = 'bridge\n\n' + before;
    const position = await buildLivingOutlineSourceAnchor('unit-a', before, 0, 0);
    const anchor = await buildLivingOutlineSourceAnchor('unit-a', after, 0, 6);
    const pending = { id: 'gap-op', gapId: 'gap', unitId: 'unit-a', direction: 'fill' as const,
      beforeFingerprint: position.sourceFingerprint, afterFingerprint: anchor.sourceFingerprint,
      from: 0, to: 0, insertedLength: 8, groupId: 'group', groups: [{ id: 'group', label: 'bridge', spans: [anchor] }],
      noteAnchors: [{ itemId: 'gap', anchor, anchors: [anchor] }], target: { kind: 'fragment' as const, state: 'authored' as const, anchor } };
    const request = { ...binding, operationId: pending.id, expectedRevision: 1, pending, proposedProse: after };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.prepareGap, 2, request)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.prepareGap, 1, { ...request, generation: 1 })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.prepareGap, 1, { ...request, proposedProse: 'Different text' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_OUTLINE' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.prepareGap, 1, request)).resolves.toMatchObject({ ok: true });
    repository.read.mockResolvedValue({ ...ready, document: { ...ready.document, revision: 2, pendingGap: pending } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.finishGap, 1, { ...binding, operationId: pending.id, expectedRevision: 2 })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_OUTLINE' } });
    expect(repository.finishGap).not.toHaveBeenCalled();
    registerLivingOutlineIpc({ resolveWindowRole: () => 'writing', getWritingSnapshot: () => ({ ...snapshot(), project: { ...snapshot().project, drafts: { 'unit-a': after } } }), repositoryFactory: () => repository as never });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.finishGap, 1, { ...binding, operationId: pending.id, expectedRevision: 2 })).resolves.toMatchObject({ ok: true });
    expect(repository.finishGap).toHaveBeenCalledExactlyOnceWith('project-a', 2, pending.id);
  });

  it('rejects stale and wrong-project requests before any sidecar access', async () => {
    await expect(invoke(LIVING_OUTLINE_CHANNELS.get, 1, { ...binding, generation: 1 })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.get, 1, { ...binding, projectId: 'project-b' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.get, 1, { ...binding, projectPath: 'C:/projects/b' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    expect(repository.read).not.toHaveBeenCalled();
  });

  it('allows outline-first creation but rejects links to unknown manuscript units', async () => {
    const create = {
      ...binding, expectedRevision: 0, label: 'Unplaced thought', kind: 'fragment', state: 'planned', manuscriptUnitId: null,
    };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, create)).resolves.toEqual({ ok: true, data: ready });
    expect(repository.create).toHaveBeenCalledWith('project-a', 0, expect.objectContaining({ manuscriptUnitId: null }));

    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, { ...create, manuscriptUnitId: 'unit-missing' })).resolves.toMatchObject({
      ok: false, error: { code: 'UNKNOWN_MANUSCRIPT_UNIT' },
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('accepts a bounded source anchor only for its active manuscript unit', async () => {
    const sourceAnchor = await buildLivingOutlineSourceAnchor('unit-a', 'Protected manuscript prose.', 0, 9);
    const create = {
      ...binding, expectedRevision: 0, label: 'Protected', kind: 'fragment', state: 'authored',
      manuscriptUnitId: 'unit-a', sourceAnchor,
    };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, create)).resolves.toEqual({ ok: true, data: ready });
    expect(repository.create).toHaveBeenCalledWith('project-a', 0, expect.objectContaining({ sourceAnchor }));

    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, {
      ...create,
      sourceAnchor: { ...sourceAnchor, unitId: 'unit-other' },
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, {
      ...create,
      sourceAnchor: { ...sourceAnchor, selectionFingerprint: 'not-a-fingerprint' },
    })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

  it('binds update, movement, linking, and deletion without manuscript mutation authority', async () => {
    await invoke(LIVING_OUTLINE_CHANNELS.updateItem, 1, { ...binding, expectedRevision: 1, itemId: 'item-a', label: 'Changed plan', kind: 'gap', state: 'proposed' });
    await invoke(LIVING_OUTLINE_CHANNELS.moveItem, 1, { ...binding, expectedRevision: 1, itemId: 'item-a', direction: -1 });
    await invoke(LIVING_OUTLINE_CHANNELS.linkItem, 1, { ...binding, expectedRevision: 1, itemId: 'item-a', manuscriptUnitId: 'unit-a' });
    await invoke(LIVING_OUTLINE_CHANNELS.deleteItem, 1, { ...binding, expectedRevision: 1, itemId: 'item-a' });
    expect(repository.update).toHaveBeenCalledWith('project-a', 1, 'item-a', { label: 'Changed plan', kind: 'gap', state: 'proposed' });
    expect(repository.move).toHaveBeenCalledWith('project-a', 1, 'item-a', -1);
    expect(repository.link).toHaveBeenCalledWith('project-a', 1, 'item-a', 'unit-a');
    expect(repository.delete).toHaveBeenCalledWith('project-a', 1, 'item-a');
  });

  it('Notebook: guards single-Note restore by role and active project, without retargeting a lost source', async () => {
    const sourceAnchor = await buildLivingOutlineSourceAnchor('removed-unit', 'Old source', 0, 3);
    const item = { id: 'deleted-note', label: 'Same title', body: 'Original thought', kind: 'fragment', state: 'authored', manuscriptUnitId: 'removed-unit',
      sourceAnchor, sourceAnchors: [sourceAnchor], noteScope: 'passage', sourceWasSpan: true, createdAt: '2026-10-25T00:00:00.000Z', updatedAt: '2026-10-25T00:00:00.000Z' };
    const request = { ...binding, expectedRevision: 1, item, beforeId: null };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.restoreItem, 2, request)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.restoreItem, 1, { ...request, projectId: 'project-b' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    expect(repository.restore).not.toHaveBeenCalled();
    await expect(invoke(LIVING_OUTLINE_CHANNELS.restoreItem, 1, request)).resolves.toMatchObject({ ok: true });
    expect(repository.restore).toHaveBeenCalledExactlyOnceWith('project-a', 1, item, null);
  });

  it('reports unavailable and failed writes honestly', async () => {
    repository.create.mockRejectedValueOnce(new LivingOutlineRepositoryError('UNAVAILABLE', 'Malformed sidecar.'));
    const request = { ...binding, expectedRevision: 0, label: 'Plan', kind: 'fragment', state: 'planned', manuscriptUnitId: null };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, request)).resolves.toMatchObject({ ok: false, error: { code: 'LIVING_OUTLINE_UNAVAILABLE' } });
    repository.create.mockRejectedValueOnce(new LivingOutlineRepositoryError('WRITE_FAILED', 'Disk full.'));
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, request)).resolves.toMatchObject({ ok: false, error: { code: 'LIVING_OUTLINE_WRITE_FAILED' } });
  });
  it('binds writing group commits to Writing Studio and exact saved sources', async () => {
    const source = 'Protected manuscript prose.';
    const span = await buildLivingOutlineSourceAnchor('unit-a', source, 0, 9);
    const request = { ...binding, expectedRevision: 1, groups: [{ id: 'pin-one', label: 'Protected', spans: [span] }], noteAnchors: [] };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.replaceWritingState, 2, request)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.replaceWritingState, 1, { ...request, projectId: 'wrong' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    expect(repository.replaceWritingState).not.toHaveBeenCalled();
    await expect(invoke(LIVING_OUTLINE_CHANNELS.replaceWritingState, 1, request)).resolves.toMatchObject({ ok: true });
    expect(repository.replaceWritingState).toHaveBeenCalledTimes(1);
  });

  it('refuses stale, overlapping or malformed writing anchors before a metadata write', async () => {
    const span = await buildLivingOutlineSourceAnchor('unit-a', 'Protected manuscript prose.', 0, 9);
    const group = { id: 'pin-one', label: 'Protected', spans: [span] };
    const request = { ...binding, expectedRevision: 1, groups: [group], noteAnchors: [] };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.replaceWritingState, 1, { ...request, groups: [{ ...group, spans: [{ ...span, sourceFingerprint: 'f'.repeat(64) }] }] })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_OUTLINE' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.replaceWritingState, 1, { ...request, groups: [group, { ...group, id: 'overlap' }] })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(LIVING_OUTLINE_CHANNELS.replaceWritingState, 1, { ...request, noteAnchors: [{ itemId: 'note', anchor: null }] })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.replaceWritingState).not.toHaveBeenCalled();
  });

  it('validates every passage of a multi-source Note before invoking persistence', async () => {
    const first = await buildLivingOutlineSourceAnchor('unit-a', 'Protected manuscript prose.', 0, 9);
    const second = await buildLivingOutlineSourceAnchor('unit-a', 'Protected manuscript prose.', 10, 20);
    const request = { ...binding, expectedRevision: 1, label: 'Two passages', kind: 'fragment', state: 'authored', manuscriptUnitId: 'unit-a', sourceAnchor: first, sourceAnchors: [first, second] };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, request)).resolves.toMatchObject({ ok: true });
    expect(repository.create).toHaveBeenCalledWith('project-a', 1, expect.objectContaining({ sourceAnchors: [first, second] }));
    repository.create.mockClear();
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, { ...request, sourceAnchors: [first, { ...second, sourceFingerprint: 'c'.repeat(64) }] })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_OUTLINE' } });
    expect(repository.create).not.toHaveBeenCalled();
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, { ...request, sourceAnchors: [second] })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
  });

});
