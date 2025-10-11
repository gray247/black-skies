import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type {
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import {
  evaluateReopenRequest,
  openDiagnostics,
  performRestoreSnapshot,
  resolveReopenConsumption,
  validateDiagnostics,
  validateRestoreSnapshot,
} from '../recovery/actions';
import type { ToastPayload } from '../types/toast';
import type { ServiceStatus } from '../components/ServiceStatusPill';
import type ProjectSummary from '../types/project';

type RecoveryActionState = 'idle' | 'restore' | 'diagnostics';

interface UseRecoveryOptions {
  services: ServicesBridge | undefined;
  diagnostics: DiagnosticsBridge | undefined;
  serviceStatus: ServiceStatus;
  projectSummary: ProjectSummary | null;
  pushToast: (toast: ToastPayload) => void;
  isMountedRef: MutableRefObject<boolean>;
}

interface ReopenEvent {
  requestId: number;
  status: 'success' | 'error';
}

export function useRecovery({
  services,
  diagnostics,
  serviceStatus,
  projectSummary,
  pushToast,
  isMountedRef,
}: UseRecoveryOptions) {
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatusBridgeResponse | null>(null);
  const [recoveryAction, setRecoveryAction] = useState<RecoveryActionState>('idle');
  const [reopenInFlight, setReopenInFlight] = useState(false);
  const [lastProjectPath, setLastProjectPath] = useState<string | null>(null);
  const [reopenRequest, setReopenRequest] = useState<{ path: string; requestId: number } | null>(null);

  const reopenCounterRef = useRef(0);
  const reopenReleaseTimeoutRef = useRef<number | null>(null);
  const lastRecoveryProjectIdRef = useRef<string | null>(null);
  const recoveryFetchInFlightRef = useRef(false);

  const resetRecovery = useCallback(() => {
    setRecoveryStatus(null);
    setRecoveryAction('idle');
    setReopenInFlight(false);
    setReopenRequest(null);
    setLastProjectPath(null);
    reopenCounterRef.current = 0;
    lastRecoveryProjectIdRef.current = null;
  }, []);

  const fetchRecoveryStatus = useCallback(
    async (projectId: string) => {
      if (!services) {
        setRecoveryStatus(null);
        lastRecoveryProjectIdRef.current = null;
        return;
      }

      try {
        recoveryFetchInFlightRef.current = true;
        lastRecoveryProjectIdRef.current = projectId;
        const result = await services.getRecoveryStatus({ projectId });
        if (!isMountedRef.current) {
          return;
        }
        if (result.ok) {
          setRecoveryStatus(result.data);
        } else {
          setRecoveryStatus(null);
          lastRecoveryProjectIdRef.current = null;
          pushToast({
            tone: 'warning',
            title: 'Recovery status unavailable',
            description: result.error.message,
            traceId: result.traceId ?? result.error.traceId,
          });
        }
      } catch (error) {
        console.error('[useRecovery] Failed to fetch recovery status', error);
        if (isMountedRef.current) {
          setRecoveryStatus(null);
          lastRecoveryProjectIdRef.current = null;
          pushToast({
            tone: 'error',
            title: 'Recovery check failed',
            description: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        recoveryFetchInFlightRef.current = false;
      }
    },
    [isMountedRef, pushToast, services],
  );

  const handleRestoreSnapshot = useCallback(async () => {
    const validation = validateRestoreSnapshot({ services, projectSummary });
    if (!validation.canProceed) {
      if (validation.toast) {
        pushToast(validation.toast);
      }
      return;
    }

    if (!validation.input) {
      return;
    }

    setRecoveryAction('restore');
    try {
      const result = await performRestoreSnapshot(validation.input);
      pushToast(result.toast);
      if (result.ok && result.recoveryStatus) {
        setRecoveryStatus(result.recoveryStatus);
      }
    } catch (error) {
      console.error('[useRecovery] Snapshot restore failed', error);
      pushToast({
        tone: 'error',
        title: 'Restore failed',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRecoveryAction('idle');
    }
  }, [projectSummary, pushToast, services]);

  const handleOpenDiagnostics = useCallback(async () => {
    const validation = validateDiagnostics({ diagnostics });
    if (!validation.canProceed) {
      if (validation.toast) {
        pushToast(validation.toast);
      }
      return;
    }

    if (!validation.input) {
      return;
    }

    setRecoveryAction('diagnostics');
    try {
      const result = await openDiagnostics(validation.input);
      if (result.toast) {
        pushToast(result.toast);
      }
    } finally {
      setRecoveryAction('idle');
    }
  }, [diagnostics, pushToast]);

  const handleReopenLastProject = useCallback(() => {
    const nextId = reopenCounterRef.current + 1;
    const evaluation = evaluateReopenRequest({
      lastProjectPath,
      reopenInFlight,
      recoveryAction,
      nextRequestId: nextId,
    });
    if (!evaluation.canProceed) {
      if (evaluation.toast) {
        pushToast(evaluation.toast);
      }
      return;
    }

    if (!evaluation.input) {
      return;
    }

    reopenCounterRef.current = nextId;
    setReopenInFlight(true);
    setReopenRequest(evaluation.input.request);
  }, [lastProjectPath, pushToast, recoveryAction, reopenInFlight]);

  const handleReopenConsumed = useCallback(
    ({ requestId, status }: ReopenEvent) => {
      setReopenRequest((previous) => {
        const currentRequestId = previous?.requestId ?? null;
        const resolution = resolveReopenConsumption({
          currentRequestId,
          event: { requestId, status },
        });

        if (resolution.toast) {
          pushToast(resolution.toast);
        }

        if (!resolution.matched) {
          return previous;
        }

        if (reopenReleaseTimeoutRef.current !== null) {
          window.clearTimeout(reopenReleaseTimeoutRef.current);
        }

        reopenReleaseTimeoutRef.current = window.setTimeout(() => {
          reopenReleaseTimeoutRef.current = null;
          if (!isMountedRef.current) {
            return;
          }
          if (resolution.shouldClear) {
            setReopenInFlight(false);
          }
        }, 0);

        return resolution.shouldClear ? null : previous;
      });
    },
    [isMountedRef, pushToast],
  );

  useEffect(() => {
    return () => {
      if (reopenReleaseTimeoutRef.current !== null) {
        window.clearTimeout(reopenReleaseTimeoutRef.current);
        reopenReleaseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (serviceStatus === 'offline') {
      lastRecoveryProjectIdRef.current = null;
      return;
    }

    if (serviceStatus !== 'online' || !projectSummary) {
      return;
    }

    const projectId = projectSummary.projectId;
    if (recoveryFetchInFlightRef.current) {
      return;
    }

    if (lastRecoveryProjectIdRef.current === projectId) {
      return;
    }

    void fetchRecoveryStatus(projectId);
  }, [fetchRecoveryStatus, projectSummary, serviceStatus]);

  return {
    recoveryStatus,
    recoveryAction,
    reopenInFlight,
    lastProjectPath,
    reopenRequest,
    setRecoveryStatus,
    setLastProjectPath,
    fetchRecoveryStatus,
    handleRestoreSnapshot,
    handleOpenDiagnostics,
    handleReopenLastProject,
    handleReopenConsumed,
    resetRecovery,
  };
}

export type UseRecoveryResult = ReturnType<typeof useRecovery>;

export default useRecovery;
