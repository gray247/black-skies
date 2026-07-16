import { contextBridge, ipcRenderer, shell } from 'electron';
import { randomUUID } from 'node:crypto';
import type { IpcRendererEvent } from 'electron';
import { promises as fs } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import * as modePolicy from '../shared/modePolicy';
import * as testMode from '../renderer/testMode/testModeManager';
import {
  SPLIT_COMMAND_CHANNELS,
  type SplitCommandOwnershipBridge,
} from '../shared/ipc/splitCommand';
import {
  AI_CRITIQUE_CHANNELS,
  type AiCritiqueApprovalRequest,
  type AiCritiqueBridge,
  type AiCritiquePrepareRequest,
  type AiCritiqueRequestReference,
  type AiCritiqueState,
} from '../shared/ipc/aiCritique';
import {
  matchesSplitCommandOwnershipSyncMessagePairIdentity,
  type SplitCommandOwnershipSyncMessage,
  type SplitCommandWindowRole,
} from '../shared/splitCommandAuthority';

const safeExpose = (key: string, api: unknown) => {
  try {
    if ((process as any).contextIsolated) {
      contextBridge.exposeInMainWorld(key, api);
    } else {
      console.warn(`[preload] contextIsolation=false; skipping expose ${key}`);
    }
  } catch (err) {
    console.warn(`[preload] expose ${key} failed:`, err);
  }
};

function readSplitCommandLaunchContextFromArgv():
  | {
      readonly windowRole: SplitCommandWindowRole;
      readonly pairId: string;
      readonly sessionGeneration: string;
    }
  | null {
  const roleArgs = process.argv.filter((entry) =>
    entry.startsWith('--blackskies-split-command-role='),
  );
  const pairIdArgs = process.argv.filter((entry) =>
    entry.startsWith('--blackskies-split-command-pair-id='),
  );
  const generationArgs = process.argv.filter((entry) =>
    entry.startsWith('--blackskies-split-command-session-generation='),
  );

  if (roleArgs.length !== 1 || pairIdArgs.length !== 1 || generationArgs.length !== 1) {
    return null;
  }
  const [roleArg] = roleArgs;
  const [pairIdArg] = pairIdArgs;
  const [generationArg] = generationArgs;

  const windowRole = roleArg.split('=', 2)[1] as SplitCommandWindowRole | undefined;
  const pairId = pairIdArg.split('=', 2)[1] ?? '';
  const sessionGeneration = generationArg.split('=', 2)[1] ?? '';
  if ((windowRole !== 'primary' && windowRole !== 'secondary') || !pairId || !sessionGeneration) {
    return null;
  }

  return {
    windowRole,
    pairId,
    sessionGeneration,
  };
}

const hasSplitCommandLaunchArguments = process.argv.some((entry) =>
  [
    '--blackskies-split-command-role=',
    '--blackskies-split-command-pair-id=',
    '--blackskies-split-command-session-generation=',
  ].some((prefix) => entry.startsWith(prefix)),
);
const splitCommandLaunchContext = readSplitCommandLaunchContextFromArgv();
const isCommandCenterPreload =
  splitCommandLaunchContext?.windowRole === 'secondary' ||
  (hasSplitCommandLaunchArguments && !splitCommandLaunchContext);
let splitCommandOwnershipSync: SplitCommandOwnershipSyncMessage | null = null;
const splitCommandOwnershipSyncListeners = new Set<(message: SplitCommandOwnershipSyncMessage) => void>();

function notifySplitCommandOwnershipSyncListeners(
  message: SplitCommandOwnershipSyncMessage,
): void {
  for (const listener of splitCommandOwnershipSyncListeners) {
    try {
      listener(message);
    } catch (error) {
      console.warn('[preload] split command ownership sync listener failed', error);
    }
  }
}

function normalizeSplitCommandOwnershipSyncMessage(
  candidate: unknown,
): SplitCommandOwnershipSyncMessage | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const message = candidate as Partial<SplitCommandOwnershipSyncMessage> & {
    pairIdentity?: { pairId?: unknown; sessionGeneration?: unknown };
  };
  if (
    message.messageVersion !== 1 ||
    (message.messageKind !== 'ownership-snapshot' && message.messageKind !== 'ownership-fallback') ||
    !message.pairIdentity ||
    typeof message.pairIdentity.pairId !== 'string' ||
    typeof message.pairIdentity.sessionGeneration !== 'string'
  ) {
    return null;
  }
  return message as SplitCommandOwnershipSyncMessage;
}

function applySplitCommandOwnershipSync(nextMessage: SplitCommandOwnershipSyncMessage): boolean {
  if (
    !splitCommandLaunchContext ||
    nextMessage.pairIdentity.pairId !== splitCommandLaunchContext.pairId ||
    nextMessage.pairIdentity.sessionGeneration !== splitCommandLaunchContext.sessionGeneration
  ) {
    return false;
  }
  if (
    splitCommandOwnershipSync &&
    !matchesSplitCommandOwnershipSyncMessagePairIdentity(
      nextMessage,
      splitCommandOwnershipSync.pairIdentity,
    )
  ) {
    return false;
  }

  splitCommandOwnershipSync = nextMessage;
  notifySplitCommandOwnershipSyncListeners(nextMessage);
  return true;
}

if (splitCommandLaunchContext) {
  ipcRenderer.on(SPLIT_COMMAND_CHANNELS.ownershipSync, (_event, payload) => {
    const message = normalizeSplitCommandOwnershipSyncMessage(payload);
    if (!message) {
      return;
    }
    applySplitCommandOwnershipSync(message);
  });
}

const applyVisualStableAttrs = (element: HTMLElement | null) => {
  if (!element) {
    return;
  }
  element.dataset.visualStable = '1';
  element.dataset.testVisualStable = '1';
};

const ensureVisualStableAttrs = (): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }
  applyVisualStableAttrs(document.documentElement);
  if (document.body) {
    applyVisualStableAttrs(document.body);
    return true;
  }
  return false;
};

const ensureVisualStableAttrsWithRetry = (): void => {
  if (ensureVisualStableAttrs()) {
    return;
  }
  if (typeof document === 'undefined') {
    return;
  }
  const handler = () => {
    ensureVisualStableAttrs();
    document.removeEventListener('DOMContentLoaded', handler);
  };
  document.addEventListener('DOMContentLoaded', handler, { once: true });
};

const electronFsApi = {
  resolvePath: (...segments: string[]): string => resolve(...segments),
  async readJson(targetPath: string): Promise<unknown> {
    const resolved = resolve(targetPath);
    const contents = await fs.readFile(resolved, { encoding: 'utf-8' });
    return JSON.parse(contents);
  },
  async readDir(targetPath: string): Promise<Array<{ name: string; isDirectory: boolean; isFile: boolean }>> {
    const resolved = resolve(targetPath);
    const entries = await fs.readdir(resolved, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    }));
  },
  async stat(targetPath: string): Promise<{
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    mtimeMs: number;
  }> {
    const resolved = resolve(targetPath);
    const stats = await fs.stat(resolved);
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      mtimeMs: stats.mtimeMs,
    };
  },
};
if (!isCommandCenterPreload) {
  safeExpose('__electronApi', { fs: electronFsApi });
}

const isPlaywright = process.env.PLAYWRIGHT === '1';
const harnessHooksEnabled = modePolicy.isHarnessEnabled();
const forceRecoveryInHarness = process.env.BLACKSKIES_TEST_NEEDS_RECOVERY === '1';
const phase4MockFlowEnabled = process.env.BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW === '1';
if (!isCommandCenterPreload) {
  safeExpose('__phase4MockFlowEnabled', phase4MockFlowEnabled);
}
const setPlaywrightTestAttribute = (): void => {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  if (root) {
    root.setAttribute('data-test-env', '1');
  }
  document.body?.setAttribute('data-test-env', '1');
};
if (isPlaywright) {
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setPlaywrightTestAttribute, { once: true });
    } else {
      setPlaywrightTestAttribute();
    }
  }
}
const applyForceStateAttributes = (): void => {
  if (!harnessHooksEnabled) {
    return;
  }
  if (typeof document === 'undefined') {
    return;
  }
  const html = document.documentElement;
  if (!html) {
    return;
  }
  const body = document.body ?? html;
  const hasFlag = (flag: 'testForceOffline'): boolean => {
    const htmlValue = html.dataset?.[flag];
    if (htmlValue === '1') {
      return true;
    }
    return body.dataset?.[flag] === '1';
  };
  const forceOffline = hasFlag('testForceOffline');
  const applyFlag = (enabled: boolean): void => {
    if (enabled) {
      html.dataset.testForceOffline = '1';
      if (body) {
        body.dataset.testForceOffline = '1';
      }
      return;
    }
    delete html.dataset.testForceOffline;
    if (body) {
      delete body.dataset.testForceOffline;
    }
  };
  if (forceOffline) {
    applyFlag(true);
    return;
  }
  applyFlag(false);
};
const ensureForceStateAttrsWithRetry = (): void => {
  if (!harnessHooksEnabled) {
    return;
  }
  if (typeof document === 'undefined') {
    return;
  }
  applyForceStateAttributes();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyForceStateAttributes, { once: true });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('load', applyForceStateAttributes, { once: true });
  }
};
ensureForceStateAttrsWithRetry();
if (!isCommandCenterPreload) {
  safeExpose('__testEnv', { isPlaywright });
}

