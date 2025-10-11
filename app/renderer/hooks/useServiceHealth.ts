import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ServiceStatus } from '../components/ServiceStatusPill';
import type { ServicesBridge } from '../../shared/ipc/services';
import useMountedRef from './useMountedRef';

interface UseServiceHealthOptions {
  intervalMs?: number;
}

interface UseServiceHealthResult {
  status: ServiceStatus;
  retry: () => Promise<void>;
}

export function useServiceHealth(
  services: ServicesBridge | undefined,
  options: UseServiceHealthOptions = {},
): UseServiceHealthResult {
  const mountedRef = useMountedRef();
  const [status, setStatus] = useState<ServiceStatus>('checking');
  const intervalMs = useMemo(() => options.intervalMs ?? 15_000, [options.intervalMs]);

  const retry = useCallback(async () => {
    if (!services) {
      console.error('[useServiceHealth] Services bridge unavailable; project actions disabled');
      if (mountedRef.current) {
        setStatus('offline');
      }
      return;
    }

    if (mountedRef.current) {
      setStatus('online');
    }

    try {
      const result = await services.checkHealth();
      if (!mountedRef.current) {
        return;
      }
      if (!result.ok) {
        console.warn('[useServiceHealth] Service health check failed', result.error);
      }
      setStatus(result.ok ? 'online' : 'offline');
    } catch (error) {
      console.error('[useServiceHealth] Health probe threw an error', error);
      if (mountedRef.current) {
        setStatus('offline');
      }
    }
  }, [services, mountedRef]);

  useEffect(() => {
    let cancelled = false;
    void retry();
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

  return { status, retry };
}

export default useServiceHealth;
