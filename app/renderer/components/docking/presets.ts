import type { LayoutPaneId, LayoutTree } from '../../../shared/ipc/layout';
import { DEFAULT_LAYOUT } from '../../../shared/ipc/layout';

export const DEFAULT_PRESET_KEY = 'standard';

const ANALYSIS_PRESET: LayoutTree = {
  direction: 'row',
  first: {
    direction: 'column',
    first: 'wizard',
    second: 'history',
  },
  second: {
    direction: 'column',
    first: 'draft-board',
    second: 'analytics',
  },
};

const CRITIQUE_PRESET: LayoutTree = {
  direction: 'column',
  first: 'draft-board',
  second: {
    direction: 'row',
    first: 'critique',
    second: 'wizard',
  },
};

export const DOCK_PRESETS: Record<string, LayoutTree> = {
  [DEFAULT_PRESET_KEY]: DEFAULT_LAYOUT,
  analysis: ANALYSIS_PRESET,
  critique: CRITIQUE_PRESET,
};

export const ALL_DOCK_PANES: readonly LayoutPaneId[] = [
  'wizard',
  'draft-board',
  'critique',
  'history',
  'analytics',
];

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