if (typeof window !== 'undefined' && harnessHooksEnabled) {
  const setHarnessFlag = (
    flag: 'testActiveFlow' | 'testStableDock' | 'testStableHome' | 'testVisualStable',
    enabled: boolean,
  ): boolean => {
    if (typeof document === 'undefined') {
      return false;
    }
    const root = document.documentElement;
    const body = document.body;
    const target = body ?? root;
    if (!target) {
      return false;
    }
    if (enabled) {
      if (root && root.dataset[flag] !== '1') {
        root.dataset[flag] = '1';
      }
      if (body && body.dataset[flag] !== '1') {
        body.dataset[flag] = '1';
      }
      return true;
    }
    if (root && flag in root.dataset) {
      delete root.dataset[flag];
    }
    if (body && flag in body.dataset) {
      delete body.dataset[flag];
    }
    return true;
  };
  const applyHarnessFlags = (): boolean => {
    const activeFlowApplied = setHarnessFlag('testActiveFlow', process.env.PLAYWRIGHT === '1');
    const stableDockApplied = setHarnessFlag(
      'testStableDock',
      process.env.BLACKSKIES_STABLE_DOCK === '1',
    );
    const stableHomeApplied = setHarnessFlag(
      'testStableHome',
      process.env.BLACKSKIES_STABLE_HOME === '1',
    );
    const visualStableApplied = setHarnessFlag('testVisualStable', modePolicy.isVisualStable());
    return activeFlowApplied || stableDockApplied || stableHomeApplied || visualStableApplied;
  };
  const ensureHarnessFlags = (): void => {
    if (applyHarnessFlags()) {
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyHarnessFlags, { once: true });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('load', applyHarnessFlags, { once: true });
    }
  };
  ensureHarnessFlags();
  if (process.env.BLACKSKIES_STABLE_HOME === '1') {
    const applyStableHomeAttr = () => {
      if (typeof document === 'undefined') {
        return;
      }
      const target = document.body ?? document.documentElement;
      if (target) {
        target.dataset.testStablehome = '1';
      }
    };
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyStableHomeAttr, { once: true });
      } else {
        applyStableHomeAttr();
      }
    }
  }
  if (process.env.BLACKSKIES_STABLE_DOCK === '1') {
    const applyStableDockAttr = () => {
      if (typeof document === 'undefined') {
        return;
      }
      const target = document.body ?? document.documentElement;
      if (target) {
        target.dataset.testStableDock = '1';
      }
    };
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyStableDockAttr, { once: true });
      } else {
        applyStableDockAttr();
      }
    }
  }
  if (modePolicy.isVisualStable()) {
    ensureVisualStableAttrsWithRetry();
    if (typeof window !== 'undefined') {
      window.addEventListener('load', ensureVisualStableAttrsWithRetry, { once: true });
    }
  }
}

if (isPlaywright && typeof window !== 'undefined') {
  const markDockReady = () => {
    const w = window as typeof window & { __dockReady?: boolean; __stableDockHandleReady?: boolean };
    w.__dockReady = true;
    w.__stableDockHandleReady = true;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markDockReady, { once: true });
  } else {
    markDockReady();
  }
}

type SceneSelectionDiagnostic = {
  ok: boolean;
  method: 'hook' | 'event';
  sceneId: string | null;
  hookPresent: boolean;
  error?: string;
};

function resolveSceneSelectionHook():
  | ((value: string | null | undefined) => boolean)
  | null {
  const selector = (window as typeof window & {
    __blackSkiesSelectScene?: (value: string | null | undefined) => boolean;
  }).__blackSkiesSelectScene;
  return typeof selector === 'function' ? selector : null;
}

async function waitForSceneSelectionHook(timeoutMs = 3_000): Promise<{
  hook: ((value: string | null | undefined) => boolean) | null;
  hookPresent: boolean;
}> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hook = resolveSceneSelectionHook();
    if (hook) {
      return { hook, hookPresent: true };
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return { hook: null, hookPresent: false };
}

