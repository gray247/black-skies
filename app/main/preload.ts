import { contextBridge, ipcRenderer } from 'electron';
import { inspect } from 'node:util';

import {
  LOGGING_CHANNELS,
  type DiagnosticsLogPayload,
  type DiagnosticsLogLevel,
} from '../shared/ipc/logging';
import {
  PROJECT_LOADER_CHANNELS,
  type ProjectDialogResult,
  type ProjectLoadRequest,
  type ProjectLoadResponse,
  type ProjectLoaderApi,
} from '../shared/ipc/projectLoader';
import type { ServiceHealthResponse, ServicesBridge } from '../shared/ipc/services';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const LOG_LEVEL_MAP: Record<ConsoleMethod, DiagnosticsLogLevel> = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
};

function currentServicePort(): number | null {
  const raw = process.env.BLACKSKIES_SERVICES_PORT;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

async function probeHealth(): Promise<ServiceHealthResponse> {
  const port = currentServicePort();
  if (!port) {
    return {
      ok: false,
      error: { message: 'Service port is unavailable.' },
    };
  }

  const url = `http://127.0.0.1:${port}/health`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        ok: false,
        error: { message: `Service responded with HTTP ${response.status}.` },
      };
    }

    const data = (await response.json()) as ServiceHealthResponse['data'];
    if (data?.status === 'ok') {
      return { ok: true, data };
    }

    return {
      ok: false,
      data,
      error: { message: 'Service reported an unhealthy status.' },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: { message } };
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
        message: args
          .map((argument) =>
            typeof argument === 'string'
              ? argument
              : inspect(argument, { depth: 1, breakLength: 80 }),
          )
          .join(' '),
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

const servicesBridge: ServicesBridge = {
  async checkHealth(): Promise<ServiceHealthResponse> {
    return probeHealth();
  },
};

registerConsoleForwarding();

contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
contextBridge.exposeInMainWorld('services', servicesBridge);

