export const CONTEXTUAL_PRODUCT_SHELL_SCHEMA_VERSION = 1 as const;
export const CRITIQUE_REVIEW_PROJECTION_SCHEMA_VERSION = 1 as const;

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
