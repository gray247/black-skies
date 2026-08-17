export const LIVING_OUTLINE_CHANNELS = {
  get: 'living-outline:get',
  createItem: 'living-outline:create-item',
  updateItem: 'living-outline:update-item',
  moveItem: 'living-outline:move-item',
  linkItem: 'living-outline:link-item',
  deleteItem: 'living-outline:delete-item',
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
  readonly id: string;
  readonly label: string;
  /** Author-entered planning note body. It is advisory and never manuscript prose. */
  readonly body?: string;
  readonly kind: LivingOutlineItemKind;
  readonly state: LivingOutlineItemState;
  readonly manuscriptUnitId: string | null;
  readonly sourceAnchor?: LivingOutlineSourceAnchorV1 | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface LivingOutlineDocumentV1 {
  readonly schemaVersion: typeof LIVING_OUTLINE_SCHEMA_VERSION;
  readonly projectId: string;
  readonly revision: number;
  readonly items: readonly LivingOutlineItemV1[];
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

export interface GetLivingOutlineRequest extends LivingOutlineProjectBinding {}

export interface CreateLivingOutlineItemRequest extends LivingOutlineProjectBinding {
  readonly expectedRevision: number;
  readonly label: string;
  readonly body?: string;
  readonly kind: LivingOutlineItemKind;
  readonly state: LivingOutlineItemState;
  readonly manuscriptUnitId: string | null;
  readonly sourceAnchor?: LivingOutlineSourceAnchorV1 | null;
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
  get(request: GetLivingOutlineRequest): Promise<LivingOutlineResult>;
  createItem(request: CreateLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  updateItem(request: UpdateLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  moveItem(request: MoveLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  linkItem(request: LinkLivingOutlineItemRequest): Promise<LivingOutlineResult>;
  deleteItem(request: DeleteLivingOutlineItemRequest): Promise<LivingOutlineResult>;
}
