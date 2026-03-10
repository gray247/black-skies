interface DebugEvent {
  timestamp: string;
  scope: string;
  data: unknown;
}

type DebugLogListener = () => void;

export interface DebugLogSnapshot {
  version: number;
  events: readonly DebugEvent[];
}

declare global {
  interface Window {
    __blackskiesDebugLog?: DebugEvent[];
  }
}

const MAX_EVENTS = 200;
const events: DebugEvent[] = [];
const listeners = new Set<DebugLogListener>();
let snapshot: DebugLogSnapshot = { version: 0, events: events.slice() };

if (typeof window !== 'undefined') {
  if (!window.__blackskiesDebugLog) {
    window.__blackskiesDebugLog = events;
  }
}

function shouldLogToConsole(): boolean {
  if (typeof window !== 'undefined') {
    const win = window as typeof window & { __testEnv?: { isPlaywright?: boolean } };
    if (
      (typeof process !== 'undefined' && process.env?.PLAYWRIGHT === '1') ||
      win.__testEnv === true ||
      win.__testEnv?.isPlaywright ||
      document.body?.dataset?.testStableDock === '1'
    ) {
      return false;
    }
  }
  return true;
}

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error('[DebugLog] Listener error', error);
    }
  }
}

function appendEvent(entry: DebugEvent): void {
  events.push(entry);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  if (typeof window !== 'undefined' && window.__blackskiesDebugLog) {
    window.__blackskiesDebugLog.length = 0;
    window.__blackskiesDebugLog.push(...events);
  }
  snapshot = { version: snapshot.version + 1, events: events.slice() };
  notifyListeners();
}

export function recordDebugEvent(scope: string, data: unknown): void {
  const entry: DebugEvent = {
    timestamp: new Date().toISOString(),
    scope,
    data,
  };
  if (shouldLogToConsole()) {
    console.info(`[Debug:${scope}]`, JSON.stringify(entry));
  }
  appendEvent(entry);
}

export function getDebugLogSnapshot(): DebugLogSnapshot {
  return snapshot;
}

export function subscribeDebugLog(listener: DebugLogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearDebugLog(): void {
  events.length = 0;
  if (typeof window !== 'undefined' && window.__blackskiesDebugLog) {
    window.__blackskiesDebugLog.length = 0;
  }
  snapshot = { version: snapshot.version + 1, events: events.slice() };
  notifyListeners();
}
