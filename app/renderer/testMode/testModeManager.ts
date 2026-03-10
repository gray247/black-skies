export type TestModeName = 'none' | 'flat' | 'recovery' | 'full';

type WindowWithTestFlags = typeof window & {
  __testEnv?: boolean | { isPlaywright?: boolean };
  __testEnvFlatMode?: boolean;
  __testEnvRecoveryMode?: boolean;
  __testEnvFullMode?: boolean;
  __testEnvForceOffline?: boolean;
  __testEnvForceOfflineReason?: string;
  __testEnvForceOnline?: boolean;
  __testEnvStableDock?: boolean;
  __testEnvVisualStable?: boolean;
  __testModeFreezeServiceHealth?: boolean;
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

export function getMode(): TestModeName {
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
  const win = getWindow();
  const datasetFlag = typeof document !== 'undefined' && document.body?.dataset?.testStableDock === '1';
  const requested = datasetFlag || Boolean(win?.__testEnvStableDock === true);
  if (win && !requested && win.__testEnvStableDock) {
    console.warn('[MODE-LEAK] stableDock active during live flow');
  }
  return requested;
}

export function isVisualHome(): boolean {
  const win = getWindow();
  const datasetFlag = typeof document !== 'undefined' && document.body?.dataset?.testVisualStable === '1';
  const requested = datasetFlag || Boolean(win?.__testEnvVisualStable === true);
  if (win && !requested && win.__testEnvVisualStable) {
    console.warn('[MODE-LEAK] visualHome active during live flow');
  }
  return requested;
}

export function getOfflineReason(): string | null {
  const win = getWindow();
  const datasetReason =
    typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason ?? null : null;
  if (datasetReason) {
    return datasetReason;
  }
  if (datasetFlagEnabled('testForceOffline')) {
    return 'test-offline';
  }
  if (win?.__testEnvForceOffline) {
    return 'test-offline';
  }
  if (win?.__testEnvForceOfflineReason) {
    return win.__testEnvForceOfflineReason;
  }
  return null;
}

export function isForcedOffline(): boolean {
  const win = getWindow();
  const datasetReason =
    typeof document !== 'undefined' ? document.body?.dataset?.testEnvForceOfflineReason : null;
  return Boolean(datasetReason || datasetFlagEnabled('testForceOffline') || win?.__testEnvForceOffline === true);
}

export function isForcedOnline(): boolean {
  const win = getWindow();
  return Boolean(datasetFlagEnabled('testForceOnline') || win?.__testEnvForceOnline === true);
}

export function testModeFreezeServiceHealth(): boolean {
  const win = getWindow();
  return Boolean(datasetFlagEnabled('testModeFreezeServiceHealth') || win?.__testModeFreezeServiceHealth === true);
}