const devApi: {
  setProjectDir: (absPath: string | null) => void | Promise<void>;
  selectScene?: (sceneId: string | null) => Promise<SceneSelectionDiagnostic>;
  overrideServices?: (overrides: Partial<ServicesBridge>) => void;
  setStartupConfig?: (config: {
    mode: 'flat' | 'full' | 'recovery';
    projectPath: string | null;
    recovery: boolean;
    services: 'stub' | 'real';
    allowRuntimeModeOverride?: boolean;
    allowLayoutRestore?: boolean;
  }) => void;
} = {
  setProjectDir: (absPath: string | null) => {
    window.dispatchEvent(new CustomEvent('test:set-project', { detail: absPath }));
  },
  selectScene: async (sceneId: string | null) => {
    const normalizedSceneId = typeof sceneId === 'string' ? sceneId.trim() : null;
    console.log(
      '[dbg:scene.select.request]',
      JSON.stringify({ sceneId: normalizedSceneId || null }),
    );
    if (normalizedSceneId === '') {
      return {
        ok: false,
        method: 'hook',
        sceneId: normalizedSceneId,
        hookPresent: false,
        error: 'missing-scene-id',
      };
    }
    const hookState = await waitForSceneSelectionHook();
    console.log(
      '[dbg:scene.select.hook.present]',
      JSON.stringify({ sceneId: normalizedSceneId, hookPresent: hookState.hookPresent }),
    );
    if (hookState.hook) {
      try {
        const applied = hookState.hook(normalizedSceneId);
        if (applied) {
          return {
            ok: true,
            method: 'hook',
            sceneId: normalizedSceneId,
            hookPresent: true,
          };
        }
        return {
          ok: false,
          method: 'hook',
          sceneId: normalizedSceneId,
          hookPresent: true,
          error: 'missing-scene',
        };
      } catch (error) {
        return {
          ok: false,
          method: 'hook',
          sceneId: normalizedSceneId,
          hookPresent: true,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    window.dispatchEvent(new CustomEvent('test:select-scene', { detail: normalizedSceneId }));
    return {
      ok: false,
      method: 'event',
      sceneId: normalizedSceneId,
      hookPresent: false,
      error: 'hook missing',
    };
  },
  setStartupConfig: (config) => {
    const win = window as typeof window & {
      __E2E_STARTUP_CONFIG?: {
        mode: 'flat' | 'full' | 'recovery';
        projectPath: string | null;
        recovery: boolean;
        services: 'stub' | 'real';
        allowRuntimeModeOverride?: boolean;
        allowLayoutRestore?: boolean;
      };
      __testEnvFlatMode?: boolean;
      __testEnvRecoveryMode?: boolean;
      __testEnvFullMode?: boolean;
    };
    win.__E2E_STARTUP_CONFIG = {
      ...config,
      projectPath: config.projectPath ?? null,
      recovery: Boolean(config.recovery),
    };
    if (config.mode === 'flat') {
      win.__testEnvFlatMode = true;
      win.__testEnvRecoveryMode = false;
      win.__testEnvFullMode = false;
    } else if (config.mode === 'recovery') {
      win.__testEnvFlatMode = false;
      win.__testEnvRecoveryMode = true;
      win.__testEnvFullMode = false;
    } else {
      win.__testEnvFlatMode = false;
      win.__testEnvRecoveryMode = false;
      win.__testEnvFullMode = true;
    }
    const root = document.documentElement;
    const body = document.body ?? root;
    if (root) {
      root.dataset.testMode = config.mode;
      if (config.recovery) {
        root.dataset.testNeedsRecovery = '1';
      } else {
        delete root.dataset.testNeedsRecovery;
      }
    }
    if (body) {
      body.dataset.testMode = config.mode;
      if (config.recovery) {
        body.dataset.testNeedsRecovery = '1';
      } else {
        delete body.dataset.testNeedsRecovery;
      }
    }
    window.dispatchEvent(new CustomEvent('test:startup-config', { detail: win.__E2E_STARTUP_CONFIG }));
  },
};

// --- harness-only bridges ---
// These are explicit test hooks and must stay out of the truth lane unless a harness runner
// opts in with BLACKSKIES_ENABLE_HARNESS_HOOKS=1.
if (!isCommandCenterPreload && (isPlaywright || harnessHooksEnabled)) {
  safeExpose('__test', {
    markBoot: () => console.log('[boot] renderer mounted'),
  });

  safeExpose('__dev', devApi);

  safeExpose('__testInsights', {
    setServiceStatus: (status: 'offline' | 'online') =>
      window.dispatchEvent(new CustomEvent('test:service-status', { detail: status })),
    selectScene: (id: string) => {
      const selector = (window as typeof window & {
        __blackSkiesSelectScene?: (value: string | null | undefined) => boolean;
      }).__blackSkiesSelectScene;
      if (typeof selector === 'function' && selector(id)) {
        return;
      }
      window.dispatchEvent(new CustomEvent('test:select-scene', { detail: id }));
    },
  });

  safeExpose('testMode', {
    getMode: testMode.getMode,
    isFlat: testMode.isFlat,
    isRecovery: testMode.isRecovery,
    isFull: testMode.isFull,
    getOfflineReason: testMode.getOfflineReason,
    debug(): void {
      console.log('[test-mode-debug]', {
        mode: testMode.getMode(),
        isFlat: testMode.isFlat(),
        isRecovery: testMode.isRecovery(),
        isFull: testMode.isFull(),
        offlineReason: testMode.getOfflineReason(),
      });
    },
  });
}
// --- end bridges ---

import {
  LOGGING_CHANNELS,
  type DiagnosticsLogPayload,
  type DiagnosticsLogLevel,
} from '../shared/ipc/logging.js';
import { loadRuntimeConfig } from '../shared/config/runtime.js';
import {
  PROJECT_LOADER_CHANNELS,
  type ProjectBootstrapRequest,
  type ProjectBootstrapResponse,
  type ProjectDialogResult,
  type ProjectDraftSaveRequest,
  type ProjectDraftSaveResponse,
  type ProjectLoadRequest,
  type ProjectLoadResponse,
  type ProjectLoaderApi,
} from '../shared/ipc/projectLoader.js';
import {
  PROJECT_SPINE_CHANNELS,
  type CaptureRecoveryCheckpointRequest,
  type CreateManuscriptUnitRequest,
  type CreateProjectRequest as ProjectSpineCreateProjectRequest,
  type DeleteManuscriptUnitRequest,
  type OpenProjectRequest as ProjectSpineOpenProjectRequest,
  type ProjectSpineBridge,
  type ProjectSpineCloseConfirmationRequest,
  type ProjectSpineCloseConfirmationResponse,
  type ProjectSpineResult,
  type RecoveryCandidateDecisionRequest,
  type RecoveryCandidateDecisionResultData,
  type RecoveryCheckpointResultData,
  type ProjectSpineSessionSnapshot,
  type RemoveRecentProjectRequest,
  type RenameManuscriptUnitRequest,
  type ReorderManuscriptUnitsRequest,
  type SaveManuscriptUnitRequest,
  type SaveManuscriptUnitResultData,
  type SelectManuscriptUnitRequest,
  type SetManuscriptUnitDirtyRequest,
} from '../shared/ipc/projectSpine.js';
import {
  DIAGNOSTICS_CHANNELS,
  type DiagnosticsBridge,
  type DiagnosticsOpenResult,
} from '../shared/ipc/diagnostics.js';
import {
  LAYOUT_CHANNELS,
  type FloatingPaneCloseRequest,
  type FloatingPaneDescriptor,
  type FloatingPaneOpenRequest,
  type FloatingPaneOpenResult,
  type LayoutBridge,
  type LayoutLoadRequest,
  type LayoutLoadResponse,
  type LayoutSaveRequest,
  type LayoutResetRequest,
} from '../shared/ipc/layout.js';
import type {
  AnalyticsSummary,
  AnalyticsScenes,
  AnalyticsRelationshipGraph,
  BackupVerificationReport,
  BackupCreateBridgeRequest,
  BackupCreateBridgeResponse,
  BackupListBridgeRequest,
  BackupListBridgeResponse,
  DraftAcceptBridgeRequest,
  DraftAcceptBridgeResponse,
  DraftCritiqueBridgeRequest,
  DraftCritiqueBridgeResponse,
  DraftGenerateBridgeRequest,
  DraftGenerateBridgeResponse,
  DraftRewriteBridgeRequest,
  DraftRewriteBridgeResponse,
  DraftPreflightBridgeRequest,
  DraftPreflightEstimate,
  DraftUnitOverrides,
  OutlineBuildBridgeRequest,
  OutlineBuildBridgeResponse,
  ExportFormat,
  Phase4CritiqueBridgeRequest,
  Phase4CritiqueBridgeResponse,
  Phase4RewriteBridgeRequest,
  Phase4RewriteBridgeResponse,
  ProjectExportBridgeRequest,
  ProjectExportBridgeResponse,
  RecoveryRestoreBridgeRequest,
  RecoveryRestoreBridgeResponse,
  RecoveryStatusBridgeRequest,
  RecoveryStatusBridgeResponse,
  RestoreFromZipRequest,
  RestoreFromZipResponse,
  RevealPathResult,
  ServiceError,
  ServiceHealthResponse,
  ServiceResult,
  ServicesBridge,
  BackupRestoreBridgeRequest,
  BackupRestoreBridgeResponse,
  SnapshotManifest,
  WizardLockSnapshotBridgeRequest,
  WizardLockSnapshotBridgeResponse,
} from '../shared/ipc/services.js';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

type HttpMethod = 'GET' | 'POST';

interface BridgeResiliencePolicy {
  timeoutMs: number;
  maxAttempts: number;
  backoffMs: number;
  circuitFailureThreshold: number;
  circuitResetMs: number;
}

class BridgeCircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BridgeCircuitOpenError';
  }
}

class BridgeTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms.`);
    this.name = 'BridgeTimeoutError';
  }
}

class BridgeNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BridgeNetworkError';
  }
}

class CircuitBreaker {
  private failureCount = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private openedAt = 0;

  constructor(
    private readonly failureThreshold: number,
    private readonly resetMs: number,
  ) {}

  allow(): boolean {
    if (this.state === 'open') {
      if (this.resetMs === 0) {
        return false;
      }
      const elapsed = Date.now() - this.openedAt;
      if (elapsed >= this.resetMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  recordFailure(): boolean {
    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      return true;
    }
    return false;
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

const REQUEST_POLICY: BridgeResiliencePolicy = {
  timeoutMs: parsePositiveInt(process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS, 45_000),
  maxAttempts: Math.max(1, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_MAX_ATTEMPTS, 2)),
  backoffMs: Math.max(0, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_BACKOFF_MS, 250)),
  circuitFailureThreshold: Math.max(
    1,
    parsePositiveInt(process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD, 3),
  ),
  circuitResetMs: Math.max(0, parsePositiveInt(process.env.BLACKSKIES_BRIDGE_RESET_MS, 15_000)),
};

const DRAFT_REQUEST_MAX_TIMEOUT_MS = 300_000;
const SNAPSHOT_CREATE_REQUEST_TIMEOUT_MS = Math.max(REQUEST_POLICY.timeoutMs, 120_000);
const RESTORE_REQUEST_TIMEOUT_MS = Math.max(
  REQUEST_POLICY.timeoutMs,
  parsePositiveInt(process.env.BLACKSKIES_BRIDGE_RESTORE_TIMEOUT_MS, 300_000),
);
const BACKUP_CREATE_REQUEST_TIMEOUT_MS = Math.max(
  REQUEST_POLICY.timeoutMs,
  parsePositiveInt(process.env.BLACKSKIES_BRIDGE_BACKUP_CREATE_TIMEOUT_MS, 300_000),
);
const BACKUP_RESTORE_REQUEST_TIMEOUT_MS = Math.max(
  REQUEST_POLICY.timeoutMs,
  parsePositiveInt(process.env.BLACKSKIES_BRIDGE_BACKUP_RESTORE_TIMEOUT_MS, 300_000),
);

const REQUEST_BREAKER = new CircuitBreaker(
  REQUEST_POLICY.circuitFailureThreshold,
  REQUEST_POLICY.circuitResetMs,
);

const LOG_LEVEL_MAP: Record<ConsoleMethod, DiagnosticsLogLevel> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
};

const runtimeConfig = loadRuntimeConfig();
let loggedServicePorts = false;

async function sleep(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return;
  }
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function currentServicePort(): number | null {
  const [primaryRaw, fallbackRaw] = [
    process.env.BLACKSKIES_SERVICES_PORT,
    process.env.BLACKSKIES_E2E_PORT,
  ];
  if (!loggedServicePorts) {
    console.log('[preload] service port envs', {
      BLACKSKIES_SERVICES_PORT: primaryRaw ?? null,
      BLACKSKIES_E2E_PORT: fallbackRaw ?? null,
    });
    loggedServicePorts = true;
  }
  const raw = primaryRaw ?? fallbackRaw;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeError(message: string, extra?: Partial<ServiceError>): ServiceError {
  return {
    message,
    ...extra,
  };
}

function isFileMissingError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { code?: string };
  return candidate.code === 'ENOENT';
}

async function readLastVerificationFromPath(
  projectPath?: string | null,
): Promise<ServiceResult<BackupVerificationReport | null>> {
  if (!projectPath) {
    return { ok: true, data: null };
  }
  const normalized = resolve(projectPath);
  const verificationPath = join(normalized, '.snapshots', 'last_verification.json');
  const relativePath = relative(normalized, verificationPath);
  if (relativePath.startsWith('..')) {
    return {
      ok: false,
      error: normalizeError('Project path resolves outside the project root.'),
    };
  }
  try {
    const contents = await fs.readFile(verificationPath, { encoding: 'utf-8' });
    if (!contents) {
      return { ok: true, data: null };
    }
    const payload = JSON.parse(contents);
    if (payload && typeof payload === 'object') {
      const normalized = {
        ...(payload as BackupVerificationReport),
        report_observation: {
          claim_scope: 'persisted-verification-report-read',
          strongest_authority: 'A3',
          supporting_authorities: [],
          historical_only: true,
          does_not_imply: [
            'integrity-valid',
            'report-fresh',
            'restorable',
            'browseable',
          ],
        },
      } satisfies BackupVerificationReport;
      return { ok: true, data: normalized };
    }
    return { ok: true, data: payload as BackupVerificationReport };
  } catch (error) {
    if (isFileMissingError(error)) {
      return { ok: true, data: null };
    }
    const message =
      error instanceof Error ? error.message : 'Unable to read verification data.';
    console.warn('[preload] Failed to read last_verification.json', error);
    return { ok: false, error: normalizeError(message) };
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  if (timeoutMs <= 0) {
    return fetch(url, init);
  }

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BridgeTimeoutError(timeoutMs);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new BridgeNetworkError(message);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function summarizeBodyByteLength(body: BodyInit | null | undefined): number {
  if (typeof body === 'string') {
    return new TextEncoder().encode(body).byteLength;
  }
  return 0;
}

function summarizeRequestUnitCount(body: Record<string, unknown> | undefined): number {
  const unitIds = body?.unit_ids;
  if (!Array.isArray(unitIds)) {
    return 0;
  }
  return unitIds.filter((unitId) => typeof unitId === 'string' && unitId.length > 0).length;
}

function resolveRequestTimeoutMs(unitCount: number): number {
  const scaledUnitCount = Math.max(1, unitCount);
  return Math.min(
    DRAFT_REQUEST_MAX_TIMEOUT_MS,
    REQUEST_POLICY.timeoutMs * scaledUnitCount,
  );
}

function resolveRouteTimeoutMs(normalizedPath: string, unitCount: number): number {
  if (normalizedPath === 'snapshots') {
    return SNAPSHOT_CREATE_REQUEST_TIMEOUT_MS;
  }
  if (normalizedPath === 'restore') {
    return RESTORE_REQUEST_TIMEOUT_MS;
  }
  if (normalizedPath === 'backups') {
    return BACKUP_CREATE_REQUEST_TIMEOUT_MS;
  }
  if (normalizedPath === 'backups/restore') {
    return BACKUP_RESTORE_REQUEST_TIMEOUT_MS;
  }
  return resolveRequestTimeoutMs(unitCount);
}

function buildTimeoutDetails(
  normalizedPath: string,
  timeoutMs: number,
  unitCount: number,
): Record<string, unknown> {
  const baseDetails: Record<string, unknown> = {
    timeout_ms: timeoutMs,
    unit_count: unitCount,
  };
  if (normalizedPath === 'restore') {
    return {
      ...baseDetails,
      operation_name: 'restore-copy',
      completion_status: 'unknown',
      backend_may_still_be_running: true,
    };
  }
  if (normalizedPath === 'snapshots') {
    return {
      ...baseDetails,
      operation_name: 'snapshot-create',
      completion_status: 'unknown',
      backend_may_still_be_running: true,
    };
  }
  if (normalizedPath === 'backups') {
    return {
      ...baseDetails,
      operation_name: 'backup-create',
      completion_status: 'unknown',
      backend_may_still_be_running: true,
    };
  }
  if (normalizedPath === 'backups/restore') {
    return {
      ...baseDetails,
      operation_name: 'backup-restore-copy',
      completion_status: 'unknown',
      backend_may_still_be_running: true,
    };
  }
  return baseDetails;
}

async function fetchWithResilience(
  url: string,
  init: RequestInit,
  method: HttpMethod,
  phaseLogPrefix: string | null,
  requestTraceId?: string,
  timeoutMs = REQUEST_POLICY.timeoutMs,
  unitCount = 0,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= REQUEST_POLICY.maxAttempts; attempt += 1) {
    if (!REQUEST_BREAKER.allow()) {
      throw new BridgeCircuitOpenError('Service bridge circuit is open.');
    }

    try {
      if (phaseLogPrefix) {
        console.info(`[${phaseLogPrefix}:request-start]`, {
          traceId: requestTraceId ?? null,
          method,
          url,
          timeoutMs,
          unitCount,
          bodyByteLength: summarizeBodyByteLength(init.body),
          timestamp: new Date().toISOString(),
          attempt,
        });
      }
      const response = await fetchWithTimeout(url, init, timeoutMs);
      REQUEST_BREAKER.recordSuccess();
      return response;
    } catch (error) {
      lastError = error;
      let circuitOpened = false;
      if (!(error instanceof BridgeCircuitOpenError)) {
        circuitOpened = REQUEST_BREAKER.recordFailure();
        if (circuitOpened && !(error instanceof BridgeTimeoutError)) {
          lastError = new BridgeCircuitOpenError('Service bridge circuit is open.');
        }
      }

      const retryable =
        method === 'GET' && attempt < REQUEST_POLICY.maxAttempts && !circuitOpened;
      if (!retryable) {
        break;
      }
      await sleep(REQUEST_POLICY.backoffMs * attempt);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Service request failed.');
}

function formatLogArgument(argument: unknown): string {
  if (typeof argument === 'string') {
    return argument;
  }

  if (argument instanceof Error) {
    return argument.stack ?? `${argument.name}: ${argument.message}`;
  }

  const seen = new WeakSet<object>();
  try {
    const json = JSON.stringify(
      argument,
      (_key, value: unknown) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }

        if (typeof value === 'symbol') {
          return value.toString();
        }

        if (typeof value === 'object' && value !== null) {
          if (seen.has(value as object)) {
            return '[Circular]';
          }
          seen.add(value as object);
        }

        return value;
      },
      2,
    );
    if (typeof json === 'string') {
      return json;
    }
  } catch (error) {
    // Ignore serialization errors and fall through to the string fallback.
  }

  return String(argument);
}

async function parseErrorPayload(
  response: Response,
  headerTraceId?: string,
): Promise<ServiceError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (parseError) {
    return normalizeError(`Service responded with HTTP ${response.status}.`, {
      httpStatus: response.status,
      details: { parseError: String(parseError) },
      traceId: headerTraceId,
    });
  }

  let payloadTraceId: string | undefined;
  if (payload && typeof payload === 'object' && 'trace_id' in payload) {
    const traceCandidate = (payload as { trace_id?: unknown }).trace_id;
    if (typeof traceCandidate === 'string' && traceCandidate.length > 0) {
      payloadTraceId = traceCandidate;
    }
  }

  const traceId = payloadTraceId ?? headerTraceId;

  if (
    payload &&
    typeof payload === 'object' &&
    'code' in payload &&
    typeof (payload as { code: unknown }).code === 'string'
  ) {
    return {
      code: (payload as { code: string }).code,
      message:
        typeof (payload as { message?: unknown }).message === 'string'
          ? ((payload as { message?: string }).message as string)
          : `Service responded with HTTP ${response.status}.`,
      details: (payload as { details?: unknown }).details,
      httpStatus: response.status,
      traceId,
    };
  }

  return normalizeError(`Service responded with HTTP ${response.status}.`, {
    httpStatus: response.status,
    details: payload ?? undefined,
    traceId,
  });
}

export async function makeServiceCall<T>(
  path: string,
  method: HttpMethod,
  body?: Record<string, unknown>,
  requestTraceId?: string,
): Promise<ServiceResult<T>> {
  const port = currentServicePort();
  if (!port) {
    console.warn(
      '[preload] makeServiceCall missing service port for',
      path,
      {
        env: {
          BLACKSKIES_SERVICES_PORT: process.env.BLACKSKIES_SERVICES_PORT,
          BLACKSKIES_E2E_PORT: process.env.BLACKSKIES_E2E_PORT,
        },
      },
    );
    return {
      ok: false,
      error: normalizeError('Service port is unavailable. Set BLACKSKIES_SERVICES_PORT.', {
        code: 'PORT_UNAVAILABLE',
        details: {
          service_port: process.env.BLACKSKIES_SERVICES_PORT ?? null,
          e2e_port: process.env.BLACKSKIES_E2E_PORT ?? null,
        },
        traceId: requestTraceId,
      }),
      traceId: requestTraceId,
    };
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `http://127.0.0.1:${port}/api/v1/${normalizedPath}`;
  const phaseLabel =
    normalizedPath === 'draft/preflight'
      ? 'preflight'
      : normalizedPath === 'draft/generate'
        ? 'draft-generate'
        : null;
  const phaseLogPrefix = phaseLabel === 'draft-generate' ? 'preload:draft-generate' : phaseLabel;
  const startedAt = performance.now();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (requestTraceId) {
    headers['x-trace-id'] = requestTraceId;
  }
  const requestInit: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };
  const unitCount = summarizeRequestUnitCount(body);
  const timeoutMs = resolveRouteTimeoutMs(normalizedPath, unitCount);

  try {
    if (phaseLogPrefix) {
      console.info(`[${phaseLogPrefix}:request]`, {
        traceId: requestTraceId ?? null,
        servicePort: port,
        timeoutMs,
        unitCount,
        url,
      });
    }
    const response = await fetchWithResilience(
      url,
      requestInit,
      method,
      phaseLogPrefix,
      requestTraceId,
      timeoutMs,
      unitCount,
    );

    const traceId = response.headers.get('x-trace-id') ?? undefined;

    if (!response.ok) {
      const error = await parseErrorPayload(response, traceId);
      if (phaseLogPrefix) {
        console.info(`[${phaseLogPrefix}:response]`, {
          traceId: error.traceId ?? traceId ?? requestTraceId ?? null,
          ok: false,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          code: error.code ?? null,
        });
        console.warn(`[${phaseLogPrefix}:error]`, {
          traceId: error.traceId ?? traceId ?? requestTraceId ?? null,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          code: error.code ?? null,
        });
        if (phaseLabel === 'draft-generate') {
          console.info(`[${phaseLogPrefix}:returning]`, {
            traceId: error.traceId ?? traceId ?? requestTraceId ?? null,
            ok: false,
            status: response.status,
            durationMs: Math.round(performance.now() - startedAt),
            resultType: 'error',
            resultKeys: Object.keys(error ?? {}),
          });
        }
      }
      return { ok: false, error, traceId: error.traceId ?? traceId };
    }

    if (response.status === 204) {
      if (phaseLogPrefix) {
        console.info(`[${phaseLogPrefix}:response]`, {
          traceId: traceId ?? requestTraceId ?? null,
          ok: true,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
        });
        console.info(`[${phaseLogPrefix}:returning]`, {
          traceId: traceId ?? requestTraceId ?? null,
          ok: true,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          resultType: 'void',
        });
      }
      return { ok: true, data: undefined as T, traceId };
    }

    try {
      const data = (await response.json()) as T;
      if (phaseLogPrefix) {
        const resultKeys =
          data && typeof data === 'object' ? Object.keys(data as Record<string, unknown>) : [];
        console.info(`[${phaseLogPrefix}:response]`, {
          traceId: traceId ?? requestTraceId ?? null,
          ok: true,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          resultType: Array.isArray(data) ? 'array' : typeof data,
          resultKeys,
        });
        console.info(`[${phaseLogPrefix}:returning]`, {
          traceId: traceId ?? requestTraceId ?? null,
          ok: true,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          resultType: Array.isArray(data) ? 'array' : typeof data,
          resultKeys,
        });
      }
      return { ok: true, data, traceId };
    } catch (parseError) {
      const parseMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      if (phaseLogPrefix) {
        console.warn(`[${phaseLogPrefix}:error]`, {
          traceId: traceId ?? requestTraceId ?? null,
          status: response.status,
          durationMs: Math.round(performance.now() - startedAt),
          message: parseMessage,
        });
        if (phaseLabel === 'draft-generate') {
          console.info(`[${phaseLogPrefix}:returning]`, {
            traceId: traceId ?? requestTraceId ?? null,
            ok: false,
            status: response.status,
            durationMs: Math.round(performance.now() - startedAt),
            resultType: 'parse-error',
          });
        }
      }
      const error = normalizeError('Failed to parse response payload.', {
        traceId,
        httpStatus: response.status,
        details: { parseError: parseMessage },
      });
      return { ok: false, error, traceId };
    }
  } catch (error) {
    if (error instanceof BridgeCircuitOpenError) {
      if (phaseLogPrefix) {
        console.warn(`[${phaseLogPrefix}:error]`, {
          traceId: requestTraceId ?? null,
          servicePort: port,
          timeoutMs,
          unitCount,
          url,
          durationMs: Math.round(performance.now() - startedAt),
          code: 'SERVICE_UNAVAILABLE',
        });
        if (phaseLabel === 'draft-generate') {
          console.info(`[${phaseLogPrefix}:returning]`, {
            traceId: requestTraceId ?? null,
            ok: false,
            durationMs: Math.round(performance.now() - startedAt),
            resultType: 'error',
            code: 'SERVICE_UNAVAILABLE',
          });
        }
      }
      return {
        ok: false,
        error: normalizeError('Service requests temporarily unavailable.', {
          code: 'SERVICE_UNAVAILABLE',
          traceId: requestTraceId,
        }),
        traceId: requestTraceId,
      };
    }
    if (error instanceof BridgeTimeoutError) {
      if (phaseLogPrefix) {
        console.warn(`[${phaseLogPrefix}:error]`, {
          traceId: requestTraceId ?? null,
          servicePort: port,
          timeoutMs: error.timeoutMs,
          unitCount,
          url,
          durationMs: Math.round(performance.now() - startedAt),
          code: 'TIMEOUT',
        });
        if (phaseLabel === 'draft-generate') {
          console.info(`[${phaseLogPrefix}:returning]`, {
            traceId: requestTraceId ?? null,
            ok: false,
            durationMs: Math.round(performance.now() - startedAt),
            resultType: 'error',
            code: 'TIMEOUT',
          });
        }
      }
      return {
        ok: false,
        error: normalizeError(error.message, {
          code: 'TIMEOUT',
          details: buildTimeoutDetails(normalizedPath, error.timeoutMs, unitCount),
          traceId: requestTraceId,
        }),
        traceId: requestTraceId,
      };
    }
    if (error instanceof BridgeNetworkError) {
      if (phaseLogPrefix) {
        console.warn(`[${phaseLogPrefix}:error]`, {
          traceId: requestTraceId ?? null,
          servicePort: port,
          timeoutMs,
          unitCount,
          url,
          message: error.message,
          durationMs: Math.round(performance.now() - startedAt),
          code: 'NETWORK_ERROR',
        });
        if (phaseLabel === 'draft-generate') {
          console.info(`[${phaseLogPrefix}:returning]`, {
            traceId: requestTraceId ?? null,
            ok: false,
            durationMs: Math.round(performance.now() - startedAt),
            resultType: 'error',
            code: 'NETWORK_ERROR',
          });
        }
      }
      console.warn('[preload] makeServiceCall network failure for', url, {
        message: error.message,
      });
      const message = error.message || 'Network request failed.';
      return {
        ok: false,
        error: normalizeError(`Service request to ${url} failed: ${message}`, {
          code: 'NETWORK_ERROR',
          details: { url, message },
          traceId: requestTraceId,
        }),
        traceId: requestTraceId,
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    if (phaseLabel === 'draft-generate') {
      console.info(`[${phaseLogPrefix}:returning]`, {
        traceId: requestTraceId ?? null,
        ok: false,
        durationMs: Math.round(performance.now() - startedAt),
        resultType: 'throw',
        code: error instanceof Error ? error.name : 'UNKNOWN',
      });
    }
    return { ok: false, error: normalizeError(message) };
  }
}

async function probeHealth(): Promise<ServiceHealthResponse> {
  const port = currentServicePort();
  if (!port) {
    return {
      ok: false,
      error: normalizeError('Service port is unavailable.'),
    };
  }

  const url = `http://127.0.0.1:${port}/api/v1/healthz`;

  try {
    const response = await fetchWithResilience(url, { method: 'GET' }, 'GET', null);
    const traceId = response.headers.get('x-trace-id') ?? undefined;
    if (!response.ok) {
      const error = await parseErrorPayload(response, traceId);
      return {
        ok: false,
        error,
        traceId: error.traceId ?? traceId,
      };
    }

    let data: ServiceHealthResponse['data'];
    try {
      data = (await response.json()) as ServiceHealthResponse['data'];
    } catch (parseError) {
      const parseMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      return {
        ok: false,
        error: normalizeError('Failed to parse health payload.', {
          traceId,
          httpStatus: response.status,
          details: { parseError: parseMessage },
        }),
        traceId,
      };
    }
    if (data?.status === 'ok' || data?.status === 'online') {
      const normalized = {
        ...data,
        status: 'online',
      };
      return { ok: true, data: normalized, traceId };
    }

    return {
      ok: false,
      data,
      error: normalizeError('Service reported an unhealthy status.', {
        traceId,
        httpStatus: response.status,
      }),
      traceId,
    };
  } catch (error) {
    if (error instanceof BridgeCircuitOpenError) {
      return {
        ok: false,
        error: normalizeError('Service requests temporarily unavailable.'),
      };
    }
    if (error instanceof BridgeTimeoutError) {
      return {
        ok: false,
        error: normalizeError(error.message, {
          code: 'TIMEOUT',
          details: { timeout_ms: error.timeoutMs },
        }),
      };
    }
    if (error instanceof BridgeNetworkError) {
      return {
        ok: false,
        error: normalizeError(error.message, { code: 'NETWORK_ERROR' }),
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: normalizeError(message) };
  }
}

function forwardConsole(method: ConsoleMethod): void {
  const original = console[method].bind(console);
  console[method] = (...args: unknown[]) => {
    original(...args);

    try {
      const payload: DiagnosticsLogPayload = {
        level: LOG_LEVEL_MAP[method],
        scope: 'renderer.console',
        message: args.map((argument) => formatLogArgument(argument)).join(' '),
      };
      ipcRenderer.send(LOGGING_CHANNELS.diagnostics, payload);
    } catch (error) {
      original('Failed to forward renderer log entry', error);
    }
  };
}

function registerConsoleForwarding(): void {
  (Object.keys(LOG_LEVEL_MAP) as ConsoleMethod[]).forEach((method) => {
    forwardConsole(method);
  });
}

function buildProjectPayload(
  projectId: string,
  extras: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    project_id: projectId,
    ...extras,
  };
}

function normalizedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function setOptional(target: Record<string, unknown>, key: string, value: unknown): void {
  if (value !== undefined && value !== null) {
    target[key] = value;
  }
}

function setOptionalString(target: Record<string, unknown>, key: string, value: unknown): void {
  const normalized = normalizedString(value);
  if (normalized !== undefined) {
    target[key] = normalized;
  }
}

function serializeOutlineRequest({
  projectId,
  forceRebuild,
  wizardLocks,
}: OutlineBuildBridgeRequest): Record<string, unknown> {
  return buildProjectPayload(projectId, {
    force_rebuild: Boolean(forceRebuild),
    wizard_locks: {
      acts: wizardLocks.acts.map(({ title }) => ({ title })),
      chapters: wizardLocks.chapters.map(({ title, actIndex }) => ({
        title,
        act_index: actIndex,
      })),
      scenes: wizardLocks.scenes.map(({ title, chapterIndex, beatRefs }) => ({
        title,
        chapter_index: chapterIndex,
        beat_refs: beatRefs ?? [],
      })),
    },
  });
}

function serializeWizardSnapshotRequest({
  projectId,
  step,
  label,
  includes,
}: WizardLockSnapshotBridgeRequest): Record<string, unknown> {
  const payload = buildProjectPayload(projectId, { step });
  setOptionalString(payload, 'label', label);
  if (includes && includes.length > 0) {
    setOptional(payload, 'includes', includes);
  }
  return payload;
}

function serializeDraftOverrides(
  overrides?: Record<string, DraftUnitOverrides | undefined>,
): Record<string, unknown> | undefined {
  if (!overrides) {
    return undefined;
  }

  const entries: Array<[string, Record<string, unknown>]> = [];
  for (const [key, override] of Object.entries(overrides)) {
    if (!override) {
      continue;
    }
    entries.push([
      key,
      {
        order: override.order,
        purpose: override.purpose,
        emotion_tag: override.emotion_tag,
        pov: override.pov,
        goal: override.goal,
        conflict: override.conflict,
        turn: override.turn,
        word_target: override.word_target,
        beats: override.beats,
      },
    ]);
  }

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function serializeDraftGenerateRequest({
  projectId,
  unitScope,
  unitIds,
  temperature,
  seed,
  overrides,
}: DraftGenerateBridgeRequest): Record<string, unknown> {
  return buildProjectPayload(projectId, {
    unit_scope: unitScope,
    unit_ids: unitIds,
    temperature,
    seed,
    overrides: serializeDraftOverrides(overrides),
  });
}

function serializeCritiqueRequest({
  projectId,
  draftId,
  unitId,
  rubric,
}: DraftCritiqueBridgeRequest): Record<string, unknown> {
  return buildProjectPayload(projectId, {
    draft_id: draftId,
    unit_id: unitId,
    rubric,
  });
}

function serializeAcceptRequest({
  projectId,
  projectPath,
  draftId,
  unitId,
  unit,
  message,
  snapshotLabel,
}: DraftAcceptBridgeRequest): Record<string, unknown> {
  const unitPayload: Record<string, unknown> = {
    id: unit.id,
    previous_sha256: unit.previous_sha256,
    text: unit.text,
  };
  if (unit.meta && Object.keys(unit.meta).length > 0) {
    unitPayload.meta = unit.meta;
  }

  const payload: Record<string, unknown> = {
    project_id: projectId,
    draft_id: draftId,
    unit_id: unitId,
    unit: unitPayload,
  };

  setOptionalString(payload, 'project_path', projectPath);
  setOptionalString(payload, 'message', message);
  setOptionalString(payload, 'snapshot_label', snapshotLabel);

  return payload;
}

function serializePhase4CritiqueRequest({
  projectId,
  sceneId,
  text,
  mode,
}: Phase4CritiqueBridgeRequest): Record<string, unknown> {
  return {
    project_id: projectId,
    scene_id: sceneId,
    text,
    mode,
  };
}

function serializePhase4RewriteRequest({
  projectId,
  sceneId,
  originalText,
  instructions,
}: Phase4RewriteBridgeRequest): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    project_id: projectId,
    scene_id: sceneId,
    original_text: originalText,
  };
  setOptionalString(payload, 'instructions', instructions);
  return payload;
}

