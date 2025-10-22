"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RUNTIME_CONFIG = exports.DEFAULT_HEALTH_PROBE = exports.DEFAULT_SERVICE_PORT_RANGE = void 0;
exports.loadRuntimeConfig = loadRuntimeConfig;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const yaml_1 = require("yaml");
exports.DEFAULT_SERVICE_PORT_RANGE = Object.freeze({
    min: 43750,
    max: 43850,
});
exports.DEFAULT_HEALTH_PROBE = Object.freeze({
    maxAttempts: 40,
    baseDelayMs: 250,
    maxDelayMs: 2000,
});
const DEFAULT_ANALYTICS_INTENSITY = Object.freeze({
    dread: 1.0,
    tension: 0.85,
    revelation: 0.65,
    aftermath: 0.45,
    respite: 0.25,
});
exports.DEFAULT_RUNTIME_CONFIG = Object.freeze({
    service: {
        portRange: exports.DEFAULT_SERVICE_PORT_RANGE,
        healthProbe: exports.DEFAULT_HEALTH_PROBE,
        allowedPythonExecutables: ['python', 'python3', 'python.exe'],
        bundledPythonPath: '',
    },
    budget: {
        softLimitUsd: 5.0,
        hardLimitUsd: 10.0,
        costPer1000WordsUsd: 0.02,
    },
    analytics: {
        emotionIntensity: DEFAULT_ANALYTICS_INTENSITY,
        defaultEmotionIntensity: 0.5,
        pace: {
            slowThreshold: 1.2,
            fastThreshold: 0.8,
        },
    },
});
let cachedConfig = null;
function loadRuntimeConfig(explicitPath) {
    if (cachedConfig) {
        return cachedConfig;
    }
    const configPath = resolveConfigPath(explicitPath);
    if (!(0, node_fs_1.existsSync)(configPath)) {
        cachedConfig = exports.DEFAULT_RUNTIME_CONFIG;
        return cachedConfig;
    }
    try {
        const raw = (0, node_fs_1.readFileSync)(configPath, 'utf8');
        const parsed = ((0, yaml_1.parse)(raw) ?? {});
        cachedConfig = normalizeRuntimeConfig(parsed);
    }
    catch (error) {
        console.warn('[config] Failed to load runtime.yaml:', error);
        cachedConfig = exports.DEFAULT_RUNTIME_CONFIG;
    }
    return cachedConfig;
}
function resolveConfigPath(explicitPath) {
    if (explicitPath) {
        return explicitPath;
    }
    if (process.env.BLACKSKIES_CONFIG_PATH) {
        return process.env.BLACKSKIES_CONFIG_PATH;
    }
    const resourcesPath = process.resourcesPath;
    if (resourcesPath) {
        const resourceCandidate = (0, node_path_1.resolve)(resourcesPath, 'config', 'runtime.yaml');
        if ((0, node_fs_1.existsSync)(resourceCandidate)) {
            return resourceCandidate;
        }
    }
    const cwdCandidates = [process.cwd(), (0, node_path_1.resolve)(process.cwd(), '..')];
    for (const candidate of cwdCandidates) {
        const path = (0, node_path_1.resolve)(candidate, 'config', 'runtime.yaml');
        if ((0, node_fs_1.existsSync)(path)) {
            return path;
        }
    }
    const baseDir = (0, node_path_1.dirname)((0, node_path_1.resolve)(process.argv[1] ?? process.cwd()));
    return (0, node_path_1.resolve)(baseDir, '..', 'config', 'runtime.yaml');
}
function normalizeRuntimeConfig(parsed) {
    const serviceSection = parsed.service ?? {};
    const portRange = normalizePortRange(serviceSection.port_range);
    const healthProbe = normalizeHealthProbe(serviceSection.health_probe);
    const allowed = Array.isArray(serviceSection.allowed_python_executables)
        ? serviceSection.allowed_python_executables.map((entry) => String(entry).toLowerCase())
        : exports.DEFAULT_RUNTIME_CONFIG.service.allowedPythonExecutables;
    const bundled = typeof serviceSection.bundled_python_path === 'string'
        ? serviceSection.bundled_python_path
        : exports.DEFAULT_RUNTIME_CONFIG.service.bundledPythonPath;
    const budgetSection = parsed.budget ?? {};
    const analyticsSection = parsed.analytics ?? {};
    const emotionIntensity = normalizeEmotionIntensity(analyticsSection.emotion_intensity);
    const paceSection = analyticsSection.pace ?? {};
    return {
        service: {
            portRange,
            healthProbe,
            allowedPythonExecutables: allowed,
            bundledPythonPath: bundled && bundled.length > 0 ? bundled : undefined,
        },
        budget: {
            softLimitUsd: toNumber(budgetSection.soft_limit_usd, exports.DEFAULT_RUNTIME_CONFIG.budget.softLimitUsd),
            hardLimitUsd: toNumber(budgetSection.hard_limit_usd, exports.DEFAULT_RUNTIME_CONFIG.budget.hardLimitUsd),
            costPer1000WordsUsd: toNumber(budgetSection.cost_per_1000_words_usd, exports.DEFAULT_RUNTIME_CONFIG.budget.costPer1000WordsUsd),
        },
        analytics: {
            emotionIntensity,
            defaultEmotionIntensity: toNumber(analyticsSection.default_emotion_intensity, exports.DEFAULT_RUNTIME_CONFIG.analytics.defaultEmotionIntensity),
            pace: {
                slowThreshold: toNumber(paceSection.slow_threshold, exports.DEFAULT_RUNTIME_CONFIG.analytics.pace.slowThreshold),
                fastThreshold: toNumber(paceSection.fast_threshold, exports.DEFAULT_RUNTIME_CONFIG.analytics.pace.fastThreshold),
            },
        },
    };
}
function normalizePortRange(value) {
    if (value && typeof value === 'object') {
        const candidate = value;
        const min = toNumber(candidate.min, exports.DEFAULT_SERVICE_PORT_RANGE.min);
        const max = toNumber(candidate.max, exports.DEFAULT_SERVICE_PORT_RANGE.max);
        if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > min) {
            return { min, max };
        }
    }
    return exports.DEFAULT_SERVICE_PORT_RANGE;
}
function normalizeHealthProbe(value) {
    if (value && typeof value === 'object') {
        const candidate = value;
        const maxAttempts = Math.max(1, Math.round(toNumber(candidate.max_attempts, exports.DEFAULT_HEALTH_PROBE.maxAttempts)));
        const baseDelay = Math.max(50, Math.round(toNumber(candidate.base_delay_ms, exports.DEFAULT_HEALTH_PROBE.baseDelayMs)));
        const maxDelay = Math.max(baseDelay, Math.round(toNumber(candidate.max_delay_ms, exports.DEFAULT_HEALTH_PROBE.maxDelayMs)));
        return {
            maxAttempts,
            baseDelayMs: baseDelay,
            maxDelayMs: maxDelay,
        };
    }
    return exports.DEFAULT_HEALTH_PROBE;
}
function normalizeEmotionIntensity(value) {
    if (!value || typeof value !== 'object') {
        return DEFAULT_ANALYTICS_INTENSITY;
    }
    const entries = Object.entries(value).reduce((acc, [key, raw]) => {
        const normalised = toNumber(raw, Number.NaN);
        if (Number.isFinite(normalised)) {
            acc[key] = normalised;
        }
        return acc;
    }, {});
    return { ...DEFAULT_ANALYTICS_INTENSITY, ...entries };
}
function toNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return fallback;
}
//# sourceMappingURL=runtime.js.map