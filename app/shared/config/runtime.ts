import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { parse } from 'yaml';

export interface ServicePortRange {
  readonly min: number;
  readonly max: number;
}

export interface HealthProbeDefaults {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
}

export interface ServiceConfig {
  readonly portRange: ServicePortRange;
  readonly healthProbe: HealthProbeDefaults;
  readonly allowedPythonExecutables: readonly string[];
  readonly bundledPythonPath?: string;
}

export interface BudgetConfig {
  readonly softLimitUsd: number;
  readonly hardLimitUsd: number;
  readonly costPer1000WordsUsd: number;
}

export interface AnalyticsConfig {
  readonly emotionIntensity: Record<string, number>;
  readonly defaultEmotionIntensity: number;
  readonly pace: {
    readonly slowThreshold: number;
    readonly fastThreshold: number;
  };
}

export interface UiHotkeysConfig {
  readonly enablePresetHotkeys: boolean;
  readonly focusCycleOrder: readonly string[];
}

export interface UiConfig {
  readonly enableDocking: boolean;
  readonly defaultPreset: string;
  readonly hotkeys: UiHotkeysConfig;
}

export interface RuntimeConfig {
  readonly service: ServiceConfig;
  readonly budget: BudgetConfig;
  readonly analytics: AnalyticsConfig;
  readonly ui: UiConfig;
}

export const DEFAULT_SERVICE_PORT_RANGE: ServicePortRange = Object.freeze({
  min: 43750,
  max: 43850,
});

export const DEFAULT_HEALTH_PROBE: HealthProbeDefaults = Object.freeze({
  maxAttempts: 40,
  baseDelayMs: 250,
  maxDelayMs: 2000,
});