function serializeDraftRewriteRequest({
  projectId,
  draftId,
  unitId,
  unit,
  instructions,
  newText,
}: DraftRewriteBridgeRequest): Record<string, unknown> {
  const payload = buildProjectPayload(projectId, {
    draft_id: draftId,
    unit_id: unitId,
    unit,
  });
  setOptionalString(payload, 'instructions', instructions);
  setOptionalString(payload, 'new_text', newText);
  return payload;
}

function serializePreflightRequest({
  projectId,
  unitScope,
  unitIds,
}: DraftPreflightBridgeRequest): Record<string, unknown> {
  return buildProjectPayload(projectId, {
    unit_scope: unitScope,
    unit_ids: unitIds,
  });
}

function serializeRecoveryRestoreRequest({
  projectId,
  snapshotId,
}: RecoveryRestoreBridgeRequest): Record<string, unknown> {
  const payload = buildProjectPayload(projectId);
  setOptionalString(payload, 'snapshot_id', snapshotId);
  return payload;
}

export const serviceApi = {
  buildOutline: (request: OutlineBuildBridgeRequest) =>
    makeServiceCall<OutlineBuildBridgeResponse>(
      'outline/build',
      'POST',
      serializeOutlineRequest(request),
    ),
  generateDraft: (request: DraftGenerateBridgeRequest, traceId?: string) =>
    makeServiceCall<DraftGenerateBridgeResponse>(
      'draft/generate',
      'POST',
      serializeDraftGenerateRequest(request),
      traceId,
    ),
  critiqueDraft: (request: DraftCritiqueBridgeRequest) =>
    makeServiceCall<DraftCritiqueBridgeResponse>(
      'draft/critique',
      'POST',
      serializeCritiqueRequest(request),
    ),
  rewriteDraft: (request: DraftRewriteBridgeRequest) =>
    makeServiceCall<DraftRewriteBridgeResponse>(
      'draft/rewrite',
      'POST',
      serializeDraftRewriteRequest(request),
    ),
  phase4Critique: (request: Phase4CritiqueBridgeRequest) =>
    makeServiceCall<Phase4CritiqueBridgeResponse>(
      'phase4/critique',
      'POST',
      serializePhase4CritiqueRequest(request),
    ),
  phase4Rewrite: (request: Phase4RewriteBridgeRequest) =>
    makeServiceCall<Phase4RewriteBridgeResponse>(
      'phase4/rewrite',
      'POST',
      serializePhase4RewriteRequest(request),
    ),
  preflightDraft: (request: DraftPreflightBridgeRequest) =>
    makeServiceCall<DraftPreflightEstimate>(
      'draft/preflight',
      'POST',
      serializePreflightRequest(request),
      request.traceId ?? randomUUID(),
    ),
  acceptDraft: (request: DraftAcceptBridgeRequest) =>
    makeServiceCall<DraftAcceptBridgeResponse>(
      'draft/accept',
      'POST',
      serializeAcceptRequest(request),
    ),
  createSnapshot: (request: WizardLockSnapshotBridgeRequest) =>
    makeServiceCall<WizardLockSnapshotBridgeResponse>(
      'draft/wizard/lock',
      'POST',
      serializeWizardSnapshotRequest(request),
    ),
  getRecoveryStatus: (request: RecoveryStatusBridgeRequest) => {
    const params = new URLSearchParams({ project_id: request.projectId });
    return makeServiceCall<RecoveryStatusBridgeResponse>(
      `draft/recovery?${params.toString()}`,
      'GET',
    );
  },
  restoreSnapshot: (request: RecoveryRestoreBridgeRequest) =>
    makeServiceCall<RecoveryRestoreBridgeResponse>(
      'draft/recovery/restore',
      'POST',
      serializeRecoveryRestoreRequest(request),
    ),
  restoreFromZip: (request: RestoreFromZipRequest) =>
    makeServiceCall<RestoreFromZipResponse>('restore', 'POST', {
      projectId: request.projectId,
      ...(request.zipName ? { zipName: request.zipName } : {}),
      restoreAsNew: request.restoreAsNew,
    }),
  analyticsSummary: (projectId: string, forceRefresh = false) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (forceRefresh) {
      params.set('force_refresh', 'true');
    }
    return makeServiceCall<AnalyticsSummary>(`analytics/summary?${params.toString()}`, 'GET');
  },
  analyticsScenes: (projectId: string, forceRefresh = false) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (forceRefresh) {
      params.set('force_refresh', 'true');
    }
    return makeServiceCall<AnalyticsScenes>(`analytics/scenes?${params.toString()}`, 'GET');
  },
  analyticsRelationships: (projectId: string) => {
    const params = new URLSearchParams({ project_id: projectId });
    return makeServiceCall<AnalyticsRelationshipGraph>(
      `analytics/relationships?${params.toString()}`,
      'GET',
    );
  },
  createBackup: (request: BackupCreateBridgeRequest) =>
    makeServiceCall<BackupCreateBridgeResponse>('backups', 'POST', {
      projectId: request.projectId,
    }),
  listBackups: (request: BackupListBridgeRequest) => {
    const params = new URLSearchParams({ projectId: request.projectId });
    return makeServiceCall<BackupListBridgeResponse>(`backups?${params.toString()}`, 'GET');
  },
  restoreBackup: (request: BackupRestoreBridgeRequest) =>
    makeServiceCall<BackupRestoreBridgeResponse>('backups/restore', 'POST', {
      projectId: request.projectId,
      backupName: request.backupName,
      restoreAsNew: request.restoreAsNew,
    }),
  exportProject: (request: ProjectExportBridgeRequest) =>
    makeServiceCall<ProjectExportBridgeResponse>('export', 'POST', {
      project_id: request.projectId,
      ...(request.projectPath ? { project_path: request.projectPath } : {}),
      ...(request.format ? { format: request.format } : {}),
      include_meta_header: Boolean(request.includeMetaHeader),
    }),
  createProjectSnapshot: (request: { projectId: string }) =>
    makeServiceCall<SnapshotManifest>(
      'snapshots',
      'POST',
      { project_id: request.projectId },
    ),
  listProjectSnapshots: (request: { projectId: string }) => {
    const params = new URLSearchParams({ projectId: request.projectId });
    return makeServiceCall<SnapshotManifest[]>(`snapshots?${params.toString()}`, 'GET');
  },
  getBackupVerificationReport: (request: { projectId: string }) => {
    const params = new URLSearchParams({ projectId: request.projectId });
    return makeServiceCall<BackupVerificationReport>(
      `backup_verifier/report?${params.toString()}`,
      'GET',
    );
  },
  getLastVerification: (request: { projectId: string; projectPath?: string | null }) =>
    readLastVerificationFromPath(request.projectPath),
  runBackupVerification: (request: { projectId: string; latestOnly: boolean }) => {
    const params = new URLSearchParams({
      projectId: request.projectId,
      latest_only: request.latestOnly ? 'true' : 'false',
    });
    return makeServiceCall<BackupVerificationReport>(
      `backup_verifier/run?${params.toString()}`,
      'POST',
    );
  },
};

