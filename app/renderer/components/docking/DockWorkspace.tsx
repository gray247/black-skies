import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Mosaic, MosaicZeroState, type MosaicNode, type MosaicPath } from 'react-mosaic-component';

import 'react-mosaic-component/react-mosaic-component.css';

import type {
  FloatingPaneDescriptor,
  LayoutPaneId,
  LayoutTree,
} from '../../../shared/ipc/layout';
import { DEFAULT_LAYOUT } from '../../../shared/ipc/layout';
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

const LAYOUT_SCHEMA_VERSION = 2;

type PaneContentMap = Partial<Record<LayoutPaneId, ReactNode>>;

interface DockWorkspaceProps {
  projectPath: string | null;
  panes: PaneContentMap;
  defaultPreset: string;
  enableHotkeys: boolean;
  focusCycleOrder: readonly LayoutPaneId[];
  emptyState?: ReactNode;
}

const PANE_TITLES: Record<LayoutPaneId, string> = {
  wizard: 'Outline',
  'draft-board': 'Writing view',
  critique: 'Feedback notes',
  history: 'Timeline',
  analytics: 'Story insights',
};

const PANE_DESCRIPTIONS: Record<LayoutPaneId, string> = {
  wizard: 'Plan chapters, scenes, and beats.',
  'draft-board': 'Write and edit your scene text.',
  critique: 'Review feedback and suggested revisions.',
  history: 'View previous versions and snapshots.',
  analytics: 'See pacing and emotion data.',
};

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

function isValidPaneId(value: unknown): value is LayoutPaneId {
  return typeof value === 'string' && (ALL_DOCK_PANES as readonly string[]).includes(value);
}

function sanitizeLayoutNode(node: MosaicNode<LayoutPaneId> | null): LayoutTree {
  if (!node) {
    return cloneLayout(DEFAULT_LAYOUT);
  }
  if (typeof node === 'string') {
    if (isValidPaneId(node)) {
      return node;
    }
    return cloneLayout(DEFAULT_LAYOUT);
  }
  const first = sanitizeLayoutNode(node.first);
  const second = sanitizeLayoutNode(node.second);
  if (!first || !second) {
    return cloneLayout(DEFAULT_LAYOUT);
  }
  return {
    direction: node.direction,
    first,
    second,
    splitPercentage: node.splitPercentage,
  };
}

