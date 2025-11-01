import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import ProjectHome, { type ActiveScenePayload, type ProjectLoadEvent } from "./components/ProjectHome";
import CompanionOverlay from "./components/CompanionOverlay";
import WizardPanel from "./components/WizardPanel";
import WorkspaceHeader from "./components/WorkspaceHeader";
import RecoveryBanner from "./components/RecoveryBanner";
import { PreflightModal } from "./components/PreflightModal";
import { CritiqueModal } from "./components/CritiqueModal";
import { ToastStack } from "./components/ToastStack";
import DockWorkspace from "./components/docking/DockWorkspace";
import type { LoadedProject } from "../shared/ipc/projectLoader";
import type { DiagnosticsBridge } from "../shared/ipc/diagnostics";
import type {
  DraftCritiqueBridgeResponse,
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from "../shared/ipc/services";
import type { BudgetMeterProps } from "./components/BudgetMeter";
import type { LayoutPaneId } from "../shared/ipc/layout";
import useMountedRef from "./hooks/useMountedRef";
import { useToasts } from "./hooks/useToasts";
import { useServiceHealth } from "./hooks/useServiceHealth";
import { isTestEnvironment } from "./utils/env";
import { usePreflight } from "./hooks/usePreflight";
import { useCritique, DEFAULT_CRITIQUE_RUBRIC } from "./hooks/useCritique";
import type { CritiqueDialogState } from "./hooks/useCritique";
import useRecovery from "./hooks/useRecovery";
import type ProjectSummary from "./types/project";
import { generateDraftId } from "./utils/draft";
import { recordDebugEvent } from "./utils/debugLog";

type BudgetSnapshotSource = {
  soft_limit_usd?: number | null;
  hard_limit_usd?: number | null;
  spent_usd?: number | null;
  total_after_usd?: number | null;
  estimated_usd?: number | null;
  status?: string | null;
  message?: string | null;
};

const BUDGET_EPSILON = 1e-6;

const DOCKABLE_PANES: LayoutPaneId[] = [
  "wizard",
  "draft-board",
  "critique",
  "history",
  "analytics",
];

function normaliseBudgetNumber(value?: number | null): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function isBudgetStatus(value: string | null | undefined): value is BudgetMeterProps["status"] {
  return value === "ok" || value === "soft-limit" || value === "blocked";
}

function deriveBudgetStatus(
  providedStatus: string | null | undefined,
  projected: number,
  softLimit?: number,
  hardLimit?: number,
): BudgetMeterProps["status"] {
  if (isBudgetStatus(providedStatus)) {
    return providedStatus;
  }
  if (typeof hardLimit === "number" && projected > hardLimit + BUDGET_EPSILON) {
    return "blocked";
  }
  if (typeof softLimit === "number" && projected > softLimit + BUDGET_EPSILON) {
    return "soft-limit";
  }
  return "ok";
}

function deriveProjectIdFromPath(path: string): string {
  const segments = path.split(/[\\/]+/).filter(Boolean);
  const base = segments.at(-1);
  if (base && base.length > 0) {
    return base;
  }
  return path;
}

type BatchCritiqueStatus = "idle" | "running" | "success" | "error";

interface BatchCritiqueResult {
  status: BatchCritiqueStatus;
  summary?: string;
  error?: string;
  traceId?: string;
}

export default function App(): JSX.Element {
  const services: ServicesBridge | undefined = window.services;
  const diagnostics: DiagnosticsBridge | undefined = window.diagnostics;
  const runtimeUi = window.runtimeConfig?.ui;
  const dockingEnabled = runtimeUi?.enableDocking === true;
  const dockingHotkeysEnabled = runtimeUi?.hotkeys?.enablePresetHotkeys !== false;
  const dockingFocusOrder = useMemo(() => {
    const entries = runtimeUi?.hotkeys?.focusCycleOrder ?? DOCKABLE_PANES;
    const allowed = new Set<LayoutPaneId>(DOCKABLE_PANES);
    const filtered = entries
      .map((item) => (typeof item === "string" ? (item.trim() as LayoutPaneId) : null))
      .filter((item): item is LayoutPaneId => Boolean(item) && allowed.has(item));
    return filtered.length > 0 ? filtered : DOCKABLE_PANES;
  }, [runtimeUi]);
  const defaultDockPreset = runtimeUi?.defaultPreset ?? "standard";

  const { toasts, pushToast, dismissToast } = useToasts();
  const isMountedRef = useMountedRef();
  const isTestEnv = isTestEnvironment();
  const { status: serviceStatus, retry: checkServices } = useServiceHealth(
    services,
    isTestEnv ? { intervalMs: 0 } : undefined,
  );

  const [currentProject, setCurrentProject] = useState<LoadedProject | null>(null);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [activeScene, setActiveScene] = useState<{ id: string; title: string | null } | null>(null);
  const activeSceneId = activeScene?.id ?? null;
  const [critiqueRubric, setCritiqueRubric] = useState<string[]>(() => [
    ...DEFAULT_CRITIQUE_RUBRIC,
  ]);
  const [companionOpen, setCompanionOpen] = useState<boolean>(false);
  const [batchCritiqueState, setBatchCritiqueState] = useState<{
    running: boolean;
    results: Record<string, BatchCritiqueResult>;
  }>({
    running: false,
    results: {},
  });
  const [budgetSnapshot, setBudgetSnapshot] = useState<BudgetMeterProps | null>(null);
  const batchJobRef = useRef<{ cancelled: boolean } | null>(null);

  const applyBudgetUpdate = useCallback(
    (source?: BudgetSnapshotSource | null) => {
      if (!source) {
        setBudgetSnapshot(null);
        return;
      }

      const softLimit = normaliseBudgetNumber(source.soft_limit_usd);
      const hardLimit = normaliseBudgetNumber(source.hard_limit_usd);
      const spent = normaliseBudgetNumber(source.spent_usd);
      const totalAfter = normaliseBudgetNumber(source.total_after_usd);
      const estimated = normaliseBudgetNumber(source.estimated_usd);
      const message = source.message ?? null;

      const hasNumeric =
        softLimit !== undefined ||
        hardLimit !== undefined ||
        spent !== undefined ||
        totalAfter !== undefined ||
        estimated !== undefined;

      if (!hasNumeric && message === null) {
        return;
      }

      const projectedCandidate =
        totalAfter !== undefined
          ? totalAfter
          : spent !== undefined
            ? spent
            : estimated !== undefined
              ? estimated
              : undefined;
      const projectedValue = normaliseBudgetNumber(projectedCandidate) ?? 0;

      let finalSpentCandidate = spent;
      if (finalSpentCandidate === undefined) {
        if (totalAfter !== undefined && estimated !== undefined) {
          finalSpentCandidate = Math.max(totalAfter - estimated, 0);
        } else if (totalAfter !== undefined) {
          finalSpentCandidate = totalAfter;
        }
      }
      const finalSpent = normaliseBudgetNumber(finalSpentCandidate);

      setBudgetSnapshot({
        softLimitUsd: softLimit,
        hardLimitUsd: hardLimit,
        spentUsd: finalSpent,
        projectedUsd: projectedValue,
        status: deriveBudgetStatus(source.status, projectedValue, softLimit, hardLimit),
        message,
      });
    },
    [setBudgetSnapshot],
  );

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
    rubric: critiqueRubric,
    onBudgetUpdate: applyBudgetUpdate,
  });

  const resetProjectState = useCallback(() => {
    setCurrentProject(null);
    setProjectDrafts({});
    setDraftEdits({});
    setActiveScene(null);
    setCritiqueRubric([...DEFAULT_CRITIQUE_RUBRIC]);
    setCompanionOpen(false);
    setBudgetSnapshot(null);
    resetCritique();
    resetRecovery();
  }, [
    resetCritique,
    resetRecovery,
    setActiveScene,
    setCurrentProject,
    setDraftEdits,
    setProjectDrafts,
    setCritiqueRubric,
    setCompanionOpen,
    setBudgetSnapshot,
  ]);

  const updateCritiqueRubric = useCallback(
    (nextValues: string[]) => {
    if (!Array.isArray(nextValues)) {
      setCritiqueRubric([]);
      return;
    }
    const unique: string[] = [];
    const seen = new Set<string>();
    let removed = false;
    for (const entry of nextValues) {
      if (typeof entry !== "string") {
        removed = true;
        continue;
      }
      const trimmed = entry.trim();
      if (trimmed.length === 0) {
        removed = true;
        continue;
      }
      const normalised = trimmed.replace(/\s+/g, " ");
      const key = normalised.toLowerCase();
      if (seen.has(key)) {
        removed = true;
        continue;
      }
      unique.push(normalised);
      seen.add(key);
    }
    setCritiqueRubric(unique);
    if (removed) {
      pushToast({
        tone: "warning",
        title: "Duplicate rubric categories removed",
        description: "Rubric entries must be unique and non-empty.",
      });
    }
    },
    [pushToast],
  );

  const cancelBatchCritique = useCallback(() => {
    const job = batchJobRef.current;
    if (job) {
      job.cancelled = true;
      batchJobRef.current = null;
    }
    setBatchCritiqueState((previous) => ({
      running: false,
      results: previous.results,
    }));
  }, []);

  const toggleCompanion = useCallback(() => {
    setCompanionOpen((previous) => !previous);
  }, []);

  const closeCompanion = useCallback(() => {
    cancelBatchCritique();
    setCompanionOpen(false);
  }, [cancelBatchCritique]);

  useEffect(() => {
    if (!companionOpen) {
      cancelBatchCritique();
    }
  }, [companionOpen, cancelBatchCritique]);

  useEffect(() => {
    return () => {
      cancelBatchCritique();
    };
  }, [cancelBatchCritique]);

  const runBatchCritique = useCallback(
    async (sceneIds: string[]) => {
      const projectId = projectSummary?.projectId;
      if (!services) {
        pushToast({
          tone: "error",
          title: "Services unavailable",
          description: "Start the local services bridge before running batch critiques.",
        });
        return;
      }
      if (!projectId) {
        pushToast({
          tone: "warning",
          title: "Load a project",
          description: "Open a project to run critiques across multiple scenes.",
        });
        return;
      }

      const uniqueIds = Array.from(
        new Set(
          sceneIds.filter((sceneId): sceneId is string => typeof sceneId === "string" && sceneId.trim().length > 0),
        ),
      );
      if (uniqueIds.length === 0) {
        pushToast({
          tone: "warning",
          title: "Select scenes",
          description: "Choose one or more scenes before running a batch critique.",
        });
        return;
      }

      const rubricValues = critiqueRubric
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      if (rubricValues.length === 0) {
        pushToast({
          tone: "warning",
          title: "Add rubric categories",
          description: "Specify at least one rubric category before running a batch critique.",
        });
        return;
      }

      if (batchJobRef.current) {
        batchJobRef.current.cancelled = true;
      }
      const job = { cancelled: false };
      batchJobRef.current = job;

      setBatchCritiqueState((previous) => {
        const nextResults = { ...previous.results };
        uniqueIds.forEach((sceneId) => {
          nextResults[sceneId] = { status: "running" };
        });
        return {
          running: true,
          results: nextResults,
        };
      });

      let successCount = 0;
      let failureCount = 0;
      const queue = [...uniqueIds];
      const concurrency = Math.max(1, Math.min(3, queue.length));

      const worker = async () => {
        while (queue.length > 0 && !job.cancelled) {
          const sceneId = queue.shift();
          if (!sceneId) {
            return;
          }

          try {
            const response = await services.critiqueDraft({
              projectId,
              draftId: generateDraftId(sceneId),
              unitId: sceneId,
              rubric: rubricValues,
            });

            if (job.cancelled || !isMountedRef.current) {
              return;
            }

            if (response.ok) {
              successCount += 1;
              const data = response.data as DraftCritiqueBridgeResponse;
              const summaryText = typeof data.summary === "string" ? data.summary.trim() : "";
              const truncatedSummary =
                summaryText.length > 180 ? `${summaryText.slice(0, 177)}…` : summaryText;
              setBatchCritiqueState((previous) => {
                if (job.cancelled) {
                  return previous;
                }
                return {
                  running: true,
                  results: {
                    ...previous.results,
                    [sceneId]: {
                      status: "success",
                      summary: truncatedSummary,
                      traceId: response.traceId,
                    },
                  },
                };
              });
            } else {
              failureCount += 1;
              const errorMessage = response.error.message;
              const traceId = response.traceId ?? response.error.traceId;
              setBatchCritiqueState((previous) => {
                if (job.cancelled) {
                  return previous;
                }
                return {
                  running: true,
                  results: {
                    ...previous.results,
                    [sceneId]: {
                      status: "error",
                      error: errorMessage,
                      traceId,
                    },
                  },
                };
              });
            }
          } catch (error) {
            if (job.cancelled || !isMountedRef.current) {
              return;
            }
            failureCount += 1;
            const message = error instanceof Error ? error.message : String(error);
            setBatchCritiqueState((previous) => {
              if (job.cancelled) {
                return previous;
              }
              return {
                running: true,
                results: {
                  ...previous.results,
                  [sceneId]: {
                    status: "error",
                    error: message,
                  },
                },
              };
            });
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, () => worker()));

      if (job.cancelled || !isMountedRef.current) {
        return;
      }

      batchJobRef.current = null;
      setBatchCritiqueState((previous) => ({
        running: false,
        results: previous.results,
      }));

      const total = successCount + failureCount;
      if (total === 0) {
        return;
      }
      if (failureCount === 0) {
        pushToast({
          tone: "success",
          title: "Batch critique complete",
          description: `Generated ${successCount} critique${successCount === 1 ? "" : "s"}.`,
        });
      } else {
        pushToast({
          tone: "warning",
          title: "Batch critique finished with issues",
          description: `${successCount} succeeded, ${failureCount} failed.`,
        });
      }
    },
    [critiqueRubric, isMountedRef, projectSummary, pushToast, services],
  );

  const activateProject = useCallback(
    (project: LoadedProject, options?: { preserveSceneId?: string | null }) => {
      console.info("[App] activateProject", {
        path: project.path,
        scenes: project.scenes.length,
        drafts: Object.keys(project.drafts).length,
        preserveSceneId: options?.preserveSceneId ?? null,
      });
      recordDebugEvent("app.activateProject", {
        path: project.path,
        scenes: project.scenes.length,
        drafts: Object.keys(project.drafts).length,
        preserveSceneId: options?.preserveSceneId ?? null,
      });
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
    onBudgetUpdate: applyBudgetUpdate,
  });

  const handleProjectLoaded = useCallback(
    (payload: ProjectLoadEvent | LoadedProject | null | undefined) => {
      console.info("[App] handleProjectLoaded", {
        received: payload ? (("status" in payload && payload.status) || "direct") : "null",
        hasProject: Boolean(payload && ("status" in payload ? payload.project : payload)),
      });
      recordDebugEvent("app.handleProjectLoaded", {
        received: payload ? (("status" in payload && payload.status) || "direct") : "null",
        hasProject: Boolean(payload && ("status" in payload ? payload.project : payload)),
      });
      if (!payload) {
        setProjectSummary(null);
        resetProjectState();
        return;
      }

      if ("status" in payload) {
        const { status, project, lastOpenedPath } = payload;

        console.info("[App] handleProjectLoaded(status)", {
          status,
          projectPath: project?.path ?? null,
          lastOpenedPath: lastOpenedPath ?? null,
        });
        recordDebugEvent("app.handleProjectLoaded.status", {
          status,
          projectPath: project?.path ?? null,
          lastOpenedPath: lastOpenedPath ?? null,
        });

        if (status !== "loaded") {
          updateLastProjectPath(lastOpenedPath ?? null);
        }

        if ((status === "loaded" || status === "init") && project) {
          updateLastProjectPath(project.path);
          activateProject(project);
          return;
        }

        if (status === "failed" || status === "cleared") {
          recordDebugEvent("app.handleProjectLoaded.reset", { status });
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
      console.info("[App] handleProjectLoaded(direct)", {
        path: payload.path,
      });
      recordDebugEvent("app.handleProjectLoaded.direct", { path: payload.path });
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

  useEffect(() => {
    const budget = preflightState.estimate?.budget;
    if (budget) {
      applyBudgetUpdate(budget);
    }
  }, [applyBudgetUpdate, preflightState.estimate]);

  const projectLabel = useMemo(() => projectSummary?.path ?? "No project loaded", [projectSummary]);
  const recoverySnapshot = recoveryStatus?.last_snapshot ?? null;
  const recoveryBannerVisible = recoveryStatus?.needs_recovery ?? false;
  const recoveryBusy = recoveryAction !== "idle";
  const reopenBusy = reopenInFlight;
  const restoreDisabled = recoveryBusy || reopenBusy;
  const reopenDisabled = restoreDisabled || !lastProjectPath;
  const diagnosticsDisabled = recoveryBusy || reopenBusy;
  const restoreLabel = recoveryAction === "restore" ? "Restoring…" : "Restore snapshot";

  const renderWizardPanel = () => (
    <WizardPanel services={services} onToast={pushToast} onOutlineReady={handleOutlineReady} />
  );

  const renderRecoveryBanner = () => (
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
  );

  const renderProjectHome = () => (
    <ProjectHome
      onToast={pushToast}
      onProjectLoaded={handleProjectLoaded}
      reopenRequest={reopenRequest}
      onReopenConsumed={handleReopenConsumed}
      draftOverrides={draftEdits}
      onActiveSceneChange={handleActiveSceneChange}
      onDraftChange={handleDraftChange}
    />
  );

  const dockPaneContent: Partial<Record<LayoutPaneId, React.ReactNode>> = dockingEnabled
    ? {
        wizard: <div className="dock-pane__scroll">{renderWizardPanel()}</div>,
        "draft-board": (
          <div className="dock-pane__scroll">
            {renderRecoveryBanner()}
            {renderProjectHome()}
          </div>
        ),
        critique: (
          <CritiqueSummaryPane
            state={critiqueState}
            onOpen={() => void openCritique()}
            onReset={() => void resetCritique()}
          />
        ),
        history: (
          <HistoryPane
            recoveryStatus={recoveryStatus}
            recoveryAction={recoveryAction}
            lastProjectPath={lastProjectPath}
            onRestore={() => void handleRestoreSnapshot()}
            onReopen={() => void handleReopenLastProject()}
            onReload={() => void reloadProjectFromDisk()}
          />
        ),
        analytics: (
          <AnalyticsPane
            companionOpen={companionOpen}
            onOpenCompanion={() => setCompanionOpen(true)}
            budget={budgetSnapshot}
          />
        ),
      }
    : {};

  const workspaceBody = dockingEnabled ? (
    <DockWorkspace
      projectPath={projectSummary?.path ?? null}
      panes={dockPaneContent}
      defaultPreset={defaultDockPreset}
      enableHotkeys={dockingHotkeysEnabled}
      focusCycleOrder={dockingFocusOrder}
      emptyState={
        <div className="dock-workspace__empty-card">
          {renderRecoveryBanner()}
          {renderProjectHome()}
        </div>
      }
    />
  ) : (
    <div className="app-shell__workspace-scroll">
      {renderRecoveryBanner()}
      {renderProjectHome()}
    </div>
  );

  return (
    <div className={`app-shell${dockingEnabled ? " app-shell--dock-enabled" : ""}`}>
      {!dockingEnabled && (
        <aside className="app-shell__dock" aria-label="Wizard dock">
          <div className="app-shell__dock-header">
            <h1>Black Skies</h1>
            <p>Wizard steps</p>
          </div>
          {renderWizardPanel()}
        </aside>
      )}

      <div className="app-shell__workspace">
        <WorkspaceHeader
          projectLabel={projectLabel}
          serviceStatus={serviceStatus}
          onRetry={checkServices}
          onToggleCompanion={toggleCompanion}
          onGenerate={() => void openPreflight()}
          onCritique={() => void openCritique()}
          companionOpen={companionOpen}
          disableCompanion={!currentProject}
          disableGenerate={serviceStatus !== "online"}
          disableCritique={serviceStatus !== "online"}
          budget={budgetSnapshot ?? undefined}
        />

        <main className="app-shell__workspace-body">{workspaceBody}</main>
      </div>

      <CompanionOverlay
        open={companionOpen}
        onClose={closeCompanion}
        activeScene={activeScene}
        activeDraft={
          activeScene
            ? draftEdits[activeScene.id] ?? projectDrafts[activeScene.id] ?? ""
            : ""
        }
        project={currentProject}
        drafts={draftEdits}
        rubric={critiqueRubric}
        onRubricChange={updateCritiqueRubric}
        builtInRubric={DEFAULT_CRITIQUE_RUBRIC}
        scenes={currentProject?.scenes ?? []}
        activeSceneId={activeScene?.id ?? null}
        batchState={batchCritiqueState}
        onBatchCritique={runBatchCritique}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        autoDismissMs={isTestEnv ? 0 : undefined}
      />

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

interface CritiqueSummaryPaneProps {
  state: CritiqueDialogState;
  onOpen: () => void;
  onReset: () => void;
}

function CritiqueSummaryPane({ state, onOpen, onReset }: CritiqueSummaryPaneProps): JSX.Element {
  const summary = state.data?.summary?.trim();
  return (
    <div className="dock-pane__section">
      <div>
        <h3>Latest critique</h3>
        {state.loading ? (
          <p>Fetching critique…</p>
        ) : summary ? (
          <p>{summary}</p>
        ) : (
          <p>No critique has been generated in this session.</p>
        )}
        {state.error ? <p role="status">Last error: {state.error}</p> : null}
      </div>
      <div className="dock-pane__actions">
        <button type="button" onClick={onOpen}>
          {state.open ? "Focus critique modal" : "Open critique modal"}
        </button>
        <button type="button" onClick={onReset} disabled={state.loading}>
          Clear results
        </button>
      </div>
    </div>
  );
}

interface HistoryPaneProps {
  recoveryStatus: RecoveryStatusBridgeResponse | null;
  recoveryAction: string;
  lastProjectPath: string | null;
  onRestore: () => void;
  onReopen: () => void;
  onReload: () => void;
}

function HistoryPane({
  recoveryStatus,
  recoveryAction,
  lastProjectPath,
  onRestore,
  onReopen,
  onReload,
}: HistoryPaneProps): JSX.Element {
  const snapshot = recoveryStatus?.last_snapshot;
  return (
    <div className="dock-pane__section">
      <div>
        <h3>Recovery</h3>
        <p>Status: {recoveryStatus?.status ?? "No incidents detected"}</p>
        {recoveryStatus?.message ? <p>{recoveryStatus.message}</p> : null}
        {snapshot ? (
          <p>
            Last snapshot: {snapshot.label ?? snapshot.snapshot_id ?? "Unknown"}
            {snapshot.created_at ? ` · ${snapshot.created_at}` : ""}
          </p>
        ) : (
          <p>No snapshot has been written yet.</p>
        )}
      </div>
      <div className="dock-pane__actions">
        <button type="button" onClick={onRestore} disabled={recoveryAction !== "idle"}>
          Restore snapshot
        </button>
        <button
          type="button"
          onClick={onReopen}
          disabled={!lastProjectPath || recoveryAction !== "idle"}
        >
          Reopen last project
        </button>
        <button type="button" onClick={onReload}>
          Refresh from disk
        </button>
      </div>
    </div>
  );
}

interface AnalyticsPaneProps {
  companionOpen: boolean;
  onOpenCompanion: () => void;
  budget: BudgetMeterProps | null;
}

function AnalyticsPane({ companionOpen, onOpenCompanion, budget }: AnalyticsPaneProps): JSX.Element {
  const statusCopy: Record<string, string> = {
    ok: "Within limits",
    "soft-limit": "Soft limit warning",
    blocked: "Hard limit reached",
  };

  return (
    <div className="dock-pane__section">
      <div>
        <h3>Companion overlay</h3>
        <p>The companion overlay is currently {companionOpen ? "open" : "closed"}.</p>
        <button type="button" onClick={onOpenCompanion}>
          {companionOpen ? "Focus companion overlay" : "Open companion overlay"}
        </button>
      </div>
      <div>
        <h4>Budget snapshot</h4>
        {budget ? (
          <ul className="dock-pane__list">
            <li>Projected spend: {formatCurrency(budget.projectedUsd)}</li>
            <li>Spent to date: {formatCurrency(budget.spentUsd)}</li>
            <li>Status: {statusCopy[budget.status] ?? budget.status}</li>
            {budget.message ? <li>{budget.message}</li> : null}
          </ul>
        ) : (
          <p>No budget estimates yet. Run a draft preflight to populate analytics.</p>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return `$${value.toFixed(2)}`;
}




