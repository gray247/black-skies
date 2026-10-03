import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import type { RevisionCandidateV1 } from '../../shared/ipc/revisionCandidates';
import WritingRevisionDrawer, { type WritingRevisionSaveResult } from '../components/program7/WritingRevisionDrawer';

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
  it('moves focus into the drawer and returns it to the invoking control on close', async () => {
    function Harness(): JSX.Element {
      const [open, setOpen] = useState(false);
      const [candidateId, setCandidateId] = useState('candidate-a');
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Edit invoking candidate</button>
          <button type="button" onClick={() => setCandidateId('candidate-b')}>Swap candidate</button>
          <WritingRevisionDrawer
            open={open}
            candidate={open ? candidate({ id: candidateId }) : null}
            onClose={() => setOpen(false)}
          />
        </>
      );
    }

    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Edit invoking candidate' });
    opener.focus();
    fireEvent.click(opener);
    await screen.findByRole('button', { name: 'Close drawer' });
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Close drawer' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Swap candidate' }));
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Close drawer' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    await vi.waitFor(() => expect(opener).toHaveFocus());
  });

  it('opens as a revision alternative editor and saves edits without applying them', async () => {
    const onClose = vi.fn();
    const onSaveEdit = vi.fn(() => ({ ok: true, message: 'Revision alternative saved.' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<WritingRevisionDrawer open candidate={candidate()} onClose={onClose} onSaveEdit={onSaveEdit} />);
    const drawer = screen.getByTestId('writing-revision-drawer');
    expect(within(drawer).getByRole('heading', { name: 'Edit revision alternative' })).toBeInTheDocument();
    expect(within(drawer).getByRole('heading', { name: 'Your current manuscript' })).toBeInTheDocument();
    expect(within(drawer).getByText('Current manuscript passage.')).toBeInTheDocument();
    const editor = within(drawer).getByRole('textbox', { name: 'Revision alternative text' });
    fireEvent.change(editor, { target: { value: 'Edited candidate passage.' } });
    fireEvent.click(within(drawer).getByRole('button', { name: 'Save revision alternative' }));
    await vi.waitFor(() => expect(within(drawer).getByRole('button', { name: 'Close drawer' })).toBeEnabled());
    fireEvent.click(within(drawer).getByRole('button', { name: 'Close drawer' }));
    expect(onSaveEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'candidate-a' }), 'Edited candidate passage.');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(within(drawer).getByText(/does not apply it or mark the related concern finished/)).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it.each([
    ['stale', 'This alternative cannot be applied because the passage changed.'],
    ['unavailable', 'This alternative cannot be applied because its original passage is unavailable.'],
  ] as const)('labels %s source as saved and preserves the snapshot', (currentness, refusal) => {
    render(<WritingRevisionDrawer open candidate={candidate({ currentness })} />);
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Your current manuscript' })).not.toBeInTheDocument();
    expect(screen.getByText('Current manuscript passage.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(refusal);
  });

  it.each(['accepted', 'partially accepted'] as const)('labels %s candidates as applied historical sources', (lifecycle) => {
    render(<WritingRevisionDrawer open candidate={candidate({ lifecycle, currentness: 'stale' })} onSaveEdit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Saved source passage' })).toBeInTheDocument();
    expect(screen.getByText('This alternative was applied. The saved source passage below shows the earlier wording.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Revision alternative text' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save revision alternative' })).toBeDisabled();
  });

  it('confirms before discarding dirty edits and preserves them when canceled', () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<WritingRevisionDrawer open candidate={candidate()} onClose={onClose} />);
    const editor = screen.getByRole('textbox', { name: 'Revision alternative text' });
    fireEvent.change(editor, { target: { value: 'Unsaved edit.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(editor).toHaveValue('Unsaved edit.');
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();
  });

  it('prevents duplicate saves, reports failures, and permits retry', async () => {
    let resolveSave!: (result: WritingRevisionSaveResult) => void;
    const onSaveEdit = vi.fn(() => new Promise<WritingRevisionSaveResult>((resolve) => { resolveSave = resolve; }));
    render(<WritingRevisionDrawer open candidate={candidate()} onSaveEdit={onSaveEdit} />);
    const editor = screen.getByRole('textbox', { name: 'Revision alternative text' });
    fireEvent.change(editor, { target: { value: 'Retry me.' } });
    const save = screen.getByRole('button', { name: 'Save revision alternative' });
    fireEvent.click(save);
    fireEvent.click(save);
    expect(onSaveEdit).toHaveBeenCalledTimes(1);
    expect(save).toBeDisabled();
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saving this alternative'));
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    resolveSave({ ok: false, message: 'Save failed.' });
    await vi.waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Save failed.'));
    expect(editor).toHaveValue('Retry me.');
    expect(save).toBeEnabled();
  });

  it('blocks dirty unload without confirmation and announces how to decide', async () => {
    const confirm = vi.spyOn(window, 'confirm');
    render(<WritingRevisionDrawer open candidate={candidate()} />);
    const editor = screen.getByRole('textbox', { name: 'Revision alternative text' });
    fireEvent.change(editor, { target: { value: 'Keep this edit.' } });
    const beforeUnload = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    expect(editor).toHaveValue('Keep this edit.');
    await vi.waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/window stayed open because this revision alternative has unsaved changes/i));
    confirm.mockRestore();
  });

  it('keeps saved edited text and success status until the candidate acknowledgment arrives', async () => {
    const { rerender } = render(<WritingRevisionDrawer open candidate={candidate()} onSaveEdit={() => ({ ok: true, message: 'Saved revision alternative.' })} />);
    const editor = screen.getByRole('textbox', { name: 'Revision alternative text' });
    fireEvent.change(editor, { target: { value: 'Saved edit.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save revision alternative' }));
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Saved revision alternative.'));
    expect(editor).toHaveValue('Saved edit.');
    rerender(<WritingRevisionDrawer open candidate={candidate({ editedCandidateText: 'Saved edit.', updatedAt: '2026-09-12T00:00:00.000Z' })} onSaveEdit={() => ({ ok: true, message: 'Saved revision alternative.' })} />);
    expect(editor).toHaveValue('Saved edit.');
  });

  it('starts with saved edited candidate text and keeps the save gesture explicit', () => {
    const onSaveEdit = vi.fn();
    render(<WritingRevisionDrawer open candidate={candidate({ editedCandidateText: 'Previously edited candidate.' })} onSaveEdit={onSaveEdit} />);
    const editor = screen.getByRole('textbox', { name: 'Revision alternative text' });
    expect(editor).toHaveValue('Previously edited candidate.');
    expect(screen.getByRole('button', { name: 'Save revision alternative' })).toBeDisabled();
  });

  it('redacts protected content and prevents editing', () => {
    render(<WritingRevisionDrawer open candidate={candidate({ protection: { excluded: true, class: 'protected', reason: 'author boundary' }, sourceSnapshot: { unitId: 'story-unit/carmilla-chapter-01', bodySha256: 'source-body', text: 'PROTECTED_SOURCE_SENTINEL' }, candidateText: 'PROTECTED_CANDIDATE_SENTINEL' })} onSaveEdit={vi.fn()} />);
    expect(screen.queryByText('PROTECTED_SOURCE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.queryByText('PROTECTED_CANDIDATE_SENTINEL')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('hidden by protection policy');
    expect(screen.getByRole('textbox', { name: 'Revision alternative text' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save revision alternative' })).toBeDisabled();
  });

  it('does not render when closed or when there is no selected candidate', () => {
    const { rerender } = render(<WritingRevisionDrawer open={false} candidate={candidate()} />);
    expect(screen.queryByTestId('writing-revision-drawer')).not.toBeInTheDocument();
    rerender(<WritingRevisionDrawer open candidate={null} />);
    expect(screen.queryByTestId('writing-revision-drawer')).not.toBeInTheDocument();
  });
});
