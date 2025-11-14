import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ServiceError, ServicesBridge } from '../../shared/ipc/services';
import type { ServiceStatus } from '../components/ServiceStatusPill';
import useMountedRef from './useMountedRef';
import { isTestEnvironment } from '../utils/env';

interface UseServiceHealthOptions {
  intervalMs?: number;
}

interface UseServiceHealthResult {
  status: ServiceStatus;
  retry: () => Promise<void>;
  isPortUnavailable: boolean;
  lastError: ServiceError | null;
}

declare global {
  interface Window {
    __testEnv?: { isPlaywright?: boolean };
  }
}

const RETRY_THROTTLE_MS = 1_000;

function isPortUnavailableError(error?: ServiceError | null): boolean {
  if (!error || typeof error.message !== 'string') {
    return false;
  }
  return error.message.includes('Service port is unavailable');
}

export function useServiceHealth(
  services: ServicesBridge | undefined,
  options: UseServiceHealthOptions = {},
): UseServiceHealthResult {
  const testEnv = isTestEnvironment();
  const mountedRef = useMountedRef();
  const isPlaywright = typeof window !== 'undefined' && window.__testEnv?.isPlaywright === true;
  const [status, setStatus] = useState<ServiceStatus>('checking');
  const [isPortUnavailable, setIsPortUnavailable] = useState(false);
  const [lastError, setLastError] = useState<ServiceError | null>(null);
  const lastLoggedTraceIdRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);
  const lastRetryTimestampRef = useRef(0);

  const intervalMs = useMemo(() => {
    if (typeof options.intervalMs === 'number') {
      return options.intervalMs;
    }
    if (isPlaywright) {
      return 0;
    }
    return testEnv ? 0 : 15_000;
  }, [options.intervalMs, testEnv, isPlaywright]);

  const logFailure = useCallback((error?: ServiceError | null) => {
    if (!error) {
      return;
    }
    const traceId = error.traceId ?? null;
    if (traceId && traceId === lastLoggedTraceIdRef.current) {
      return;
    }
    lastLoggedTraceIdRef.current = traceId;
    console.warn('[useServiceHealth] Health probe failed', {
      message: error.message,
      code: error.code,
      traceId,
      details: error.details,
    });
  }, []);

  const handleFailure = useCallback(
    (error?: ServiceError | null, portIssue = false) => {
      logFailure(error);
      if (!mountedRef.current) {
        return;
      }
      setIsPortUnavailable(portIssue);
      setLastError(error ?? null);
      setStatus('offline');
    },
    [logFailure, mountedRef],
  );

  const retry = useCallback(async () => {
    const now = performance.now ? performance.now() : Date.now();
    if (isCheckingRef.current || now - lastRetryTimestampRef.current < RETRY_THROTTLE_MS) {
      return;
    }

    lastRetryTimestampRef.current = now;
    if (mountedRef.current) {
      setStatus('checking');
    }
    isCheckingRef.current = true;

    if (!services) {
      console.error('[useServiceHealth] Services bridge unavailable; project actions disabled');
      handleFailure(
        {
          message: 'Services bridge unavailable; project actions disabled',
        },
        true,
      );
      isCheckingRef.current = false;
      return;
    }

    try {
      const result = await services.checkHealth();
      if (!mountedRef.current) {
        return;
      }
      if (result.ok) {
        lastLoggedTraceIdRef.current = null;
        setIsPortUnavailable(false);
        setLastError(null);
        setStatus('online');
        return;
      }

      handleFailure(result.error ?? null, isPortUnavailableError(result.error));
    } catch (error) {
      console.error('[useServiceHealth] Health probe threw an error', error);
      const normalized: ServiceError = {
        message: error instanceof Error ? error.message : String(error),
      };
      handleFailure(normalized, false);
    } finally {
      isCheckingRef.current = false;
    }
  }, [handleFailure, services, mountedRef]);

  useEffect(() => {
    let cancelled = false;
    void retry();

    if (intervalMs <= 0) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setInterval(() => {
      if (!cancelled) {
        void retry();
      }
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, retry]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    const statusHandler = (event: Event) => {
      const customEvent = event as CustomEvent<'offline' | 'online'>;
      const detail = customEvent.detail;
      if (detail === 'online' || detail === 'offline') {
        if (mountedRef.current) {
          setStatus(detail);
          if (detail === 'online') {
            setIsPortUnavailable(false);
            setLastError(null);
          }
        }
      }
    };
    const healthHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        status?: ServiceStatus;
        portUnavailable?: boolean;
        errorMessage?: string;
      }>;
      const detail = customEvent.detail;
      if (detail?.status !== 'online' && detail?.status !== 'offline') {
        return;
      }
      if (!mountedRef.current) {
        return;
      }
      setStatus(detail.status);
      if (detail.status === 'online') {
        setIsPortUnavailable(false);
        setLastError(null);
      } else {
        setIsPortUnavailable(Boolean(detail.portUnavailable));
        if (detail.errorMessage) {
          setLastError({ message: detail.errorMessage });
        }
      }
    };
    window.addEventListener('test:service-status', statusHandler);
    window.addEventListener('test:service-health', healthHandler);
    return () => {
      window.removeEventListener('test:service-status', statusHandler);
      window.removeEventListener('test:service-health', healthHandler);
    };
  }, [mountedRef]);

  return { status, retry, isPortUnavailable, lastError };
}

export default useServiceHealth;
