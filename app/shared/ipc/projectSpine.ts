export const PROJECT_SPINE_CHANNELS = {
  chooseDirectory: 'project-spine:choose-directory',
  focusWritingWindow: 'project-spine:focus-writing-window',
  openProject: 'project-spine:open-project',
  reloadActiveProject: 'project-spine:reload-active-project',
  createProject: 'project-spine:create-project',
  getSession: 'project-spine:get-session',
  removeRecent: 'project-spine:remove-recent',
  selectUnit: 'project-spine:select-unit',
  setUnitDirty: 'project-spine:set-unit-dirty',
  captureRecoveryCheckpoint: 'project-spine:capture-recovery-checkpoint',
  acceptRecoveryCandidate: 'project-spine:accept-recovery-candidate',
  rejectRecoveryCandidate: 'project-spine:reject-recovery-candidate',
  saveUnit: 'project-spine:save-unit',
  createUnit: 'project-spine:create-unit',
  renameUnit: 'project-spine:rename-unit',
  reorderUnits: 'project-spine:reorder-units',
  deleteUnit: 'project-spine:delete-unit',
  exportMarkdown: 'project-spine:export-markdown',
  sessionChanged: 'project-spine:session-changed',
  closeConfirmationRequest: 'project-spine:close-confirmation-request',
  closeConfirmationResponse: 'project-spine:close-confirmation-response',
} as const;

export type ProjectSpineWindowRole = 'writing' | 'command';

export type ProjectSpineCloseConfirmationDecision = 'keep-editing' | 'discard';

/** Main process → Writing Studio. */
export interface ProjectSpineCloseConfirmationRequest {
  readonly correlationId: string;
  readonly projectId: string;
  readonly generation: number;
}

/** Writing Studio → main process. */
export interface ProjectSpineCloseConfirmationResponse
  extends ProjectSpineCloseConfirmationRequest {
  readonly decision: ProjectSpineCloseConfirmationDecision;
}

export interface ProjectSpineUnitSummary {
  readonly id: string;
  readonly title: string;
  readonly displayTitle: string;
  readonly order: number;
}

/** Prose-free structural measurements safe to project to Command Center. */
export interface ProjectSpineUnitMetrics {
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly paragraphCount: number;
  readonly dialogueRatio: number;
  /** SHA-256 of the normalized manuscript body; omitted by legacy snapshots. */
  readonly sourceFingerprint?: string;
}

export interface ProjectSpineProjectContext {
  readonly projectId: string;
  readonly path: string;
  readonly title: string;
  readonly schemaVersion: 'ProjectMetadataSchema v1';
  readonly units: readonly ProjectSpineUnitSummary[];
  /** Deterministic measurements only. Never contains manuscript excerpts. */
  readonly unitMetrics?: Readonly<Record<string, ProjectSpineUnitMetrics>>;
  /** Present only in the Writing Studio projection. */
  readonly drafts?: Readonly<Record<string, string>>;
}

export interface RecentProjectReference {
  readonly path: string;
  readonly title: string;
  readonly lastOpened: number;
  readonly stale: boolean;
}

export type ProjectSpineSaveStatus =
  | 'clean'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'save-failed';

export interface ProjectSpineSaveState {
  readonly status: ProjectSpineSaveStatus;
  readonly unitId: string | null;
  readonly message: string | null;
}

export type ProjectSpineCommandLifecycleStatus =
  | 'no-active-project'
  | 'active'
  | 'operation-failed';

export type ProjectSpineCommandRecoveryStatus =
  | 'none'
  | 'decision-required'
  | 'accepted-pending-save'
  | 'degraded';

export type ProjectSpineCommandSaveStatus =
  | ProjectSpineSaveStatus
  | 'accepted-recovery-pending-save';

/** Prose-free, main-authored status projected only to Command Center. */
export interface ProjectSpineCommandStatusProjection {
  readonly schemaVersion: 1;
  readonly projectId: string | null;
  readonly generation: number;
  readonly revision: number;
  readonly lifecycle: ProjectSpineCommandLifecycleStatus;
  readonly recovery: ProjectSpineCommandRecoveryStatus;
  readonly save: ProjectSpineCommandSaveStatus;
}

export interface ProjectSpineSessionSnapshot {
  readonly schemaVersion: 1;
  readonly role: ProjectSpineWindowRole;
  readonly generation: number;
  readonly revision: number;
  readonly project: ProjectSpineProjectContext | null;
  readonly activeUnitId: string | null;
  readonly recentProjects: readonly RecentProjectReference[];
  readonly dirtyUnitIds: readonly string[];
  readonly saveState: ProjectSpineSaveState;
  readonly lastError: ProjectSpineError | null;
  /** Present only in the Command Center projection. */
  readonly commandStatus?: ProjectSpineCommandStatusProjection;
  /** Present only in the Writing Studio projection. */
  readonly recovery?: ProjectSpineWritingRecoveryState;
}

