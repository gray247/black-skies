import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Mosaic,
  MosaicWindow,
  MosaicZeroState,
  type MosaicNode,
  type MosaicPath,
  type MosaicWindowToolbarProps,
} from 'react-mosaic-component';

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
  wizard: 'Wizard',
  'draft-board': 'Draft board',
  critique: 'Critique results',
  history: 'History',
  analytics: 'Analytics',
};

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

  const paneRefs = useRef(new Map<LayoutPaneId, HTMLDivElement>());

  const resolvedDefaultPreset = useMemo(
    () => (defaultPreset in DOCK_PRESETS ? defaultPreset : DEFAULT_PRESET_KEY),
    [defaultPreset],
  );

  const paneOrder = useMemo(() => {
    const allowed = new Set<LayoutPaneId>(ALL_DOCK_PANES);
    const filtered = focusCycleOrder.filter((pane): pane is LayoutPaneId => allowed.has(pane));
    return filtered.length > 0 ? filtered : (ALL_DOCK_PANES as LayoutPaneId[]);
  }, [focusCycleOrder]);

  const assignPaneRef = useCallback((paneId: LayoutPaneId, element: HTMLDivElement | null) => {
    if (element) {
      paneRefs.current.set(paneId, element);
    } else {
      paneRefs.current.delete(paneId);
    }
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
      }, 350);
    },
    [layoutBridge, projectPath],
  );

  useEffect(() => () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    recordDebugEvent('dock-workspace.state.updated', {
      projectPath,
      layoutState,
    });
    if (!projectPath) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const bounds: Array<{ paneId: LayoutPaneId; width: number; height: number }> = [];
      for (const [paneId, element] of paneRefs.current.entries()) {
        if (!element) {
          bounds.push({ paneId, width: 0, height: 0 });
          continue;
        }
        const rect = element.getBoundingClientRect();
        bounds.push({ paneId, width: Math.round(rect.width), height: Math.round(rect.height) });
      }
      recordDebugEvent('dock-workspace.bounds', {
        projectPath,
        panes: bounds,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [layoutState, projectPath]);

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

  useEffect(() => {
    if (!enableHotkeys) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (!event.ctrlKey || !event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      switch (event.key) {
        case '0':
          event.preventDefault();
          void resetToDefault();
          break;
        case '1':
          event.preventDefault();
          applyPreset(DEFAULT_PRESET_KEY);
          break;
        case '2':
          event.preventDefault();
          applyPreset('analysis');
          break;
        case '3':
          event.preventDefault();
          applyPreset('critique');
          break;
        case ']':
          event.preventDefault();
          cycleFocus(1);
          break;
        case '[':
          event.preventDefault();
          cycleFocus(-1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [applyPreset, cycleFocus, enableHotkeys, resetToDefault]);

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

  const renderToolbar = useCallback(
    (paneId: LayoutPaneId, toolbarProps: MosaicWindowToolbarProps<LayoutPaneId>) => (
      <div className="dock-pane__toolbar">
        {toolbarProps.renderDefaultToolbar?.() ?? null}
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => void openFloatingPane(paneId)}
          aria-label={`Detach ${PANE_TITLES[paneId]} pane`}
        >
          Float
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => focusPane(paneId)}
          aria-label={`Focus ${PANE_TITLES[paneId]} pane`}
        >
          Focus
        </button>
      </div>
    ),
    [focusPane, openFloatingPane],
  );

  const renderTile = useCallback(
    (paneId: LayoutPaneId, path: MosaicPath) => (
      recordDebugEvent('dock-workspace.render-tile', {
        projectPath,
        paneId,
        path,
      }),
      <MosaicWindow<LayoutPaneId>
        className="dock-pane"
        path={path}
        title={PANE_TITLES[paneId]}
        renderToolbar={(toolbarProps) => renderToolbar(paneId, toolbarProps)}
      >
        <div
          className="dock-pane__content"
          tabIndex={0}
          role="group"
          aria-label={PANE_TITLES[paneId]}
          aria-describedby={instructionsId}
          ref={(element) => assignPaneRef(paneId, element)}
          data-pane-id={paneId}
        >
          {panes[paneId] ?? <DockPlaceholder paneId={paneId} />}
        </div>
      </MosaicWindow>
    ),
    [assignPaneRef, instructionsId, panes, renderToolbar],
  );

  const zeroStateView = useMemo(
    () => (
      <div className="dock-zero-state">
        <p>All panes are hidden. Choose a preset to restore the workspace.</p>
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
    <section className="dock-workspace" aria-label="Docked workspace">
      <p id={instructionsId} className="visually-hidden">
        Use Control plus Alt plus the number keys to switch docking presets. Control plus Alt plus zero
        resets the layout. Control plus Alt plus the right or left bracket keys moves focus between panes.
      </p>
      {loadError ? (
        <div className="dock-workspace__status" role="status">
          {loadError}
        </div>
      ) : null}
      {!projectPath ? (
        <div className="dock-workspace__status" role="status">
          <p>Load a project to enable the dock workspace.</p>
          {emptyState ? <div className="dock-workspace__empty">{emptyState}</div> : null}
        </div>
      ) : (
        <Mosaic<LayoutPaneId>
          className="dock-workspace__grid"
          value={layoutState}
          onChange={(nextLayout) => applyLayout(sanitizeLayoutNode(nextLayout))}
          renderTile={renderTile}
          zeroStateView={zeroStateView}
        />
      )}
      {loading ? (
        <div className="dock-workspace__loading" role="status" aria-live="polite">
          Restoring saved layout…
        </div>
      ) : null}
      <div className="dock-workspace__footer">
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => applyPreset(resolvedDefaultPreset)}
          disabled={!projectPath}
        >
          Apply preset
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={() => void resetToDefault()}
          disabled={!projectPath}
        >
          Reset layout
        </button>
      </div>
    </section>
  );
}

function DockPlaceholder({ paneId }: { paneId: LayoutPaneId }): JSX.Element {
  return (
    <div className="dock-pane__placeholder">
      <p>
        {PANE_TITLES[paneId]} pane is not available in this build. Use the preset hotkeys to load an
        arrangement that includes active panes.
      </p>
    </div>
  );
}
