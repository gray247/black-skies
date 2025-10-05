import { contextBridge, ipcRenderer } from 'electron';

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
  ServiceResult,
  ServiceHealthResponse,
  ServicesBridge,
} from '../shared/ipc/services';

type HttpMethod = 'GET' | 'POST';

type FetchBody = Record<string, unknown> | undefined;

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
    details: payload ?? undefined,
    httpStatus: response.status,
    traceId,
  });
}

async function performRequest<T>(
  path: string,
  method: HttpMethod,
  body: FetchBody,
): Promise<ServiceResult<T>> {
  const port = currentServicePort();
  if (!port) {
    return { ok: false, error: normalizeError('Service port is unavailable.') };
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `http://127.0.0.1:${port}/api/v1/${normalizedPath}`;

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const traceId = response.headers.get('x-trace-id') ?? undefined;

    if (!response.ok) {
      const error = await parseErrorPayload(response, traceId);
      return { ok: false, error, traceId: error.traceId ?? traceId };
    }

    if (response.status === 204) {
      return { ok: true, data: undefined as T, traceId };
    }

    try {
      const data = (await response.json()) as T;
      return { ok: true, data, traceId };
    } catch (parseError) {
      const parseMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      const error = normalizeError('Failed to parse response payload.', {
        traceId,
        httpStatus: response.status,
        details: { parseError: parseMessage },
      });
      return { ok: false, error, traceId };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: normalizeError(message) };
  }
}

function serializeOutlineRequest(request: OutlineBuildBridgeRequest): FetchBody {
  return {
    project_id: request.projectId,
    force_rebuild: Boolean(request.forceRebuild),
    wizard_locks: {
      acts: request.wizardLocks.acts.map((act) => ({ title: act.title })),
      chapters: request.wizardLocks.chapters.map((chapter) => ({
        title: chapter.title,
        act_index: chapter.actIndex,
      })),
      scenes: request.wizardLocks.scenes.map((scene) => ({
        title: scene.title,
        chapter_index: scene.chapterIndex,
        beat_refs: scene.beatRefs ?? [],
      })),
    },
  };
}

function serializeDraftGenerateRequest(request: DraftGenerateBridgeRequest): FetchBody {
  const overrides = request.overrides
    ? Object.fromEntries(
        Object.entries(request.overrides).map(([key, value]) => [
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
    project_id: request.projectId,
    unit_scope: request.unitScope,
    unit_ids: request.unitIds,
    temperature: request.temperature,
    seed: request.seed,
    overrides,
  };
}

function serializeCritiqueRequest(request: DraftCritiqueBridgeRequest): FetchBody {
  return {
    project_id: request.projectId,
    draft_id: request.draftId,
    unit_id: request.unitId,
    rubric: request.rubric,
  };
}

function serializePreflightRequest(request: DraftPreflightBridgeRequest): FetchBody {
  const overrides = request.overrides
    ? Object.fromEntries(
        Object.entries(request.overrides).map(([key, value]) => [
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
    project_id: request.projectId,
    unit_scope: request.unitScope,
    unit_ids: request.unitIds,
    overrides,
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
  async checkHealth() {
    const port = currentServicePort();
    if (!port) {
      return {
        ok: false,
        error: normalizeError('Service port is unavailable.'),
      };
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/healthz`);
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
      if (data?.status === 'ok') {
        return { ok: true, data, traceId };
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
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: normalizeError(message) };
    }
  },
  async buildOutline(request) {
    return performRequest<OutlineBuildBridgeResponse>(
      'outline/build',
      'POST',
      serializeOutlineRequest(request),
    );
  },
  async generateDraft(request) {
    return performRequest<DraftGenerateBridgeResponse>(
      'draft/generate',
      'POST',
      serializeDraftGenerateRequest(request),
    );
  },
  async critiqueDraft(request) {
    return performRequest<DraftCritiqueBridgeResponse>(
      'draft/critique',
      'POST',
      serializeCritiqueRequest(request),
    );
  },
  async preflightDraft(request) {
    return performRequest<DraftPreflightEstimate>(
      'draft/preflight',
      'POST',
      serializePreflightRequest(request),
    );
  },
};

contextBridge.exposeInMainWorld('projectLoader', projectLoaderApi);
contextBridge.exposeInMainWorld('services', servicesBridge);
