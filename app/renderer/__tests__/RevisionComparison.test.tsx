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
    sourceAnchor: { unitId: 'story-unit/carmilla-chapter-01', selectionStart: 0, selectionEnd: 28, selectionFingerprint: 'selection' },
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

  it('requires explicit all or selected acceptance and keeps disposition actions separate', () => {
    const onAcceptAll = vi.fn();
    const onPartialAccept = vi.fn();
    const onLifecycle = vi.fn();
    const onOpenEditor = vi.fn();
    render(<RevisionComparison candidate={candidate()} canAccept onAcceptAll={onAcceptAll} onPartialAccept={onPartialAccept} onLifecycle={onLifecycle} onOpenEditor={onOpenEditor} />);
    const comparison = screen.getByTestId('revision-comparison');
    fireEvent.click(within(comparison).getByRole('button', { name: 'Apply all of this alternative' }));
    const partialSelection = within(comparison).getByRole('textbox', { name: 'Part of this alternative to apply' }) as HTMLTextAreaElement;
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
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.getByText('This is the saved passage used to create this alternative.')).toBeInTheDocument();
    expect(screen.queryByText('This saved passage remains unchanged while you review the alternative.')).not.toBeInTheDocument();
  });

  it('does not enable partial application without an exact saved source passage', () => {
    render(<RevisionComparison candidate={candidate({ sourceAnchor: null })} canAccept onPartialAccept={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Part of this alternative to apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Apply only the selected part' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Select a passage in your manuscript before creating a fresh alternative');
  });

  it('labels a partly applied alternative source as historical', () => {
    render(<RevisionComparison candidate={candidate({ lifecycle: 'partially accepted' })} />);
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your current manuscript' })).not.toBeInTheDocument();
  });
});
