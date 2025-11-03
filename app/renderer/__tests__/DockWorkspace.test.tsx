import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DockWorkspace from '../components/docking/DockWorkspace';
import type { LayoutPaneId } from '../../shared/ipc/layout';
import * as debugLog from '../utils/debugLog';

const PROJECT_PATH = 'sample/project';

describe('DockWorkspace', () => {
  const loadLayout = vi.fn();
  const saveLayout = vi.fn();
  const resetLayout = vi.fn();
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
        openFloatingPane: vi.fn().mockResolvedValue(true),
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
        focusCycleOrder={["wizard", "draft-board", "critique", "history", "analytics"]}
      />,
    );

    expect(screen.getByText(/Load a project to enable the dock workspace/i)).toBeInTheDocument();
  });

  it('loads and persists layout changes for the active project', async () => {
    render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={{ wizard: <div>Wizard</div> }}
        defaultPreset="analysis"
        enableHotkeys
        focusCycleOrder={["wizard", "draft-board", "critique", "history", "analytics"]}
      />,
    );

    expect(loadLayout).toHaveBeenCalledWith({ projectPath: PROJECT_PATH });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.keyDown(window, { key: '2', ctrlKey: true, altKey: true });
      await vi.runAllTimersAsync();
    });

    expect(saveLayout).toHaveBeenCalled();
  });

  it('cycles focus between panes with hotkeys', async () => {
    const paneIds: LayoutPaneId[] = [
      'wizard',
      'draft-board',
      'critique',
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
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const firstPane = document.querySelector('[data-pane-id="wizard"]') as HTMLElement;
    const secondPane = document.querySelector('[data-pane-id="draft-board"]') as HTMLElement;

    await act(async () => {
      fireEvent.keyDown(window, { key: ']', ctrlKey: true, altKey: true });
    });
    expect(document.activeElement).toBe(firstPane);

    await act(async () => {
      fireEvent.keyDown(window, { key: ']', ctrlKey: true, altKey: true });
    });
    expect(document.activeElement).toBe(secondPane);

    await act(async () => {
      fireEvent.keyDown(window, { key: '[', ctrlKey: true, altKey: true });
    });
    expect(document.activeElement).toBe(firstPane);
  });

  it('records pane bounds with the measured dimensions', async () => {
    const recordSpy = vi.spyOn(debugLog, 'recordDebugEvent');
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function getBoundingClientRect(this: HTMLElement) {
        const paneId = this.dataset?.paneId ?? 'unknown';
        const dimensions =
          paneId === 'wizard'
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
          wizard: <div>Wizard</div>,
          'draft-board': <div>Draft board</div>,
          history: <div>History</div>,
          critique: <div>Critique</div>,
        }}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={['wizard', 'draft-board', 'history', 'critique']}
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
        expect.objectContaining({ paneId: 'wizard', height: 420, width: 640 }),
        expect.objectContaining({ paneId: 'draft-board', height: 360, width: 320 }),
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
        panes={{ wizard: <div>Wizard</div> }}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={['wizard']}
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
    const { container } = render(
      <DockWorkspace
        projectPath={PROJECT_PATH}
        panes={{ wizard: <div>Wizard</div> }}
        defaultPreset="standard"
        enableHotkeys
        focusCycleOrder={['wizard']}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    const toolbars = Array.from(container.querySelectorAll('.dock-pane__toolbar'));
    expect(toolbars.length).toBeGreaterThan(0);
    const [firstToolbar] = toolbars;
    expect(firstToolbar).toBeDefined();
    const firstToolbarControls = firstToolbar?.querySelectorAll<HTMLButtonElement>('.mosaic-default-control');
    expect(firstToolbarControls).toHaveLength(2);
    const controlTitles = Array.from(firstToolbarControls ?? []).map((button) => button.title).sort();
    expect(controlTitles).toEqual(['Close Window', 'Expand']);
    const expandButtons = screen.getAllByTitle('Expand');
    const closeButtons = screen.getAllByTitle('Close Window');
    expect(expandButtons.every((button) => button.classList.contains('expand-button'))).toBe(true);
    expect(closeButtons.every((button) => button.classList.contains('close-button'))).toBe(true);
    expect(screen.getByRole('button', { name: /Detach Wizard pane/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Focus Wizard pane/i })).toBeInTheDocument();
  });
});
