import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { LayoutPaneId } from '../../../shared/ipc/layout';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../../..');

const PANE_KEY_TO_ID: Record<string, LayoutPaneId> = {
  'Wizard pane': 'wizard',
  'Draft board': 'draft-board',
  'Critique results': 'critique',
  'History pane': 'history',
  'Analytics pane': 'analytics',
};

export interface GuiContract {
  paneLabels: Record<LayoutPaneId, string>;
  defaultPresetOrder: string[];
}

export function loadGuiContract(): GuiContract {
  const uiCopy = fs.readFileSync(path.join(repoRoot, 'docs', 'ui_copy_spec_v1.md'), 'utf-8');
  const guiLayouts = fs.readFileSync(path.join(repoRoot, 'docs', 'gui_layouts.md'), 'utf-8');

  const paneLabels: Record<LayoutPaneId, string> = {} as Record<LayoutPaneId, string>;

  const dockWorkspaceSection = uiCopy.split('## Dock workspace')[1]?.split('##')[0] ?? '';
  dockWorkspaceSection
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .slice(2) // skip header rows
    .forEach((line) => {
      const [rawKey, rawValue] = line.split('|').slice(1, 3).map((item) => item.trim());
      const paneId = PANE_KEY_TO_ID[rawKey];
      if (paneId && rawValue) {
        paneLabels[paneId] = rawValue.replace(/\s+/g, ' ').trim();
      }
    });

  const defaultPresetLine =
    guiLayouts
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /^\w.+\|\s*\w/.test(line) && line.includes('Writing view')) ?? '';
  const defaultPresetOrder = defaultPresetLine
    .split('|')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return {
    paneLabels,
    defaultPresetOrder,
  };
}
