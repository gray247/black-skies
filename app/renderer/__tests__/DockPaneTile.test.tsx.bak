import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DockPaneTile from '../components/docking/DockPaneTile';
import type { LayoutPaneId } from '../../shared/ipc/layout';
import { MosaicContext, MosaicWindowContext } from 'react-mosaic-component';

vi.mock('react-mosaic-component', async () => {
  const actual = await vi.importActual<typeof import('react-mosaic-component')>('react-mosaic-component');
  return {
    ...actual,
    MosaicWindow: ({
      renderToolbar,
      children,
    }: import('react-mosaic-component').MosaicWindowProps<LayoutPaneId>) => (
      <div className="mosaic-window">
        <div className="mosaic-window-toolbar">
          {renderToolbar
            ? renderToolbar({
                title: 'Mock pane',
                path: [],
                renderDefaultToolbar: () => null,
              })
            : null}
        </div>
        <div className="mosaic-window-body">{children}</div>
      </div>
    ),
  };
});

describe('DockPaneTile toolbar controls', () => {
  it('renders pane toolbar controls with updated tooltips', () => {
    const mockMosaicActions = {
      expand: vi.fn(),
      remove: vi.fn(),
      hide: vi.fn(),
      replaceWith: vi.fn(),
      updateTree: vi.fn(),
      getRoot: vi.fn(() => null),
    };
    const mockWindowActions = {
      split: vi.fn().mockResolvedValue(undefined),
      replaceWithNew: vi.fn().mockResolvedValue(undefined),
      setAdditionalControlsOpen: vi.fn(),
      getPath: vi.fn(() => ['wizard']),
      connectDragSource: vi.fn((element) => element),
    };

    render(
      <MosaicContext.Provider
        value={{ mosaicActions: mockMosaicActions, mosaicId: 'mosaic', blueprintNamespace: '' }}
      >
        <MosaicWindowContext.Provider
          value={{ blueprintNamespace: '', mosaicWindowActions: mockWindowActions }}
        >
          <DockPaneTile
            projectPath="sample/project"
            paneId="wizard"
            paneTitle="Wizard"
            path={['first']}
            instructionsId="instructions"
            assignPaneRef={() => undefined}
            canFloat
            onFloat={() => undefined}
            onFocusRequest={() => undefined}
            onContentFocus={() => undefined}
            onContentBlur={() => undefined}
            isFocused={false}
            paneDescription="Plan chapters, scenes, and beats."
            content={<div>Wizard content</div>}
          />
        </MosaicWindowContext.Provider>
      </MosaicContext.Provider>,
    );

    const expandButton = screen.getByRole('button', { name: /Expand Wizard pane/i });
    expect(expandButton).toHaveAttribute('title', 'Expand this pane.');

    const closeButton = screen.getByRole('button', { name: /Close Wizard pane/i });
    expect(closeButton).toHaveAttribute('title', 'Close this pane.');

    const floatButton = screen.getByRole('button', { name: /Detach Wizard pane/i });
    expect(floatButton).toHaveAttribute('title', 'Open this pane in a separate window.');
    expect(floatButton).not.toBeDisabled();

    const focusButton = screen.getByRole('button', { name: /Focus Wizard pane/i });
    expect(focusButton).toHaveAttribute('title', 'Focus this pane.');
    expect(focusButton).not.toBeDisabled();
  });

  it('invokes focus request handler', async () => {
    const onFocusRequest = vi.fn();
    const mockMosaicActions = {
      expand: vi.fn(),
      remove: vi.fn(),
      hide: vi.fn(),
      replaceWith: vi.fn(),
      updateTree: vi.fn(),
      getRoot: vi.fn(() => null),
    };
    const mockWindowActions = {
      split: vi.fn().mockResolvedValue(undefined),
      replaceWithNew: vi.fn().mockResolvedValue(undefined),
      setAdditionalControlsOpen: vi.fn(),
      getPath: vi.fn(() => ['wizard']),
      connectDragSource: vi.fn((element) => element),
    };

    const user = userEvent.setup();

    render(
      <MosaicContext.Provider
        value={{ mosaicActions: mockMosaicActions, mosaicId: 'mosaic', blueprintNamespace: '' }}
      >
        <MosaicWindowContext.Provider
          value={{ blueprintNamespace: '', mosaicWindowActions: mockWindowActions }}
        >
          <DockPaneTile
            projectPath="sample/project"
            paneId="wizard"
            paneTitle="Wizard"
            path={['first']}
            instructionsId="instructions"
            assignPaneRef={() => undefined}
            canFloat
            onFloat={() => undefined}
            onFocusRequest={onFocusRequest}
            onContentFocus={() => undefined}
            onContentBlur={() => undefined}
            isFocused={false}
            paneDescription="Plan chapters, scenes, and beats."
            content={<div>Wizard content</div>}
          />
        </MosaicWindowContext.Provider>
      </MosaicContext.Provider>,
    );

    const focusButton = screen.getByRole('button', { name: /Focus Wizard pane/i });
    await user.click(focusButton);
    expect(onFocusRequest).toHaveBeenCalledTimes(1);
  });
});
