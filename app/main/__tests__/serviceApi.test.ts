import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    send: vi.fn(),
  },
}));

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
} as const;

vi.mock('../shared/config/runtime.js', () => ({
  DEFAULT_HEALTH_PROBE: defaultRuntimeConfig.service.healthProbe,
  DEFAULT_SERVICE_PORT_RANGE: defaultRuntimeConfig.service.portRange,
  DEFAULT_RUNTIME_CONFIG: defaultRuntimeConfig,
  loadRuntimeConfig: vi.fn(() => defaultRuntimeConfig),
}));

function configureDefaultEnv(): void {
  process.env.BLACKSKIES_SERVICES_PORT = '5000';
  process.env.BLACKSKIES_BRIDGE_MAX_ATTEMPTS = '2';
  process.env.BLACKSKIES_BRIDGE_BACKOFF_MS = '0';
  process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS = '50';
  process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD = '2';
  process.env.BLACKSKIES_BRIDGE_RESET_MS = '5';
}

async function loadServiceApi() {
  const module = await import('../preload');
  return module.serviceApi;
}

function mockErrorResponse(
  status: number,
  payload: unknown,
  traceId = 'trace-error',
): Response {
  return {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue(payload),
    headers: {
      get: (name: string) => (name.toLowerCase() === 'x-trace-id' ? traceId : null),
    },
  } as unknown as Response;
}

