export const FEEDBACK_NOTE_CHANNELS = {
  createFromCritique: 'feedback-notes:create-from-critique',
  list: 'feedback-notes:list',
} as const;

export const FEEDBACK_NOTE_SCHEMA_VERSION = 'BlackSkiesFeedbackNotes v1' as const;
export const FEEDBACK_NOTE_MAX_BODY_LENGTH = 4_000;

export type FeedbackNoteErrorCode =
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_REQUEST'
  | 'CRITIQUE_UNAVAILABLE'
  | 'FEEDBACK_NOTES_UNAVAILABLE'
  | 'FEEDBACK_NOTE_WRITE_FAILED';

export interface FeedbackNoteError {
  readonly code: FeedbackNoteErrorCode;
  readonly message: string;
}

export interface FeedbackNote {
  readonly id: string;
  readonly projectId: string;
  readonly unitId: string;
  readonly sourceCritiqueRequestId: string;
  readonly selectionFingerprint: string;
  readonly createdAt: string;
  readonly advisory: true;
  readonly body: string;
}

export interface CreateFeedbackNoteFromCritiqueRequest {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly unitId: string;
  readonly sourceCritiqueRequestId: string;
  readonly selectionFingerprint: string;
  readonly body: string;
}

export interface ListFeedbackNotesRequest {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}

export interface FeedbackNoteSuccess {
  readonly ok: true;
  readonly data: FeedbackNote;
}

export interface FeedbackNoteFailure {
  readonly ok: false;
  readonly error: FeedbackNoteError;
}

export type FeedbackNoteResult = FeedbackNoteSuccess | FeedbackNoteFailure;

export interface FeedbackNotesListSuccess {
  readonly ok: true;
  readonly data: readonly FeedbackNote[];
}

export type FeedbackNotesListResult = FeedbackNotesListSuccess | FeedbackNoteFailure;

export interface FeedbackNotesBridge {
  createFromCritique(
    request: CreateFeedbackNoteFromCritiqueRequest,
  ): Promise<FeedbackNoteResult>;
  list?(request: ListFeedbackNotesRequest): Promise<FeedbackNotesListResult>;
}
