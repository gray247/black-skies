import { render, waitFor, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';

import DockWorkspace from '../components/docking/DockWorkspace';
import type { LayoutPaneId, LayoutTree } from '../../shared/ipc/layout';
import { DEFAULT_LAYOUT, LAYOUT_SCHEMA_VERSION } from '../../shared/ipc/layout';

const PROJECT_PATH = 'sample/project';

function setupLayoutBridge(layout: LayoutTree | null = null): void {
  const bridge = {
    loadLayout: vi.fn().mockResolvedValue({
      layout,
      floatingPanes: [],
      schemaVersion: LAYOUT_SCHEMA_VERSION,
    }),
    saveLayout: vi.fn().mockResolvedValue(undefined),
    resetLayout: vi.fn().mockResolvedValue(undefined),
    listFloatingPanes: vi.fn().mockResolvedValue([]),
    openFloatingPane: vi.fn().mockResolvedValue({ opened: true, clamp: null }),
    closeFloatingPane: vi.fn().mockResolvedValue(undefined),
  };
  Object.defineProperty(window, 'layout', { value: bridge, configurable: true });
}

const paneContent: Partial<Record<LayoutPaneId, JSX.Element>> = {
  outline: <div data-testid="pane-outline">Outline</div>,
  draftPreview: <div data-testid="pane-draft">Draft</div>,
  storyInsights: <div data-testid="pane-insights">Insights</div>,
  corkboard: <div data-testid="pane-corkboard">Corkboard</div>,
};

describe('Hidden pane behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as typeof window & { layout?: unknown }).layout;
  });

  it('moves closed panes to the hidden dropdown and refocuses when reopened', async () => {
    setupLayoutBridge(null);
    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={paneContent}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(screen.getByRole('group', { name: 'Outline' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Close Outline pane/i }));

    await waitFor(() =>
      expect(screen.queryByRole('group', { name: 'Outline' })).toBeNull(),
    );

    const hiddenRegion = await screen.findByRole('region', { name: 'Hidden panes' });
    const hiddenButton = within(hiddenRegion).getByRole('button', { name: 'Outline' });
    fireEvent.click(hiddenButton);

    await waitFor(() => expect(screen.getByRole('group', { name: 'Outline' })).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getByRole('group', { name: 'Outline' })).toHaveAttribute('data-focused', 'true'),
    );
  });
});
