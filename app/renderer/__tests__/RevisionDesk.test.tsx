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
    expect(screen.getByText('Source stale')).toBeInTheDocument();
    expect(screen.getByText('Protected · details hidden')).toBeInTheDocument();
    expect(screen.getByText('Content hidden by protection policy.')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_RAW_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Revision item protected-a' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Revision item resolved-a' })).toBeInTheDocument();
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
    const card = screen.getByRole('article', { name: 'Revision item revision-a' });
    fireEvent.click(within(card).getByRole('button', { name: 'Return to source' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Run deterministic recheck' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Run local-AI recheck' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Park' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Open related recurrence' }));
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(onReturnToSource).toHaveBeenCalledTimes(2);
    expect(onRecheck).toHaveBeenNthCalledWith(1, active, 'deterministic');
    expect(onRecheck).toHaveBeenNthCalledWith(2, active, 'local-ai');
    expect(onLifecycle).toHaveBeenCalledWith(active, 'parked');
    expect(onOpenRecurrence).toHaveBeenCalledWith(active, 'revision-recurrence');
    fireEvent.click(within(card).getByRole('button', { name: 'Mark resolved' }));
    expect(onLifecycle).toHaveBeenCalledWith(active, 'resolved');
    expect(within(card).getByText('Only you can decide whether this revision is resolved.')).toBeInTheDocument();
    expect(within(card).getByText('still appears present')).toBeInTheDocument();
    expect(within(card).getByText(/The source remains current/)).toBeInTheDocument();
  });

  it('allows the Writing surface to enable the author resolution gesture', () => {
    const onLifecycle = vi.fn();
    render(<RevisionDesk activeItems={[item()]} historyItems={[]} canResolve onLifecycle={onLifecycle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark resolved' }));
    expect(onLifecycle).toHaveBeenCalledWith(expect.objectContaining({ id: 'revision-a' }), 'resolved');
  });

  it('shows honest empty and degraded states', () => {
    const { rerender } = render(<RevisionDesk activeItems={[]} historyItems={[]} />);
    expect(screen.getByTestId('revision-desk-empty-active')).toHaveTextContent('No active revision tasks.');
    expect(screen.getByTestId('revision-desk-empty-history')).toHaveTextContent('No completed revision tasks yet.');
    rerender(<RevisionDesk activeItems={[]} historyItems={[]} availability="degraded" unavailableMessage="Saved revision items cannot be read." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saved revision items cannot be read.');
  });
});
