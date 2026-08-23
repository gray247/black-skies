type BrowserLikeDocument = {
  body?: { dataset?: Record<string, string | undefined> } | null;
  documentElement?: { dataset?: Record<string, string | undefined> } | null;
};

function getDocument(): BrowserLikeDocument | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document as unknown as BrowserLikeDocument;
}

function getProcessEnv(): NodeJS.ProcessEnv | undefined {
  return typeof process !== 'undefined' && process.env ? process.env : undefined;
}

function getEnvFlag(name: string): string | undefined {
  return getProcessEnv()?.[name];
}

function datasetFlagEnabled(flag: string): boolean {
  const doc = getDocument();
  if (!doc) {
    return false;
  }
  const htmlValue = doc.documentElement?.dataset?.[flag];
  if (htmlValue === '1') {
    return true;
  }
  return doc.body?.dataset?.[flag] === '1';
}

function getNodeEnv(): string {
  return getEnvFlag('NODE_ENV') ?? '';
}

function isPlaywrightHarness(): boolean {
  const win = typeof window === 'undefined' ? undefined : (window as typeof window & { __testEnv?: boolean | { isPlaywright?: boolean }; __dev?: unknown });
  if (!win) {
    return false;
  }
  const envFlag = win.__testEnv;
  const isPlaywrightFlag =
    envFlag === true ||
    (envFlag !== false && typeof envFlag === 'object' && envFlag.isPlaywright === true);
  return Boolean(isPlaywrightFlag && win.__dev);
}

export function isProduction(): boolean {
  return getNodeEnv() === 'production';
}

export function isDev(): boolean {
  return getNodeEnv() === 'development';
}

export function isE2E(): boolean {
  return getEnvFlag('BLACKSKIES_E2E_MODE') === '1';
}

export function isSynthetic(): boolean {
  return isE2E() && getEnvFlag('BLACKSKIES_E2E_SYNTHETIC_MODE') === '1';
}

export function isTruthLane(): boolean {
  return isE2E() && getEnvFlag('BLACKSKIES_E2E_EXTERNAL_SERVICE') === '1' && !isSynthetic();
}

export function isSmokeLane(): boolean {
  return isSynthetic();
}

export function isVisualStrict(): boolean {
  return getEnvFlag('VISUAL_STRICT') === '1';
}

export function isVisualStable(): boolean {
  return getEnvFlag('BLACKSKIES_VISUAL_STABLE') === '1' || datasetFlagEnabled('testVisualStable');
}

export function isHarnessEnabled(): boolean {
  if (getEnvFlag('BLACKSKIES_ENABLE_HARNESS_HOOKS') === '1') {
    return true;
  }
  return isPlaywrightHarness();
}

export function getHarnessDialogPath(kind: 'markdown' | 'directory'): string | undefined {
  if (!isHarnessEnabled() || isProduction()) return undefined;
  const key = kind === 'markdown'
    ? 'BLACKSKIES_E2E_STRUCTURE_MARKDOWN_PATH'
    : 'BLACKSKIES_E2E_STRUCTURE_DIRECTORY_PATH';
  const value = getEnvFlag(key);
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function assertValidMode(): void {
  if (isProduction() && isHarnessEnabled()) {
    throw new Error('Harness hooks are forbidden in production mode');
  }
  if (isProduction() && isSynthetic()) {
    throw new Error('Synthetic mode is forbidden in production mode');
  }
  if (isE2E() && getEnvFlag('BLACKSKIES_E2E_EXTERNAL_SERVICE') === '1' && isSynthetic()) {
    throw new Error('Synthetic mode is forbidden in truth lane');
  }
}
