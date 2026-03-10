import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { ServiceError, ServicesBridge } from '../../shared/ipc/services';
import type { ServiceStatus } from '../components/ServiceStatusPill';
import useMountedRef from './useMountedRef';
import { isTestEnvironment } from '../utils/env';
import * as testMode from '../testMode/testModeManager';

export function isDominantOffline(): boolean {
  return testMode.isTestEnv() && testMode.isForcedOffline();
}

interface UseServiceHealthOptions {
  intervalMs?: number;
  testHardFreezeHealthRef?: MutableRefObject<boolean>;
  stableHomeMode?: boolean;
  visualStableHome?: boolean;
}

interface UseServiceHealthResult {
  status: ServiceStatus;
  retry: () => Promise<void>;
  isPortUnavailable: boolean;
  lastError: ServiceError | null;
  serviceUnavailable: boolean;
  reason: string;
}

declare global {
  interface Window {
    __testEnv?: { isPlaywright?: boolean };
  }
}

const windowWithTestEnv =
  typeof window !== 'undefined'
    ? (window as Window & { __testEnv?: { isPlaywright?: boolean } })
    : undefined;

const RETRY_THROTTLE_MS = 1_000;

function isPortUnavailableError(error?: ServiceError | null): boolean {
  if (!error || typeof error.message !== 'string') {
    return false;
  }
  return error.message.includes('Service port is unavailable');
}

const noopRetry = async (): Promise<void> => {};

