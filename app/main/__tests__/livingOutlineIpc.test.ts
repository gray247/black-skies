import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LIVING_OUTLINE_CHANNELS } from '../../shared/ipc/livingOutline';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => handlers.set(channel, handler)),
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

function invoke(channel: string, senderId: number, request: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing handler: ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('Living Outline IPC authority', () => {
  const repository = {
    read: vi.fn(), create: vi.fn(), update: vi.fn(), move: vi.fn(), link: vi.fn(), delete: vi.fn(),
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

  it('reports unavailable and failed writes honestly', async () => {
    repository.create.mockRejectedValueOnce(new LivingOutlineRepositoryError('UNAVAILABLE', 'Malformed sidecar.'));
    const request = { ...binding, expectedRevision: 0, label: 'Plan', kind: 'fragment', state: 'planned', manuscriptUnitId: null };
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, request)).resolves.toMatchObject({ ok: false, error: { code: 'LIVING_OUTLINE_UNAVAILABLE' } });
    repository.create.mockRejectedValueOnce(new LivingOutlineRepositoryError('WRITE_FAILED', 'Disk full.'));
    await expect(invoke(LIVING_OUTLINE_CHANNELS.createItem, 1, request)).resolves.toMatchObject({ ok: false, error: { code: 'LIVING_OUTLINE_WRITE_FAILED' } });
  });
});
