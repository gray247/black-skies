export const LIVING_OUTLINE_CHANNELS = {
  get: 'living-outline:get',
  createItem: 'living-outline:create-item',
  updateItem: 'living-outline:update-item',
  moveItem: 'living-outline:move-item',
  linkItem: 'living-outline:link-item',
  deleteItem: 'living-outline:delete-item',
  replaceWritingState: 'living-outline:replace-writing-state',
  prepareGap: 'living-outline:prepare-gap',
  finishGap: 'living-outline:finish-gap',
  restoreItem: 'living-outline:restore-item',
} as const;

export const LIVING_OUTLINE_SCHEMA_VERSION = 'BlackSkiesLivingOutline v1' as const;
export const LIVING_OUTLINE_MAX_LABEL_LENGTH = 240;
export const LIVING_OUTLINE_MAX_BODY_LENGTH = 4000;
export const LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION = 1 as const;

export type LivingOutlineItemKind = 'fragment' | 'gap' | 'container';
export type LivingOutlineItemState = 'authored' | 'planned' | 'inferred' | 'proposed';

export interface LivingOutlineSourceAnchorV1 {
  readonly schemaVersion: typeof LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION;
  readonly unitId: string;
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

export interface LivingOutlineItemV1 {
  readonly sourcePromotionId?: string;
  readonly id: string;
  readonly label: string;
  /** Author-entered planning note body. It is advisory and never manuscript prose. */
  readonly body?: string;
  readonly kind: LivingOutlineItemKind;
  readonly state: LivingOutlineItemState;
  readonly manuscriptUnitId: string | null;
  readonly sourceAnchor?: LivingOutlineSourceAnchorV1 | null;
  readonly sourceAnchors?: readonly LivingOutlineSourceAnchorV1[];
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Explicit author scope; absent on legacy records, whose source is inspected. */
  readonly noteScope?: 'whole-story' | 'unattached' | 'passage';
  readonly sourceWasSpan?: boolean;
  readonly completedGapOperationId?: string;
}

/** Only metadata for one interrupted fill/Undo. Prose remains in drafts/recovery. */
export interface GapWritingOperationV1 {
  readonly id: string;
  readonly gapId: string;
  readonly unitId: string;
  readonly direction: 'fill' | 'undo';
  readonly beforeFingerprint: string;
  readonly afterFingerprint: string;
  readonly from: number;
  readonly to: number;
  readonly insertedLength: number;
  readonly groupId: string;
  readonly groups: readonly WritingGroupV1[];
  readonly noteAnchors: ReplaceWritingStateRequest['noteAnchors'];
  readonly target: { readonly kind: 'gap' | 'fragment'; readonly state: LivingOutlineItemState; readonly anchor: LivingOutlineSourceAnchorV1 };
}

export interface PrepareGapRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly pending: GapWritingOperationV1;
  /** Validated in main; never duplicated into outline storage. */
  readonly proposedProse: string;
}
export interface FinishGapRequest extends LivingOutlineProjectBinding { readonly expectedRevision: number; }
export interface RestoreLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly item: LivingOutlineItemV1;
  readonly beforeId: string | null;
}

export interface WritingGroupV1 {
  readonly id: string;
  readonly label: string;
  readonly customLabel?: boolean;
  readonly spans: readonly LivingOutlineSourceAnchorV1[];
}

export interface ReplaceWritingStateRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly groups: readonly WritingGroupV1[];
  readonly noteAnchors: readonly { readonly itemId: string; readonly anchor: LivingOutlineSourceAnchorV1; readonly anchors?: readonly LivingOutlineSourceAnchorV1[]; readonly reconnect?: boolean }[];
}

export interface LivingOutlineDocumentV1 {
  readonly schemaVersion: typeof LIVING_OUTLINE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly items: readonly LivingOutlineItemV1[];
  readonly writingGroups?: readonly WritingGroupV1[];
  readonly pendingGap?: GapWritingOperationV1 | null;
}

export type LivingOutlineAvailability = 'ready' | 'degraded';

export interface LivingOutlineSnapshotV1 {
  readonly availability: LivingOutlineAvailability;
  readonly document: LivingOutlineDocumentV1;
  readonly message: string | null;
}

export type LivingOutlineErrorCode =
  | 'NOT_WRITING_STUDIO'
  | 'NO_ACTIVE_PROJECT'
  | 'STALE_SESSION'
  | 'STALE_OUTLINE'
  | 'UNKNOWN_MANUSCRIPT_UNIT'
  | 'UNKNOWN_OUTLINE_ITEM'
  | 'INVALID_REQUEST'
  | 'LIVING_OUTLINE_UNAVAILABLE'
  | 'LIVING_OUTLINE_WRITE_FAILED';

export interface LivingOutlineError {
  readonly code: LivingOutlineErrorCode;
  readonly message: string;
}

export interface LivingOutlineProjectBinding {
  readonly operationId: string;
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
}

export type GetLivingOutlineRequest = LivingOutlineProjectBinding;

export interface CreateLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly label: string;
  readonly body?: string;
  readonly kind: LivingOutlineItemKind;
  readonly state: LivingOutlineItemState;
  readonly manuscriptUnitId: string | null;
  readonly sourceAnchor?: LivingOutlineSourceAnchorV1 | null;
  readonly sourceAnchors?: readonly LivingOutlineSourceAnchorV1[];
  readonly noteScope?: LivingOutlineItemV1['noteScope'];
  readonly sourceWasSpan?: boolean;
}

export interface UpdateLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly itemId: string;
  readonly label: string;
  readonly body?: string;
  readonly kind: LivingOutlineItemKind;
  readonly state: LivingOutlineItemState;
}

export interface MoveLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly itemId: string;
  readonly direction: -1 | 1;
}

export interface LinkLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly itemId: string;
  readonly manuscriptUnitId: string | null;
}

export interface DeleteLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly itemId: string;
}

export interface LivingOutlineSuccess {
  readonly ok: true;
  readonly data: LivingOutlineSnapshotV1;
}

export interface LivingOutlineFailure {
  readonly ok: false;
  readonly error: LivingOutlineError;
}

export type LivingOutlineResult = LivingOutlineSuccess | LivingOutlineFailure;

export interface LivingOutlineBridge {
  prepareGap?(request: PrepareGapRequest): Promise<LivingOutlineResult>;
  finishGap?(request: FinishGapRequest): Promise<LivingOutlineResult>;
  restoreItem?(request: RestoreLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  replaceWritingState?(request: ReplaceWritingStateRequest): Promise<LivingOutlineResult>;
  get(request: GetLivingOutlineRequest): Promise<LivingOutlineResult>;
  createItem(request: CreateLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  updateItem(request: UpdateLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  moveItem(request: MoveLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  linkItem(request: LinkLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  deleteItem(request: DeleteLivingOutlineItemRequest): Promise<LivingOutlineResult>;
}
