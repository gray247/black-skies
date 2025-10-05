import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import ProjectHome, {
  type ActiveScenePayload,
  type ProjectLoadEvent,
} from './components/ProjectHome';
import ServiceStatusPill, {
  type ServiceStatus,
} from './components/ServiceStatusPill';
import WizardPanel from './components/WizardPanel';
import { PreflightModal } from './components/PreflightModal';
import { CritiqueModal } from './components/CritiqueModal';
import { ToastStack } from './components/ToastStack';
import type { ToastInstance, ToastPayload } from './types/toast';
import type { LoadedProject } from '../shared/ipc/projectLoader';
import type { DiagnosticsBridge } from '../shared/ipc/diagnostics';
import type {
  DraftPreflightEstimate,
  DraftUnitScope,
  ServicesBridge,
  DraftCritiqueBridgeResponse,
  DraftAcceptBridgeResponse,
  RecoveryStatusBridgeResponse,
} from '../shared/ipc/services';
import {
  evaluateReopenRequest,
  openDiagnostics,
  performRestoreSnapshot,
  resolveReopenConsumption,
  validateDiagnostics,
  validateRestoreSnapshot,
} from './recovery/actions';

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

const DEFAULT_CRITIQUE_RUBRIC = ['continuity', 'pacing', 'voice'];

interface CritiqueDialogState {
  open: boolean;
  loading: boolean;
  error: string | null;
  data: DraftCritiqueBridgeResponse | null;
  traceId?: string;
  draftId: string | null;
  unitId: string | null;
  accepting: boolean;
}

function createInitialCritiqueState(): CritiqueDialogState {
  return {
    open: false,
    loading: false,
    error: null,
    data: null,
    traceId: undefined,
    draftId: null,
    unitId: null,
    accepting: false,
  };
}

function generateDraftId(seed: string): string {
  const sanitized = seed.toLowerCase().replace(/[^a-z0-9]/g, '').slice(-6) || 'scene';
  const timestamp = Date.now().toString(16);
  const entropy = Math.random().toString(16).slice(2, 8);
  return `dr_${sanitized}_${timestamp}_${entropy}`;
}

