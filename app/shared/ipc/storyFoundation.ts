export const STORY_FOUNDATION_CHANNELS = {
  get: 'story-foundation:get',
  setAnswer: 'story-foundation:set-answer',
  archiveAnswer: 'story-foundation:archive-answer',
  restoreAnswer: 'story-foundation:restore-answer',
} as const;

export const STORY_FOUNDATION_SCHEMA_VERSION = 'BlackSkiesStoryFoundation v1' as const;
export const STORY_FOUNDATION_QUESTION_SET_VERSION = 1 as const;
export const STORY_FOUNDATION_MAX_ANSWER_LENGTH = 12_000;

export const STORY_FOUNDATION_QUESTIONS = [
  { id: 'project-kind', prompt: 'What kind of project or story is this right now?' },
  { id: 'aboutness', prompt: 'If you can say it simply, what is it about?' },
  { id: 'reader-experience', prompt: 'What do you want the reader to feel, notice, or leave with?' },
  { id: 'tone', prompt: 'What tone or tonal range feels right?' },
  { id: 'reader', prompt: 'If you have a reader in mind, who is it?' },
  { id: 'planning-posture', prompt: 'How planned or exploratory do you want this project to be right now?' },
  { id: 'preserve', prompt: 'What matters most for this project not to lose?' },
  { id: 'boundaries', prompt: 'What creative or story boundaries, red lines, or sensitivities matter here?' },
  { id: 'non-assumptions', prompt: 'What should Black Skies avoid assuming about this project?' },
  { id: 'deliberate-unknowns', prompt: 'What are you deliberately leaving unknown or undecided?' },
  { id: 'discovery', prompt: 'What are you hoping this project will help you discover?' },
  { id: 'success', prompt: 'If this draft were working for you, what would success look like?' },
  { id: 'guidance-not-truth', prompt: 'Is there anything you want future tools to treat as guidance, not truth?' },
] as const;

export type StoryFoundationQuestionId = (typeof STORY_FOUNDATION_QUESTIONS)[number]['id'];
export type StoryFoundationPosture = 'blank' | 'unknown' | 'undecided' | 'answered';
export type StoryFoundationLifecycle = 'active' | 'archived';
export type StoryFoundationHistoryAction = 'created' | 'revised' | 'superseded' | 'archived' | 'restored';

export interface StoryFoundationAnswerVersionV1 {
  readonly id: string;
  readonly posture: StoryFoundationPosture;
  readonly text: string;
  readonly provenance: 'author';
  readonly createdAt: string;
  readonly supersededAt: string | null;
}

export interface StoryFoundationHistoryEventV1 {
  readonly id: string;
  readonly action: StoryFoundationHistoryAction;
  readonly versionId: string | null;
  readonly occurredAt: string;
}

export interface StoryFoundationEntryV1 {
  readonly questionId: StoryFoundationQuestionId;
  readonly lifecycle: StoryFoundationLifecycle;
  readonly currentVersionId: string;
  readonly versions: readonly StoryFoundationAnswerVersionV1[];
  readonly history: readonly StoryFoundationHistoryEventV1[];
}

export interface StoryFoundationDocumentV1 {
  readonly schemaVersion: typeof STORY_FOUNDATION_SCHEMA_VERSION;
  readonly questionSetVersion: typeof STORY_FOUNDATION_QUESTION_SET_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly entries: readonly StoryFoundationEntryV1[];
}

export interface StoryFoundationSnapshotV1 {
  readonly availability: 'ready' | 'degraded';
  readonly document: StoryFoundationDocumentV1;
  readonly questions: typeof STORY_FOUNDATION_QUESTIONS;
  readonly message: string | null;
}

export interface StoryFoundationProjectBinding {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}

export interface GetStoryFoundationRequest extends StoryFoundationProjectBinding {}

export interface SetStoryFoundationAnswerRequest extends StoryFoundationProjectBinding {
  readonly expectedRevision: number;
  readonly questionId: StoryFoundationQuestionId;
  readonly posture: StoryFoundationPosture;
  readonly text: string;
}

export interface ArchiveStoryFoundationAnswerRequest extends StoryFoundationProjectBinding {
  readonly expectedRevision: number;
  readonly questionId: StoryFoundationQuestionId;
}

export interface RestoreStoryFoundationAnswerRequest extends StoryFoundationProjectBinding {
  readonly expectedRevision: number;
  readonly questionId: StoryFoundationQuestionId;
}

export type StoryFoundationErrorCode =
  | 'NOT_AUTHORIZED'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'STALE_FOUNDATION'
  | 'UNKNOWN_QUESTION'
  | 'ANSWER_ARCHIVED'
  | 'INVALID_REQUEST'
  | 'FOUNDATION_UNAVAILABLE'
  | 'FOUNDATION_WRITE_FAILED';

export interface StoryFoundationError {
  readonly code: StoryFoundationErrorCode;
  readonly message: string;
}

export type StoryFoundationResult =
  | { readonly ok: true; readonly data: StoryFoundationSnapshotV1 }
  | { readonly ok: false; readonly error: StoryFoundationError };

export interface StoryFoundationBridge {
  get(request: GetStoryFoundationRequest): Promise<StoryFoundationResult>;
  setAnswer(request: SetStoryFoundationAnswerRequest): Promise<StoryFoundationResult>;
  archiveAnswer(request: ArchiveStoryFoundationAnswerRequest): Promise<StoryFoundationResult>;
  restoreAnswer(request: RestoreStoryFoundationAnswerRequest): Promise<StoryFoundationResult>;
}