const projectLoaderApi: ProjectLoaderApi = {
  async openProjectDialog(): Promise<ProjectDialogResult> {
    const result = await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.openDialog);
    return result as ProjectDialogResult;
  },
  async loadProject(request: ProjectLoadRequest): Promise<ProjectLoadResponse> {
    const response = await ipcRenderer.invoke(
      PROJECT_LOADER_CHANNELS.loadProject,
      request,
    );
    return response as ProjectLoadResponse;
  },
  async createProject(request: ProjectBootstrapRequest): Promise<ProjectBootstrapResponse> {
    const response = await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.createProject, request);
    return response as ProjectBootstrapResponse;
  },
  async saveDraft(request: ProjectDraftSaveRequest): Promise<ProjectDraftSaveResponse> {
    const response = await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.saveDraft, request);
    return response as ProjectDraftSaveResponse;
  },
  async getSampleProjectPath(): Promise<string | null> {
    if (process.env.BLACKSKIES_VISUAL_STABLE === '1') {
      return null;
    }
    try {
      const path = await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.getSamplePath);
      return typeof path === 'string' ? path : null;
    } catch (error) {
      console.warn('[preload] Failed to resolve sample project path', error);
      return null;
    }
  },
};

function hasExactOwnKeys(value: unknown, expectedKeys: readonly string[]): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && keys.every((key) => expectedKeys.includes(key));
}

