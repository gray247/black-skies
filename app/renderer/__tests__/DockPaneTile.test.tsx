import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import DockPaneTile from '../components/docking/DockPaneTile';
import type { LayoutPaneId } from '../../shared/ipc/layout';

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
    render(
      <DockPaneTile
        projectPath="sample/project"
        paneId="outline"
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
      />,
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
    const user = userEvent.setup();

    render(
      <DockPaneTile
        projectPath="sample/project"
        paneId="outline"
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
      />,
    );

    const focusButton = screen.getByRole('button', { name: /Focus Wizard pane/i });
    await user.click(focusButton);
    expect(onFocusRequest).toHaveBeenCalledTimes(1);
  });
});
