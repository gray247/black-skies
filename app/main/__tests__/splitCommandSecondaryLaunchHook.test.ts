import type { BrowserWindowConstructorOptions } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPLIT_COMMAND_CHANNELS } from '../../shared/ipc/splitCommand';
import { PROJECT_SPINE_CHANNELS } from '../../shared/ipc/projectSpine';

const browserWindowState = {
  instances: [] as BrowserWindowMock[],
  failOnInstance: 0,
};
const ipcHandlers = new Map<string, (...args: unknown[]) => unknown>();
const projectSpineMocks = vi.hoisted(() => ({
  getProjectSpineSnapshot: vi.fn(() => ({
    project: null,
    generation: 0,
    dirtyUnitIds: [],
  })),
}));

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

let experimentalSplitCommandWorkspace = false;
const showMessageBoxSync = vi.fn(() => 0);

class BrowserWindowMock {
  static fromWebContents = vi.fn((webContents: { owner?: BrowserWindowMock } | null) =>
    webContents?.owner ?? null,
  );

  readonly options: BrowserWindowConstructorOptions;
  readonly webContents = {
    id: browserWindowState.instances.length + 1,
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
    isDestroyed: vi.fn(() => false),
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

  show = vi.fn();

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
    showMessageBoxSync,
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
  screen: {
    getPrimaryDisplay: vi.fn(() => ({
      id: 1,
      workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    })),
    getAllDisplays: vi.fn(() => [
      { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1040 } },
      { id: 2, workArea: { x: 1920, y: 0, width: 1920, height: 1040 } },
    ]),
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

vi.mock('../projectSpineIpc.js', () => ({
  getProjectSpineSnapshot: projectSpineMocks.getProjectSpineSnapshot,
  registerProjectSpineIpc: vi.fn(),
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

async function closeCoordinator() {
  return import('../closeConfirmationCoordinator');
}

function activeDirtySnapshot(projectId = 'project-close-guard', generation = 19) {
  return {
    project: { projectId },
    generation,
    dirtyUnitIds: ['unit-1'],
  };
}

function closeConfirmationMessages(window: BrowserWindowMock): unknown[][] {
  return vi
    .mocked(window.webContents.send)
    .mock.calls.filter(([channel]) => channel === PROJECT_SPINE_CHANNELS.closeConfirmationRequest);
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
    showMessageBoxSync.mockReset();
    showMessageBoxSync.mockReturnValue(0);
    projectSpineMocks.getProjectSpineSnapshot.mockReset();
    projectSpineMocks.getProjectSpineSnapshot.mockReturnValue({
      project: null,
      generation: 0,
      dirtyUnitIds: [],
    });
    process.env.PLAYWRIGHT = '1';
    delete process.env.BLACKSKIES_FORCE_SERVICES;
    delete process.env.BLACKSKIES_SERVICES_PORT;
    delete process.env.BLACKSKIES_CONFIG_PATH;
  });

  afterEach(async () => {
    (await closeCoordinator()).resetCloseConfirmationState();
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

  it('dispatches one correlated close-confirmation request only to Writing Studio', async () => {
    projectSpineMocks.getProjectSpineSnapshot.mockReturnValue(activeDirtySnapshot('project-a4a', 42));
    experimentalSplitCommandWorkspace = true;
    await loadMainModule();

    const [writingStudio, commandCenter] = browserWindowState.instances;
    const event = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', event);

    const messages = closeConfirmationMessages(writingStudio);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toEqual([
      PROJECT_SPINE_CHANNELS.closeConfirmationRequest,
      expect.objectContaining({
        correlationId: expect.any(String),
        projectId: 'project-a4a',
        generation: 42,
        writingWebContentsId: writingStudio.webContents.id,
      }),
    ]);
    expect(closeConfirmationMessages(commandCenter)).toHaveLength(0);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect((await closeCoordinator()).hasPendingCloseRequest()).toBe(true);
    expect(showMessageBoxSync).not.toHaveBeenCalled();
  });

  it('consumes the coordinated-close allowance once and does not bypass the next dirty close', async () => {
    projectSpineMocks.getProjectSpineSnapshot.mockReturnValue(activeDirtySnapshot());
    (await closeCoordinator()).grantCoordinatedCloseAllowance();
    await loadMainModule();

    const [writingStudio] = browserWindowState.instances;
    const allowedEvent = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', allowedEvent);
    expect(allowedEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(closeConfirmationMessages(writingStudio)).toHaveLength(0);
    expect((await closeCoordinator()).hasPendingCloseRequest()).toBe(false);
    expect((await closeCoordinator()).consumeCoordinatedCloseAllowance()).toBe(false);

    const dirtyEvent = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', dirtyEvent);
    expect(dirtyEvent.preventDefault).not.toHaveBeenCalled();
    expect(closeConfirmationMessages(writingStudio)).toHaveLength(1);
    expect((await closeCoordinator()).hasPendingCloseRequest()).toBe(true);
  });

  it('keeps the original correlation active when close is attempted again', async () => {
    projectSpineMocks.getProjectSpineSnapshot.mockReturnValue(activeDirtySnapshot());
    await loadMainModule();

    const [writingStudio] = browserWindowState.instances;
    const firstEvent = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', firstEvent);
    const [[, originalRequest]] = closeConfirmationMessages(writingStudio);
    const duplicateEvent = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', duplicateEvent);

    expect(closeConfirmationMessages(writingStudio)).toHaveLength(1);
    expect((closeConfirmationMessages(writingStudio)[0][1] as { correlationId: string }).correlationId)
      .toBe((originalRequest as { correlationId: string }).correlationId);
    expect(firstEvent.preventDefault).not.toHaveBeenCalled();
    expect(duplicateEvent.preventDefault).not.toHaveBeenCalled();
    expect((await closeCoordinator()).hasPendingCloseRequest()).toBe(true);
  });

  it.each([
    ['missing active project', () => ({ project: null, generation: 19, dirtyUnitIds: ['unit-1'] }), () => {}],
    ['empty project ID', () => activeDirtySnapshot('', 19), () => {}],
    ['no authoritative dirty units', () => ({ ...activeDirtySnapshot(), dirtyUnitIds: [] }), () => {}],
    ['missing Writing Studio window', () => activeDirtySnapshot(), (window: BrowserWindowMock) => window.emit('closed')],
    ['destroyed Writing Studio window', () => activeDirtySnapshot(), (window: BrowserWindowMock) => window.isDestroyed = () => true],
    ['destroyed Writing Studio webContents', () => activeDirtySnapshot(), (window: BrowserWindowMock) => window.webContents.isDestroyed.mockReturnValue(true)],
  ])('fails closed for %s', async (_condition, snapshotFactory, alterWindow) => {
    const snapshot = snapshotFactory();
    projectSpineMocks.getProjectSpineSnapshot.mockReturnValue(snapshot);
    await loadMainModule();

    const [writingStudio] = browserWindowState.instances;
    alterWindow(writingStudio);
    const event = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(closeConfirmationMessages(writingStudio)).toHaveLength(0);
    expect((await closeCoordinator()).hasPendingCloseRequest()).toBe(false);
    expect(snapshot.dirtyUnitIds).toEqual(snapshotFactory().dirtyUnitIds);
  });

  it('clears a partially created request and logs boundedly when close IPC dispatch throws', async () => {
    const snapshot = activeDirtySnapshot();
    projectSpineMocks.getProjectSpineSnapshot.mockReturnValue(snapshot);
    await loadMainModule();

    const [writingStudio] = browserWindowState.instances;
    writingStudio.webContents.send.mockImplementation((channel: string) => {
      if (channel === PROJECT_SPINE_CHANNELS.closeConfirmationRequest) {
        throw new Error('IPC unavailable');
      }
    });
    const event = { preventDefault: vi.fn() };
    writingStudio.webContents.emit('will-prevent-unload', event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect((await closeCoordinator()).hasPendingCloseRequest()).toBe(false);
    expect(snapshot.dirtyUnitIds).toEqual(['unit-1']);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Unable to dispatch close confirmation to Writing Studio',
      { error: 'IPC unavailable' },
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
    expect(primaryWindow.options).toMatchObject({
      title: 'Black Skies — Writing Studio',
      x: 0,
      y: 0,
      width: 1920,
      height: 1040,
    });
    expect(secondaryWindow.options.show).toBe(false);
    expect(secondaryWindow.options).toMatchObject({
      title: 'Black Skies — Command Center',
      x: 1920,
      y: 0,
      width: 1920,
      height: 1040,
    });
    secondaryWindow.emit('ready-to-show');
    expect(secondaryWindow.show).toHaveBeenCalledTimes(1);
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