function normalizeProjectSpineSnapshot(value: unknown): ProjectSpineSessionSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const snapshot = value as Partial<ProjectSpineSessionSnapshot>;
  if (
    snapshot.schemaVersion !== 1 ||
    (snapshot.role !== 'writing' && snapshot.role !== 'command') ||
    typeof snapshot.generation !== 'number' ||
    typeof snapshot.revision !== 'number' ||
    !Array.isArray(snapshot.recentProjects) ||
    !Array.isArray(snapshot.dirtyUnitIds) ||
    !snapshot.saveState
  ) {
    return null;
  }
  if (snapshot.role === 'command') {
    const commandSnapshotKeys = [
      'schemaVersion',
      'role',
      'generation',
      'revision',
      'project',
      'activeUnitId',
      'recentProjects',
      'dirtyUnitIds',
      'saveState',
      'lastError',
      'commandStatus',
    ];
    const projectKeys = ['projectId', 'path', 'title', 'schemaVersion', 'units'];
    const unitKeys = ['id', 'title', 'displayTitle', 'order'];
    const recentProjectKeys = ['path', 'title', 'lastOpened', 'stale'];
    const saveStateKeys = ['status', 'unitId', 'message'];
    const lastErrorKeys = ['code', 'message'];
    if (
      !hasExactOwnKeys(snapshot, commandSnapshotKeys) ||
      !Number.isInteger(snapshot.generation) ||
      snapshot.generation < 0 ||
      !Number.isInteger(snapshot.revision) ||
      snapshot.revision < 0 ||
      (snapshot.activeUnitId !== null && typeof snapshot.activeUnitId !== 'string') ||
      snapshot.dirtyUnitIds.some((unitId) => typeof unitId !== 'string') ||
      new Set(snapshot.dirtyUnitIds).size !== snapshot.dirtyUnitIds.length ||
      !hasExactOwnKeys(snapshot.saveState, saveStateKeys) ||
      (snapshot.saveState.unitId !== null && typeof snapshot.saveState.unitId !== 'string') ||
      (snapshot.saveState.message !== null && typeof snapshot.saveState.message !== 'string') ||
      (snapshot.lastError !== null && (
        !hasExactOwnKeys(snapshot.lastError, lastErrorKeys) ||
        typeof snapshot.lastError.code !== 'string' ||
        typeof snapshot.lastError.message !== 'string'
      )) ||
      snapshot.recentProjects.some((recent) =>
        !hasExactOwnKeys(recent, recentProjectKeys) ||
        typeof recent.path !== 'string' ||
        typeof recent.title !== 'string' ||
        !Number.isFinite(recent.lastOpened) ||
        typeof recent.stale !== 'boolean') ||
      (snapshot.project !== null && (
        !hasExactOwnKeys(snapshot.project, projectKeys) ||
        typeof snapshot.project.projectId !== 'string' ||
        typeof snapshot.project.path !== 'string' ||
        typeof snapshot.project.title !== 'string' ||
        snapshot.project.schemaVersion !== 'ProjectMetadataSchema v1' ||
        !Array.isArray(snapshot.project.units) ||
        snapshot.project.units.some((unit) =>
          !hasExactOwnKeys(unit, unitKeys) ||
          typeof unit.id !== 'string' ||
          typeof unit.title !== 'string' ||
          typeof unit.displayTitle !== 'string' ||
          !Number.isInteger(unit.order))
      ))
    ) {
      return null;
    }
    const commandStatus = snapshot.commandStatus;
    const lifecycleStatuses = new Set(['no-active-project', 'active', 'operation-failed']);
    const recoveryStatuses = new Set([
      'none',
      'decision-required',
      'accepted-pending-save',
      'degraded',
    ]);
    const saveStatuses = new Set([
      'clean',
      'dirty',
      'saving',
      'saved',
      'save-failed',
      'accepted-recovery-pending-save',
    ]);
    const projectSaveStatuses = new Set(['clean', 'dirty', 'saving', 'saved', 'save-failed']);
    const commandStatusKeys = [
      'schemaVersion',
      'projectId',
      'generation',
      'revision',
      'lifecycle',
      'recovery',
      'save',
    ];
    const projectedProjectId = snapshot.project?.projectId ?? null;
    const acceptedRecoveryPendingSave = commandStatus?.recovery === 'accepted-pending-save';
    const projectedSaveStatus = acceptedRecoveryPendingSave && snapshot.saveState.status === 'dirty'
      ? 'accepted-recovery-pending-save'
      : snapshot.saveState.status;
    const hasDirtyUnits = snapshot.dirtyUnitIds.length > 0;
    if (
      !hasExactOwnKeys(commandStatus, commandStatusKeys) ||
      commandStatus.schemaVersion !== 1 ||
      (commandStatus.projectId !== null && typeof commandStatus.projectId !== 'string') ||
      commandStatus.projectId !== projectedProjectId ||
      commandStatus.generation !== snapshot.generation ||
      commandStatus.revision !== snapshot.revision ||
      !lifecycleStatuses.has(commandStatus.lifecycle) ||
      !recoveryStatuses.has(commandStatus.recovery) ||
      !saveStatuses.has(commandStatus.save) ||
      !projectSaveStatuses.has(snapshot.saveState.status) ||
      commandStatus.save !== projectedSaveStatus ||
      (commandStatus.lifecycle === 'active' && projectedProjectId === null) ||
      (commandStatus.lifecycle === 'no-active-project' && projectedProjectId !== null) ||
      (snapshot.activeUnitId !== null && !snapshot.project?.units.some((unit) => unit.id === snapshot.activeUnitId)) ||
      snapshot.dirtyUnitIds.some((unitId) => !snapshot.project?.units.some((unit) => unit.id === unitId)) ||
      (['dirty', 'save-failed'].includes(snapshot.saveState.status) && !hasDirtyUnits) ||
      (['clean', 'saved'].includes(snapshot.saveState.status) && hasDirtyUnits) ||
      (acceptedRecoveryPendingSave && (!hasDirtyUnits || !['dirty', 'saving', 'save-failed'].includes(snapshot.saveState.status))) ||
      (projectedProjectId === null && (
        commandStatus.recovery !== 'none' ||
        commandStatus.save !== 'clean' ||
        snapshot.saveState.status !== 'clean' ||
        snapshot.activeUnitId !== null ||
        hasDirtyUnits
      ))
    ) {
      return null;
    }
  }
  if (snapshot.role === 'writing') {
    if (Object.prototype.hasOwnProperty.call(snapshot, 'commandStatus')) return null;
    const recovery = snapshot.recovery;
    if (!recovery || !Array.isArray(recovery.candidates)) return null;
    if (recovery.status === 'degraded') {
      const degradedReasons = new Set([
        'read-failed', 'corrupt-artifact', 'unsupported-schema', 'project-mismatch',
        'path-mismatch', 'unknown-unit', 'baseline-mismatch', 'stale-candidate',
        'active-session-candidate',
      ]);
      if (!degradedReasons.has(recovery.reason) || typeof recovery.message !== 'string' || recovery.candidates.length !== 0) {
        return null;
      }
    } else if (
      recovery.status !== 'none' &&
      recovery.status !== 'decision-required' &&
      recovery.status !== 'accepted-pending-save'
    ) {
      return null;
    }
    if ((recovery.status === 'none' && recovery.candidates.length !== 0) || recovery.candidates.some((candidate) =>
      !candidate ||
      typeof candidate !== 'object' ||
      typeof candidate.projectId !== 'string' ||
      typeof candidate.projectPath !== 'string' ||
      typeof candidate.unitId !== 'string' ||
      typeof candidate.unitTitle !== 'string' ||
      !Number.isInteger(candidate.unitOrder) ||
      typeof candidate.originSessionId !== 'string' ||
      !Number.isInteger(candidate.priorSessionGeneration) ||
      !Number.isInteger(candidate.priorSessionRevision) ||
      typeof candidate.durableBaselineFingerprint !== 'string' ||
      typeof candidate.prose !== 'string' ||
      !Number.isInteger(candidate.candidateVersion) ||
      typeof candidate.updatedAt !== 'string' ||
      (recovery.status === 'decision-required'
        ? candidate.decision !== 'available' && candidate.decision !== 'accept-selected'
        : recovery.status === 'accepted-pending-save' && candidate.decision !== 'accepted-pending-save')
    )) return null;
    if (
      (recovery.status === 'decision-required' || recovery.status === 'accepted-pending-save') &&
      recovery.candidates.length === 0
    ) return null;
  }
  return snapshot as ProjectSpineSessionSnapshot;
}

