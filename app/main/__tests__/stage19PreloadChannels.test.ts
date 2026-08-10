import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECT_SPINE_CHANNELS } from '../../shared/ipc/projectSpine';
import {
  SPLIT_COMMAND_CHANNELS,
  type SplitCommandOwnershipBridge,
  type SplitCommandSurfaceHostState,
} from '../../shared/ipc/splitCommand';
import { AI_CRITIQUE_CHANNELS } from '../../shared/ipc/aiCritique';
import { FEEDBACK_NOTE_CHANNELS } from '../../shared/ipc/feedbackNotes';
import { LIVING_OUTLINE_CHANNELS } from '../../shared/ipc/livingOutline';
import { LOGGING_CHANNELS } from '../../shared/ipc/logging';

const exposed = vi.hoisted(() => new Map<string, unknown>());
const ipcRendererMock = vi.hoisted(() => ({
  invoke: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  send: vi.fn(),
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((key: string, value: unknown) => exposed.set(key, value)),
  },
  ipcRenderer: ipcRendererMock,
}));

const originalArgv = [...process.argv];
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

function restoreGlobals(): void {
  process.argv = [...originalArgv];
  Object.assign(console, originalConsole);
}

describe('dedicated Stage 19 preload', () => {
  beforeEach(() => {
    restoreGlobals();
    vi.resetModules();
    exposed.clear();
    ipcRendererMock.invoke.mockReset();
    ipcRendererMock.on.mockReset();
    ipcRendererMock.removeListener.mockReset();
    ipcRendererMock.send.mockReset();
    process.argv = [
      'electron',
      '--blackskies-split-command-role=primary',
      '--blackskies-split-command-pair-id=pair-1',
      '--blackskies-split-command-session-generation=generation-1',
    ];
  });

  afterEach(restoreGlobals);

  it('keeps its channel table equal to canonical contracts', async () => {
    const { STAGE19_PRELOAD_CHANNELS } = await import('../stage19Preload');
    expect(STAGE19_PRELOAD_CHANNELS.projectSpine).toEqual(PROJECT_SPINE_CHANNELS);
    expect(STAGE19_PRELOAD_CHANNELS.splitCommand).toEqual(SPLIT_COMMAND_CHANNELS);
    expect(STAGE19_PRELOAD_CHANNELS.aiCritique).toEqual(AI_CRITIQUE_CHANNELS);
    expect(STAGE19_PRELOAD_CHANNELS.feedbackNotes).toEqual(FEEDBACK_NOTE_CHANNELS);
    expect(STAGE19_PRELOAD_CHANNELS.livingOutline).toEqual(LIVING_OUTLINE_CHANNELS);
    expect(STAGE19_PRELOAD_CHANNELS.diagnostics).toBe(LOGGING_CHANNELS.diagnostics);
  });

  it('exposes only the writing contracts to the primary window', async () => {
    await import('../stage19Preload');
    expect([...exposed.keys()].sort()).toEqual([
      'aiCritique',
      'feedbackNotes',
      'livingOutline',
      'projectSpine',
      'splitCommand',
    ]);
    expect(exposed.has('services')).toBe(false);
    expect(exposed.has('projectLoader')).toBe(false);
    expect(exposed.has('__electronApi')).toBe(false);
    expect(Object.keys(exposed.get('splitCommand') as object).sort()).toEqual(
      [
        'activateSurface',
        'readOwnershipSync',
        'readSurfaceHostState',
        'requestOwnershipSync',
        'requestSurfaceHostState',
        'subscribeOwnershipSync',
        'subscribeSurfaceHostState',
        'windowRole',
      ].sort(),
    );
  });

  it('exposes only prose-free contracts to the command window', async () => {
    process.argv = [
      'electron',
      '--blackskies-split-command-role=secondary',
      '--blackskies-split-command-pair-id=pair-1',
      '--blackskies-split-command-session-generation=generation-1',
    ];
    await import('../stage19Preload');
    expect([...exposed.keys()].sort()).toEqual(['projectSpine', 'splitCommand']);
    expect(exposed.has('aiCritique')).toBe(false);
    expect(exposed.has('feedbackNotes')).toBe(false);
    expect(exposed.has('livingOutline')).toBe(false);
  });

  it('fails closed when the split-window identity is incomplete', async () => {
    process.argv = ['electron', '--blackskies-split-command-role=primary'];
    await expect(import('../stage19Preload')).rejects.toThrow(
      'Stage 19 preload requires one complete split-window identity.',
    );
    expect(exposed.size).toBe(0);
  });

  it('validates surface-host reads, activations, and subscriptions before exposure', async () => {
    await import('../stage19Preload');
    const bridge = exposed.get('splitCommand') as SplitCommandOwnershipBridge;
    const commandSnapshot = {
      schemaVersion: 1 as const,
      role: 'command' as const,
      generation: 3,
      revision: 5,
      project: null,
      activeUnitId: null,
      recentProjects: [],
      dirtyUnitIds: [],
      saveState: { status: 'clean' as const, unitId: null, message: null },
      lastError: null,
      commandStatus: {
        schemaVersion: 1 as const,
        projectId: null,
        generation: 3,
        revision: 5,
        lifecycle: 'no-active-project' as const,
        recovery: 'none' as const,
        save: 'clean' as const,
      },
    };
    const state: SplitCommandSurfaceHostState = {
      schemaVersion: 1,
      primarySurface: 'writing',
      commandPlacement: 'current-window',
      secondaryStatus: 'closed',
      notice: null,
      projectId: null,
      generation: 3,
      revision: 5,
      commandSnapshot,
    };

    ipcRendererMock.invoke.mockResolvedValueOnce(state);
    await expect(bridge.requestSurfaceHostState()).resolves.toEqual(state);
    expect(bridge.readSurfaceHostState()).toEqual(state);

    const listener = vi.fn();
    const unsubscribe = bridge.subscribeSurfaceHostState(listener);
    expect(listener).toHaveBeenCalledWith(state);
    const changedHandler = ipcRendererMock.on.mock.calls.find(
      ([channel]) => channel === SPLIT_COMMAND_CHANNELS.surfaceHostChanged,
    )?.[1] as ((event: unknown, state: unknown) => void) | undefined;
    listener.mockClear();
    changedHandler?.({}, { ...state, commandSnapshot: { ...commandSnapshot, prose: 'private' } });
    expect(listener).not.toHaveBeenCalled();
    changedHandler?.({}, { ...state, primarySurface: 'command' });
    expect(listener).toHaveBeenCalledWith({ ...state, primarySurface: 'command' });
    unsubscribe();

    const request = {
      operationId: 'surface-command-current',
      projectId: null,
      generation: 3,
      targetSurface: 'command' as const,
      placement: 'current-window' as const,
    };
    ipcRendererMock.invoke.mockResolvedValueOnce({
      ok: true,
      state: { ...state, primarySurface: 'command' },
    });
    await expect(bridge.activateSurface(request)).resolves.toEqual({
      ok: true,
      state: { ...state, primarySurface: 'command' },
    });
    expect(ipcRendererMock.invoke).toHaveBeenLastCalledWith(
      SPLIT_COMMAND_CHANNELS.activateSurface,
      request,
    );

    ipcRendererMock.invoke.mockResolvedValueOnce({ ok: true, state: { ...state, generation: -1 } });
    await expect(bridge.activateSurface(request)).rejects.toThrow(
      'Surface host returned an invalid result.',
    );
  });
});
