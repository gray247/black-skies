import { useEffect, useState } from 'react';

import {
  STORY_FOUNDATION_MAX_ANSWER_LENGTH,
  STORY_FOUNDATION_QUESTIONS,
  type StoryFoundationAnswerVersionV1,
  type StoryFoundationEntryV1,
  type StoryFoundationPosture,
  type StoryFoundationQuestionId,
  type StoryFoundationSnapshotV1,
} from '../../../shared/ipc/storyFoundation';

export interface StoryFoundationAnswerDraft {
  readonly questionId: StoryFoundationQuestionId;
  readonly posture: StoryFoundationPosture;
  readonly text: string;
}

export interface StoryFoundationProps {
  readonly snapshot: StoryFoundationSnapshotV1;
  readonly onSaveAnswer?: (draft: StoryFoundationAnswerDraft) => void;
  readonly onArchiveAnswer?: (questionId: StoryFoundationQuestionId) => void;
  readonly onRestoreAnswer?: (questionId: StoryFoundationQuestionId) => void;
}

interface DraftValue {
  readonly posture: StoryFoundationPosture;
  readonly text: string;
}

const postureOptions: readonly { readonly value: StoryFoundationPosture; readonly label: string }[] = [
  { value: 'blank', label: 'Leave blank' },
  { value: 'unknown', label: 'Deliberately unknown' },
  { value: 'undecided', label: 'Not decided yet' },
  { value: 'answered', label: 'Author answer' },
];

function currentVersion(entry: StoryFoundationEntryV1 | undefined): StoryFoundationAnswerVersionV1 | null {
  if (!entry) return null;
  return entry.versions.find((version) => version.id === entry.currentVersionId) ?? null;
}

function draftSeed(snapshot: StoryFoundationSnapshotV1): Record<string, DraftValue> {
  return Object.fromEntries(snapshot.questions.map((question) => {
    const version = currentVersion(snapshot.document.entries.find((entry) => entry.questionId === question.id));
    return [question.id, { posture: version?.posture ?? 'blank', text: version?.text ?? '' }];
  }));
}

function statusLabel(entry: StoryFoundationEntryV1 | undefined, version: StoryFoundationAnswerVersionV1 | null): string {
  if (!entry || !version) return 'Not answered';
  if (entry.lifecycle === 'archived') return 'Archived';
  if (version.posture === 'blank') return 'Blank';
  if (version.posture === 'unknown') return 'Unknown';
  if (version.posture === 'undecided') return 'Undecided';
  return 'Answered';
}

function postureHelp(posture: StoryFoundationPosture): string {
  if (posture === 'blank') return 'Skipping this question is allowed.';
  if (posture === 'unknown') return 'This is an intentional unknown, not a missing answer.';
  if (posture === 'undecided') return 'This can remain open while you write.';
  return 'Only your saved words become project guidance.';
}

function provenanceLabel(version: StoryFoundationAnswerVersionV1 | null): string {
  return version?.provenance === 'author' ? 'Author entered' : 'Not saved';
}

