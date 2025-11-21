import {
  CANONICAL_PANES,
  DEFAULT_LAYOUT,
  type LayoutPaneId,
  type LayoutTree,
} from '../../../shared/ipc/layout';

export const DEFAULT_PRESET_KEY = 'standard';

export const DOCK_PRESETS: Record<string, LayoutTree> = {
  [DEFAULT_PRESET_KEY]: DEFAULT_LAYOUT,
};

export const ALL_DOCK_PANES: readonly LayoutPaneId[] = CANONICAL_PANES;

function cloneNode(node: LayoutTree | LayoutPaneId): LayoutTree | LayoutPaneId {
  if (typeof node === 'string') {
    return node;
  }
  return {
    direction: node.direction,
    first: cloneNode(node.first),
    second: cloneNode(node.second),
    splitPercentage: node.splitPercentage,
  };
}

export function cloneLayout(layout: LayoutTree): LayoutTree {
  return cloneNode(layout) as LayoutTree;
}

export function getPreset(name: string | undefined): LayoutTree {
  const preset = (name && DOCK_PRESETS[name]) || DOCK_PRESETS[DEFAULT_PRESET_KEY];
  return cloneLayout(preset);
}
