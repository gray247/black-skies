export const CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION = 1 as const;
export const CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION = 1 as const;

export const CRITIQUE_REVIEW_CHANNELS = {
  requestState: 'critique-review:state:request',
  stateChanged: 'critique-review:state:changed',
  markStale: 'critique-review:mark-stale',
  dismiss: 'critique-review:dismiss',
  saveFeedbackNote: 'critique-review:save-feedback-note',
  returnToSource: 'critique-review:return-to-source',
  sourceReturnRequested: 'critique-review:source-return-requested',
} as const;

export type LogicalSurfaceV1 = 'writing' | 'command';

export type WritingWorkspaceV1 = 'manuscript';

export type CommandWorkspaceV1 =
  | 'review'
  | 'structure'
  | 'story-knowledge'
  | 'create-develop'
  | 'project-interchange'
  | 'operations-approvals';

export type SurfaceWorkspaceV1 = WritingWorkspaceV1 | CommandWorkspaceV1;

export type PhysicalSurfacePlacementV1 =
  | 'current-window'
  | 'secondary-window'
  | 'restored-active-display';

export type SurfaceFocusReturnTargetV1 =
  | 'manuscript-selection'
  | 'manuscript-caret'
  | 'living-outline';

/**
 * Navigation evidence only. This deliberately carries no prose and owns no
 * durable project or manuscript truth.
 */
export interface SourceReturnAnchorV1 {
  readonly schemaVersion: typeof CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly unitId: string;
  readonly editorRevision: number;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectionFingerprint: string;
}

interface SurfaceContextBaseV1 {
  readonly schemaVersion: typeof CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly physicalPlacement: PhysicalSurfacePlacementV1;
  readonly sourceReturnAnchor?: SourceReturnAnchorV1;
  readonly focusReturnTarget?: SurfaceFocusReturnTargetV1;
}

export interface WritingSurfaceContextV1 extends SurfaceContextBaseV1 {
  readonly logicalSurface: 'writing';
  readonly workspace: WritingWorkspaceV1;
}

export interface CommandSurfaceContextV1 extends SurfaceContextBaseV1 {
  readonly logicalSurface: 'command';
  readonly workspace: CommandWorkspaceV1;
}

export type SurfaceContextV1 = WritingSurfaceContextV1 | CommandSurfaceContextV1;

export type CritiqueReviewLifecycleStateV1 =
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'invalidated';

export type CritiqueReviewFailureClassV1 =
  | 'provider-unavailable'
  | 'provider-rejected'
  | 'request-cancelled'
  | 'request-expired'
  | 'source-changed'
  | 'unknown';

export type CritiqueReviewAllowedActionV1 =
  | 'copy-result'
  | 'save-feedback-note'
  | 'dismiss'
  | 'return-to-source';

export const COMPLETED_CRITIQUE_REVIEW_ACTIONS = [
  'copy-result',
  'save-feedback-note',
  'dismiss',
  'return-to-source',
] as const satisfies readonly CritiqueReviewAllowedActionV1[];

export const TERMINAL_CRITIQUE_REVIEW_ACTIONS = [
  'dismiss',
  'return-to-source',
] as const satisfies readonly CritiqueReviewAllowedActionV1[];

/**
 * Sanitized, presentation-only Review data. It cannot mutate manuscript,
 * outline, accepted truth, routing policy, or provider state.
 */
export interface CritiqueReviewProjectionV1 {
  readonly schemaVersion: typeof CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly requestId: string;
  readonly unitId: string;
  readonly selectionFingerprint: string;
  readonly sourceLabel: string;
  readonly selectedCharacterCount: number;
  readonly lifecycleState: CritiqueReviewLifecycleStateV1;
  readonly advisoryLabel: string;
  readonly providerDisclosure: string;
  readonly modelDisclosure: string;
  readonly privacyAndCostDisclosure: string;
  readonly resultText?: string;
  readonly limitationText: string;
  readonly failureClass?: CritiqueReviewFailureClassV1;
  readonly completedAt?: string;
  readonly allowedActions: readonly CritiqueReviewAllowedActionV1[];
}

