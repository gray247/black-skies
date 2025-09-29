import { contextBridge, ipcRenderer } from 'electron';
import { inspect } from 'node:util';

import {
  LOGGING_CHANNELS,
  type DiagnosticsLogPayload,
  type DiagnosticsLogLevel,
} from '../shared/ipc/logging.js';
import {
  PROJECT_LOADER_CHANNELS,
  type ProjectDialogResult,
  type ProjectLoadRequest,
  type ProjectLoadResponse,
  type ProjectLoaderApi,
} from '../shared/ipc/projectLoader.js';
import type {
  DraftCritiqueBridgeRequest,
  DraftCritiqueBridgeResponse,
  DraftAcceptBridgeRequest,
  DraftAcceptBridgeResponse,
  DraftGenerateBridgeRequest,
  DraftGenerateBridgeResponse,
  DraftPreflightBridgeRequest,
  DraftPreflightEstimate,
  DraftUnitOverrides,
  OutlineBuildBridgeRequest,
  OutlineBuildBridgeResponse,
  RecoveryRestoreBridgeRequest,
  RecoveryRestoreBridgeResponse,
  RecoveryStatusBridgeRequest,
  RecoveryStatusBridgeResponse,
  ServiceError,
  ServiceHealthResponse,
  ServiceResult,
  ServicesBridge,
} from '../shared/ipc/services.js';

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
): Promise<ServiceResult<T>> {
  const port = currentServicePort();
  if (!port) {
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
  };
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
  return {
    project_id: projectId,
    unit_scope: unitScope,
    unit_ids: unitIds,
    temperature,
    seed,
    overrides: serializeDraftOverrides(overrides),
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

function serializeAcceptRequest({
  projectId,
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

  if (typeof message === 'string' && message.trim().length > 0) {
    payload.message = message;
  }
  if (typeof snapshotLabel === 'string' && snapshotLabel.trim().length > 0) {
    payload.snapshot_label = snapshotLabel;
  }

  return payload;
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

function serializeRecoveryRestoreRequest({
  projectId,
  snapshotId,
}: RecoveryRestoreBridgeRequest): Record<string, unknown> {
  const payload: Record<string, unknown> = { project_id: projectId };
  if (snapshotId) {
    payload.snapshot_id = snapshotId;
  }
  return payload;
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
  async acceptDraft(request: DraftAcceptBridgeRequest) {
    return performRequest<DraftAcceptBridgeResponse>(
      '/draft/accept',
      'POST',
      serializeAcceptRequest(request),
    );
  },
  async getRecoveryStatus(request: RecoveryStatusBridgeRequest) {
    const params = new URLSearchParams({ project_id: request.projectId });
    return performRequest<RecoveryStatusBridgeResponse>(
      `/draft/recovery?${params.toString()}`,
      'GET',
    );
  },
  async restoreSnapshot(request: RecoveryRestoreBridgeRequest) {
    return performRequest<RecoveryRestoreBridgeResponse>(
      '/draft/recovery/restore',
      'POST',
      serializeRecoveryRestoreRequest(request),
    );
  },
};

registerConsoleForwarding();

contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
contextBridge.exposeInMainWorld('services', servicesBridge);
