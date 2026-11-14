import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RevisionItem } from '../../shared/ipc/feedbackNotes';
import RevisionDesk, { RevisionEvidence } from '../components/program7/RevisionDesk';
import { buildProgram7SourceEnvelope } from '../../shared/program7SourceBinding';

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
  it('holds source-check and disposition controls while the shared concern owner is saving', () => {
    const { rerender } = render(<RevisionDesk activeItems={[item()]} historyItems={[]} pending canResolve onRecheck={vi.fn()} onLifecycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Check source availability' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'I’m satisfied — mark resolved' })).toBeDisabled();
    rerender(<RevisionDesk activeItems={[item()]} historyItems={[]} canResolve onRecheck={vi.fn()} onLifecycle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Check source availability' })).toBeEnabled();
  });

  it('checks paired evidence separately, withholds a changed or protected source and retains the other passage', async () => {
    const primary = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'a', sourceText: 'First promise.', selectionStart: 0, selectionEnd: 5 });
    const related = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'b', sourceText: 'Later promise.', selectionStart: 0, selectionEnd: 5 });
    const concern = item({ unitId: 'a', anchor: primary.anchor, sourceBodyFingerprint: primary.bodySha256, relatedSources: [related] });
    const bodies = { a: 'First promise.', b: 'Later promise.' };
    const read = vi.fn();
    const { rerender } = render(<RevisionEvidence item={concern} bodies={bodies} dirtyUnitIds={new Set()} onRead={read} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Read related evidence' })).toBeEnabled());
    expect(screen.getByText('First', { selector: 'blockquote' })).toBeVisible();
    expect(screen.getByText('Later', { selector: 'blockquote' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Read related evidence' }));
    await waitFor(() => expect(read).toHaveBeenCalledWith(expect.objectContaining({ unitId: 'b', selectionStart: 0, selectionEnd: 5 })));
    rerender(<RevisionEvidence item={concern} bodies={{ ...bodies, b: 'Nothing remains.' }} dirtyUnitIds={new Set()} onRead={read} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Read primary evidence' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Read related evidence' })).toBeDisabled();
    expect(screen.queryByText('Later', { selector: 'blockquote' })).not.toBeInTheDocument();
    const protectedSource = { ...related, protection: { sourceClass: 'protected' as const, metadataOnly: true } };
    rerender(<RevisionEvidence item={{ ...concern, relatedSources: [protectedSource] }} bodies={bodies} dirtyUnitIds={new Set()} onRead={read} />);
    await waitFor(() => expect(screen.getByText(/only metadata is available/)).toBeVisible());
    expect(screen.getByRole('button', { name: 'Read primary evidence' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Read related evidence' })).toBeDisabled();
  });

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
    fireEvent.click(within(card).getByRole('button', { name: 'Check source availability' }));
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
    expect(screen.getByRole('button', { name: 'Check source availability' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /advisory check/i })).not.toBeInTheDocument();
  });
});


it('shows original/current/decision evidence independently and never rewrites a recorded quote after Undo', async () => {
  const before = 'Mara wore a green shirt.', after = 'Mara wore a cotton shirt.';
  const source = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'a', sourceText: before, selectionStart: 0, selectionEnd: before.length });
  const concern = item({ unitId: 'a', anchor: source.anchor, sourceBodyFingerprint: source.bodySha256, originalEvidence: [{ unitId: 'a', scope: 'unit', status: 'exact', text: before }] });
  const { captureProgram7SourceEvidence } = await import('../../shared/program7SourceBinding');
  const decision = [await captureProgram7SourceEvidence(source, after)];
  const view = render(<RevisionEvidence item={concern} bodies={{ a: after }} dirtyUnitIds={new Set(['a'])} decisionEvidence={decision} />);
  await waitFor(() => expect(screen.getByLabelText('Current primary evidence')).toHaveTextContent(after));
  expect(screen.getByLabelText('Original primary evidence')).toHaveTextContent(before);
  expect(screen.getByLabelText('Recorded primary evidence')).toHaveTextContent(after);
  expect(screen.getByRole('button', { name: 'Read primary evidence' })).toBeDisabled();
  view.rerender(<RevisionEvidence item={concern} bodies={{ a: before }} dirtyUnitIds={new Set()} decisionEvidence={decision} />);
  await waitFor(() => expect(screen.getByLabelText('Current primary evidence')).toHaveTextContent(before));
  expect(screen.getByLabelText('Recorded primary evidence')).toHaveTextContent(after);
  expect(screen.getByText('Current source differs from this decision.')).toBeVisible();
});


it('never flashes original or recorded quotes when the concern is protected', async () => {
  const source = await buildProgram7SourceEnvelope({ projectId: 'project-a', generation: 1, unitId: 'a', sourceText: 'Secret source', selectionStart: 0, selectionEnd: 13 });
  const evidence = [{ unitId: 'a', status: 'exact' as const, scope: 'unit' as const, text: 'SECRET_RECORDED_QUOTE' }];
  render(<RevisionEvidence item={item({ unitId: 'a', anchor: source.anchor, sourceBodyFingerprint: source.bodySha256, protection: { protected: true }, originalEvidence: evidence })} bodies={{ a: 'Secret source' }} dirtyUnitIds={new Set()} decisionEvidence={evidence} />);
  expect(screen.queryByText('SECRET_RECORDED_QUOTE')).not.toBeInTheDocument();
  await waitFor(() => expect(screen.getByText(/only metadata is available/)).toBeVisible());
  expect(screen.queryByText('SECRET_RECORDED_QUOTE')).not.toBeInTheDocument();
});
