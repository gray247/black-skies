import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECT_SPINE_CHANNELS } from '../../shared/ipc/projectSpine';
import { SPLIT_COMMAND_CHANNELS } from '../../shared/ipc/splitCommand';
import { AI_CRITIQUE_CHANNELS } from '../../shared/ipc/aiCritique';
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
    expect(STAGE19_PRELOAD_CHANNELS.diagnostics).toBe(LOGGING_CHANNELS.diagnostics);
  });

  it('exposes only the writing contracts to the primary window', async () => {
    await import('../stage19Preload');
    expect([...exposed.keys()].sort()).toEqual([
      'aiCritique',
      'projectSpine',
      'splitCommand',
    ]);
    expect(exposed.has('services')).toBe(false);
    expect(exposed.has('projectLoader')).toBe(false);
    expect(exposed.has('__electronApi')).toBe(false);
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
  });

  it('fails closed when the split-window identity is incomplete', async () => {
    process.argv = ['electron', '--blackskies-split-command-role=primary'];
    await expect(import('../stage19Preload')).rejects.toThrow(
      'Stage 19 preload requires one complete split-window identity.',
    );
    expect(exposed.size).toBe(0);
  });
});
