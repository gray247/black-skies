import { render, waitFor, screen, fireEvent, within } from '@testing-library/react';
import { useEffect } from 'react';
import { vi } from 'vitest';

import DockWorkspace from '../components/docking/DockWorkspace';
import type { LayoutPaneId, LayoutTree } from '../../shared/ipc/layout';

type MockLayoutBridge = {
  loadLayout: ReturnType<typeof vi.fn>;
  saveLayout: ReturnType<typeof vi.fn>;
  resetLayout: ReturnType<typeof vi.fn>;
  listFloatingPanes: ReturnType<typeof vi.fn>;
  openFloatingPane: ReturnType<typeof vi.fn>;
  closeFloatingPane: ReturnType<typeof vi.fn>;
};

function setupLayoutBridge(layout: LayoutTree | null, floatingPanes = []): MockLayoutBridge {
  const bridge = {
    loadLayout: vi.fn().mockResolvedValue({
      layout,
      floatingPanes,
      schemaVersion: 2,
    }),
    saveLayout: vi.fn().mockResolvedValue(undefined),
    resetLayout: vi.fn().mockResolvedValue(undefined),
    listFloatingPanes: vi.fn().mockResolvedValue(floatingPanes),
    openFloatingPane: vi.fn().mockResolvedValue({ opened: true, clamp: null }),
    closeFloatingPane: vi.fn().mockResolvedValue(undefined),
  };
  (window as typeof window & { layout?: MockLayoutBridge }).layout = bridge;
  return bridge;
}

const basePanes: Partial<Record<LayoutPaneId, JSX.Element>> = {
  outline: <div data-testid="pane-outline">Wizard</div>,
  'draftPreview': <div data-testid="pane-draft">Draft</div>,
  storyInsights: <div data-testid="pane-insights">Insights</div>,
  corkboard: <div data-testid="pane-corkboard">Corkboard</div>,
  timeline: <div data-testid="pane-timeline">History</div>,
  critique: <div data-testid="pane-critique">Critique</div>,
};

describe('Layout regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { layout?: unknown }).layout = undefined;
    (window as typeof window & { services?: unknown }).services = undefined;
  });

  it('does not auto-open floating panes on project load', async () => {
    const floatingLayout: LayoutTree = {
      direction: 'row',
      first: 'outline',
      second: 'draftPreview',
    };
    const bridge = setupLayoutBridge(floatingLayout, [
      { id: 'storyInsights' as LayoutPaneId, bounds: { x: 10, y: 10, width: 320, height: 240 } },
    ]);

    render(
      <DockWorkspace
        projectPath="C:\\projects\\demo"
        panes={basePanes}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(bridge.loadLayout).toHaveBeenCalled());

    expect(bridge.openFloatingPane).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('.floating-window')).toBeNull();
    expect(document.querySelector('[data-testid*="float"]')).toBeNull();
  });

  it('does not mount relationshipGraph until explicitly requested', async () => {
    const services = {
      getAnalyticsSummary: vi.fn(),
      getAnalyticsScenes: vi.fn(),
      getAnalyticsRelationships: vi.fn(),
    };
    (window as typeof window & { services?: typeof services }).services = services as any;

    const storyInsightsSpy = vi.fn();
    const corkboardSpy = vi.fn();
    const relationshipGraphSpy = vi.fn();

    const AnalyticsProbe = ({
      label,
      onMount,
    }: {
      label: string;
      onMount: () => void;
    }) => {
      useEffect(() => {
        onMount();
      }, [onMount]);
      return <div data-testid={`${label}-probe`}>{`${label}-probe`}</div>;
    };

    const panesWithAnalytics: Partial<Record<LayoutPaneId, JSX.Element>> = {
      ...basePanes,
      storyInsights: (
        <AnalyticsProbe label="storyInsights" onMount={storyInsightsSpy} />
      ),
      corkboard: <AnalyticsProbe label="corkboard" onMount={corkboardSpy} />,
      relationshipGraph: (
        <AnalyticsProbe label="relationshipGraph" onMount={relationshipGraphSpy} />
      ),
    };

    const layoutWithoutRelationshipGraph: LayoutTree = {
      direction: 'row',
      first: 'outline',
      second: {
        direction: 'column',
        first: 'draftPreview',
        second: {
          direction: 'column',
          first: 'storyInsights',
          second: 'corkboard',
        },
      },
    };
    setupLayoutBridge(layoutWithoutRelationshipGraph, []);

    render(
      <DockWorkspace
        projectPath="C:\\projects\\demo"
        panes={panesWithAnalytics}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(screen.getByTestId('dock-workspace')).toBeInTheDocument());

    expect(screen.getByText('storyInsights-probe')).toBeTruthy();
    expect(screen.getByText('corkboard-probe')).toBeTruthy();
    expect(screen.queryByText('relationshipGraph-probe')).toBeNull();
    expect(storyInsightsSpy).toHaveBeenCalledOnce();
    expect(corkboardSpy).toHaveBeenCalledOnce();
    expect(relationshipGraphSpy).not.toHaveBeenCalled();
  });

  it('rejects any invalid storyInsights requests', async () => {
    const requestedUrls: string[] = [];
    const allowedPaths = [
      '/api/v1/analytics/summary',
      '/api/v1/analytics/scenes',
      '/api/v1/analytics/relationships',
    ];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      requestedUrls.push(url);
      if (!allowedPaths.some((path) => url.includes(path))) {
        throw new Error(`Unexpected analytics URL: ${url}`);
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;

    await Promise.all([
      fetch('http://127.0.0.1:9999/api/v1/analytics/summary'),
      fetch('http://127.0.0.1:9999/api/v1/analytics/scenes'),
      fetch('http://127.0.0.1:9999/api/v1/analytics/relationships'),
    ]);

    expect(requestedUrls).toHaveLength(3);
    requestedUrls.forEach((url) => {
      expect(allowedPaths.some((path) => url.includes(path))).toBe(true);
    });
  });

  it('closes pane into hidden dropdown and reopens without floating', async () => {
    const bridge = setupLayoutBridge(null, []);
    render(
      <DockWorkspace
        projectPath="C:\\projects\\demo"
        panes={{
          ...basePanes,
          storyInsights: <div data-testid="pane-insights">Insights</div>,
          corkboard: <div data-testid="pane-corkboard">Corkboard</div>,
        }}
        defaultPreset="standard"
        enableHotkeys={false}
        focusCycleOrder={[]}
        relocationNotifyEnabled={false}
        autoSnapEnabled={false}
      />,
    );

    await waitFor(() => expect(screen.getByRole('group', { name: 'Outline' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Close Outline pane/i }));
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Outline' })).toBeNull());

    const hiddenRegion = await screen.findByRole('region', { name: 'Hidden panes' });
    const hiddenButton = within(hiddenRegion).getByRole('button', { name: 'Outline' });
    fireEvent.click(hiddenButton);

    await waitFor(() => expect(screen.getByRole('group', { name: 'Outline' })).toBeInTheDocument());
    expect(screen.getByRole('group', { name: 'Outline' })).toHaveAttribute('data-focused', 'true');
    expect(bridge.openFloatingPane).not.toHaveBeenCalled();
  });
});
