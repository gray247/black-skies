"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RUNTIME_CONFIG = exports.DEFAULT_HEALTH_PROBE = exports.DEFAULT_SERVICE_PORT_RANGE = void 0;
exports.clearRuntimeConfigCache = clearRuntimeConfigCache;
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
    ui: {
        enableDocking: false,
        defaultPreset: "standard",
        hotkeys: {
            enablePresetHotkeys: true,
            focusCycleOrder: ["wizard", "draft-board", "critique", "history", "analytics"],
        },
    },
});
const MIN_TCP_PORT = 1;
const MAX_TCP_PORT = 65535;
const configCache = new Map();
function clearRuntimeConfigCache(explicitPath) {
    if (explicitPath) {
        const resolved = resolveConfigPath(explicitPath);
        configCache.delete(resolved);
        return;
    }
    configCache.clear();
}
function loadRuntimeConfig(explicitPath) {
    const configPath = resolveConfigPath(explicitPath);
    const cached = configCache.get(configPath);
    if (cached) {
        return cached;
    }
    let resolvedConfig;
    if (!(0, node_fs_1.existsSync)(configPath)) {
        console.info(`[config] runtime.yaml not found at ${configPath}; using defaults.`);
        resolvedConfig = exports.DEFAULT_RUNTIME_CONFIG;
    }
    else {
        try {
            const raw = (0, node_fs_1.readFileSync)(configPath, 'utf8');
            const parsed = ((0, yaml_1.parse)(raw) ?? {});
            resolvedConfig = normalizeRuntimeConfig(parsed);
        }
        catch (error) {
            console.warn('[config] Failed to load runtime.yaml:', error);
            resolvedConfig = exports.DEFAULT_RUNTIME_CONFIG;
        }
    }
    configCache.set(configPath, resolvedConfig);
    return resolvedConfig;
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
    const uiSection = parsed.ui ?? {};
    const uiHotkeysSection = uiSection.hotkeys ?? {};
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
        ui: {
            enableDocking: toBoolean(uiSection.enable_docking, exports.DEFAULT_RUNTIME_CONFIG.ui.enableDocking),
            defaultPreset: typeof uiSection.default_preset === "string"
                ? uiSection.default_preset
                : exports.DEFAULT_RUNTIME_CONFIG.ui.defaultPreset,
            hotkeys: {
                enablePresetHotkeys: toBoolean(uiHotkeysSection.enable_preset_hotkeys, exports.DEFAULT_RUNTIME_CONFIG.ui.hotkeys.enablePresetHotkeys),
                focusCycleOrder: resolveFocusCycle(uiHotkeysSection.focus_cycle_order),
            },
        },
    };
}
function resolveFocusCycle(value) {
    if (!Array.isArray(value)) {
        return exports.DEFAULT_RUNTIME_CONFIG.ui.hotkeys.focusCycleOrder;
    }
    const normalised = value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0);
    if (normalised.length === 0) {
        return exports.DEFAULT_RUNTIME_CONFIG.ui.hotkeys.focusCycleOrder;
    }
    return normalised;
}
function toBoolean(value, fallback) {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        const normalised = value.trim().toLowerCase();
        if (normalised === "true") {
            return true;
        }
        if (normalised === "false") {
            return false;
        }
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return fallback;
}
function normalizePortRange(value) {
    if (value && typeof value === 'object') {
        const candidate = value;
        const rawMin = toNumber(candidate.min, Number.NaN);
        const rawMax = toNumber(candidate.max, Number.NaN);
        if (Number.isFinite(rawMin) && Number.isFinite(rawMax)) {
            const clampedMin = Math.min(Math.max(Math.round(rawMin), MIN_TCP_PORT), MAX_TCP_PORT);
            const clampedMax = Math.min(Math.max(Math.round(rawMax), MIN_TCP_PORT), MAX_TCP_PORT);
            if (clampedMin < clampedMax) {
                if (clampedMin !== rawMin || clampedMax !== rawMax) {
                    console.warn('[config] Adjusted service.port_range to stay within valid TCP bounds (1-65535).', { requested: { min: rawMin, max: rawMax }, applied: { min: clampedMin, max: clampedMax } });
                }
                return { min: clampedMin, max: clampedMax };
            }
        }
        console.warn('[config] Invalid service.port_range; using defaults.', { requested: candidate });
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