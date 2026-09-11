import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Program7CreateDevelopWorkspace from '../components/program7/Program7CreateDevelopWorkspace';

function marker(label: string): JSX.Element {
  return <p data-testid={`marker-${label}`}>{label} content</p>;
}

describe('Program7CreateDevelopWorkspace component', () => {
  it('composes the four provisional sections behind explicit navigation', () => {
    render(<Program7CreateDevelopWorkspace revisionDesk={marker('revision')} storyFoundation={marker('foundation')} ideas={marker('ideas')} history={marker('history')} />);
    expect(screen.getByRole('heading', { name: 'Create / Develop' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByTestId('marker-revision')).toBeInTheDocument();
    expect(screen.queryByTestId('marker-foundation')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ideas' }));
    expect(screen.getByTestId('marker-ideas')).toBeInTheDocument();
    expect(screen.queryByTestId('marker-revision')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getByTestId('marker-history')).toBeInTheDocument();
  });

  it('keeps section ownership and writing-gate boundaries explicit while reporting navigation', () => {
    const onSectionChange = vi.fn();
    render(<Program7CreateDevelopWorkspace initialSection="story-foundation" storyFoundation={marker('foundation')} onSectionChange={onSectionChange} />);
    const workspace = screen.getByTestId('program7-create-develop');
    expect(workspace).toHaveAttribute('data-writing-gate', 'false');
    expect(workspace).toHaveAttribute('data-truth-owner', 'parent-owned');
    expect(screen.getByTestId('marker-foundation')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ideas' }));
    expect(onSectionChange).toHaveBeenCalledWith('ideas');
    expect(screen.getByTestId('program7-create-develop-empty')).toHaveTextContent('not connected yet');
  });

  it('uses native keyboard-reachable navigation and handles an empty section honestly', () => {
    render(<Program7CreateDevelopWorkspace />);
    const button = screen.getByRole('button', { name: 'History' });
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);
    expect(screen.getByTestId('program7-create-develop-empty')).toHaveTextContent('No change was made.');
  });
});
