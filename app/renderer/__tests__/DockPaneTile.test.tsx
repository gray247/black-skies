import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DockPaneTile from '../components/docking/DockPaneTile';
import type { LayoutPaneId } from '../../shared/ipc/layout';

type ToolbarProps = import('react-mosaic-component').MosaicWindowToolbarProps<LayoutPaneId> & {
  createNode?: () => unknown;
};

declare global {
  // eslint-disable-next-line vars-on-top,no-var
  var __dockPaneToolbarProps: Partial<ToolbarProps> | undefined;
}

vi.mock('react-mosaic-component', async () => {
  const actual = await vi.importActual<typeof import('react-mosaic-component')>('react-mosaic-component');
  return {
    ...actual,
    MosaicWindow: ({
      renderToolbar,
      children,
    }: import('react-mosaic-component').MosaicWindowProps<LayoutPaneId>) => {
      const toolbarProps =
        globalThis.__dockPaneToolbarProps ?? ({
          path: [],
          title: 'Mock pane',
          renderDefaultToolbar: () => null,
        } satisfies ToolbarProps);
      const toolbar = renderToolbar ? renderToolbar(toolbarProps) : null;
      return (
        <div className="mosaic-window">
          <div className="mosaic-window-toolbar">{toolbar}</div>
          <div className="mosaic-window-body">{children}</div>
        </div>
      );
    },
  };
});

vi.mock('react-mosaic-component/lib/buttons/defaultToolbarControls', () => {
  const controls = [
    <button key="replace" title="Replace" />,
    <button key="split" title="Split" />,
    <button key="expand" title="Expand" />,
    <button key="close" title="Close Window" />,
  ];
  return {
    DEFAULT_CONTROLS_WITH_CREATION: controls,
    DEFAULT_CONTROLS_WITHOUT_CREATION: controls.slice(2),
  };
});

describe('DockPaneTile toolbar controls', () => {
  beforeEach(() => {
    globalThis.__dockPaneToolbarProps = undefined;
  });

  it('renders default mosaic controls with creation actions when createNode is available', () => {
    globalThis.__dockPaneToolbarProps = {
      title: 'Wizard',
      path: [],
      renderDefaultToolbar: () => null,
      // Provide a stub createNode to simulate Mosaic exposing creation actions.
      createNode: vi.fn().mockResolvedValue('draft-board'),
    } as Partial<ToolbarProps>;

    render(
      <DockPaneTile
        projectPath="sample/project"
        paneId="wizard"
        paneTitle="Wizard"
        path={['first']}
        instructionsId="instructions"
        assignPaneRef={() => undefined}
        onFloat={() => undefined}
        onFocus={() => undefined}
        content={<div>Wizard content</div>}
      />,
    );

    expect(screen.getByTitle('Replace')).toBeInTheDocument();
    expect(screen.getByTitle('Split')).toBeInTheDocument();
    expect(screen.getByTitle('Expand')).toBeInTheDocument();
    expect(screen.getByTitle('Close Window')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Detach Wizard pane/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Focus Wizard pane/i })).toBeInTheDocument();
  });
});
