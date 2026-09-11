import type { Program7SourceEnvelopeV1 } from '../program7SourceBinding.js';

export const FEEDBACK_NOTE_CHANNELS = {
  createFromCritique: 'feedback-notes:create-from-critique',
  list: 'feedback-notes:list',
  createRevisionItem: 'feedback-notes:create-revision-item',
  listRevisionItems: 'feedback-notes:list-revision-items',
  setLifecycle: 'feedback-notes:set-lifecycle',
  deterministicRecheck: 'feedback-notes:deterministic-recheck',
  localRecheck: 'feedback-notes:local-recheck',
  createRecurrence: 'feedback-notes:create-recurrence',
} as const;

export const FEEDBACK_NOTE_SCHEMA_VERSION = 'BlackSkiesFeedbackNotes v1' as const;
export const FEEDBACK_NOTE_MAX_BODY_LENGTH = 4_000;
export const FEEDBACK_NOTE_HISTORY_LIMIT = 100;

export type FeedbackNoteKind = 'advisory' | 'revision_item';
export type FeedbackRevisionLifecycle =
  | 'active'
  | 'review'
  | 'intended'
  | 'underway'
  | 'ready_for_recheck'
  | 'stale'
  | 'recheck_pending'
  | 'parked'
  | 'dismissed'
  | 'resolved'
  | 'abandoned';
export type FeedbackRevisionDisposition = 'parked' | 'dismissed' | 'resolved' | 'abandoned';
export type FeedbackRecheckStatus =
  | 'appears_resolved'
  | 'still_appears_present'
  | 'unavailable'
  | 'not_run';

/** The anchor shape deliberately mirrors ManuscriptStructureAnchorV1 without
 * importing the main-process implementation into the shared contract. */
export interface FeedbackNoteAnchor {
  readonly schemaVersion: 1;
  readonly anchorKind: 'position' | 'span';
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectionSearchFingerprint: string;
  readonly sourceFingerprint: string;
  readonly selectionFingerprint: string;
  readonly prefixLength: number;
  readonly prefixSearchFingerprint: string;
  readonly prefixFingerprint: string;
  readonly suffixLength: number;
  readonly suffixSearchFingerprint: string;
  readonly suffixFingerprint: string;
}

export interface FeedbackNoteProvenance {
  readonly source: 'program6_finding' | 'critique' | 'manual' | 'recheck' | 'recurrence' | string;
  readonly findingId?: string;
  readonly lens?: string;
  readonly evidence?: string;
  readonly origin?: string;
  readonly [key: string]: unknown;
}

export interface FeedbackNoteProtection {
  readonly protected: boolean;
  readonly reason?: string;
  readonly [key: string]: unknown;
}

export interface FeedbackNoteRecheck {
  readonly id: string;
  readonly status: FeedbackRecheckStatus;
  readonly evidence?: string;
  readonly createdAt: string;
  readonly sourceBodyFingerprint?: string;
  readonly method?: 'deterministic' | 'local-ai';
  readonly sourceStatus?: string;
  readonly [key: string]: unknown;
}

export interface FeedbackNoteDisposition {
  readonly id: string;
  readonly disposition: FeedbackRevisionDisposition;
  readonly createdAt: string;
  readonly actor: 'author' | 'system' | string;
  readonly reason?: string;
  readonly [key: string]: unknown;
}

export type FeedbackNoteErrorCode =
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_REQUEST'
  | 'CRITIQUE_UNAVAILABLE'
  | 'FEEDBACK_NOTES_UNAVAILABLE'
  | 'FEEDBACK_NOTE_WRITE_FAILED'
  | 'SOURCE_STALE'
  | 'REVISION_ITEM_NOT_FOUND'
  | 'LOCAL_INFERENCE_UNAVAILABLE'
  | 'STALE_REVISION';

export interface FeedbackNoteError {
  readonly code: FeedbackNoteErrorCode;
  readonly message: string;
}

interface FeedbackNoteBase {
  readonly id: string;
  readonly projectId: string;
  readonly unitId: string;
  readonly createdAt: string;
  readonly body: string;
  /** Optional on legacy advisory records; present on normalized records. */
  readonly kind?: FeedbackNoteKind;
  readonly sourceFindingId?: string;
  readonly lens?: string;
  readonly evidence?: string;
  readonly provenance?: FeedbackNoteProvenance;
  readonly protection?: FeedbackNoteProtection;
  readonly anchor?: FeedbackNoteAnchor;
  readonly sourceBodyFingerprint?: string;
  readonly sourceGeneration?: number;
  readonly sourceRevision?: number;
  readonly sourceKind?: string;
  readonly sourceId?: string;
  readonly sourceClass?: string;
  readonly sessionId?: string;
  readonly documentRevision?: number;
  readonly revision?: number;
  readonly lifecycle?: FeedbackRevisionLifecycle;
  readonly state?: FeedbackRevisionLifecycle;
  readonly rechecks?: readonly FeedbackNoteRecheck[];
  readonly dispositionHistory?: readonly FeedbackNoteDisposition[];
  readonly relatedRecurrenceId?: string;
  readonly relatedRevisionItemId?: string;
  readonly relatedItemId?: string;
  readonly recurrenceOf?: string;
  readonly sessionBinding?: string;
  readonly retained?: boolean;
  readonly [key: string]: unknown;
}

