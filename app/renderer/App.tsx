import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ProjectHome from './components/ProjectHome';
import ServiceStatusPill, {
  type ServiceStatus,
} from './components/ServiceStatusPill';
import WizardPanel from './components/WizardPanel';
import { PreflightModal } from './components/PreflightModal';
import { ToastStack } from './components/ToastStack';
import type { ToastInstance, ToastPayload } from './types/toast';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type {
  DraftPreflightEstimate,
  DraftUnitScope,
  ServicesBridge,
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
  estimate?: DraftPreflightEstimate;
}

function deriveProjectIdFromPath(path: string): string {
  const segments = path.split(/[\\/]+/).filter(Boolean);
  const base = segments.at(-1) ?? path;
  return base.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '').toLowerCase();
}

export default function App(): JSX.Element {
  const services: ServicesBridge | undefined = window.services;

  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const counterRef = useRef(0);
  const isMountedRef = useRef(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [preflightState, setPreflightState] = useState<PreflightState>({
    open: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
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

  const handleProjectLoaded = useCallback((project: LoadedProject | null) => {
    if (!project) {
      setProjectSummary(null);
      return;
    }
    const projectId = deriveProjectIdFromPath(project.path);
    const unitIds = project.scenes.map((scene) => scene.id);
    setProjectSummary({
      projectId,
      path: project.path,
      unitScope: 'scene',
      unitIds,
    });
  }, []);

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

    setPreflightState({ open: true, loading: true, error: null, estimate: undefined });
    const result = await services.preflightDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      setPreflightState({ open: true, loading: false, error: null, estimate: result.data });
    } else {
      setPreflightState({
        open: true,
        loading: false,
        error: result.error.message,
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

    setPreflightState((previous) => ({ ...previous, loading: true, error: null }));

    const result = await services.generateDraft({
      projectId: projectSummary.projectId,
      unitScope: projectSummary.unitScope,
      unitIds: projectSummary.unitIds,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (result.ok) {
      setPreflightState({ open: false, loading: false, error: null, estimate: undefined });
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

  const projectLabel = useMemo(() => projectSummary?.path ?? 'No project loaded', [projectSummary]);

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
          </div>
        </header>
        <main className="app-shell__workspace-body">
          <ProjectHome onToast={pushToast} onProjectLoaded={handleProjectLoaded} />
        </main>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <PreflightModal
        isOpen={preflightState.open}
        loading={preflightState.loading}
        error={preflightError}
        estimate={preflightEstimate}
        onClose={handleClosePreflight}
        onProceed={handlePreflightProceed}
      />
    </div>
  );
}
