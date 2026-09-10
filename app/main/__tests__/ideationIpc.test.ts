import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IDEATION_CHANNELS } from '../../shared/ipc/ideation';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => handlers.set(channel, handler)),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});
vi.mock('electron', () => ({ ipcMain: electronMocks }));

import { registerIdeationIpc, resetIdeationIpcForTests } from '../ideationIpc';
import { IdeationRepositoryError } from '../ideationRepository';

const projectPath = 'C:/projects/a';
const binding = { operationId: 'ideation-op', projectId: 'project-a', projectPath, generation: 2 };
const ready = { availability: 'ready' as const, document: { schemaVersion: 'BlackSkiesIdeation v1' as const, projectId: 'project-a', revision: 0, seeds: [], branches: [], premiseTests: [], promotionPackages: [], aiAlternatives: [], history: [] } };
function snapshot() {
  return {
    schemaVersion: 1 as const, role: 'writing' as const, generation: 2, revision: 4,
    project: { projectId: 'project-a', path: projectPath, title: 'Project A', schemaVersion: 'ProjectMetadataSchema v1' as const, units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 1 }], drafts: { 'unit-a': 'Draft.' } },
    activeUnitId: 'unit-a', recentProjects: [], dirtyUnitIds: [], saveState: { status: 'clean' as const, unitId: null, message: null }, lastError: null,
    recovery: { status: 'none' as const, candidates: [] as const },
  };
}
function invoke(channel: string, senderId: number, request: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error('Missing handler: ' + channel);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('Ideation IPC authority', () => {
  const repository = {
    read: vi.fn(), captureSeed: vi.fn(), updateSeed: vi.fn(), createBranch: vi.fn(),
    copyBranch: vi.fn(), mergeBranches: vi.fn(), splitBranch: vi.fn(),
    archiveBranch: vi.fn(), restoreBranch: vi.fn(), addPremiseVersion: vi.fn(),
    testPremise: vi.fn(), combineSeeds: vi.fn(), filterLibrary: vi.fn(),
    preparePromotion: vi.fn(), requestAiAlternatives: vi.fn(),
  };
  beforeEach(() => {
    resetIdeationIpcForTests(); electronMocks.handlers.clear();
    Object.values(repository).forEach((mock) => mock.mockReset().mockResolvedValue(ready));
    registerIdeationIpc({ resolveWindowRole: (id) => id === 1 ? 'writing' : id === 2 ? 'command' : null, getWritingSnapshot: snapshot, repositoryFactory: () => repository as never });
  });

  it('allows reads in Writing and Command while denying unknown window roles', async () => {
    await expect(invoke(IDEATION_CHANNELS.get, 1, binding)).resolves.toEqual({ ok: true, data: ready });
    await expect(invoke(IDEATION_CHANNELS.get, 2, binding)).resolves.toEqual({ ok: true, data: ready });
    await expect(invoke(IDEATION_CHANNELS.get, 3, binding)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_AUTHORIZED' } });
    expect(repository.read).toHaveBeenCalledTimes(2);
  });

  it('keeps all mutations Writing-only and passes the exact repository payload', async () => {
    const request = { ...binding, expectedRevision: 0, title: 'Seed', body: 'A fragment.', kind: 'fragment' as const, tags: ['one'], protected: false };
    await expect(invoke(IDEATION_CHANNELS.captureSeed, 2, request)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_AUTHORIZED' } });
    await expect(invoke(IDEATION_CHANNELS.captureSeed, 1, request)).resolves.toEqual({ ok: true, data: ready });
    expect(repository.captureSeed).toHaveBeenCalledWith('project-a', 0, request);
    const branchRequest = { ...binding, expectedRevision: 1, name: 'Branch', seedIds: ['seed-a'], premise: 'A premise.', unknowns: [] };
    await invoke(IDEATION_CHANNELS.createBranch, 1, branchRequest);
    expect(repository.createBranch).toHaveBeenCalledWith('project-a', 1, branchRequest);
  });

  it('rejects stale project/path/generation bindings before repository access', async () => {
    await expect(invoke(IDEATION_CHANNELS.get, 1, { ...binding, generation: 1 })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(IDEATION_CHANNELS.get, 1, { ...binding, projectId: 'project-b' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(IDEATION_CHANNELS.get, 1, { ...binding, projectPath: 'C:/projects/b' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(IDEATION_CHANNELS.get, 1, { ...binding, operationId: '' })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.read).not.toHaveBeenCalled();
  });

  it('routes branch lifecycle, testing, filtering, promotion, and explicit AI request', async () => {
    const life = { ...binding, expectedRevision: 3, branchId: 'branch-a' };
    await invoke(IDEATION_CHANNELS.archiveBranch, 1, life); await invoke(IDEATION_CHANNELS.restoreBranch, 1, { ...life, expectedRevision: 4 });
    expect(repository.archiveBranch).toHaveBeenCalledWith('project-a', 3, 'branch-a'); expect(repository.restoreBranch).toHaveBeenCalledWith('project-a', 4, 'branch-a');
    const testRequest = { ...binding, expectedRevision: 5, branchId: 'branch-a', answers: {}, purpose: null };
    await invoke(IDEATION_CHANNELS.testPremise, 1, testRequest); expect(repository.testPremise).toHaveBeenCalledWith('project-a', 5, testRequest);
    const filterRequest = { ...binding, filters: { tag: 'gothic' } };
    await invoke(IDEATION_CHANNELS.filterLibrary, 2, filterRequest); expect(repository.filterLibrary).toHaveBeenCalledWith('project-a', filterRequest.filters);
    const aiRequest = { ...binding, expectedRevision: 6, branchId: 'branch-a', authorRequested: true as const, purpose: 'compare' };
    await invoke(IDEATION_CHANNELS.requestAiAlternatives, 1, aiRequest); expect(repository.requestAiAlternatives).toHaveBeenCalledWith('project-a', 6, aiRequest);
  });

  it('rejects unknown keys and maps repository failures honestly', async () => {
    await expect(invoke(IDEATION_CHANNELS.get, 1, { ...binding, unexpected: true })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    const request = { ...binding, expectedRevision: 0, branchId: 'branch-a', name: 'Copied' };
    await expect(invoke(IDEATION_CHANNELS.copyBranch, 1, request)).resolves.toEqual({ ok: true, data: ready });
    repository.copyBranch.mockRejectedValueOnce(new IdeationRepositoryError('STALE', 'Reload.'));
    await expect(invoke(IDEATION_CHANNELS.copyBranch, 1, request)).resolves.toMatchObject({ ok: false, error: { code: 'STALE_IDEATION' } });
    repository.read.mockRejectedValueOnce(new IdeationRepositoryError('UNAVAILABLE', 'Malformed.'));
    await expect(invoke(IDEATION_CHANNELS.get, 1, binding)).resolves.toMatchObject({ ok: false, error: { code: 'IDEATION_UNAVAILABLE' } });
    repository.requestAiAlternatives.mockRejectedValueOnce(new IdeationRepositoryError('AI_NOT_REQUESTED', 'Explicit request required.'));
    await expect(invoke(IDEATION_CHANNELS.requestAiAlternatives, 1, { ...binding, expectedRevision: 0, branchId: 'branch-a', authorRequested: true, purpose: 'x' })).resolves.toMatchObject({ ok: false, error: { code: 'AI_NOT_REQUESTED' } });
  });

  it('rejects malformed nested payloads before touching the repository', async () => {
    await expect(invoke(IDEATION_CHANNELS.captureSeed, 1, { ...binding, expectedRevision: 0, title: 'Seed', body: 'x', kind: 'fragment', tags: 'gothic', protected: false })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(IDEATION_CHANNELS.testPremise, 1, { ...binding, expectedRevision: 0, branchId: 'branch-a', answers: [], purpose: null })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    await expect(invoke(IDEATION_CHANNELS.filterLibrary, 2, { ...binding, filters: { tag: 'gothic', unexpected: true } })).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.captureSeed).not.toHaveBeenCalled(); expect(repository.testPremise).not.toHaveBeenCalled(); expect(repository.filterLibrary).not.toHaveBeenCalled();
  });

  it('rejects an unknown promotion destination before repository access', async () => {
    const request = { ...binding, expectedRevision: 0, branchId: 'branch-a', destination: 'not-a-destination', seedIds: ['seed-a'], selectedText: 'A bounded promotion.' };
    await expect(invoke(IDEATION_CHANNELS.preparePromotion, 1, request)).resolves.toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } });
    expect(repository.preparePromotion).not.toHaveBeenCalled();
  });
});