describe('serviceApi', () => {
  beforeEach(() => {
    vi.resetModules();
    configureDefaultEnv();
    global.fetch = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ data: 'ok' }),
        headers: {
          get: (name: string) => (name.toLowerCase() === 'x-trace-id' ? 'trace-test' : null),
        },
      } as unknown as Response) as unknown as typeof fetch;
  });

  afterEach(() => {
    delete process.env.BLACKSKIES_SERVICES_PORT;
    delete process.env.BLACKSKIES_BRIDGE_MAX_ATTEMPTS;
    delete process.env.BLACKSKIES_BRIDGE_BACKOFF_MS;
    delete process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS;
    delete process.env.BLACKSKIES_BRIDGE_SNAPSHOT_CREATE_TIMEOUT_MS;
    delete process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD;
    delete process.env.BLACKSKIES_BRIDGE_RESET_MS;
    delete process.env.BLACKSKIES_BRIDGE_RESTORE_TIMEOUT_MS;
    delete process.env.BLACKSKIES_BRIDGE_BACKUP_CREATE_TIMEOUT_MS;
    delete process.env.BLACKSKIES_BRIDGE_BACKUP_RESTORE_TIMEOUT_MS;
  });

  it('posts serialized outline payloads to the API', async () => {
    const serviceApi = await loadServiceApi();

    const response = await serviceApi.buildOutline({
      projectId: 'proj_test',
      forceRebuild: false,
      wizardLocks: {
        acts: [{ title: 'Act I' }],
        chapters: [{ title: 'Chapter 1', actIndex: 1 }],
        scenes: [{ title: 'Scene 1', chapterIndex: 1, beatRefs: [] }],
      },
    });

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/outline/build',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('injects explicit trace ids into preflight bridge requests', async () => {
    const serviceApi = await loadServiceApi();

    await serviceApi.preflightDraft({
      projectId: 'proj_test',
      unitScope: 'scene',
      unitIds: ['sc_0001'],
      traceId: 'trace-preflight-request',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/draft/preflight',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-trace-id': 'trace-preflight-request',
        }),
      }),
    );
  });

  it('injects explicit trace ids into draft generation bridge requests', async () => {
    const serviceApi = await loadServiceApi();

    await serviceApi.generateDraft(
      {
        projectId: 'proj_test',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
      },
      'trace-generate-request',
    );

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/draft/generate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-trace-id': 'trace-generate-request',
        }),
      }),
    );
  });

  it('logs draft generation request-start metadata before fetch', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const serviceApi = await loadServiceApi();

    await serviceApi.generateDraft(
      {
        projectId: 'proj_test',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
        temperature: 0.7,
      },
      'trace-generate-request-start',
    );

    const requestStart = infoSpy.mock.calls.find(
      ([label]) => typeof label === 'string' && label.includes('preload:draft-generate:request-start'),
    );
    expect(requestStart).toBeDefined();
    if (requestStart) {
      expect(requestStart[1]).toEqual(
        expect.objectContaining({
          traceId: 'trace-generate-request-start',
          method: 'POST',
          url: 'http://127.0.0.1:5000/api/v1/draft/generate',
          timeoutMs: 50,
          unitCount: 1,
          bodyByteLength: expect.any(Number),
          timestamp: expect.any(String),
        }),
      );
    }

    infoSpy.mockRestore();
  });

  it('scales draft generation timeout deterministically with the unit count', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const serviceApi = await loadServiceApi();

    await serviceApi.generateDraft(
      {
        projectId: 'proj_test',
        unitScope: 'scene',
        unitIds: ['sc_0001', 'sc_0002', 'sc_0003', 'sc_0004'],
      },
      'trace-generate-batch-1',
    );
    await serviceApi.generateDraft(
      {
        projectId: 'proj_test',
        unitScope: 'scene',
        unitIds: ['sc_0001', 'sc_0002', 'sc_0003', 'sc_0004'],
      },
      'trace-generate-batch-2',
    );

    const requestStarts = infoSpy.mock.calls.filter(
      ([label]) => typeof label === 'string' && label.includes('preload:draft-generate:request-start'),
    );
    expect(requestStarts).toHaveLength(2);
    expect(requestStarts[0]?.[1]).toEqual(
      expect.objectContaining({
        traceId: 'trace-generate-batch-1',
        timeoutMs: 200,
        unitCount: 4,
      }),
    );
    expect(requestStarts[1]?.[1]).toEqual(
      expect.objectContaining({
        traceId: 'trace-generate-batch-2',
        timeoutMs: 200,
        unitCount: 4,
      }),
    );

    infoSpy.mockRestore();
  });

  it('returns draft generation responses back to the renderer bridge', async () => {
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        draft_id: 'dr_001',
        schema_version: 'DraftUnitSchema v1',
        units: [],
        budget: undefined,
      }),
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-trace-id' ? 'trace-generate-response' : null),
      },
    } as unknown as Response);

    const serviceApi = await loadServiceApi();
    const response = await serviceApi.generateDraft(
      {
        projectId: 'proj_test',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
      },
      'trace-generate-response-request',
    );

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.data.draft_id).toBe('dr_001');
    }
    expect(response.traceId).toBe('trace-generate-response');
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/draft/generate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-trace-id': 'trace-generate-response-request',
        }),
      }),
    );
  });

  it('performs GET requests with query parameters for recovery status', async () => {
    const serviceApi = await loadServiceApi();

    await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/draft/recovery?project_id=proj_test',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('serializes restore-from-zip requests with camelCase payload fields', async () => {
    const serviceApi = await loadServiceApi();

    await serviceApi.restoreFromZip?.({
      projectId: 'proj_test',
      zipName: 'demo_export.zip',
      restoreAsNew: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/restore',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          projectId: 'proj_test',
          zipName: 'demo_export.zip',
          restoreAsNew: true,
        }),
      }),
    );
  });

  it('uses the restore-specific timeout budget for restore-from-zip requests', async () => {
    process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS = '50';
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(timeoutError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.restoreFromZip?.({
      projectId: 'proj_test',
      restoreAsNew: true,
    });

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
      expect(result.error.details).toEqual({
        timeout_ms: 300000,
        unit_count: 0,
        operation_name: 'restore-copy',
        completion_status: 'unknown',
        backend_may_still_be_running: true,
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('honors explicit restore timeout overrides without dropping below the base timeout', async () => {
    process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS = '50';
    process.env.BLACKSKIES_BRIDGE_RESTORE_TIMEOUT_MS = '150';
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(timeoutError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.restoreFromZip?.({
      projectId: 'proj_test',
      restoreAsNew: true,
    });

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
      expect(result.error.details).toEqual({
        timeout_ms: 150,
        unit_count: 0,
        operation_name: 'restore-copy',
        completion_status: 'unknown',
        backend_may_still_be_running: true,
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the backup-create timeout budget for backup creation requests', async () => {
    process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS = '50';
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(timeoutError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.createBackup?.({ projectId: 'proj_test' });

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
      expect(result.error.details).toEqual({
        timeout_ms: 300000,
        unit_count: 0,
        operation_name: 'backup-create',
        completion_status: 'unknown',
        backend_may_still_be_running: true,
      });
    }
  });

  it('uses a dedicated timeout budget for snapshot creation requests', async () => {
    process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS = '50';
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(timeoutError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.createProjectSnapshot?.({ projectId: 'proj_test' });

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
      expect(result.error.details).toEqual({
        timeout_ms: 120000,
        unit_count: 0,
        operation_name: 'snapshot-create',
        completion_status: 'unknown',
        backend_may_still_be_running: true,
      });
    }
  });

  it('honors explicit backup-restore timeout overrides without dropping below the base timeout', async () => {
    process.env.BLACKSKIES_BRIDGE_TIMEOUT_MS = '50';
    process.env.BLACKSKIES_BRIDGE_BACKUP_RESTORE_TIMEOUT_MS = '175';
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(timeoutError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.restoreBackup?.({ backupName: 'BS_20260516_010101.zip' });

    expect(result?.ok).toBe(false);
    if (result && !result.ok) {
      expect(result.error.code).toBe('TIMEOUT');
      expect(result.error.details).toEqual({
        timeout_ms: 175,
        unit_count: 0,
        operation_name: 'backup-restore-copy',
        completion_status: 'unknown',
        backend_may_still_be_running: true,
      });
    }
  });

  it('checks the external backend health endpoint on the configured port', async () => {
    process.env.BLACKSKIES_SERVICES_PORT = '8000';

    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ status: 'ok', version: '1.0.0-rc1' }),
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-trace-id' ? 'trace-health' : null),
      },
    } as unknown as Response);

    await loadServiceApi();
    const { contextBridge } = await import('electron');
    const exposeMock = vi.mocked(contextBridge.exposeInMainWorld);
    const servicesBridge = exposeMock.mock.calls.find(([key]) => key === 'services')?.[1] as
      | { checkHealth: () => Promise<{ ok: boolean; data?: { status?: string } }> }
      | undefined;
    expect(servicesBridge).toBeDefined();

    const result = await servicesBridge!.checkHealth();

    expect(result.ok).toBe(true);
    expect(result.data?.status).toBe('online');
    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/healthz',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('retries GET calls after transient failures', async () => {
    process.env.BLACKSKIES_BRIDGE_MAX_ATTEMPTS = '3';
    const networkError = new Error('temporarily unavailable');
    (networkError as Error).name = 'FetchError';

    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValueOnce(networkError).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ status: 'ok' }),
      headers: {
        get: (name: string) => (name.toLowerCase() === 'x-trace-id' ? 'trace-test' : null),
      },
    } as unknown as Response);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('surfaces service unavailable when the bridge circuit is open', async () => {
    process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD = '1';

    const failure = new Error('bridge down');
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(failure);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('reports timeout failures with structured metadata', async () => {
    const timeoutError = new Error('aborted');
    timeoutError.name = 'AbortError';
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(timeoutError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('TIMEOUT');
    expect(result.error.details).toEqual({ timeout_ms: 50, unit_count: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('surfaces 404 backend errors with route-aware payload details', async () => {
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      mockErrorResponse(404, {
        code: 'NOT_FOUND',
        message: 'Route not found.',
        details: { route: '/api/v1/draft/recovery' },
      }),
    );

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
    expect(result.error.httpStatus).toBe(404);
    expect(result.error.message).toBe('Route not found.');
    expect(result.error.details).toEqual({ route: '/api/v1/draft/recovery' });
    expect(result.traceId).toBe('trace-error');
  });

  it('surfaces 409 backend conflicts without collapsing to network errors', async () => {
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      mockErrorResponse(409, {
        code: 'CONFLICT',
        message: 'Submitted unit is out of date.',
        details: { unit_id: 'sc_0001' },
      }),
    );

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('CONFLICT');
    expect(result.error.httpStatus).toBe(409);
    expect(result.error.message).toBe('Submitted unit is out of date.');
    expect(result.error.details).toEqual({ unit_id: 'sc_0001' });
    expect(result.error.code).not.toBe('NETWORK_ERROR');
  });

  it('surfaces 500 backend failures with status and payload context', async () => {
    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(
      mockErrorResponse(500, {
        message: 'Internal service failure.',
        details: { operation: 'draft/rewrite' },
      }),
    );

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(result.ok).toBe(false);
    expect(result.error.httpStatus).toBe(500);
    expect(result.error.message).toBe('Service responded with HTTP 500.');
    expect(result.error.details).toEqual({
      message: 'Internal service failure.',
      details: { operation: 'draft/rewrite' },
    });
  });

  it('treats network failures as NETWORK_ERROR only when no backend response exists', async () => {
    process.env.BLACKSKIES_BRIDGE_MAX_ATTEMPTS = '1';
    process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD = '999';
    const networkError = new Error('connection refused');
    (networkError as Error).name = 'FetchError';

    const fetchMock = global.fetch as unknown as vi.Mock;
    fetchMock.mockReset();
    fetchMock.mockRejectedValue(networkError);

    const serviceApi = await loadServiceApi();
    const result = await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('NETWORK_ERROR');
    expect(result.error.message).toContain('Service request to');
    expect(result.error.message).toContain('connection refused');
  });
});
