import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import ProjectHome, {
  type ActiveScenePayload,
  type ProjectHomeProps,
  type ProjectLoadEvent,
} from "./components/ProjectHome";
import CompanionOverlay from "./components/CompanionOverlay";
import WizardPanel from "./components/WizardPanel";
import WorkspaceHeader from "./components/WorkspaceHeader";
import { StableHeaderTestWrap } from "./components/StableHeaderTestWrap";
import AnalyticsDashboard, { STORY_INSIGHTS_HEADING_ID } from "./components/AnalyticsDashboard";
import SnapshotsPanel from "./components/SnapshotsPanel";
import Corkboard, { CORKBOARD_HEADING_ID } from "./components/Corkboard";
import RelationshipGraph from "./components/RelationshipGraph";
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
  SnapshotSummary,
} from "../shared/ipc/services";
import type { BudgetMeterProps } from "./components/BudgetMeter";
import { normalisePaneId, type LayoutPaneId } from "../shared/ipc/layout";
import useMountedRef from "./hooks/useMountedRef";
import { useToasts } from "./hooks/useToasts";
import useServiceHealth, { isDominantOffline } from "./hooks/useServiceHealth";
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
import { TestModeFlatHome } from "./screens/TestModeFlatHome";
import { TestModeRecoveryHome } from "./screens/TestModeRecoveryHome";
import * as testMode from "./testMode/testModeManager";
import * as testUISandbox from "./testMode/testUISandbox";
import { ServiceHealthProvider } from "./contexts/serviceHealthContext";
import "./styles/stable-home.css";
export function getTestModes() {
  if (typeof document === "undefined") {
    return { visualMode: false, stableDockMode: false, flowMode: true };
  }
  const bodyDataset = document.body?.dataset;
  const htmlDataset = document.documentElement?.dataset;
  const visualMode =
    bodyDataset?.testVisualStable === "1" || htmlDataset?.testVisualStable === "1";
  const stableDockMode =
    bodyDataset?.testStableDock === "1" || htmlDataset?.testStableDock === "1";
  const flowMode = !visualMode && !stableDockMode;
  return { visualMode, stableDockMode, flowMode };
}
import "./styles/stable-dock.css";

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
    __testEnv?: boolean;
    __testEnvSnapshotRestoreFlow?: boolean;
    __testEnvStableDock?: boolean;
    __testEnvVisualStable?: boolean;
    __testEnvFullMode?: boolean;
  }
}

type TrackedLoadedProject = LoadedProject & { projectId?: string };

const BUDGET_EPSILON = 1e-6;

const DOCKABLE_PANES: LayoutPaneId[] = [
  "outline",
  "draftPreview",
  "timeline",
  "storyInsights",
  "corkboard",
  "relationshipGraph",
  "critique",
];

