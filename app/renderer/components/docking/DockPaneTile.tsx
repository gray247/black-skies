import { useCallback, useEffect, useMemo } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import {
  MosaicWindow,
  type MosaicPath,
  type MosaicWindowToolbarProps,
} from 'react-mosaic-component';

import type { LayoutPaneId } from '../../../shared/ipc/layout';
import { recordDebugEvent } from '../../utils/debugLog';

interface DockPaneTileProps {
  projectPath: string | null;
  paneId: LayoutPaneId;
  paneTitle: string;
  path: MosaicPath;
  instructionsId: string;
  assignPaneRef: (paneId: LayoutPaneId, element: HTMLDivElement | null) => void;
  canFloat: boolean;
  onFloat: () => void;
  onFocusRequest: (paneId: LayoutPaneId) => void;
  onContentFocus?: (paneId: LayoutPaneId) => void;
  onContentBlur?: (paneId: LayoutPaneId) => void;
  isFocused: boolean;
  highlightRelocated?: boolean;
  paneDescription?: string;
  content: ReactNode;
  onExpand?: (paneId: LayoutPaneId) => void;
  onClose?: (paneId: LayoutPaneId) => void;
  controlsEnabled?: boolean;
  isExpanded?: boolean;
  isHidden?: boolean;
  dataPaneId?: string;
}

export default function DockPaneTile({
  projectPath,
  paneId,
  paneTitle,
  path,
  instructionsId,
  assignPaneRef,
  canFloat,
  onFloat,
  onFocusRequest,
  onContentFocus,
  onContentBlur,
  isFocused,
  highlightRelocated,
  paneDescription,
  content,
  onExpand,
  onClose,
  controlsEnabled = true,
  isExpanded = false,
  isHidden = false,
  dataPaneId,
}: DockPaneTileProps): JSX.Element {
  const serializedPath = useMemo(() => path.join('.'), [path]);
  const handleAssignRef = useCallback(
    (element: HTMLDivElement | null) => assignPaneRef(paneId, element),
    [assignPaneRef, paneId],
  );

  useEffect(() => {
    const isStable = typeof document !== 'undefined' && document.body?.dataset?.testStableDock === '1';
    if (!isStable) {
      return;
    }
    console.log(`[stable-dock] mount ${paneId}`);
    return () => {
      console.log(`[stable-dock] unmount ${paneId}`);
    };
  }, [paneId]);

  const handleContentFocus = useCallback(
    (_event: FocusEvent<HTMLDivElement>) => {
      void _event;
      onContentFocus?.(paneId);
    },
    [onContentFocus, paneId],
  );

  const handleContentBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        onContentBlur?.(paneId);
      }
    },
    [onContentBlur, paneId],
  );

  const handleExpand = useCallback(() => {
    onExpand?.(paneId);
  }, [onExpand, paneId]);

  const handleClose = useCallback(() => {
    onClose?.(paneId);
  }, [onClose, paneId]);
  const actionDisabled = !controlsEnabled;
  const closeButton = useMemo(
    () => (
      <button
        type="button"
        className="dock-pane__toolbar-button"
        onClick={handleClose}
        title="Close this pane."
        aria-label={`Close ${paneTitle} pane`}
        data-testid={paneId === 'outline' ? 'close-outline-pane' : undefined}
        disabled={actionDisabled}
      >
        Close
      </button>
    ),
    [actionDisabled, handleClose, paneId, paneTitle],
  );

  const handleFocus = useCallback(() => {
    onFocusRequest(paneId);
  }, [onFocusRequest, paneId]);

  const toolbarContent = useMemo(
    () => (
      <div className="dock-pane__toolbar">
        <span className="dock-pane__titlebar" aria-hidden="true">
          {paneTitle}
        </span>
        <div className="dock-pane__toolbar-actions" data-testid="dock-pane-toolbar-actions">
          <button
            type="button"
            className="dock-pane__toolbar-button"
            onClick={handleExpand}
            title="Expand this pane."
            aria-label={`Expand ${paneTitle} pane`}
            disabled={actionDisabled}
          >
            Expand
          </button>
          {closeButton}
          <button
            type="button"
            className="dock-pane__toolbar-button"
            onClick={onFloat}
            aria-label={`Detach ${paneTitle} pane`}
            title="Open this pane in a separate window."
            disabled={!canFloat || actionDisabled}
          >
            Float
          </button>
          <button
            type="button"
            className="dock-pane__toolbar-button"
            onClick={handleFocus}
            aria-label={`Focus ${paneTitle} pane`}
            title="Focus this pane."
          >
            Focus
          </button>
        </div>
      </div>
    ),
    [actionDisabled, canFloat, closeButton, handleExpand, handleFocus, onFloat, paneTitle],
  );

  const renderToolbar = useCallback(
    (_toolbarProps: MosaicWindowToolbarProps<LayoutPaneId>) => {
      void _toolbarProps;
      return toolbarContent;
    },
    [toolbarContent],
  );

  useEffect(() => {
    recordDebugEvent('dock-workspace.render-tile', {
      projectPath,
      paneId,
      path: serializedPath,
    });
  }, [paneId, projectPath, serializedPath]);

  const safeContent = content ?? <div className="dock-pane__content-fallback" aria-hidden="true" />;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as typeof window & { __paneReady?: number };
      win.__paneReady = (win.__paneReady ?? 0) + 1;
    }
  }, []);

  return (
    <MosaicWindow<LayoutPaneId>
      className={`dock-pane${isFocused ? ' dock-pane--focused' : ''}${
        highlightRelocated ? ' dock-pane--relocated' : ''
      }${isExpanded ? ' dock-pane--expanded' : ''}${isHidden ? ' dock-pane--stable-hidden' : ''}`}
      path={path}
      title=""
      renderToolbar={renderToolbar}
    >
      {/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- pane content must be focusable for keyboard-only navigation */}
      <div
        className="dock-pane__content"
        tabIndex={0}
        role="group"
        aria-label={paneTitle}
        aria-describedby={instructionsId}
        title={paneDescription}
        ref={handleAssignRef}
        data-pane-id={dataPaneId ?? paneId}
        data-focused={isFocused ? 'true' : undefined}
        data-hidden={isHidden ? 'true' : undefined}
        aria-hidden={isHidden ? 'true' : undefined}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
      >
        {safeContent}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </MosaicWindow>
  );
}
