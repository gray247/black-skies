import { contextBridge, ipcRenderer } from 'electron';

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

const isPlaywright = process.env.PLAYWRIGHT === '1';
safeExpose('__testEnv', { isPlaywright });

const devApi: {
  setProjectDir: (absPath: string | null) => boolean;
  overrideServices?: (overrides: Partial<ServicesBridge>) => void;
} = {
  setProjectDir: (absPath: string | null) =>
    window.dispatchEvent(new CustomEvent('test:set-project', { detail: absPath })),
};

// --- test/insights bridges ---
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
  WizardLockSnapshotBridgeRequest,
  WizardLockSnapshotBridgeResponse,
  AnalyticsBudgetBridgeRequest,
  AnalyticsBudgetBridgeResponse,
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

async function sleep(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return;
  }
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

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

async function fetchWithResilience(
  url: string,
  init: RequestInit,
  method: HttpMethod,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= REQUEST_POLICY.maxAttempts; attempt += 1) {
    if (!REQUEST_BREAKER.allow()) {
      throw new BridgeCircuitOpenError('Service bridge circuit is open.');
    }

    try {
      const response = await fetchWithTimeout(url, init, REQUEST_POLICY.timeoutMs);
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
): Promise<ServiceResult<T>> {
  const port = currentServicePort();
  if (!port) {
    return { ok: false, error: normalizeError('Service port is unavailable.') };
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `http://127.0.0.1:${port}/api/v1/${normalizedPath}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const requestInit: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetchWithResilience(url, requestInit, method);

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
    if (error instanceof BridgeCircuitOpenError) {
      return {
        ok: false,
        error: normalizeError('Service requests temporarily unavailable.', {
          code: 'SERVICE_UNAVAILABLE',
        }),
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
        error: normalizeError(error.message, {
          code: 'NETWORK_ERROR',
        }),
      };
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

  const url = `http://127.0.0.1:${port}/api/v1/healthz`;

  try {
    const response = await fetchWithResilience(url, { method: 'GET' }, 'GET');
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

  setOptionalString(payload, 'message', message);
  setOptionalString(payload, 'snapshot_label', snapshotLabel);

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
  generateDraft: (request: DraftGenerateBridgeRequest) =>
    makeServiceCall<DraftGenerateBridgeResponse>(
      'draft/generate',
      'POST',
      serializeDraftGenerateRequest(request),
    ),
  critiqueDraft: (request: DraftCritiqueBridgeRequest) =>
    makeServiceCall<DraftCritiqueBridgeResponse>(
      'draft/critique',
      'POST',
      serializeCritiqueRequest(request),
    ),
  preflightDraft: (request: DraftPreflightBridgeRequest) =>
    makeServiceCall<DraftPreflightEstimate>(
      'draft/preflight',
      'POST',
      serializePreflightRequest(request),
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
  analyticsBudget: (request: AnalyticsBudgetBridgeRequest) => {
    const params = new URLSearchParams({ project_id: request.projectId });
    return makeServiceCall<AnalyticsBudgetBridgeResponse>(
      `analytics/budget?${params.toString()}`,
      'GET',
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
    return probeHealth();
  },
  buildOutline: serviceApi.buildOutline,
  generateDraft: serviceApi.generateDraft,
  critiqueDraft: serviceApi.critiqueDraft,
  preflightDraft: serviceApi.preflightDraft,
  acceptDraft: serviceApi.acceptDraft,
  createSnapshot: serviceApi.createSnapshot,
  getRecoveryStatus: serviceApi.getRecoveryStatus,
  restoreSnapshot: serviceApi.restoreSnapshot,
  analyticsBudget: serviceApi.analyticsBudget,
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
