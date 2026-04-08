import { contextBridge, ipcRenderer, shell } from 'electron';
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import * as testMode from '../renderer/testMode/testModeManager';

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
safeExpose('__electronApi', { fs: electronFsApi });

const isPlaywright = process.env.PLAYWRIGHT === '1';
const harnessHooksEnabled = process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS === '1';
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
safeExpose('__testEnv', { isPlaywright });

if (typeof window !== 'undefined' && harnessHooksEnabled) {
  const applyHarnessFlags = (): void => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    if (!root) {
      return;
    }
    const body = document.body ?? root;

    const setHarnessFlag = (
      flag: 'testActiveFlow' | 'testStableDock' | 'testStableHome' | 'testVisualStable',
      enabled: boolean,
    ): void => {
      if (enabled) {
        root.dataset[flag] = '1';
        body.dataset[flag] = '1';
        return;
      }
      delete root.dataset[flag];
      delete body.dataset[flag];
    };

    setHarnessFlag('testActiveFlow', process.env.PLAYWRIGHT === '1');
    setHarnessFlag('testStableDock', process.env.BLACKSKIES_STABLE_DOCK === '1');
    setHarnessFlag('testStableHome', process.env.BLACKSKIES_STABLE_HOME === '1');
    setHarnessFlag('testVisualStable', process.env.BLACKSKIES_VISUAL_STABLE === '1');
  };

  applyHarnessFlags();
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyHarnessFlags, { once: true });
  }
  window.addEventListener('load', applyHarnessFlags, { once: true });

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
  if (process.env.BLACKSKIES_VISUAL_STABLE === '1') {
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

const devApi: {
  setProjectDir: (absPath: string | null) => Promise<void>;
  overrideServices?: (overrides: Partial<ServicesBridge>) => void;
} = {
  setProjectDir: async (absPath: string | null) => {
    // Always emit the renderer-side marker event so tests can correlate activity in the debug log.
    window.dispatchEvent(new CustomEvent('test:set-project', { detail: absPath }));
    // In Playwright mode, also set the main-process override used by the project open dialog.
    if (process.env.PLAYWRIGHT === '1') {
      await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.setDevProjectPath, absPath);
    }
  },
};

// --- harness-only bridges ---
// These are explicit test hooks and must stay out of the truth lane unless a harness runner
// opts in with BLACKSKIES_ENABLE_HARNESS_HOOKS=1.
if (harnessHooksEnabled) {
  safeExpose('__test', {
    markBoot: () => console.log('[boot] renderer mounted'),
  });

  safeExpose('__dev', devApi);

  safeExpose('__testInsights', {
    setServiceStatus: (status: 'offline' | 'online') =>
      window.dispatchEvent(new CustomEvent('test:service-status', { detail: status })),
    selectScene: (id: string) =>
      window.dispatchEvent(new CustomEvent('test:select-scene', { detail: id })),
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
  type ProjectDialogResult,
  type ProjectLoadRequest,
  type ProjectLoadResponse,
  type ProjectLoaderApi,
} from '../shared/ipc/projectLoader.js';
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
  ServiceHealthResponse,
  ServicesBridge,
} from '../shared/ipc/services.js';
import { probeHealth, serviceApi } from './serviceApi.js';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const LOG_LEVEL_MAP: Record<ConsoleMethod, DiagnosticsLogLevel> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
};

const runtimeConfig = loadRuntimeConfig();
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
  } catch {
    // Ignore serialization errors and fall through to the string fallback.
  }

  return String(argument);
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
  async getSampleProjectPath(): Promise<string | null> {
    try {
      const path = await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.getSamplePath);
      return typeof path === 'string' ? path : null;
    } catch (error) {
      console.warn('[preload] Failed to resolve sample project path', error);
      return null;
    }
  },
};

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
  readDraft: (request) => serviceApi.readDraft(request),
  buildOutline: serviceApi.buildOutline,
  generateDraft: serviceApi.generateDraft,
  critiqueDraft: serviceApi.critiqueDraft,
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
  revealPath: async (path: string) => {
    try {
      await shell.openPath(path);
    } catch (error) {
      console.warn('[preload] revealPath failed', error);
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

registerConsoleForwarding();

contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
contextBridge.exposeInMainWorld('services', servicesBridge);
contextBridge.exposeInMainWorld('diagnostics', diagnosticsBridge);
contextBridge.exposeInMainWorld('layout', layoutBridge);
contextBridge.exposeInMainWorld('runtimeConfig', runtimeConfig);

if (process.env.PLAYWRIGHT === '1') {
  const devTools = {
    async setProjectDir(dir: string | null): Promise<void> {
      await ipcRenderer.invoke(PROJECT_LOADER_CHANNELS.setDevProjectPath, dir);
    },
    overrideServices(overrides: Partial<ServicesBridge>): void {
      Object.assign(servicesBridge, overrides);
    },
  };

  if (harnessHooksEnabled && typeof document !== 'undefined') {
    const markNeedsRecovery = (): void => {
      const root = document.documentElement;
      if (!root) {
        return;
      }
      const body = document.body ?? root;
      root.dataset.testNeedsRecovery = '1';
      body.dataset.testNeedsRecovery = '1';
    };

    markNeedsRecovery();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', markNeedsRecovery, { once: true });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('load', markNeedsRecovery, { once: true });
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

  devApi.overrideServices = devTools.overrideServices;
}
