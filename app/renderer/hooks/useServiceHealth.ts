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
  retry: (background?: boolean) => Promise<void>;
  isPortUnavailable: boolean;
  lastError: ServiceError | null;
  serviceUnavailable: boolean;
  reason: string | null;
}

interface LastKnownServiceState {
  status: ServiceStatus;
  isPortUnavailable: boolean;
  reason: string | null;
  serviceUnavailable: boolean;
  lastError: ServiceError | null;
  forceOffline: boolean;
}

declare global {
  interface Window {
    __testEnv?: { isPlaywright?: boolean };
    __restoreOperationInProgress?: boolean;
  }
}

const windowWithTestEnv =
  typeof window !== 'undefined'
    ? (window as Window & { __testEnv?: { isPlaywright?: boolean } })
    : undefined;
const windowWithRestoreFlag =
  typeof window !== 'undefined'
    ? (window as Window & { __restoreOperationInProgress?: boolean })
    : undefined;

const RETRY_THROTTLE_MS = 1_000;

function getServiceErrorSignature(error: ServiceError | null): string | null {
  if (!error) {
    return null;
  }
  return JSON.stringify({
    message: error.message ?? '',
    code: error.code ?? null,
    traceId: error.traceId ?? null,
    details: error.details ?? null,
  });
}

function areServiceHealthSnapshotsEqual(
  left: {
    status: ServiceStatus;
    isPortUnavailable: boolean;
    forceOffline: boolean;
    lastError: ServiceError | null;
  },
  right: {
    status: ServiceStatus;
    isPortUnavailable: boolean;
    forceOffline: boolean;
    lastError: ServiceError | null;
  },
): boolean {
  return (
    left.status === right.status &&
    left.isPortUnavailable === right.isPortUnavailable &&
    left.forceOffline === right.forceOffline &&
    getServiceErrorSignature(left.lastError) === getServiceErrorSignature(right.lastError)
  );
}