const DEFAULT_ANALYTICS_INTENSITY: Record<string, number> = Object.freeze({
  dread: 1.0,
  tension: 0.85,
  revelation: 0.65,
  aftermath: 0.45,
  respite: 0.25,
});

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = Object.freeze({
  service: {
    portRange: DEFAULT_SERVICE_PORT_RANGE,
    healthProbe: DEFAULT_HEALTH_PROBE,
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

const configCache = new Map<string, RuntimeConfig>();

export function clearRuntimeConfigCache(explicitPath?: string): void {
  if (explicitPath) {
    const resolved = resolveConfigPath(explicitPath);
    configCache.delete(resolved);
    return;
  }
  configCache.clear();
}

export function loadRuntimeConfig(explicitPath?: string): RuntimeConfig {
  const configPath = resolveConfigPath(explicitPath);
  const cached = configCache.get(configPath);
  if (cached) {
    return cached;
  }

  let resolvedConfig: RuntimeConfig;
  if (!existsSync(configPath)) {
    console.warn(`[config] runtime.yaml not found at ${configPath}; using defaults.`);
    resolvedConfig = DEFAULT_RUNTIME_CONFIG;
  } else {
    try {
      const raw = readFileSync(configPath, 'utf8');
      const parsed = (parse(raw) ?? {}) as Record<string, unknown>;
      resolvedConfig = normalizeRuntimeConfig(parsed);
    } catch (error) {
      console.warn('[config] Failed to load runtime.yaml:', error);
      resolvedConfig = DEFAULT_RUNTIME_CONFIG;
    }
  }

  configCache.set(configPath, resolvedConfig);
  return resolvedConfig;
}

function resolveConfigPath(explicitPath?: string): string {
  if (explicitPath) {
    return explicitPath;
  }
  if (process.env.BLACKSKIES_CONFIG_PATH) {
    return process.env.BLACKSKIES_CONFIG_PATH;
  }
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  if (resourcesPath) {
    const resourceCandidate = resolve(resourcesPath, 'config', 'runtime.yaml');
    if (existsSync(resourceCandidate)) {
      return resourceCandidate;
    }
  }
  const cwdCandidates = [process.cwd(), resolve(process.cwd(), '..')];
  for (const candidate of cwdCandidates) {
    const path = resolve(candidate, 'config', 'runtime.yaml');
    if (existsSync(path)) {
      return path;
    }
  }
  const baseDir = dirname(resolve(process.argv[1] ?? process.cwd()));
  return resolve(baseDir, '..', 'config', 'runtime.yaml');
}

function normalizeRuntimeConfig(parsed: Record<string, unknown>): RuntimeConfig {
  const serviceSection = (parsed.service as Record<string, unknown> | undefined) ?? {};
  const portRange = normalizePortRange(serviceSection.port_range);
  const healthProbe = normalizeHealthProbe(serviceSection.health_probe);
  const allowed = Array.isArray(serviceSection.allowed_python_executables)
    ? serviceSection.allowed_python_executables.map((entry) => String(entry).toLowerCase())
    : DEFAULT_RUNTIME_CONFIG.service.allowedPythonExecutables;
  const bundled = typeof serviceSection.bundled_python_path === 'string'
    ? serviceSection.bundled_python_path
    : DEFAULT_RUNTIME_CONFIG.service.bundledPythonPath;

  const budgetSection = (parsed.budget as Record<string, unknown> | undefined) ?? {};

  const analyticsSection = (parsed.analytics as Record<string, unknown> | undefined) ?? {};
  const emotionIntensity = normalizeEmotionIntensity(analyticsSection.emotion_intensity);
  const paceSection = (analyticsSection.pace as Record<string, unknown> | undefined) ?? {};
  const uiSection = (parsed.ui as Record<string, unknown> | undefined) ?? {};
  const uiHotkeysSection = (uiSection.hotkeys as Record<string, unknown> | undefined) ?? {};

  return {
    service: {
      portRange,
      healthProbe,
      allowedPythonExecutables: allowed,
      bundledPythonPath: bundled && bundled.length > 0 ? bundled : undefined,
    },
    budget: {
      softLimitUsd: toNumber(budgetSection.soft_limit_usd, DEFAULT_RUNTIME_CONFIG.budget.softLimitUsd),
      hardLimitUsd: toNumber(budgetSection.hard_limit_usd, DEFAULT_RUNTIME_CONFIG.budget.hardLimitUsd),
      costPer1000WordsUsd: toNumber(
        budgetSection.cost_per_1000_words_usd,
        DEFAULT_RUNTIME_CONFIG.budget.costPer1000WordsUsd,
      ),
    },
    analytics: {
      emotionIntensity,
      defaultEmotionIntensity: toNumber(
        analyticsSection.default_emotion_intensity,
        DEFAULT_RUNTIME_CONFIG.analytics.defaultEmotionIntensity,
      ),
      pace: {
        slowThreshold: toNumber(
          paceSection.slow_threshold,
          DEFAULT_RUNTIME_CONFIG.analytics.pace.slowThreshold,
        ),
        fastThreshold: toNumber(
          paceSection.fast_threshold,
          DEFAULT_RUNTIME_CONFIG.analytics.pace.fastThreshold,
        ),
      },
    },
    ui: {
      enableDocking: toBoolean(
        uiSection.enable_docking,
        DEFAULT_RUNTIME_CONFIG.ui.enableDocking,
      ),
      defaultPreset:
        typeof uiSection.default_preset === "string"
          ? uiSection.default_preset
          : DEFAULT_RUNTIME_CONFIG.ui.defaultPreset,
      hotkeys: {
        enablePresetHotkeys: toBoolean(
          uiHotkeysSection.enable_preset_hotkeys,
          DEFAULT_RUNTIME_CONFIG.ui.hotkeys.enablePresetHotkeys,
        ),
        focusCycleOrder: resolveFocusCycle(uiHotkeysSection.focus_cycle_order),
      },
    },
  };
}

function resolveFocusCycle(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_RUNTIME_CONFIG.ui.hotkeys.focusCycleOrder;
  }
  const normalised = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
  if (normalised.length === 0) {
    return DEFAULT_RUNTIME_CONFIG.ui.hotkeys.focusCycleOrder;
  }
  return normalised;
}

function toBoolean(value: unknown, fallback: boolean): boolean {
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

function normalizePortRange(value: unknown): ServicePortRange {
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    const rawMin = toNumber(candidate.min, Number.NaN);
    const rawMax = toNumber(candidate.max, Number.NaN);
    if (Number.isFinite(rawMin) && Number.isFinite(rawMax)) {
      const clampedMin = Math.min(Math.max(Math.round(rawMin), MIN_TCP_PORT), MAX_TCP_PORT);
      const clampedMax = Math.min(Math.max(Math.round(rawMax), MIN_TCP_PORT), MAX_TCP_PORT);
      if (clampedMin < clampedMax) {
        if (clampedMin !== rawMin || clampedMax !== rawMax) {
          console.warn(
            '[config] Adjusted service.port_range to stay within valid TCP bounds (1-65535).',
            { requested: { min: rawMin, max: rawMax }, applied: { min: clampedMin, max: clampedMax } },
          );
        }
        return { min: clampedMin, max: clampedMax };
      }
    }
    console.warn('[config] Invalid service.port_range; using defaults.', { requested: candidate });
  }
  return DEFAULT_SERVICE_PORT_RANGE;
}

function normalizeHealthProbe(value: unknown): HealthProbeDefaults {
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    const maxAttempts = Math.max(
      1,
      Math.round(toNumber(candidate.max_attempts, DEFAULT_HEALTH_PROBE.maxAttempts)),
    );
    const baseDelay = Math.max(50, Math.round(toNumber(candidate.base_delay_ms, DEFAULT_HEALTH_PROBE.baseDelayMs)));
    const maxDelay = Math.max(baseDelay, Math.round(toNumber(candidate.max_delay_ms, DEFAULT_HEALTH_PROBE.maxDelayMs)));
    return {
      maxAttempts,
      baseDelayMs: baseDelay,
      maxDelayMs: maxDelay,
    };
  }
  return DEFAULT_HEALTH_PROBE;
}

function normalizeEmotionIntensity(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return DEFAULT_ANALYTICS_INTENSITY;
  }
  const entries = Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (acc, [key, raw]) => {
      const normalised = toNumber(raw, Number.NaN);
      if (Number.isFinite(normalised)) {
        acc[key] = normalised;
      }
      return acc;
    },
    {},
  );
  return { ...DEFAULT_ANALYTICS_INTENSITY, ...entries };
}

function toNumber(value: unknown, fallback: number): number {
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
