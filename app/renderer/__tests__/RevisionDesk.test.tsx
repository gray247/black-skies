import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RevisionItem } from '../../shared/ipc/feedbackNotes';
import RevisionDesk from '../components/program7/RevisionDesk';

function item(overrides: Partial<RevisionItem> = {}): RevisionItem {
  return {
    id: 'revision-a',
    projectId: 'project-a',
    unitId: 'story-unit/carmilla-chapter-01',
    createdAt: '2026-09-11T00:00:00.000Z',
    body: 'The author concern is visible.',
    advisory: false,
    kind: 'revision_item',
    lifecycle: 'review',
    sourceKind: 'manuscript',
    sourceId: 'story-unit/carmilla-chapter-01',
    sourceBodyFingerprint: 'body-fingerprint',
    provenance: { source: 'program6_finding', origin: 'manual' },
    protection: { protected: false },
    rechecks: [],
    ...overrides,
  };
}

describe('RevisionDesk component', () => {
  it('separates active items from history and hides protected content while preserving metadata', () => {
    render(
      <RevisionDesk
        activeItems={[item({ id: 'protected-a', body: 'PROTECTED_RAW_SENTINEL', protection: { protected: true, reason: 'author boundary' }, lifecycle: 'stale' })]}
        historyItems={[item({ id: 'resolved-a', lifecycle: 'resolved' })]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Revision Desk' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Active revision tasks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed revision tasks' })).toBeInTheDocument();
    expect(screen.getByText(/The passage changed after this task was created/)).toBeInTheDocument();
    expect(screen.getByText('Some protected details are hidden.')).toBeInTheDocument();
    expect(screen.getByText('Content hidden by protection policy.')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_RAW_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article', { name: 'Revision task' })).toHaveLength(2);
  });

  it('exposes return, recheck, disposition, author resolution, recurrence, and keyboard actions', () => {
    const onReturnToSource = vi.fn();
    const onLifecycle = vi.fn();
    const onRecheck = vi.fn();
    const onOpenRecurrence = vi.fn();
    const active = item({
      relatedRecurrenceId: 'revision-recurrence',
      rechecks: [{ id: 'recheck-a', status: 'still_appears_present', method: 'deterministic', evidence: 'The source remains current.', createdAt: '2026-09-11T00:00:00.000Z' }],
    });
    render(<RevisionDesk activeItems={[active]} historyItems={[]} canResolve onReturnToSource={onReturnToSource} onLifecycle={onLifecycle} onRecheck={onRecheck} onOpenRecurrence={onOpenRecurrence} />);
    const card = screen.getByRole('article', { name: 'Revision task' });
    fireEvent.click(within(card).getByRole('button', { name: 'Open passage in Writing Studio' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Check after revising' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Ask for another advisory check' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Set aside' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Open related concern' }));
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onReturnToSource).toHaveBeenCalledTimes(2);
    expect(onRecheck).toHaveBeenNthCalledWith(1, active, 'deterministic');
    expect(onRecheck).toHaveBeenNthCalledWith(2, active, 'local-ai');
    expect(onLifecycle).toHaveBeenCalledWith(active, 'parked');
    expect(onOpenRecurrence).toHaveBeenCalledWith(active, 'revision-recurrence');
    fireEvent.click(within(card).getByRole('button', { name: 'I’m satisfied — mark resolved' }));
    expect(onLifecycle).toHaveBeenCalledWith(active, 'resolved');
    expect(within(card).getByText('Only you can mark this concern finished.')).toBeInTheDocument();
    expect(within(card).getByText('the concern may still be present')).toBeInTheDocument();
    expect(within(card).getByText(/The source remains current/)).toBeInTheDocument();
  });

  it('allows the Writing surface to enable the author resolution gesture', () => {
    const onLifecycle = vi.fn();
    render(<RevisionDesk activeItems={[item()]} historyItems={[]} canResolve onLifecycle={onLifecycle} />);
    fireEvent.click(screen.getByRole('button', { name: 'I’m satisfied — mark resolved' }));
    expect(onLifecycle).toHaveBeenCalledWith(expect.objectContaining({ id: 'revision-a' }), 'resolved');
  });

  it('shows honest empty and degraded states', () => {
    const { rerender } = render(<RevisionDesk activeItems={[]} historyItems={[]} />);
    expect(screen.getByTestId('revision-desk-empty-active')).toHaveTextContent('No active revision tasks.');
    expect(screen.getByTestId('revision-desk-empty-history')).toHaveTextContent('No completed revision tasks yet.');
    rerender(<RevisionDesk activeItems={[]} historyItems={[]} availability="degraded" unavailableMessage="Saved revision items cannot be read." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saved revision items cannot be read.');
  });

  it('explains the writer workflow and does not repeat identical concern evidence', () => {
    render(<RevisionDesk activeItems={[item({ body: 'One concern.', evidence: 'One concern.' })]} historyItems={[]} />);
    expect(screen.getByText(/Open the passage, revise and save it in Writing Studio/)).toBeVisible();
    expect(screen.getByRole('list', { name: 'How to use Revision Desk' })).toBeVisible();
    expect(screen.getAllByText('One concern.')).toHaveLength(1);
    expect(screen.queryByText(/deterministic/i)).not.toBeInTheDocument();
  });

  it('removes local-AI controls while keeping the manual check available', () => {
    render(<RevisionDesk activeItems={[item()]} historyItems={[]} localAiAvailable={false} onRecheck={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Check after revising' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /advisory check/i })).not.toBeInTheDocument();
  });
});