const projectSpineWindowRole = isCommandCenterPreload ? 'command' : 'writing';

const projectSpineBaseBridge: ProjectSpineBridge = {
  windowRole: projectSpineWindowRole,
  async chooseDirectory() {
    return ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.chooseDirectory) as Promise<{
      canceled: boolean;
      path?: string;
    }>;
  },
  async openProject(request: ProjectSpineOpenProjectRequest) {
    return ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.openProject, request) as Promise<
      ProjectSpineResult<{ activation: 'activated' | 'already-active' }>
    >;
  },
  async createProject(request: ProjectSpineCreateProjectRequest) {
    return ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.createProject, request) as Promise<
      ProjectSpineResult<{ activation: 'activated' }>
    >;
  },
  async getSession() {
    const snapshot = normalizeProjectSpineSnapshot(
      await ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.getSession),
    );
    if (!snapshot || snapshot.role !== projectSpineWindowRole) {
      throw new Error('Project session bridge returned an invalid snapshot.');
    }
    return snapshot;
  },
  async removeRecent(request: RemoveRecentProjectRequest) {
    return ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.removeRecent, request) as Promise<
      ProjectSpineResult
    >;
  },
  async selectUnit(request: SelectManuscriptUnitRequest) {
    return ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.selectUnit, request) as Promise<
      ProjectSpineResult
    >;
  },
  subscribeSession(listener: (snapshot: ProjectSpineSessionSnapshot) => void) {
    const handler = (_event: IpcRendererEvent, value: unknown) => {
      const snapshot = normalizeProjectSpineSnapshot(value);
      if (snapshot && snapshot.role === projectSpineWindowRole) {
        listener(snapshot);
      }
    };
    ipcRenderer.on(PROJECT_SPINE_CHANNELS.sessionChanged, handler);
    return () => {
      ipcRenderer.removeListener(PROJECT_SPINE_CHANNELS.sessionChanged, handler);
    };
  },
};

type CommandProjectSpineBridge = Pick<
  ProjectSpineBridge,
  'windowRole' | 'getSession' | 'selectUnit' | 'subscribeSession'
>;

const projectSpineCommandBridge: CommandProjectSpineBridge = {
  windowRole: projectSpineBaseBridge.windowRole,
  getSession: projectSpineBaseBridge.getSession,
  selectUnit: projectSpineBaseBridge.selectUnit,
  subscribeSession: projectSpineBaseBridge.subscribeSession,
};

const projectSpineBridge: ProjectSpineBridge | CommandProjectSpineBridge =
  projectSpineWindowRole === 'writing'
    ? {
        ...projectSpineBaseBridge,
        setUnitDirty: (request: SetManuscriptUnitDirtyRequest) =>
          ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.setUnitDirty, request) as Promise<ProjectSpineResult>,
        captureRecoveryCheckpoint: (request: CaptureRecoveryCheckpointRequest) =>
          ipcRenderer.invoke(
            PROJECT_SPINE_CHANNELS.captureRecoveryCheckpoint,
            request,
          ) as Promise<ProjectSpineResult<RecoveryCheckpointResultData>>,
        acceptRecoveryCandidate: (request: RecoveryCandidateDecisionRequest) =>
          ipcRenderer.invoke(
            PROJECT_SPINE_CHANNELS.acceptRecoveryCandidate,
            request,
          ) as Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>,
        rejectRecoveryCandidate: (request: RecoveryCandidateDecisionRequest) =>
          ipcRenderer.invoke(
            PROJECT_SPINE_CHANNELS.rejectRecoveryCandidate,
            request,
          ) as Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>,
        saveUnit: (request: SaveManuscriptUnitRequest) =>
          ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.saveUnit, request) as Promise<
            ProjectSpineResult<SaveManuscriptUnitResultData>
          >,
        createUnit: (request: CreateManuscriptUnitRequest) =>
          ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.createUnit, request) as Promise<
            ProjectSpineResult<{ unitId: string }>
          >,
        renameUnit: (request: RenameManuscriptUnitRequest) =>
          ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.renameUnit, request) as Promise<ProjectSpineResult>,
        reorderUnits: (request: ReorderManuscriptUnitsRequest) =>
          ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.reorderUnits, request) as Promise<ProjectSpineResult>,
        deleteUnit: (request: DeleteManuscriptUnitRequest) =>
          ipcRenderer.invoke(PROJECT_SPINE_CHANNELS.deleteUnit, request) as Promise<ProjectSpineResult>,
        onCloseConfirmationRequest: (
          listener: (request: ProjectSpineCloseConfirmationRequest) => void,
        ) => {
          const handler = (_event: IpcRendererEvent, request: ProjectSpineCloseConfirmationRequest) => {
            listener(request);
          };
          ipcRenderer.on(PROJECT_SPINE_CHANNELS.closeConfirmationRequest, handler);
          return () => ipcRenderer.removeListener(PROJECT_SPINE_CHANNELS.closeConfirmationRequest, handler);
        },
        respondToCloseConfirmation: async (response: ProjectSpineCloseConfirmationResponse) => {
          return ipcRenderer.invoke(
            PROJECT_SPINE_CHANNELS.closeConfirmationResponse,
            response,
          ) as Promise<ProjectSpineResult>;
        },
      }
    : projectSpineCommandBridge;

