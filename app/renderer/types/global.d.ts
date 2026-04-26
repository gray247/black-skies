import type { ProjectLoaderApi } from '../../shared/ipc/projectLoader';
import type { ServicesBridge } from '../../shared/ipc/services';
import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type { LayoutBridge } from '../../shared/ipc/layout';
import type { RuntimeConfig } from '../../shared/config/runtime';

type DevHarness = {
  setProjectDir?: (path: string | null) => Promise<void>;
  selectScene?: (sceneId: string) => Promise<{
    ok: boolean;
    method: 'hook' | 'event';
    sceneId: string;
    hookPresent: boolean;
    error?: string;
  }>;
  overrideServices?: (overrides: Partial<ServicesBridge>) => void;
  setStartupConfig?: (config: E2EStartupConfig) => void;
};

type E2EStartupMode = 'flat' | 'full' | 'recovery';
type E2EServiceSource = 'stub' | 'real';

type E2EStartupConfig = {
  mode: E2EStartupMode;
  projectPath: string | null;
  recovery: boolean;
  services: E2EServiceSource;
  allowRuntimeModeOverride?: boolean;
  allowLayoutRestore?: boolean;
};

type ElectronFsEntry = {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
};

type ElectronFsStat = {
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  mtimeMs: number;
};

type ElectronFsApi = {
  resolvePath: (...segments: string[]) => string;
  readJson: (path: string) => Promise<unknown>;
  readDir: (path: string) => Promise<ElectronFsEntry[]>;
  stat: (path: string) => Promise<ElectronFsStat>;
};

type ElectronApi = {
  fs: ElectronFsApi;
};

declare global {
  interface Window {
    projectLoader?: ProjectLoaderApi;
    services?: ServicesBridge;
    diagnostics?: DiagnosticsBridge;
    runtimeConfig?: RuntimeConfig;
    layout?: LayoutBridge;
    __dev?: DevHarness;
    __blackSkiesSelectScene?: (sceneId: string | null | undefined) => boolean;
    __serviceHealthRetry?: () => Promise<void>;
    __electronApi?: ElectronApi;
    __testEnv?: boolean | { isPlaywright?: boolean };
    __testEnvFlatMode?: boolean;
    __testEnvFullMode?: boolean;
    __testEnvRecoveryMode?: boolean;
    __testEnvSnapshotRestoreFlow?: boolean;
    __testEnvDefaultProjectId?: string;
    __testEnvDefaultProjectPath?: string;
    __testEnvAutoSeedProjectSummary?: boolean;
    __E2E_STARTUP_CONFIG?: E2EStartupConfig;
    __blackSkiesDebugState?: {
      loaded?: boolean;
      path?: string | null;
      projectId?: string | null;
      activeSceneId?: string | null;
      activeSceneTitle?: string | null;
      sceneIds?: string[];
      label?: string;
    };
  }
}

export {};
