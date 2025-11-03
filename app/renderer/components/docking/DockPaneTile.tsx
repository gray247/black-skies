import { cloneElement, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  MosaicWindow,
  type MosaicPath,
  type MosaicWindowToolbarProps,
} from 'react-mosaic-component';
import {
  DEFAULT_CONTROLS_WITH_CREATION,
  DEFAULT_CONTROLS_WITHOUT_CREATION,
} from 'react-mosaic-component/lib/buttons/defaultToolbarControls';

import type { LayoutPaneId } from '../../../shared/ipc/layout';
import { recordDebugEvent } from '../../utils/debugLog';

interface DockPaneTileProps {
  projectPath: string | null;
  paneId: LayoutPaneId;
  paneTitle: string;
  path: MosaicPath;
  instructionsId: string;
  assignPaneRef: (paneId: LayoutPaneId, element: HTMLDivElement | null) => void;
  onFloat: () => void;
  onFocus: () => void;
  content: ReactNode;
}

export default function DockPaneTile({
  projectPath,
  paneId,
  paneTitle,
  path,
  instructionsId,
  assignPaneRef,
  onFloat,
  onFocus,
  content,
}: DockPaneTileProps): JSX.Element {
  const serializedPath = useMemo(() => path.join('.'), [path]);
  const handleAssignRef = useCallback(
    (element: HTMLDivElement | null) => assignPaneRef(paneId, element),
    [assignPaneRef, paneId],
  );

  const renderToolbar = useCallback(
    (toolbarProps: MosaicWindowToolbarProps<LayoutPaneId>) => {
      const baseControls =
        (toolbarProps as unknown as { createNode?: unknown }).createNode != null
          ? DEFAULT_CONTROLS_WITH_CREATION
          : DEFAULT_CONTROLS_WITHOUT_CREATION;
      const defaultControls = baseControls.map((control, index) =>
        cloneElement(control as React.ReactElement, {
          key: `default-${paneId}-${index}`,
        }),
      );
      return (
        <div className="dock-pane__toolbar">
          {defaultControls}
          <button
            type="button"
            className="dock-pane__toolbar-button"
          onClick={onFloat}
          aria-label={`Detach ${paneTitle} pane`}
        >
          Float
        </button>
        <button
          type="button"
          className="dock-pane__toolbar-button"
          onClick={onFocus}
          aria-label={`Focus ${paneTitle} pane`}
          >
            Focus
          </button>
        </div>
      );
    },
    [onFloat, onFocus, paneId, paneTitle],
  );

  useEffect(() => {
    recordDebugEvent('dock-workspace.render-tile', {
      projectPath,
      paneId,
      path,
    });
  }, [paneId, projectPath, serializedPath]);

  return (
    <MosaicWindow<LayoutPaneId>
      className="dock-pane"
      path={path}
      title={paneTitle}
      renderToolbar={renderToolbar}
    >
      <div
        className="dock-pane__content"
        tabIndex={0}
        role="group"
        aria-label={paneTitle}
        aria-describedby={instructionsId}
        ref={handleAssignRef}
        data-pane-id={paneId}
      >
        {content}
      </div>
    </MosaicWindow>
  );
}
