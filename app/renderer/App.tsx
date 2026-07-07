import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useReducer } from "react";
import { useLayoutEffect } from "react";

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
import SplitCommandWorkspace from "./components/workspace/SplitCommandWorkspace";
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
import {
  clearDraftPreviewSyncState,
  createDraftPreviewSyncState,
  type DraftPreviewSyncState,
  readDraftPreviewSyncState,
  parseDraftPreviewSyncState,
  writeDraftPreviewSyncState,
} from "./utils/draftPreviewSync";
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
import { resolveProjectPath, revealPathWithToast } from "./utils/revealPathFeedback";
import {
  type AppShellMode,
  createDefaultSplitCommandShellState,
  describeSplitCommandShellFailure,
  readSplitCommandShellState,
  splitCommandShellReducer,
  writeSplitCommandShellState,
} from "./utils/splitCommandShellState";
import * as testMode from "./testMode/testModeManager";
import * as testUISandbox from "./testMode/testUISandbox";
import { ServiceHealthProvider } from "./contexts/serviceHealthContext";
import * as modePolicy from "../shared/modePolicy";
import "./styles/stable-home.css";

type DraftGenerationScope = "active-scene" | "all-scenes";

type SceneWriteWriterKind =
  | "user_selection"
  | "project_activation"
  | "draft_preview_replay"
  | "persisted_scene_restore"
  | "split_command_replay"
  | "project_home_callback"
  | "project_home_effect_echo"
  | "project_home_prop_sync"
  | "project_home_load_default"
  | "commit_sink"
  | "harness_selection";

type SceneWriteOutcome = "apply" | "skip" | "observe";

interface SceneWriteTracePayload {
  writerKind: SceneWriteWriterKind;
  sourceFunction: string;
  requestedSceneId: string | null;
  previousSceneId: string | null;
  committedSceneId: string | null;
  projectId: string | null;
  projectPath: string | null;
  projectSwitchGenerationToken: number | null;
  hydrationGenerationToken: number | null;
  causalTriggerId: string | null;
  outcome: SceneWriteOutcome;
  skipReason?: string | null;
  eventId?: string;
  order?: number;
  timestampMs?: number;
  perfMs?: number | null;
}

export function getTestModes() {
  if (typeof document === "undefined") {
    return { visualMode: false, stableDockMode: false, flowMode: true };
  }
  const bodyDataset = document.body?.dataset;
  const htmlDataset = document.documentElement?.dataset;
  const visualMode = modePolicy.isVisualStable() || bodyDataset?.testVisualStable === "1" || htmlDataset?.testVisualStable === "1";
  const stableDockMode =
    bodyDataset?.testStableDock === "1" || htmlDataset?.testStableDock === "1";
  const flowMode = !visualMode && !stableDockMode;
  return { visualMode, stableDockMode, flowMode };
}
import "./styles/stable-dock.css";

declare global {
  interface Window {
    __test?: {
      markBoot?: () => void;
    };
    __testInsights?: {
      setServiceStatus?: (status: "offline" | "online") => void;
      selectScene?: (sceneId: string) => void;
    };
  }
}

type TrackedLoadedProject = LoadedProject & { projectId?: string };

const BUDGET_EPSILON = 1e-6;
const SPLIT_COMMAND_CONDENSED_WIDTH_PX = 1_280;

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

function deriveProjectDisplayLabel(
  project: LoadedProject | null,
  projectPath: string | null | undefined,
): string {
  if (!project && !projectPath) {
    return 'No project loaded';
  }

  const rootName =
    project?.name?.trim() ||
    projectPath?.split(/[\\/]+/).filter(Boolean).at(-1) ||
    'Project';
  const normalizedPath = projectPath ?? '';
  const restoredCopy = /_restored_/i.test(normalizedPath);
  return restoredCopy ? `${rootName} (restored copy)` : rootName;
}

function resolveStartupScene(
  project: LoadedProject,
  requestedSceneId?: string | null,
): { id: string; title: string | null } | null {
  const persistedSceneId = readDraftPreviewSyncState(project.path)?.activeSceneId ?? null;
  const candidateSceneIds = [persistedSceneId, requestedSceneId];

  for (const candidateSceneId of candidateSceneIds) {
    const normalizedCandidateSceneId =
      typeof candidateSceneId === "string" ? candidateSceneId.trim() : "";
    if (!normalizedCandidateSceneId) {
      continue;
    }
    const candidateScene = project.scenes.find((scene) => scene.id === normalizedCandidateSceneId);
    if (candidateScene) {
      return { id: candidateScene.id, title: candidateScene.title ?? null };
    }
  }

  const firstScene = project.scenes[0] ?? null;
  return firstScene ? { id: firstScene.id, title: firstScene.title ?? null } : null;
}

type BatchCritiqueStatus = "idle" | "running" | "success" | "error";

interface BatchCritiqueResult {
  status: BatchCritiqueStatus;
  summary?: string;
  error?: string;
  traceId?: string;
}

function areActiveSceneRefsEqual(
  left: { id: string; title: string | null } | null,
  right: { id: string; title: string | null } | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return left.id === right.id && left.title === right.title;
}

