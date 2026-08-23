import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MANUSCRIPT_STRUCTURE_CHANNELS } from '../../shared/ipc/manuscriptStructure';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: unknown) => Promise<unknown> | unknown>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: unknown) => Promise<unknown> | unknown) => handlers.set(channel, handler)),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
    showOpenDialog: vi.fn(),
    appState: { isPackaged: false },
  };
});

vi.mock('electron', () => ({
  app: {
    get isPackaged() {
      return electronMocks.appState.isPackaged;
    },
  },
  ipcMain: electronMocks,
  dialog: { showOpenDialog: electronMocks.showOpenDialog },
}));

import { registerManuscriptStructureIpc, resetManuscriptStructureIpcForTests } from '../manuscriptStructureIpc';

const binding = {
  operationId: 'structure-op',
  projectId: 'project-a',
  projectPath: 'C:/projects/a',
  generation: 2,
};
const ready = { availability: 'ready' as const, sourceStatus: 'current' as const, projectId: 'project-a', projectPath: binding.projectPath, sourceText: '', document: { schemaVersion: 'BlackSkiesManuscriptStructure v1' as const, projectId: 'project-a', revision: 1, source: { fileName: 'source.md', sourceFingerprint: 'fingerprint', normalizedLength: 0, lineEnding: 'lf' as const }, blocks: [], proposals: [] }, message: null };

function invoke(channel: string, senderId: number, request?: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing handler: ${channel}`);
  return Promise.resolve(handler({ sender: { id: senderId } }, request));
}

describe('Manuscript Structure IPC authority', () => {
  const repository = {
    read: vi.fn(), discover: vi.fn(), setBoundary: vi.fn(), setProposalState: vi.fn(), renameProposal: vi.fn(),
    splitGroup: vi.fn(), mergeGroups: vi.fn(), reorderGroups: vi.fn(), apply: vi.fn(), importSource: vi.fn(),
  };

  beforeEach(() => {
    resetManuscriptStructureIpcForTests();
    electronMocks.handlers.clear();
    electronMocks.appState.isPackaged = false;
    electronMocks.showOpenDialog.mockReset().mockResolvedValue({ canceled: true, filePaths: [] });
    Object.values(repository).forEach((mock) => mock.mockReset().mockResolvedValue(ready));
    registerManuscriptStructureIpc({
      resolveWindowRole: (id) => id === 1 ? 'writing' : id === 2 ? 'command' : null,
      getWritingSnapshot: () => ({ generation: 2, project: { projectId: 'project-a', path: binding.projectPath } } as never),
      repositoryFactory: () => repository as never,
    });
  });

  it('restricts the seam to Writing Studio and binds reads to the active project', async () => {
    await expect(invoke(MANUSCRIPT_STRUCTURE_CHANNELS.get, 2, binding)).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(MANUSCRIPT_STRUCTURE_CHANNELS.get, 1, binding)).resolves.toEqual({ ok: true, data: ready });
    expect(repository.read).toHaveBeenCalledWith('project-a');
  });

  it('rejects stale project bindings before repository access', async () => {
    await expect(invoke(MANUSCRIPT_STRUCTURE_CHANNELS.discover, 1, { ...binding, generation: 1, expectedRevision: 1 })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    await expect(invoke(MANUSCRIPT_STRUCTURE_CHANNELS.get, 1, { ...binding, projectId: 'project-b' })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
    expect(repository.discover).not.toHaveBeenCalled();
    expect(repository.read).not.toHaveBeenCalled();
  });

  it('binds structural mutations to expected revisions and project identity', async () => {
    await invoke(MANUSCRIPT_STRUCTURE_CHANNELS.acceptProposal, 1, { ...binding, expectedRevision: 3, proposalId: 'proposal-a' });
    await invoke(MANUSCRIPT_STRUCTURE_CHANNELS.mergeGroups, 1, { ...binding, expectedRevision: 4, proposalIds: ['proposal-a', 'proposal-b'] });
    await invoke(MANUSCRIPT_STRUCTURE_CHANNELS.apply, 1, { ...binding, expectedRevision: 5 });
    expect(repository.setProposalState).toHaveBeenCalledWith('project-a', 3, 'proposal-a', 'accepted');
    expect(repository.mergeGroups).toHaveBeenCalledWith('project-a', 4, ['proposal-a', 'proposal-b']);
    expect(repository.apply).toHaveBeenCalledWith('project-a', 5);
  });

  it('never uses the deterministic Markdown chooser in a packaged application', async () => {
    const previousHooks = process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS;
    const previousPath = process.env.BLACKSKIES_E2E_STRUCTURE_MARKDOWN_PATH;
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS = '1';
    process.env.BLACKSKIES_E2E_STRUCTURE_MARKDOWN_PATH = 'C:/fixtures/intake.md';
    delete process.env.NODE_ENV;
    electronMocks.appState.isPackaged = true;
    electronMocks.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: ['C:/native/selected.md'] });

    try {
      await expect(invoke(MANUSCRIPT_STRUCTURE_CHANNELS.chooseMarkdown, 1)).resolves.toEqual({
        canceled: false,
        filePath: 'C:/native/selected.md',
      });
      expect(electronMocks.showOpenDialog).toHaveBeenCalledTimes(1);
    } finally {
      process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS = previousHooks;
      process.env.BLACKSKIES_E2E_STRUCTURE_MARKDOWN_PATH = previousPath;
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