function QuestionCard({
  question,
  entry,
  version,
  draft,
  onDraftChange,
  onSaveAnswer,
  onArchiveAnswer,
  onRestoreAnswer,
}: {
  readonly question: (typeof STORY_FOUNDATION_QUESTIONS)[number];
  readonly entry: StoryFoundationEntryV1 | undefined;
  readonly version: StoryFoundationAnswerVersionV1 | null;
  readonly draft: DraftValue;
  readonly onDraftChange: (questionId: StoryFoundationQuestionId, value: DraftValue) => void;
  readonly onSaveAnswer?: (draft: StoryFoundationAnswerDraft) => void;
  readonly onArchiveAnswer?: (questionId: StoryFoundationQuestionId) => void;
  readonly onRestoreAnswer?: (questionId: StoryFoundationQuestionId) => void;
}): JSX.Element {
  const questionId = `story-foundation-${question.id}`;
  const archived = entry?.lifecycle === 'archived';
  const changed = draft.posture !== (version?.posture ?? 'blank') || draft.text !== (version?.text ?? '');
  const saveLabel = version ? 'Save revision' : 'Save answer';

  return (
    <article
      className="program7-story-foundation__question"
      tabIndex={0}
      aria-label={`Story Foundation question: ${question.prompt}`}
      data-testid={`story-foundation-question-${question.id}`}
      data-dirty={changed ? 'true' : 'false'}
    >
      <header className="program7-story-foundation__question-header">
        <div>
          <h2>{question.prompt}</h2>
          <p>{postureHelp(draft.posture)}</p>
        </div>
        <span>{statusLabel(entry, version)}</span>
      </header>
      <div className="program7-story-foundation__fields">
        <label htmlFor={`${questionId}-posture`}>Answer posture</label>
        <select
          id={`${questionId}-posture`}
          aria-label={`Answer posture for ${question.id}`}
          value={draft.posture}
          disabled={archived}
          onChange={(event) => onDraftChange(question.id, { ...draft, posture: event.target.value as StoryFoundationPosture })}
        >
          {postureOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label htmlFor={`${questionId}-text`}>Your note</label>
        <textarea
          id={`${questionId}-text`}
          aria-label={`Your note for ${question.id}`}
          value={draft.text}
          maxLength={STORY_FOUNDATION_MAX_ANSWER_LENGTH}
          disabled={archived}
          placeholder={draft.posture === 'answered' ? 'Write only what you want to keep as project guidance.' : 'Optional explanation'}
          onChange={(event) => onDraftChange(question.id, { ...draft, text: event.target.value })}
        />
      </div>
      <dl className="program7-story-foundation__metadata">
        <div><dt>Provenance</dt><dd>{provenanceLabel(version)}</dd></div>
        <div><dt>Saved versions</dt><dd>{entry?.versions.length ?? 0}</dd></div>
        <div><dt>History events</dt><dd>{entry?.history.length ?? 0}</dd></div>
      </dl>
      <div className="program7-story-foundation__actions" aria-label={`Actions for ${question.id}`}>
        {archived ? (
          <button
            type="button"
            disabled={!onRestoreAnswer}
            onClick={() => onRestoreAnswer?.(question.id)}
          >
            Restore answer
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={!onSaveAnswer}
              onClick={() => onSaveAnswer?.({ questionId: question.id, posture: draft.posture, text: draft.text })}
            >
              {saveLabel}
            </button>
            {entry ? (
              <button
                type="button"
                disabled={!onArchiveAnswer}
                onClick={() => onArchiveAnswer?.(question.id)}
              >
                Archive answer
              </button>
            ) : null}
          </>
        )}
      </div>
      {!changed && version ? <p className="program7-story-foundation__saved-note">Saved as author project guidance.</p> : null}
    </article>
  );
}

export default function StoryFoundation({
  snapshot,
  onSaveAnswer,
  onArchiveAnswer,
  onRestoreAnswer,
}: StoryFoundationProps): JSX.Element {
  const [drafts, setDrafts] = useState<Record<string, DraftValue>>(() => draftSeed(snapshot));

  useEffect(() => {
    setDrafts(draftSeed(snapshot));
  }, [snapshot.document.projectId, snapshot.document.revision]);

  return (
    <section
      className="program7-story-foundation"
      aria-labelledby="program7-story-foundation-heading"
      data-testid="story-foundation"
      data-writing-gate="false"
    >
      <header>
        <h1 id="program7-story-foundation-heading">Story Foundation</h1>
        <p>Optional project intent and creative guidance. It never becomes manuscript truth.</p>
        <p data-testid="story-foundation-optional">You may skip every question and keep writing. Nothing here blocks Writing Studio.</p>
        <p>Project revision {snapshot.document.revision} · {snapshot.document.entries.length} saved answer{snapshot.document.entries.length === 1 ? '' : 's'}</p>
      </header>
      {snapshot.availability === 'degraded' ? (
        <p role="alert" data-testid="story-foundation-degraded">
          {snapshot.message ?? 'Story Foundation is temporarily unavailable. Writing remains available and no change was made.'}
        </p>
      ) : null}
      {snapshot.message && snapshot.availability === 'ready' ? <p data-testid="story-foundation-message">{snapshot.message}</p> : null}
      <div className="program7-story-foundation__questions">
        {snapshot.questions.map((question) => {
          const entry = snapshot.document.entries.find((candidate) => candidate.questionId === question.id);
          const version = currentVersion(entry);
          const draft = drafts[question.id] ?? { posture: version?.posture ?? 'blank', text: version?.text ?? '' };
          return (
            <QuestionCard
              key={question.id}
              question={question}
              entry={entry}
              version={version}
              draft={draft}
              onDraftChange={(questionId, value) => setDrafts((previous) => ({ ...previous, [questionId]: value }))}
              onSaveAnswer={onSaveAnswer}
              onArchiveAnswer={onArchiveAnswer}
              onRestoreAnswer={onRestoreAnswer}
            />
          );
        })}
      </div>
    </section>
  );
}
