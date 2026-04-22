export type TestModeName = 'none' | 'flat' | 'recovery' | 'full';

type WindowWithTestFlags = typeof window & {
  __testEnv?: boolean | { isPlaywright?: boolean };
  __testEnvFlatMode?: boolean;
  __testEnvRecoveryMode?: boolean;
  __testEnvFullMode?: boolean;
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
  if (typeof process !== 'undefined' && process.env?.BLACKSKIES_ENABLE_HARNESS_HOOKS === '1') {
    return true;
  }
  const win = getWindow();
  if (!win) {
    return false;
  }
  const envFlag = win.__testEnv;
  const isPlaywrightFlag =
    envFlag === true ||
    (envFlag !== false && typeof envFlag === 'object' && envFlag.isPlaywright === true);
  return Boolean(isPlaywrightFlag && win.__dev);
}

export function getMode(): TestModeName {
  if (!isHarnessHooksEnabled()) {
    return 'none';
  }
  const win = getWindow();
  if (!win) {
    return 'none';
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
  const datasetFlag =
    typeof document !== 'undefined' &&
    (document.body?.dataset?.testVisualStable === '1' ||
      document.documentElement?.dataset?.testVisualStable === '1');
  return datasetFlag;
}

export function getOfflineReason(): string | null {
  if (!isHarnessHooksEnabled()) {
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