async function computeSha256(value: string): Promise<string> {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle) {
    throw new Error('Secure hashing APIs are unavailable in this environment.');
  }
  const normalized = value.replace(/\r\n/g, '\n');
  const encoder = new TextEncoder();
  const bytes = encoder.encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default function App(): JSX.Element {
  const services: ServicesBridge | undefined = window.services;
  const diagnostics: DiagnosticsBridge | undefined = window.diagnostics;

  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const counterRef = useRef(0);
  const isMountedRef = useRef(true);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>('checking');
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [currentProject, setCurrentProject] = useState<LoadedProject | null>(null);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [activeScene, setActiveScene] = useState<{ id: string; title: string | null } | null>(
    null,
  );
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
  const [critiqueState, setCritiqueState] = useState<CritiqueDialogState>(createInitialCritiqueState);
  const lastRecoveryProjectIdRef = useRef<string | null>(null);
  const recoveryFetchInFlightRef = useRef(false);

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

  const resetProjectState = useCallback(() => {
    setCurrentProject(null);
    setProjectDrafts({});
    setDraftEdits({});
    setActiveScene(null);
    setCritiqueState(createInitialCritiqueState());
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
        lastRecoveryProjectIdRef.current = null;
        return;
      }

      try {
        recoveryFetchInFlightRef.current = true;
        lastRecoveryProjectIdRef.current = projectId;
        const result = await services.getRecoveryStatus({ projectId });
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
        console.error('[App] Failed to fetch recovery status', error);
        setRecoveryStatus(null);
        lastRecoveryProjectIdRef.current = null;
        pushToast({
          tone: 'error',
          title: 'Recovery check failed',
          description: error instanceof Error ? error.message : String(error),
        });
      } finally {
        recoveryFetchInFlightRef.current = false;
      }
    },
    [services, pushToast],
  );

  const activateProject = useCallback(
    (project: LoadedProject) => {
      const projectId = deriveProjectIdFromPath(project.path);
      const unitIds = project.scenes.map((scene) => scene.id);
      setCurrentProject(project);
      const canonicalDrafts = { ...project.drafts };
      setProjectDrafts(canonicalDrafts);
      setDraftEdits({ ...canonicalDrafts });
      const firstScene = project.scenes[0] ?? null;
      setActiveScene(
        firstScene ? { id: firstScene.id, title: firstScene.title ?? null } : null,
      );
      setCritiqueState(createInitialCritiqueState());
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
        resetProjectState();
        return;
      }

      if ('status' in payload) {
        const { status, project, lastOpenedPath } = payload;

        if (status !== 'loaded') {
          setLastProjectPath(lastOpenedPath ?? null);
        }

        if ((status === 'loaded' || status === 'init') && project) {
          setLastProjectPath(project.path);
          activateProject(project);
          return;
        }

        if (status === 'failed') {
          setProjectSummary(null);
          setRecoveryStatus(null);
          resetProjectState();
          return;
        }

        if (status === 'cleared') {
          setProjectSummary(null);
          setRecoveryStatus(null);
          resetProjectState();
          return;
        }

        if (project) {
          setLastProjectPath(project.path);
          activateProject(project);
          return;
        }

        setProjectSummary(null);
        setRecoveryStatus(null);
        resetProjectState();
        return;
      }

      const legacyProject = payload;
      setLastProjectPath(legacyProject.path);
      activateProject(legacyProject);
    },
    [activateProject, resetProjectState],
  );

  const handleActiveSceneChange = useCallback((payload: ActiveScenePayload | null) => {
    if (!payload) {
      setActiveScene(null);
      return;
    }
    setActiveScene({ id: payload.sceneId, title: payload.sceneTitle });
    setDraftEdits((previous) => {
      if (Object.prototype.hasOwnProperty.call(previous, payload.sceneId)) {
        return previous;
      }
      return { ...previous, [payload.sceneId]: payload.draft };
    });
  }, []);

  const handleDraftChange = useCallback((sceneId: string, draft: string) => {
    setDraftEdits((previous) => {
      if (previous[sceneId] === draft) {
        return previous;
      }
      return { ...previous, [sceneId]: draft };
    });
  }, []);

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
    ({ requestId, status }: { requestId: number; status: 'success' | 'error' }) => {
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
    [pushToast],
  );

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
        traceId: result.traceId,
      });
    } else {
      setPreflightState((previous) => ({
        ...previous,
        loading: false,
        error: result.error.message,
        errorDetails: result.error.details ?? null,
      }));
      pushToast({
        tone: 'error',
        title: 'Draft generation failed',
        description: result.error.message,
        traceId: result.traceId ?? result.error.traceId,
      });
    }
  }, [projectSummary, pushToast, services]);

  const handleOpenCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Critique requires the local services bridge.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Open a project before requesting a critique.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene',
        description: 'Choose a scene to critique from the project panel.',
      });
      return;
    }

    const draftId = generateDraftId(activeScene.id);
    const unitId = activeScene.id;
    setCritiqueState({
      open: true,
      loading: true,
      error: null,
      data: null,
      traceId: undefined,
      draftId,
      unitId,
      accepting: false,
    });

    try {
      const result = await services.critiqueDraft({
        projectId: projectSummary.projectId,
        draftId,
        unitId,
        rubric: DEFAULT_CRITIQUE_RUBRIC,
      });
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        setCritiqueState((previous) => ({
          ...previous,
          loading: false,
          data: result.data,
          traceId: result.traceId,
        }));
      } else {
        setCritiqueState((previous) => ({
          ...previous,
          loading: false,
          error: result.error.message,
          traceId: result.traceId,
        }));
        pushToast({
          tone: 'error',
          title: 'Critique failed',
          description: result.error.message,
          traceId: result.traceId,
        });
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setCritiqueState((previous) => ({
        ...previous,
        loading: false,
        error: message,
      }));
      pushToast({
        tone: 'error',
        title: 'Critique failed',
        description: message,
      });
    }
  }, [activeScene, isMountedRef, projectSummary, pushToast, services]);

  const handleCloseCritique = useCallback(() => {
    setCritiqueState((previous) => ({ ...previous, open: false }));
  }, []);

  const handleRejectCritique = useCallback(() => {
    setCritiqueState(createInitialCritiqueState());
  }, []);

  const handleAcceptCritique = useCallback(async () => {
    if (!services) {
      pushToast({
        tone: 'error',
        title: 'Services unavailable',
        description: 'Accept requires the local services bridge.',
      });
      return;
    }
    if (!projectSummary) {
      pushToast({
        tone: 'warning',
        title: 'Load a project first',
        description: 'Open a project before accepting a draft.',
      });
      return;
    }
    if (!activeScene) {
      pushToast({
        tone: 'warning',
        title: 'Select a scene',
        description: 'Choose a scene to accept updates for.',
      });
      return;
    }

    const unitId = activeScene.id;
    const draftId = critiqueState.draftId ?? generateDraftId(unitId);
    const canonicalText = projectDrafts[unitId] ?? '';
    const nextText = draftEdits[unitId] ?? canonicalText;

    let previousSha: string;
    try {
      previousSha = await computeSha256(canonicalText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to compute checksum for the current draft.';
      pushToast({
        tone: 'error',
        title: 'Checksum unavailable',
        description: message,
      });
      return;
    }

    setCritiqueState((previous) => ({
      ...previous,
      accepting: true,
      error: null,
      draftId,
      unitId,
    }));

    try {
      const result = await services.acceptDraft({
        projectId: projectSummary.projectId,
        draftId,
        unitId,
        unit: {
          id: unitId,
          previous_sha256: previousSha,
          text: nextText,
        },
        message: `Accepted critique for ${activeScene.title ?? unitId}`,
        snapshotLabel: 'accept',
      });
      if (!isMountedRef.current) {
        return;
      }
      if (result.ok) {
        setProjectDrafts((previous) => ({ ...previous, [unitId]: nextText }));
        setDraftEdits((previous) => ({ ...previous, [unitId]: nextText }));
        setCurrentProject((previous) => {
          if (!previous) {
            return previous;
          }
          return {
            ...previous,
            drafts: {
              ...previous.drafts,
              [unitId]: nextText,
            },
          };
        });
        setRecoveryStatus((previous) => {
          if (previous) {
            return {
              ...previous,
              status: 'idle',
              needs_recovery: false,
              last_snapshot: result.data.snapshot,
            };
          }
          return {
            project_id: projectSummary.projectId,
            status: 'idle',
            needs_recovery: false,
            pending_unit_id: null,
            draft_id: null,
            started_at: null,
            last_snapshot: result.data.snapshot,
            message: null,
            failure_reason: null,
          };
        });
        setCritiqueState(createInitialCritiqueState());
        pushToast({
          tone: 'success',
          title: 'Draft accepted',
          description: `Snapshot ${result.data.snapshot.snapshot_id} captured.`,
          traceId: result.traceId,
        });
      } else {
        setCritiqueState((previous) => ({
          ...previous,
          accepting: false,
          error: result.error.message,
        }));
        pushToast({
          tone: 'error',
          title: 'Accept failed',
          description: result.error.message,
          traceId: result.traceId,
        });
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      setCritiqueState((previous) => ({ ...previous, accepting: false, error: message }));
      pushToast({
        tone: 'error',
        title: 'Accept failed',
        description: message,
      });
    }
  }, [
    activeScene,
    critiqueState.draftId,
    draftEdits,
    isMountedRef,
    projectDrafts,
    projectSummary,
    pushToast,
    services,
  ]);

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
              onClick={() => void handleOpenCritique()}
            >
              Critique
            </button>
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
              draftOverrides={draftEdits}
              onActiveSceneChange={handleActiveSceneChange}
              onDraftChange={handleDraftChange}
            />
          </div>
        </main>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <CritiqueModal
        isOpen={critiqueState.open}
        loading={critiqueState.loading}
        error={critiqueState.error}
        critique={critiqueState.data}
        traceId={critiqueState.traceId}
        accepting={critiqueState.accepting}
        sceneId={critiqueState.unitId}
        sceneTitle={activeScene?.title ?? null}
        onClose={handleCloseCritique}
        onReject={handleRejectCritique}
        onAccept={() => void handleAcceptCritique()}
      />

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