/**
 * The only Feedback Note request the Command surface may originate. The
 * Writing owner must validate every binding before it invokes persistence.
 */
export interface SaveCritiqueReviewFeedbackNoteActionV1 {
  readonly schemaVersion: typeof CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION;
  readonly operationId: string;
  readonly projectId: string;
  readonly generation: number;
  readonly unitId: string;
  readonly sourceCritiqueRequestId: string;
  readonly selectionFingerprint: string;
  readonly visibleResultFingerprint: string;
  readonly body: string;
}

export interface CritiqueReviewReferenceV1 {
  readonly schemaVersion: typeof CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION;
  readonly operationId: string;
  readonly projectId: string;
  readonly generation: number;
  readonly requestId: string;
  readonly selectionFingerprint: string;
}

export type CritiqueReviewSurfaceAvailabilityV1 =
  | 'empty'
  | 'available'
  | 'dismissed'
  | 'unavailable';

/**
 * Main-authored presentation state. A dismissed state deliberately retains
 * only its binding; the Writing owner remains untouched and no result text is
 * durable here.
 */
export interface CritiqueReviewSurfaceStateV1 {
  readonly schemaVersion: typeof CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION;
  readonly projectId: string | null;
  readonly generation: number;
  readonly availability: CritiqueReviewSurfaceAvailabilityV1;
  readonly projection?: CritiqueReviewProjectionV1;
  readonly sourceReturnAnchor?: SourceReturnAnchorV1;
  readonly dismissedRequestId?: string;
  readonly message?: string;
}

export type CritiqueReviewActionErrorCodeV1 =
  | 'INVALID_REQUEST'
  | 'WRONG_WINDOW_ROLE'
  | 'STALE_PROJECT'
  | 'STALE_GENERATION'
  | 'REVIEW_UNAVAILABLE'
  | 'SOURCE_STALE'
  | 'NOTE_WRITE_FAILED';

export interface CritiqueReviewActionErrorV1 {
  readonly code: CritiqueReviewActionErrorCodeV1;
  readonly message: string;
}

export type CritiqueReviewActionResultV1<T = Record<string, never>> =
  | {
      readonly ok: true;
      readonly data: T;
      readonly state: CritiqueReviewSurfaceStateV1;
    }
  | {
      readonly ok: false;
      readonly error: CritiqueReviewActionErrorV1;
      readonly state: CritiqueReviewSurfaceStateV1;
    };

export interface CritiqueReviewSourceReturnMessageV1 {
  readonly schemaVersion: typeof CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly requestId: string;
  readonly status: 'exact' | 'stale';
  readonly message: string;
  readonly anchor?: SourceReturnAnchorV1;
}

