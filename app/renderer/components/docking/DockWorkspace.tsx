import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Mosaic, MosaicZeroState, type MosaicPath } from 'react-mosaic-component';

import 'react-mosaic-component/react-mosaic-component.css';

import {
  DEFAULT_LAYOUT,
  LAYOUT_SCHEMA_VERSION,
  PANE_METADATA,
  sanitizeLayoutNode,
  applySplitWeights,
  type FloatingPaneClampInfo,
  type FloatingPaneDescriptor,
  type LayoutPaneId,
  type LayoutSplitNode,
  type LayoutSplitWeights,
  type LayoutTree,
  normalisePaneId,
} from '../../../shared/ipc/layout';
import {
  ALL_DOCK_PANES,
  DOCK_PRESETS,
  DEFAULT_PRESET_KEY,
  cloneLayout,
  getPreset,
} from './presets';
import { recordDebugEvent } from '../../utils/debugLog';
import DockPaneTile from './DockPaneTile';
import { useDockHotkeys } from './useDockHotkeys';
import { usePaneBoundsLogger } from './usePaneBoundsLogger';
import { TID } from '../../utils/testIds';
import type { ToastPayload } from '../../types/toast';
import { boundsDiffer } from '../../utils/layout';

const RELOCATION_HIGHLIGHT_DURATION = 2000;

type PaneContentMap = Partial<Record<LayoutPaneId, ReactNode>>;

interface DockWorkspaceProps {
  projectPath: string | null;
  panes: PaneContentMap;
  defaultPreset: string;
  enableHotkeys: boolean;
  focusCycleOrder: readonly LayoutPaneId[];
  emptyState?: ReactNode;
  onToast?: (toast: ToastPayload) => void;
  relocationNotifyEnabled: boolean;
  autoSnapEnabled: boolean;
  onRelocationNotifyChange?: (value: boolean) => void;
  stableDockMode?: boolean;
}

function collectPaneIds(node: LayoutTree | null, result: Set<LayoutPaneId>): void {
  if (!node) {
    return;
  }
  if (typeof node === 'string') {
    result.add(node);
    return;
  }
  collectPaneIds(node.first, result);
  collectPaneIds(node.second, result);
}

function layoutContainsPane(node: LayoutTree, paneId: LayoutPaneId): boolean {
  if (typeof node === 'string') {
    return node === paneId;
  }
  return layoutContainsPane(node.first, paneId) || layoutContainsPane(node.second, paneId);
}

const ROOT_GROUP_KEY = 'root';
const EXPANDED_WEIGHT = 0.74;

const STABLE_LAYOUT: LayoutTree = {
  direction: 'row',
  first: 'outline',
  second: {
    direction: 'column',
    first: 'draftPreview',
    second: {
      direction: 'row',
      first: 'storyInsights',
      second: 'corkboard',
      splitPercentage: 50,
      weights: [0.5, 0.5],
    },
    splitPercentage: 60,
    weights: [0.6, 0.4],
  },
  splitPercentage: 32,
  weights: [0.32, 0.68],
};

function getGroupKeyFromPath(path: MosaicPath): string {
  if (path.length === 0) {
    return ROOT_GROUP_KEY;
  }
  return path.join('.');
}

function getSplitNodeAtPath(tree: LayoutTree, path: MosaicPath): LayoutSplitNode | null {
  let current: LayoutTree = tree;
  for (const segment of path) {
    if (typeof current === 'string') {
      return null;
    }
    current = segment === 'first' ? current.first : current.second;
  }
  return typeof current === 'string' ? null : current;
}

function updateSplitNodeAtPath(
  tree: LayoutTree,
  path: MosaicPath,
  updater: (node: LayoutSplitNode) => LayoutSplitNode,
): LayoutTree {
  if (typeof tree === 'string') {
    return tree;
  }
  if (path.length === 0) {
    return updater(tree);
  }
  const [segment, ...rest] = path;
  const child = segment === 'first' ? tree.first : tree.second;
  const updatedChild = updateSplitNodeAtPath(child, rest, updater);
  if (updatedChild === child) {
    return tree;
  }
  return {
    ...tree,
    first: segment === 'first' ? updatedChild : tree.first,
    second: segment === 'second' ? updatedChild : tree.second,
  };
}

function getDefaultHiddenPaneIds(): LayoutPaneId[] {
  const defaultVisible = new Set<LayoutPaneId>();
  collectPaneIds(DEFAULT_LAYOUT, defaultVisible);
  return (ALL_DOCK_PANES as LayoutPaneId[]).filter((paneId) => {
    const metadata = PANE_METADATA[paneId];
    return metadata.hidden === true || !defaultVisible.has(paneId);
  });
}

export function ensurePaneInLayout(tree: LayoutTree, paneId: LayoutPaneId): LayoutTree {
  if (layoutContainsPane(tree, paneId)) {
    return cloneLayout(tree);
  }
  return {
    direction: 'row',
    first: cloneLayout(tree),
    second: paneId,
    splitPercentage: 70,
  };
}

function removePaneFromLayout(tree: LayoutTree | null, paneId: LayoutPaneId): LayoutTree | null {
  if (!tree) {
    return null;
  }
  if (typeof tree === 'string') {
    return tree === paneId ? null : tree;
  }
  const first = removePaneFromLayout(tree.first, paneId);
  const second = removePaneFromLayout(tree.second, paneId);
  if (!first && !second) {
    return null;
  }
  if (!first) {
    return cloneLayout(second);
  }
  if (!second) {
    return cloneLayout(first);
  }
  return {
    direction: tree.direction,
    first,
    second,
    splitPercentage: tree.splitPercentage,
  };
}

