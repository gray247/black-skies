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
    expect(screen.getByRole('heading', { name: 'Current manuscript text' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Candidate text' })).toBeInTheDocument();
    expect(screen.getByTestId('revision-current-text')).toHaveTextContent('Current manuscript passage.');
    expect(screen.getByTestId('revision-candidate-text')).toHaveTextContent('Candidate manuscript passage.');
    expect(screen.getByTestId('revision-comparison-origin')).toHaveTextContent('Local-AI · qwen3:4b');
    expect(screen.getByRole('alert')).toHaveTextContent('stale');
    expect(screen.getByRole('list')).toHaveTextContent('Source changed since candidate creation.');
  });

  it('requires explicit all or selected acceptance and keeps disposition actions separate', () => {
    const onAcceptAll = vi.fn();
    const onPartialAccept = vi.fn();
    const onLifecycle = vi.fn();
    const onOpenEditor = vi.fn();
    render(<RevisionComparison candidate={candidate()} canAccept onAcceptAll={onAcceptAll} onPartialAccept={onPartialAccept} onLifecycle={onLifecycle} onOpenEditor={onOpenEditor} />);
    const comparison = screen.getByTestId('revision-comparison');
    fireEvent.click(within(comparison).getByRole('button', { name: 'Accept all candidate text' }));
    fireEvent.change(within(comparison).getByRole('textbox', { name: 'Text to accept for partial acceptance' }), { target: { value: 'Candidate manuscript' } });
    fireEvent.click(within(comparison).getByRole('button', { name: 'Accept selected text only' }));
    fireEvent.click(within(comparison).getByRole('button', { name: 'Edit candidate' }));
    fireEvent.click(within(comparison).getByRole('button', { name: 'Park candidate' }));
    expect(onAcceptAll).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }));
    expect(onPartialAccept).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }), 'Candidate manuscript');
    expect(onOpenEditor).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }));
    expect(onLifecycle).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }), 'parked');
    expect(within(comparison).getByText(/silently resolves the revision item/)).toBeInTheDocument();
  });

  it('does not offer acceptance through a stale candidate or expose protected source text', () => {
    const onAcceptAll = vi.fn();
    render(<RevisionComparison candidate={candidate({ currentness: 'stale', protection: { excluded: true, class: 'ai-excluded', reason: 'author boundary' }, sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: 'PROTECTED_SOURCE_SENTINEL' }, candidateText: 'PROTECTED_CANDIDATE_SENTINEL' })} canAccept onAcceptAll={onAcceptAll} />);
    expect(screen.queryByText('PROTECTED_SOURCE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_CANDIDATE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getAllByText('Content hidden by protection policy.')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Accept all candidate text' })).toBeDisabled();
  });
});
