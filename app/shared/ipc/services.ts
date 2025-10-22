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

export interface SnapshotSummary {
  snapshot_id: string;
  label: string;
  created_at: string;
  path: string;
  includes?: string[];
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
  preflightDraft: (
    request: DraftPreflightBridgeRequest,
  ) => Promise<ServiceResult<DraftPreflightEstimate>>;
  acceptDraft: (
    request: DraftAcceptBridgeRequest,
  ) => Promise<ServiceResult<DraftAcceptBridgeResponse>>;
  createSnapshot: (
    request: WizardLockSnapshotBridgeRequest,
  ) => Promise<ServiceResult<WizardLockSnapshotBridgeResponse>>;
  getRecoveryStatus: (
    request: RecoveryStatusBridgeRequest,
  ) => Promise<ServiceResult<RecoveryStatusBridgeResponse>>;
  restoreSnapshot: (
    request: RecoveryRestoreBridgeRequest,
  ) => Promise<ServiceResult<RecoveryRestoreBridgeResponse>>;
}

export type ServicesChannel = never;
