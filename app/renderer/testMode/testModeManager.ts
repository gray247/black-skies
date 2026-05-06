export type TestModeName = 'none' | 'flat' | 'recovery' | 'full';
export type E2EStartupMode = 'flat' | 'full' | 'recovery';
export type E2EServiceSource = 'stub' | 'real';

export type E2EStartupConfig = {
  mode: E2EStartupMode;
  projectPath: string | null;
  recovery: boolean;
  services: E2EServiceSource;
  allowRuntimeModeOverride?: boolean;
  allowLayoutRestore?: boolean;
};

type WindowWithTestFlags = typeof window & {
  __testEnv?: boolean | { isPlaywright?: boolean };
  __testEnvFlatMode?: boolean;
  __testEnvRecoveryMode?: boolean;
  __testEnvFullMode?: boolean;
  __E2E_STARTUP_CONFIG?: E2EStartupConfig;
  __dev?: unknown;
};

function getWindow(): WindowWithTestFlags | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window as WindowWithTestFlags;
}

function datasetFlagEnabled(flag: string): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  const htmlValue = document.documentElement?.dataset?.[flag];
  if (htmlValue === '1') {
    return true;
  }
  const bodyValue = document.body?.dataset?.[flag];
  return bodyValue === '1';
}

export function isHarnessHooksEnabled(): boolean {
  return modePolicy.isHarnessEnabled();
}

export function getStartupConfig(): E2EStartupConfig | null {
  if (!isHarnessHooksEnabled()) {
    return null;
  }
  const win = getWindow();
  if (!win) {
    return null;
  }
  return win.__E2E_STARTUP_CONFIG ?? null;
}

export function isModeLocked(): boolean {
  const startup = getStartupConfig();
  if (!startup) {
    return false;
  }
  return startup.allowRuntimeModeOverride !== true;
}

export function allowLayoutRestore(): boolean {
  const startup = getStartupConfig();
  if (!startup) {
    return true;
  }
  return startup.allowLayoutRestore === true;
}

export function getMode(): TestModeName {
  if (!isHarnessHooksEnabled()) {
    return 'none';
  }
  const win = getWindow();
  if (!win) {
    return 'none';
  }
  const startupMode = win.__E2E_STARTUP_CONFIG?.mode;
  if (startupMode === 'flat' || startupMode === 'full' || startupMode === 'recovery') {
    return startupMode;
  }
  if (win.__testEnvFlatMode === true) {
    return 'flat';
  }
  if (win.__testEnvRecoveryMode === true) {
    return 'recovery';
  }
  if (win.__testEnvFullMode === true) {
    return 'full';
  }
  return 'none';
}

export function isFlat(): boolean {
  return getMode() === 'flat';
}

export function isFlatMode(): boolean {
  return isFlat();
}

export function isRecovery(): boolean {
  return getMode() === 'recovery';
}

export function isRecoveryMode(): boolean {
  return isRecovery();
}

export function isFull(): boolean {
  const mode = getMode();
  return mode === 'full' || mode === 'none';
}

export function isTestEnv(): boolean {
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('jsdom') || userAgent.includes('vitest')) {
      return true;
    }
  }
  const win = getWindow();
  const documentTestEnv = typeof document !== 'undefined' && document.body?.dataset?.testEnv === '1';
  if (!win) {
    return false;
  }
  const envFlag = win.__testEnv;
  const isPlaywrightFlag =
    envFlag === true ||
    (envFlag !== false && typeof envFlag === 'object' && envFlag.isPlaywright === true);
  return Boolean(isPlaywrightFlag || documentTestEnv);
}

export function isStableDock(): boolean {
  if (!isHarnessHooksEnabled()) {
    return false;
  }
  const datasetFlag =
    typeof document !== 'undefined' &&
    (document.body?.dataset?.testStableDock === '1' ||
      document.documentElement?.dataset?.testStableDock === '1');
  return datasetFlag;
}

export function isVisualHome(): boolean {
  if (!isHarnessHooksEnabled()) {
    return false;
  }
  return modePolicy.isVisualStable();
}

export function getOfflineReason(): string | null {
  if (!isHarnessHooksEnabled()) {
    return null;
  }
  const startup = getStartupConfig();
  if (startup && startup.services === 'real') {
    return null;
  }
  const datasetReason =
    typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason ?? null : null;
  if (datasetReason) {
    return datasetReason;
  }
  if (datasetFlagEnabled('testForceOffline')) {
    return 'test-offline';
  }
  return null;
}

export function isForcedOffline(): boolean {
  if (!isHarnessHooksEnabled()) {
    return false;
  }
  const datasetReason =
    typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason : null;
  return Boolean(datasetReason || datasetFlagEnabled('testForceOffline'));
}

export function testModeFreezeServiceHealth(): boolean {
  if (!isHarnessHooksEnabled()) {
    return false;
  }
  return Boolean(datasetFlagEnabled('testModeFreezeServiceHealth'));
}
import * as modePolicy from "../../shared/modePolicy";
