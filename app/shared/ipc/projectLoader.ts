import type { RuntimeSessionTruthContract } from '../runtimeSessionTruth';

export const PROJECT_LOADER_CHANNELS = {
  openDialog: 'project-loader:open-dialog',
  loadProject: 'project-loader:load-project',
  createProject: 'project-loader:create-project',
  getSamplePath: 'project-loader:get-sample-path',
  setDevProjectPath: 'project-loader:set-dev-project-path',
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
  project_id?: string;
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

export interface LoadedProject {
  path: string;
  projectId?: string;
  name: string;
  outline: OutlineFile;
  scenes: SceneDraftMetadata[];
  drafts: Record<string, string>;
  bootstrapState?: 'empty' | 'scaffold_initialized' | 'partial';
  bootstrapTemplate?: string;
}

export interface ProjectLoadRequest {
  path: string;
}

export interface ProjectLoadSuccess {
  ok: true;
  project: LoadedProject;
  issues: ProjectIssue[];
  sessionTruth?: RuntimeSessionTruthContract;
}

export interface ProjectLoadFailure {
  ok: false;
  error: {
    code:
      | 'PROJECT_INVALID'
      | 'PROJECT_UNSUPPORTED_VERSION'
      | 'PROJECT_NOT_FOUND'
      | 'OUTLINE_NOT_FOUND'
      | 'OUTLINE_INVALID'
      | 'DRAFTS_NOT_FOUND'
      | 'SCENE_PARSE_FAILED'
      | 'UNKNOWN';
    message: string;
    issues?: ProjectIssue[];
  };
  sessionTruth?: RuntimeSessionTruthContract;
}

export type ProjectLoadResponse = ProjectLoadSuccess | ProjectLoadFailure;

export interface ProjectBootstrapRequest {
  parentPath: string;
  title: string;
  initialState?: 'empty' | 'scaffold_initialized';
}

export interface ProjectBootstrapSuccess {
  ok: true;
  project: LoadedProject;
  issues: ProjectIssue[];
}

export interface ProjectBootstrapFailure {
  ok: false;
  error: {
    code:
      | 'INVALID_PARENT_PATH'
      | 'INVALID_TITLE'
      | 'PROJECT_CONFLICT'
      | 'PROJECT_INVALID'
      | 'PROJECT_UNSUPPORTED_VERSION'
      | 'BOOTSTRAP_FAILED'
      | 'UNKNOWN';
    message: string;
    issues?: ProjectIssue[];
  };
}

export type ProjectBootstrapResponse = ProjectBootstrapSuccess | ProjectBootstrapFailure;

export interface ProjectDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface ProjectLoaderApi {
  openProjectDialog: () => Promise<ProjectDialogResult>;
  loadProject: (request: ProjectLoadRequest) => Promise<ProjectLoadResponse>;
  createProject?: (request: ProjectBootstrapRequest) => Promise<ProjectBootstrapResponse>;
  getSampleProjectPath?: () => Promise<string | null>;
}
