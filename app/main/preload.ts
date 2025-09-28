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
import type {
  DraftCritiqueBridgeRequest,
  DraftCritiqueBridgeResponse,
  DraftGenerateBridgeRequest,
  DraftGenerateBridgeResponse,
  DraftPreflightBridgeRequest,
  DraftPreflightEstimate,
  OutlineBuildBridgeRequest,
  OutlineBuildBridgeResponse,
  ServiceError,
  ServiceHealthResponse,
  ServiceResult,
  ServicesBridge,
} from '../shared/ipc/services';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

type HttpMethod = 'GET' | 'POST';

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

function normalizeError(message: string, extra?: Partial<ServiceError>): ServiceError {
  return {
    message,
    ...extra,
  };
}

async function parseErrorPayload(response: Response): Promise<ServiceError> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (parseError) {
    return normalizeError(`Service responded with HTTP ${response.status}.`, {
      httpStatus: response.status,
      details: { parseError: String(parseError) },
    });
  }

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
    };
  }

  return normalizeError(`Service responded with HTTP ${response.status}.`, {
    httpStatus: response.status,
    details: payload ?? undefined,
  });
}

async function performRequest<T>(
  path: string,
  method: HttpMethod,
  body?: Record<string, unknown>,
  fallback?: () => ServiceResult<T>,
): Promise<ServiceResult<T>> {
  const port = currentServicePort();
  if (!port) {
    if (fallback) {
      return fallback();
    }
    return { ok: false, error: normalizeError('Service port is unavailable.') };
  }

  const url = `http://127.0.0.1:${port}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      return { ok: false, error: await parseErrorPayload(response) };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (error) {
    if (fallback) {
      return fallback();
    }
    const message = error instanceof Error ? error.message : String(error);
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

  const url = `http://127.0.0.1:${port}/health`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        ok: false,
        error: await parseErrorPayload(response),
      };
    }

    const data = (await response.json()) as ServiceHealthResponse['data'];
    if (data?.status === 'ok') {
      return { ok: true, data };
    }

    return {
      ok: false,
      data,
      error: normalizeError('Service reported an unhealthy status.'),
    };
  } catch (error) {
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

function serializeOutlineRequest({
  projectId,
  forceRebuild,
  wizardLocks,
}: OutlineBuildBridgeRequest): Record<string, unknown> {
  return {
    project_id: projectId,
    force_rebuild: Boolean(forceRebuild),
    wizard_locks: {
      acts: wizardLocks.acts.map((act) => ({ title: act.title })),
      chapters: wizardLocks.chapters.map((chapter) => ({
        title: chapter.title,
        act_index: chapter.actIndex,
      })),
      scenes: wizardLocks.scenes.map((scene) => ({
        title: scene.title,
        chapter_index: scene.chapterIndex,
        beat_refs: scene.beatRefs ?? [],
      })),
    },
  };
}

function serializeDraftGenerateRequest({
  projectId,
  unitScope,
  unitIds,
  temperature,
  seed,
  overrides,
}: DraftGenerateBridgeRequest): Record<string, unknown> {
  const serializedOverrides = overrides
    ? Object.fromEntries(
        Object.entries(overrides).map(([key, value]) => [
          key,
          {
            order: value.order,
            purpose: value.purpose,
            emotion_tag: value.emotion_tag,
            pov: value.pov,
            goal: value.goal,
            conflict: value.conflict,
            turn: value.turn,
            word_target: value.word_target,
            beats: value.beats,
          },
        ]),
      )
    : undefined;

  return {
    project_id: projectId,
    unit_scope: unitScope,
    unit_ids: unitIds,
    temperature,
    seed,
    overrides: serializedOverrides,
  };
}

function serializeCritiqueRequest({
  projectId,
  draftId,
  unitId,
  rubric,
}: DraftCritiqueBridgeRequest): Record<string, unknown> {
  return {
    project_id: projectId,
    draft_id: draftId,
    unit_id: unitId,
    rubric,
  };
}

function serializePreflightRequest({
  projectId,
  unitScope,
  unitIds,
}: DraftPreflightBridgeRequest): Record<string, unknown> {
  return {
    project_id: projectId,
    unit_scope: unitScope,
    unit_ids: unitIds,
  };
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
  async buildOutline(request: OutlineBuildBridgeRequest) {
    return performRequest<OutlineBuildBridgeResponse>(
      '/outline/build',
      'POST',
      serializeOutlineRequest(request),
    );
  },
  async generateDraft(request: DraftGenerateBridgeRequest) {
    return performRequest<DraftGenerateBridgeResponse>(
      '/draft/generate',
      'POST',
      serializeDraftGenerateRequest(request),
    );
  },
  async critiqueDraft(request: DraftCritiqueBridgeRequest) {
    return performRequest<DraftCritiqueBridgeResponse>(
      '/draft/critique',
      'POST',
      serializeCritiqueRequest(request),
    );
  },
  async preflightDraft(request: DraftPreflightBridgeRequest) {
    return performRequest<DraftPreflightEstimate>(
      '/draft/preflight',
      'POST',
      serializePreflightRequest(request),
    );
  },
};

registerConsoleForwarding();

contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
contextBridge.exposeInMainWorld('services', servicesBridge);
