import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ProjectHome, {
  type ProjectLoadEvent,
} from './components/ProjectHome';
import ServiceStatusPill, {
  type ServiceStatus,
} from './components/ServiceStatusPill';
import WizardPanel from './components/WizardPanel';
import { PreflightModal } from './components/PreflightModal';
import { ToastStack } from './components/ToastStack';
import type { ToastInstance, ToastPayload } from './types/toast';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type { DiagnosticsBridge } from '../shared/ipc/diagnostics';
import type {
  DraftPreflightEstimate,
  DraftUnitScope,
  ServicesBridge,
  RecoveryStatusBridgeResponse,
} from '../shared/ipc/services';

interface ProjectSummary {
  projectId: string;
  path: string;
  unitScope: DraftUnitScope;
  unitIds: string[];
}

interface PreflightState {
  open: boolean;
  loading: boolean;
  error: string | null;
  errorDetails: unknown | null;
  estimate?: DraftPreflightEstimate;
}

function deriveProjectIdFromPath(path: string): string {
  const segments = path.split(/[\\/]+/).filter(Boolean);
  const base = segments.at(-1);
  if (base && base.length > 0) {
    return base;
  }
  return path;
}

export default function App(): JSX.Element {
  const services: ServicesBridge | undefined = window.services;
  const diagnostics: DiagnosticsBridge | undefined = window.diagnostics;

  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const counterRef = useRef(0);
  const isMountedRef = useRef(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatusBridgeResponse | null>(null);
  const [recoveryAction, setRecoveryAction] = useState<'idle' | 'restore' | 'diagnostics'>(
    'idle',
  );
  const [reopenInFlight, setReopenInFlight] = useState(false);
  const [lastProjectPath, setLastProjectPath] = useState<string | null>(null);
  const [reopenRequest, setReopenRequest] = useState<{ path: string; requestId: number } | null>(
    null,
  );
  const reopenCounterRef = useRef(0);
  const reopenReleaseTimeoutRef = useRef<number | null>(null);
  const [preflightState, setPreflightState] = useState<PreflightState>({
    open: false,
    loading: false,
    error: null,
    errorDetails: null,
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (reopenReleaseTimeoutRef.current !== null) {
        window.clearTimeout(reopenReleaseTimeoutRef.current);
        reopenReleaseTimeoutRef.current = null;
      }
    };
  }, []);

  const setServiceStatusSafe = useCallback((status: ServiceStatus) => {
    if (isMountedRef.current) {
      setServiceStatus(status);
    }
  }, []);

  const checkServices = useCallback(async () => {
    if (!services) {
      console.error('[App] Services bridge unavailable; project actions disabled');
      setServiceStatusSafe('offline');
      return;
    }

    setServiceStatusSafe('checking');

    try {
      const result = await services.checkHealth();
      if (!result.ok) {
        console.warn('[App] Service health check failed', result.error);
      }
      setServiceStatusSafe(result.ok ? 'online' : 'offline');
    } catch (error) {
      console.error('[App] Health probe threw an error', error);
      setServiceStatusSafe('offline');
    }
  }, [services, setServiceStatusSafe]);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (!cancelled) {
        await checkServices();
      }
    };

    void run();

    const intervalId = window.setInterval(() => {
      void run();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [checkServices]);

  const pushToast = useCallback((payload: ToastPayload) => {
    counterRef.current += 1;
    const id = `${payload.tone}-${Date.now()}-${counterRef.current}`;
    const toast: ToastInstance = {
      ...payload,
      id,
      createdAt: Date.now(),
    };
    setToasts((previous) => [...previous, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const fetchRecoveryStatus = useCallback(
    async (projectId: string) => {
      if (!services) {
        setRecoveryStatus(null);
        return;
      }

      try {
        const result = await services.getRecoveryStatus({ projectId });
        if (result.ok) {
          setRecoveryStatus(result.data);
        } else {
          setRecoveryStatus(null);
          pushToast({
            tone: 'warning',
            title: 'Recovery status unavailable',
            description: result.error.message,
          });
        }
      } catch (error) {
        console.error('[App] Failed to fetch recovery status', error);
        setRecoveryStatus(null);
        pushToast({
          tone: 'error',
          title: 'Recovery check failed',
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [services, pushToast],
  );

  const activateProject = useCallback(
    (project: LoadedProject) => {
      const projectId = deriveProjectIdFromPath(project.path);
      const unitIds = project.scenes.map((scene) => scene.id);
      setProjectSummary({
        projectId,
        path: project.path,
        unitScope: 'scene',
        unitIds,
      });
      void fetchRecoveryStatus(projectId);
    },
    [fetchRecoveryStatus],
  );

  const handleProjectLoaded = useCallback(
    (payload: ProjectLoadEvent | LoadedProject | null | undefined) => {
      if (!payload) {
        setProjectSummary(null);
        setRecoveryStatus(null);
        return;
      }

      if ('status' in payload) {
        const { status, project, lastOpenedPath } = payload;
        setLastProjectPath(lastOpenedPath);

        if ((status === 'loaded' || status === 'init') && project) {
          activateProject(project);
          return;
        }

        if (status === 'failed' || status === 'cleared') {
          setProjectSummary(null);
          setRecoveryStatus(null);
          return;
        }

        if (project) {
          activateProject(project);
          return;
        }

        setProjectSummary(null);
        setRecoveryStatus(null);
        return;
      }

      const legacyProject = payload;
      setLastProjectPath(legacyProject.path);
      activateProject(legacyProject);
    },
    [activateProject],
  );

  const handleRestoreSnapshot = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Cannot restore snapshots while services are offline.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Select a project to restore its latest snapshot.',
      });
      return;
    }

    setRecoveryAction('restore');
    try {
      const result = await services.restoreSnapshot({ projectId: projectSummary.projectId });
      if (result.ok) {
        setRecoveryStatus(result.data);
        pushToast({
          tone: 'success',
          title: 'Snapshot restored',
          description: 'Latest snapshot restored successfully.',
        });
      } else {
        pushToast({
          tone: 'error',
          title: 'Restore failed',
          description: result.error.message,
        });
      }
    } catch (error) {
      console.error('[App] Snapshot restore failed', error);
      pushToast({
        tone: 'error',
        title: 'Restore failed',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRecoveryAction('idle');
    }
  }, [services, projectSummary, pushToast]);

  const handleReopenLastProject = useCallback(() => {
    if (recoveryAction !== 'idle' || reopenInFlight) {
      return;
    }
    if (!lastProjectPath) {
      pushToast({
        tone: 'warning',
        title: 'No project to reopen',
        description: 'Open a project before trying to reopen it.',
      });
      return;
    }

    reopenCounterRef.current += 1;
    setReopenInFlight(true);
    setReopenRequest({ path: lastProjectPath, requestId: reopenCounterRef.current });
  }, [lastProjectPath, pushToast, recoveryAction, reopenInFlight]);

  const handleReopenConsumed = useCallback(
    ({ requestId, status }: { requestId: number; status: 'success' | 'error' }) => {
      let matched = false;
      setReopenRequest((previous) => {
        matched = previous?.requestId === requestId;
        return matched ? null : previous;
      });

      if (reopenReleaseTimeoutRef.current !== null) {
        window.clearTimeout(reopenReleaseTimeoutRef.current);
      }

      reopenReleaseTimeoutRef.current = window.setTimeout(() => {
        reopenReleaseTimeoutRef.current = null;
        if (!isMountedRef.current || !matched) {
          return;
        }
        setReopenInFlight(false);
      }, 0);

      if (matched && status === 'error') {
        pushToast({
          tone: 'error',
          title: 'Reopen failed',
          description: 'Unable to reopen the most recent project.',
        });
      }
    },
    [pushToast],
  );

  const handleOpenDiagnostics = useCallback(async () => {
    if (!diagnostics) {
      pushToast({
        tone: 'error',
        title: 'Diagnostics unavailable',
        description: 'Electron bridge is offline; cannot open diagnostics.',
      });
      return;
    }

    setRecoveryAction('diagnostics');
    try {
      const result = await diagnostics.openDiagnosticsFolder();
      if (!result.ok) {
        pushToast({
          tone: 'error',
          title: 'Diagnostics folder unavailable',
          description: result.error,
        });
      }
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Diagnostics open failed',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRecoveryAction('idle');
    }
  }, [diagnostics, pushToast]);

  const handleOpenPreflight = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Cannot connect to the local drafting service; preflight aborted.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Select a project before requesting generation.',
      });
      return;
    }

    setPreflightState({
      open: true,
      loading: true,
      error: null,
      errorDetails: null,
      estimate: undefined,
    });
    const result = await services.preflightDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      setPreflightState({
        open: true,
        loading: false,
        error: null,
        errorDetails: null,
        estimate: result.data,
      });
    } else {
      setPreflightState({
        open: true,
        loading: false,
        error: result.error.message,
        errorDetails: result.error.details ?? null,
        estimate: undefined,
      });
    }
  }, [projectSummary, pushToast, services]);

  const handleClosePreflight = useCallback(() => {
    setPreflightState((previous) => ({ ...previous, open: false }));
  }, []);

  const handlePreflightProceed = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Cannot generate drafts while services are offline.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Select a project before running generation.',
      });
      return;
    }

    setPreflightState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      errorDetails: null,
    }));

    const result = await services.generateDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      setPreflightState({
        open: false,
        loading: false,
        error: null,
        errorDetails: null,
        estimate: undefined,
      });
      pushToast({
        tone: 'success',
        title: 'Draft generation requested',
        description: `Draft ${result.data.draft_id} queued with ${result.data.units.length} unit(s).`,
      });
    } else {
      setPreflightState((previous) => ({
        ...previous,
        loading: false,
        error: result.error.message,
        errorDetails: result.error.details ?? null,
      }));
    }
  }, [projectSummary, pushToast, services]);

  const handleOutlineReady = useCallback(
    (projectId: string) => {
      pushToast({
        tone: 'info',
        title: 'Outline updated',
        description: `Latest outline written for project ${projectId}.`,
      });
      setProjectSummary((previous) => {
        if (!previous) {
          return previous;
        }
        return { ...previous, projectId };
      });
    },
    [pushToast],
  );

  const preflightEstimate = preflightState.estimate;
  const preflightError = preflightState.error;
  const preflightErrorDetails = preflightState.errorDetails;

  const projectLabel = useMemo(() => projectSummary?.path ?? 'No project loaded', [projectSummary]);
  const recoverySnapshot = recoveryStatus?.last_snapshot ?? null;
  const recoveryBannerVisible = recoveryStatus?.needs_recovery ?? false;
  const recoveryBusy = recoveryAction !== 'idle';
  const reopenBusy = reopenInFlight;
  const restoreDisabled = recoveryBusy || reopenBusy;
  const reopenDisabled = restoreDisabled || !lastProjectPath;
  const diagnosticsDisabled = recoveryBusy || reopenBusy;
  const restoreLabel = recoveryAction === 'restore' ? 'Restoring…' : 'Restore snapshot';

  useEffect(() => {
    if (serviceStatus === 'online' && projectSummary) {
      void fetchRecoveryStatus(projectSummary.projectId);
    }
  }, [serviceStatus, projectSummary, fetchRecoveryStatus]);

  return (
    <div className="app-shell">
      <aside className="app-shell__dock" aria-label="Wizard dock">
        <div className="app-shell__dock-header">
          <h1>Black Skies</h1>
          <p>Wizard steps</p>
        </div>
        <WizardPanel services={services} onToast={pushToast} onOutlineReady={handleOutlineReady} />
      </aside>

      <div className="app-shell__workspace">
        <header className="app-shell__workspace-header">
          <div>
            <span className="app-shell__workspace-title">Project console</span>
            <p className="app-shell__workspace-subtitle">{projectLabel}</p>
          </div>
          <div className="app-shell__workspace-actions">
            <ServiceStatusPill status={serviceStatus} onRetry={checkServices} />
            <button
              type="button"
              className="app-shell__workspace-button"
              disabled={serviceStatus !== 'online'}
              onClick={() => void handleOpenPreflight()}
            >
              Generate
            </button>
            <button
              type="button"
              className="app-shell__workspace-button"
              disabled={serviceStatus !== 'online'}
              onClick={() =>
                pushToast({
                  tone: 'warning',
                  title: 'Critique not wired yet',
                  description: 'TODO: Hook the critique flow once endpoints are exposed.',
                })
              }
            >
              Critique
            </button>
            {/* TODO(P2_ACCEPT_PLAN Task 1 & 2): Replace the placeholder toast with the real critique + accept/reject UX once */}
            {/* docs/P2_ACCEPT_PLAN.md tasks are implemented across the renderer bridge. */}
          </div>
        </header>
        <main className="app-shell__workspace-body">
          <div className="app-shell__workspace-scroll">
            {recoveryBannerVisible ? (
              <div className="app-shell__recovery-banner" role="alert">
                <div className="app-shell__recovery-banner__content">
                  <strong>Crash recovery available.</strong>
                  {recoverySnapshot ? (
                    <span>
                      {' '}
                      Snapshot {recoverySnapshot.label || recoverySnapshot.snapshot_id} captured at{' '}
                      {recoverySnapshot.created_at}.
                    </span>
                  ) : (
                    <span> Restore the latest snapshot to resume work.</span>
                  )}
                </div>
                <div className="app-shell__recovery-banner__actions">
                  <button
                    type="button"
                    className="app-shell__recovery-banner__button"
                    disabled={restoreDisabled}
                    onClick={() => void handleRestoreSnapshot()}
                  >
                    {restoreLabel}
                  </button>
                  <button
                    type="button"
                    className="app-shell__recovery-banner__button"
                    disabled={reopenDisabled}
                    onClick={handleReopenLastProject}
                  >
                    Reopen last project
                  </button>
                  <button
                    type="button"
                    className="app-shell__recovery-banner__button"
                    disabled={diagnosticsDisabled}
                    onClick={() => void handleOpenDiagnostics()}
                  >
                    View diagnostics
                  </button>
                </div>
              </div>
            ) : null}
            <ProjectHome
              onToast={pushToast}
              onProjectLoaded={handleProjectLoaded}
              reopenRequest={reopenRequest}
              onReopenConsumed={handleReopenConsumed}
            />
          </div>
        </main>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <PreflightModal
        isOpen={preflightState.open}
        loading={preflightState.loading}
        error={preflightError}
        errorDetails={preflightErrorDetails}
        estimate={preflightEstimate}
        onClose={handleClosePreflight}
        onProceed={handlePreflightProceed}
      />
    </div>
  );
}
