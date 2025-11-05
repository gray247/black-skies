import { useCallback, useContext, useEffect, useMemo } from 'react';
import type { FocusEvent, ReactNode } from 'react';
import {
  MosaicContext,
  MosaicWindow,
  MosaicWindowContext,
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
  onFocusRequest: () => void;
  onContentFocus?: (paneId: LayoutPaneId) => void;
  onContentBlur?: (paneId: LayoutPaneId) => void;
  isFocused: boolean;
  paneDescription?: string;
  content: ReactNode;
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
  paneDescription,
  content,
}: DockPaneTileProps): JSX.Element {
  const serializedPath = useMemo(() => path.join('.'), [path]);
  const mosaicContext = useContext(MosaicContext);
  const windowContext = useContext(MosaicWindowContext);
  const hasDockingContext = Boolean(mosaicContext && windowContext);

  const handleAssignRef = useCallback(
    (element: HTMLDivElement | null) => assignPaneRef(paneId, element),
    [assignPaneRef, paneId],
  );

  const handleContentFocus = useCallback(
    (_event: FocusEvent<HTMLDivElement>) => {
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
    if (!hasDockingContext || !mosaicContext || !windowContext) {
      return;
    }
    try {
      mosaicContext.mosaicActions.expand(windowContext.mosaicWindowActions.getPath());
    } catch (error) {
      console.warn('[dock] Failed to expand pane', error);
    }
  }, [hasDockingContext, mosaicContext, windowContext]);

  const handleClose = useCallback(() => {
    if (!hasDockingContext || !mosaicContext || !windowContext) {
      return;
    }
    try {
      mosaicContext.mosaicActions.remove(windowContext.mosaicWindowActions.getPath());
    } catch (error) {
      console.warn('[dock] Failed to close pane', error);
    }
  }, [hasDockingContext, mosaicContext, windowContext]);

  const renderToolbar = useCallback(
    (_toolbarProps: MosaicWindowToolbarProps<LayoutPaneId>) => (
      <div className="dock-pane__toolbar">
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={handleExpand}
          title="Expand this pane."
          aria-label={`Expand ${paneTitle} pane`}
          disabled={!hasDockingContext}
        >
          Expand
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={handleClose}
          title="Close this pane."
          aria-label={`Close ${paneTitle} pane`}
          disabled={!hasDockingContext}
        >
          Close
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={onFloat}
          aria-label={`Detach ${paneTitle} pane`}
          title="Open this pane in a separate window."
          disabled={!canFloat}
        >
          Float
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={onFocusRequest}
          aria-label={`Focus ${paneTitle} pane`}
          title="Focus this pane."
        >
          Focus
        </button>
      </div>
    ),
    [canFloat, handleClose, handleExpand, hasDockingContext, onFloat, onFocusRequest, paneTitle],
  );

  useEffect(() => {
    recordDebugEvent('dock-workspace.render-tile', {
      projectPath,
      paneId,
      path: serializedPath,
    });
  }, [paneId, projectPath, serializedPath]);

  return (
    <MosaicWindow<LayoutPaneId>
      className="dock-pane"
      path={path}
      title={paneTitle}
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
        data-pane-id={paneId}
        data-focused={isFocused ? 'true' : undefined}
        onFocus={handleContentFocus}
        onBlur={handleContentBlur}
      >
        {content}
      </div>
      {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
    </MosaicWindow>
  );
}