export type ProjectSpineRecoveryDegradedReason =
  | 'read-failed'
  | 'corrupt-artifact'
  | 'unsupported-schema'
  | 'project-mismatch'
  | 'path-mismatch'
  | 'unknown-unit'
  | 'baseline-mismatch'
  | 'stale-candidate'
  | 'active-session-candidate';

export interface ProjectSpineRecoveryCandidateProjection {
  readonly projectId: string;
  readonly projectPath: string;
  readonly unitId: string;
  readonly unitTitle: string;
  readonly unitOrder: number;
  readonly originSessionId: string;
  readonly priorSessionGeneration: number;
  readonly priorSessionRevision: number;
  readonly durableBaselineFingerprint: string;
  readonly candidateVersion: number;
  readonly updatedAt: string;
  readonly prose: string;
  readonly decision: 'available' | 'accept-selected' | 'accepted-pending-save';
}

export type ProjectSpineWritingRecoveryState =
  | { readonly status: 'none'; readonly candidates: readonly [] }
  | {
      readonly status: 'decision-required';
      readonly candidates: readonly ProjectSpineRecoveryCandidateProjection[];
    }
  | {
      readonly status: 'accepted-pending-save';
      readonly candidates: readonly ProjectSpineRecoveryCandidateProjection[];
    }
  | {
      readonly status: 'degraded';
      readonly reason: ProjectSpineRecoveryDegradedReason;
      readonly message: string;
      readonly candidates: readonly [];
    };

export type ProjectSpineErrorCode =
  | 'INVALID_REQUEST'
  | 'WRONG_WINDOW_ROLE'
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_INVALID'
  | 'PROJECT_UNSUPPORTED_VERSION'
  | 'PROJECT_ID_MISMATCH'
  | 'DUPLICATE_PROJECT_IDENTITY'
  | 'PROJECT_IDENTITY_CHANGED'
  | 'PROJECT_ALREADY_ACTIVE'
  | 'UNSAVED_CHANGES'
  | 'SAVE_IN_PROGRESS'
  | 'STALE_SESSION'
  | 'STALE_DRAFT'
  | 'UNIT_NOT_FOUND'
  | 'UNIT_INVALID'
  | 'UNIT_NOT_EMPTY'
  | 'RECOVERY_UNAVAILABLE'
  | 'RECOVERY_WRITE_FAILED'
  | 'RECOVERY_CLEANUP_FAILED'
  | 'SAVE_FAILED'
  | 'STRUCTURE_WRITE_FAILED'
  | 'EXPORT_BLOCKED'
  | 'EXPORT_DESTINATION_INVALID'
  | 'EXPORT_FAILED'
  | 'UNKNOWN';

export interface ProjectSpineError {
  readonly code: ProjectSpineErrorCode;
  readonly message: string;
}

export interface ProjectSpineSuccess<T = Record<string, never>> {
  readonly ok: true;
  readonly data: T;
  readonly snapshot: ProjectSpineSessionSnapshot;
}

export interface ProjectSpineFailure {
  readonly ok: false;
  readonly error: ProjectSpineError;
  readonly snapshot: ProjectSpineSessionSnapshot;
}

export type ProjectSpineResult<T = Record<string, never>> =
  | ProjectSpineSuccess<T>
  | ProjectSpineFailure;

export interface ProjectSpineBinding {
  readonly projectId: string;
  readonly projectPath: string;
  readonly generation: number;
  readonly operationId: string;
}

export interface OpenProjectRequest {
  readonly path: string;
  readonly operationId: string;
  readonly discardUnsaved?: boolean;
}

export type ReloadActiveProjectRequest = ProjectSpineBinding;

export interface CreateProjectRequest {
  readonly parentPath: string;
  readonly title: string;
  readonly operationId: string;
  readonly discardUnsaved?: boolean;
}

export interface RemoveRecentProjectRequest {
  readonly path: string;
  readonly operationId: string;
}

export interface SelectManuscriptUnitRequest extends ProjectSpineBinding {
  readonly unitId: string | null;
}

export interface SetManuscriptUnitDirtyRequest extends ProjectSpineBinding {
  readonly unitId: string;
  readonly dirty: boolean;
}

export interface CaptureRecoveryCheckpointRequest extends ProjectSpineBinding {
  readonly unitId: string;
  readonly prose: string;
}

export interface RecoveryCheckpointResultData {
  readonly status: 'stored' | 'cleared';
  readonly candidateVersion: number | null;
}

export interface RecoveryCandidateDecisionRequest extends ProjectSpineBinding {
  readonly unitId: string;
  readonly originSessionId: string;
  readonly candidateVersion: number;
  readonly durableBaselineFingerprint: string;
}

