import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  STORY_FOUNDATION_QUESTIONS,
  type StoryFoundationSnapshotV1,
} from '../../shared/ipc/storyFoundation';
import StoryFoundation from '../components/program7/StoryFoundation';

function snapshot(overrides: Partial<StoryFoundationSnapshotV1> = {}): StoryFoundationSnapshotV1 {
  return {
    availability: 'ready',
    document: {
      schemaVersion: 'BlackSkiesStoryFoundation v1',
      questionSetVersion: 1,
      projectId: 'project-a',
      revision: 4,
      entries: [],
    },
    questions: STORY_FOUNDATION_QUESTIONS,
    message: null,
    ...overrides,
  };
}

describe('StoryFoundation component', () => {
  it('is optional, preserves blank/unknown/undecided postures, and never gates writing', () => {
    render(<StoryFoundation snapshot={snapshot()} />);
    expect(screen.getByRole('heading', { name: 'Story Foundation' })).toBeInTheDocument();
    expect(screen.getByTestId('story-foundation-optional')).toHaveTextContent('skip every question');
    expect(screen.getByTestId('story-foundation')).toHaveAttribute('data-writing-gate', 'false');
    expect(screen.getAllByRole('article')).toHaveLength(13);
    expect(screen.getByTestId('story-foundation-question-project-kind')).toHaveTextContent('Not answered');
    expect(screen.getByRole('combobox', { name: 'Answer posture for project-kind' })).toHaveValue('blank');
    expect(screen.getByRole('combobox', { name: 'Answer posture for aboutness' })).toHaveValue('blank');
    fireEvent.change(screen.getByRole('combobox', { name: 'Answer posture for aboutness' }), { target: { value: 'unknown' } });
    expect(screen.getByTestId('story-foundation-question-aboutness')).toHaveTextContent('intentional unknown');
    fireEvent.change(screen.getByRole('combobox', { name: 'Answer posture for tone' }), { target: { value: 'undecided' } });
    expect(screen.getByTestId('story-foundation-question-tone')).toHaveTextContent('remain open');
  });

  it('requires explicit save for a new answer and explicit save revision for an edited answer', () => {
    const onSaveAnswer = vi.fn();
    const { rerender } = render(<StoryFoundation snapshot={snapshot()} onSaveAnswer={onSaveAnswer} />);
    const card = screen.getByTestId('story-foundation-question-aboutness');
    fireEvent.change(within(card).getByRole('combobox', { name: 'Answer posture for aboutness' }), { target: { value: 'answered' } });
    fireEvent.change(within(card).getByRole('textbox', { name: 'Your note for aboutness' }), { target: { value: 'A haunted friendship.' } });
    fireEvent.click(within(card).getByRole('button', { name: 'Save answer' }));
    expect(onSaveAnswer).toHaveBeenCalledWith({ questionId: 'aboutness', posture: 'answered', text: 'A haunted friendship.' });
    const entry = {
      questionId: 'aboutness' as const,
      lifecycle: 'active' as const,
      currentVersionId: 'aboutness-v1',
      versions: [{ id: 'aboutness-v1', posture: 'answered' as const, text: 'A haunted friendship.', provenance: 'author' as const, createdAt: '2026-09-11T00:00:00.000Z', supersededAt: null }],
      history: [{ id: 'aboutness-created', action: 'created' as const, versionId: 'aboutness-v1', occurredAt: '2026-09-11T00:00:00.000Z' }],
    };
    rerender(<StoryFoundation snapshot={snapshot({ document: { ...snapshot().document, revision: 5, entries: [entry] } })} onSaveAnswer={onSaveAnswer} />);
    const savedCard = screen.getByTestId('story-foundation-question-aboutness');
    expect(within(savedCard).getByRole('button', { name: 'Save revision' })).toBeInTheDocument();
    fireEvent.change(within(savedCard).getByRole('textbox', { name: 'Your note for aboutness' }), { target: { value: 'A haunted friendship under pressure.' } });
    fireEvent.click(within(savedCard).getByRole('button', { name: 'Save revision' }));
    expect(onSaveAnswer).toHaveBeenLastCalledWith({ questionId: 'aboutness', posture: 'answered', text: 'A haunted friendship under pressure.' });
  });

  it('shows author provenance and revision history, and exposes archive/restore callbacks', () => {
    const onArchiveAnswer = vi.fn();
    const onRestoreAnswer = vi.fn();
    const entry = {
      questionId: 'tone' as const,
      lifecycle: 'active' as const,
      currentVersionId: 'tone-v2',
      versions: [
        { id: 'tone-v1', posture: 'answered' as const, text: 'Quiet dread.', provenance: 'author' as const, createdAt: '2026-09-10T00:00:00.000Z', supersededAt: '2026-09-11T00:00:00.000Z' },
        { id: 'tone-v2', posture: 'answered' as const, text: 'Quiet dread with wonder.', provenance: 'author' as const, createdAt: '2026-09-11T00:00:00.000Z', supersededAt: null },
      ],
      history: [
        { id: 'tone-created', action: 'created' as const, versionId: 'tone-v1', occurredAt: '2026-09-10T00:00:00.000Z' },
        { id: 'tone-revised', action: 'revised' as const, versionId: 'tone-v2', occurredAt: '2026-09-11T00:00:00.000Z' },
      ],
    };
    const { rerender } = render(<StoryFoundation snapshot={snapshot({ document: { ...snapshot().document, entries: [entry] } })} onArchiveAnswer={onArchiveAnswer} onRestoreAnswer={onRestoreAnswer} />);
    const activeCard = screen.getByTestId('story-foundation-question-tone');
    expect(within(activeCard).getByText('Author entered')).toBeInTheDocument();
    expect(within(activeCard).getByText('Saved as author project guidance.')).toBeInTheDocument();
    expect(within(activeCard).getByText('Saved versions').parentElement).toHaveTextContent('2');
    fireEvent.click(within(activeCard).getByRole('button', { name: 'Archive answer' }));
    expect(onArchiveAnswer).toHaveBeenCalledWith('tone');
    const archivedEntry = { ...entry, lifecycle: 'archived' as const };
    rerender(<StoryFoundation snapshot={snapshot({ document: { ...snapshot().document, entries: [archivedEntry] } })} onArchiveAnswer={onArchiveAnswer} onRestoreAnswer={onRestoreAnswer} />);
    const archivedCard = screen.getByTestId('story-foundation-question-tone');
    expect(within(archivedCard).getByText('Archived')).toBeInTheDocument();
    fireEvent.click(within(archivedCard).getByRole('button', { name: 'Restore answer' }));
    expect(onRestoreAnswer).toHaveBeenCalledWith('tone');
  });

  it('keeps answer controls keyboard reachable and reports degraded storage honestly', () => {
    render(<StoryFoundation snapshot={snapshot({ availability: 'degraded', message: 'Saved answers cannot be read.' })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Saved answers cannot be read.');
    expect(screen.getByTestId('story-foundation-question-project-kind')).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('combobox', { name: 'Answer posture for project-kind' })).toBeEnabled();
  });
});
