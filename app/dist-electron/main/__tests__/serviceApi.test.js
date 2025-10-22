"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('electron', () => ({
    contextBridge: {
        exposeInMainWorld: vitest_1.vi.fn(),
    },
    ipcRenderer: {
        invoke: vitest_1.vi.fn(),
        send: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock('../shared/config/runtime.js', () => {
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
        loadRuntimeConfig: vitest_1.vi.fn(() => defaultConfig),
    };
});
const preload_1 = require("../preload");
(0, vitest_1.describe)('serviceApi', () => {
    (0, vitest_1.beforeEach)(() => {
        process.env.BLACKSKIES_SERVICES_PORT = '5000';
        global.fetch = vitest_1.vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vitest_1.vi.fn().mockResolvedValue({ data: 'ok' }),
            headers: new Headers({ 'x-trace-id': 'trace-test' }),
        });
    });
    (0, vitest_1.it)('posts serialized outline payloads to the API', async () => {
        const response = await preload_1.serviceApi.buildOutline({
            projectId: 'proj_test',
            forceRebuild: false,
            wizardLocks: {
                acts: [{ title: 'Act I' }],
                chapters: [{ title: 'Chapter 1', actIndex: 1 }],
                scenes: [{ title: 'Scene 1', chapterIndex: 1, beatRefs: [] }],
            },
        });
        (0, vitest_1.expect)(response.ok).toBe(true);
        (0, vitest_1.expect)(fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/api/v1/outline/build', vitest_1.expect.objectContaining({ method: 'POST' }));
    });
    (0, vitest_1.it)('performs GET requests with query parameters for recovery status', async () => {
        await preload_1.serviceApi.getRecoveryStatus({ projectId: 'proj_test' });
        (0, vitest_1.expect)(fetch).toHaveBeenCalledWith('http://127.0.0.1:5000/api/v1/draft/recovery?project_id=proj_test', vitest_1.expect.objectContaining({ method: 'GET' }));
    });
});
//# sourceMappingURL=serviceApi.test.js.map