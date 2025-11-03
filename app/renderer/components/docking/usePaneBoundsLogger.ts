import { useEffect } from 'react';
import type { MutableRefObject } from 'react';

import type { LayoutPaneId, LayoutTree } from '../../../shared/ipc/layout';
import { recordDebugEvent } from '../../utils/debugLog';

export function usePaneBoundsLogger(
  projectPath: string | null,
  layoutState: LayoutTree,
  paneRefs: MutableRefObject<Map<LayoutPaneId, HTMLDivElement>>,
): void {
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
        bounds.push({
          paneId,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
      recordDebugEvent('dock-workspace.bounds', {
        projectPath,
        panes: bounds,
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [layoutState, paneRefs, projectPath]);
}