export function useServiceHealth(
  services: ServicesBridge | undefined,
  options: UseServiceHealthOptions = {},
): UseServiceHealthResult {
  const testEnv = isTestEnvironment();
  const mountedRef = useMountedRef();
  const offlineReason = testMode.getOfflineReason();
  const initialPortUnavailable = offlineReason === 'service_port_unavailable';
  const isTestEnv = testMode.isTestEnv();
  const initialForceOffline = offlineReason === 'test-offline';
  const dominantOffline = isDominantOffline();
  const initialForcedOffline = dominantOffline || initialForceOffline || initialPortUnavailable;
  const freezeServiceHealth = testMode.testModeFreezeServiceHealth();
  const forcedOfflineFlag = testMode.isForcedOffline();
  const isPlaywright = windowWithTestEnv?.__testEnv?.isPlaywright === true;
  const [forceOffline, setForceOffline] = useState(initialForcedOffline);
  const initialStatus: ServiceStatus = initialForcedOffline ? 'offline' : 'online';
  const initialLastError: ServiceError | null = initialForceOffline
    ? { message: 'offline-stub' }
    : initialPortUnavailable
    ? { message: 'Service port is unavailable.' }
    : null;
  const [status, setStatus] = useState<ServiceStatus>(initialStatus);
  const [isPortUnavailable, setIsPortUnavailable] = useState(initialPortUnavailable);
  const [lastError, setLastError] = useState<ServiceError | null>(initialLastError);
  const lastLoggedTraceIdRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);
  const lastRetryTimestampRef = useRef(0);
  const skipPolling =
    isTestEnv ||
    forcedOfflineFlag ||
    options.stableHomeMode === true ||
    options.visualStableHome === true ||
    freezeServiceHealth;
  const intervalMs = useMemo(() => {
    if (typeof options.intervalMs === 'number') {
      return options.intervalMs;
    }
    if (options.visualStableHome) {
      return 0;
    }
    if (options.stableHomeMode) {
      return 0;
    }
    if (isPlaywright) {
      return 5_000;
    }
    return testEnv ? 0 : 15_000;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.intervalMs, testEnv, isPlaywright]);

  const initialReason = initialPortUnavailable
    ? 'service_port_unavailable'
    : initialForceOffline
    ? 'test-offline'
    : 'online';
  const initialServiceUnavailable = initialForcedOffline;
  const lastKnownStateRef = useRef({
    status: initialStatus,
    isPortUnavailable: initialPortUnavailable,
    reason: initialReason,
    serviceUnavailable: initialServiceUnavailable,
    lastError: initialLastError,
  });
  const testHardFreezeHealthRef = options.testHardFreezeHealthRef;
  const lastKnownForcedOfflineStateRef = useRef<UseServiceHealthResult | null>(null);

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
      if (isTestEnv || dominantOffline) {
        return;
      }
      if (!initialPortUnavailable && !dominantOffline) {
        setForceOffline(false);
      }
      setIsPortUnavailable(portIssue);
      setLastError(error ?? null);
      setStatus('offline');
    },
    [logFailure, mountedRef, setForceOffline, initialPortUnavailable, dominantOffline, isTestEnv],
  );

  const retry = useCallback(async () => {
    if (
      testHardFreezeHealthRef?.current ||
      isTestEnv ||
      dominantOffline ||
      options.stableHomeMode ||
      options.visualStableHome ||
      freezeServiceHealth
    ) {
      return;
    }
    const now = performance.now ? performance.now() : Date.now();
    if (
      skipPolling ||
      isCheckingRef.current ||
      (!testEnv && now - lastRetryTimestampRef.current < RETRY_THROTTLE_MS)
    ) {
      return;
    }

    if (forceOffline) {
      if (mountedRef.current) {
        setStatus('offline');
        setIsPortUnavailable(initialPortUnavailable || false);
        setLastError(initialLastError);
      }
      isCheckingRef.current = false;
      return;
    }

    lastRetryTimestampRef.current = now;
    if (mountedRef.current && !isPlaywright && !skipPolling) {
      setStatus('checking');
    }
    isCheckingRef.current = true;

    if (!services) {
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
          setForceOffline(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleFailure,
    services,
    mountedRef,
    setForceOffline,
    testEnv,
    forceOffline,
    isPlaywright,
    skipPolling,
    initialPortUnavailable,
    initialLastError,
    isTestEnv,
    dominantOffline,
    testHardFreezeHealthRef,
    freezeServiceHealth,
  ]);

  const forcedOfflineResult = useMemo(() => {
    const forced: UseServiceHealthResult = {
      status: 'offline',
      retry,
      isPortUnavailable: true,
      lastError: { message: 'Service port is unavailable.' },
      serviceUnavailable: true,
      reason: 'service_port_unavailable',
    };
    lastKnownForcedOfflineStateRef.current = forced;
    return forced;
  }, [retry]);

  useEffect(() => {
    if (skipPolling) {
      return () => {};
    }
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
  }, [intervalMs, retry, skipPolling]);

  useEffect(() => {
    if (options.stableHomeMode || options.visualStableHome) {
      return () => {};
    }
    if (typeof window === 'undefined') {
      return () => {};
    }
    const statusHandler = (event: Event) => {
      const customEvent = event as CustomEvent<'offline' | 'online'>;
      const detail = customEvent.detail;
      if (detail === 'online' || detail === 'offline') {
        setForceOffline(detail === 'offline');
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
      setForceOffline(detail.status === 'offline');
      if (detail.status === 'online') {
        setIsPortUnavailable(false);
        setLastError(null);
      } else {
        const portIssue = Boolean(detail.portUnavailable);
        setIsPortUnavailable(portIssue);
        if (portIssue) {
          setForceOffline(false);
        }
        if (detail.errorMessage) {
          setLastError({ message: detail.errorMessage });
        }
      }
    };
    window.addEventListener('test:service-status', statusHandler);
    window.addEventListener('test:service-health', healthHandler);
    const forceHandler = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      const detail = Boolean(customEvent.detail);
      setForceOffline(detail);
      if (!mountedRef.current) {
        return;
      }
      const nextStatus: ServiceStatus = detail ? 'offline' : 'online';
      setStatus(nextStatus);
      if (detail) {
        setIsPortUnavailable(false);
      } else {
        setIsPortUnavailable(false);
        setLastError(null);
      }
    };
    window.addEventListener('test:force-offline', forceHandler);
    if (typeof document !== 'undefined') {
      document.addEventListener('test:service-status', statusHandler);
      document.addEventListener('test:service-health', healthHandler);
      document.addEventListener('test:force-offline', forceHandler);
    }
    return () => {
      window.removeEventListener('test:service-status', statusHandler);
      window.removeEventListener('test:service-health', healthHandler);
      window.removeEventListener('test:force-offline', forceHandler);
  if (typeof document !== 'undefined') {
      document.removeEventListener('test:service-status', statusHandler);
      document.removeEventListener('test:service-health', healthHandler);
      document.removeEventListener('test:force-offline', forceHandler);
    }
  };
}, [mountedRef, setForceOffline, options.stableHomeMode, options.visualStableHome]);

  if (freezeServiceHealth) {
    const freezeForceOffline = forcedOfflineFlag;
    const freezeReasonKey = freezeForceOffline ? offlineReason ?? 'test-offline' : null;
    const freezeIsPortUnavailable = freezeReasonKey === 'service_port_unavailable';
    const freezeLastError: ServiceError | null = freezeForceOffline
      ? freezeIsPortUnavailable
        ? { message: 'Service port is unavailable.' }
        : { message: 'offline-stub' }
      : null;
    const freezeStatus: ServiceStatus = freezeForceOffline ? 'offline' : 'online';
    const freezeResult: UseServiceHealthResult = {
      status: freezeStatus,
      retry: noopRetry,
      isPortUnavailable: freezeIsPortUnavailable,
      lastError: freezeLastError,
      serviceUnavailable: freezeForceOffline,
      reason: freezeForceOffline ? freezeReasonKey : null,
    };
    lastKnownStateRef.current = {
      status: freezeStatus,
      isPortUnavailable: freezeIsPortUnavailable,
      reason: freezeForceOffline ? freezeReasonKey ?? 'test-offline' : 'online',
      serviceUnavailable: freezeForceOffline,
      lastError: freezeLastError,
    };
    return freezeResult;
  }

  const reason = isPortUnavailable
    ? 'service_port_unavailable'
    : forceOffline
    ? 'test-offline'
    : status;
  const serviceUnavailable = status === 'offline' || isPortUnavailable || forceOffline;
  lastKnownStateRef.current = {
    status,
    isPortUnavailable,
    reason,
    serviceUnavailable,
    lastError,
  };

  if (isTestEnv && testHardFreezeHealthRef?.current && forceOffline) {
    return lastKnownForcedOfflineStateRef.current ?? forcedOfflineResult;
  }

  if (dominantOffline && forceOffline) {
    const forcedReasonKey = offlineReason ?? 'test-offline';
    const forcedIsPortUnavailable = forcedReasonKey === 'service_port_unavailable';
    const forcedLastError: ServiceError = forcedIsPortUnavailable
      ? { message: 'Service port is unavailable.' }
      : { message: 'offline-stub' };
    return {
      status: 'offline',
      retry,
      isPortUnavailable: forcedIsPortUnavailable,
      lastError: forcedLastError,
      serviceUnavailable: true,
      reason: forcedReasonKey,
    };
  }

  if (isTestEnv) {
    const fallback = lastKnownStateRef.current;
    return {
      status: fallback.status,
      retry,
      isPortUnavailable: fallback.isPortUnavailable,
      lastError: fallback.lastError,
      serviceUnavailable: fallback.serviceUnavailable,
      reason: fallback.reason,
    };
  }

  return { status, retry, isPortUnavailable, lastError, serviceUnavailable, reason };
}

export default useServiceHealth;
