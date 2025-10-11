import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ProjectHome, { type ActiveScenePayload, type ProjectLoadEvent } from "./components/ProjectHome";
import WizardPanel from "./components/WizardPanel";
import WorkspaceHeader from "./components/WorkspaceHeader";
import RecoveryBanner from "./components/RecoveryBanner";
import { PreflightModal } from "./components/PreflightModal";
import { CritiqueModal } from "./components/CritiqueModal";
import { ToastStack } from "./components/ToastStack";
import type { LoadedProject } from "../shared/ipc/projectLoader";
import type { DiagnosticsBridge } from "../shared/ipc/diagnostics";
import type { ServicesBridge } from "../shared/ipc/services";
import useMountedRef from "./hooks/useMountedRef";
import { useToasts } from "./hooks/useToasts";
import { useServiceHealth } from "./hooks/useServiceHealth";
import { usePreflight } from "./hooks/usePreflight";
import { useCritique } from "./hooks/useCritique";
import useRecovery from "./hooks/useRecovery";
import type ProjectSummary from "./types/project";

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

  const { toasts, pushToast, dismissToast } = useToasts();
  const isMountedRef = useMountedRef();
  const { status: serviceStatus, retry: checkServices } = useServiceHealth(services);

  const [, setCurrentProject] = useState<LoadedProject | null>(null);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [activeScene, setActiveScene] = useState<{ id: string; title: string | null } | null>(null);
  const activeSceneId = activeScene?.id ?? null;

  const projectDraftsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    projectDraftsRef.current = projectDrafts;
  }, [projectDrafts]);

  const {
    recoveryStatus,
    recoveryAction,
    reopenInFlight,
    lastProjectPath,
    reopenRequest,
    setRecoveryStatus,
    setLastProjectPath: updateLastProjectPath,
    fetchRecoveryStatus,
    handleRestoreSnapshot,
    handleOpenDiagnostics,
    handleReopenLastProject,
    handleReopenConsumed,
    resetRecovery,
  } = useRecovery({
    services,
    diagnostics,
    serviceStatus,
    projectSummary,
    pushToast,
    isMountedRef,
  });

  const {
    state: critiqueState,
    openCritique,
    closeCritique,
    rejectCritique,
    acceptCritique,
    resetCritique,
  } = useCritique({
    services,
    projectSummary,
    activeScene,
    projectDrafts,
    draftEdits,
    setProjectDrafts,
    setDraftEdits,
    setCurrentProject,
    setRecoveryStatus,
    pushToast,
    isMountedRef,
  });

  const resetProjectState = useCallback(() => {
    setCurrentProject(null);
    setProjectDrafts({});
    setDraftEdits({});
    setActiveScene(null);
    resetCritique();
    resetRecovery();
  }, [resetCritique, resetRecovery, setActiveScene, setCurrentProject, setDraftEdits, setProjectDrafts]);

  const activateProject = useCallback(
    (project: LoadedProject, options?: { preserveSceneId?: string | null }) => {
      const projectId = deriveProjectIdFromPath(project.path);
      const unitIds = project.scenes.map((scene) => scene.id);

      setCurrentProject(project);
      const canonicalDrafts = { ...project.drafts };
      setProjectDrafts(canonicalDrafts);
      setDraftEdits({ ...canonicalDrafts });
      projectDraftsRef.current = canonicalDrafts;

      let nextScene: { id: string; title: string | null } | null = null;
      const preservedId = options?.preserveSceneId ?? null;
      if (preservedId) {
        const preservedScene = project.scenes.find((scene) => scene.id === preservedId);
        if (preservedScene) {
          nextScene = { id: preservedScene.id, title: preservedScene.title ?? null };
        }
      }
      if (!nextScene) {
        const firstScene = project.scenes[0] ?? null;
        nextScene = firstScene ? { id: firstScene.id, title: firstScene.title ?? null } : null;
      }
      setActiveScene(nextScene);
      resetCritique();
      setProjectSummary({
        projectId,
        path: project.path,
        unitScope: "scene",
        unitIds,
      });
      void fetchRecoveryStatus(projectId);
    },
    [fetchRecoveryStatus, resetCritique, setActiveScene, setCurrentProject, setDraftEdits, setProjectDrafts, setProjectSummary],
  );

  const reloadProjectFromDisk = useCallback(async () => {
    if (!projectSummary?.path) {
      return;
    }
    const loader = window.projectLoader;
    if (!loader?.loadProject) {
      return;
    }

    try {
      const response = await loader.loadProject({ path: projectSummary.path });
      if (!isMountedRef.current) {
        return;
      }
      if (response.ok) {
        activateProject(response.project, { preserveSceneId: activeSceneId });
      } else {
        pushToast({
          tone: "warning",
          title: "Unable to refresh project",
          description: response.error.message,
        });
      }
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      pushToast({
        tone: "error",
        title: "Project refresh failed",
        description: message,
      });
    }
  }, [activateProject, activeSceneId, isMountedRef, projectSummary, pushToast]);

  const {
    state: preflightState,
    openPreflight,
    closePreflight,
    proceedPreflight,
  } = usePreflight({
    services,
    projectSummary,
    isMountedRef,
    pushToast,
    projectDraftsRef,
    setProjectDrafts,
    setDraftEdits,
    reloadProjectFromDisk,
  });

  const handleProjectLoaded = useCallback(
    (payload: ProjectLoadEvent | LoadedProject | null | undefined) => {
      if (!payload) {
        setProjectSummary(null);
        resetProjectState();
        return;
      }

      if ("status" in payload) {
        const { status, project, lastOpenedPath } = payload;

        if (status !== "loaded") {
          updateLastProjectPath(lastOpenedPath ?? null);
        }

        if ((status === "loaded" || status === "init") && project) {
          updateLastProjectPath(project.path);
          activateProject(project);
          return;
        }

        if (status === "failed" || status === "cleared") {
          setProjectSummary(null);
          resetProjectState();
          return;
        }

        if (project) {
          updateLastProjectPath(project.path);
          activateProject(project);
          return;
        }

        setProjectSummary(null);
        resetProjectState();
        return;
      }

      updateLastProjectPath(payload.path);
      activateProject(payload);
    },
    [activateProject, resetProjectState, updateLastProjectPath],
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

  const handleOutlineReady = useCallback(
    (projectId: string) => {
      pushToast({
        tone: "info",
        title: "Outline updated",
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

  const projectLabel = useMemo(() => projectSummary?.path ?? "No project loaded", [projectSummary]);
  const recoverySnapshot = recoveryStatus?.last_snapshot ?? null;
  const recoveryBannerVisible = recoveryStatus?.needs_recovery ?? false;
  const recoveryBusy = recoveryAction !== "idle";
  const reopenBusy = reopenInFlight;
  const restoreDisabled = recoveryBusy || reopenBusy;
  const reopenDisabled = restoreDisabled || !lastProjectPath;
  const diagnosticsDisabled = recoveryBusy || reopenBusy;
  const restoreLabel = recoveryAction === "restore" ? "Restoring…" : "Restore snapshot";

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
        <WorkspaceHeader
          projectLabel={projectLabel}
          serviceStatus={serviceStatus}
          onRetry={checkServices}
          onGenerate={() => void openPreflight()}
          onCritique={() => void openCritique()}
          disableGenerate={serviceStatus !== "online"}
          disableCritique={serviceStatus !== "online"}
        />

        <main className="app-shell__workspace-body">
          <div className="app-shell__workspace-scroll">
            <RecoveryBanner
              visible={recoveryBannerVisible}
              snapshotLabel={recoverySnapshot?.label || recoverySnapshot?.snapshot_id || null}
              snapshotTimestamp={recoverySnapshot?.created_at ?? null}
              restoreDisabled={restoreDisabled}
              reopenDisabled={reopenDisabled}
              diagnosticsDisabled={diagnosticsDisabled}
              restoreLabel={restoreLabel}
              onRestore={() => void handleRestoreSnapshot()}
              onReopen={() => void handleReopenLastProject()}
              onOpenDiagnostics={() => void handleOpenDiagnostics()}
            />

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
        onClose={closeCritique}
        onReject={rejectCritique}
        onAccept={() => void acceptCritique()}
      />

      <PreflightModal
        isOpen={preflightState.open}
        loading={preflightState.loading}
        error={preflightError}
        errorDetails={preflightErrorDetails}
        estimate={preflightEstimate}
        onClose={closePreflight}
        onProceed={() => void proceedPreflight()}
      />
    </div>
  );
}