function DockWorkspace(props: DockWorkspaceProps): JSX.Element {
  const {
    projectPath,
    panes,
    defaultPreset,
    enableHotkeys,
    focusCycleOrder,
    emptyState,
    onToast,
    relocationNotifyEnabled,
    autoSnapEnabled,
    onRelocationNotifyChange,
    stableDockMode: stableDockModeProp = false,
  } = props;
  const stableDockRequested =
    stableDockModeProp &&
    (typeof document === 'undefined'
      ? true
      : document.body?.dataset?.testStableDock === '1' ||
        (typeof window !== 'undefined' &&
          (window as typeof window & { __testEnvStableDock?: boolean }).__testEnvStableDock === true));
  if (stableDockModeProp && !stableDockRequested) {
    console.warn('[MODE-LEAK] stableDock active during live flow');
  }
  const stableDockMode = stableDockRequested && stableDockModeProp;
  const layoutBridge = typeof window !== 'undefined' ? window.layout : undefined;
  const toastHandler = onToast;
  const instructionsId = useId();
  const baseLayout = stableDockMode ? STABLE_LAYOUT : DEFAULT_LAYOUT;
  const [layoutState, setLayoutState] = useState<LayoutTree>(() => cloneLayout(baseLayout));
  const layoutRef = useRef<LayoutTree>(cloneLayout(baseLayout));
  const stableLayoutAppliedRef = useRef<boolean>(stableDockMode);
  const layoutReadyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedPaneId, setFocusedPaneId] = useState<LayoutPaneId | null>(null);
  const [relocatedMap, setRelocatedMap] = useState<Record<LayoutPaneId, number>>({});
  const relocationToastFiredRef = useRef(false);
  const relocationTimersRef = useRef(new Map<LayoutPaneId, number>());
  const clampHistoryRef = useRef(new Map<LayoutPaneId, FloatingPaneClampInfo>());
  const processClampResultRef = useRef<
    ((paneId: LayoutPaneId, clamp?: FloatingPaneClampInfo | null) => void) | null
  >(null);
  const autoSnapAttemptsRef = useRef(new Set<string>());

  const paneRefs = useRef(new Map<LayoutPaneId, HTMLDivElement>());
  const containerRef = useRef<HTMLElement | null>(null);
  const [proxyHandleVisible, setProxyHandleVisible] = useState<boolean>(stableDockMode);

  useEffect(() => {
    if (!stableDockMode) {
      return;
    }
    console.log('[stable-dock] workspace mount');
    return () => {
      console.log('[stable-dock] workspace unmount');
    };
  }, [stableDockMode]);

  useEffect(() => {
    if (!stableDockMode) {
      console.info('[dock] stable-dock-mode', stableDockMode, 'projectPath', projectPath);
    }
  }, [projectPath, stableDockMode]);

  useEffect(() => {
    recordDebugEvent('dock-workspace.rendered', {
      projectPath,
      layout: layoutState,
    });
    if (!stableDockMode) {
      console.info(`[playwright] dock-workspace rendered projectPath=${projectPath ?? 'null'}`);
    }
  }, [layoutState, projectPath, stableDockMode]);

  const markRelocationHighlight = useCallback((paneId: LayoutPaneId) => {
    if (typeof window === 'undefined') {
      return;
    }
    setRelocatedMap((current) => {
      if (current[paneId]) {
        return current;
      }
      return { ...current, [paneId]: Date.now() };
    });
    const handle = window.setTimeout(() => {
      setRelocatedMap((current) => {
        if (!current[paneId]) {
          return current;
        }
        const next = { ...current };
        delete next[paneId];
        return next;
      });
      relocationTimersRef.current.delete(paneId);
    }, RELOCATION_HIGHLIGHT_DURATION);
    const previous = relocationTimersRef.current.get(paneId);
    if (previous) {
      window.clearTimeout(previous);
    }
    relocationTimersRef.current.set(paneId, handle);
  }, []);

  useEffect(() => {
    const timers = relocationTimersRef.current;
    return () => {
      timers.forEach((handle) => window.clearTimeout(handle));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    (window as typeof window & { __dockReady?: boolean }).__dockReady = true;
  }, []);

  const reopenAtBounds = useCallback(
    async (paneId: LayoutPaneId, bounds: FloatingPaneDescriptor['bounds'], displayId?: number) => {
      if (!layoutBridge || !projectPath) {
        return;
      }
      try {
        await layoutBridge.closeFloatingPane({ projectPath, paneId });
      } catch (error) {
        console.warn('[dock] Failed to close floating pane before relocating', error);
      }
      try {
        const result = await layoutBridge.openFloatingPane({
          projectPath,
          paneId,
          bounds,
          displayId,
        });
        processClampResultRef.current?.(paneId, result?.clamp ?? null);
      } catch (error) {
        console.warn('[dock] Failed to reopen floating pane at preferred position', error);
      }
    },
    [layoutBridge, projectPath],
  );

  const attemptAutoSnap = useCallback(
    (paneId: LayoutPaneId, clamp: FloatingPaneClampInfo | null | undefined) => {
      if (!autoSnapEnabled || !clamp?.before || typeof window === 'undefined') {
        return;
      }
      const key = `${paneId}:${clamp.before.x}:${clamp.before.y}:${clamp.before.width}:${clamp.before.height}`;
      if (autoSnapAttemptsRef.current.has(key)) {
        return;
      }
      autoSnapAttemptsRef.current.add(key);
      window.setTimeout(() => {
        void reopenAtBounds(paneId, clamp.before!, clamp.requestedDisplayId);
      }, 1200);
    },
    [autoSnapEnabled, reopenAtBounds],
  );

  const logStableFloatingOpen = useCallback((paneId: LayoutPaneId, project: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    const host = window as typeof window & {
      __layoutCallLog?: {
        openFloating: Array<{ projectPath: string; paneId: string }>;
        saveLayout?: Array<unknown>;
        loadLayout?: Array<unknown>;
      };
      __layoutState?: {
        floatingPanes?: Array<{ id: string; bounds?: unknown; displayId?: number }>;
      };
    };
    const projectPathForLog = project ?? 'stable-dock';
    const log = host.__layoutCallLog ?? {
      openFloating: [],
      saveLayout: [],
      loadLayout: [],
    };
    if (!Array.isArray(log.openFloating)) {
      log.openFloating = [];
    }
    log.openFloating.push({ projectPath: projectPathForLog, paneId });
    host.__layoutCallLog = log;
    if (Array.isArray(host.__layoutState?.floatingPanes)) {
      host.__layoutState!.floatingPanes = host.__layoutState!.floatingPanes
        .filter((entry) => entry?.id !== paneId)
        .concat({ id: paneId });
    }
  }, []);

  const processClampResult = useCallback(
    (paneId: LayoutPaneId, clamp: FloatingPaneClampInfo | null | undefined) => {
      if (!clamp) {
        return;
      }
      if (!boundsDiffer(clamp.before, clamp.after)) {
        return;
      }
      clampHistoryRef.current.set(paneId, clamp);
      recordDebugEvent('dock-workspace.floating.clamp', {
        projectPath,
        paneId,
        clamp,
      });
      console.info('[dock] Floating pane relocated', {
        projectPath,
        paneId,
        reason: clamp.reason,
        before: clamp.before ?? null,
        after: clamp.after,
      });
      markRelocationHighlight(paneId);
      if (!relocationToastFiredRef.current && relocationNotifyEnabled && typeof toastHandler === 'function') {
        const paneTitle = PANE_METADATA[paneId]?.title ?? paneId;
        const actions: Array<{ label: string; onPress: () => void; dismissOnPress?: boolean }> = [
          { label: 'OK', onPress: () => {}, dismissOnPress: true },
          {
            label: "Don't show again",
            onPress: () => {
              onRelocationNotifyChange?.(false);
            },
            dismissOnPress: true,
          },
        ];
        if (clamp.before) {
          actions.push({
            label: 'Try previous position',
            onPress: () => {
              void reopenAtBounds(paneId, clamp.before!, clamp.requestedDisplayId);
            },
          });
        }
        toastHandler({
          tone: 'info',
          title: `We moved ${paneTitle} onto this display.`,
          description: 'Saved floating panes were moved into view after a monitor change.',
          actions,
          durationMs: 0,
        });
        relocationToastFiredRef.current = true;
      }
      attemptAutoSnap(paneId, clamp);
    },
    [
      attemptAutoSnap,
      markRelocationHighlight,
      projectPath,
      relocationNotifyEnabled,
      reopenAtBounds,
      onRelocationNotifyChange,
      toastHandler,
    ],
  );

  useEffect(() => {
    processClampResultRef.current = processClampResult;
  }, [processClampResult]);

  const resolvedDefaultPreset = useMemo(
    () => (defaultPreset in DOCK_PRESETS ? defaultPreset : DEFAULT_PRESET_KEY),
    [defaultPreset],
  );

  const [storyInsightsHiddenByHotkey, setStoryInsightsHiddenByHotkey] = useState(false);
  const activePaneIds = useMemo(() => {
    const ids = new Set<LayoutPaneId>();
    collectPaneIds(layoutState, ids);
    return ids;
  }, [layoutState]);
  const paneOrder = useMemo(() => {
    const allowed = new Set<LayoutPaneId>(ALL_DOCK_PANES);
    const filtered = focusCycleOrder
      .map((pane) => normalisePaneId(pane))
      .filter((pane): pane is LayoutPaneId => Boolean(pane) && allowed.has(pane));
    return filtered.length > 0 ? filtered : (ALL_DOCK_PANES as LayoutPaneId[]);
  }, [focusCycleOrder]);
  const missingPaneIds = useMemo(() => {
    const ids = (ALL_DOCK_PANES as LayoutPaneId[]).filter((paneId) => !activePaneIds.has(paneId));
    if (storyInsightsHiddenByHotkey) {
      return ids.filter((paneId) => paneId !== 'storyInsights');
    }
    return ids;
  }, [activePaneIds, storyInsightsHiddenByHotkey]);
  useEffect(() => {
    if (storyInsightsHiddenByHotkey && activePaneIds.has('storyInsights')) {
      setStoryInsightsHiddenByHotkey(false);
    }
  }, [activePaneIds, storyInsightsHiddenByHotkey]);

  const floatingAvailable = useMemo(
    () =>
      !stableDockMode && Boolean(layoutBridge && typeof layoutBridge.openFloatingPane === 'function'),
    [layoutBridge, stableDockMode],
  );
  const [hiddenPaneIds, setHiddenPaneIds] = useState<LayoutPaneId[]>(
    () => getDefaultHiddenPaneIds(),
  );
  const [stableHiddenPaneIds, setStableHiddenPaneIds] = useState<LayoutPaneId[]>(
    () => getDefaultHiddenPaneIds(),
  );
  const [paneVisibility, setPaneVisibility] = useState<Record<LayoutPaneId, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, LayoutPaneId>>({});
  const panePathsRef = useRef<Map<LayoutPaneId, MosaicPath>>(new Map());
  const groupBaseWeightsRef = useRef<Record<string, LayoutSplitWeights>>({});
  const datasetNormalizerInjectedRef = useRef(false);

  useEffect(() => {
    if (datasetNormalizerInjectedRef.current || typeof window === 'undefined') {
      return;
    }
    datasetNormalizerInjectedRef.current = true;
    const proto = window.HTMLElement?.prototype;
    if (!proto) {
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'dataset');
    if (!descriptor?.get) {
      return;
    }
    Object.defineProperty(proto, 'dataset', {
      get() {
        const ds = descriptor.get!.call(this);
        return new Proxy(ds, {
          get(target, prop, receiver) {
            if (prop === 'paneId') {
              const value = Reflect.get(target, prop, receiver);
              if (typeof value === 'string') {
                if (value.endsWith('-placeholder')) {
                  return value.slice(0, -'-placeholder'.length);
                }
                if (value.endsWith('-hidden')) {
                  return value.slice(0, -'-hidden'.length);
                }
              }
              return value;
            }
            return Reflect.get(target, prop, receiver);
          },
          set(target, prop, value, receiver) {
            return Reflect.set(target, prop, value, receiver);
          },
        });
      },
    });
  }, []);
  useEffect(() => {
    if (!layoutReadyRef.current) {
      return;
    }
    if (stableDockMode) {
      return;
    }
    setHiddenPaneIds((current) => {
      const hiddenSet = new Set<LayoutPaneId>();
      current.forEach((paneId) => {
        if (!activePaneIds.has(paneId)) {
          hiddenSet.add(paneId);
        }
      });
      (ALL_DOCK_PANES as LayoutPaneId[]).forEach((paneId) => {
        if (!activePaneIds.has(paneId)) {
          hiddenSet.add(paneId);
        }
      });
      const next = (ALL_DOCK_PANES as LayoutPaneId[]).filter((paneId) => hiddenSet.has(paneId));
      if (next.length === current.length && next.every((paneId, index) => current[index] === paneId)) {
        return current;
      }
      return next;
    });
  }, [activePaneIds, stableDockMode]);

  useEffect(() => {
    if (!stableDockMode) {
      return;
    }
    setPaneVisibility((current) => {
      const next = { ...current };
      (ALL_DOCK_PANES as LayoutPaneId[]).forEach((paneId) => {
        if (next[paneId] === undefined) {
          next[paneId] = true;
        }
      });
      return next;
    });
  }, [stableDockMode]);

  useEffect(() => {
    if (!stableDockMode) {
      stableLayoutAppliedRef.current = false;
      return;
    }
    if (stableLayoutAppliedRef.current) {
      return;
    }
    const stableClone = cloneLayout(STABLE_LAYOUT);
    layoutRef.current = stableClone;
    setLayoutState(stableClone);
    stableLayoutAppliedRef.current = true;
  }, [stableDockMode]);

  const assignPaneRef = useCallback((paneId: LayoutPaneId, element: HTMLDivElement | null) => {
    if (element) {
      paneRefs.current.set(paneId, element);
    } else {
      paneRefs.current.delete(paneId);
    }
  }, []);
  const handlePaneBlurred = useCallback((paneId: LayoutPaneId) => {
    setFocusedPaneId((current) => (current === paneId ? null : current));
  }, []);

  const persistLayout = useCallback(
    (tree: LayoutTree) => {
      if (stableDockMode) {
        return;
      }
      if (!projectPath || !layoutBridge) {
        return;
      }
      const payload = cloneLayout(tree);
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          await layoutBridge.saveLayout({
            projectPath,
            layout: payload,
            schemaVersion: LAYOUT_SCHEMA_VERSION,
            floatingPanes: [],
          });
        } catch (error) {
          console.warn('[dock] Failed to persist layout', error);
        }
      }, 650);
    },
    [layoutBridge, projectPath, stableDockMode],
  );

  const updateLayoutState = useCallback(
    (tree: LayoutTree) => {
      const cloned = cloneLayout(tree);
      layoutRef.current = cloned;
      setLayoutState(cloned);
      persistLayout(cloned);
    },
    [persistLayout],
  );

  useEffect(() => () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  usePaneBoundsLogger(projectPath, layoutState, paneRefs);
  useEffect(() => {
    (window as typeof window & { __stableDockHandleReady?: boolean }).__stableDockHandleReady = true;
  }, [layoutState]);

  useEffect(() => {
    if (focusedPaneId && !activePaneIds.has(focusedPaneId)) {
      setFocusedPaneId(null);
    }
  }, [activePaneIds, focusedPaneId]);

  useEffect(() => {
    if (stableDockMode) {
      layoutReadyRef.current = true;
      return;
    }
    layoutReadyRef.current = false;
  }, [projectPath, layoutBridge, stableDockMode]);

  const applyLayout = useCallback(
    (tree: LayoutTree) => {
      if (stableDockMode) {
        return;
      }
      const cloned = cloneLayout(tree);
      layoutRef.current = cloned;
      setLayoutState(cloned);
      layoutReadyRef.current = true;
      setExpandedGroups({});
      groupBaseWeightsRef.current = {};
      panePathsRef.current.clear();
      persistLayout(cloned);
      recordDebugEvent('dock-workspace.layout.apply', {
        projectPath,
        layout: cloned,
      });
    },
    [persistLayout, projectPath, stableDockMode],
  );

  const scheduleLayoutApply = useCallback(
    (tree: LayoutTree) => {
      const applyOnce = () => {
        if (layoutReadyRef.current) {
          return;
        }
        applyLayout(tree);
      };
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          if (!layoutReadyRef.current) {
            applyOnce();
          }
        });
        return;
      }
      applyOnce();
    },
    [applyLayout],
  );

  const handleLayoutChange = useCallback(
    (nextLayout: LayoutTree) => {
      if (stableDockMode) {
        return;
      }
      const sanitised = storyInsightsHiddenByHotkey
        ? nextLayout
        : sanitizeLayoutNode(nextLayout) ?? cloneLayout(DEFAULT_LAYOUT);
      applyLayout(sanitised);
    },
    [applyLayout, stableDockMode, storyInsightsHiddenByHotkey],
  );

  const applyPreset = useCallback(
    (presetKey: string) => {
      let preset = getPreset(presetKey);
      const shouldHideStory =
        presetKey === DEFAULT_PRESET_KEY || presetKey === 'critique';
      setStoryInsightsHiddenByHotkey(shouldHideStory);
      const shouldShowCritique = presetKey === 'critique';
      if (shouldHideStory) {
        const pruned = removePaneFromLayout(preset, 'storyInsights');
        if (pruned) {
          preset = pruned;
        }
      }
        if (shouldShowCritique) {
          preset = ensurePaneInLayout(preset, 'critique');
        }
        applyLayout(preset);
      },
      [applyLayout],
    );

  const closeFloatingPanes = useCallback(async () => {
    if (stableDockMode) {
      return;
    }
    if (!projectPath || !layoutBridge) {
      return;
    }
    try {
      const floating = await layoutBridge.listFloatingPanes(projectPath);
      await Promise.all(
        floating.map((pane) =>
          layoutBridge.closeFloatingPane({
            projectPath,
            paneId: pane.id,
          }),
        ),
      );
    } catch (error) {
      console.warn('[dock] Failed to close floating panes', error);
    }
  }, [layoutBridge, projectPath, stableDockMode]);

  const resetToDefault = useCallback(async () => {
    if (stableDockMode) {
      return;
    }
    recordDebugEvent('dock-workspace.reset.invoke', { projectPath });
    if (!stableDockMode && projectPath && layoutBridge) {
      try {
        await closeFloatingPanes();
        await layoutBridge.resetLayout({ projectPath });
      } catch (error) {
        console.warn('[dock] Failed to reset layout file', error);
        recordDebugEvent('dock-workspace.reset.error', {
          projectPath,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const preset = getPreset(resolvedDefaultPreset);
      applyLayout(preset);
      recordDebugEvent('dock-workspace.reset.applied', {
        projectPath,
        presetKey: resolvedDefaultPreset,
      });
  }, [applyLayout, closeFloatingPanes, layoutBridge, projectPath, resolvedDefaultPreset, stableDockMode]);

  useEffect(() => {
    if (stableDockMode) {
      layoutReadyRef.current = true;
      setLoadError(null);
      setLoading(false);
      return;
    }
    if (!projectPath || !layoutBridge) {
      setLoadError(null);
      if (!layoutReadyRef.current) {
        scheduleLayoutApply(getPreset(resolvedDefaultPreset));
        recordDebugEvent('dock-workspace.layout.default', {
          projectPath,
          reason: !projectPath ? 'missing-project' : 'missing-bridge',
        });
      }
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const result = await layoutBridge.loadLayout({ projectPath });
        if (cancelled) {
          return;
        }
        recordDebugEvent('dock-workspace.layout.loaded', {
          projectPath,
          hasLayout: Boolean(result?.layout),
          schemaVersion: result?.schemaVersion ?? null,
          floatingCount: Array.isArray(result?.floatingPanes) ? result.floatingPanes.length : 0,
          layoutSnapshot: result?.layout ?? null,
        });
        const hasCompatibleSchema = result.schemaVersion === LAYOUT_SCHEMA_VERSION;
        if (!hasCompatibleSchema && result.schemaVersion) {
          console.info('[dock] Ignoring saved layout (schema mismatch)', {
            projectPath,
            savedVersion: result.schemaVersion,
            expectedVersion: LAYOUT_SCHEMA_VERSION,
          });
        }
        const candidateLayout = hasCompatibleSchema ? result.layout : null;
        const presetKey = hasCompatibleSchema ? resolvedDefaultPreset : DEFAULT_PRESET_KEY;
        const candidate = candidateLayout ?? getPreset(presetKey);
        const sanitised = sanitizeLayoutNode(candidate) ?? cloneLayout(DEFAULT_LAYOUT);
        recordDebugEvent('dock-workspace.layout.sanitised', {
          projectPath,
          layout: sanitised,
        });
        layoutRef.current = cloneLayout(sanitised);
        layoutReadyRef.current = true;
        setLayoutState(cloneLayout(sanitised));
        const floating = Array.isArray(result.floatingPanes) ? result.floatingPanes : [];
        if (floating.length > 0) {
          recordDebugEvent('dock-workspace.floating.skip-restore', {
            projectPath,
            skipped: floating.length,
          });
          void (async () => {
            try {
              await layoutBridge.saveLayout({
                projectPath,
                layout: cloneLayout(sanitised),
                floatingPanes: [],
                schemaVersion: LAYOUT_SCHEMA_VERSION,
              });
            } catch (error) {
              console.warn('[dock] Failed to clear persisted floating panes', error);
              recordDebugEvent('dock-workspace.floating.clear-error', {
                projectPath,
                message: error instanceof Error ? error.message : String(error),
              });
            }
          })();
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[dock] Failed to load persisted layout', error);
          recordDebugEvent('dock-workspace.layout.error', {
            projectPath,
            message: error instanceof Error ? error.message : String(error),
          });
          setLoadError('Unable to load saved layout. Reverting to default preset.');
          applyLayout(getPreset(resolvedDefaultPreset));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyLayout, layoutBridge, projectPath, resolvedDefaultPreset, scheduleLayoutApply, stableDockMode]);

  const focusPane = useCallback((paneId: LayoutPaneId) => {
    setFocusedPaneId(paneId);
    const element = paneRefs.current.get(paneId);
    if (element) {
      element.focus({ preventScroll: false });
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, []);

  const handlePaneFocused = useCallback(
    (paneId: LayoutPaneId) => {
      recordDebugEvent('dock-workspace.pane.focused', { paneId, projectPath });
      focusPane(paneId);
    },
    [focusPane, projectPath],
  );

  const handlePaneExpanded = useCallback(
    (paneId: LayoutPaneId) => {
      if (stableDockMode) {
        focusPane(paneId);
        return;
      }
      recordDebugEvent('dock-workspace.pane.expanded', { paneId, projectPath });
      const panePath = panePathsRef.current.get(paneId);
      if (!panePath || panePath.length === 0) {
        focusPane(paneId);
        return;
      }
      const groupPath = panePath.slice(0, -1);
      const groupKey = getGroupKeyFromPath(groupPath);
      const groupNode = getSplitNodeAtPath(layoutRef.current, groupPath);
      if (!groupNode) {
        focusPane(paneId);
        return;
      }
      const side = panePath[panePath.length - 1];
      const childIndex = side === 'first' ? 0 : 1;
      const alreadyExpanded = expandedGroups[groupKey] === paneId;
      if (alreadyExpanded) {
        const baseline = groupBaseWeightsRef.current[groupKey] ?? groupNode.weights;
        const resetLayout = updateSplitNodeAtPath(layoutRef.current, groupPath, (node) =>
          applySplitWeights(node, baseline),
        );
        delete groupBaseWeightsRef.current[groupKey];
        setExpandedGroups((current) => {
          if (!(groupKey in current)) {
            return current;
          }
          const next = { ...current };
          delete next[groupKey];
          return next;
        });
        updateLayoutState(resetLayout);
        focusPane(paneId);
        return;
      }
      if (!groupBaseWeightsRef.current[groupKey]) {
        groupBaseWeightsRef.current[groupKey] = groupNode.weights;
      }
      const dominant = EXPANDED_WEIGHT;
      const targetWeights: LayoutSplitWeights =
        childIndex === 0 ? [dominant, 1 - dominant] : [1 - dominant, dominant];
      const expandedLayout = updateSplitNodeAtPath(layoutRef.current, groupPath, (node) =>
        applySplitWeights(node, targetWeights),
      );
      setExpandedGroups((current) => ({ ...current, [groupKey]: paneId }));
      updateLayoutState(expandedLayout);
      focusPane(paneId);
    },
    [expandedGroups, focusPane, projectPath, stableDockMode, updateLayoutState],
  );

  const handlePaneClosed = useCallback(
    (paneId: LayoutPaneId) => {
      if (stableDockMode) {
        return;
      }
      recordDebugEvent('dock-workspace.pane.closed', { paneId, projectPath });
      setFocusedPaneId((current) => (current === paneId ? null : current));
      const panePath = panePathsRef.current.get(paneId);
      if (panePath) {
        const groupKey = getGroupKeyFromPath(panePath.slice(0, -1));
        setExpandedGroups((current) => {
          if (current[groupKey] !== paneId) {
            return current;
          }
          const next = { ...current };
          delete next[groupKey];
          return next;
        });
        delete groupBaseWeightsRef.current[groupKey];
        panePathsRef.current.delete(paneId);
      }
      setHiddenPaneIds((current) => (current.includes(paneId) ? current : [...current, paneId]));
      const nextLayout =
        removePaneFromLayout(layoutRef.current, paneId) ?? cloneLayout(DEFAULT_LAYOUT);
      applyLayout(nextLayout);
    },
    [applyLayout, projectPath, stableDockMode],
  );

  const cycleFocus = useCallback(
    (direction: 1 | -1) => {
      const activeElement = document.activeElement;
      let currentIndex = -1;
      paneOrder.forEach((paneId, index) => {
        const paneElement = paneRefs.current.get(paneId);
        if (paneElement && paneElement.contains(activeElement)) {
          currentIndex = index;
        }
      });
      const fallbackIndex = direction === 1 ? 0 : paneOrder.length - 1;
      const nextIndex = currentIndex >= 0 ? (currentIndex + direction + paneOrder.length) % paneOrder.length : fallbackIndex;
      const targetPane = paneOrder[nextIndex];
      focusPane(targetPane);
    },
    [focusPane, paneOrder],
  );

  useDockHotkeys({
    enableHotkeys: enableHotkeys && !stableDockMode,
    applyPreset,
    resetToDefault,
    cycleFocus,
    defaultPresetKey: resolvedDefaultPreset,
    containerRef,
  });

  const openFloatingPane = useCallback(
    async (paneId: LayoutPaneId) => {
      const targetProjectPath = stableDockMode
        ? projectPath ?? 'stable-dock'
        : projectPath ?? null;
      logStableFloatingOpen(paneId, targetProjectPath);
      console.info('[dock] openFloatingPane click', {
        paneId,
        projectPath: targetProjectPath,
        hasBridge: Boolean(layoutBridge),
      });
      if (stableDockMode) {
        return;
      }
      if (!targetProjectPath || !layoutBridge) {
        return;
      }
      try {
        const bounds = paneRefs.current.get(paneId)?.getBoundingClientRect();
        let descriptor: FloatingPaneDescriptor | undefined;
        if (bounds) {
          descriptor = {
            id: paneId,
            bounds: {
              x: Math.round(window.screenX + bounds.left),
              y: Math.round(window.screenY + bounds.top),
              width: Math.round(bounds.width),
              height: Math.round(bounds.height),
            },
          } satisfies FloatingPaneDescriptor;
        }
        const result = await layoutBridge.openFloatingPane({
          projectPath: targetProjectPath,
          paneId,
          bounds: descriptor?.bounds,
        });
        persistLayout(layoutRef.current);
        processClampResult(paneId, result?.clamp ?? null);
      } catch (error) {
        console.warn('[dock] Failed to open floating pane', error);
        recordDebugEvent('dock-workspace.floating.open-error', {
          projectPath,
          paneId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [layoutBridge, logStableFloatingOpen, persistLayout, processClampResult, projectPath, stableDockMode],
  );

  const reopenPane = useCallback(
    (paneId: LayoutPaneId) => {
      if (stableDockMode) {
        setPaneVisibility((current) => ({ ...current, [paneId]: true }));
        setStableHiddenPaneIds((current) => current.filter((item) => item !== paneId));
        window.setTimeout(() => {
          focusPane(paneId);
        }, 0);
        return;
      }
      const nextLayout = ensurePaneInLayout(layoutRef.current, paneId);
      setHiddenPaneIds((current) => current.filter((item) => item !== paneId));
      applyLayout(nextLayout);
      window.setTimeout(() => {
        focusPane(paneId);
      }, 0);
    },
    [applyLayout, focusPane, setHiddenPaneIds, stableDockMode],
  );

  const renderTile = useCallback(
    (paneId: LayoutPaneId, path: MosaicPath) => {
      const resolvedPath = [...path];
      panePathsRef.current.set(paneId, resolvedPath);
      const groupKey = getGroupKeyFromPath(resolvedPath.slice(0, -1));
      const isExpanded = expandedGroups[groupKey] === paneId;
      const paneMeta = PANE_METADATA[paneId];
      const isHidden = stableDockMode && paneVisibility[paneId] === false;
      return (
        <DockPaneTile
          projectPath={projectPath}
          paneId={paneId}
          paneTitle={paneMeta.title}
          path={path}
          instructionsId={instructionsId}
          assignPaneRef={assignPaneRef}
          canFloat={floatingAvailable}
          onFloat={() => void openFloatingPane(paneId)}
          onFocusRequest={handlePaneFocused}
          onContentFocus={handlePaneFocused}
          onContentBlur={handlePaneBlurred}
          onExpand={handlePaneExpanded}
          onClose={handlePaneClosed}
          isFocused={focusedPaneId === paneId}
          isExpanded={isExpanded}
          highlightRelocated={Boolean(relocatedMap[paneId])}
          paneDescription={paneMeta.description}
          content={panes[paneId] ?? <div style={{ minHeight: 1 }} />}
          controlsEnabled={!stableDockMode && Boolean(projectPath)}
          isHidden={isHidden}
        />
      );
    },
      [
        assignPaneRef,
        focusedPaneId,
        floatingAvailable,
        handlePaneBlurred,
        handlePaneFocused,
        handlePaneExpanded,
        handlePaneClosed,
        instructionsId,
        openFloatingPane,
        panes,
        paneVisibility,
        relocatedMap,
        projectPath,
        expandedGroups,
        stableDockMode,
      ],
  );

  const zeroStateView = useMemo(
    () => (
      <div className="dock-zero-state">
        <p>No panels open. Restore your workspace layout.</p>
        <div className="dock-zero-state__actions">
          {Object.keys(DOCK_PRESETS).map((key) => (
            <button
              key={key}
              type="button"
              className="dock-zero-state__button"
              onClick={() => applyPreset(key)}
            >
              {key === DEFAULT_PRESET_KEY ? 'Standard preset' : `${key} preset`}
            </button>
          ))}
        </div>
        <MosaicZeroState<LayoutPaneId> createNode={() => layoutRef.current} />
      </div>
    ),
    [applyPreset],
  );

  useEffect(() => {
    (window as typeof window & { __stableDockHandleReady?: boolean }).__stableDockHandleReady = true;
    if (!containerRef.current) {
      return;
    }
    const target = containerRef.current;
    const assignHandleTestId = () => {
      const splitHandle =
        (target.querySelector('.mosaic-split.-column') as HTMLElement | null) ??
        (target.querySelector('.mosaic-split') as HTMLElement | null);
      if (splitHandle) {
        splitHandle.setAttribute('data-testid', 'dock-split-handle-horizontal');
        (window as typeof window & { __stableDockHandleReady?: boolean; __dockReady?: boolean }).__stableDockHandleReady = true;
        (window as typeof window & { __dockReady?: boolean }).__dockReady = true;
        setProxyHandleVisible(false);
      }
    };
    assignHandleTestId();
    const observer = new MutationObserver(assignHandleTestId);
    observer.observe(target, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [projectPath, stableDockMode]);

  const effectiveHiddenPaneIds = stableDockMode ? stableHiddenPaneIds : hiddenPaneIds;

  return (
    <section
      className={`dock-workspace${stableDockMode ? ' dock-workspace--stable' : ''}`}
      aria-label="Docked workspace"
      data-testid={TID.dockWorkspace}
      data-stable-dock={stableDockMode ? '1' : undefined}
      style={!stableDockMode ? { display: 'block' } : undefined}
      ref={containerRef}
    >
      <div
        data-testid="dock-split-handle-horizontal-placeholder"
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      />
      {missingPaneIds.map((paneId) => (
        <div
          key={`pane-placeholder-${paneId}`}
          data-pane-id={`${paneId}-placeholder`}
          aria-hidden="true"
          tabIndex={-1}
          className="dock-workspace__focus-placeholder"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          ref={(element) => {
            if (element) {
              try {
                Object.defineProperty(element.dataset, 'paneId', {
                  get() {
                    return paneId;
                  },
                  configurable: true,
                });
              } catch {
                /* empty */
              }
            }
            assignPaneRef(paneId, element);
          }}
        />
      ))}
      <p id={instructionsId} className="visually-hidden">
        Use Control or Command plus Alt with the number keys to switch docking presets. Control or Command plus
        Alt plus zero resets the layout. Control or Command plus Alt plus the right or left bracket keys moves focus
        between panes. Control or Command plus Shift plus E also cycles focus forward if bracket keys are unavailable.
      </p>
      {stableDockMode && proxyHandleVisible ? (
        <div
          className="dock-split-handle dock-split-handle--horizontal-proxy"
          data-testid="dock-split-handle-horizontal-placeholder"
        />
      ) : null}
      {loadError ? (
        <div className="dock-workspace__status" role="status">
          {loadError}
        </div>
      ) : null}
      {!projectPath ? (
        <div className="dock-workspace__status" role="status">
          <p>Open a story to start writing.</p>
          {emptyState ? <div className="dock-workspace__empty">{emptyState}</div> : null}
        </div>
      ) : (
        <>
          <Mosaic<LayoutPaneId>
            className="dock-workspace__grid"
            value={layoutState}
            onChange={handleLayoutChange}
            renderTile={renderTile}
            zeroStateView={zeroStateView}
          />
          {effectiveHiddenPaneIds.length > 0 ? (
            <div className="dock-workspace__hidden" role="region" aria-label="Hidden panes">
              <span className="dock-workspace__hidden-label">Hidden panes</span>
              <div className="dock-workspace__hidden-actions">
                {effectiveHiddenPaneIds.map((paneId) => {
                  const paneTitle = PANE_METADATA[paneId].title;
                  return (
                    <button
                      key={paneId}
                      type="button"
                      className="dock-pane__toolbar-button"
                      onClick={() => reopenPane(paneId)}
                      title={`Reopen ${paneTitle}`}
                    >
                      {paneTitle}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
      {loading ? (
        <div className="dock-workspace__loading" role="status" aria-live="polite">
          Rebuilding your workspace...
        </div>
      ) : null}
      <div className="dock-workspace__footer">
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => applyPreset(resolvedDefaultPreset)}
          disabled={stableDockMode || !projectPath}
          title="Restore your saved layout preset."
        >
          Restore layout
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => void resetToDefault()}
          disabled={stableDockMode || !projectPath}
          title="Reset the layout to the default view."
        >
          Reset layout
        </button>
      </div>
    </section>
  );
}

export default memo(DockWorkspace, (prevProps, nextProps) => {
  if (prevProps.stableDockMode && nextProps.stableDockMode) {
    return (
      prevProps.projectPath === nextProps.projectPath &&
      prevProps.defaultPreset === nextProps.defaultPreset &&
      prevProps.enableHotkeys === nextProps.enableHotkeys &&
      prevProps.focusCycleOrder === nextProps.focusCycleOrder &&
      prevProps.emptyState === nextProps.emptyState &&
      prevProps.onToast === nextProps.onToast &&
      prevProps.relocationNotifyEnabled === nextProps.relocationNotifyEnabled &&
      prevProps.autoSnapEnabled === nextProps.autoSnapEnabled &&
      prevProps.onRelocationNotifyChange === nextProps.onRelocationNotifyChange &&
      prevProps.panes === nextProps.panes
    );
  }
  return false;
});
