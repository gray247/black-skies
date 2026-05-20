import type { BrowserWindowConstructorOptions } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPLIT_COMMAND_CHANNELS } from '../../shared/ipc/splitCommand';

const browserWindowState = {
  instances: [] as BrowserWindowMock[],
  failOnInstance: 0,
};
const ipcHandlers = new Map<string, (...args: unknown[]) => unknown>();

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

let experimentalSplitCommandWorkspace = false;

class BrowserWindowMock {
  static fromWebContents = vi.fn((webContents: { owner?: BrowserWindowMock } | null) =>
    webContents?.owner ?? null,
  );

  readonly options: BrowserWindowConstructorOptions;
  readonly webContents = {
    owner: undefined as BrowserWindowMock | undefined,
    setWindowOpenHandler: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const handlers = this.webContentsListeners.get(event) ?? [];
      handlers.push(handler);
      this.webContentsListeners.set(event, handlers);
    }),
    send: vi.fn((..._args: unknown[]) => {}),
    emit: (event: string, ...args: unknown[]): void => {
      for (const handler of this.webContentsListeners.get(event) ?? []) {
        handler(...args);
      }
    },
    openDevTools: vi.fn(),
  };

  private readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private readonly webContentsListeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private destroyed = false;

  constructor(options: BrowserWindowConstructorOptions) {
    if (
      browserWindowState.failOnInstance > 0 &&
      browserWindowState.instances.length + 1 === browserWindowState.failOnInstance
    ) {
      throw new Error('split command secondary launch failed');
    }

    this.options = options;
    this.webContents.owner = this;
    browserWindowState.instances.push(this);
  }

  on(event: string, handler: (...args: unknown[]) => void): this {
    const handlers = this.listeners.get(event) ?? [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(...args);
    }
  }

  async loadURL(): Promise<void> {}

  async loadFile(): Promise<void> {}

  isDestroyed(): boolean {
    return this.destroyed;
  }

  isMinimized(): boolean {
    return false;
  }

  restore(): void {}

  focus(): void {}

  show(): void {}

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.emit('closed');
  }
}

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
    whenReady: vi.fn(() => Promise.resolve()),
    on: vi.fn(),
    quit: vi.fn(),
    requestSingleInstanceLock: vi.fn(() => true),
    setAppUserModelId: vi.fn(),
  },
  BrowserWindow: BrowserWindowMock,
  dialog: {
    showErrorBox: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => {
      ipcHandlers.set(channel, listener);
    }),
    removeHandler: vi.fn(),
  },
  shell: {
    openPath: vi.fn(),
  },
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn((path: string) => String(path).replace(/\\/g, '/').includes('/dist/index.html')),
    statSync: vi.fn(() => ({
      isFile: () => true,
    })),
  },
  existsSync: vi.fn((path: string) => String(path).replace(/\\/g, '/').includes('/dist/index.html')),
  statSync: vi.fn(() => ({
    isFile: () => true,
  })),
}));

vi.mock('../logging.js', () => ({
  getLogger: vi.fn(() => logger),
  initializeMainLogging: vi.fn(async () => {}),
  logWithLevel: vi.fn(),
  getDiagnosticsLogFilePath: vi.fn(() => null),
  registerRendererLogSink: vi.fn(),
  shutdownLogging: vi.fn(async () => {}),
}));

vi.mock('../projectLoaderIpc.js', () => ({
  registerProjectLoaderIpc: vi.fn(),
}));

vi.mock('../layoutIpc.js', () => ({
  registerLayoutIpc: vi.fn(),
}));

vi.mock('../serviceResolution.js', () => ({
  resolveConfiguredServicePort: vi.fn(() => null),
}));