export interface CritiqueReviewBridge {
  requestState(): Promise<CritiqueReviewSurfaceStateV1>;
  readState(): CritiqueReviewSurfaceStateV1 | null;
  subscribeState(
    listener: (state: CritiqueReviewSurfaceStateV1) => void,
  ): () => void;
  markStale(
    request: CritiqueReviewReferenceV1,
  ): Promise<CritiqueReviewActionResultV1>;
  dismiss(
    request: CritiqueReviewReferenceV1,
  ): Promise<CritiqueReviewActionResultV1>;
  saveFeedbackNote(
    request: SaveCritiqueReviewFeedbackNoteActionV1,
  ): Promise<CritiqueReviewActionResultV1<{ readonly noteId: string }>>;
  returnToSource(
    request: CritiqueReviewReferenceV1,
  ): Promise<CritiqueReviewActionResultV1<{ readonly status: 'exact' | 'stale' }>>;
  subscribeSourceReturn(
    listener: (message: CritiqueReviewSourceReturnMessageV1) => void,
  ): () => void;
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeSourceReturnAnchor(value: unknown): SourceReturnAnchorV1 | null {
  const anchor = recordValue(value);
  if (
    !anchor ||
    !hasOnlyKeys(anchor, [
      'schemaVersion',
      'projectId',
      'generation',
      'unitId',
      'editorRevision',
      'selectionStart',
      'selectionEnd',
      'selectionFingerprint',
    ]) ||
    anchor.schemaVersion !== CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION ||
    !nonEmptyString(anchor.projectId) ||
    !Number.isInteger(anchor.generation) || Number(anchor.generation) < 0 ||
    !nonEmptyString(anchor.unitId) ||
    !Number.isInteger(anchor.editorRevision) || Number(anchor.editorRevision) < 0 ||
    !Number.isInteger(anchor.selectionStart) || Number(anchor.selectionStart) < 0 ||
    !Number.isInteger(anchor.selectionEnd) || Number(anchor.selectionEnd) <= Number(anchor.selectionStart) ||
    !nonEmptyString(anchor.selectionFingerprint)
  ) return null;
  return anchor as unknown as SourceReturnAnchorV1;
}

function normalizeCritiqueReviewProjection(value: unknown): CritiqueReviewProjectionV1 | null {
  const projection = recordValue(value);
  const allowedActions = Array.isArray(projection?.allowedActions)
    ? projection.allowedActions
    : null;
  const validActions = new Set<CritiqueReviewAllowedActionV1>([
    'copy-result',
    'save-feedback-note',
    'dismiss',
    'return-to-source',
  ]);
  if (
    !projection ||
    !hasOnlyKeys(projection, [
      'schemaVersion',
      'projectId',
      'generation',
      'requestId',
      'unitId',
      'selectionFingerprint',
      'sourceLabel',
      'selectedCharacterCount',
      'lifecycleState',
      'advisoryLabel',
      'providerDisclosure',
      'modelDisclosure',
      'privacyAndCostDisclosure',
      'resultText',
      'limitationText',
      'failureClass',
      'completedAt',
      'allowedActions',
    ]) ||
    projection.schemaVersion !== CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION ||
    !nonEmptyString(projection.projectId) ||
    !Number.isInteger(projection.generation) || Number(projection.generation) < 0 ||
    !nonEmptyString(projection.requestId) ||
    !nonEmptyString(projection.unitId) ||
    !nonEmptyString(projection.selectionFingerprint) ||
    !nonEmptyString(projection.sourceLabel) ||
    !Number.isInteger(projection.selectedCharacterCount) || Number(projection.selectedCharacterCount) < 0 ||
    !['completed', 'failed', 'cancelled', 'expired', 'invalidated'].includes(String(projection.lifecycleState)) ||
    !nonEmptyString(projection.advisoryLabel) ||
    !nonEmptyString(projection.providerDisclosure) ||
    !nonEmptyString(projection.modelDisclosure) ||
    !nonEmptyString(projection.privacyAndCostDisclosure) ||
    (projection.resultText !== undefined && typeof projection.resultText !== 'string') ||
    !nonEmptyString(projection.limitationText) ||
    (projection.failureClass !== undefined && ![
      'provider-unavailable',
      'provider-rejected',
      'request-cancelled',
      'request-expired',
      'source-changed',
      'unknown',
    ].includes(String(projection.failureClass))) ||
    (projection.completedAt !== undefined && !nonEmptyString(projection.completedAt)) ||
    !allowedActions ||
    !allowedActions.every((action) => validActions.has(action as CritiqueReviewAllowedActionV1))
  ) return null;
  const lifecycleState = String(projection.lifecycleState) as CritiqueReviewLifecycleStateV1;
  const expectedActions = lifecycleState === 'completed'
    ? COMPLETED_CRITIQUE_REVIEW_ACTIONS
    : TERMINAL_CRITIQUE_REVIEW_ACTIONS;
  if (
    allowedActions.length !== expectedActions.length ||
    allowedActions.some((action, index) => action !== expectedActions[index]) ||
    (lifecycleState === 'completed' && (
      !nonEmptyString(projection.resultText) ||
      !nonEmptyString(projection.completedAt) ||
      projection.failureClass !== undefined
    )) ||
    (lifecycleState !== 'completed' && (
      projection.resultText !== undefined ||
      projection.completedAt !== undefined ||
      projection.failureClass === undefined
    ))
  ) return null;
  return projection as unknown as CritiqueReviewProjectionV1;
}

/** Strict preload sanitizer for the prose-free Review presentation boundary. */
export function normalizeCritiqueReviewSurfaceState(
  value: unknown,
): CritiqueReviewSurfaceStateV1 | null {
  const state = recordValue(value);
  if (
    !state ||
    !hasOnlyKeys(state, [
      'schemaVersion',
      'projectId',
      'generation',
      'availability',
      'projection',
      'sourceReturnAnchor',
      'dismissedRequestId',
      'message',
    ]) ||
    state.schemaVersion !== CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION ||
    (state.projectId !== null && !nonEmptyString(state.projectId)) ||
    !Number.isInteger(state.generation) || Number(state.generation) < 0 ||
    !['empty', 'available', 'dismissed', 'unavailable'].includes(String(state.availability)) ||
    (state.dismissedRequestId !== undefined && !nonEmptyString(state.dismissedRequestId)) ||
    (state.message !== undefined && !nonEmptyString(state.message))
  ) return null;
  const projection = state.projection === undefined
    ? null
    : normalizeCritiqueReviewProjection(state.projection);
  const sourceReturnAnchor = state.sourceReturnAnchor === undefined
    ? null
    : normalizeSourceReturnAnchor(state.sourceReturnAnchor);
  if (
    (state.projection !== undefined && !projection) ||
    (state.sourceReturnAnchor !== undefined && !sourceReturnAnchor) ||
    (state.availability === 'available' && (!projection || !sourceReturnAnchor)) ||
    (projection && (
      projection.projectId !== state.projectId ||
      projection.generation !== state.generation ||
      sourceReturnAnchor?.projectId !== state.projectId ||
      sourceReturnAnchor?.generation !== state.generation ||
      sourceReturnAnchor?.unitId !== projection.unitId ||
      sourceReturnAnchor?.selectionFingerprint !== projection.selectionFingerprint
    ))
  ) return null;
  return {
    ...state,
    ...(projection ? { projection } : {}),
    ...(sourceReturnAnchor ? { sourceReturnAnchor } : {}),
  } as unknown as CritiqueReviewSurfaceStateV1;
}

export function normalizeCritiqueReviewSourceReturnMessage(
  value: unknown,
): CritiqueReviewSourceReturnMessageV1 | null {
  const message = recordValue(value);
  if (
    !message ||
    !hasOnlyKeys(message, [
      'schemaVersion',
      'projectId',
      'generation',
      'requestId',
      'status',
      'message',
      'anchor',
    ]) ||
    message.schemaVersion !== CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION ||
    !nonEmptyString(message.projectId) ||
    !Number.isInteger(message.generation) || Number(message.generation) < 0 ||
    !nonEmptyString(message.requestId) ||
    (message.status !== 'exact' && message.status !== 'stale') ||
    !nonEmptyString(message.message)
  ) return null;
  const anchor = message.anchor === undefined ? null : normalizeSourceReturnAnchor(message.anchor);
  if (
    (message.anchor !== undefined && !anchor) ||
    (message.status === 'exact' && !anchor) ||
    (anchor && (
      anchor.projectId !== message.projectId ||
      anchor.generation !== message.generation
    ))
  ) return null;
  return { ...message, ...(anchor ? { anchor } : {}) } as unknown as CritiqueReviewSourceReturnMessageV1;
}
