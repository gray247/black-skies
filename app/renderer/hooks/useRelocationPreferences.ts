import { useCallback, useState } from 'react';

export const RELOCATION_NOTIFY_STORAGE_KEY = 'dock.relocation.notify';
export const RELOCATION_AUTOSNAP_STORAGE_KEY = 'dock.relocation.autosnap';

function readPreference(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === 'true') {
      return true;
    }
    if (raw === 'false') {
      return false;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function writePreference(key: string, value: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    // ignore quota errors
  }
}

export function useRelocationPreferences(): {
  notifyEnabled: boolean;
  setNotifyEnabled: (value: boolean) => void;
  autoSnapEnabled: boolean;
  setAutoSnapEnabled: (value: boolean) => void;
} {
  const [notifyEnabled, setNotifyEnabledState] = useState<boolean>(() =>
    readPreference(RELOCATION_NOTIFY_STORAGE_KEY, true),
  );
  const [autoSnapEnabled, setAutoSnapEnabledState] = useState<boolean>(() =>
    readPreference(RELOCATION_AUTOSNAP_STORAGE_KEY, false),
  );

  const setNotifyEnabled = useCallback((value: boolean) => {
    setNotifyEnabledState(value);
    writePreference(RELOCATION_NOTIFY_STORAGE_KEY, value);
  }, []);

  const setAutoSnapEnabled = useCallback((value: boolean) => {
    setAutoSnapEnabledState(value);
    writePreference(RELOCATION_AUTOSNAP_STORAGE_KEY, value);
  }, []);

  return {
    notifyEnabled,
    setNotifyEnabled,
    autoSnapEnabled,
    setAutoSnapEnabled,
  };
}