export default function DockWorkspace(props: DockWorkspaceProps): JSX.Element {
  const { projectPath, panes, defaultPreset, enableHotkeys, focusCycleOrder, emptyState } = props;
  const layoutBridge = typeof window !== 'undefined' ? window.layout : undefined;
  const instructionsId = useId();
  const [layoutState, setLayoutState] = useState<LayoutTree>(() => cloneLayout(DEFAULT_LAYOUT));
  const layoutRef = useRef<LayoutTree>(cloneLayout(DEFAULT_LAYOUT));
  const saveTimerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [focusedPaneId, setFocusedPaneId] = useState<LayoutPaneId | null>(null);

  const paneRefs = useRef(new Map<LayoutPaneId, HTMLDivElement>());
  const containerRef = useRef<HTMLElement | null>(null);

  const resolvedDefaultPreset = useMemo(
    () => (defaultPreset in DOCK_PRESETS ? defaultPreset : DEFAULT_PRESET_KEY),
    [defaultPreset],
  );

  const paneOrder = useMemo(() => {
    const allowed = new Set<LayoutPaneId>(ALL_DOCK_PANES);
    const filtered = focusCycleOrder.filter((pane): pane is LayoutPaneId => allowed.has(pane));
    return filtered.length > 0 ? filtered : (ALL_DOCK_PANES as LayoutPaneId[]);
  }, [focusCycleOrder]);
  const floatingAvailable = useMemo(
    () => Boolean(layoutBridge && typeof layoutBridge.openFloatingPane === 'function'),
    [layoutBridge],
  );
  const activePaneIds = useMemo(() => {
    const ids = new Set<LayoutPaneId>();
    collectPaneIds(layoutState, ids);
    return ids;
  }, [layoutState]);
  const hiddenPaneIds = useMemo(
    () => (ALL_DOCK_PANES as LayoutPaneId[]).filter((paneId) => !activePaneIds.has(paneId)),
    [activePaneIds],
  );

  const assignPaneRef = useCallback((paneId: LayoutPaneId, element: HTMLDivElement | null) => {
    if (element) {
      paneRefs.current.set(paneId, element);
    } else {
      paneRefs.current.delete(paneId);
    }
  }, []);
  const handlePaneFocused = useCallback((paneId: LayoutPaneId) => {
    setFocusedPaneId(paneId);
  }, []);
  const handlePaneBlurred = useCallback((paneId: LayoutPaneId) => {
    setFocusedPaneId((current) => (current === paneId ? null : current));
  }, []);

  const persistLayout = useCallback(
    (tree: LayoutTree) => {
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
          });
        } catch (error) {
          console.warn('[dock] Failed to persist layout', error);
        }
      }, 650);
    },
    [layoutBridge, projectPath],
  );

  useEffect(() => () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  usePaneBoundsLogger(projectPath, layoutState, paneRefs);

  useEffect(() => {
    if (focusedPaneId && !activePaneIds.has(focusedPaneId)) {
      setFocusedPaneId(null);
    }
  }, [activePaneIds, focusedPaneId]);

  const applyLayout = useCallback(
    (tree: LayoutTree) => {
      const cloned = cloneLayout(tree);
      layoutRef.current = cloned;
      setLayoutState(cloned);
      persistLayout(cloned);
      recordDebugEvent('dock-workspace.layout.apply', {
        projectPath,
        layout: cloned,
      });
    },
    [persistLayout, projectPath],
  );

  const applyPreset = useCallback(
    (presetKey: string) => {
      const preset = getPreset(presetKey);
      applyLayout(preset);
    },
    [applyLayout],
  );

  const resetToDefault = useCallback(async () => {
    recordDebugEvent('dock-workspace.reset.invoke', { projectPath });
    if (projectPath && layoutBridge) {
      try {
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
  }, [applyLayout, layoutBridge, projectPath, resolvedDefaultPreset]);

  useEffect(() => {
    if (!projectPath || !layoutBridge) {
      setLoadError(null);
      applyLayout(getPreset(resolvedDefaultPreset));
      recordDebugEvent('dock-workspace.layout.default', {
        projectPath,
        reason: !projectPath ? 'missing-project' : 'missing-bridge',
      });
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
        const candidate = result.layout ?? getPreset(
          result.schemaVersion ? resolvedDefaultPreset : DEFAULT_PRESET_KEY,
        );
        const sanitised = sanitizeLayoutNode(candidate);
        recordDebugEvent('dock-workspace.layout.sanitised', {
          projectPath,
          layout: sanitised,
        });
        layoutRef.current = cloneLayout(sanitised);
        setLayoutState(cloneLayout(sanitised));
        const floating = Array.isArray(result.floatingPanes) ? result.floatingPanes : [];
        if (floating.length > 0) {
          void (async () => {
            for (const descriptor of floating) {
              if (!descriptor || !isValidPaneId(descriptor.id)) {
                continue;
              }
              if (cancelled) {
                break;
              }
              try {
                await layoutBridge.openFloatingPane({
                  projectPath,
                  paneId: descriptor.id,
                  bounds: descriptor.bounds,
                  displayId: descriptor.displayId,
                });
                recordDebugEvent('dock-workspace.floating.reopen', {
                  projectPath,
                  paneId: descriptor.id,
                });
              } catch (error) {
                console.warn('[dock] Failed to reopen floating pane', error);
                recordDebugEvent('dock-workspace.floating.reopen-error', {
                  projectPath,
                  paneId: descriptor.id,
                  message: error instanceof Error ? error.message : String(error),
                });
              }
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
  }, [applyLayout, layoutBridge, projectPath, resolvedDefaultPreset]);

  const focusPane = useCallback((paneId: LayoutPaneId) => {
    setFocusedPaneId(paneId);
    const element = paneRefs.current.get(paneId);
    if (element) {
      element.focus({ preventScroll: false });
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, []);

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
    enableHotkeys,
    applyPreset,
    resetToDefault,
    cycleFocus,
    defaultPresetKey: resolvedDefaultPreset,
    containerRef,
  });

  const openFloatingPane = useCallback(
    async (paneId: LayoutPaneId) => {
      if (!projectPath || !layoutBridge) {
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
        await layoutBridge.openFloatingPane({
          projectPath,
          paneId,
          bounds: descriptor?.bounds,
        });
        persistLayout(layoutRef.current);
      } catch (error) {
        console.warn('[dock] Failed to open floating pane', error);
        recordDebugEvent('dock-workspace.floating.open-error', {
          projectPath,
          paneId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [layoutBridge, persistLayout, projectPath],
  );

  const reopenPane = useCallback(
    (paneId: LayoutPaneId) => {
      const nextLayout = ensurePaneInLayout(layoutRef.current, paneId);
      applyLayout(nextLayout);
      window.setTimeout(() => {
        focusPane(paneId);
      }, 0);
    },
    [applyLayout, focusPane],
  );

  const renderTile = useCallback(
    (paneId: LayoutPaneId, path: MosaicPath) => (
      <DockPaneTile
        projectPath={projectPath}
        paneId={paneId}
        paneTitle={PANE_TITLES[paneId]}
        path={path}
        instructionsId={instructionsId}
        assignPaneRef={assignPaneRef}
        canFloat={floatingAvailable}
        onFloat={() => void openFloatingPane(paneId)}
        onFocusRequest={() => focusPane(paneId)}
        onContentFocus={handlePaneFocused}
        onContentBlur={handlePaneBlurred}
        isFocused={focusedPaneId === paneId}
        paneDescription={PANE_DESCRIPTIONS[paneId]}
        content={panes[paneId] ?? <div style={{ minHeight: 1 }} />}
      />
    ),
    [
      assignPaneRef,
      focusPane,
      focusedPaneId,
      floatingAvailable,
      handlePaneBlurred,
      handlePaneFocused,
      instructionsId,
      openFloatingPane,
      panes,
      projectPath,
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

  return (
    <section
      className="dock-workspace"
      aria-label="Docked workspace"
      data-testid={TID.dockWorkspace}
      ref={containerRef}
    >
      <p id={instructionsId} className="visually-hidden">
        Use Control or Command plus Alt with the number keys to switch docking presets. Control or Command plus
        Alt plus zero resets the layout. Control or Command plus Alt plus the right or left bracket keys moves focus
        between panes. Control or Command plus Shift plus E also cycles focus forward if bracket keys are unavailable.
      </p>
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
            onChange={(nextLayout) => applyLayout(sanitizeLayoutNode(nextLayout))}
            renderTile={renderTile}
            zeroStateView={zeroStateView}
          />
          {hiddenPaneIds.length > 0 ? (
            <div className="dock-workspace__hidden" role="region" aria-label="Hidden panes">
              <span className="dock-workspace__hidden-label">Hidden panes</span>
              <div className="dock-workspace__hidden-actions">
                {hiddenPaneIds.map((paneId) => (
                  <button
                    key={paneId}
                    type="button"
                    className="dock-pane__toolbar-button"
                    onClick={() => reopenPane(paneId)}
                    title={`Reopen ${PANE_TITLES[paneId]}`}
                  >
                    {PANE_TITLES[paneId]}
                  </button>
                ))}
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
          disabled={!projectPath}
          title="Restore your saved layout preset."
        >
          Restore layout
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => void resetToDefault()}
          disabled={!projectPath}
          title="Return to the default layout."
        >
          Default view
        </button>
      </div>
    </section>
  );
}
