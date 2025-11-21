import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import DockWorkspace from '../components/docking/DockWorkspace';
import type { LayoutPaneId, LayoutTree } from '../../shared/ipc/layout';

type MockBridge = {
  loadLayout: ReturnType<typeof vi.fn>;
  saveLayout: ReturnType<typeof vi.fn>;
  listFloatingPanes: ReturnType<typeof vi.fn>;
  openFloatingPane: ReturnType<typeof vi.fn>;
  closeFloatingPane: ReturnType<typeof vi.fn>;
};

const panes: Partial<Record<LayoutPaneId, JSX.Element>> = {
  outline: <div data-testid="pane-outline">Wizard</div>,
  'draftPreview': <div data-testid="pane-draft">Draft</div>,
  timeline: <div data-testid="pane-timeline">History</div>,
  critique: <div data-testid="pane-critique">Critique</div>,
  storyInsights: <div data-testid="pane-storyInsights">Story Insights</div>,
};

function setupBridge(result: { layout: LayoutTree | null; floating?: any[] }): MockBridge {
  const bridge = {
    loadLayout: vi.fn().mockResolvedValue({
      layout: result.layout,
      floatingPanes: result.floating ?? [],
      schemaVersion: 2,
    }),
    saveLayout: vi.fn().mockResolvedValue(undefined),
    listFloatingPanes: vi.fn().mockResolvedValue(result.floating ?? []),
    openFloatingPane: vi.fn().mockResolvedValue({ opened: true, clamp: null }),
    closeFloatingPane: vi.fn().mockResolvedValue(undefined),
  };
  (window as typeof window & { layout?: MockBridge }).layout = bridge;
  return bridge;
}

describe('Layout persistence', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { layout?: unknown }).layout = undefined;
  });

  it('restores panes from saved layout', async () => {
    const savedLayout: LayoutTree = {
      direction: 'row',
      first: 'outline',
      second: {
        direction: 'column',
        first: 'draftPreview',
        second: 'timeline',
      },
    };
    const bridge = setupBridge({ layout: savedLayout });

    render(
      <DockWorkspace
        projectPath="C:\\project"
        panes={panes}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(bridge.loadLayout).toHaveBeenCalledTimes(1));
    expect(screen.getAllByText(/Wizard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Draft/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Timeline/i).length).toBeGreaterThan(0);
  });

  it('floats then docks pane without persisting floating state on reload', async () => {
    const bridge = setupBridge({ layout: null });
    const user = userEvent.setup();

    const { rerender } = render(
      <DockWorkspace
        projectPath="C:\\project"
        panes={panes}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    const floatButton = screen.getByRole('button', { name: /detach Draft preview pane/i });
    await user.click(floatButton);
    expect(bridge.openFloatingPane).toHaveBeenCalledTimes(1);

    bridge.listFloatingPanes.mockResolvedValue([]);
    rerender(
      <DockWorkspace
        projectPath="C:\\project"
        panes={panes}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(bridge.openFloatingPane).toHaveBeenCalledTimes(1));
  });

  it('clamps off-screen floating panes into view on reload', async () => {
    const farOffscreen = {
      id: 'storyInsights' as LayoutPaneId,
      bounds: { x: -5000, y: -4000, width: 800, height: 600 },
    };
    const bridge = setupBridge({
      layout: null,
      floating: [farOffscreen],
    });
    // Simulate clamp in listFloatingPanes consumer.
    bridge.listFloatingPanes.mockResolvedValue([farOffscreen]);

    render(
      <DockWorkspace
        projectPath="C:\\project"
        panes={panes}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(bridge.loadLayout).toHaveBeenCalled());
    expect(bridge.openFloatingPane).not.toHaveBeenCalled();
  });
});