const diagnosticsBridge: DiagnosticsBridge = {
  async openDiagnosticsFolder(): Promise<DiagnosticsOpenResult> {
    try {
      const response = await ipcRenderer.invoke(DIAGNOSTICS_CHANNELS.openHistory);
      if (
        response &&
        typeof response === 'object' &&
        'ok' in response &&
        typeof (response as { ok: unknown }).ok === 'boolean'
      ) {
        return response as DiagnosticsOpenResult;
      }
      return {
        ok: false,
        error: 'Diagnostics bridge returned an unexpected payload.',
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

const servicesBridge: ServicesBridge = {
  async checkHealth(): Promise<ServiceHealthResponse> {
  if (isPlaywright && typeof window !== 'undefined') {
      console.log('[preload-services-debug]', {
        forceOffline: document.body?.dataset?.testForceOffline ?? null,
      });
    }
    return probeHealth();
  },
  buildOutline: serviceApi.buildOutline,
  generateDraft: serviceApi.generateDraft,
  critiqueDraft: serviceApi.critiqueDraft,
  rewriteDraft: serviceApi.rewriteDraft,
  phase4Critique: serviceApi.phase4Critique,
  phase4Rewrite: serviceApi.phase4Rewrite,
  preflightDraft: serviceApi.preflightDraft,
  acceptDraft: serviceApi.acceptDraft,
  createSnapshot: serviceApi.createSnapshot,
  createProjectSnapshot: (request: { projectId: string }) =>
    serviceApi.createProjectSnapshot?.(request),
  getRecoveryStatus: serviceApi.getRecoveryStatus,
  restoreSnapshot: serviceApi.restoreSnapshot,
  restoreFromZip: serviceApi.restoreFromZip,
  createBackup: (request) => serviceApi.createBackup(request),
  listBackups: (request) => serviceApi.listBackups?.(request),
  restoreBackup: (request) => serviceApi.restoreBackup?.(request),
  exportProject: serviceApi.exportProject,
  listProjectSnapshots: (request: { projectId: string }) =>
    serviceApi.listProjectSnapshots?.(request),
  getLastVerification: (request: { projectId: string; projectPath?: string | null }) =>
    serviceApi.getLastVerification?.(request),
  runBackupVerification: (request: { projectId: string; latestOnly: boolean }) =>
    serviceApi.runBackupVerification?.(request),
  getBackupVerificationReport: (request: { projectId: string }) =>
    serviceApi.getBackupVerificationReport?.(request),
  getAnalyticsSummary: (request: { projectId: string; forceRefresh?: boolean }) =>
    serviceApi.analyticsSummary(request.projectId, Boolean(request.forceRefresh)),
  getAnalyticsScenes: (request: { projectId: string; forceRefresh?: boolean }) =>
    serviceApi.analyticsScenes(request.projectId, Boolean(request.forceRefresh)),
  getAnalyticsRelationships: (request: { projectId: string }) =>
    serviceApi.analyticsRelationships?.(request.projectId),
  revealPath: async (path: string): Promise<RevealPathResult> => {
    const normalized = resolve(path);
    try {
      await fs.stat(normalized);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('[preload] revealPath missing target', { path: normalized, error: message });
      return {
        ok: false,
        path: normalized,
        code: 'PATH_MISSING',
        error: 'Path does not exist.',
      };
    }

    try {
      const openError = await shell.openPath(normalized);
      if (openError) {
        console.warn('[preload] revealPath open failed', { path: normalized, error: openError });
        return {
          ok: false,
          path: normalized,
          code: 'OPEN_FAILED',
          error: openError,
        };
      }
      return { ok: true, path: normalized };
    } catch (error) {
      console.warn('[preload] revealPath failed', error);
      return {
        ok: false,
        path: normalized,
        code: 'UNKNOWN',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

const layoutBridge: LayoutBridge = {
  async loadLayout(request: LayoutLoadRequest): Promise<LayoutLoadResponse> {
    try {
      const response = await ipcRenderer.invoke(LAYOUT_CHANNELS.load, request);
      if (response && typeof response === 'object') {
        return response as LayoutLoadResponse;
      }
      return { layout: null, floatingPanes: [], schemaVersion: 2 };
    } catch (error) {
      console.warn('[preload] Failed to load layout', error);
      return { layout: null, floatingPanes: [], schemaVersion: 2 };
    }
  },
  async saveLayout(request: LayoutSaveRequest): Promise<void> {
    try {
      await ipcRenderer.invoke(LAYOUT_CHANNELS.save, request);
    } catch (error) {
      console.warn('[preload] Failed to save layout', error);
    }
  },
  async resetLayout(request: LayoutResetRequest): Promise<void> {
    try {
      await ipcRenderer.invoke(LAYOUT_CHANNELS.reset, request);
    } catch (error) {
      console.warn('[preload] Failed to reset layout', error);
    }
  },
  async openFloatingPane(request: FloatingPaneOpenRequest): Promise<FloatingPaneOpenResult> {
    try {
      const result = await ipcRenderer.invoke(LAYOUT_CHANNELS.openFloating, request);
      if (result && typeof result === 'object') {
        return result as FloatingPaneOpenResult;
      }
    } catch (error) {
      console.warn('[preload] Failed to open floating pane', error);
    }
    return { opened: false, clamp: null };
  },
  async closeFloatingPane(request: FloatingPaneCloseRequest): Promise<void> {
    try {
      await ipcRenderer.invoke(LAYOUT_CHANNELS.closeFloating, request);
    } catch (error) {
      console.warn('[preload] Failed to close floating pane', error);
    }
  },
  async listFloatingPanes(projectPath: string): Promise<FloatingPaneDescriptor[]> {
    try {
      const response = await ipcRenderer.invoke(LAYOUT_CHANNELS.listFloating, projectPath);
      if (Array.isArray(response)) {
        return response as FloatingPaneDescriptor[];
      }
    } catch (error) {
      console.warn('[preload] Failed to list floating panes', error);
    }
    return [];
  },
};

const splitCommandBridge: SplitCommandOwnershipBridge | null = splitCommandLaunchContext
  ? {
      windowRole: splitCommandLaunchContext.windowRole,
      async requestOwnershipSync(): Promise<SplitCommandOwnershipSyncMessage | null> {
        try {
          const response = await ipcRenderer.invoke(SPLIT_COMMAND_CHANNELS.requestOwnershipSync);
          const message = normalizeSplitCommandOwnershipSyncMessage(response);
          if (message && applySplitCommandOwnershipSync(message)) {
            return message;
          }
        } catch (error) {
          console.warn('[preload] Failed to request split command ownership sync', error);
        }
        return splitCommandOwnershipSync;
      },
      readOwnershipSync(): SplitCommandOwnershipSyncMessage | null {
        return splitCommandOwnershipSync;
      },
      subscribeOwnershipSync(
        listener: (message: SplitCommandOwnershipSyncMessage) => void,
      ): () => void {
        splitCommandOwnershipSyncListeners.add(listener);
        if (splitCommandOwnershipSync) {
          listener(splitCommandOwnershipSync);
        }
        return () => {
          splitCommandOwnershipSyncListeners.delete(listener);
        };
      },
    }
  : null;

const aiCritiqueBridge: AiCritiqueBridge = {
  credentialStatus: () => ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.credentialStatus),
  setCredential: (credential: string) =>
    ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.setCredential, credential),
  clearCredential: () => ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.clearCredential),
  prepare: (request: AiCritiquePrepareRequest) =>
    ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.prepare, request),
  approveAndExecute: (request: AiCritiqueApprovalRequest) =>
    ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.approveAndExecute, request),
  cancel: (request: AiCritiqueRequestReference) =>
    ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.cancel, request),
  invalidate: (request: AiCritiqueRequestReference) =>
    ipcRenderer.invoke(AI_CRITIQUE_CHANNELS.invalidate, request),
  subscribeState(listener: (state: AiCritiqueState) => void): () => void {
    const handler = (_event: IpcRendererEvent, state: AiCritiqueState) => listener(state);
    ipcRenderer.on(AI_CRITIQUE_CHANNELS.stateChanged, handler);
    return () => ipcRenderer.removeListener(AI_CRITIQUE_CHANNELS.stateChanged, handler);
  },
};

registerConsoleForwarding();

if (!isCommandCenterPreload) {
  contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
}
contextBridge.exposeInMainWorld('projectSpine', projectSpineBridge);
if (!isCommandCenterPreload) {
  contextBridge.exposeInMainWorld('services', servicesBridge);
  contextBridge.exposeInMainWorld('diagnostics', diagnosticsBridge);
  contextBridge.exposeInMainWorld('layout', layoutBridge);
  contextBridge.exposeInMainWorld('runtimeConfig', runtimeConfig);
  contextBridge.exposeInMainWorld('aiCritique', aiCritiqueBridge);
}
if (splitCommandBridge) {
  safeExpose('splitCommand', splitCommandBridge);
}

if (process.env.PLAYWRIGHT === '1') {
  const devTools = {
    async setProjectDir(dir: string | null): Promise<void> {
      await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.setDevProjectPath, dir);
    },
    overrideServices(overrides: Partial<ServicesBridge>): void {
      Object.assign(servicesBridge, overrides);
    },
  };

  if (harnessHooksEnabled && forceRecoveryInHarness && typeof document !== 'undefined') {
    const applyRecoveryFlag = (): boolean => {
      const root = document.documentElement;
      const body = document.body;
      const target = body ?? root;
      if (!target) {
        return false;
      }
      if (root && root.dataset.testNeedsRecovery !== '1') {
        root.dataset.testNeedsRecovery = '1';
      }
      if (body && body.dataset.testNeedsRecovery !== '1') {
        body.dataset.testNeedsRecovery = '1';
      }
      return true;
    };
    if (!applyRecoveryFlag() && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyRecoveryFlag, { once: true });
    }
  }

  if (process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1') {
    const disableAnimations = (): void => {
      if (typeof document === 'undefined') {
        return;
      }
      const existing = document.head.querySelector('[data-playwright-disable-animations="true"]');
      if (existing) {
        return;
      }
      const style = document.createElement('style');
      style.setAttribute('data-playwright-disable-animations', 'true');
      style.textContent = `
        *, *::before, *::after {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-delay: 0ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    };

    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', disableAnimations, { once: true });
      } else {
        disableAnimations();
      }
    }
  }

  devApi.setProjectDir = async (dir: string | null): Promise<void> => {
    await devTools.setProjectDir(dir);
    window.dispatchEvent(new CustomEvent('test:set-project', { detail: dir }));
  };
  devApi.overrideServices = devTools.overrideServices;
}
