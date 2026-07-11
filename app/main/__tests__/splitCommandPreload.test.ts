import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SplitCommandOwnershipSyncMessage } from '../../shared/splitCommandAuthority';
import { SPLIT_COMMAND_CHANNELS } from '../../shared/ipc/splitCommand';
import type { ProjectSpineBridge } from '../../shared/ipc/projectSpine';

const contextBridgeMock = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(),
}));

const ipcListeners = vi.hoisted(() => new Map<string, Array<(...args: unknown[]) => void>>());

vi.mock('electron', () => ({
  contextBridge: contextBridgeMock,
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
      const handlers = ipcListeners.get(channel) ?? [];
      handlers.push(listener);
      ipcListeners.set(channel, handlers);
    }),
    removeListener: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
      const handlers = ipcListeners.get(channel) ?? [];
      ipcListeners.set(
        channel,
        handlers.filter((entry) => entry !== listener),
      );
    }),
  },
  shell: {
    openPath: vi.fn(),
  },
}));

vi.mock('../shared/config/runtime.js', () => ({
  DEFAULT_HEALTH_PROBE: {
    maxAttempts: 40,
    baseDelayMs: 250,
    maxDelayMs: 2000,
  },
  DEFAULT_SERVICE_PORT_RANGE: { min: 43750, max: 43850 },
  DEFAULT_RUNTIME_CONFIG: {
    service: {
      portRange: { min: 43750, max: 43850 },
      healthProbe: { maxAttempts: 40, baseDelayMs: 250, maxDelayMs: 2000 },
      allowedPythonExecutables: ['python'],
      bundledPythonPath: '',
    },
    budget: {
      softLimitUsd: 5,
      hardLimitUsd: 10,
      costPer1000WordsUsd: 0.02,
    },
    analytics: {
      emotionIntensity: {},
      defaultEmotionIntensity: 0.5,
      pace: { slowThreshold: 1.2, fastThreshold: 0.8 },
    },
    ui: {
      enableDocking: false,
      defaultPreset: 'standard',
      experimentalSplitCommandWorkspace: false,
      hotkeys: {
        enablePresetHotkeys: true,
        focusCycleOrder: ['outline', 'draftPreview', 'storyInsights', 'corkboard', 'timeline', 'critique'],
      },
    },
  },
  loadRuntimeConfig: vi.fn(() => ({
    service: {
      portRange: { min: 43750, max: 43850 },
      healthProbe: { maxAttempts: 40, baseDelayMs: 250, maxDelayMs: 2000 },
      allowedPythonExecutables: ['python'],
      bundledPythonPath: '',
    },
    budget: {
      softLimitUsd: 5,
      hardLimitUsd: 10,
      costPer1000WordsUsd: 0.02,
    },
    analytics: {
      emotionIntensity: {},
      defaultEmotionIntensity: 0.5,
      pace: { slowThreshold: 1.2, fastThreshold: 0.8 },
    },
    ui: {
      enableDocking: false,
      defaultPreset: 'standard',
      experimentalSplitCommandWorkspace: false,
      hotkeys: {
        enablePresetHotkeys: true,
        focusCycleOrder: ['outline', 'draftPreview', 'storyInsights', 'corkboard', 'timeline', 'critique'],
      },
    },
  })),
}));

function setContextIsolation(enabled: boolean): void {
  Object.defineProperty(process, 'contextIsolated', {
    configurable: true,
    value: enabled,
  });
}

function setArgv(args: string[]): void {
  process.argv = ['node', 'preload.js', ...args];
}

function getSplitCommandBridge():
  | {
      windowRole: string;
      requestOwnershipSync: () => Promise<SplitCommandOwnershipSyncMessage | null>;
      readOwnershipSync: () => SplitCommandOwnershipSyncMessage | null;
      subscribeOwnershipSync: (listener: (message: SplitCommandOwnershipSyncMessage) => void) => () => void;
    }
  | undefined {
  const exposeCalls = vi.mocked(contextBridgeMock.exposeInMainWorld).mock.calls;
  return exposeCalls.find(([key]) => key === 'splitCommand')?.[1] as
    | {
        windowRole: string;
        requestOwnershipSync: () => Promise<SplitCommandOwnershipSyncMessage | null>;
        readOwnershipSync: () => SplitCommandOwnershipSyncMessage | null;
        subscribeOwnershipSync: (listener: (message: SplitCommandOwnershipSyncMessage) => void) => () => void;
      }
    | undefined;
}

function getProjectSpineBridge(): ProjectSpineBridge | undefined {
  const exposeCalls = vi.mocked(contextBridgeMock.exposeInMainWorld).mock.calls;
  return exposeCalls.find(([key]) => key === 'projectSpine')?.[1] as
    | ProjectSpineBridge
    | undefined;
}

