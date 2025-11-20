import type { OutlineFile, SceneDraftMetadata } from './projectLoader.js';

export interface ServiceError {
  code?: string;
  message: string;
  details?: unknown;
  httpStatus?: number;
  traceId?: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T; traceId?: string }
  | { ok: false; error: ServiceError; traceId?: string };

export interface ServiceHealthPayload {
  status: string;
  version?: string;
}

export interface ServiceHealthResponse {
  ok: boolean;
  data?: ServiceHealthPayload;
  error?: ServiceError;
  traceId?: string;
}

export type ExportFormat = 'docx' | 'pdf' | 'rtf' | 'txt' | 'md' | 'zip';

export interface WizardActLock {
  title: string;
}

export interface WizardChapterLock {
  title: string;
  actIndex: number;
}

export interface WizardSceneLock {
  title: string;
  chapterIndex: number;
  beatRefs?: string[];
}

export interface WizardLocks {
  acts: WizardActLock[];
  chapters: WizardChapterLock[];
  scenes: WizardSceneLock[];
}

export type WizardLockStepId =
  | 'input_scope'
  | 'framing'
  | 'structure'
  | 'scenes'
  | 'characters'
  | 'conflict'
  | 'beats'
  | 'pacing'
  | 'chapters'
  | 'themes'
  | 'finalize';

export interface WizardLockSnapshotBridgeRequest {
  projectId: string;
  step: WizardLockStepId;
  label?: string;
  includes?: string[];
}

export type WizardLockSnapshotBridgeResponse = SnapshotSummary;

export interface OutlineBuildBridgeRequest {
  projectId: string;
  forceRebuild?: boolean;
  wizardLocks: WizardLocks;
}

export type OutlineBuildBridgeResponse = OutlineFile;

export type DraftUnitScope = 'scene' | 'chapter';

export interface DraftUnitOverrides {
  order?: number;
  purpose?: SceneDraftMetadata['purpose'];
  emotion_tag?: SceneDraftMetadata['emotion_tag'];
  pov?: string;
  goal?: string;
  conflict?: string;
  turn?: string;
  word_target?: number;
  beats?: string[];
}

export interface DraftGenerateBridgeRequest {
  projectId: string;
  unitScope: DraftUnitScope;
  unitIds: string[];
  temperature?: number;
  seed?: number;
  overrides?: Record<string, DraftUnitOverrides>;
}

export interface DraftUnitMeta extends SceneDraftMetadata {
  chapter_id?: string;
}

export interface DraftUnit {
  id: string;
  text: string;
  meta: DraftUnitMeta;
  prompt_fingerprint?: string;
  model?: { name: string; provider: string };
  seed?: number;
}

export interface DraftGenerateBridgeResponse {
  draft_id: string;
  schema_version: 'DraftUnitSchema v1';
  units: DraftUnit[];
  budget?: {
    estimated_usd?: number;
    status?: DraftPreflightStatus;
    message?: string;
    soft_limit_usd?: number;
    hard_limit_usd?: number;
    spent_usd?: number;
    total_after_usd?: number;
  };
}

export interface DraftCritiqueBridgeRequest {
  projectId: string;
  draftId: string;
  unitId: string;
  rubric: string[];
}

export interface DraftCritiqueNote {
  line: number;
  note: string;
  excerpt?: string;
}

export interface DraftCritiqueBridgeResponse {
  unit_id: string;
  schema_version: 'CritiqueOutputSchema v1';
  summary: string;
  priorities?: string[];
  line_comments?: DraftCritiqueNote[];
  model?: { name: string; provider: string };
  budget?: {
    estimated_usd?: number;
    status?: DraftPreflightStatus;
    message?: string | null;
    soft_limit_usd?: number;
    hard_limit_usd?: number;
    spent_usd?: number;
    total_after_usd?: number;
  };
}

export type Phase4CritiqueMode = 'line_edit' | 'big_picture' | 'pacing' | 'tone';

export interface Phase4CritiqueBridgeRequest {
  projectId: string;
  sceneId: string;
  text: string;
  mode: Phase4CritiqueMode;
}

export interface Phase4Issue {
  line?: number;
  type: string;
  message: string;
}