function isPortUnavailableError(error?: ServiceError | null): boolean {
  if (!error || typeof error.message !== 'string') {
    return false;
  }
  return (
    error.message.includes('Service port is unavailable') ||
    error.message.includes('Backend service port is unavailable')
  );
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
    ? { message: 'Backend service port is unavailable.' }
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
  const lastKnownStateRef = useRef<LastKnownServiceState>({
    status: initialStatus,
    isPortUnavailable: initialPortUnavailable,
    reason: initialReason,
    serviceUnavailable: initialServiceUnavailable,
    lastError: initialLastError,
    forceOffline: initialForcedOffline,
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

  const commitHealthSnapshot = useCallback(
    (nextState: {
      status: ServiceStatus;
      isPortUnavailable: boolean;
      forceOffline: boolean;
      lastError: ServiceError | null;
    }) => {
      const previousState = lastKnownStateRef.current;
      if (
        areServiceHealthSnapshotsEqual(previousState, nextState) &&
        previousState.reason ===
          (nextState.isPortUnavailable
            ? 'service_port_unavailable'
            : nextState.forceOffline
              ? 'test-offline'
              : nextState.status) &&
        previousState.serviceUnavailable ===
          (nextState.status === 'offline' || nextState.isPortUnavailable || nextState.forceOffline)
      ) {
        return false;
      }

      const reason = nextState.isPortUnavailable
        ? 'service_port_unavailable'
        : nextState.forceOffline
          ? 'test-offline'
          : nextState.status;
      const serviceUnavailable =
        nextState.status === 'offline' || nextState.isPortUnavailable || nextState.forceOffline;
      lastKnownStateRef.current = {
        status: nextState.status,
        isPortUnavailable: nextState.isPortUnavailable,
        reason,
        serviceUnavailable,
        lastError: nextState.lastError,
        forceOffline: nextState.forceOffline,
      };
      if (!mountedRef.current) {
        return true;
      }
      if (previousState.status !== nextState.status) {
        setStatus(nextState.status);
      }
      if (previousState.isPortUnavailable !== nextState.isPortUnavailable) {
        setIsPortUnavailable(nextState.isPortUnavailable);
      }
      if (previousState.forceOffline !== nextState.forceOffline) {
        setForceOffline(nextState.forceOffline);
      }
      if (getServiceErrorSignature(previousState.lastError) !== getServiceErrorSignature(nextState.lastError)) {
        setLastError(nextState.lastError);
      }
      return true;
    },
    [mountedRef],
  );

  const handleFailure = useCallback(
    (error?: ServiceError | null, portIssue = false) => {
      if (!mountedRef.current) {
        return;
      }
      if (dominantOffline) {
        return;
      }
      if (windowWithRestoreFlag?.__restoreOperationInProgress === true) {
        return;
      }
      logFailure(error);
      const nextForceOffline = initialPortUnavailable ? true : false;
      void commitHealthSnapshot({
        status: 'offline',
        isPortUnavailable: portIssue,
        forceOffline: nextForceOffline,
        lastError: error ?? null,
      });
    },
    [logFailure, mountedRef, dominantOffline, initialPortUnavailable, commitHealthSnapshot],
  );

  const retry = useCallback(async (background = false) => {
    if (
      testHardFreezeHealthRef?.current ||
      dominantOffline ||
      options.stableHomeMode ||
      options.visualStableHome ||
      freezeServiceHealth
    ) {
      return;
    }
    const now = performance.now ? performance.now() : Date.now();
    if (
      isCheckingRef.current ||
      (!testEnv && now - lastRetryTimestampRef.current < RETRY_THROTTLE_MS)
    ) {
      return;
    }

    if (forceOffline) {
      if (mountedRef.current) {
        void commitHealthSnapshot({
          status: 'offline',
          isPortUnavailable: initialPortUnavailable || false,
          forceOffline: true,
          lastError: initialLastError,
        });
      }
      isCheckingRef.current = false;
      return;
    }

    lastRetryTimestampRef.current = now;
    if (!background && mountedRef.current && !isPlaywright && !skipPolling) {
      setStatus('checking');
      lastKnownStateRef.current = {
        ...lastKnownStateRef.current,
        status: 'checking',
        serviceUnavailable: true,
      };
    }
    isCheckingRef.current = true;

    if (!services) {
      handleFailure(
        {
          message: 'Backend services bridge unavailable; project actions disabled',
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
        void commitHealthSnapshot({
          status: 'online',
          isPortUnavailable: false,
          forceOffline: false,
          lastError: null,
        });
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
      lastError: { message: 'Backend service port is unavailable.' },
      serviceUnavailable: true,
      reason: 'service_port_unavailable',
    };
    lastKnownForcedOfflineStateRef.current = forced;
    return forced;
  }, [retry]);

  useEffect(() => {
    let cancelled = false;
    void retry(true);

    if (skipPolling) {
      return () => {
        cancelled = true;
      };
    }

    if (intervalMs <= 0) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setInterval(() => {
      if (!cancelled) {
        void retry(true);
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
        void commitHealthSnapshot({
          status: detail,
          isPortUnavailable: detail === 'offline' ? lastKnownStateRef.current.isPortUnavailable : false,
          forceOffline: detail === 'offline',
          lastError: detail === 'online' ? null : lastKnownStateRef.current.lastError,
        });
      }
    };

    const healthHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        status?: ServiceStatus;
        portUnavailable?: boolean;
        errorMessage?: string;
      }>;
      const detail = customEvent.detail;
      const detailStatus = detail?.status as string | undefined;
      const normalizedStatus = detailStatus === 'ok' ? 'online' : detailStatus;
      if (normalizedStatus !== 'online' && normalizedStatus !== 'offline') {
        return;
      }
      void commitHealthSnapshot({
        status: normalizedStatus,
        isPortUnavailable:
          normalizedStatus === 'offline' ? Boolean(detail?.portUnavailable) : false,
        forceOffline: normalizedStatus === 'offline',
        lastError:
          normalizedStatus === 'online'
            ? null
            : detail?.errorMessage
              ? { message: detail.errorMessage }
              : lastKnownStateRef.current.lastError,
      });
    };

    const forceHandler = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      const detail = Boolean(customEvent.detail);
      void commitHealthSnapshot({
        status: detail ? 'offline' : 'online',
        isPortUnavailable: false,
        forceOffline: detail,
        lastError: detail ? lastKnownStateRef.current.lastError : null,
      });
    };

    window.addEventListener('test:service-status', statusHandler);
    window.addEventListener('test:service-health', healthHandler);
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
  }, [commitHealthSnapshot, options.stableHomeMode, options.visualStableHome]);

  if (freezeServiceHealth) {
    const freezeForceOffline = forcedOfflineFlag;
    const freezeReasonKey = freezeForceOffline ? offlineReason ?? 'test-offline' : null;
    const freezeIsPortUnavailable = freezeReasonKey === 'service_port_unavailable';
    const freezeLastError: ServiceError | null = freezeForceOffline
      ? freezeIsPortUnavailable
        ? { message: 'Backend service port is unavailable.' }
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
      forceOffline: freezeForceOffline,
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
    forceOffline,
  };

  if (isTestEnv && testHardFreezeHealthRef?.current && forceOffline) {
    return lastKnownForcedOfflineStateRef.current ?? forcedOfflineResult;
  }

  if (dominantOffline && forceOffline) {
    const forcedReasonKey = offlineReason ?? 'test-offline';
    const forcedIsPortUnavailable = forcedReasonKey === 'service_port_unavailable';
    const forcedLastError: ServiceError = forcedIsPortUnavailable
      ? { message: 'Backend service port is unavailable.' }
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
