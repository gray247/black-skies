export const MANUSCRIPT_STRUCTURE_CHANNELS = {
  chooseMarkdown: 'manuscript-structure:choose-markdown',
  importMarkdown: 'manuscript-structure:import-markdown',
  get: 'manuscript-structure:get',
  discover: 'manuscript-structure:discover',
  setBoundary: 'manuscript-structure:set-boundary',
  acceptProposal: 'manuscript-structure:accept-proposal',
  rejectProposal: 'manuscript-structure:reject-proposal',
  renameProposal: 'manuscript-structure:rename-proposal',
  splitGroup: 'manuscript-structure:split-group',
  mergeGroups: 'manuscript-structure:merge-groups',
  reorderGroups: 'manuscript-structure:reorder-groups',
  apply: 'manuscript-structure:apply',
} as const;

export const MANUSCRIPT_STRUCTURE_SCHEMA_VERSION = 'BlackSkiesManuscriptStructure v1' as const;
export const MANUSCRIPT_STRUCTURE_ANCHOR_SCHEMA_VERSION = 1 as const;
export const MANUSCRIPT_STRUCTURE_MAX_LABEL_LENGTH = 240;

export type ManuscriptStructureBlockKind = 'heading' | 'separator' | 'paragraph' | 'manual' | 'fallback';
export type ManuscriptStructureProposalState = 'proposed' | 'accepted' | 'rejected' | 'stale';
export type ManuscriptStructureProposalProvenance = 'heading' | 'separator' | 'paragraph' | 'manual' | 'fallback' | 'merged' | 'split';
export type ManuscriptStructureSourceStatus = 'current' | 'changed' | 'changed-after-apply';

export interface ManuscriptStructureAnchorV1 {
  readonly schemaVersion: typeof MANUSCRIPT_STRUCTURE_ANCHOR_SCHEMA_VERSION;
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

export interface ManuscriptStructureBlockV1 {
  readonly id: string;
  readonly kind: ManuscriptStructureBlockKind;
  readonly label: string;
  readonly order: number;
  readonly anchor: ManuscriptStructureAnchorV1;
}

export interface ManuscriptStructureProposalV1 {
  readonly id: string;
  readonly label: string;
  readonly state: ManuscriptStructureProposalState;
  readonly provenance: ManuscriptStructureProposalProvenance;
  readonly blockIds: readonly string[];
  readonly anchor: ManuscriptStructureAnchorV1;
  readonly appliedUnitId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ManuscriptStructureSourceV1 {
  readonly fileName: string;
  readonly sourceFingerprint: string;
  readonly normalizedLength: number;
  readonly lineEnding: 'lf';
}

export interface ManuscriptStructureDocumentV1 {
  readonly schemaVersion: typeof MANUSCRIPT_STRUCTURE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly source: ManuscriptStructureSourceV1;
  readonly blocks: readonly ManuscriptStructureBlockV1[];
  readonly proposals: readonly ManuscriptStructureProposalV1[];
}

export interface ManuscriptStructureSnapshotV1 {
  readonly availability: 'ready' | 'degraded';
  readonly sourceStatus: ManuscriptStructureSourceStatus;
  readonly projectId: string;
  readonly projectPath: string;
  readonly sourceText: string;
  readonly document: ManuscriptStructureDocumentV1;
  readonly message: string | null;
}

export interface ManuscriptStructureProjectBinding {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}

export interface ChooseMarkdownResult {
  readonly canceled: boolean;
  readonly filePath?: string;
}

export interface ImportMarkdownRequest extends ManuscriptStructureProjectBinding {
  readonly parentPath: string;
  readonly filePath: string;
  readonly title?: string;
}

export interface GetManuscriptStructureRequest extends ManuscriptStructureProjectBinding {}

export interface DiscoverManuscriptStructureRequest extends ManuscriptStructureProjectBinding {
  readonly expectedRevision: number;
}

export interface SetManuscriptStructureBoundaryRequest extends ManuscriptStructureProjectBinding {
  readonly expectedRevision: number;
  readonly start: number;
  readonly end: number;
  readonly label: string;
}

export interface ProposalMutationRequest extends ManuscriptStructureProjectBinding {
  readonly expectedRevision: number;
  readonly proposalId: string;
}

export interface RenameManuscriptStructureProposalRequest extends ProposalMutationRequest {
  readonly label: string;
}

export interface SplitManuscriptStructureGroupRequest extends ProposalMutationRequest {
  readonly boundary: number;
}

export interface MergeManuscriptStructureGroupsRequest extends ManuscriptStructureProjectBinding {
  readonly expectedRevision: number;
  readonly proposalIds: readonly string[];
}

export interface ReorderManuscriptStructureGroupsRequest extends ManuscriptStructureProjectBinding {
  readonly expectedRevision: number;
  readonly orderedProposalIds: readonly string[];
}

export interface ApplyManuscriptStructureRequest extends ManuscriptStructureProjectBinding {
  readonly expectedRevision: number;
}

export interface ManuscriptStructureSuccess {
  readonly ok: true;
  readonly data: ManuscriptStructureSnapshotV1;
}

export interface ManuscriptStructureFailure {
  readonly ok: false;
  readonly error: {
    readonly code: ManuscriptStructureErrorCode;
    readonly message: string;
  };
}

export type ManuscriptStructureResult = ManuscriptStructureSuccess | ManuscriptStructureFailure;

export type ManuscriptStructureErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'PROJECT_MISMATCH'
  | 'STALE_SESSION'
  | 'STALE_STRUCTURE'
  | 'SOURCE_NOT_FOUND'
  | 'SOURCE_CHANGED'
  | 'SOURCE_CHANGED_AFTER_APPLY'
  | 'OVERLAPPING_ACCEPTED_RANGES'
  | 'UNKNOWN_PROPOSAL'
  | 'APPLIED_PROPOSAL'
  | 'INVALID_BOUNDARY'
  | 'INVALID_STRUCTURE'
  | 'STRUCTURE_UNAVAILABLE'
  | 'STRUCTURE_WRITE_FAILED'
  | 'APPLY_FAILED';

export interface ManuscriptStructureBridge {
  chooseMarkdown(): Promise<ChooseMarkdownResult>;
  importMarkdown(request: ImportMarkdownRequest): Promise<ManuscriptStructureResult>;
  get(request: GetManuscriptStructureRequest): Promise<ManuscriptStructureResult>;
  discover(request: DiscoverManuscriptStructureRequest): Promise<ManuscriptStructureResult>;
  setBoundary(request: SetManuscriptStructureBoundaryRequest): Promise<ManuscriptStructureResult>;
  acceptProposal(request: ProposalMutationRequest): Promise<ManuscriptStructureResult>;
  rejectProposal(request: ProposalMutationRequest): Promise<ManuscriptStructureResult>;
  renameProposal(request: RenameManuscriptStructureProposalRequest): Promise<ManuscriptStructureResult>;
  splitGroup(request: SplitManuscriptStructureGroupRequest): Promise<ManuscriptStructureResult>;
  mergeGroups(request: MergeManuscriptStructureGroupsRequest): Promise<ManuscriptStructureResult>;
  reorderGroups(request: ReorderManuscriptStructureGroupsRequest): Promise<ManuscriptStructureResult>;
  apply(request: ApplyManuscriptStructureRequest): Promise<ManuscriptStructureResult>;
}
