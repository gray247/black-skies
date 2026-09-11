import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RevisionCandidateV1 } from '../../shared/ipc/revisionCandidates';
import WritingRevisionDrawer from '../components/program7/WritingRevisionDrawer';

function candidate(overrides: Partial<RevisionCandidateV1> = {}): RevisionCandidateV1 {
  return {
    id: 'candidate-a',
    projectId: 'project-a',
    unitId: 'story-unit/carmilla-chapter-01',
    sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: 'Current manuscript passage.' },
    sourceAnchor: null,
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

describe('WritingRevisionDrawer component', () => {
  it('opens as an explicit candidate editor and saves edits without accepting them', () => {
    const onClose = vi.fn();
    const onSaveEdit = vi.fn();
    render(<WritingRevisionDrawer open candidate={candidate()} onClose={onClose} onSaveEdit={onSaveEdit} />);
    const drawer = screen.getByTestId('writing-revision-drawer');
    expect(within(drawer).getByRole('heading', { name: 'Write revision candidate' })).toBeInTheDocument();
    expect(within(drawer).getByText('Current manuscript passage.')).toBeInTheDocument();
    const editor = within(drawer).getByRole('textbox', { name: 'Candidate text to edit' });
    fireEvent.change(editor, { target: { value: 'Edited candidate passage.' } });
    fireEvent.click(within(drawer).getByRole('button', { name: 'Save candidate edit' }));
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close drawer' }));
    expect(onSaveEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }), 'Edited candidate passage.');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(within(drawer).getByText(/does not accept, reject, park, abandon, or resolve/)).toBeInTheDocument();
  });

  it('starts with saved edited candidate text and keeps the save gesture explicit', () => {
    const onSaveEdit = vi.fn();
    render(<WritingRevisionDrawer open candidate={candidate({ editedCandidateText: 'Previously edited candidate.' })} onSaveEdit={onSaveEdit} />);
    const editor = screen.getByRole('textbox', { name: 'Candidate text to edit' });
    expect(editor).toHaveValue('Previously edited candidate.');
    expect(screen.getByRole('button', { name: 'Save candidate edit' })).toBeDisabled();
  });

  it('redacts protected content and prevents editing', () => {
    render(<WritingRevisionDrawer open candidate={candidate({ protection: { excluded: true, class: 'protected', reason: 'author boundary' }, sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: 'PROTECTED_SOURCE_SENTINEL' }, candidateText: 'PROTECTED_CANDIDATE_SENTINEL' })} onSaveEdit={vi.fn()} />);
    expect(screen.queryByText('PROTECTED_SOURCE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_CANDIDATE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('hidden by protection policy');
    expect(screen.getByRole('textbox', { name: 'Candidate text to edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save candidate edit' })).toBeDisabled();
  });

  it('does not render when closed or when there is no selected candidate', () => {
    const { rerender } = render(<WritingRevisionDrawer open={false} candidate={candidate()} />);
    expect(screen.queryByTestId('writing-revision-drawer')).not.toBeInTheDocument();
    rerender(<WritingRevisionDrawer open candidate={null} />);
    expect(screen.queryByTestId('writing-revision-drawer')).not.toBeInTheDocument();
  });
});
