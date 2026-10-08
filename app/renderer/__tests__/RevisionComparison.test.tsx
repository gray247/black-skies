import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RevisionCandidateV1 } from '../../shared/ipc/revisionCandidates';
import RevisionComparison from '../components/program7/RevisionComparison';

function candidate(overrides: Partial<RevisionCandidateV1> = {}): RevisionCandidateV1 {
  return {
    id: 'candidate-a',
    projectId: 'project-a',
    unitId: 'story-unit/carmilla-chapter-01',
    sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: 'Current manuscript passage.' },
    sourceAnchor: { unitId: 'story-unit/carmilla-chapter-01', selectionStart: 0, selectionEnd: 6, selectionFingerprint: 'selection' },
    sourceBodySha256: 'source-body',
    purpose: 'Clarify the transition.',
    origin: 'manual',
    provenance: { origin: 'manual', source: 'author', model: null, receipt: null },
    protection: { excluded: false, class: 'ordinary' },
    warnings: [],
    currentness: 'current',
    candidateText: 'Candidate manuscript passage.',
    editedCandidateText: null,
    lifecycle: 'reviewing',
    history: [],
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
    ...overrides,
  };
}

describe('RevisionComparison component', () => {

  it('shows the exact manuscript replacement range independently of the alternative selection', () => {
    const source = "The observatory's brass door had not opened in forty years. Mara pressed her palm against the cold glass and listened. Beyond it, the storm erased the road home. She knew the message inside was meant for her.";
    const linked = candidate({ sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: source }, sourceAnchor: { unitId: 'story-unit/carmilla-chapter-01', selectionStart: 60, selectionEnd: 118, selectionFingerprint: 'selection' } });
    const { rerender } = render(<RevisionComparison candidate={linked} canAccept onPartialAccept={vi.fn()} />);
    expect(screen.getByTestId('revision-replacement-text')).toHaveTextContent('Mara pressed her palm against the cold glass and listened.');
    expect(screen.queryByText(/This replaces the entire saved section/)).not.toBeInTheDocument();
    rerender(<RevisionComparison candidate={{ ...linked, sourceAnchor: { ...linked.sourceAnchor!, selectionStart: 0, selectionEnd: source.length } }} canAccept onPartialAccept={vi.fn()} />);
    expect(screen.getByTestId('revision-replacement-text').textContent).toBe(source);
    expect(screen.getByText(/This replaces the entire saved section/)).toBeVisible();
    const partial = screen.getByLabelText('Part of this alternative to apply') as HTMLTextAreaElement;
    partial.setSelectionRange(0, 6);
    fireEvent.select(partial);
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /I intend to replace this entire section/ }));
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeEnabled();
    rerender(<RevisionComparison candidate={{ ...linked, lifecycle: 'partially accepted' }} />);
    expect(screen.getByRole('heading', { name: 'Text that was replaced' })).toBeVisible();
  });


  it('explains a pending decision beside disabled editing, application and decision controls', () => {
    const onOpenEditor = vi.fn();
    const onAcceptAll = vi.fn();
    const onLifecycle = vi.fn();
    const { rerender } = render(<RevisionComparison candidate={candidate()} decisionPending canAccept
      onOpenEditor={onOpenEditor} onAcceptAll={onAcceptAll} onLifecycle={onLifecycle} />);
    const actions = screen.getByLabelText('Revision alternative actions');
    for (const button of within(actions).getAllByRole('button')) {
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(screen.getByText(/Wait for this alternative.*finish/)).toBeVisible();
    expect(onOpenEditor).not.toHaveBeenCalled();
    expect(onAcceptAll).not.toHaveBeenCalled();
    expect(onLifecycle).not.toHaveBeenCalled();
    rerender(<RevisionComparison candidate={candidate()} canAccept onOpenEditor={onOpenEditor} onAcceptAll={onAcceptAll} />);
    expect(screen.getByRole('button', { name: 'Edit alternative' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Apply all of this alternative' })).toBeEnabled();
  });

  it('keeps current and candidate text visibly separate and exposes origin, warning, and stale state', () => {
    render(<RevisionComparison candidate={candidate({ origin: 'local-ai', provenance: { origin: 'local-ai', source: 'program7-local-ai', model: 'qwen3:4b', receipt: null }, currentness: 'stale', warnings: ['Source changed since candidate creation.'] })} />);
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Revision alternative' })).toBeInTheDocument();
    expect(screen.getByTestId('revision-current-text')).toHaveTextContent('Current manuscript passage.');
    expect(screen.getByTestId('revision-candidate-text')).toHaveTextContent('Candidate manuscript passage.');
    expect(screen.getByTestId('revision-comparison-origin')).toHaveTextContent('Ready to review');
    expect(screen.getByRole('alert')).toHaveTextContent('cannot be applied because the passage changed');
    expect(screen.getByRole('list')).toHaveTextContent('Source changed since candidate creation.');
    expect(screen.queryByText('qwen3:4b')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Technical details'));
    expect(screen.getByText(/Local AI.*qwen3:4b/)).toBeInTheDocument();
  });

  it.each(['stale', 'unavailable'] as const)('keeps %s alternatives viewable without offering unsupported review decisions', (currentness) => {
    const onLifecycle = vi.fn();
    const onOpenEditor = vi.fn();
    render(<RevisionComparison candidate={candidate({ currentness })} onLifecycle={onLifecycle} onOpenEditor={onOpenEditor} />);
    for (const name of ['Set this alternative aside', 'Do not use this alternative', 'Stop working on this alternative']) {
      const action = screen.getByRole('button', { name });
      expect(action).toBeDisabled();
      expect(action).toHaveAccessibleDescription(/review decisions are also unavailable/);
      fireEvent.click(action);
    }
    expect(onLifecycle).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'View alternative' }));
    expect(onOpenEditor).toHaveBeenCalledTimes(1);
  });
  it('requires explicit all or selected acceptance and keeps disposition actions separate', () => {
    const onAcceptAll = vi.fn();
    const onPartialAccept = vi.fn();
    const onLifecycle = vi.fn();
    const onOpenEditor = vi.fn();
    render(<RevisionComparison candidate={candidate()} canAccept onAcceptAll={onAcceptAll} onPartialAccept={onPartialAccept} onLifecycle={onLifecycle} onOpenEditor={onOpenEditor} />);
    const comparison = screen.getByTestId('revision-comparison');
    fireEvent.click(within(comparison).getByRole('button', { name: 'Apply all of this alternative' }));
    const partialSelection = within(comparison).getByRole('textbox', { name: 'Part of this alternative to apply' }) as HTMLTextAreaElement;
    expect(within(comparison).getByRole('button', { name: 'Apply only the selected part' })).toHaveAccessibleDescription('Check “Text that will be replaced” above. Then select the words to insert in “Part of this alternative to apply”. The selected alternative text replaces that entire manuscript target.');
    partialSelection.setSelectionRange(10, 20);
    fireEvent.select(partialSelection);
    fireEvent.click(within(comparison).getByRole('button', { name: 'Apply only the selected part' }));
    fireEvent.click(within(comparison).getByRole('button', { name: 'Edit alternative' }));
    fireEvent.click(within(comparison).getByRole('button', { name: 'Set this alternative aside' }));
    fireEvent.click(within(comparison).getByRole('button', { name: 'Do not use this alternative' }));
    expect(onAcceptAll).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }));
    expect(onPartialAccept).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'candidate-a' }),
      { text: 'manuscript', start: 10, end: 20 },
    );
    expect(onOpenEditor).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }));
    expect(onLifecycle).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }), 'parked');
    expect(onLifecycle).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }), 'rejected');
    expect(within(comparison).getByText(/Only you can apply an alternative/)).toBeInTheDocument();
  });

  it('does not offer acceptance through a stale candidate or expose protected source text', () => {
    const onAcceptAll = vi.fn();
    render(<RevisionComparison candidate={candidate({ currentness: 'stale', protection: { excluded: true, class: 'ai-excluded', reason: 'author boundary' }, sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: 'PROTECTED_SOURCE_SENTINEL' }, candidateText: 'PROTECTED_CANDIDATE_SENTINEL' })} canAccept onAcceptAll={onAcceptAll} />);
    expect(screen.queryByText('PROTECTED_SOURCE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_CANDIDATE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getAllByText('Content hidden by protection policy.')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Apply all of this alternative' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('hidden by protection policy');
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.getByText('This is the saved passage used to create this alternative.')).toBeInTheDocument();
    expect(screen.queryByText('This saved passage remains unchanged while you review the alternative.')).not.toBeInTheDocument();
  });

  it('does not enable partial application without an exact saved source passage', () => {
    render(<RevisionComparison candidate={candidate({ sourceAnchor: null })} canAccept onPartialAccept={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Part of this alternative to apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('return to Writing Studio, select the exact manuscript words to replace, and save a new alternative');
    expect(screen.getByRole('status')).toHaveTextContent('Selecting text on this comparison cannot link the existing alternative');
    expect(screen.getByText('This alternative uses the current saved section, but was not linked to selected words.')).toBeVisible();
  });

  it('supports readonly keyboard selection without allowing edits', () => {
    const onPartialAccept = vi.fn();
    render(<RevisionComparison candidate={candidate({ candidateText: 'A👩‍🚀éB', sourceAnchor: { unitId: 'story-unit/carmilla-chapter-01', selectionStart: 0, selectionEnd: 9, selectionFingerprint: 'selection' } })} canAccept onPartialAccept={onPartialAccept} />);
    const textarea = screen.getByRole('textbox', { name: 'Part of this alternative to apply' }) as HTMLTextAreaElement;
    const partial = screen.getByRole('button', { name: 'Apply only the selected part' });
    textarea.focus();
    fireEvent.keyDown(textarea, { key: 'Home' });
    fireEvent.keyDown(textarea, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(textarea, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(textarea, { key: 'ArrowRight', shiftKey: true });
    expect(textarea.value).toBe('A👩‍🚀éB');
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe('A👩‍🚀é'.length);
    expect(partial).toBeEnabled();
    fireEvent.click(partial);
    expect(onPartialAccept).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'candidate-a' }), { text: 'A👩‍🚀é', start: 0, end: 8 });
    fireEvent.keyDown(textarea, { key: 'End', ctrlKey: true });
    fireEvent.keyDown(textarea, { key: 'ArrowLeft', shiftKey: true });
    fireEvent.keyDown(textarea, { key: 'ArrowLeft', shiftKey: true });
    expect(textarea.selectionStart).toBe(6);
    expect(textarea.selectionEnd).toBe(9);
    fireEvent.click(partial);
    expect(onPartialAccept).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'candidate-a' }), { text: 'éB', start: 6, end: 9 });
    fireEvent.keyDown(textarea, { key: 'ArrowRight' });
    expect(textarea.selectionStart).toBe(9);
    expect(textarea.selectionEnd).toBe(9);
    fireEvent.keyDown(textarea, { key: 'Home' });
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(0);
    fireEvent.keyDown(textarea, { key: 'ArrowLeft' });
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(0);
    fireEvent.keyDown(textarea, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(textarea, { key: 'ArrowLeft', shiftKey: true });
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(0);
    fireEvent.keyDown(textarea, { key: 'x' });
    expect(textarea.value).toBe('A👩‍🚀éB');
  });

  it('clears selection when candidate text or protection changes', () => {
    const onPartialAccept = vi.fn();
    const onAcceptAll = vi.fn();
    const { rerender } = render(<RevisionComparison candidate={candidate({ candidateText: 'First candidate' })} canAccept onAcceptAll={onAcceptAll} onPartialAccept={onPartialAccept} />);
    const textarea = screen.getByRole('textbox', { name: 'Part of this alternative to apply' }) as HTMLTextAreaElement;
    fireEvent.keyDown(textarea, { key: 'Home' });
    fireEvent.keyDown(textarea, { key: 'ArrowRight', shiftKey: true });
    rerender(<RevisionComparison candidate={candidate({ candidateText: 'Changed candidate' })} canAccept onPartialAccept={onPartialAccept} />);
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    fireEvent.keyDown(textarea, { key: 'Home' });
    fireEvent.keyDown(textarea, { key: 'ArrowRight', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeEnabled();
    rerender(<RevisionComparison candidate={candidate({ candidateText: 'Changed candidate', protection: { excluded: true, class: 'ai-excluded' } })} canAccept onAcceptAll={onAcceptAll} onPartialAccept={onPartialAccept} />);
    expect(screen.getByRole('textbox', { name: 'Part of this alternative to apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply all of this alternative' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    rerender(<RevisionComparison candidate={candidate({ candidateText: 'Changed candidate' })} canAccept onAcceptAll={onAcceptAll} onPartialAccept={onPartialAccept} />);
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
  });

  it('keeps protected and unanchored alternatives unable to select or apply', () => {
    const protectedView = render(<RevisionComparison candidate={candidate({ protection: { excluded: true, class: 'ai-excluded' } })} canAccept onAcceptAll={vi.fn()} onPartialAccept={vi.fn()} />);
    expect(protectedView.getByRole('textbox', { name: 'Part of this alternative to apply' })).toBeDisabled();
    expect(protectedView.getByRole('button', { name: 'Apply all of this alternative' })).toBeDisabled();
    expect(protectedView.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    protectedView.unmount();
    render(<RevisionComparison candidate={candidate({ sourceAnchor: null })} canAccept onPartialAccept={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Part of this alternative to apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
  });

  it('keeps Home at the start when an alternative begins with a newline', () => {
    render(<RevisionComparison candidate={candidate({ candidateText: '\nSecond line' })} canAccept onPartialAccept={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: 'Part of this alternative to apply' }) as HTMLTextAreaElement;
    fireEvent.keyDown(textarea, { key: 'Home', ctrlKey: true });
    fireEvent.keyDown(textarea, { key: 'Home' });
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(0);
  });
  it('labels a partly applied alternative source as historical', () => {
    render(<RevisionComparison candidate={candidate({ lifecycle: 'partially accepted', currentness: 'stale' })} />);
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your current manuscript' })).not.toBeInTheDocument();
    expect(screen.getByText('This alternative was applied. The saved source passage below shows the earlier wording.')).toBeInTheDocument();
    expect(screen.getByText('This is the alternative you applied.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toHaveAccessibleDescription('This alternative is closed. To make another change, select words in Writing Studio and save a new alternative.');
  });
});