vi.mock('../../shared/config/runtime.js', () => {
  const defaultRuntimeConfig = {
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
  } as const;

  return {
    DEFAULT_HEALTH_PROBE: defaultRuntimeConfig.service.healthProbe,
    DEFAULT_SERVICE_PORT_RANGE: defaultRuntimeConfig.service.portRange,
    DEFAULT_RUNTIME_CONFIG: defaultRuntimeConfig,
    loadRuntimeConfig: vi.fn(() => ({
      ...defaultRuntimeConfig,
      ui: {
        ...defaultRuntimeConfig.ui,
        experimentalSplitCommandWorkspace,
      },
    })),
  };
});

async function loadMainModule(): Promise<void> {
  await import('../main');
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

function getOwnershipSyncPayloads(window: BrowserWindowMock): unknown[] {
  return vi
    .mocked(window.webContents.send)
    .mock.calls.filter(([channel]) => channel === SPLIT_COMMAND_CHANNELS.ownershipSync)
    .map(([, payload]) => payload);
}

function getSplitCommandRequestHandler():
  | ((event: { sender: unknown }) => unknown | Promise<unknown>)
  | undefined {
  return ipcHandlers.get(SPLIT_COMMAND_CHANNELS.requestOwnershipSync) as
    | ((event: { sender: unknown }) => unknown | Promise<unknown>)
    | undefined;
}

describe('main split command launch hook', () => {
  beforeEach(() => {
    vi.resetModules();
    browserWindowState.instances = [];
    browserWindowState.failOnInstance = 0;
    ipcHandlers.clear();
    experimentalSplitCommandWorkspace = false;
    process.env.PLAYWRIGHT = '1';
    delete process.env.BLACKSKIES_FORCE_SERVICES;
    delete process.env.BLACKSKIES_SERVICES_PORT;
    delete process.env.BLACKSKIES_CONFIG_PATH;
  });

  afterEach(() => {
    delete process.env.PLAYWRIGHT;
    delete process.env.BLACKSKIES_FORCE_SERVICES;
    delete process.env.BLACKSKIES_SERVICES_PORT;
    delete process.env.BLACKSKIES_CONFIG_PATH;
  });

  it('keeps the stable path at one BrowserWindow with no secondary launch', async () => {
    experimentalSplitCommandWorkspace = false;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(1);
    const [primaryWindow] = browserWindowState.instances;
    expect(primaryWindow.options.webPreferences.additionalArguments).toEqual([]);
    expect(getOwnershipSyncPayloads(primaryWindow)).toHaveLength(0);
    expect(logger.info).not.toHaveBeenCalledWith(
      'Split command focus ownership classified',
      expect.anything(),
    );
    expect(logger.info).not.toHaveBeenCalledWith(
      'Split command mutation ownership classified',
      expect.anything(),
    );
  });

  it('launches a secondary BrowserWindow only in experimental mode', async () => {
    experimentalSplitCommandWorkspace = true;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(2);
    const [primaryWindow, secondaryWindow] = browserWindowState.instances;

    expect(primaryWindow.options.webPreferences.additionalArguments).toEqual(
      expect.arrayContaining([
        '--blackskies-split-command-role=primary',
        expect.stringMatching(/^--blackskies-split-command-pair-id=split-command:/),
        expect.stringMatching(/^--blackskies-split-command-session-generation=/),
        '--blackskies-split-command-shared-session-owner=primary',
        '--blackskies-split-command-local-presentation-owner=primary',
        '--blackskies-split-command-stale-secondary-resurrection-forbidden=true',
      ]),
    );
    expect(secondaryWindow.options.show).toBe(false);
    expect(secondaryWindow.options.webPreferences.additionalArguments).toEqual(
      expect.arrayContaining([
        '--blackskies-split-command-role=secondary',
        expect.stringMatching(/^--blackskies-split-command-pair-id=split-command:/),
        expect.stringMatching(/^--blackskies-split-command-session-generation=/),
        '--blackskies-split-command-shared-session-owner=primary',
        '--blackskies-split-command-local-presentation-owner=secondary',
        '--blackskies-split-command-stale-secondary-resurrection-forbidden=true',
      ]),
    );
    expect(getOwnershipSyncPayloads(primaryWindow)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageKind: 'ownership-snapshot',
          windowRole: 'primary',
          validationReason: 'healthy',
          pairIdentity: expect.objectContaining({
            pairId: expect.stringMatching(/^split-command:/),
            sessionGeneration: expect.any(String),
          }),
        }),
      ]),
    );
    expect(getOwnershipSyncPayloads(secondaryWindow)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageKind: 'ownership-snapshot',
          windowRole: 'secondary',
          validationReason: 'healthy',
        }),
      ]),
    );
    const requestHandler = getSplitCommandRequestHandler();
    expect(requestHandler).toBeDefined();
    await expect(
      Promise.resolve(requestHandler?.({ sender: primaryWindow.webContents })),
    ).resolves.toEqual(
      expect.objectContaining({
        messageKind: 'ownership-snapshot',
        windowRole: 'primary',
        validationReason: 'healthy',
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Split command focus ownership classified',
      expect.objectContaining({
        focusOwnershipState: expect.objectContaining({
          activeWindowIdentity: expect.objectContaining({
            windowRole: 'primary',
            focusOwner: 'primary',
          }),
          globalFocusOwner: 'primary',
          sharedFocusAuthorityOwner: 'primary',
          localFocusOwner: 'primary',
          canOwnSharedFocus: true,
          canOwnLocalFocus: true,
          focusValidationReason: 'healthy',
        }),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Split command input ownership classified',
      expect.objectContaining({
        inputRoutingAuthority: expect.objectContaining({
          globalFocusOwner: 'primary',
          sharedInputOwner: 'primary',
          localInputOwner: 'primary',
          staleInputClaimsRejected: true,
          focusValidationReason: 'healthy',
        }),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Split command mutation ownership classified',
      expect.objectContaining({
        mutationAuthority: expect.objectContaining({
          sharedMutationOwner: 'primary',
          localMutationOwner: 'primary',
          sharedUndoOwner: 'primary',
          localUndoOwner: 'primary',
          staleMutationClaimsRejected: true,
          mutationValidationReason: 'healthy',
        }),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Split command focus ownership classified',
      expect.objectContaining({
        focusOwnershipState: expect.objectContaining({
          activeWindowIdentity: expect.objectContaining({
            windowRole: 'secondary',
            focusOwner: 'secondary',
          }),
          globalFocusOwner: 'primary',
          sharedFocusAuthorityOwner: 'primary',
          localFocusOwner: 'secondary',
          canOwnSharedFocus: false,
          canOwnLocalFocus: true,
          focusValidationReason: 'healthy',
        }),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Split command input ownership classified',
      expect.objectContaining({
        inputRoutingAuthority: expect.objectContaining({
          globalFocusOwner: 'primary',
          sharedInputOwner: 'primary',
          localInputOwner: 'secondary',
          staleInputClaimsRejected: true,
          focusValidationReason: 'healthy',
        }),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Split command mutation ownership classified',
      expect.objectContaining({
        mutationAuthority: expect.objectContaining({
          sharedMutationOwner: 'primary',
          localMutationOwner: 'secondary',
          sharedUndoOwner: 'primary',
          localUndoOwner: 'secondary',
          staleMutationClaimsRejected: true,
          mutationValidationReason: 'healthy',
        }),
      }),
    );
  });

  it('degrades safely when the secondary BrowserWindow cannot be created', async () => {
    experimentalSplitCommandWorkspace = true;
    browserWindowState.failOnInstance = 2;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(1);
    expect(browserWindowState.instances[0].options.webPreferences.additionalArguments).toEqual(
      expect.arrayContaining([
        '--blackskies-split-command-role=primary',
        expect.stringMatching(/^--blackskies-split-command-pair-id=split-command:/),
        expect.stringMatching(/^--blackskies-split-command-session-generation=/),
        '--blackskies-split-command-shared-session-owner=primary',
        '--blackskies-split-command-local-presentation-owner=primary',
        '--blackskies-split-command-stale-secondary-resurrection-forbidden=true',
      ]),
    );
    expect(logger.warn).toHaveBeenCalled();
  });

  it('marks the pair degraded when the secondary BrowserWindow closes and blocks silent respawn', async () => {
    experimentalSplitCommandWorkspace = true;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(2);
    const [primaryWindow, secondaryWindow] = browserWindowState.instances;

    secondaryWindow.emit('closed');

    expect(logger.warn).toHaveBeenCalledWith(
      'Split command secondary window lost',
      expect.objectContaining({
        reason: 'closed',
        fallbackState: {
          pairHealthStatus: 'secondary-lost',
          primaryCollapseReason: null,
          secondaryLossReason: 'closed',
          rebuildBlockReason: null,
        },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command focus ownership rejected',
      expect.objectContaining({
        focusOwnershipState: expect.objectContaining({
          activeWindowIdentity: expect.objectContaining({
            windowRole: 'secondary',
            focusOwner: 'none',
          }),
          focusValidationReason: 'secondary-lost',
          canOwnSharedFocus: false,
          canOwnLocalFocus: false,
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command input ownership rejected',
      expect.objectContaining({
        inputRoutingAuthority: expect.objectContaining({
          localInputOwner: 'none',
          focusValidationReason: 'secondary-lost',
          staleInputClaimsRejected: true,
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command mutation ownership rejected',
      expect.objectContaining({
        mutationAuthority: expect.objectContaining({
          localMutationOwner: 'none',
          localUndoOwner: 'none',
          mutationValidationReason: 'secondary-lost',
          staleMutationClaimsRejected: true,
        }),
      }),
    );
    expect(getOwnershipSyncPayloads(browserWindowState.instances[0])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageKind: 'ownership-fallback',
          windowRole: 'primary',
          validationReason: 'secondary-lost',
        }),
      ]),
    );
    expect(primaryWindow.isDestroyed()).toBe(false);
    expect(secondaryWindow.isDestroyed()).toBe(true);
    expect(browserWindowState.instances).toHaveLength(2);
  });

  it('marks the pair degraded when the secondary renderer crashes', async () => {
    experimentalSplitCommandWorkspace = true;

    await loadMainModule();

    const [, secondaryWindow] = browserWindowState.instances;
    secondaryWindow.webContents.emit('render-process-gone', {}, { reason: 'crashed' });

    expect(logger.warn).toHaveBeenCalledWith(
      'Split command secondary window lost',
      expect.objectContaining({
        reason: 'crashed',
        fallbackState: {
          pairHealthStatus: 'secondary-lost',
          primaryCollapseReason: null,
          secondaryLossReason: 'crashed',
          rebuildBlockReason: null,
        },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command focus ownership rejected',
      expect.objectContaining({
        focusOwnershipState: expect.objectContaining({
          activeWindowIdentity: expect.objectContaining({
            windowRole: 'secondary',
            focusOwner: 'none',
          }),
          focusValidationReason: 'secondary-lost',
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command input ownership rejected',
      expect.objectContaining({
        inputRoutingAuthority: expect.objectContaining({
          localInputOwner: 'none',
          focusValidationReason: 'secondary-lost',
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command mutation ownership rejected',
      expect.objectContaining({
        mutationAuthority: expect.objectContaining({
          localMutationOwner: 'none',
          localUndoOwner: 'none',
          mutationValidationReason: 'secondary-lost',
        }),
      }),
    );
    expect(getOwnershipSyncPayloads(browserWindowState.instances[0])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageKind: 'ownership-fallback',
          windowRole: 'primary',
          validationReason: 'secondary-lost',
        }),
      ]),
    );
    expect(secondaryWindow.isDestroyed()).toBe(true);
  });

  it('marks the pair stale when the primary BrowserWindow closes and destroys the secondary', async () => {
    experimentalSplitCommandWorkspace = true;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(2);
    const [primaryWindow, secondaryWindow] = browserWindowState.instances;

    primaryWindow.destroy();

    expect(logger.warn).toHaveBeenCalledWith(
      'Split command primary window collapsed',
      expect.objectContaining({
        reason: 'closed',
        fallbackState: {
          pairHealthStatus: 'primary-lost',
          primaryCollapseReason: 'closed',
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command focus ownership rejected',
      expect.objectContaining({
        focusOwnershipState: expect.objectContaining({
          activeWindowIdentity: expect.objectContaining({
            windowRole: 'primary',
            focusOwner: 'none',
          }),
          focusValidationReason: 'primary-lost',
          canOwnSharedFocus: false,
          canOwnLocalFocus: false,
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command input ownership rejected',
      expect.objectContaining({
        inputRoutingAuthority: expect.objectContaining({
          localInputOwner: 'none',
          focusValidationReason: 'primary-lost',
          staleInputClaimsRejected: true,
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command mutation ownership rejected',
      expect.objectContaining({
        mutationAuthority: expect.objectContaining({
          localMutationOwner: 'none',
          localUndoOwner: 'none',
          mutationValidationReason: 'primary-lost',
          staleMutationClaimsRejected: true,
        }),
      }),
    );
    expect(primaryWindow.isDestroyed()).toBe(true);
    expect(secondaryWindow.isDestroyed()).toBe(true);
  });

  it('marks the pair stale when the primary renderer crashes and prevents reuse', async () => {
    experimentalSplitCommandWorkspace = true;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(2);
    const [primaryWindow, secondaryWindow] = browserWindowState.instances;

    primaryWindow.webContents.emit('render-process-gone', {}, { reason: 'crashed' });

    expect(logger.warn).toHaveBeenCalledWith(
      'Split command primary window collapsed',
      expect.objectContaining({
        reason: 'crashed',
        fallbackState: {
          pairHealthStatus: 'primary-lost',
          primaryCollapseReason: 'crashed',
          secondaryLossReason: null,
          rebuildBlockReason: null,
        },
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command focus ownership rejected',
      expect.objectContaining({
        focusOwnershipState: expect.objectContaining({
          activeWindowIdentity: expect.objectContaining({
            windowRole: 'primary',
            focusOwner: 'none',
          }),
          focusValidationReason: 'primary-lost',
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command input ownership rejected',
      expect.objectContaining({
        inputRoutingAuthority: expect.objectContaining({
          localInputOwner: 'none',
          focusValidationReason: 'primary-lost',
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command mutation ownership rejected',
      expect.objectContaining({
        mutationAuthority: expect.objectContaining({
          localMutationOwner: 'none',
          localUndoOwner: 'none',
          mutationValidationReason: 'primary-lost',
        }),
      }),
    );
    expect(secondaryWindow.isDestroyed()).toBe(true);
  });

  it('marks rebuild as blocked when secondary launch fails and does not respawn', async () => {
    experimentalSplitCommandWorkspace = true;
    browserWindowState.failOnInstance = 2;

    await loadMainModule();

    expect(browserWindowState.instances).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command secondary rebuild blocked',
      expect.objectContaining({
        fallbackState: {
          pairHealthStatus: 'rebuild-blocked',
          primaryCollapseReason: null,
          secondaryLossReason: null,
          rebuildBlockReason: 'secondary-launch-failed',
        },
      }),
    );
    expect(getOwnershipSyncPayloads(browserWindowState.instances[0])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          messageKind: 'ownership-fallback',
          windowRole: 'primary',
          validationReason: 'rebuild-blocked',
        }),
      ]),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command secondary launch contract unavailable',
      expect.objectContaining({
        error: 'split command secondary launch failed',
      }),
    );
  });
});
