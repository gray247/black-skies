import path from 'node:path';

type ProcessState = {
  pid: number | null;
  exited: boolean;
  exitCode: number | null;
  exitSignal: NodeJS.Signals | null;
};

type LaunchEnvSnapshot = {
  ELECTRON_RENDERER_URL?: string;
  PLAYWRIGHT?: string;
  BLACKSKIES_SERVICES_PORT?: string;
  BLACKSKIES_E2E_PORT?: string;
  BLACKSKIES_E2E_MODE?: string;
  BLACKSKIES_E2E_EXTERNAL_SERVICE?: string;
  BLACKSKIES_ENABLE_HARNESS_HOOKS?: string;
};

type LaunchContext = {
  appDir?: string;
  entryPoint?: string;
  rendererUrl?: string;
  packagedEntry?: string;
  packagedEntryExists?: boolean;
  devFallback?: string;
  devFallbackExists?: boolean;
  rendererIndex?: string;
  rendererIndexExists?: boolean;
  launchEnv?: LaunchEnvSnapshot;
};

export type FirstWindowDiagnostics = {
  reason: string;
  timeoutMs: number;
  electronProcessPid: number | null;
  electronProcessExited: boolean;
  electronExitCode: number | null;
  electronExitSignal: NodeJS.Signals | null;
  currentWindowCount: number;
  appDir: string;
  entryPoint: string | null;
  rendererUrl: string | null;
  packagedEntry: string | null;
  packagedEntryExists: boolean | null;
  devFallback: string | null;
  devFallbackExists: boolean | null;
  rendererIndex: string | null;
  rendererIndexExists: boolean | null;
  launchEnv: LaunchEnvSnapshot;
  stdout: string;
  stderr: string;
};

export function buildFirstWindowDiagnostics(params: {
  reason: string;
  timeoutMs: number;
  processState: ProcessState;
  currentWindowCount: number;
  launchContext?: LaunchContext;
  output?: { stdout: string; stderr: string };
  fallbackAppDir: string;
  fallbackEnv: LaunchEnvSnapshot;
}): FirstWindowDiagnostics {
  const {
    reason,
    timeoutMs,
    processState,
    currentWindowCount,
    launchContext,
    output,
    fallbackAppDir,
    fallbackEnv,
  } = params;
  return {
    reason,
    timeoutMs,
    electronProcessPid: processState.pid,
    electronProcessExited: processState.exited,
    electronExitCode: processState.exitCode,
    electronExitSignal: processState.exitSignal,
    currentWindowCount,
    appDir: launchContext?.appDir ?? path.resolve(fallbackAppDir),
    entryPoint: launchContext?.entryPoint ?? null,
    rendererUrl: launchContext?.rendererUrl ?? null,
    packagedEntry: launchContext?.packagedEntry ?? null,
    packagedEntryExists: launchContext?.packagedEntryExists ?? null,
    devFallback: launchContext?.devFallback ?? null,
    devFallbackExists: launchContext?.devFallbackExists ?? null,
    rendererIndex: launchContext?.rendererIndex ?? null,
    rendererIndexExists: launchContext?.rendererIndexExists ?? null,
    launchEnv: launchContext?.launchEnv ?? fallbackEnv,
    stdout: output?.stdout ?? '',
    stderr: output?.stderr ?? '',
  };
}