export interface AdvisoryFeedbackNote extends FeedbackNoteBase {
  readonly sourceCritiqueRequestId: string;
  readonly selectionFingerprint: string;
  readonly advisory: true;
  readonly kind?: 'advisory';
}

/** Compatibility name for the v1 advisory-note IPC contract. */
export type FeedbackNote = AdvisoryFeedbackNote;

export interface RevisionItem extends FeedbackNoteBase {
  readonly advisory: false;
  readonly kind: 'revision_item';
  readonly lifecycle: FeedbackRevisionLifecycle;
}

export type FeedbackNoteRecord = AdvisoryFeedbackNote | RevisionItem;

export type FeedbackNotesDocument = {
  readonly schemaVersion: typeof FEEDBACK_NOTE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly notes: readonly FeedbackNoteRecord[];
  readonly [key: string]: unknown;
};

export interface CreateRevisionItemInput {
  readonly projectId: string;
  readonly unitId: string;
  readonly body: string;
  readonly sourceCritiqueRequestId?: string;
  readonly selectionFingerprint?: string;
  readonly sourceFindingId?: string;
  readonly lens?: string;
  readonly evidence?: string;
  readonly provenance?: FeedbackNoteProvenance;
  readonly protection?: FeedbackNoteProtection;
  readonly anchor?: FeedbackNoteAnchor;
  readonly sourceBodyFingerprint?: string;
  readonly sourceGeneration?: number;
  readonly sourceRevision?: number;
  readonly sourceKind?: string;
  readonly sourceId?: string;
  readonly sourceClass?: string;
  readonly sessionId?: string;
  readonly documentRevision?: number;
  readonly revision?: number;
  readonly relatedRevisionItemId?: string;
  readonly relatedItemId?: string;
  readonly recurrenceOf?: string;
  readonly sessionBinding?: string;
  readonly [key: string]: unknown;
}

export interface FeedbackNoteMutationResult {
  readonly document: FeedbackNotesDocument;
  readonly note?: FeedbackNoteRecord;
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

export interface RevisionItemProjectBindingV1 {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}

export interface CreateRevisionItemRequest extends RevisionItemProjectBindingV1 {
  readonly expectedRevision: number;
  readonly source: Program7SourceEnvelopeV1;
  /** The author's concern or intended revision, never manuscript prose. */
  readonly body: string;
}

export type RevisionItemListScopeV1 = 'active' | 'history' | 'all';

export interface ListRevisionItemsRequest extends RevisionItemProjectBindingV1 {
  readonly scope: RevisionItemListScopeV1;
}

export interface RevisionItemMutationRequest extends RevisionItemProjectBindingV1 {
  readonly expectedRevision: number;
  readonly itemId: string;
}

export interface SetRevisionLifecycleRequest extends RevisionItemMutationRequest {
  readonly lifecycle: FeedbackRevisionLifecycle;
  readonly reason?: string;
}

export interface RevisionItemRecheckRequest extends RevisionItemMutationRequest {
  readonly purpose?: string;
}

export interface CreateRevisionRecurrenceRequest extends RevisionItemMutationRequest {
  readonly body: string;
  readonly source: Program7SourceEnvelopeV1;
}

export interface RevisionItemSuccess {
  readonly ok: true;
  readonly data: RevisionItem | FeedbackNotesDocument | FeedbackNoteRecheck;
  readonly revision: number;
}

export interface RevisionItemsListSuccess {
  readonly ok: true;
  readonly data: readonly RevisionItem[];
  readonly revision: number;
}

export type RevisionItemResult = RevisionItemSuccess | FeedbackNoteFailure;
export type RevisionItemsListResult = RevisionItemsListSuccess | FeedbackNoteFailure;

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
  createFromCritique(request: CreateFeedbackNoteFromCritiqueRequest): Promise<FeedbackNoteResult>;
  list?(request: ListFeedbackNotesRequest): Promise<FeedbackNotesListResult>;
  createRevisionItem?(request: CreateRevisionItemRequest): Promise<RevisionItemResult>;
  listRevisionItems?(request: ListRevisionItemsRequest): Promise<RevisionItemsListResult>;
  setLifecycle?(request: SetRevisionLifecycleRequest): Promise<RevisionItemResult>;
  deterministicRecheck?(request: RevisionItemRecheckRequest): Promise<RevisionItemResult>;
  localRecheck?(request: RevisionItemRecheckRequest): Promise<RevisionItemResult>;
  createRecurrence?(request: CreateRevisionRecurrenceRequest): Promise<RevisionItemResult>;
}
