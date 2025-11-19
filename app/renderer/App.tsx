import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import ProjectHome, { type ActiveScenePayload, type ProjectLoadEvent } from "./components/ProjectHome";
import CompanionOverlay from "./components/CompanionOverlay";
import WizardPanel from "./components/WizardPanel";
import WorkspaceHeader from "./components/WorkspaceHeader";
import SnapshotsPanel from "./components/SnapshotsPanel";
import RecoveryBanner from "./components/RecoveryBanner";
import { PreflightModal } from "./components/PreflightModal";
import { CritiqueModal } from "./components/CritiqueModal";
import { ToastStack } from "./components/ToastStack";
import ServiceHealthBanner from "./components/ServiceHealthBanner";
import DockWorkspace from "./components/docking/DockWorkspace";
import type { LoadedProject } from "../shared/ipc/projectLoader";
import type { DiagnosticsBridge } from "../shared/ipc/diagnostics";
import type {
  DraftCritiqueBridgeResponse,
  ExportFormat,
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from "../shared/ipc/services";
import type { BudgetMeterProps } from "./components/BudgetMeter";
import type { LayoutPaneId } from "../shared/ipc/layout";
import useMountedRef from "./hooks/useMountedRef";
import { useToasts } from "./hooks/useToasts";
import { useServiceHealth } from "./hooks/useServiceHealth";
import { isTestEnvironment } from "./utils/env";
import { normaliseBudgetNumber, type BudgetSnapshotSource } from "./utils/budgetIndicator";
import { usePreflight } from "./hooks/usePreflight";
import { useCritique, DEFAULT_CRITIQUE_RUBRIC } from "./hooks/useCritique";
import type { CritiqueDialogState } from "./hooks/useCritique";
import useRecovery from "./hooks/useRecovery";
import type ProjectSummary from "./types/project";
import { generateDraftId } from "./utils/draft";
import { recordDebugEvent } from "./utils/debugLog";
import type { RuntimeConfig } from "../shared/config/runtime";
import { useRelocationPreferences } from "./hooks/useRelocationPreferences";
import { useBudgetIndicator } from "./hooks/useBudgetIndicator";

type DebugLogEntry = { scope: string; msg?: string };

declare global {
  interface Window {
    __test?: {
      markBoot?: () => void;
    };
    __testInsights?: {
      setServiceStatus?: (status: "offline" | "online") => void;
      selectScene?: (sceneId: string) => void;
    };
    __blackskiesDebugLog?: Array<DebugLogEntry>;
  }
}

type TrackedLoadedProject = LoadedProject & { projectId?: string };

const BUDGET_EPSILON = 1e-6;

const DOCKABLE_PANES: LayoutPaneId[] = [
  "wizard",
  "draft-board",
  "critique",
  "history",
  "analytics",
];

function isLayoutPaneId(value: string | null): value is LayoutPaneId {
  return value !== null && (DOCKABLE_PANES as readonly string[]).includes(value);
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

const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
  md: "Markdown",
  txt: "Plain text",
  zip: "ZIP archive",
};


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
  const runtimeConfigOverride =
    (window as typeof window & { __runtimeConfigOverride?: RuntimeConfig }).__runtimeConfigOverride;
  const runtimeUi = runtimeConfigOverride?.ui ?? window.runtimeConfig?.ui;
  console.info(`[playwright] runtimeUi=${JSON.stringify(runtimeUi)}`);
  const { floatingPaneId, floatingProjectPath, floatingRelocatedFlag } = useMemo(() => {
    if (typeof window === "undefined") {
      return { floatingPaneId: null, floatingProjectPath: null, floatingRelocatedFlag: false };
    }
    const params = new URLSearchParams(window.location.search);
    const paneParam = params.get("floatingPane");
    const projectPathParam = params.get("projectPath");
    return {
      floatingPaneId: isLayoutPaneId(paneParam) ? (paneParam as LayoutPaneId) : null,
      floatingProjectPath: projectPathParam,
      floatingRelocatedFlag: params.get("relocated") === "1",
    };
  }, []);
  const isFloatingHost = floatingPaneId !== null;
  const {
    notifyEnabled: relocationNotifyEnabled,
    setNotifyEnabled: setRelocationNotifyEnabled,
    autoSnapEnabled,
    setAutoSnapEnabled,
  } = useRelocationPreferences();
  const [floatingRelocated, setFloatingRelocated] = useState<boolean>(floatingRelocatedFlag);
  useEffect(() => {
    if (!isFloatingHost || !floatingRelocatedFlag) {
      setFloatingRelocated(false);
      return;
    }
    setFloatingRelocated(true);
    const timer = window.setTimeout(() => setFloatingRelocated(false), 2000);
    return () => window.clearTimeout(timer);
  }, [floatingRelocatedFlag, isFloatingHost]);
  const dockingEnabled = runtimeUi?.enableDocking === true && !isFloatingHost;
  console.info(`[playwright] dockingEnabled=${dockingEnabled}`);
  const dockingHotkeysEnabled =
    dockingEnabled && runtimeUi?.hotkeys?.enablePresetHotkeys !== false;
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.__blackskiesDebugLog ??= [];
    const dbg = (scope: string, msg?: string) => {
      window.__blackskiesDebugLog!.push({ scope, msg });
      console.log(`[dbg:${scope}] ${msg ?? ''}`);
    };

    const handleProjectLoaded = (event: Event) => {
      const detail = (event as CustomEvent<string | null | undefined>).detail;
      dbg('project.loaded', String(detail ?? 'null'));
    };
    const handleServiceStatus = (event: Event) => {
      const detail = (event as CustomEvent<'offline' | 'online'>).detail;
      if (detail === 'offline' || detail === 'online') {
        dbg(`insights.service_${detail}`);
      }
    };
    const handleSceneSelection = (event: Event) => {
      const detail = (event as CustomEvent<string | null | undefined>).detail;
      dbg('scene.selected', String(detail ?? 'null'));
    };

    window.addEventListener('test:set-project', handleProjectLoaded);
    window.addEventListener('test:service-status', handleServiceStatus);
    window.addEventListener('test:select-scene', handleSceneSelection);

    window.__test?.markBoot?.();
    const handleError = (event: ErrorEvent) => {
      console.error('[renderer.unhandled]', event.error ?? event.message, event);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('[renderer.unhandledrejection]', event.reason);
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('test:set-project', handleProjectLoaded);
      window.removeEventListener('test:service-status', handleServiceStatus);
      window.removeEventListener('test:select-scene', handleSceneSelection);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
  const {
    status: serviceStatus,
    retry: checkServices,
    isPortUnavailable,
    lastError,
  } = useServiceHealth(
    services,
    isTestEnv ? { intervalMs: 0 } : undefined,
  );
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __serviceHealthRetry?: () => Promise<void> }).__serviceHealthRetry =
        checkServices;
    }
  }, [checkServices]);

  const [currentProject, setCurrentProject] = useState<TrackedLoadedProject | null>(null);
  const currentProjectRef = useRef<LoadedProject | null>(null);
  const pendingSceneSelectionRef = useRef<string | null>(null);
  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const apiWindow = window as typeof window & { __appBootReady?: boolean };
    apiWindow.__appBootReady = true;
    return () => {
      delete apiWindow.__appBootReady;
    };
  }, []);

  const [budgetSnapshot, setBudgetSnapshot] = useState<BudgetMeterProps | null>(null);

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

  const serviceHealthy = serviceStatus === "online" && !isPortUnavailable;
  const {
    indicator: budgetIndicator,
    blocked: budgetBlocked,
    refreshBudget,
    markBudgetBlocked,
  } = useBudgetIndicator({
    services,
    projectId: currentProject?.projectId ?? null,
    serviceHealthy,
    serviceStatus,
    pushToast,
    onBudgetUpdate: applyBudgetUpdate,
  });
  const [activeScene, setActiveScene] = useState<{ id: string; title: string | null } | null>(null);
  const activeSceneId = activeScene?.id ?? null;
  const applySceneSelection = useCallback(
    (requestedSceneId?: string | null) => {
      const scenesList = currentProjectRef.current?.scenes ?? [];
      if (scenesList.length === 0) {
        return false;
      }
      const fallbackScene = scenesList[0] ?? null;
      const targetScene =
        scenesList.find((scene) => scene.id === requestedSceneId) ?? fallbackScene;
      if (!targetScene) {
        return false;
      }
      setActiveScene({ id: targetScene.id, title: targetScene.title ?? null });
      pendingSceneSelectionRef.current = null;
      return true;
    },
    [setActiveScene],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const apiWindow = window as typeof window & {
      __selectSceneForTest?: (sceneId?: string | null) => boolean;
    };
    apiWindow.__selectSceneForTest = (sceneId?: string | null) => {
      pendingSceneSelectionRef.current = sceneId ?? null;
      return applySceneSelection(pendingSceneSelectionRef.current);
    };
    return () => {
      delete apiWindow.__selectSceneForTest;
    };
  }, [applySceneSelection]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string | undefined>;
      const sceneId = customEvent.detail;
      if (typeof sceneId === 'string' && sceneId.length > 0) {
        applySceneSelection(sceneId);
      }
    };
    window.addEventListener('test:select-scene', handler);
    return () => {
      window.removeEventListener('test:select-scene', handler);
    };
  }, [applySceneSelection]);

  useEffect(() => {
    if (pendingSceneSelectionRef.current !== null) {
      applySceneSelection(pendingSceneSelectionRef.current);
    }
  }, [applySceneSelection, currentProject]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
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
  const [exporting, setExporting] = useState<boolean>(false);
  const [snapshotting, setSnapshotting] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [showSnapshotsPanel, setShowSnapshotsPanel] = useState<boolean>(false);
  const openSnapshotsPanel = useCallback(() => {
    // Snapshots panel is minimally wired for Phase 8; this just toggles that dialog.
    setShowSnapshotsPanel(true);
  }, [setShowSnapshotsPanel]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("md");
  const batchJobRef = useRef<{ cancelled: boolean } | null>(null);

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
    resetCritique,
    setInstructions,
    runRewrite,
    applyRewrite,
    discardRewrite,
  } = useCritique({
    services,
    projectSummary,
    activeScene,
    projectDrafts,
    draftEdits,
    setProjectDrafts,
    setDraftEdits,
    setCurrentProject,
    pushToast,
    isMountedRef,
    rubric: critiqueRubric,
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

      const projectWithId: TrackedLoadedProject = { ...project, projectId };
      setCurrentProject(projectWithId);
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
    [
      fetchRecoveryStatus,
      resetCritique,
      setActiveScene,
      setCurrentProject,
      setDraftEdits,
      setProjectDrafts,
      setProjectSummary,
    ],
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
    onBudgetBlock: markBudgetBlocked,
  });

  const handleExportFormatChange = useCallback((nextFormat: ExportFormat) => {
    setExportFormat(nextFormat);
  }, []);

  const handleCreateSnapshot = useCallback(async () => {
    if (snapshotting) {
      return;
    }

    const snapshotApi = services?.createProjectSnapshot;
    if (!snapshotApi) {
      pushToast({
        tone: 'warning',
        title: 'Snapshot unavailable',
        description: 'Local services are not ready.',
      });
      return;
    }

    const projectId = projectSummary?.projectId;
    if (!projectId) {
      pushToast({
        tone: 'warning',
        title: 'Snapshot unavailable',
        description: 'Open a project before creating a snapshot.',
      });
      return;
    }

    setSnapshotting(true);
    try {
      const response = await snapshotApi({ projectId });
      if (!response.ok) {
        pushToast({
          tone: 'error',
          title: 'Snapshot failed',
          description: response.error?.message ?? 'Unable to create snapshot.',
        });
        return;
      }

      const snapshotPath =
        response.data?.path ?? (projectSummary?.path ? `${projectSummary.path}/.snapshots` : undefined);
      const snapshotName = response.data?.snapshot_id ? `Snapshot ${response.data.snapshot_id}` : 'Snapshot saved';

      pushToast({
        tone: 'success',
        title: 'Snapshot created',
        description: snapshotName,
        actions:
          projectSummary?.projectId
          ? [
              {
                label: 'Show snapshots',
                onPress: () => {
                  // Snapshots panel is minimally wired for Phase 8; this only toggles that dialog.
                  setShowSnapshotsPanel(true);
                  if (snapshotPath && services?.revealPath) {
                    void services.revealPath(snapshotPath);
                  }
                },
              },
            ]
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushToast({
        tone: 'error',
        title: 'Snapshot failed',
        description: message,
      });
    } finally {
      setSnapshotting(false);
    }
  }, [
    projectSummary?.path,
    projectSummary?.projectId,
    pushToast,
    services,
    snapshotting,
    setShowSnapshotsPanel,
  ]);

  const handleVerifySnapshots = useCallback(async () => {
    if (verifying) {
      return;
    }

    const verifier = services?.runBackupVerification;
    if (!verifier) {
      pushToast({
        tone: 'warning',
        title: 'Verification unavailable',
        description: 'Local services are not ready.',
      });
      return;
    }

    const projectId = projectSummary?.projectId;
    if (!projectId) {
      pushToast({
        tone: 'warning',
        title: 'Verification unavailable',
        description: 'Open a project before running verification.',
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await verifier({ projectId, latestOnly: true });
      if (!response.ok) {
        pushToast({
          tone: 'error',
          title: 'Verification failed',
          description: response.error?.message ?? 'Unable to verify snapshots.',
        });
        return;
      }

      const snapshotReport = response.data?.snapshots[0];
      const status = snapshotReport?.status ?? 'ok';
      const message =
        status === 'ok'
          ? 'Latest snapshot verified'
          : `${snapshotReport?.errors?.length ?? 1} issue(s) detected`;
      const reportPath = projectSummary?.path
        ? `${projectSummary.path}/.snapshots/last_verification.json`
        : undefined;

      pushToast({
        tone: status === 'ok' ? 'success' : 'warning',
        title: 'Snapshot verification',
        description: message,
        actions:
          reportPath && services?.revealPath
          ? [
              {
                label: 'View report',
                onPress: () => void services.revealPath(reportPath),
              },
            ]
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushToast({
        tone: 'error',
        title: 'Verification failed',
        description: message,
      });
    } finally {
      setVerifying(false);
    }
  }, [projectSummary?.path, projectSummary?.projectId, pushToast, services, verifying]);

  const handleExportProject = useCallback(async () => {
    if (exporting) {
      return;
    }

    const exportApi = services?.exportProject;
    if (!exportApi) {
      pushToast({
        tone: "warning",
        title: "Export unavailable",
        description: "Local services are still starting up.",
      });
      return;
    }

    const projectId = projectSummary?.projectId;
    if (!projectId) {
      pushToast({
        tone: "warning",
        title: "Export unavailable",
        description: "Open a project before exporting.",
      });
      return;
    }

    setExporting(true);
    try {
      const response = await exportApi({
        projectId,
        format: exportFormat,
      });

      if (!response.ok) {
        const message = response.error?.message ?? "Unable to export this project.";
        console.error("Export failed", response.error);
        pushToast({
          tone: "error",
          title: "Export failed",
          description: message,
        });
        return;
      }

      const formatLabel = EXPORT_FORMAT_LABELS[exportFormat] ?? exportFormat;
      const exportPath = response.data?.path ?? "exports/";
      pushToast({
        tone: "success",
        title: "Export complete",
        description: `Exported ${formatLabel} to ${exportPath}`,
        actions:
          services?.revealPath && projectSummary?.path
          ? [
              {
                label: "Reveal export folder",
                onPress: () => void services.revealPath(`${projectSummary.path}/exports`),
              },
            ]
          : undefined,
      });
    } catch (error) {
      console.error("Export request failed", error);
      const message = error instanceof Error ? error.message : String(error);
      pushToast({
        tone: "error",
        title: "Export failed",
        description: message,
      });
    } finally {
      setExporting(false);
    }
  }, [exportFormat, exporting, projectSummary?.path, projectSummary?.projectId, pushToast, services]);

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

  useEffect(() => {
    if (!isFloatingHost || !floatingProjectPath) {
      return;
    }
    const loader = window.projectLoader;
    if (!loader?.loadProject) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await loader.loadProject({ path: floatingProjectPath });
        if (!isMountedRef.current || cancelled) {
          return;
        }
        if (response?.ok) {
          activateProject(response.project);
        } else if (response?.error) {
          const message =
            typeof response.error.message === "string"
              ? response.error.message
              : "Unable to load project for floating pane.";
          pushToast({
            tone: "error",
            title: "Floating pane failed to load project",
            description: message,
          });
        }
      } catch (error) {
        if (!isMountedRef.current || cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        pushToast({
          tone: "error",
          title: "Floating pane failed to load project",
          description: message,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activateProject, floatingProjectPath, isFloatingHost, isMountedRef, pushToast]);

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
      relocationNotifyEnabled={relocationNotifyEnabled}
      autoSnapEnabled={autoSnapEnabled}
      onRelocationNotifyChange={setRelocationNotifyEnabled}
      onAutoSnapChange={setAutoSnapEnabled}
    />
  );

  const allPaneContent: Record<LayoutPaneId, ReactNode> = {
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
        recoveryAvailable={recoveryBannerVisible}
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
  };

  const dockPaneContent: Partial<Record<LayoutPaneId, ReactNode>> = dockingEnabled
    ? allPaneContent
    : {};

  const floatingPaneContent = floatingPaneId ? allPaneContent[floatingPaneId] ?? null : null;

  const workspaceBody = dockingEnabled ? (
    <DockWorkspace
      projectPath={projectSummary?.path ?? null}
      panes={dockPaneContent}
      defaultPreset={defaultDockPreset}
      enableHotkeys={dockingHotkeysEnabled}
      focusCycleOrder={dockingFocusOrder}
      onToast={pushToast}
      relocationNotifyEnabled={relocationNotifyEnabled}
      autoSnapEnabled={autoSnapEnabled}
      onRelocationNotifyChange={setRelocationNotifyEnabled}
      emptyState={
        <div className="dock-workspace__empty-card">
          {renderRecoveryBanner()}
          {renderProjectHome()}
        </div>
      }
    />
  ) : isFloatingHost ? (
    <div className={`floating-pane-shell${floatingRelocated ? " floating-pane-shell--relocated" : ""}`}>
      <div className="dock-pane__content dock-pane__content--floating">
        {floatingPaneContent ?? (
          <div className="floating-pane-shell__empty">
            Pane content unavailable for floating display.
          </div>
        )}
      </div>
    </div>
) : (
    <div className="app-shell__workspace-scroll">
      {renderRecoveryBanner()}
      {renderProjectHome()}
    </div>
  );

  const showServiceHealthBanner = serviceStatus === "offline" && isPortUnavailable;
  const disableExport =
    serviceStatus !== "online" ||
    budgetBlocked ||
    exporting ||
    !projectSummary?.projectId ||
    !services?.exportProject;
  const disableSnapshot =
    disableExport || snapshotting || !services?.createProjectSnapshot;
  const disableVerify =
    disableExport || verifying || !services?.runBackupVerification;
  const disableSnapshots =
    showSnapshotsPanel || !services?.listProjectSnapshots;

  return (
    <div
      id="app-root"
      data-testid="app-root"
      className={`app-shell${dockingEnabled ? " app-shell--dock-enabled" : ""}${
        isFloatingHost ? " app-shell--floating" : ""
      }`}
    >
      {!dockingEnabled && !isFloatingHost && (
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
          projectId={projectSummary?.projectId ?? null}
          serviceStatus={serviceStatus}
          onRetry={checkServices}
          onToggleCompanion={toggleCompanion}
          onGenerate={() => void openPreflight()}
          onCritique={() => void openCritique()}
          onExport={() => void handleExportProject()}
          onSnapshot={() => void handleCreateSnapshot()}
          onVerify={() => void handleVerifySnapshots()}
          onSnapshots={openSnapshotsPanel}
          exportFormat={exportFormat}
          onExportFormatChange={handleExportFormatChange}
          companionOpen={companionOpen}
          disableCompanion={!currentProject}
          disableGenerate={serviceStatus !== "online" || budgetBlocked}
          disableCritique={serviceStatus !== "online" || budgetBlocked}
          disableExport={disableExport}
          disableSnapshot={disableSnapshot}
          disableVerify={disableVerify}
          disableSnapshots={disableSnapshots}
          showSnapshotsPanel={showSnapshotsPanel}
          budget={budgetSnapshot ?? undefined}
          budgetIndicator={budgetIndicator}
        />
        {/* When the service port is missing we surface a single banner with a retry action. */}
        <ServiceHealthBanner
          visible={showServiceHealthBanner}
          serviceStatus={serviceStatus}
          isPortUnavailable={isPortUnavailable}
          errorMessage={lastError?.message ?? null}
          onRetry={checkServices}
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
        serviceStatus={serviceStatus}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        autoDismissMs={isTestEnv ? 0 : undefined}
      />
      {showSnapshotsPanel && projectSummary?.projectId ? (
        <SnapshotsPanel
          projectId={projectSummary.projectId}
          projectPath={projectSummary?.path ?? null}
          services={services}
          serviceStatus={serviceStatus}
          pushToast={pushToast}
          onClose={() => setShowSnapshotsPanel(false)}
        />
      ) : null}

      <CritiqueModal
        isOpen={critiqueState.open}
        loading={critiqueState.loading}
        error={critiqueState.error}
        critique={critiqueState.critique}
        traceId={critiqueState.traceId}
        sceneId={critiqueState.unitId}
        sceneTitle={activeScene?.title ?? null}
        instructions={critiqueState.instructions}
        rewrite={critiqueState.rewrite}
        rewriteLoading={critiqueState.rewriteLoading}
        rewriteError={critiqueState.rewriteError}
        onChangeInstructions={setInstructions}
        onRunRewrite={() => void runRewrite()}
        onApplyRewrite={() => void applyRewrite()}
        onDiscardRewrite={() => discardRewrite()}
        onClose={closeCritique}
        onReject={rejectCritique}
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
  const summary = state.critique?.summary?.trim();
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

export interface HistoryPaneProps {
  recoveryStatus: RecoveryStatusBridgeResponse | null;
  recoveryAction: string;
  recoveryAvailable: boolean;
  lastProjectPath: string | null;
  onRestore: () => void;
  onReopen: () => void;
  onReload: () => void;
}

export function HistoryPane({
  recoveryStatus,
  recoveryAction,
  recoveryAvailable,
  lastProjectPath,
  onRestore,
  onReopen,
  onReload,
}: HistoryPaneProps): JSX.Element {
  const snapshot = recoveryStatus?.last_snapshot;
  const canRestoreSnapshot = recoveryAvailable && recoveryAction === "idle";
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
        {recoveryAvailable ? (
          <button type="button" onClick={onRestore} disabled={!canRestoreSnapshot}>
            Restore snapshot
          </button>
        ) : (
          <p aria-live="polite">No recovery actions pending.</p>
        )}
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