export interface RecoveryCandidateDecisionResultData {
  readonly decision: 'accepted' | 'rejected';
  readonly resolution:
    | 'decisions-remaining'
    | 'accepted-ready-to-apply'
    | 'resolved-without-recovery';
  readonly unitId: string;
  readonly remainingDecisionCount: number;
}

export interface SaveManuscriptUnitResultData {
  readonly recovery: {
    readonly status: 'retired' | 'rebased' | 'not-present' | 'degraded';
    readonly message: string | null;
  };
}

export interface SaveManuscriptUnitRequest extends ProjectSpineBinding {
  readonly unitId: string;
  readonly expectedMarkdown: string;
  readonly markdown: string;
  readonly submittedProse: string;
}

export interface CreateManuscriptUnitRequest extends ProjectSpineBinding {
  readonly title: string;
}

export interface RenameManuscriptUnitRequest extends ProjectSpineBinding {
  readonly unitId: string;
  readonly title: string;
}

export interface ReorderManuscriptUnitsRequest extends ProjectSpineBinding {
  readonly orderedUnitIds: readonly string[];
}

export interface DeleteManuscriptUnitRequest extends ProjectSpineBinding {
  readonly unitId: string;
  readonly confirmNonEmpty: boolean;
}

export interface ExportMarkdownRequest extends ProjectSpineBinding {
  readonly revision: number;
}

export interface ExportMarkdownCancelledResultData {
  readonly status: 'cancelled';
  readonly projectId: string;
  readonly generation: number;
  readonly revision: number;
  readonly operationId: string;
}

export interface ExportMarkdownCompletedResultData {
  readonly status: 'completed';
  readonly projectId: string;
  readonly generation: number;
  readonly revision: number;
  readonly operationId: string;
  readonly destinationPath: string;
  readonly byteLength: number;
  readonly unitCount: number;
  readonly sha256: string;
  readonly orderedUnitIds: readonly string[];
  readonly sourceSnapshotFingerprint: string;
  readonly completedAt: string;
}

export type ExportMarkdownResultData =
  | ExportMarkdownCancelledResultData
  | ExportMarkdownCompletedResultData;

export interface ProjectSpineBridge {
  readonly windowRole: ProjectSpineWindowRole;
  /** Writing Studio only. Re-activates the owning Electron window after a native dialog closes. */
  focusWritingWindow?(): Promise<ProjectSpineResult>;
  chooseDirectory(): Promise<{ canceled: boolean; path?: string }>;
  openProject(request: OpenProjectRequest): Promise<ProjectSpineResult<{ activation: 'activated' | 'already-active' }>>;
  /** Writing Studio only. Reloads the active project after a durable cross-file mutation. */
  reloadActiveProject?(request: ReloadActiveProjectRequest): Promise<ProjectSpineResult<{ activation: 'reloaded' }>>;
  createProject(request: CreateProjectRequest): Promise<ProjectSpineResult<{ activation: 'activated' }>>;
  getSession(): Promise<ProjectSpineSessionSnapshot>;
  removeRecent(request: RemoveRecentProjectRequest): Promise<ProjectSpineResult>;
  selectUnit(request: SelectManuscriptUnitRequest): Promise<ProjectSpineResult>;
  subscribeSession(listener: (snapshot: ProjectSpineSessionSnapshot) => void): () => void;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  onCloseConfirmationRequest?(
    listener: (request: ProjectSpineCloseConfirmationRequest) => void,
  ): () => void;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  respondToCloseConfirmation?(
    response: ProjectSpineCloseConfirmationResponse,
  ): Promise<ProjectSpineResult>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  setUnitDirty?(request: SetManuscriptUnitDirtyRequest): Promise<ProjectSpineResult>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  captureRecoveryCheckpoint?(
    request: CaptureRecoveryCheckpointRequest,
  ): Promise<ProjectSpineResult<RecoveryCheckpointResultData>>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  acceptRecoveryCandidate?(
    request: RecoveryCandidateDecisionRequest,
  ): Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  rejectRecoveryCandidate?(
    request: RecoveryCandidateDecisionRequest,
  ): Promise<ProjectSpineResult<RecoveryCandidateDecisionResultData>>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  saveUnit?(
    request: SaveManuscriptUnitRequest,
  ): Promise<ProjectSpineResult<SaveManuscriptUnitResultData>>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  createUnit?(request: CreateManuscriptUnitRequest): Promise<ProjectSpineResult<{ unitId: string }>>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  renameUnit?(request: RenameManuscriptUnitRequest): Promise<ProjectSpineResult>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  reorderUnits?(request: ReorderManuscriptUnitsRequest): Promise<ProjectSpineResult>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  deleteUnit?(request: DeleteManuscriptUnitRequest): Promise<ProjectSpineResult>;
  /** Writing Studio only. Omitted from the Command Center bridge. */
  exportMarkdown?(
    request: ExportMarkdownRequest,
  ): Promise<ProjectSpineResult<ExportMarkdownResultData>>;
}
