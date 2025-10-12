import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
  ipcRenderer: {
    invoke: vi.fn(),
    send: vi.fn(),
  },
}));

vi.mock('../shared/config/runtime.js', () => {
  const defaultConfig = {
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
  };
  return {
    DEFAULT_HEALTH_PROBE: defaultConfig.service.healthProbe,
    DEFAULT_SERVICE_PORT_RANGE: defaultConfig.service.portRange,
    DEFAULT_RUNTIME_CONFIG: defaultConfig,
    loadRuntimeConfig: vi.fn(() => defaultConfig),
  };
});

import { serviceApi } from '../preload';

describe('serviceApi', () => {
  beforeEach(() => {
    process.env.BLACKSKIES_SERVICES_PORT = '5000';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: 'ok' }),
      headers: new Headers({ 'x-trace-id': 'trace-test' }),
    }) as unknown as typeof fetch;
  });

  it('posts serialized outline payloads to the API', async () => {
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
    await serviceApi.getRecoveryStatus({ projectId: 'proj_test' });

    expect(fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/v1/draft/recovery?project_id=proj_test',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