export interface Phase4CritiqueBridgeResponse {
  summary: string;
  issues: Phase4Issue[];
  suggestions: string[];
}

export interface Phase4RewriteBridgeRequest {
  projectId: string;
  sceneId: string;
  originalText: string;
  instructions?: string;
}

export interface Phase4RewriteBridgeResponse {
  revisedText: string;
}

export interface SnapshotSummary {
  snapshot_id: string;
  label: string;
  created_at: string;
  path: string;
  includes?: string[];
}

export interface SnapshotManifest {
  snapshot_id: string;
  created_at: string;
  path: string;
  files_included: Array<{ path: string; checksum: string }>;
}

export interface SnapshotVerificationSummary {
  snapshot_id: string;
  status?: 'ok' | 'errors' | string;
  errors?: string[];
  issues?: Array<string | { reason?: string; [key: string]: unknown }>;
}

export interface BackupVerificationReport {
  project_id: string;
  snapshots: SnapshotVerificationSummary[];
}

export interface BackupSummary {
  project_id: string;
  filename: string;
  path: string;
  created_at: string;
  checksum: string;
}

export interface BackupCreateBridgeRequest {
  projectId: string;
}

export interface BackupCreateBridgeResponse {
  project_id: string;
  filename: string;
  path: string;
  created_at: string;
  checksum: string;
}

export interface BackupListBridgeRequest {
  projectId: string;
}

export type BackupListBridgeResponse = BackupSummary[];

export interface BackupRestoreBridgeRequest {
  backupName: string;
}

export interface BackupRestoreBridgeResponse {
  status: 'ok' | string;
  restored_path?: string;
  restored_project_slug?: string;
  message?: string;
}

export interface DraftAcceptUnitPayload {
  id: string;
  previous_sha256: string;
  text: string;
  meta?: Record<string, unknown>;
}

export interface DraftAcceptBridgeRequest {
  projectId: string;
  draftId: string;
  unitId: string;
  unit: DraftAcceptUnitPayload;
  message?: string;
  snapshotLabel?: string;
}

export interface DraftAcceptBridgeResponse {
  unit_id: string;
  checksum: string;
  snapshot: SnapshotSummary;
  schema_version: 'DraftAcceptResult v1';
  budget?: {
    soft_limit_usd?: number;
    hard_limit_usd?: number;
    spent_usd?: number;
    status?: DraftPreflightStatus;
    message?: string | null;
    estimated_usd?: number;
    total_after_usd?: number;
  };
}

export interface RecoveryStatusBridgeRequest {
  projectId: string;
}

export interface RecoveryStatusBridgeResponse {
  project_id: string;
  status: string;
  needs_recovery: boolean;
  pending_unit_id?: string | null;
  draft_id?: string | null;
  started_at?: string | null;
  last_snapshot?: SnapshotSummary | null;
  message?: string | null;
  failure_reason?: string | null;
}

export interface RecoveryRestoreBridgeRequest {
  projectId: string;
  snapshotId?: string;
}

export type RecoveryRestoreBridgeResponse = RecoveryStatusBridgeResponse;

export type DraftPreflightStatus = 'ok' | 'soft-limit' | 'blocked';

export interface DraftPreflightBridgeRequest {
  projectId: string;
  unitScope: DraftUnitScope;
  unitIds: string[];
  overrides?: Record<string, DraftUnitOverrides>;
}

export interface DraftPreflightEstimate {
  projectId: string;
  unitScope: DraftUnitScope;
  unitIds: string[];
  model: {
    name: string;
    provider: string;
  };
  scenes: Array<{
    id: string;
    title: string;
    order: number;
    chapter_id?: string;
    beat_refs?: string[];
  }>;
  budget: {
    estimated_usd: number;
    status: DraftPreflightStatus;
    message?: string;
    soft_limit_usd?: number;
    hard_limit_usd?: number;
    spent_usd?: number;
    total_after_usd?: number;
  };
}

export type AnalyticsBudgetHint = 'stable' | 'near_cap' | 'over_budget' | 'ample';

export interface AnalyticsBudgetBridgeRequest {
  projectId: string;
}

