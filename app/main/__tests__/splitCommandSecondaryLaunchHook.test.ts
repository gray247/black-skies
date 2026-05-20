import type { BrowserWindowConstructorOptions } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const browserWindowState = {
  instances: [] as BrowserWindowMock[],
  failOnInstance: 0,
};

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

let experimentalSplitCommandWorkspace = false;

class BrowserWindowMock {
  readonly options: BrowserWindowConstructorOptions;
  readonly webContents = {
    setWindowOpenHandler: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const handlers = this.webContentsListeners.get(event) ?? [];
      handlers.push(handler);
      this.webContentsListeners.set(event, handlers);
    }),
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
    handle: vi.fn(),
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

describe('main split command launch hook', () => {
  beforeEach(() => {
    vi.resetModules();
    browserWindowState.instances = [];
    browserWindowState.failOnInstance = 0;
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
    expect(logger.info).not.toHaveBeenCalledWith(
      'Split command focus ownership classified',
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
    expect(logger.warn).toHaveBeenCalledWith(
      'Split command secondary launch contract unavailable',
      expect.objectContaining({
        error: 'split command secondary launch failed',
      }),
    );
  });
});
