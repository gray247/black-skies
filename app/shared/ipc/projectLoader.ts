export const PROJECT_LOADER_CHANNELS = {
  openDialog: 'project-loader:open-dialog',
  loadProject: 'project-loader:load-project',
  getSamplePath: 'project-loader:get-sample-path',
  setDevProjectPath: 'project-loader:set-dev-project-path',
  acceptCurrentText: 'project-loader:accept-current-text',
  regenerateLocalRepair: 'project-loader:regenerate-local-repair',
  markManualRewrite: 'project-loader:mark-manual-rewrite',
  clearManualRewrite: 'project-loader:clear-manual-rewrite',
} as const;

export type ProjectLoaderChannel =
  (typeof PROJECT_LOADER_CHANNELS)[keyof typeof PROJECT_LOADER_CHANNELS];

export interface OutlineChapter {
  id: string;
  order: number;
  title: string;
}

export interface OutlineSceneSummary {
  id: string;
  order: number;
  title: string;
  chapter_id?: string;
  beat_refs?: string[];
}

export interface OutlineFile {
  schema_version: 'OutlineSchema v1';
  outline_id: string;
  acts: string[];
  chapters: OutlineChapter[];
  scenes: OutlineSceneSummary[];
}

export type EmotionTag =
  | 'dread'
  | 'tension'
  | 'respite'
  | 'revelation'
  | 'aftermath';

export type ScenePurpose = 'setup' | 'escalation' | 'payoff' | 'breath';

export interface SceneDraftMetadata {
  id: string;
  title: string;
  order: number;
  slug?: string;
  pov?: string;
  purpose?: ScenePurpose;
  goal?: string;
  conflict?: string;
  turn?: string;
  emotion_tag?: EmotionTag;
  word_target?: number;
  chapter_id?: string;
  beats?: string[];
}

export interface ProjectIssue {
  level: 'info' | 'warning' | 'error';
  message: string;
  detail?: string;
  path?: string;
}

export interface EditorialReviewSnapshot {
  status: string;
  category?: string;
  failure_class?: string;
  summary?: string;
  why_flagged?: string[];
  targeted_lines?: string[];
  review_actions?: string[];
  rescue_model?: string | null;
  rescue_strategy?: string | null;
  rescue_attempted?: boolean;
}

export interface EditorialCarryoverSnapshot {
  carryover_risk: string;
  carryover_mode: string;
  carryover_allowed: boolean;
  failure_class?: string;
}

export type EditorialRetryStatus =
  | 'requested'
  | 'running'
  | 'succeeded'
  | 'still_flagged'
  | 'failed';

export interface EditorialRetryActionState {
  action: 'regenerate_local_repair';
  status: EditorialRetryStatus;
  scene_id: string;
  chunk_id: string;
  flag_state_key: string;
  source_failure_class?: string;
  attempt_count: number;
  requested_at: string;
  completed_at?: string;
  retry_snapshot?: Record<string, unknown> | null;
  retry_result_review_snapshot?: EditorialReviewSnapshot | null;
  retry_result_carryover_snapshot?: EditorialCarryoverSnapshot | null;
  carryover_changed?: boolean;
  error_message?: string;
}

export interface SceneEditorialReview {
  chunk_id: string;
  review_snapshot?: EditorialReviewSnapshot | null;
  carryover_snapshot?: EditorialCarryoverSnapshot | null;
  accepted_review?: {
    accepted: boolean;
    status: 'accepted_current_text';
  } | null;
  manual_review?: {
    marked: boolean;
    status: 'manual_rewrite_requested';
  } | null;
  retry_action_state?: EditorialRetryActionState | null;
}

export interface LoadedProject {
  path: string;
  name: string;
  outline: OutlineFile;
  scenes: SceneDraftMetadata[];
  drafts: Record<string, string>;
  editorialReviews?: Record<string, SceneEditorialReview>;
}

export interface ProjectLoadRequest {
  path: string;
}

export interface ProjectLoadSuccess {
  ok: true;
  project: LoadedProject;
  issues: ProjectIssue[];
}

export interface ProjectLoadFailure {
  ok: false;
  error: {
    code:
      | 'PROJECT_NOT_FOUND'
      | 'OUTLINE_NOT_FOUND'
      | 'OUTLINE_INVALID'
      | 'DRAFTS_NOT_FOUND'
      | 'SCENE_PARSE_FAILED'
      | 'UNKNOWN';
    message: string;
    issues?: ProjectIssue[];
  };
}

export type ProjectLoadResponse = ProjectLoadSuccess | ProjectLoadFailure;

export interface ProjectDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface ProjectLoaderApi {
  openProjectDialog: () => Promise<ProjectDialogResult>;
  loadProject: (request: ProjectLoadRequest) => Promise<ProjectLoadResponse>;
  getSampleProjectPath?: () => Promise<string | null>;
  acceptCurrentText?: (request: { projectPath: string; sceneId: string }) => Promise<{ ok: true }>;
  regenerateLocalRepair?: (request: {
    projectPath: string;
    sceneId: string;
    chunkId: string;
  }) => Promise<EditorialRetryActionState>;
  markManualRewrite?: (request: { projectPath: string; sceneId: string }) => Promise<{ ok: true }>;
  clearManualRewrite?: (request: { projectPath: string; sceneId: string }) => Promise<{ ok: true }>;
}