export interface AnalyticsBudgetBridgeResponse {
  project_id: string;
  budget: {
    soft_limit_usd: number;
    hard_limit_usd: number;
    spent_usd: number;
    remaining_usd: number;
  };
  hint: AnalyticsBudgetHint;
  message?: string;
}

export interface ProjectExportBridgeRequest {
  projectId: string;
  format?: ExportFormat;
  includeMetaHeader?: boolean;
}

export interface ProjectExportBridgeResponse {
  project_id: string;
  path: string;
  format: ExportFormat;
  chapters: number;
  scenes: number;
  meta_header: boolean;
  exported_at: string;
  schema_version: 'ProjectExportResult v1';
}

export interface RestoreFromZipRequest {
  projectId: string;
  zipName?: string;
  restoreAsNew?: boolean;
}

export interface RestoreFromZipResponse {
  status: 'ok' | 'error';
  restored_path?: string;
  restored_project_slug?: string;
  message?: string;
  details?: unknown;
}

export interface ServicesBridge {
  checkHealth: () => Promise<ServiceHealthResponse>;
  buildOutline: (
    request: OutlineBuildBridgeRequest,
  ) => Promise<ServiceResult<OutlineBuildBridgeResponse>>;
  generateDraft: (
    request: DraftGenerateBridgeRequest,
  ) => Promise<ServiceResult<DraftGenerateBridgeResponse>>;
  critiqueDraft: (
    request: DraftCritiqueBridgeRequest,
  ) => Promise<ServiceResult<DraftCritiqueBridgeResponse>>;
  phase4Critique: (
    request: Phase4CritiqueBridgeRequest,
  ) => Promise<ServiceResult<Phase4CritiqueBridgeResponse>>;
  phase4Rewrite: (
    request: Phase4RewriteBridgeRequest,
  ) => Promise<ServiceResult<Phase4RewriteBridgeResponse>>;
  preflightDraft: (
    request: DraftPreflightBridgeRequest,
  ) => Promise<ServiceResult<DraftPreflightEstimate>>;
  acceptDraft: (
    request: DraftAcceptBridgeRequest,
  ) => Promise<ServiceResult<DraftAcceptBridgeResponse>>;
  createSnapshot: (
    request: WizardLockSnapshotBridgeRequest,
  ) => Promise<ServiceResult<WizardLockSnapshotBridgeResponse>>;
  createProjectSnapshot?: (
    request: { projectId: string },
  ) => Promise<ServiceResult<SnapshotManifest>>;
  listProjectSnapshots?: (
    request: { projectId: string },
  ) => Promise<ServiceResult<SnapshotManifest[]>>;
  getRecoveryStatus: (
    request: RecoveryStatusBridgeRequest,
  ) => Promise<ServiceResult<RecoveryStatusBridgeResponse>>;
  restoreSnapshot: (
    request: RecoveryRestoreBridgeRequest,
  ) => Promise<ServiceResult<RecoveryRestoreBridgeResponse>>;
  restoreFromZip?: (
    request: RestoreFromZipRequest,
  ) => Promise<ServiceResult<RestoreFromZipResponse>>;
  analyticsBudget: (
    request: AnalyticsBudgetBridgeRequest,
  ) => Promise<ServiceResult<AnalyticsBudgetBridgeResponse>>;
  exportProject: (
    request: ProjectExportBridgeRequest,
  ) => Promise<ServiceResult<ProjectExportBridgeResponse>>;
  createBackup?: (
    request: BackupCreateBridgeRequest,
  ) => Promise<ServiceResult<BackupCreateBridgeResponse>>;
  listBackups?: (
    request: BackupListBridgeRequest,
  ) => Promise<ServiceResult<BackupListBridgeResponse>>;
  restoreBackup?: (
    request: BackupRestoreBridgeRequest,
  ) => Promise<ServiceResult<BackupRestoreBridgeResponse>>;
  runBackupVerification?: (
    request: { projectId: string; latestOnly: boolean },
  ) => Promise<ServiceResult<BackupVerificationReport>>;
  getLastVerification?: (
    request: { projectId: string; projectPath?: string | null },
  ) => Promise<ServiceResult<BackupVerificationReport | null>>;
  revealPath?: (path: string) => Promise<void>;
}

export type ServicesChannel = never;
