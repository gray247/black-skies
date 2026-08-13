import { vi } from 'vitest';

const BODY_DATASET_KEYS = [
  'projectLoaded',
  'projectPath',
  'projectId',
  'activeSceneId',
  'testMode',
  'testEnv',
  'testStableDock',
  'testStablehome',
  'testVisualStable',
  'testForceOffline',
  'testEnvForceOfflineReason',
  'testNeedsRecovery',
  'testModeFreezeServiceHealth',
  'stage19Spine',
  'stage19Theme',
] as const;

const WINDOW_KEYS = [
  'bridge',
  'services',
  'projectLoader',
  '__electronApi',
  '__TEST_PROJECT_HOME_EDITED_DRAFT',
  '__testProjectState',
  '__blackskiesDebugProjectState',
  '__blackSkiesDebugState',
  '__blackskiesDebugLog',
  '__serviceHealthRetry',
  '__budgetRefresh',
  '__testBudgetResponse',
  '__APP_READY__',
  'timeline',
] as const;

function clearDataset(target: DOMStringMap | undefined | null): void {
  if (!target) {
    return;
  }
  for (const key of BODY_DATASET_KEYS) {
    delete target[key];
  }
}

function clearWindowKeys(): void {
  if (typeof window === 'undefined') {
    return;
  }
  for (const key of WINDOW_KEYS) {
    delete (window as typeof window & Record<string, unknown>)[key];
  }
}

function ensureModalRoot(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const existing = document.getElementById('modal-root');
  if (existing) {
    existing.innerHTML = '';
    return;
  }
  const modalRoot = document.createElement('div');
  modalRoot.setAttribute('id', 'modal-root');
  document.body.appendChild(modalRoot);
}

export function resetRendererTestState(): void {
  vi.clearAllTimers();
  vi.useRealTimers();

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.clear();
    } catch {
      // Ignore storage access issues in test environments that stub storage.
    }
    try {
      window.sessionStorage.clear();
    } catch {
      // Ignore storage access issues in test environments that stub storage.
    }
    clearWindowKeys();
  }

  if (typeof document !== 'undefined') {
    clearDataset(document.body?.dataset);
    clearDataset(document.documentElement?.dataset);
    ensureModalRoot();
  }
}
