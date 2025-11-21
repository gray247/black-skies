import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DockWorkspace, { ensurePaneInLayout } from '../components/docking/DockWorkspace';
import type { LayoutPaneId, LayoutTree } from '../../shared/ipc/layout';
import * as debugLog from '../utils/debugLog';

const PROJECT_PATH = 'sample/project';

describe('DockWorkspace', () => {
  const loadLayout = vi.fn();
  const saveLayout = vi.fn();
  const resetLayout = vi.fn();
  const noop = () => {};
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(Date.now()), 0)) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((handle: number) => window.clearTimeout(handle)) as typeof window.cancelAnimationFrame;
    Object.assign(window, {
      layout: {
        loadLayout,
        saveLayout,
        resetLayout,
        openFloatingPane: vi.fn().mockResolvedValue({ opened: true, clamp: null }),
        closeFloatingPane: vi.fn(),
        listFloatingPanes: vi.fn().mockResolvedValue([]),
      },
    });
    loadLayout.mockResolvedValue({ layout: null, floatingPanes: [], schemaVersion: 2 });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    delete (window as Partial<Window>).layout;
  });

  it('renders a status message when no project is loaded', () => {
    render(
      <DockWorkspace
        projectPath={null}
        panes={{}}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={["outline", "draftPreview", "critique", "timeline", "storyInsights"]}
        relocationNotifyEnabled
        autoSnapEnabled={false}
        onRelocationNotifyChange={noop}
      />,
    );

    expect(screen.getByText(/Open a story to start writing/i)).toBeInTheDocument();
  });

  it('loads and persists layout changes for the active project', async () => {
    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={{ outline: <div>Outline</div> }}
        defaultPreset="analysis"
        enableHotkeys
        focusCycleOrder={["outline", "draftPreview", "critique", "timeline", "storyInsights"]}
        relocationNotifyEnabled
        autoSnapEnabled={false}
        onRelocationNotifyChange={noop}
      />,
    );

    expect(loadLayout).toHaveBeenCalledWith({ projectPath: PROJECT_PATH });

    await act(async () => {
      await Promise.resolve();
    });

    screen.getByRole('group', { name: 'Outline' }).focus();

    await act(async () => {
      fireEvent.keyDown(window, { key: '2', ctrlKey: true, altKey: true });
      await vi.runAllTimersAsync();
    });

    expect(saveLayout).toHaveBeenCalled();
  });

  it('cycles focus between panes with hotkeys', async () => {
    const paneIds: LayoutPaneId[] = [
      'outline',
      'draftPreview',
      'storyInsights',
    ];

    const panes = paneIds.reduce<Partial<Record<LayoutPaneId, JSX.Element>>>(
      (accum, paneId) => ({
        ...accum,
        [paneId]: <button type="button">{paneId}</button>,
      }),
      {},
    );

    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={panes}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={paneIds}
        relocationNotifyEnabled
        autoSnapEnabled={false}
        onRelocationNotifyChange={noop}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const firstPane = screen.getByRole('group', { name: 'Outline' });
    const secondPane = screen.getByRole('group', { name: 'Draft preview' });
    const thirdPane = screen.getByRole('group', { name: 'Story Insights' });

    firstPane.focus();

    await act(async () => {
      fireEvent.keyDown(window, { key: ']', ctrlKey: true, altKey: true });
    });
    expect(document.activeElement).toBe(secondPane);

    await act(async () => {
      fireEvent.keyDown(window, { key: ']', ctrlKey: true, altKey: true });
    });
    expect(document.activeElement).toBe(thirdPane);

    await act(async () => {
      fireEvent.keyDown(window, { key: '[', ctrlKey: true, altKey: true });
    });
    expect(document.activeElement).toBe(secondPane);
  });

  it('records pane bounds with the measured dimensions', async () => {
    const recordSpy = vi.spyOn(debugLog, 'recordDebugEvent');
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
        const paneId = this.dataset?.paneId ?? 'unknown';
        const dimensions =
          paneId === 'outline'
            ? { width: 640, height: 420 }
            : { width: 320, height: 360 };
        return {
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: dimensions.width,
          bottom: dimensions.height,
          ...dimensions,
          toJSON: () => ({}),
        } as DOMRect;
      });

    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={{
          outline: <div>Outline</div>,
        'draftPreview': <div>Draft preview</div>,
          timeline: <div>Timeline</div>,
          critique: <div>Feedback notes</div>,
        }}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={['outline', 'draftPreview', 'timeline', 'critique']}
        relocationNotifyEnabled
        autoSnapEnabled={false}
        onRelocationNotifyChange={noop}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      vi.runAllTimers();
    });

    const boundsEvent = recordSpy.mock.calls.find(([scope]) => scope === 'dock-workspace.bounds');
    expect(boundsEvent).toBeDefined();
    const [, payload] = boundsEvent ?? [];
    expect(payload).toEqual({
      projectPath: PROJECT_PATH,
      panes: expect.arrayContaining([
        expect.objectContaining({ paneId: 'outline', height: 420, width: 640 }),
        expect.objectContaining({ paneId: 'draftPreview', height: 360, width: 320 }),
      ]),
    });

    rectSpy.mockRestore();
    recordSpy.mockRestore();
  });

  it('logs layout lifecycle events when loading persisted state', async () => {
    const recordSpy = vi.spyOn(debugLog, 'recordDebugEvent');
    loadLayout.mockResolvedValueOnce({
      layout: 'invalid-pane',
      floatingPanes: [],
      schemaVersion: 1,
    });

    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={{ outline: <div>Outline</div> }}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={['outline']}
        relocationNotifyEnabled
        autoSnapEnabled={false}
        onRelocationNotifyChange={noop}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const loggedScopes = recordSpy.mock.calls.map(([scope]) => scope);
    expect(loggedScopes).toEqual(
      expect.arrayContaining([
        'dock-workspace.layout.loaded',
        'dock-workspace.layout.sanitised',
      ]),
    );

    const sanitisedCall = recordSpy.mock.calls.find(([scope]) => scope === 'dock-workspace.layout.sanitised');
    expect(sanitisedCall?.[1]).toEqual(
      expect.objectContaining({
        projectPath: PROJECT_PATH,
        layout: expect.anything(),
      }),
    );

    recordSpy.mockRestore();
  });

  it('renders mosaic expand/close controls alongside float and focus buttons', async () => {
    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={{ outline: <div>Outline</div> }}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={['outline']}
        relocationNotifyEnabled
        autoSnapEnabled={false}
        onRelocationNotifyChange={noop}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const expandButton = screen.getByRole('button', { name: /Expand Outline pane/i });
    expect(expandButton).toHaveAttribute('title', 'Expand this pane.');

    const closeButton = screen.getByRole('button', { name: /Close Outline pane/i });
    expect(closeButton).toHaveAttribute('title', 'Close this pane.');

    const floatButton = screen.getByRole('button', { name: /Detach Outline pane/i });
    expect(floatButton).toHaveAttribute('title', 'Open this pane in a separate window.');
    expect(floatButton).not.toBeDisabled();

    const focusButton = screen.getByRole('button', { name: /Focus Outline pane/i });
    expect(focusButton).toHaveAttribute('title', 'Focus this pane.');

    expect(screen.getByRole('group', { name: 'Outline' })).toHaveAttribute(
      'title',
      'Plan chapters, scenes, and beats.',
    );
  });

  it('ensurePaneInLayout appends missing panes while preserving existing nodes', () => {
    const baseLayout: LayoutTree = {
      direction: 'row',
      first: 'outline',
      second: 'draftPreview',
    };

    const updated = ensurePaneInLayout(baseLayout, 'storyInsights');
    const collected = new Set<LayoutPaneId>();
    (function collect(node: LayoutTree | LayoutPaneId): void {
      if (typeof node === 'string') {
        collected.add(node);
        return;
      }
      collect(node.first);
      collect(node.second);
    })(updated);

    expect(collected.has('outline')).toBe(true);
    expect(collected.has('draftPreview')).toBe(true);
    expect(collected.has('storyInsights')).toBe(true);
  });
});