export default function App(): JSX.Element {
  const hasWindow = typeof window !== 'undefined';
  const harnessHooksEnabled = modePolicy.isHarnessEnabled();
  const startupConfig = testMode.getStartupConfig();
  const startupModeLocked = harnessHooksEnabled && testMode.isModeLocked();
  const startupLockedMode = startupConfig?.mode ?? null;
  const startupRecoveryRequested = startupConfig?.recovery === true;
  const startupConfigProvided = startupConfig !== null;
  const services: ServicesBridge | undefined = window.services;
  const diagnostics: DiagnosticsBridge | undefined = window.diagnostics;
  const runtimeConfigOverride =
    (window as typeof window & { __runtimeConfigOverride?: RuntimeConfig }).__runtimeConfigOverride;
  const runtimeUi = runtimeConfigOverride?.ui ?? window.runtimeConfig?.ui;
  const splitCommandWorkspaceEnabled = runtimeUi?.experimentalSplitCommandWorkspace === true;
  type TestEnvFlag = boolean | { isPlaywright?: boolean };
  const isPlaywrightEnv =
    Boolean(
      (typeof process !== 'undefined' && process.env?.PLAYWRIGHT === '1') ||
        (hasWindow &&
          ((window as typeof window & { __testEnv?: TestEnvFlag }).__testEnv === true ||
            (window as typeof window & { __testEnv?: TestEnvFlag }).__testEnv?.isPlaywright)),
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
    return (
      document.body?.dataset?.testStablehome === '1' ||
      document.documentElement?.dataset?.testStablehome === '1'
    );
  });
  useEffect(() => {
    if (stableHomeAttrFlag) {
      return;
    }
    const checkAttribute = () => {
      if (typeof document === 'undefined') {
        return;
      }
      if (
        document.body?.dataset?.testStablehome === '1' ||
        document.documentElement?.dataset?.testStablehome === '1'
      ) {
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
    return (
      document.body?.dataset?.testVisualStable === '1' ||
      document.documentElement?.dataset?.testVisualStable === '1'
    );
  });
  useEffect(() => {
    if (visualStableAttrFlag) {
      return;
    }
    const checkAttribute = () => {
      if (typeof document === 'undefined') {
        return;
      }
      if (
        document.body?.dataset?.testVisualStable === '1' ||
        document.documentElement?.dataset?.testVisualStable === '1'
      ) {
        setVisualStableAttrFlag(true);
      }
    };
    checkAttribute();
    document.addEventListener('DOMContentLoaded', checkAttribute);
    return () => document.removeEventListener('DOMContentLoaded', checkAttribute);
  }, [visualStableAttrFlag]);
  const isSnapshotRestoreFlowActive =
    harnessHooksEnabled &&
    hasWindow &&
    (startupConfigProvided ? startupRecoveryRequested : window.__testEnvSnapshotRestoreFlow === true);
  const activeFlow =
    harnessHooksEnabled &&
    typeof document !== 'undefined' &&
    (document.body?.dataset?.testActiveFlow === '1' ||
      document.documentElement?.dataset?.testActiveFlow === '1');
  const { visualMode, stableDockMode: helperStableDock } = getTestModes();
  const stableDockEnvRequested = !activeFlow && helperStableDock;
  const visualEnvRequested = !activeFlow && visualMode;
  const liveFlowGuard =
    isPlaywrightEnv &&
    !harnessHooksEnabled &&
    !stableDockEnvRequested &&
    !visualEnvRequested &&
    !isSnapshotRestoreFlowActive &&
    !activeFlow;
  useEffect(() => {
    if (!liveFlowGuard || !hasWindow || typeof document === 'undefined') {
      return;
    }
    const win = window as typeof window & { __testEnvFlatMode?: boolean; __testEnvRecoveryMode?: boolean };
    const body = document.body;
    if (!body) {
      return;
    }
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
  }, [hasWindow, liveFlowGuard]);

  useEffect(() => {
    if (!activeFlow || typeof document === 'undefined') {
      return;
    }
    if (!startupModeLocked) {
      document.body.dataset.testMode = 'full';
    }
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
  }, [activeFlow, startupModeLocked]);

  useEffect(() => {
    if (!startupModeLocked || !startupLockedMode || typeof document === 'undefined') {
      return;
    }
    const enforce = () => {
      const html = document.documentElement;
      const body = document.body ?? html;
      if (html) {
        html.dataset.testMode = startupLockedMode;
      }
      if (body) {
        body.dataset.testMode = startupLockedMode;
      }
    };
    enforce();
    const observer = new MutationObserver(enforce);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-test-mode'] });
    if (document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-test-mode'] });
    }
    window.addEventListener('test:startup-config', enforce);
    return () => {
      observer.disconnect();
      window.removeEventListener('test:startup-config', enforce);
    };
  }, [startupLockedMode, startupModeLocked]);
  const stableDockExplicitFlag = liveFlowGuard ? false : stableDockEnvRequested;
  if (liveFlowGuard && stableDockEnvRequested) {
    console.warn('[MODE-LEAK] stableDock active during live flow');
  }
  const visualModeGuarded = liveFlowGuard ? false : visualEnvRequested;
  if (liveFlowGuard && visualEnvRequested) {
    console.warn('[MODE-LEAK] visualHome active during live flow');
  }
  const isStableDockMode = isTestEnvActive && stableDockExplicitFlag;
  const isStableHomeMode =
    harnessHooksEnabled &&
    hasWindow &&
    Boolean(
      document.body?.dataset?.testStableHome === '1' ||
        document.documentElement?.dataset?.testStableHome === '1' ||
        stableHomeAttrFlag,
    );
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
    const resolveDebugLog = () => {
      if (!Array.isArray(window.__blackskiesDebugLog)) {
        window.__blackskiesDebugLog = [];
      }
      return window.__blackskiesDebugLog;
    };
    const dbg = (scope: string, msg?: string) => {
      resolveDebugLog().push({ scope, msg });
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
  const sceneSelectionNullLockRef = useRef(false);
  const suppressHydrationDraftChangeRef = useRef(false);
  const testSetProjectLoadRequestRef = useRef(0);
  const isVisualHomeMode = isVisualMode && currentProject === null;
  const draftPreviewSyncSourceIdRef = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `draft-preview-${Math.random().toString(36).slice(2)}`,
  );
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
      const payload = source;
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
  const recordSceneWriteTrace = useCallback(
    (scope: string, payload: SceneWriteTracePayload): string => {
      const order = ++sceneWriteOrderRef.current;
      const eventId = `${scope}:${order}`;
      recordDebugEvent(scope, {
        eventId,
        order,
        timestampMs: Date.now(),
        perfMs: typeof performance !== "undefined" ? performance.now() : null,
        ...payload,
      });
      return eventId;
    },
    [],
  );
  const applySceneSelection = useCallback(
    (
      requestedSceneId?: string | null,
      instrumentation?: {
        writerKind?: SceneWriteWriterKind;
        sourceFunction?: string;
        causalTriggerId?: string | null;
        projectSwitchGenerationToken?: number | null;
        hydrationGenerationToken?: number | null;
      },
    ) => {
      const scenesList = currentProjectRef.current?.scenes ?? [];
      const previousSceneId = activeSceneId;
      const writerKind = instrumentation?.writerKind ?? "harness_selection";
      const sourceFunction = instrumentation?.sourceFunction ?? "applySceneSelection";
      const projectId = currentProjectRef.current?.projectId ?? null;
      const projectPath = currentProjectRef.current?.path ?? null;
      const projectSwitchGenerationToken =
        instrumentation?.projectSwitchGenerationToken ?? projectSwitchGenerationRef.current;
      const hydrationGenerationToken =
        instrumentation?.hydrationGenerationToken ?? draftPreviewHydrationGenerationRef.current;
      if (requestedSceneId === null) {
        sceneSelectionNullLockRef.current = true;
        draftPreviewSyncPendingStateRef.current = null;
        draftPreviewSyncHydratedRef.current = true;
        const clearProjectPath = projectSummary?.path ?? currentProjectRef.current?.path ?? null;
        if (clearProjectPath) {
          writeDraftPreviewSyncState(
            clearProjectPath,
            createDraftPreviewSyncState({
              sourceId: draftPreviewSyncSourceIdRef.current,
              projectPath: clearProjectPath,
              activeSceneId: null,
              projectDrafts: projectDraftsRef.current,
              draftEdits,
            }),
          );
        }
        recordSceneWriteTrace("scene.write.apply", {
          writerKind,
          sourceFunction,
          requestedSceneId: null,
          previousSceneId,
          committedSceneId: null,
          projectId,
          projectPath,
          projectSwitchGenerationToken,
          hydrationGenerationToken,
          causalTriggerId: instrumentation?.causalTriggerId ?? null,
          outcome: previousSceneId === null ? "skip" : "apply",
          skipReason: previousSceneId === null ? "already-cleared" : null,
        });
        console.log(
          "[dbg:scene.select.clear]",
          JSON.stringify({ sceneCount: scenesList.length }),
        );
        recordDebugEvent("scene.select.clear", {
          sceneCount: scenesList.length,
        });
        setActiveScene((previous) => (previous === null ? previous : null));
        pendingSceneSelectionRef.current = null;
        return true;
      }
      const normalizedRequestedSceneId =
        typeof requestedSceneId === "string" ? requestedSceneId.trim() : "";
      if (scenesList.length === 0) {
        recordSceneWriteTrace("scene.write.apply", {
          writerKind,
          sourceFunction,
          requestedSceneId: normalizedRequestedSceneId || null,
          previousSceneId,
          committedSceneId: null,
          projectId,
          projectPath,
          projectSwitchGenerationToken,
          hydrationGenerationToken,
          causalTriggerId: instrumentation?.causalTriggerId ?? null,
          outcome: "skip",
          skipReason: "no-scenes",
        });
        console.log(
          "[dbg:scene.select.missing-scene]",
          JSON.stringify({
            requestedSceneId: normalizedRequestedSceneId || null,
            reason: "no-scenes",
          }),
        );
        recordDebugEvent("scene.select.apply.miss", {
          requestedSceneId: normalizedRequestedSceneId || null,
          reason: "no-scenes",
        });
        return false;
      }
      const sceneIds = scenesList.map((scene) => scene.id);
      const fallbackScene = scenesList[0] ?? null;
      const targetScene = normalizedRequestedSceneId
        ? scenesList.find((scene) => scene.id === normalizedRequestedSceneId) ?? null
        : fallbackScene;
      if (!targetScene) {
        recordSceneWriteTrace("scene.write.apply", {
          writerKind,
          sourceFunction,
          requestedSceneId: normalizedRequestedSceneId || null,
          previousSceneId,
          committedSceneId: null,
          projectId,
          projectPath,
          projectSwitchGenerationToken,
          hydrationGenerationToken,
          causalTriggerId: instrumentation?.causalTriggerId ?? null,
          outcome: "skip",
          skipReason: "scene-id-not-found",
        });
        console.log(
          "[dbg:scene.select.missing-scene]",
          JSON.stringify({
            requestedSceneId: normalizedRequestedSceneId || null,
            reason: "scene-id-not-found",
            sceneIds,
          }),
        );
        recordDebugEvent("scene.select.apply.miss", {
          requestedSceneId: normalizedRequestedSceneId || null,
          reason: "no-target-scene",
          sceneIds,
        });
        return false;
      }
      console.log(
        "[dbg:scene.select.apply]",
        JSON.stringify({
          requestedSceneId: normalizedRequestedSceneId || null,
          selectedSceneId: targetScene.id,
          sceneCount: scenesList.length,
        }),
      );
      recordSceneWriteTrace("scene.write.apply", {
        writerKind,
        sourceFunction,
        requestedSceneId: normalizedRequestedSceneId || null,
        previousSceneId,
        committedSceneId: targetScene.id,
        projectId,
        projectPath,
        projectSwitchGenerationToken,
        hydrationGenerationToken,
        causalTriggerId: instrumentation?.causalTriggerId ?? null,
        outcome: previousSceneId === targetScene.id ? "skip" : "apply",
        skipReason: previousSceneId === targetScene.id ? "same-scene" : null,
      });
      recordDebugEvent("scene.select.apply", {
        requestedSceneId: normalizedRequestedSceneId || null,
        selectedSceneId: targetScene.id,
        selectedSceneTitle: targetScene.title ?? null,
        sceneCount: scenesList.length,
        sceneIds,
      });
      sceneSelectionNullLockRef.current = false;
      setActiveScene((previous) => {
        const nextScene = { id: targetScene.id, title: targetScene.title ?? null };
        return areActiveSceneRefsEqual(previous, nextScene) ? previous : nextScene;
      });
      pendingSceneSelectionRef.current = null;
      return true;
    },
    [activeSceneId, recordSceneWriteTrace, setActiveScene],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!isPlaywrightEnv && !harnessHooksEnabled) {
      return;
    }
    const win = window as typeof window & {
      __blackSkiesSelectScene?: (sceneId: string | null | undefined) => boolean;
    };
    win.__blackSkiesSelectScene = (sceneId) =>
      applySceneSelection(sceneId, {
        writerKind: "harness_selection",
        sourceFunction: "__blackSkiesSelectScene",
        causalTriggerId: "test:select-scene",
      });
    console.log('[dbg:scene.select.hook.present]', JSON.stringify({ hookPresent: true }));
    return () => {
      console.log('[dbg:scene.select.hook.present]', JSON.stringify({ hookPresent: false }));
      delete win.__blackSkiesSelectScene;
    };
  }, [applySceneSelection, harnessHooksEnabled, isPlaywrightEnv]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string | null | undefined>;
      const sceneId = customEvent.detail;
      if (sceneId === null || (typeof sceneId === 'string' && sceneId.length > 0)) {
        console.log('[dbg:scene.select.request]', JSON.stringify({ sceneId }));
        pendingSceneSelectionRef.current = sceneId;
        applySceneSelection(sceneId, {
          writerKind: "harness_selection",
          sourceFunction: "test:select-scene",
          causalTriggerId: "test:select-scene",
        });
      }
    };
    window.addEventListener('test:select-scene', handler);
    return () => {
      window.removeEventListener('test:select-scene', handler);
    };
  }, [applySceneSelection]);

  useEffect(() => {
    if (pendingSceneSelectionRef.current !== null) {
      applySceneSelection(pendingSceneSelectionRef.current, {
        writerKind: "harness_selection",
        sourceFunction: "pendingSceneSelectionRefReplay",
        causalTriggerId: "pending-scene-selection",
      });
    }
  }, [applySceneSelection, currentProject]);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [draftGenerationScope, setDraftGenerationScope] =
    useState<DraftGenerationScope>("active-scene");
  const globalWindowForDefaults = window as typeof window & {
    __testEnvDefaultProjectId?: string;
    __testEnvSnapshotRestoreFlow?: boolean;
  };
  const wizardDefaultProjectId =
    globalWindowForDefaults.__testEnvDefaultProjectId ?? projectSummary?.projectId ?? null;
  const wizardDefaultProjectPath =
    globalWindowForDefaults.__testEnvDefaultProjectPath ?? projectSummary?.path ?? null;
  const shouldAutoSeedProjectSummary =
    isPlaywrightEnv &&
    globalWindowForDefaults.__testEnvAutoSeedProjectSummary === true &&
    !startupModeLocked;
  const snapshotRestoreFlowActive =
    startupRecoveryRequested &&
    globalWindowForDefaults.__testEnvSnapshotRestoreFlow === true;
  if (!isPlaywrightEnv) {
    console.log('[app-snapshot-flow]', snapshotRestoreFlowActive);
  }
  const [projectDrafts, setProjectDrafts] = useState<Record<string, string>>({});
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const sceneWriteOrderRef = useRef(0);
  const projectSwitchGenerationRef = useRef(0);
  const draftPreviewHydrationGenerationRef = useRef(0);
  const splitCommandHydrationGenerationRef = useRef(0);
  const [splitCommandShellState, dispatchSplitCommandShell] = useReducer(
    splitCommandShellReducer,
    null,
    () => createDefaultSplitCommandShellState(null),
  );
  const [splitCommandShellStatusNote, setSplitCommandShellStatusNote] = useState<string | null>(
    null,
  );
  const splitCommandShellHydratedRef = useRef(false);
  const splitCommandHydratedSceneSelectionRef = useRef<string | null>(null);
  const splitCommandLayoutCollapsedRef = useRef<boolean | null>(null);
  const splitCommandShellCollapsedStateRef = useRef(false);
  const splitCommandPersistedStateRef = useRef<string | null>(null);
  const committedProjectStateRef = useRef<string | null>(null);
  const companionDrafts = useMemo(
    () => ({ ...projectDrafts, ...draftEdits }),
    [projectDrafts, draftEdits],
  );
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
  const [snapshotPanelRefreshToken, setSnapshotPanelRefreshToken] = useState(0);
  const refreshSnapshotsPanel = useCallback(() => {
    setSnapshotPanelRefreshToken((current) => current + 1);
  }, []);
  const openSnapshotsPanel = useCallback(() => {
    // Refresh on open so the panel can show new snapshots and fresh verification state.
    setShowSnapshotsPanel(true);
    refreshSnapshotsPanel();
  }, [refreshSnapshotsPanel, setShowSnapshotsPanel]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("md");
  const batchJobRef = useRef<{ cancelled: boolean } | null>(null);

  useEffect(() => {
    setDraftGenerationScope("active-scene");
  }, [projectSummary?.path]);

  const projectDraftsRef = useRef<Record<string, string>>({});
  useLayoutEffect(() => {
    projectDraftsRef.current = projectDrafts;
  }, [projectDrafts]);

  const draftPreviewSyncKey = useMemo(
    () =>
      projectSummary?.path ? `blackskies.draft-preview-state:${encodeURIComponent(projectSummary.path)}` : null,
    [projectSummary?.path],
  );
  const draftPreviewSyncHydratedRef = useRef(false);
  const draftPreviewSyncPendingStateRef = useRef<DraftPreviewSyncState | null>(null);

  const areStringMapsEqual = useCallback(
    (left: Record<string, string>, right: Record<string, string>) => {
      const leftKeys = Object.keys(left);
      const rightKeys = Object.keys(right);
      if (leftKeys.length !== rightKeys.length) {
        return false;
      }
      return leftKeys.every((key) => right[key] === left[key]);
    },
    [],
  );

  const isDraftPreviewStateEqual = useCallback(
    (left: DraftPreviewSyncState | null, right: DraftPreviewSyncState | null) => {
      if (!left || !right) {
        return false;
      }
      return (
        left.projectPath === right.projectPath &&
        left.activeSceneId === right.activeSceneId &&
        areStringMapsEqual(left.projectDrafts, right.projectDrafts) &&
        areStringMapsEqual(left.draftEdits, right.draftEdits)
      );
    },
    [areStringMapsEqual],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !draftPreviewSyncKey || !projectSummary?.path) {
      return;
    }

    const applyDraftPreviewState = (rawValue: string | null) => {
      const sharedState = parseDraftPreviewSyncState(rawValue);
      if (
        !sharedState ||
        sharedState.projectPath !== projectSummary.path ||
        sharedState.sourceId === draftPreviewSyncSourceIdRef.current
      ) {
        draftPreviewSyncPendingStateRef.current = null;
        draftPreviewSyncHydratedRef.current = true;
        return;
      }

      const hydrationGenerationToken = ++draftPreviewHydrationGenerationRef.current;

      const nextProjectDrafts = sharedState.projectDrafts ?? {};
      const nextDraftEdits = sharedState.draftEdits ?? {};
      const nextDrafts = { ...nextProjectDrafts, ...nextDraftEdits };
      const suppressSceneReplay = sceneSelectionNullLockRef.current && Boolean(sharedState.activeSceneId);
      const currentState: DraftPreviewSyncState = {
        sourceId: draftPreviewSyncSourceIdRef.current,
        projectPath: projectSummary.path,
        activeSceneId: activeSceneId ?? null,
        projectDrafts,
        draftEdits,
        updatedAt: 0,
      };
      if (isDraftPreviewStateEqual(sharedState, currentState)) {
        draftPreviewSyncPendingStateRef.current = null;
        draftPreviewSyncHydratedRef.current = true;
        recordSceneWriteTrace("scene.write.draft-preview", {
          writerKind: "draft_preview_replay",
          sourceFunction: "applyDraftPreviewState",
          requestedSceneId: sharedState.activeSceneId ?? null,
          previousSceneId: activeSceneId,
          committedSceneId: sharedState.activeSceneId ?? null,
          projectId: currentProjectRef.current?.projectId ?? projectSummary.projectId ?? null,
          projectPath: projectSummary.path,
          projectSwitchGenerationToken: projectSwitchGenerationRef.current,
          hydrationGenerationToken,
          causalTriggerId: sharedState.sourceId,
          outcome: "skip",
          skipReason: "already-hydrated",
        });
        return;
      }

      if (suppressSceneReplay) {
        draftPreviewSyncPendingStateRef.current = null;
        draftPreviewSyncHydratedRef.current = true;
      } else {
        draftPreviewSyncPendingStateRef.current = sharedState;
        draftPreviewSyncHydratedRef.current = false;
      }

      if (Object.keys(nextProjectDrafts).length > 0) {
        setProjectDrafts((previous) => ({ ...previous, ...nextProjectDrafts }));
      }
      if (Object.keys(nextDraftEdits).length > 0) {
        setDraftEdits((previous) => ({ ...previous, ...nextDraftEdits }));
      }
      if (currentProjectRef.current) {
        setCurrentProject((previous) =>
          previous ? { ...previous, drafts: { ...previous.drafts, ...nextDrafts } } : previous,
        );
      }
      if (sharedState.activeSceneId) {
        const targetScene =
          currentProjectRef.current?.scenes.find((scene) => scene.id === sharedState.activeSceneId) ??
          null;
        if (targetScene && activeSceneId !== null && !suppressSceneReplay) {
          sceneSelectionNullLockRef.current = false;
          recordSceneWriteTrace("scene.write.draft-preview", {
            writerKind: "draft_preview_replay",
            sourceFunction: "applyDraftPreviewState",
            requestedSceneId: sharedState.activeSceneId,
            previousSceneId: activeSceneId,
            committedSceneId: targetScene.id,
            projectId: currentProjectRef.current?.projectId ?? projectSummary.projectId ?? null,
            projectPath: projectSummary.path,
            projectSwitchGenerationToken: projectSwitchGenerationRef.current,
            hydrationGenerationToken,
            causalTriggerId: sharedState.sourceId,
            outcome: activeSceneId === targetScene.id ? "skip" : "apply",
            skipReason: activeSceneId === targetScene.id ? "same-scene" : null,
          });
          setActiveScene((previous) => {
            const nextScene = { id: targetScene.id, title: targetScene.title ?? null };
            return areActiveSceneRefsEqual(previous, nextScene) ? previous : nextScene;
          });
        }
      }
    };

    const suppressDraftPreviewSceneReplay =
      sceneSelectionNullLockRef.current && activeSceneId === null;
    if (!suppressDraftPreviewSceneReplay) {
      applyDraftPreviewState(window.localStorage.getItem(draftPreviewSyncKey));
    } else {
      draftPreviewSyncPendingStateRef.current = null;
      draftPreviewSyncHydratedRef.current = true;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== draftPreviewSyncKey) {
        return;
      }
      if (sceneSelectionNullLockRef.current && activeSceneId === null) {
        return;
      }
      applyDraftPreviewState(event.newValue);
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [
    activeSceneId,
    draftEdits,
    draftPreviewSyncKey,
    isDraftPreviewStateEqual,
    projectDrafts,
    projectSummary?.path,
    setActiveScene,
    setCurrentProject,
    setDraftEdits,
    setProjectDrafts,
  ]);

  useEffect(() => {
    if (!draftPreviewSyncKey || !projectSummary?.path || !currentProject) {
      return;
    }

    const pendingState = draftPreviewSyncPendingStateRef.current;
    if (pendingState) {
      const nextState: DraftPreviewSyncState = {
        sourceId: draftPreviewSyncSourceIdRef.current,
        projectPath: projectSummary.path,
        activeSceneId: activeSceneId ?? null,
        projectDrafts,
        draftEdits,
        updatedAt: 0,
      };
      if (!isDraftPreviewStateEqual(pendingState, nextState)) {
        return;
      }
      draftPreviewSyncPendingStateRef.current = null;
    }

    draftPreviewSyncHydratedRef.current = true;
  }, [
    activeSceneId,
    currentProject,
    draftEdits,
    draftPreviewSyncKey,
    isDraftPreviewStateEqual,
    projectDrafts,
    projectSummary?.path,
  ]);

  useEffect(() => {
    if (!draftPreviewSyncKey || !projectSummary?.path || !currentProject || !draftPreviewSyncHydratedRef.current) {
      return;
    }

    const nextState = createDraftPreviewSyncState({
      sourceId: draftPreviewSyncSourceIdRef.current,
      projectPath: projectSummary.path,
      activeSceneId: activeSceneId ?? null,
      projectDrafts,
      draftEdits,
    });

    writeDraftPreviewSyncState(projectSummary.path, nextState);
  }, [activeSceneId, currentProject, draftEdits, draftPreviewSyncKey, projectDrafts, projectSummary?.path]);

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
    clearDraftPreviewSyncState(projectSummary?.path ?? currentProjectRef.current?.path ?? null);
    setCurrentProject(null);
    setProjectDrafts({});
    setDraftEdits({});
    sceneSelectionNullLockRef.current = true;
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
    projectSummary?.path,
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
      const projectSwitchGenerationToken = ++projectSwitchGenerationRef.current;
      if (typeof window !== "undefined") {
        console.log("[dbg:project.commit.start]", project.path);
      }
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
      const projectId = project.projectId;
      if (!projectId) {
        pushToast({
          tone: "warning",
          title: "Project identity missing",
          description: "Activation was rejected because project identity is missing.",
        });
        return false;
      }
      updateLastProjectPath(project.path);
      const unitIds = project.scenes.map((scene) => scene.id);

      const projectWithId: TrackedLoadedProject = { ...project, projectId };
      currentProjectRef.current = projectWithId;
      suppressHydrationDraftChangeRef.current = true;
      setCurrentProject(projectWithId);
      const canonicalDrafts = { ...project.drafts };
      setProjectDrafts(canonicalDrafts);
      setDraftEdits({});
      projectDraftsRef.current = canonicalDrafts;

      const nextScene = resolveStartupScene(project, options?.preserveSceneId ?? null);
      if (nextScene) {
        sceneSelectionNullLockRef.current = false;
      } else {
        sceneSelectionNullLockRef.current = true;
      }
      recordDebugEvent("app.activateProject.startupScene", {
        path: project.path,
        startupSceneId: nextScene?.id ?? null,
      });
      recordSceneWriteTrace("scene.write.activate-project", {
        writerKind: "project_activation",
        sourceFunction: "activateProject",
        requestedSceneId: options?.preserveSceneId ?? null,
        previousSceneId: activeSceneId,
        committedSceneId: nextScene?.id ?? null,
        projectId,
        projectPath: project.path,
        projectSwitchGenerationToken,
        hydrationGenerationToken: draftPreviewHydrationGenerationRef.current,
        causalTriggerId: "app.handleProjectLoaded",
        outcome: nextScene ? "apply" : "skip",
        skipReason: nextScene ? null : "no-startup-scene",
      });
      setActiveScene(nextScene);
      resetCritique();
      setProjectSummary({
        projectId,
        path: project.path,
        unitScope: "scene",
        unitIds,
      });
      void fetchRecoveryStatus(projectId);
      return true;
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
      pushToast,
      updateLastProjectPath,
    ],
  );

  const reloadProjectFromDisk = useCallback(async (preserveDrafts?: Record<string, string>) => {
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
        const activated = activateProject(response.project, { preserveSceneId: activeSceneId });
        if (activated && preserveDrafts && Object.keys(preserveDrafts).length > 0) {
          setProjectDrafts((previous) => {
            const nextDrafts = { ...previous, ...preserveDrafts };
            projectDraftsRef.current = nextDrafts;
            return nextDrafts;
          });
          setDraftEdits((previous) => ({ ...previous, ...preserveDrafts }));
          setCurrentProject((previous) =>
            previous ? { ...previous, drafts: { ...previous.drafts, ...preserveDrafts } } : previous,
          );
        }
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
        description: `Local project state was not updated. ${message}`.trim(),
      });
    }
  }, [activateProject, activeSceneId, isMountedRef, projectSummary, pushToast]);

  const generationProjectSummary = useMemo<ProjectSummary | null>(() => {
    if (!projectSummary) {
      return null;
    }
    if (draftGenerationScope === "all-scenes") {
      if (projectSummary.unitIds.length === 0) {
        return null;
      }
      return {
        ...projectSummary,
        unitScope: "scene",
        unitIds: projectSummary.unitIds,
      };
    }
    if (!activeSceneId) {
      return null;
    }
    return {
      ...projectSummary,
      unitScope: "scene",
      unitIds: [activeSceneId],
    };
  }, [activeSceneId, draftGenerationScope, projectSummary]);

  const {
    state: preflightState,
    openPreflight,
    closePreflight,
    proceedPreflight,
  } = usePreflight({
    services,
    projectSummary: generationProjectSummary,
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
        description: 'Backend services are not ready.',
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
        const isTimeout = response.error?.code === 'TIMEOUT';
        pushToast({
          tone: isTimeout ? 'warning' : 'error',
          title: isTimeout ? 'Snapshot request timed out' : 'Snapshot creation failed',
          description: isTimeout
            ? 'Snapshot request timed out. The snapshot may still complete. Refresh the snapshots panel to check.'
            : `No snapshot was created. ${
                response.error?.message ?? 'Check the trace ID, then try again.'
              }`.trim(),
          traceId: response.traceId ?? response.error?.traceId,
          actions: isTimeout
            ? [
                {
                  label: 'Refresh snapshots panel',
                  onPress: () => {
                    console.log('[snapshot-timeout-toast-action]', {
                      snapshotId: null,
                      actionLabel: 'Refresh snapshots panel',
                    });
                    openSnapshotsPanel();
                  },
                },
              ]
            : undefined,
        });
        return;
      }

      const snapshotName = response.data?.snapshot_id ? `Snapshot ${response.data.snapshot_id}` : 'Snapshot saved';

      console.log('[snapshot-toast-fired]', {
        snapshotId: response.data?.snapshot_id ?? null,
        actionLabel: 'Open snapshots panel',
      });

      pushToast({
        tone: 'success',
        title: 'Snapshot created',
        description: snapshotName,
        actions: [
          {
            label: 'Open snapshots panel',
            onPress: () => {
              console.log('[snapshot-toast-action]', {
                snapshotId: response.data?.snapshot_id ?? null,
                actionLabel: 'Open snapshots panel',
              });
              openSnapshotsPanel();
            },
          },
        ],
      });
      refreshSnapshotsPanel();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = typeof message === 'string' && message.toLowerCase().includes('timed out');
      pushToast({
        tone: isTimeout ? 'warning' : 'error',
        title: isTimeout ? 'Snapshot request timed out' : 'Snapshot creation failed',
        description: isTimeout
          ? 'Snapshot request timed out. The snapshot may still complete. Refresh the snapshots panel to check.'
          : `No snapshot was created. ${message}`.trim(),
      });
    } finally {
      setSnapshotting(false);
    }
  }, [
    openSnapshotsPanel,
    projectSummary?.projectId,
    pushToast,
    services,
    snapshotting,
    refreshSnapshotsPanel,
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
        description: 'Backend services are not ready.',
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
          title: 'Backup verification failed',
          description:
            `The current project was not changed. ${
              response.error?.message ?? 'Run verification again or create a fresh backup before restoring.'
            }`.trim(),
          traceId: response.traceId ?? response.error?.traceId,
        });
        return;
      }

      const snapshotReport = response.data?.snapshots[0];
      const status = snapshotReport?.status ?? 'ok';
      const message =
        status === 'ok'
          ? 'Latest snapshot verified'
          : `${snapshotReport?.errors?.length ?? 1} issue(s) detected`;
      const reportPath = resolveProjectPath(
        projectSummary?.path,
        '.snapshots',
        'last_verification.json',
      );

      const verificationToastActions = [
        {
          label: 'Open snapshots panel',
          onPress: () => openSnapshotsPanel(),
          dismissOnPress: true,
        },
      ];
      if (reportPath) {
        verificationToastActions.push({
          label: 'Open report file',
          onPress: () =>
            void revealPathWithToast({
              services,
              targetPath: reportPath,
              kind: 'verification report',
              pushToast,
            }),
        });
      }
      pushToast({
        tone: status === 'ok' ? 'success' : 'warning',
        title: 'Snapshot verification',
        description: message,
        actions: verificationToastActions,
      });
      refreshSnapshotsPanel();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushToast({
        tone: 'error',
        title: 'Backup verification failed',
        description: `The current project was not changed. ${message}`.trim(),
      });
    } finally {
      setVerifying(false);
    }
  }, [
    projectSummary?.path,
    projectSummary?.projectId,
    pushToast,
    refreshSnapshotsPanel,
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
        description: "Backend services are still starting up.",
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
        projectPath: projectSummary.path,
        format: exportFormat,
      });

      if (!response.ok) {
        const message = response.error?.message ?? "Unable to export this project.";
        console.error("Export failed", response.error);
        pushToast({
          tone: "error",
          title: "Export failed",
          description: `No files were exported. ${message}`.trim(),
          traceId: response.traceId ?? response.error?.traceId,
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
        description: `No files were exported. ${message}`.trim(),
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
        if (startupModeLocked && status === "init" && !project) {
          recordDebugEvent("app.handleProjectLoaded.init-ignored", {
            status,
            lastOpenedPath: lastOpenedPath ?? null,
          });
          return;
        }
        if (
          startupModeLocked &&
          typeof startupConfig?.projectPath === 'string' &&
          startupConfig.projectPath.length > 0 &&
          project?.path &&
          project.path !== startupConfig.projectPath
        ) {
          recordDebugEvent("app.handleProjectLoaded.path-mismatch-ignored", {
            configuredPath: startupConfig.projectPath,
            incomingPath: project.path,
            status,
          });
          return;
        }

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
          activateProject(project);
          return;
        }

        setProjectSummary(null);
        resetProjectState();
        return;
      }

      if (!isPlaywrightEnv) {
        console.info("[App] handleProjectLoaded(direct)", {
          path: payload.path,
        });
      }
      recordDebugEvent("app.handleProjectLoaded.direct", { path: payload.path });
      activateProject(payload);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activateProject, resetProjectState, startupConfig?.projectPath, startupModeLocked, updateLastProjectPath],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleTestSetProjectLoad = (event: Event) => {
      const detail = (event as CustomEvent<string | null | undefined>).detail;
      if (typeof detail !== "string" || detail.trim().length === 0) {
        return;
      }
      const projectPath = detail.trim();
      const loader = window.projectLoader;
      if (!loader?.loadProject) {
        console.warn("[dbg:project.bridge.load.missing-loader]", projectPath);
        return;
      }
      const requestId = testSetProjectLoadRequestRef.current + 1;
      testSetProjectLoadRequestRef.current = requestId;
      console.log("[dbg:project.bridge.load.start]", projectPath);
      void loader
        .loadProject({ path: projectPath })
        .then((response) => {
          if (!isMountedRef.current || requestId !== testSetProjectLoadRequestRef.current) {
            return;
          }
          if (response?.ok) {
            console.log("[dbg:project.bridge.load.done]", projectPath);
            activateProject(response.project);
            return;
          }
          const message =
            response?.error?.message ?? "Harness project load failed for test:set-project";
          console.warn("[dbg:project.bridge.load.error]", projectPath, message);
          pushToast({
            tone: "warning",
            title: "Harness project load failed",
            description: message,
            traceId: response?.traceId ?? response?.error?.traceId,
          });
        })
        .catch((error: unknown) => {
          if (!isMountedRef.current || requestId !== testSetProjectLoadRequestRef.current) {
            return;
          }
          const message = error instanceof Error ? error.message : String(error);
          console.error("[dbg:project.bridge.load.exception]", projectPath, message);
          pushToast({
            tone: "error",
            title: "Harness project load threw",
            description: message,
          });
        });
    };

    window.addEventListener("test:set-project", handleTestSetProjectLoad);
    return () => {
      window.removeEventListener("test:set-project", handleTestSetProjectLoad);
    };
  }, [activateProject, isMountedRef, pushToast]);

  const handleActiveSceneChange = useCallback(
    (
      payload: ActiveScenePayload | null,
      meta?: {
        triggerEventId?: string | null;
        writerKind?: SceneWriteWriterKind;
        projectSwitchGenerationToken?: number | null;
        hydrationGenerationToken?: number | null;
        sourceFunction?: string;
      },
    ) => {
    if (!payload) {
      sceneSelectionNullLockRef.current = true;
      draftPreviewSyncPendingStateRef.current = null;
      draftPreviewSyncHydratedRef.current = true;
      const clearProjectPath = projectSummary?.path ?? currentProjectRef.current?.path ?? null;
      if (clearProjectPath) {
        writeDraftPreviewSyncState(
          clearProjectPath,
          createDraftPreviewSyncState({
            sourceId: draftPreviewSyncSourceIdRef.current,
            projectPath: clearProjectPath,
            activeSceneId: null,
            projectDrafts: projectDraftsRef.current,
            draftEdits,
          }),
        );
      }
      recordSceneWriteTrace("scene.write.handle-active-scene-change", {
        writerKind: meta?.writerKind ?? "project_home_callback",
        sourceFunction: meta?.sourceFunction ?? "handleActiveSceneChange",
        requestedSceneId: null,
        previousSceneId: activeSceneId,
        committedSceneId: null,
        projectId: projectSummary?.projectId ?? currentProjectRef.current?.projectId ?? null,
        projectPath: projectSummary?.path ?? currentProjectRef.current?.path ?? null,
        projectSwitchGenerationToken:
          meta?.projectSwitchGenerationToken ?? projectSwitchGenerationRef.current,
        hydrationGenerationToken:
          meta?.hydrationGenerationToken ?? draftPreviewHydrationGenerationRef.current,
        causalTriggerId: meta?.triggerEventId ?? null,
        outcome: activeSceneId === null ? "skip" : "apply",
        skipReason: activeSceneId === null ? "already-cleared" : null,
      });
      setActiveScene((previous) => (previous === null ? previous : null));
      return;
    }
    sceneSelectionNullLockRef.current = false;
    recordSceneWriteTrace("scene.write.handle-active-scene-change", {
      writerKind: meta?.writerKind ?? "project_home_callback",
      sourceFunction: meta?.sourceFunction ?? "handleActiveSceneChange",
      requestedSceneId: payload.sceneId,
      previousSceneId: activeSceneId,
      committedSceneId: payload.sceneId,
      projectId: projectSummary?.projectId ?? currentProjectRef.current?.projectId ?? null,
      projectPath: projectSummary?.path ?? currentProjectRef.current?.path ?? null,
      projectSwitchGenerationToken:
        meta?.projectSwitchGenerationToken ?? projectSwitchGenerationRef.current,
      hydrationGenerationToken:
        meta?.hydrationGenerationToken ?? draftPreviewHydrationGenerationRef.current,
      causalTriggerId: meta?.triggerEventId ?? null,
      outcome: activeSceneId === payload.sceneId ? "skip" : "apply",
      skipReason: activeSceneId === payload.sceneId ? "same-scene" : null,
    });
    setActiveScene((previous) => {
      const nextScene = { id: payload.sceneId, title: payload.sceneTitle };
      return areActiveSceneRefsEqual(previous, nextScene) ? previous : nextScene;
    });
    if (suppressHydrationDraftChangeRef.current) {
      suppressHydrationDraftChangeRef.current = false;
      return;
    }
    setDraftEdits((previous) => {
      const baselineDraft =
        projectDraftsRef.current[payload.sceneId] ??
        currentProjectRef.current?.drafts[payload.sceneId] ??
        '';
      if (payload.draft === baselineDraft) {
        if (!Object.prototype.hasOwnProperty.call(previous, payload.sceneId)) {
          return previous;
        }
        const nextDraftEdits = { ...previous };
        delete nextDraftEdits[payload.sceneId];
        return nextDraftEdits;
      }
      if (previous[payload.sceneId] === payload.draft) {
        return previous;
      }
      return { ...previous, [payload.sceneId]: payload.draft };
    });
    },
    [activeSceneId, currentProjectRef, projectSummary?.path, projectSummary?.projectId, recordSceneWriteTrace],
  );

  const handleDraftChange = useCallback((sceneId: string, draft: string) => {
    setDraftEdits((previous) => {
      const baselineDraft =
        projectDraftsRef.current[sceneId] ?? currentProjectRef.current?.drafts[sceneId] ?? '';
      if (draft === baselineDraft) {
        if (!Object.prototype.hasOwnProperty.call(previous, sceneId)) {
          return previous;
        }
        const nextDraftEdits = { ...previous };
        delete nextDraftEdits[sceneId];
        return nextDraftEdits;
      }
      if (previous[sceneId] === draft) {
        return previous;
      }
      return { ...previous, [sceneId]: draft };
    });
  }, []);

  const handleOutlineReady = useCallback(
    (projectId: string, sceneIds: string[]) => {
      pushToast({
        tone: "info",
        title: "Outline updated",
        description: `Latest outline written for project ${projectId}.`,
      });
      setProjectSummary((previous) => {
        if (!previous) {
          return previous;
        }
        return { ...previous, projectId, unitIds: sceneIds };
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
          const sharedDraftState = readDraftPreviewSyncState(floatingProjectPath);
          if (sharedDraftState && sharedDraftState.projectPath === floatingProjectPath) {
            const mergedDrafts = {
              ...response.project.drafts,
              ...sharedDraftState.projectDrafts,
              ...sharedDraftState.draftEdits,
            };
            activateProject(
              { ...response.project, drafts: mergedDrafts },
              { preserveSceneId: sharedDraftState.activeSceneId ?? null },
            );
          } else {
            activateProject(response.project);
          }
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

  const projectLabel = useMemo(
    () => deriveProjectDisplayLabel(currentProject, projectSummary?.path ?? null),
    [currentProject, projectSummary?.path],
  );
  const splitCommandModeRequested =
    splitCommandWorkspaceEnabled && !isFloatingHost && !isStableHomeMode;
  const appShellMode: AppShellMode = splitCommandModeRequested ? "split-command" : "stable-gui";

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const target = document.body;
    const html = document.documentElement;
    if (!target) {
      return;
    }
    target.dataset.appMode = appShellMode;
    if (html && html !== target) {
      html.dataset.appMode = appShellMode;
    }
    return () => {
      delete target.dataset.appMode;
      if (html && html !== target) {
        delete html.dataset.appMode;
      }
    };
  }, [appShellMode]);

  useEffect(() => {
    dispatchSplitCommandShell({
      type: "shell/project-changed",
      payload: { projectPath: projectSummary?.path ?? null },
    });
  }, [projectSummary?.path]);

  useEffect(() => {
    if (!splitCommandModeRequested || typeof window === "undefined") {
      splitCommandShellHydratedRef.current = false;
      splitCommandHydratedSceneSelectionRef.current = null;
      splitCommandPersistedStateRef.current = null;
      setSplitCommandShellStatusNote(null);
      return;
    }
    if (!projectSummary?.path) {
      splitCommandShellHydratedRef.current = false;
      splitCommandHydratedSceneSelectionRef.current = null;
      splitCommandPersistedStateRef.current = null;
      setSplitCommandShellStatusNote(null);
      return;
    }
    const result = readSplitCommandShellState(window.localStorage, projectSummary?.path ?? null);
    const liveViewportCollapsed = window.innerWidth < SPLIT_COMMAND_CONDENSED_WIDTH_PX;
    splitCommandLayoutCollapsedRef.current = liveViewportCollapsed;
    dispatchSplitCommandShell({
      type: "shell/hydrate",
      payload: {
        ...result.state,
        commandCenterCollapsed: liveViewportCollapsed,
      },
    });
    splitCommandShellHydratedRef.current = true;
    splitCommandHydratedSceneSelectionRef.current = result.state.selectedSceneId;
    if (result.failureClass) {
      setSplitCommandShellStatusNote(describeSplitCommandShellFailure(result.failureClass).notice);
      return;
    }
    setSplitCommandShellStatusNote(null);
  }, [projectSummary?.path, splitCommandModeRequested]);

  useEffect(() => {
    splitCommandShellCollapsedStateRef.current = splitCommandShellState.commandCenterCollapsed;
  }, [splitCommandShellState.commandCenterCollapsed]);

  useEffect(() => {
    if (!splitCommandModeRequested) {
      splitCommandHydratedSceneSelectionRef.current = null;
      return;
    }
    if (
      splitCommandHydratedSceneSelectionRef.current &&
      splitCommandHydratedSceneSelectionRef.current === activeSceneId
    ) {
      splitCommandHydratedSceneSelectionRef.current = null;
    }
  }, [activeSceneId, splitCommandModeRequested]);

  useEffect(() => {
    if (!splitCommandModeRequested) {
      return;
    }
    if (activeSceneId === null && !currentProject) {
      return;
    }
    if (
      splitCommandHydratedSceneSelectionRef.current &&
      currentProject &&
      splitCommandHydratedSceneSelectionRef.current !== activeSceneId
    ) {
      return;
    }
    dispatchSplitCommandShell({
      type: "shell/select-scene",
      payload: { sceneId: activeSceneId ?? null },
    });
  }, [
    activeSceneId,
    currentProject,
    splitCommandModeRequested,
  ]);

  useEffect(() => {
    if (
      !splitCommandModeRequested ||
      !splitCommandShellHydratedRef.current ||
      !currentProject ||
      activeSceneId === null ||
      sceneSelectionNullLockRef.current ||
      !splitCommandShellState.selectedSceneId ||
      splitCommandShellState.selectedSceneId === activeSceneId
    ) {
      return;
    }
    const hydrationGenerationToken = ++splitCommandHydrationGenerationRef.current;
    recordSceneWriteTrace("scene.write.split-command", {
      writerKind: "split_command_replay",
      sourceFunction: "splitCommandSceneReplayEffect",
      requestedSceneId: splitCommandShellState.selectedSceneId,
      previousSceneId: activeSceneId,
      committedSceneId: splitCommandShellState.selectedSceneId,
      projectId: projectSummary?.projectId ?? currentProjectRef.current?.projectId ?? null,
      projectPath: projectSummary?.path ?? currentProjectRef.current?.path ?? null,
      projectSwitchGenerationToken: projectSwitchGenerationRef.current,
      hydrationGenerationToken,
      causalTriggerId: splitCommandPersistedStateRef.current,
      outcome: activeSceneId === splitCommandShellState.selectedSceneId ? "skip" : "apply",
      skipReason: activeSceneId === splitCommandShellState.selectedSceneId ? "same-scene" : null,
    });
    applySceneSelection(splitCommandShellState.selectedSceneId, {
      writerKind: "split_command_replay",
      sourceFunction: "splitCommandSceneReplayEffect",
      causalTriggerId: splitCommandPersistedStateRef.current,
      projectSwitchGenerationToken: projectSwitchGenerationRef.current,
      hydrationGenerationToken: splitCommandHydrationGenerationRef.current,
    });
  }, [
    activeSceneId,
    applySceneSelection,
    currentProject,
    splitCommandModeRequested,
    splitCommandShellState.selectedSceneId,
  ]);

  useEffect(() => {
    if (
      !splitCommandModeRequested ||
      !splitCommandShellHydratedRef.current ||
      typeof window === "undefined" ||
      !projectSummary?.path
    ) {
      return;
    }
    const nextPersistedState = {
      ...splitCommandShellState,
      projectPath: projectSummary?.path ?? null,
      selectedSceneId: activeSceneId ?? splitCommandShellState.selectedSceneId,
    };
    const nextSerializedState = JSON.stringify(nextPersistedState);
    if (splitCommandPersistedStateRef.current === nextSerializedState) {
      return;
    }
    splitCommandPersistedStateRef.current = nextSerializedState;
    writeSplitCommandShellState(window.localStorage, nextPersistedState);
  }, [
    activeSceneId,
    projectSummary?.path,
    splitCommandModeRequested,
    splitCommandShellState,
  ]);
  useEffect(() => {
    if (!splitCommandModeRequested || typeof window === "undefined") {
      splitCommandLayoutCollapsedRef.current = null;
      return;
    }

    const syncLayoutOwnership = () => {
      const nextCollapsed = window.innerWidth < SPLIT_COMMAND_CONDENSED_WIDTH_PX;
      if (
        splitCommandLayoutCollapsedRef.current === nextCollapsed &&
        splitCommandShellCollapsedStateRef.current === nextCollapsed
      ) {
        return;
      }
      splitCommandLayoutCollapsedRef.current = nextCollapsed;
      dispatchSplitCommandShell({
        type: "shell/set-command-center-collapsed",
        payload: { collapsed: nextCollapsed },
      });
      recordDebugEvent("split-command.layout.mode", {
        collapsed: nextCollapsed,
        viewportWidth: window.innerWidth,
        threshold: SPLIT_COMMAND_CONDENSED_WIDTH_PX,
      });
      console.log(
        "[dbg:split-command.layout.mode]",
        JSON.stringify({
          collapsed: nextCollapsed,
          viewportWidth: window.innerWidth,
          threshold: SPLIT_COMMAND_CONDENSED_WIDTH_PX,
        }),
      );
      (
        window as typeof window & {
          __blackSkiesDebugState?: {
            shellLayout?: {
              commandCenterCollapsed: boolean;
              viewportWidth: number;
              threshold: number;
            };
          };
        }
      ).__blackSkiesDebugState = {
        ...(window.__blackSkiesDebugState ?? {}),
        shellLayout: {
          commandCenterCollapsed: nextCollapsed,
          viewportWidth: window.innerWidth,
          threshold: SPLIT_COMMAND_CONDENSED_WIDTH_PX,
        },
      };
    };

    syncLayoutOwnership();
    window.addEventListener("resize", syncLayoutOwnership);
    return () => {
      window.removeEventListener("resize", syncLayoutOwnership);
    };
  }, [splitCommandModeRequested]);
  const splitCommandLayoutMode = splitCommandShellState.commandCenterCollapsed
    ? "condensed"
    : "full";
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const target = body ?? html;
    if (!target) {
      return;
    }
    if (!splitCommandModeRequested) {
      delete target.dataset.splitCommandLayout;
      if (html && html !== target) {
        delete html.dataset.splitCommandLayout;
      }
      return;
    }
    target.dataset.splitCommandLayout = splitCommandLayoutMode;
    if (html && html !== target) {
      html.dataset.splitCommandLayout = splitCommandLayoutMode;
    }
    return () => {
      delete target.dataset.splitCommandLayout;
      if (html && html !== target) {
        delete html.dataset.splitCommandLayout;
      }
    };
  }, [splitCommandLayoutMode, splitCommandModeRequested]);
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const target = body ?? html;
    if (!target) {
      return;
    }
    const pathValue = projectSummary?.path ?? "";
    const projectIdValue = projectSummary?.projectId ?? "";
    const activeSceneIdValue = activeSceneId ?? "";
    const activeSceneTitleValue = activeScene?.title ?? null;
    const sceneIds = currentProjectRef.current?.scenes?.map((scene) => scene.id) ?? [];
    if (pathValue) {
      target.dataset.projectLoaded = "1";
      if (html && html !== target) {
        html.dataset.projectLoaded = "1";
      }
      target.dataset.projectPath = pathValue;
      if (html && html !== target) {
        html.dataset.projectPath = pathValue;
      }
    } else {
      delete target.dataset.projectLoaded;
      if (html && html !== target) {
        delete html.dataset.projectLoaded;
      }
      delete target.dataset.projectPath;
      if (html && html !== target) {
        delete html.dataset.projectPath;
      }
    }
    if (projectIdValue) {
      target.dataset.projectId = projectIdValue;
      if (html && html !== target) {
        html.dataset.projectId = projectIdValue;
      }
    } else {
      delete target.dataset.projectId;
      if (html && html !== target) {
        delete html.dataset.projectId;
      }
    }
    if (activeSceneIdValue) {
      target.dataset.activeSceneId = activeSceneIdValue;
      if (html && html !== target) {
        html.dataset.activeSceneId = activeSceneIdValue;
      }
    } else {
      delete target.dataset.activeSceneId;
      if (html && html !== target) {
        delete html.dataset.activeSceneId;
      }
    }
    if (typeof window !== "undefined") {
      (
        window as typeof window & {
          __testProjectState?: {
            loaded: boolean;
            path: string | null;
            projectId: string | null;
            activeSceneId: string | null;
            activeSceneTitle: string | null;
            sceneIds?: string[];
            label: string;
          };
          __blackskiesDebugProjectState?: {
            loaded: boolean;
            path: string | null;
            projectId: string | null;
            activeSceneId: string | null;
            activeSceneTitle: string | null;
            sceneIds?: string[];
            label: string;
          };
        }
      ).__testProjectState = {
        loaded: Boolean(pathValue),
        path: pathValue || null,
        projectId: projectIdValue || null,
        activeSceneId: activeSceneIdValue || null,
        activeSceneTitle: activeSceneTitleValue,
        sceneIds,
        label: projectLabel,
      };
      const committedProjectState = {
        loaded: Boolean(pathValue),
        path: pathValue || null,
        projectId: projectIdValue || null,
        activeSceneId: activeSceneIdValue || null,
        activeSceneTitle: activeSceneTitleValue,
        sceneIds,
        label: projectLabel,
      };
      (
        window as typeof window & {
          __blackskiesDebugProjectState?: {
            loaded: boolean;
            path: string | null;
            projectId: string | null;
            activeSceneId: string | null;
            activeSceneTitle: string | null;
            label: string;
          };
        }
      ).__blackskiesDebugProjectState = committedProjectState;
      (
        window as typeof window & {
          __blackSkiesDebugState?: {
            loaded?: boolean;
            path?: string | null;
            projectId?: string | null;
            activeSceneId?: string | null;
            activeSceneTitle?: string | null;
            sceneIds?: string[];
            label?: string;
          };
        }
      ).__blackSkiesDebugState = {
        ...(window.__blackSkiesDebugState ?? {}),
        ...committedProjectState,
      };
      const committedProjectStateSnapshot = {
        activeSceneId: activeSceneIdValue || null,
        activeSceneTitle: activeSceneTitleValue,
        projectId: projectIdValue || null,
        sceneIds,
      };
      const committedProjectStateSerialized = JSON.stringify(committedProjectStateSnapshot);
      if (committedProjectStateRef.current !== committedProjectStateSerialized) {
        committedProjectStateRef.current = committedProjectStateSerialized;
        recordSceneWriteTrace("scene.select.commit", {
          writerKind: "commit_sink",
          sourceFunction: "scene.select.commit",
          requestedSceneId: activeSceneIdValue || null,
          previousSceneId: activeSceneIdValue || null,
          committedSceneId: activeSceneIdValue || null,
          projectId: projectIdValue || null,
          projectPath: projectSummary?.path ?? null,
          projectSwitchGenerationToken: projectSwitchGenerationRef.current,
          hydrationGenerationToken:
            draftPreviewHydrationGenerationRef.current || splitCommandHydrationGenerationRef.current,
          causalTriggerId: null,
          outcome: "observe",
        });
        recordDebugEvent("scene.select.commit", committedProjectStateSnapshot);
        console.log(
          "[dbg:scene.select.commit]",
          JSON.stringify({
            activeSceneId: activeSceneIdValue || null,
            projectId: projectIdValue || null,
            sceneCount: sceneIds.length,
          }),
        );
      }
      console.log("[dbg:project.commit.done]", pathValue || "null");
    }
  }, [activeScene?.title, activeSceneId, projectLabel, projectSummary?.path, projectSummary?.projectId]);
  const testRecoveryStatusOverride = useMemo(() => {
    if (!isSnapshotRestoreFlowActive || recoveryStatus) {
      return null;
    }
    return createTestRecoveryStatus(projectSummary?.projectId ?? undefined);
  }, [isSnapshotRestoreFlowActive, projectSummary?.projectId, recoveryStatus]);
  const forcedRecoveryFlag =
    harnessHooksEnabled &&
    isTestEnvActive &&
    (startupConfigProvided
      ? startupRecoveryRequested
      : typeof document !== 'undefined' && document.body?.dataset?.testNeedsRecovery === '1');
  const forcedRecoveryStatus = useMemo(() => {
    if (!forcedRecoveryFlag) {
      return null;
    }
    return createTestRecoveryStatus(projectSummary?.projectId ?? undefined);
  }, [forcedRecoveryFlag, projectSummary?.projectId]);
  const effectiveRecoveryStatus = forcedRecoveryStatus ?? recoveryStatus ?? testRecoveryStatusOverride;
  const recoverySnapshot = effectiveRecoveryStatus?.last_snapshot ?? null;
  const recoveryBannerVisible = isVisualHomeMode
    ? false
    : startupConfigProvided
    ? startupRecoveryRequested &&
      (isSnapshotRestoreFlowActive || forcedRecoveryFlag || (effectiveRecoveryStatus?.needs_recovery ?? false))
    : isSnapshotRestoreFlowActive || forcedRecoveryFlag || (effectiveRecoveryStatus?.needs_recovery ?? false);
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
      projectId: projectSummary?.projectId ?? null,
      reopenRequest,
      onReopenConsumed: handleReopenConsumed,
      draftOverrides: draftEdits,
      onActiveSceneChange: handleActiveSceneChange,
      onDraftChange: handleDraftChange,
      requestedActiveSceneId: activeSceneId,
      paneMode: isFloatingHost ? "floating" : dockingEnabled ? "docked" : "standalone",
      relocationNotifyEnabled,
      autoSnapEnabled,
      onRelocationNotifyChange: setRelocationNotifyEnabled,
      onAutoSnapChange: setAutoSnapEnabled,
      suppressBootstrap: isStableHomeMode || testMode.isVisualHome(),
      suppressWelcome: testMode.isVisualHome(),
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
      projectSummary?.projectId,
      reopenRequest,
      relocationNotifyEnabled,
      setAutoSnapEnabled,
      setRelocationNotifyEnabled,
      activeSceneId,
      isStableHomeMode,
      isVisualHomeMode,
      isFloatingHost,
      dockingEnabled,
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
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    console.log("[dbg:dock.projectPath]", resolvedDockWorkspaceProps.projectPath ?? "null");
  }, [resolvedDockWorkspaceProps.projectPath]);

  const stableHomeBody = renderProjectHome();
  const shouldRenderDockWorkspace = dockingEnabled && (!isVisualHomeMode || Boolean(projectSummary));
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const action = document.querySelector('[data-testid="workspace-action-generate"]') as
      | HTMLButtonElement
      | null;
    const enabled = Boolean(action && !action.disabled);
    console.log("[dbg:workspace.actions]", JSON.stringify({ generateEnabled: enabled }));
  }, [projectSummary?.path, shouldRenderDockWorkspace]);

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

  const handleSplitCommandSceneSelect = useCallback(
    (sceneId: string) => {
      const triggerEventId = recordSceneWriteTrace("scene.write.split-command", {
        writerKind: "user_selection",
        sourceFunction: "handleSplitCommandSceneSelect",
        requestedSceneId: sceneId,
        previousSceneId: activeSceneId,
        committedSceneId: sceneId,
        projectId: projectSummary?.projectId ?? currentProjectRef.current?.projectId ?? null,
        projectPath: projectSummary?.path ?? currentProjectRef.current?.path ?? null,
        projectSwitchGenerationToken: projectSwitchGenerationRef.current,
        hydrationGenerationToken: splitCommandHydrationGenerationRef.current,
        causalTriggerId: "story-navigation-click",
        outcome: activeSceneId === sceneId ? "skip" : "apply",
        skipReason: activeSceneId === sceneId ? "same-scene" : null,
      });
      dispatchSplitCommandShell({
        type: "shell/select-scene",
        payload: { sceneId },
      });
      applySceneSelection(sceneId, {
        writerKind: "user_selection",
        sourceFunction: "handleSplitCommandSceneSelect",
        causalTriggerId: triggerEventId,
        projectSwitchGenerationToken: projectSwitchGenerationRef.current,
        hydrationGenerationToken: splitCommandHydrationGenerationRef.current,
      });
    },
    [activeSceneId, applySceneSelection, currentProjectRef, projectSummary?.path, projectSummary?.projectId, recordSceneWriteTrace],
  );

  const workspaceBody = splitCommandModeRequested ? (
    <SplitCommandWorkspace
      project={currentProject}
      activeSceneId={activeSceneId}
      onSelectScene={handleSplitCommandSceneSelect}
      commandCenterCollapsed={splitCommandShellState.commandCenterCollapsed}
      shellStatusNote={splitCommandShellStatusNote}
      writingStudio={fullWorkspaceBody}
    />
  ) : (
    fullWorkspaceBody
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
  const projectLoadedMarkerCommitted =
    typeof document !== "undefined" &&
    (document.body?.dataset.projectLoaded === "1" ||
      document.documentElement?.dataset.projectLoaded === "1");
  const projectReadyForActions =
    projectLoadedMarkerCommitted && Boolean(projectSummary?.projectId && projectSummary?.path);
  const sceneReadyForActions = Boolean(activeSceneId);
  const servicesReadyForActions = effectiveServiceStatus === 'online' && !serviceOffline;
  const disableSnapshot =
    disableExport || snapshotting || !services?.createProjectSnapshot;
  const disableVerify =
    disableExport || verifying || !services?.runBackupVerification;
  const disableSnapshots =
    showSnapshotsPanel || !services?.listProjectSnapshots;
  const activeSceneHasDraftOverride =
    activeSceneId !== null && Object.prototype.hasOwnProperty.call(draftEdits, activeSceneId);
  const activeDraftSessionStateLabel = useMemo(() => {
    const classifications = [currentProject ? "persisted" : "runtime-only"];
    if (activeSceneHasDraftOverride) {
      classifications.push("dirty", "unsaved");
    }
    return classifications.join(", ");
  }, [activeSceneHasDraftOverride, currentProject]);
  const headerDeps = [
    projectLabel,
    activeDraftSessionStateLabel,
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
    draftGenerationScope,
    setDraftGenerationScope,
    projectSummary?.unitIds.length ?? 0,
    companionOpen,
    currentProject,
    budgetBlocked,
    projectReadyForActions,
    sceneReadyForActions,
    servicesReadyForActions,
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
      draftSessionStateLabel: activeDraftSessionStateLabel,
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
      generationScope: draftGenerationScope,
      generationScopeCount: projectSummary?.unitIds.length ?? 0,
      onGenerationScopeChange: setDraftGenerationScope,
      companionOpen,
      disableCompanion: !currentProject,
      disableGenerate: serviceOffline || budgetBlocked || !projectReadyForActions || !sceneReadyForActions || !servicesReadyForActions,
      disableCritique: serviceOffline || budgetBlocked || !projectReadyForActions || !sceneReadyForActions || !servicesReadyForActions,
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
      errorPhase={preflightState.phase}
      generationScope={draftGenerationScope}
      generationScopeCount={generationProjectSummary?.unitIds.length ?? 0}
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
      data-app-mode={appShellMode}
      data-split-command-layout={splitCommandModeRequested ? splitCommandLayoutMode : undefined}
      className={`app-shell${dockingEnabled ? " app-shell--dock-enabled" : ""}${
        isFloatingHost ? " app-shell--floating" : ""
      }${splitCommandWorkspaceEnabled && !isFloatingHost ? " app-shell--split-command" : ""}`}
    >
      {!dockingEnabled && !isFloatingHost && !splitCommandWorkspaceEnabled && (
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

        <main className="app-shell__workspace-body">{workspaceBody}</main>
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
          drafts={companionDrafts}
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
          refreshToken={snapshotPanelRefreshToken}
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
          critiqueProvenance={critiqueState.critiqueProvenance}
          rewriteProvenance={critiqueState.rewriteProvenance}
          budgetStatusLine={critiqueState.budgetStatusLine}
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
    const resolvedMode =
      startupModeLocked && startupLockedMode ? startupLockedMode : modeLabel;
    document.body.dataset.testMode = resolvedMode;
    document.documentElement.dataset.testMode = resolvedMode;
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