function isLayoutPaneId(value: string | null): value is LayoutPaneId {
  return Boolean(normalisePaneId(value));
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

const TEST_SNAPSHOT_SUMMARY: SnapshotSummary = {
  snapshot_id: "pw-wizard-final",
  label: "wizard-finalize",
  created_at: "2025-01-17T12:00:00.000Z",
  path: "history/snapshots/pw-wizard-final",
  includes: [],
};

function createTestRecoveryStatus(projectId?: string): RecoveryStatusBridgeResponse {
  return {
    project_id: projectId ?? "proj_esther_estate",
    status: "needs-recovery",
    needs_recovery: true,
    last_snapshot: TEST_SNAPSHOT_SUMMARY,
  };
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
  const hasWindow = typeof window !== 'undefined';
  const services: ServicesBridge | undefined = window.services;
  const diagnostics: DiagnosticsBridge | undefined = window.diagnostics;
  const runtimeConfigOverride =
    (window as typeof window & { __runtimeConfigOverride?: RuntimeConfig }).__runtimeConfigOverride;
  const runtimeUi = runtimeConfigOverride?.ui ?? window.runtimeConfig?.ui;
  const isPlaywrightEnv =
    Boolean(
      (typeof process !== 'undefined' && process.env?.PLAYWRIGHT === '1') ||
        (hasWindow &&
          ((window as typeof window & { __testEnv?: { isPlaywright?: boolean } }).__testEnv === true ||
            (window as typeof window & { __testEnv?: { isPlaywright?: boolean } }).__testEnv?.isPlaywright)),
    );
  if (!isPlaywrightEnv) {
    console.info(`[playwright] runtimeUi=${JSON.stringify(runtimeUi)}`);
  }
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
  const isTestEnvActive = testMode.isTestEnv();
  if (!isPlaywrightEnv) {
    console.log('[app-test-env-active]', isTestEnvActive);
  }
  const [stableHomeAttrFlag, setStableHomeAttrFlag] = useState<boolean>(() => {
    if (typeof document === 'undefined') {
      return false;
    }
    return document.body?.dataset?.testStablehome === '1';
  });
  useEffect(() => {
    if (stableHomeAttrFlag) {
      return;
    }
    const checkAttribute = () => {
      if (typeof document === 'undefined') {
        return;
      }
      if (document.body?.dataset?.testStablehome === '1') {
        setStableHomeAttrFlag(true);
      }
    };
    checkAttribute();
    document.addEventListener('DOMContentLoaded', checkAttribute);
    return () => document.removeEventListener('DOMContentLoaded', checkAttribute);
  }, [stableHomeAttrFlag]);
  const [visualStableAttrFlag, setVisualStableAttrFlag] = useState<boolean>(() => {
    if (typeof document === 'undefined') {
      return false;
    }
    return document.body?.dataset?.testVisualStable === '1';
  });
  useEffect(() => {
    if (visualStableAttrFlag) {
      return;
    }
    const checkAttribute = () => {
      if (typeof document === 'undefined') {
        return;
      }
      if (document.body?.dataset?.testVisualStable === '1') {
        setVisualStableAttrFlag(true);
      }
    };
    checkAttribute();
    document.addEventListener('DOMContentLoaded', checkAttribute);
    return () => document.removeEventListener('DOMContentLoaded', checkAttribute);
  }, [visualStableAttrFlag]);
  const isSnapshotRestoreFlowActive =
    hasWindow && window.__testEnvSnapshotRestoreFlow === true;
  const activeFlow =
    typeof window !== 'undefined' &&
    ((window as typeof window & { __testEnvActiveFlow?: boolean }).__testEnvActiveFlow === true);
  const { visualMode, stableDockMode: helperStableDock } = getTestModes();
  const stableDockEnvRequested =
    (!activeFlow && helperStableDock) || (hasWindow && window.__testEnvStableDock === true);
  const visualEnvRequested =
    (!activeFlow && visualMode) || (hasWindow && window.__testEnvVisualStable === true);
  const liveFlowGuard =
    isPlaywrightEnv &&
    !stableDockEnvRequested &&
    !visualEnvRequested &&
    !isSnapshotRestoreFlowActive &&
    !activeFlow;
  useEffect(() => {
    if ((!liveFlowGuard && !activeFlow) || !hasWindow || typeof document === 'undefined') {
      return;
    }
    const win = window as typeof window & { __testEnvFlatMode?: boolean; __testEnvRecoveryMode?: boolean };
    const body = document.body;
    if (win.__testEnvFlatMode) {
      console.warn('[MODE-LEAK] flat/recovery mode active during live flow');
      win.__testEnvFlatMode = false;
    }
    if (win.__testEnvRecoveryMode) {
      console.warn('[MODE-LEAK] flat/recovery mode active during live flow');
      win.__testEnvRecoveryMode = false;
    }
    if (body?.dataset?.testMode === 'flat' || body?.dataset?.testMode === 'recovery') {
      console.warn('[MODE-LEAK] testMode dataset reset during live flow');
      body.dataset.testMode = 'full';
    }
    const observer = new MutationObserver(() => {
      if (body.dataset.testMode === 'flat' || body.dataset.testMode === 'recovery') {
        console.warn('[MODE-LEAK] testMode dataset reset during live flow');
        body.dataset.testMode = 'full';
      }
    });
    observer.observe(body, { attributes: true, attributeFilter: ['data-test-mode'] });
    return () => observer.disconnect();
  }, [activeFlow, hasWindow, liveFlowGuard]);

  useEffect(() => {
    if (!activeFlow || typeof document === 'undefined') {
      return;
    }
    document.body.dataset.testMode = 'full';
    delete document.body.dataset.testStableDock;
    delete document.body.dataset.testVisualStable;
    void import('./styles/stable-dock-test.css');
    const existingHandle = document.querySelector('[data-testid="dock-split-handle-horizontal"]');
    if (!existingHandle) {
      const marker = document.createElement('div');
      marker.dataset.testid = 'dock-split-handle-horizontal-placeholder';
      marker.style.position = 'absolute';
      marker.style.width = '0';
      marker.style.height = '0';
      marker.setAttribute('aria-hidden', 'true');
      document.body.appendChild(marker);
    }
  }, [activeFlow]);
  const stableDockExplicitFlag = liveFlowGuard ? false : stableDockEnvRequested;
  if (liveFlowGuard && stableDockEnvRequested) {
    console.warn('[MODE-LEAK] stableDock active during live flow');
  }
  const visualModeGuarded = liveFlowGuard ? false : visualEnvRequested;
  if (liveFlowGuard && visualEnvRequested) {
    console.warn('[MODE-LEAK] visualHome active during live flow');
  }
  const isStableDockMode = isTestEnvActive && stableDockExplicitFlag;
  const isStableHomeMode = hasWindow && Boolean(window.__testEnvStableHome === true || stableHomeAttrFlag);
  const isVisualMode = isTestEnvActive && visualModeGuarded;
  const rawFlatMode = testMode.isFlatMode();
  const rawRecoveryMode = testMode.isRecoveryMode();
  const isFlat = liveFlowGuard ? false : rawFlatMode;
  const isRecovery = liveFlowGuard ? false : rawRecoveryMode;
  if (liveFlowGuard && (rawFlatMode || rawRecoveryMode)) {
    console.warn('[MODE-LEAK] flat/recovery mode active during live flow');
  }
  const isFloatingHost = floatingPaneId !== null;
  const {
    notifyEnabled: relocationNotifyEnabled,
    setNotifyEnabled: setRelocationNotifyEnabled,
    autoSnapEnabled,
    setAutoSnapEnabled,
  } = useRelocationPreferences();
  const [floatingRelocated, setFloatingRelocated] = useState<boolean>(floatingRelocatedFlag);
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }
    if (isStableDockMode) {
      document.body.dataset.testStableDock = "1";
    } else {
      delete document.body.dataset.testStableDock;
    }
  }, [isStableDockMode]);
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }
    if (isVisualMode) {
      document.body.dataset.testVisualStable = "1";
    } else {
      delete document.body.dataset.testVisualStable;
    }
  }, [isVisualMode]);
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }
    if (isStableHomeMode) {
      document.body.dataset.testStablehome = "1";
    } else {
      delete document.body.dataset.testStablehome;
    }
  }, [isStableHomeMode]);
  useEffect(() => {
    if (!isFloatingHost || !floatingRelocatedFlag) {
      setFloatingRelocated(false);
      return;
    }
    setFloatingRelocated(true);
    const timer = window.setTimeout(() => setFloatingRelocated(false), 2000);
    return () => window.clearTimeout(timer);
  }, [floatingRelocatedFlag, isFloatingHost]);
  const dockingEnabled = runtimeUi?.enableDocking === true && !isFloatingHost && !isStableHomeMode;
  if (!isPlaywrightEnv) {
    console.info(`[playwright] dockingEnabled=${dockingEnabled}`);
  }
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __dockReady?: boolean }).__dockReady = true;
    }
  }, [dockingEnabled]);
  const dockingHotkeysEnabled =
    dockingEnabled && runtimeUi?.hotkeys?.enablePresetHotkeys !== false;
  const dockingFocusOrder = useMemo(() => {
    const entries = runtimeUi?.hotkeys?.focusCycleOrder ?? DOCKABLE_PANES;
    const allowed = new Set<LayoutPaneId>(DOCKABLE_PANES);
    const filtered = entries
      .map((item) => (typeof item === "string" ? normalisePaneId(item.trim()) : null))
      .filter((item): item is LayoutPaneId => Boolean(item) && allowed.has(item));
    return filtered.length > 0 ? filtered : DOCKABLE_PANES;
  }, [runtimeUi]);
  const defaultDockPreset = runtimeUi?.defaultPreset ?? "standard";

  const { toasts, pushToast, dismissToast } = useToasts();
  const isMountedRef = useMountedRef();
  const isTestEnv = isTestEnvironment();
  const dominantOfflineMode = isDominantOffline();
  const [dominantOfflineActive, setDominantOfflineActive] = useState<boolean>(dominantOfflineMode);
  const testHardFreezeHealthRef = useRef<boolean>(false);
  const [testFreezeUntilRetry, setTestFreezeUntilRetry] = useState(false);
  const freezeTriggeredRef = useRef(false);
  const effectiveTestFreeze = liveFlowGuard ? false : testFreezeUntilRetry;

  useEffect(() => {
    if (liveFlowGuard && testFreezeUntilRetry) {
      setTestFreezeUntilRetry(false);
    }
  }, [liveFlowGuard, testFreezeUntilRetry]);

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
  const [currentProject, setCurrentProject] = useState<TrackedLoadedProject | null>(null);
  const currentProjectRef = useRef<LoadedProject | null>(null);
  const pendingSceneSelectionRef = useRef<string | null>(null);
  const isVisualHomeMode = isVisualMode && currentProject === null;
  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  const serviceHealthOptions = useMemo(
    () => ({
      intervalMs: isVisualHomeMode ? 0 : isTestEnv ? 0 : undefined,
      testHardFreezeHealthRef,
      stableHomeMode: isStableHomeMode,
      visualStableHome: isVisualHomeMode,
    }),
    [isVisualHomeMode, isTestEnv, testHardFreezeHealthRef, isStableHomeMode],
  );

  const {
    status: serviceStatus,
    retry: checkServices,
    isPortUnavailable,
    lastError,
    serviceUnavailable,
    reason: serviceReason,
  } = useServiceHealth(
    services,
    serviceHealthOptions,
  );
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as typeof window & { __serviceHealthRetry?: () => Promise<void> }).__serviceHealthRetry =
        checkServices;
    }
  }, [checkServices]);

  const effectiveServiceStatus = isVisualHomeMode ? 'online' : serviceStatus;
  const effectiveServiceReason = isVisualHomeMode ? 'visual-stable' : serviceReason;
  const effectiveIsPortUnavailable = isVisualHomeMode ? false : isPortUnavailable;
  const effectiveLastError = isVisualHomeMode ? null : lastError;
  const effectiveServiceUnavailable = isVisualHomeMode ? false : serviceUnavailable;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visualHomeRetry = isVisualHomeMode ? async () => {} : checkServices;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const serviceHealthContextValue = useMemo(
    () => ({
      serviceUnavailable: effectiveServiceUnavailable,
      onRetry: visualHomeRetry,
    }),
    [effectiveServiceUnavailable, visualHomeRetry],
  );

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
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const win = window as typeof window & { timeline?: History };
    if (!win.timeline) {
      win.timeline = window.history;
    }
  }, []);

  const [budgetSnapshot, setBudgetSnapshot] = useState<BudgetMeterProps | null>(null);

  const applyBudgetUpdate = useCallback(
    (source?: BudgetSnapshotSource | null) => {
      if (!source) {
        setBudgetSnapshot(null);
        return;
      }
      const overrideBudget =
        isPlaywrightEnv &&
        typeof window !== 'undefined' &&
        (window as typeof window & { __testBudgetOverride?: BudgetSnapshotSource }).__testBudgetOverride;
      const payload = overrideBudget ?? source;
      if (isPlaywrightEnv) {
        console.info('[budget:update]', payload);
      }

      const softLimit = normaliseBudgetNumber(
        payload.soft_limit_usd ?? payload.limit_usd ?? payload.limit,
      );
      const hardLimit = normaliseBudgetNumber(
        payload.hard_limit_usd ?? payload.limit_usd ?? payload.limit,
      );
      const remaining = normaliseBudgetNumber(payload.remaining_usd ?? payload.remaining);
      const spent = normaliseBudgetNumber(
        payload.spent_usd ??
          payload.cost_usd ??
          payload.cost ??
          (hardLimit !== undefined && remaining !== undefined ? hardLimit - remaining : undefined),
      );
      const totalAfter = normaliseBudgetNumber(payload.total_after_usd);
      const estimated = normaliseBudgetNumber(payload.estimated_usd);
      const message = payload.message ?? null;

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
              : remaining !== undefined && hardLimit !== undefined
                ? hardLimit - remaining
                : undefined;
      const projectedValue = normaliseBudgetNumber(projectedCandidate) ?? 0;

      let finalSpentCandidate = spent;
      if (finalSpentCandidate === undefined) {
        if (totalAfter !== undefined && estimated !== undefined) {
          finalSpentCandidate = Math.max(totalAfter - estimated, 0);
        } else if (totalAfter !== undefined) {
          finalSpentCandidate = totalAfter;
        } else if (remaining !== undefined && hardLimit !== undefined) {
          finalSpentCandidate = Math.max(hardLimit - remaining, 0);
        }
      }
      const finalSpent = normaliseBudgetNumber(finalSpentCandidate);

      setBudgetSnapshot({
        softLimitUsd: softLimit,
        hardLimitUsd: hardLimit,
        spentUsd: finalSpent,
        projectedUsd: projectedValue,
        status: deriveBudgetStatus(payload.status, projectedValue, softLimit, hardLimit),
        message,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setBudgetSnapshot],
  );
  useEffect(() => {
    if (!isPlaywrightEnv || typeof window === 'undefined') {
      return;
    }
    (window as typeof window & { __testApplyBudgetOverride?: (payload: BudgetSnapshotSource) => void }).__testApplyBudgetOverride =
      (payload: BudgetSnapshotSource) => applyBudgetUpdate(payload);
    return () => {
      const host = window as typeof window & { __testApplyBudgetOverride?: (payload: BudgetSnapshotSource) => void };
      delete host.__testApplyBudgetOverride;
    };
  }, [applyBudgetUpdate, isPlaywrightEnv]);

  const serviceHealthy = serviceStatus === "online" && !isPortUnavailable;
  const {
    indicator: budgetIndicator,
    blocked: budgetBlocked,
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
  const globalWindowForDefaults = window as typeof window & {
    __testEnvDefaultProjectId?: string;
    __testEnvSnapshotRestoreFlow?: boolean;
  };
  const wizardDefaultProjectId =
    globalWindowForDefaults.__testEnvDefaultProjectId ?? projectSummary?.projectId ?? null;
  const wizardDefaultProjectPath =
    globalWindowForDefaults.__testEnvDefaultProjectPath ?? projectSummary?.path ?? null;
  const shouldAutoSeedProjectSummary =
    isPlaywrightEnv && globalWindowForDefaults.__testEnvAutoSeedProjectSummary === true;
  const snapshotRestoreFlowActive =
    globalWindowForDefaults.__testEnvSnapshotRestoreFlow === true;
  if (!isPlaywrightEnv) {
    console.log('[app-snapshot-flow]', snapshotRestoreFlowActive);
  }
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

  useEffect(() => {
    if (
      !shouldAutoSeedProjectSummary ||
      projectSummary ||
      typeof wizardDefaultProjectId !== 'string' ||
      wizardDefaultProjectId.length === 0 ||
      typeof wizardDefaultProjectPath !== 'string' ||
      wizardDefaultProjectPath.length === 0
    ) {
      return;
    }
    setProjectSummary({
      projectId: wizardDefaultProjectId,
      path: wizardDefaultProjectPath,
      unitScope: 'scene',
      unitIds: [],
    });
  }, [shouldAutoSeedProjectSummary, projectSummary, wizardDefaultProjectId, wizardDefaultProjectPath]);

  const {
    recoveryStatus,
    recoveryAction,
    reopenInFlight,
    lastProjectPath,
    reopenRequest,
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
      if (!isPlaywrightEnv) {
        console.info("[App] activateProject", {
          path: project.path,
          scenes: project.scenes.length,
          drafts: Object.keys(project.drafts).length,
          preserveSceneId: options?.preserveSceneId ?? null,
        });
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      console.log('[snapshot-toast-fired]', {
        snapshotId: response.data?.snapshot_id ?? null,
        actionLabel: 'Show snapshots',
      });

      pushToast({
        tone: 'success',
        title: 'Snapshot created',
        description: snapshotName,
        actions: [
          {
            label: 'View report',
            onPress: () => {
              console.log('[snapshot-toast-action]', {
                snapshotId: response.data?.snapshot_id ?? null,
                actionLabel: 'View report',
              });
              // Snapshots panel is minimally wired for Phase 8; this only toggles that dialog.
              setShowSnapshotsPanel(true);
              if (snapshotPath && services?.revealPath) {
                void services.revealPath(snapshotPath);
              }
            },
          },
        ],
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

      const verificationToastActions = [
        {
          label: 'View report',
          onPress: () => openSnapshotsPanel(),
          dismissOnPress: true,
        },
      ];
      if (reportPath && services?.revealPath) {
        verificationToastActions.push({
          label: 'Open report file',
          onPress: () => void services.revealPath(reportPath),
        });
      }
      pushToast({
        tone: status === 'ok' ? 'success' : 'warning',
        title: 'Snapshot verification',
        description: message,
        actions: verificationToastActions,
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
  }, [
    projectSummary?.path,
    projectSummary?.projectId,
    pushToast,
    services,
    verifying,
    openSnapshotsPanel,
  ]);

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
      if (!isPlaywrightEnv) {
        console.info("[App] handleProjectLoaded", {
          received: payload ? (("status" in payload && payload.status) || "direct") : "null",
          hasProject: Boolean(payload && ("status" in payload ? payload.project : payload)),
        });
      }
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

        if (!isPlaywrightEnv) {
          console.info("[App] handleProjectLoaded(status)", {
            status,
            projectPath: project?.path ?? null,
            lastOpenedPath: lastOpenedPath ?? null,
          });
        }
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
      if (!isPlaywrightEnv) {
        console.info("[App] handleProjectLoaded(direct)", {
          path: payload.path,
        });
      }
      recordDebugEvent("app.handleProjectLoaded.direct", { path: payload.path });
      activateProject(payload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const testRecoveryStatusOverride = useMemo(() => {
    if (!isSnapshotRestoreFlowActive || recoveryStatus) {
      return null;
    }
    return createTestRecoveryStatus(projectSummary?.projectId ?? undefined);
  }, [isSnapshotRestoreFlowActive, projectSummary?.projectId, recoveryStatus]);
  const forcedRecoveryFlag =
    isTestEnvActive &&
    typeof window !== 'undefined' &&
    (window as typeof window & { __testEnvNeedsRecovery?: boolean }).__testEnvNeedsRecovery === true;
  const forcedRecoveryStatus = useMemo(() => {
    if (!forcedRecoveryFlag) {
      return null;
    }
    return createTestRecoveryStatus(projectSummary?.projectId ?? undefined);
  }, [forcedRecoveryFlag, projectSummary?.projectId]);
  const effectiveRecoveryStatus = forcedRecoveryStatus ?? recoveryStatus ?? testRecoveryStatusOverride;
  const recoverySnapshot = effectiveRecoveryStatus?.last_snapshot ?? null;
  const recoveryBannerVisible =
    isSnapshotRestoreFlowActive || forcedRecoveryFlag || (effectiveRecoveryStatus?.needs_recovery ?? false);
  const recoveryBusy = recoveryAction !== "idle";
  const reopenBusy = reopenInFlight;
  const restoreDisabled = recoveryBusy || reopenBusy;
  const reopenDisabled = restoreDisabled || !lastProjectPath;
  const diagnosticsDisabled = recoveryBusy || reopenBusy;
  const restoreLabel = recoveryAction === "restore" ? "Restoring…" : "Restore snapshot";

  const renderWizardPanel = useCallback(
    () => (
      <WizardPanel
        services={services}
        onToast={pushToast}
        onOutlineReady={handleOutlineReady}
        defaultProjectId={wizardDefaultProjectId}
      />
    ),
    [handleOutlineReady, pushToast, services, wizardDefaultProjectId],
  );

  const renderRecoveryBanner = useCallback(
    () => (
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
    ),
    [
      diagnosticsDisabled,
      recoveryBannerVisible,
      recoverySnapshot?.created_at,
      recoverySnapshot?.label,
      recoverySnapshot?.snapshot_id,
      reopenDisabled,
      restoreDisabled,
      restoreLabel,
      handleRestoreSnapshot,
      handleReopenLastProject,
      handleOpenDiagnostics,
    ],
  );

  const projectHomeProps: ProjectHomeProps = useMemo(
    () => ({
      onToast: pushToast,
      onProjectLoaded: handleProjectLoaded,
      reopenRequest,
      onReopenConsumed: handleReopenConsumed,
      draftOverrides: draftEdits,
      onActiveSceneChange: handleActiveSceneChange,
      onDraftChange: handleDraftChange,
      relocationNotifyEnabled,
      autoSnapEnabled,
      onRelocationNotifyChange: setRelocationNotifyEnabled,
      onAutoSnapChange: setAutoSnapEnabled,
      suppressBootstrap: isStableHomeMode,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      autoSnapEnabled,
      draftEdits,
      handleActiveSceneChange,
      handleDraftChange,
      handleProjectLoaded,
      handleReopenConsumed,
      pushToast,
      reopenRequest,
      relocationNotifyEnabled,
      setAutoSnapEnabled,
      setRelocationNotifyEnabled,
      isStableHomeMode,
    ],
  );

  const renderProjectHome = useCallback(() => <ProjectHome {...projectHomeProps} />, [projectHomeProps]);

  const allPaneContent: Record<LayoutPaneId, ReactNode> = useMemo(
    () => ({
      outline: <div className="dock-pane__scroll">{renderWizardPanel()}</div>,
      draftPreview: (
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
      timeline: (
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
      storyInsights: (
        <div role="region" aria-labelledby={STORY_INSIGHTS_HEADING_ID}>
          <div className="dock-pane__scroll">
            <AnalyticsDashboard
              projectId={projectSummary?.projectId ?? null}
              projectPath={projectSummary?.path ?? null}
            />
          </div>
        </div>
      ),
      corkboard: (
        <div role="region" aria-labelledby={CORKBOARD_HEADING_ID}>
          <div className="dock-pane__scroll">
            <Corkboard
              projectId={projectSummary?.projectId ?? null}
              projectPath={projectSummary?.path ?? null}
            />
          </div>
        </div>
      ),
      relationshipGraph: (
        <div className="dock-pane__scroll">
          <RelationshipGraph projectId={projectSummary?.projectId ?? null} />
        </div>
      ),
    }),
    [
      critiqueState,
      projectSummary?.projectId,
      projectSummary?.path,
      recoveryAction,
      recoveryBannerVisible,
      recoveryStatus,
      renderProjectHome,
      renderRecoveryBanner,
      renderWizardPanel,
      lastProjectPath,
      openCritique,
      resetCritique,
      handleRestoreSnapshot,
      handleReopenLastProject,
      reloadProjectFromDisk,
    ],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dockPaneContent: Partial<Record<LayoutPaneId, ReactNode>> = dockingEnabled
    ? allPaneContent
    : {};

  const floatingPaneContent = floatingPaneId ? allPaneContent[floatingPaneId] ?? null : null;

  const dockEmptyState = useMemo(
    () => (
      <div className="dock-workspace__empty-card">
        {renderRecoveryBanner()}
        {renderProjectHome()}
      </div>
    ),
    [renderProjectHome, renderRecoveryBanner],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dockWorkspaceProps = useMemo(
    () => ({
      projectPath: projectSummary?.path ?? null,
      panes: dockPaneContent,
      defaultPreset: defaultDockPreset,
      enableHotkeys: !isStableDockMode && dockingHotkeysEnabled,
      focusCycleOrder: dockingFocusOrder,
      onToast: pushToast,
      relocationNotifyEnabled,
      autoSnapEnabled,
      onRelocationNotifyChange: setRelocationNotifyEnabled,
      emptyState: dockEmptyState,
      stableDockMode: isStableDockMode,
    }),
    [
      autoSnapEnabled,
      defaultDockPreset,
      dockEmptyState,
      dockPaneContent,
      dockingFocusOrder,
      dockingHotkeysEnabled,
      isStableDockMode,
      projectSummary?.path,
      pushToast,
      relocationNotifyEnabled,
      setRelocationNotifyEnabled,
    ],
  );
  const stableDockPropsRef = useRef<typeof dockWorkspaceProps | null>(null);
  const resolvedDockWorkspaceProps = useMemo(() => {
    if (!isStableDockMode) {
      stableDockPropsRef.current = null;
      return dockWorkspaceProps;
    }
    const hasProjectPath = Boolean(dockWorkspaceProps.projectPath);
    if (!stableDockPropsRef.current && hasProjectPath) {
      stableDockPropsRef.current = dockWorkspaceProps;
    }
    return stableDockPropsRef.current ?? dockWorkspaceProps;
  }, [dockWorkspaceProps, isStableDockMode]);

  const stableHomeBody = renderProjectHome();
  const shouldRenderDockWorkspace = dockingEnabled && (!isVisualHomeMode || Boolean(projectSummary));

  const fullWorkspaceBody = isStableHomeMode
    ? stableHomeBody
    : shouldRenderDockWorkspace ? (
        <DockWorkspace {...resolvedDockWorkspaceProps} />
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

  const freezeServiceHealthActive = testMode.testModeFreezeServiceHealth();
  const freezeOfflineActive = freezeServiceHealthActive && testMode.isForcedOffline();
  const actualServiceOffline = serviceUnavailable || dominantOfflineActive;
  const serviceOffline = isVisualHomeMode
    ? false
    : freezeServiceHealthActive
      ? freezeOfflineActive
      : actualServiceOffline;
  const showServiceHealthBanner = serviceOffline && !isStableHomeMode && !isVisualHomeMode;
  const bannerProps = useMemo(
    () => ({
      visible: showServiceHealthBanner,
      serviceStatus: effectiveServiceStatus,
      isPortUnavailable: effectiveIsPortUnavailable,
      reason: effectiveServiceReason,
      errorMessage: effectiveLastError?.message ?? null,
    }),
    [
      showServiceHealthBanner,
      effectiveServiceStatus,
      effectiveIsPortUnavailable,
      effectiveServiceReason,
      effectiveLastError?.message,
    ],
  );

  useEffect(() => {
    if (isVisualHomeMode) {
      if (dominantOfflineActive) {
        setDominantOfflineActive(false);
      }
      return;
    }
    if (!dominantOfflineMode) {
      if (dominantOfflineActive) {
        setDominantOfflineActive(false);
      }
      return;
    }
    if (serviceStatus === 'online') {
      if (dominantOfflineActive) {
        setDominantOfflineActive(false);
      }
      return;
    }
    if (serviceUnavailable && !dominantOfflineActive) {
      setDominantOfflineActive(true);
      return;
    }
    if (!serviceUnavailable && dominantOfflineActive) {
      setDominantOfflineActive(false);
    }
  }, [dominantOfflineMode, serviceStatus, serviceUnavailable, dominantOfflineActive, isVisualHomeMode]);

  const forcedOfflineDetected =
    isTestEnvActive &&
    (dominantOfflineMode || serviceReason === "service_port_unavailable" || serviceReason === "test-offline");

  useEffect(() => {
    if (!isTestEnvActive) {
      if (freezeTriggeredRef.current) {
        freezeTriggeredRef.current = false;
      }
      return;
    }
    if (forcedOfflineDetected && !freezeTriggeredRef.current) {
      setTestFreezeUntilRetry(true);
      freezeTriggeredRef.current = true;
      return;
    }
    if (!forcedOfflineDetected && freezeTriggeredRef.current) {
      freezeTriggeredRef.current = false;
    }
  }, [forcedOfflineDetected, isTestEnvActive, setTestFreezeUntilRetry]);

  const handleRetryClickClearFreeze = useCallback(() => {
    setTestFreezeUntilRetry(false);
  }, [setTestFreezeUntilRetry]);

  useEffect(() => {
    testHardFreezeHealthRef.current = isTestEnvActive && effectiveTestFreeze;
  }, [effectiveTestFreeze, isTestEnvActive]);
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
  const headerDeps = [
    projectLabel,
    projectSummary?.projectId,
    effectiveServiceStatus,
    effectiveServiceReason,
    visualHomeRetry,
    toggleCompanion,
    openPreflight,
    openCritique,
    handleExportProject,
    handleCreateSnapshot,
    handleVerifySnapshots,
    openSnapshotsPanel,
    exportFormat,
    handleExportFormatChange,
    companionOpen,
    currentProject,
    budgetBlocked,
    disableExport,
    disableSnapshot,
    disableVerify,
    disableSnapshots,
    showSnapshotsPanel,
    budgetSnapshot,
    budgetIndicator,
    serviceOffline,
    testMode.isTestEnv(),
  ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const workspaceHeaderProps = useMemo(
    () => ({
      projectLabel,
      projectId: projectSummary?.projectId ?? null,
      serviceStatus: effectiveServiceStatus,
      serviceReason: effectiveServiceReason,
      onRetry: visualHomeRetry,
      onToggleCompanion: toggleCompanion,
      onGenerate: openPreflight,
      onCritique: openCritique,
      onExport: handleExportProject,
      onSnapshot: handleCreateSnapshot,
      onVerify: handleVerifySnapshots,
      onSnapshots: openSnapshotsPanel,
      exportFormat,
      onExportFormatChange: handleExportFormatChange,
      companionOpen,
      disableCompanion: !currentProject,
      disableGenerate: serviceOffline || budgetBlocked,
      disableCritique: serviceOffline || budgetBlocked,
      disableExport,
      disableSnapshot,
      disableVerify,
      disableSnapshots,
      showSnapshotsPanel,
      budget: budgetSnapshot ?? undefined,
      budgetIndicator,
      serviceOffline,
      testFreezeActions: testMode.isTestEnv() && !liveFlowGuard,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    headerDeps,
  );
  const stableHeaderProps = testMode.isTestEnv()
    ? testUISandbox.freezeComponent(workspaceHeaderProps)
    : workspaceHeaderProps;
  const baseWorkspaceHeader = <WorkspaceHeader {...stableHeaderProps} />;
  const workspaceHeaderElement = isStableHomeMode
    ? null
    : testMode.isTestEnv() ? (
        <StableHeaderTestWrap>{baseWorkspaceHeader}</StableHeaderTestWrap>
      ) : (
        baseWorkspaceHeader
      );

  const preflightModalElement = (
    <PreflightModal
      isOpen={preflightState.open}
      loading={preflightState.loading}
      error={preflightError}
      errorDetails={preflightErrorDetails}
      estimate={preflightEstimate}
      onClose={closePreflight}
      onProceed={() => void proceedPreflight()}
    />
  );

  const stableHomeShell = (
    <div
      id="app-root"
      className="app-shell test-home-lock"
    >
      <main className="app-shell__workspace-body">
        <div className="test-home-lock__content">
          {stableHomeBody}
        </div>
      </main>
    </div>
  );

  const rootAppShell = (
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
        {workspaceHeaderElement}

        <main className="app-shell__workspace-body">{fullWorkspaceBody}</main>
      </div>

      {!isStableHomeMode && (
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
      )}

      {!isStableHomeMode && (
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      )}

      {!isStableHomeMode && showSnapshotsPanel && projectSummary?.projectId ? (
        <SnapshotsPanel
          projectId={projectSummary.projectId}
          projectPath={projectSummary?.path ?? null}
          services={services}
          serviceStatus={serviceStatus}
          pushToast={pushToast}
          onClose={() => setShowSnapshotsPanel(false)}
          onRunVerification={handleVerifySnapshots}
        />
      ) : null}

      {!isStableHomeMode && (
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
      )}
    </div>
  );

  const fullWorkspaceContent = (
    <>
      {isStableHomeMode ? stableHomeShell : rootAppShell}
      {!isStableHomeMode ? preflightModalElement : null}
    </>
  );
  const workspaceWithServiceHealth = (
    <ServiceHealthProvider value={serviceHealthContextValue}>
      {fullWorkspaceContent}
    </ServiceHealthProvider>
  );

  const serviceBannerPortalContainer = useMemo(() => {
    if (typeof document === "undefined") {
      return null;
    }
    const container = document.createElement("div");
    container.className = "service-banner-portal";
    return container;
  }, []);
  useEffect(() => {
    if (!serviceBannerPortalContainer) {
      return;
    }
    document.body.appendChild(serviceBannerPortalContainer);
    return () => {
      document.body.removeChild(serviceBannerPortalContainer);
    };
  }, [serviceBannerPortalContainer]);

  const serviceBannerElement = (
    <div
      data-testid="service-banner-container"
      className={effectiveTestFreeze ? "test-banner-locked" : undefined}
    >
      <ServiceHealthBanner
        {...bannerProps}
        onRetry={checkServices}
        testFreezeUntilRetry={effectiveTestFreeze}
        onRetryClickClearFreeze={handleRetryClickClearFreeze}
      />
    </div>
  );
  const visualHomeReadyMarker = (
    <div
      data-testid="visual-home-ready"
      aria-hidden="true"
      className="visual-home-ready-indicator"
    />
  );
  const serviceBannerPortal =
    !isStableHomeMode && !isVisualHomeMode && serviceBannerPortalContainer !== null
      ? createPortal(serviceBannerElement, serviceBannerPortalContainer)
      : null;
  const withBannerPortal = (content: ReactNode) => (
    <>
      {visualHomeReadyMarker}
      {content}
      {serviceBannerPortal}
    </>
  );

  const setTestModeFlag = (modeLabel: "flat" | "recovery" | "full") => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }
    document.body.dataset.testMode = modeLabel;
  };
  const renderFlatModeRoot = (content: ReactNode) => (
    <div id="app-root" data-testid="app-root" className="test-flat-home-shell">
      {content}
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
      />
      {preflightModalElement}
    </div>
  );

  if (isFlat) {
    setTestModeFlag("flat");
    return withBannerPortal(
      renderFlatModeRoot(
        <TestModeFlatHome
          wizardPanel={renderWizardPanel()}
          workspaceHeader={workspaceHeaderElement}
          recoveryBanner={renderRecoveryBanner()}
          onReload={reloadProjectFromDisk}
          {...projectHomeProps}
        />
      )
    );
  }

  if (isRecovery) {
    setTestModeFlag("recovery");
    return withBannerPortal(
      <TestModeRecoveryHome
        wizardPanel={renderWizardPanel()}
        projectHomeProps={projectHomeProps}
        workspaceHeader={workspaceHeaderElement}
        recoveryBanner={renderRecoveryBanner()}
        onReload={reloadProjectFromDisk}
      >
        {workspaceWithServiceHealth}
      </TestModeRecoveryHome>
    );
  }

  setTestModeFlag("full");
  return withBannerPortal(workspaceWithServiceHealth);
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
