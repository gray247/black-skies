import type { ProjectLoaderApi } from '../../shared/ipc/projectLoader';
import type { ServicesBridge } from '../../shared/ipc/services';
import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type { LayoutBridge } from '../../shared/ipc/layout';
import type { RuntimeConfig } from '../../shared/config/runtime';

type DevHarness = {
  setProjectDir?: (path: string | null) => Promise<void>;
  overrideServices?: (overrides: Partial<ServicesBridge>) => void;
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
    __serviceHealthRetry?: () => Promise<void>;
    __selectSceneForTest?: (sceneId?: string | null) => boolean;
    __electronApi?: ElectronApi;
    __testEnv?: boolean | { isPlaywright?: boolean };
    __testEnvForceOffline?: boolean;
    __testEnvForceOnline?: boolean;
    __testEnvNeedsRecovery?: boolean;
    __testEnvFlatMode?: boolean;
    __testEnvFullMode?: boolean;
    __testEnvRecoveryMode?: boolean;
    __testEnvDefaultProjectId?: string;
    __testEnvDefaultProjectPath?: string;
    __testEnvAutoSeedProjectSummary?: boolean;
    __testEnvStableDock?: boolean;
    __testEnvStableHome?: boolean;
    __testEnvVisualStable?: boolean;
    __testModeFreezeServiceHealth?: boolean;
  }
}

export {};
