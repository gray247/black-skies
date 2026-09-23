import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Program7HistoryItemV1, Program7HistoryProjectionV1 } from '../../shared/program7History';
import Program7History from '../components/program7/Program7History';

function item(overrides: Partial<Program7HistoryItemV1> = {}): Program7HistoryItemV1 {
  return {
    reference: 'feedback-note:feedback-a', ownerKind: 'feedback-note', ownerId: 'feedback-a', bucket: 'active', lifecycle: 'review', title: 'Continuity', summary: 'Check this passage.', occurredAt: '2026-09-11T00:00:00.000Z', updatedAt: '2026-09-11T00:00:00.000Z', sourceStatus: 'current', sourceReference: 'unit-a', recurrenceReference: 'feedback-note:feedback-root', protection: { protected: false, class: 'ordinary' }, provenance: { origin: 'manual', sourceReference: 'program6_finding' }, acceptance: 'none', ...overrides,
  };
}

function projection(overrides: Partial<Program7HistoryProjectionV1> = {}): Program7HistoryProjectionV1 {
  const activeItems = [item()];
  const historyItems = [item({ reference: 'revision-candidate:candidate-a', ownerKind: 'revision-candidate', ownerId: 'candidate-a', bucket: 'history', lifecycle: 'partially accepted', title: 'Candidate', summary: 'Candidate summary.', sourceStatus: 'stale', acceptance: 'partial', recurrenceReference: null })];
  return { items: [...activeItems, ...historyItems], activeItems, historyItems, totalSourceItems: 2, trimmedCount: 0, limit: 100, ...overrides };
}

describe('Program7History component', () => {
  it('labels a saved but unapplied alternative in writer language', () => {
    const draft = item({ reference: 'revision-candidate:candidate-b', ownerKind: 'revision-candidate', ownerId: 'candidate-b', lifecycle: 'generated', acceptance: 'none' });
    render(<Program7History projection={projection({ items: [draft], activeItems: [draft], historyItems: [] })} />);
    const card = screen.getByTestId('program7-history-item-revision-candidate:candidate-b');
    expect(card).toHaveTextContent('Draft');
    expect(card).toHaveTextContent('Not applied');
    expect(card).not.toHaveTextContent('promotion acceptance');
  });

  it('keeps active records separate from resolved history and shows provenance, staleness, recurrence, and partial acceptance', () => {
    const onOpenSource = vi.fn();
    const onOpenRecurrence = vi.fn();
    render(<Program7History projection={projection()} onOpenSource={onOpenSource} onOpenRecurrence={onOpenRecurrence} />);
    expect(screen.getByRole('heading', { name: 'Active records' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resolved and archived history' })).toBeInTheDocument();
    expect(screen.getByTestId('program7-history-item-feedback-note:feedback-a')).toHaveTextContent('Original available');
    const historyCard = screen.getByTestId('program7-history-item-revision-candidate:candidate-a');
    expect(historyCard).toHaveTextContent('Original has changed');
    expect(historyCard).toHaveTextContent('Partly applied');
    expect(historyCard).toHaveTextContent('Candidate summary.');
    within(screen.getByTestId('program7-history-item-feedback-note:feedback-a')).getByRole('button', { name: 'Open recurrence' }).click();
    within(screen.getByTestId('program7-history-item-feedback-note:feedback-a')).getByRole('button', { name: 'Open source' }).click();
    expect(onOpenRecurrence).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'feedback-a' }), 'feedback-note:feedback-root');
    expect(onOpenSource).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'feedback-a' }));
  });

  it('keeps protected records metadata-only and reports bounded trimming', () => {
    render(<Program7History projection={projection({ items: [item({ protection: { protected: true, class: 'protected' }, summary: 'PROTECTED_HISTORY_SENTINEL' })], activeItems: [item({ protection: { protected: true, class: 'protected' }, summary: 'PROTECTED_HISTORY_SENTINEL' })], historyItems: [], totalSourceItems: 4, trimmedCount: 3, limit: 1 })} />);
    expect(screen.getByRole('status')).toHaveTextContent('3 older items are not shown');
    expect(screen.queryByText('PROTECTED_HISTORY_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getByText('Content hidden by protection policy.')).toBeInTheDocument();
    expect(screen.getByTestId('program7-history')).toHaveAttribute('data-history-store', 'projection-only');
  });

  it('shows honest empty states for both buckets', () => {
    render(<Program7History projection={{ items: [], activeItems: [], historyItems: [], totalSourceItems: 0, trimmedCount: 0, limit: 100 }} />);
    expect(screen.getByTestId('program7-history-empty-active')).toHaveTextContent('No active records.');
    expect(screen.getByTestId('program7-history-empty-history')).toHaveTextContent('No resolved or archived history.');
  });
});