describe('splitCommand preload bridge', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.mocked(contextBridgeMock.exposeInMainWorld).mockReset();
    vi.mocked((await import('electron')).ipcRenderer.invoke).mockReset();
    ipcListeners.clear();
    setContextIsolation(true);
    setArgv([]);
  });

  afterEach(() => {
    setContextIsolation(false);
    setArgv([]);
  });

  it('keeps the stable path free of split command bridge exposure', async () => {
    await import('../preload');

    expect(
      vi.mocked(contextBridgeMock.exposeInMainWorld).mock.calls.map(([key]) => key),
    ).not.toContain('splitCommand');
  });

  it('exposes split command ownership sync only for experimental launch args', async () => {
    const ipcRenderer = (await import('electron')).ipcRenderer;
    const sampleMessage: SplitCommandOwnershipSyncMessage = {
      messageKind: 'ownership-snapshot',
      messageVersion: 1,
      pairIdentity: {
        pairId: 'split-command:session-123',
        sessionGeneration: 'session-123',
      },
      windowRole: 'secondary',
      authority: {
        windowRole: 'secondary',
        sharedSessionTruthOwner: 'primary',
        localPresentationStateOwner: 'secondary',
        staleSecondaryResurrectionForbidden: true,
        stateBoundaries: {
          sharedSessionTruth: 'shared-session-truth',
          localPresentationState: 'local-presentation-state',
          ephemeralUiState: 'ephemeral-ui-state',
        },
      },
      fallbackState: {
        pairHealthStatus: 'healthy',
        primaryCollapseReason: null,
        secondaryLossReason: null,
        rebuildBlockReason: null,
      },
      activeWindowIdentity: {
        pairIdentity: {
          pairId: 'split-command:session-123',
          sessionGeneration: 'session-123',
        },
        windowRole: 'secondary',
        focusOwner: 'secondary',
      },
      focusOwnershipState: {
        activeWindowIdentity: {
          pairIdentity: {
            pairId: 'split-command:session-123',
            sessionGeneration: 'session-123',
          },
          windowRole: 'secondary',
          focusOwner: 'secondary',
        },
        globalFocusOwner: 'primary',
        sharedFocusAuthorityOwner: 'primary',
        localFocusOwner: 'secondary',
        canOwnSharedFocus: false,
        canOwnLocalFocus: true,
        focusValidationReason: 'healthy',
      },
      inputRoutingAuthority: {
        activeWindowIdentity: {
          pairIdentity: {
            pairId: 'split-command:session-123',
            sessionGeneration: 'session-123',
          },
          windowRole: 'secondary',
          focusOwner: 'secondary',
        },
        globalFocusOwner: 'primary',
        sharedInputOwner: 'primary',
        localInputOwner: 'secondary',
        staleInputClaimsRejected: true,
        focusValidationReason: 'healthy',
      },
      mutationAuthority: {
        activeWindowIdentity: {
          pairIdentity: {
            pairId: 'split-command:session-123',
            sessionGeneration: 'session-123',
          },
          windowRole: 'secondary',
          focusOwner: 'secondary',
        },
        sharedMutationOwner: 'primary',
        localMutationOwner: 'secondary',
        sharedUndoOwner: 'primary',
        localUndoOwner: 'secondary',
        staleMutationClaimsRejected: true,
        mutationValidationReason: 'healthy',
      },
      validationReason: 'healthy',
    };
    vi.mocked(ipcRenderer.invoke).mockResolvedValue(sampleMessage);
    setArgv([
      '--blackskies-split-command-role=secondary',
      '--blackskies-split-command-pair-id=split-command:session-123',
      '--blackskies-split-command-session-generation=session-123',
    ]);

    await import('../preload');

    const bridge = getSplitCommandBridge();
    expect(bridge).toBeDefined();
    expect(bridge?.windowRole).toBe('secondary');
    const projectSpine = getProjectSpineBridge();
    expect(projectSpine?.windowRole).toBe('command');
    expect(projectSpine?.saveUnit).toBeUndefined();
    expect(projectSpine?.createUnit).toBeUndefined();
    expect(projectSpine?.renameUnit).toBeUndefined();
    expect(projectSpine?.reorderUnits).toBeUndefined();
    expect(projectSpine?.deleteUnit).toBeUndefined();
    const requested = await bridge!.requestOwnershipSync();
    expect(requested).toEqual(sampleMessage);
    expect(bridge!.readOwnershipSync()).toEqual(sampleMessage);

    const staleMessage: SplitCommandOwnershipSyncMessage = {
      ...sampleMessage,
      messageKind: 'ownership-fallback',
      pairIdentity: {
        pairId: 'split-command:session-older',
        sessionGeneration: 'session-older',
      },
      validationReason: 'primary-lost',
      fallbackState: {
        pairHealthStatus: 'primary-lost',
        primaryCollapseReason: 'closed',
        secondaryLossReason: null,
        rebuildBlockReason: null,
      },
    };

    const listeners = ipcListeners.get(SPLIT_COMMAND_CHANNELS.ownershipSync) ?? [];
    for (const listener of listeners) {
      listener({}, staleMessage);
    }

    expect(bridge!.readOwnershipSync()).toEqual(sampleMessage);
  });

  it('exposes manuscript mutation methods only to the primary Writing Studio role', async () => {
    setArgv([
      '--blackskies-split-command-role=primary',
      '--blackskies-split-command-pair-id=split-command:session-writing',
      '--blackskies-split-command-session-generation=session-writing',
    ]);

    await import('../preload');

    const projectSpine = getProjectSpineBridge();
    expect(projectSpine?.windowRole).toBe('writing');
    expect(projectSpine?.saveUnit).toEqual(expect.any(Function));
    expect(projectSpine?.createUnit).toEqual(expect.any(Function));
    expect(projectSpine?.renameUnit).toEqual(expect.any(Function));
    expect(projectSpine?.reorderUnits).toEqual(expect.any(Function));
    expect(projectSpine?.deleteUnit).toEqual(expect.any(Function));
  });
});
