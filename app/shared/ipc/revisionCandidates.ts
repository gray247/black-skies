import type {
  Program7LocalInferenceRequestV1,
  Program7LocalInferenceResponseV1,
} from '../localInference.js';

export const REVISION_CANDIDATE_CHANNELS = {
  list: 'revision-candidates:list',
  createManual: 'revision-candidates:create-manual',
  createLocalAi: 'revision-candidates:create-local-ai',
  edit: 'revision-candidates:edit',
  setLifecycle: 'revision-candidates:set-lifecycle',
} as const;
export const REVISION_CANDIDATE_SCHEMA_VERSION = 'BlackSkiesRevisionCandidates v1' as const;
export const REVISION_CANDIDATE_MAX_SOURCE_LENGTH = 12_000;
export const REVISION_CANDIDATE_MAX_TEXT_LENGTH = 6_000;
export const REVISION_CANDIDATE_MAX_PURPOSE_LENGTH = 1_000;
export const REVISION_CANDIDATE_MAX_WARNING_LENGTH = 1_000;
export const REVISION_CANDIDATE_HISTORY_LIMIT = 100;

export type RevisionCandidateLifecycle =
  | 'generated'
  | 'reviewing'
  | 'accepted'
  | 'partially accepted'
  | 'rejected'
  | 'parked'
  | 'abandoned'
  | 'stale';
export type RevisionCandidateOrigin = 'manual' | 'local-ai';
export type RevisionCandidateCurrentness = 'current' | 'stale' | 'unavailable';
export type RevisionCandidateActor = 'author' | 'local-ai' | 'system';

export interface RevisionCandidateSourceAnchorV1 {
  readonly unitId: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectionFingerprint: string;
}

export interface RevisionCandidateSourceSnapshotV1 {
  readonly unitId: string;
  readonly bodySha256: string;
  readonly text: string;
}

export interface RevisionCandidateProtectionV1 {
  readonly excluded: boolean;
  readonly class: 'ordinary' | 'protected' | 'metadata-only' | 'ai-excluded';
  readonly reason?: string;
}

export interface RevisionCandidateProvenanceV1 {
  readonly origin: RevisionCandidateOrigin;
  readonly source: 'author' | 'program7-local-ai';
  readonly model: 'qwen3:4b' | null;
  readonly receipt: Program7LocalInferenceResponseV1['receipt'] | null;
}

export interface RevisionCandidateHistoryEventV1 {
  readonly id: string;
  readonly lifecycle: RevisionCandidateLifecycle;
  readonly actor: RevisionCandidateActor;
  readonly occurredAt: string;
  readonly note: string | null;
}

export interface RevisionCandidateV1 {
  readonly id: string;
  readonly projectId: string;
  readonly unitId: string;
  readonly sourceSnapshot: RevisionCandidateSourceSnapshotV1;
  readonly sourceAnchor: RevisionCandidateSourceAnchorV1 | null;
  readonly sourceBodySha256: string;
  readonly purpose: string;
  readonly origin: RevisionCandidateOrigin;
  readonly provenance: RevisionCandidateProvenanceV1;
  readonly protection: RevisionCandidateProtectionV1;
  readonly warnings: readonly string[];
  readonly currentness: RevisionCandidateCurrentness;
  readonly candidateText: string;
  readonly editedCandidateText: string | null;
  readonly lifecycle: RevisionCandidateLifecycle;
  readonly history: readonly RevisionCandidateHistoryEventV1[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RevisionCandidatesDocumentV1 {
  readonly schemaVersion: typeof REVISION_CANDIDATE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly candidates: readonly RevisionCandidateV1[];
}

export interface RevisionCandidatesSnapshotV1 {
  readonly availability: 'ready' | 'degraded';
  readonly document: RevisionCandidatesDocumentV1;
  readonly message: string | null;
}

export interface RevisionCandidateProjectBinding {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly unitId?: string;
}

export interface ListRevisionCandidatesRequest extends RevisionCandidateProjectBinding {}

export interface CreateManualRevisionCandidateRequest extends RevisionCandidateProjectBinding {
  readonly expectedRevision: number;
  readonly sourceSnapshot: RevisionCandidateSourceSnapshotV1;
  readonly sourceAnchor?: RevisionCandidateSourceAnchorV1 | null;
  readonly purpose: string;
  readonly protection: RevisionCandidateProtectionV1;
  readonly warnings?: readonly string[];
  readonly candidateText: string;
}

export interface CreateLocalAiRevisionCandidateRequest extends RevisionCandidateProjectBinding {
  readonly expectedRevision: number;
  readonly inference: Program7LocalInferenceRequestV1;
  readonly sourceAnchor?: RevisionCandidateSourceAnchorV1 | null;
}

export interface EditRevisionCandidateRequest extends RevisionCandidateProjectBinding {
  readonly expectedRevision: number;
  readonly candidateId: string;
  readonly editedCandidateText: string;
}

export interface SetRevisionCandidateLifecycleRequest extends RevisionCandidateProjectBinding {
  readonly expectedRevision: number;
  readonly candidateId: string;
  readonly lifecycle: RevisionCandidateLifecycle;
  readonly note?: string;
}

/** Main-process-only receipt proving that Narrative Insertion already saved the manuscript. */
export interface RevisionCandidateAcceptanceReceiptV1 {
  readonly sourceBodySha256: string;
  readonly candidateTextSha256: string;
  readonly savedBodySha256: string;
  readonly savedAt: string;
}

/** Deliberately has no renderer bridge method; used only after durable insertion succeeds. */
export interface RevisionCandidateAcceptanceFinalizationRequestV1 {
  readonly expectedRevision: number;
  readonly candidateId: string;
  readonly lifecycle: 'accepted' | 'partially accepted';
  readonly receipt: RevisionCandidateAcceptanceReceiptV1;
  readonly note?: string;
}

export type RevisionCandidateErrorCode =
  | 'NOT_AUTHORIZED'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'INVALID_REQUEST'
  | 'CANDIDATES_UNAVAILABLE'
  | 'CANDIDATE_WRITE_FAILED'
  | 'STALE_CANDIDATES'
  | 'UNKNOWN_CANDIDATE'
  | 'LOCAL_AI_UNAVAILABLE'
  | 'PROTECTED_SOURCE';

export interface RevisionCandidateError {
  readonly code: RevisionCandidateErrorCode;
  readonly message: string;
}

export type RevisionCandidateResult =
  | { readonly ok: true; readonly data: RevisionCandidatesSnapshotV1 }
  | { readonly ok: false; readonly error: RevisionCandidateError };

export interface RevisionCandidatesBridge {
  list(request: ListRevisionCandidatesRequest): Promise<RevisionCandidateResult>;
  createManual(request: CreateManualRevisionCandidateRequest): Promise<RevisionCandidateResult>;
  createLocalAi(request: CreateLocalAiRevisionCandidateRequest): Promise<RevisionCandidateResult>;
  edit(request: EditRevisionCandidateRequest): Promise<RevisionCandidateResult>;
  setLifecycle(request: SetRevisionCandidateLifecycleRequest): Promise<RevisionCandidateResult>;
}
