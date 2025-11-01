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
    delete process.env.BLACKSKIES_BRIDGE_FAILURE_THRESHOLD;
    delete process.env.BLACKSKIES_BRIDGE_RESET_MS;
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

  it('performs GET requests with query parameters for recovery status', async () => {
    const serviceApi = await loadServiceApi();

    await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/draft/recovery?project_id=proj_test',
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
    expect(result.error.details).toEqual({ timeout_ms: 50 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
