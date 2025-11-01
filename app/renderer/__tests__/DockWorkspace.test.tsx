import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DockWorkspace from '../components/docking/DockWorkspace';
import type { LayoutPaneId } from '../../shared/ipc/layout';

const PROJECT_PATH = 'sample/project';

describe('DockWorkspace', () => {
  const loadLayout = vi.fn();
  const saveLayout = vi.fn();
  const resetLayout = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
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
});
