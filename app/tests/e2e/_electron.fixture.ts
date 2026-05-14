import { _electron as electron, test as base, expect as baseExpect } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import type { ConsoleMessage, ElectronApplication, Page } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SERVICE_PORT } from './servicePort';
import { startServiceStubs, stopServiceStubs } from './utils/serviceStubs';
import { buildFirstWindowDiagnostics } from './electronFirstWindowDiagnostics';

type Fixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

type ElectronLaunchContext = {
  appDir: string;
  entryPoint: string;
  rendererUrl?: string;
  packagedEntry: string;
  packagedEntryExists: boolean;
  devFallback: string;
  devFallbackExists: boolean;
  rendererIndex: string;
  rendererIndexExists: boolean;
  launchEnv: {
    ELECTRON_RENDERER_URL?: string;
    PLAYWRIGHT?: string;
    BLACKSKIES_SERVICES_PORT?: string;
    BLACKSKIES_E2E_PORT?: string;
    BLACKSKIES_E2E_MODE?: string;
    BLACKSKIES_E2E_EXTERNAL_SERVICE?: string;
    BLACKSKIES_ENABLE_HARNESS_HOOKS?: string;
    BLACKSKIES_VISUAL_STABLE?: string;
  };
  getProcessState: () => {
    pid: number | null;
    exited: boolean;
    exitCode: number | null;
    exitSignal: NodeJS.Signals | null;
  };
  getOutput: () => { stdout: string; stderr: string };
};

const launchContextByApp = new WeakMap<ElectronApplication, ElectronLaunchContext>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESETTABLE_DATASET_KEYS = [
  'testMode',
  'testNeedsRecovery',
  'testForceOffline',
  'testEnvForceOfflineReason',
  'testStableDock',
  'testStableHome',
  'testVisualStable',
  'projectLoaded',
  'projectPath',
  'projectId',
] as const;

const BASELINE_DATASET_KEYS = [
  'testEnv',
  'testActiveFlow',
  'testMode',
  'testStableDock',
  'testStableHome',
  'testVisualStable',
  'testForceOffline',
  'testEnvForceOfflineReason',
] as const;

// Runtime errors are fail-fast by default; the allowlist defines the only tolerated noise.
const FAIL_ON_RUNTIME_ERRORS = true;
const RUNTIME_ERROR_ALLOWLIST: RegExp[] = [];
const PAGE_TEARDOWN_TIMEOUT_MS = 5_000;

function waitForTimeout(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timeoutHandle = setTimeout(() => resolve(), timeoutMs);
    timeoutHandle.unref?.();
  });
}

function collectProcessTreePids(rootPid: number): number[] {
  if (process.platform !== 'linux') {
    return [];
  }
  const psResult = spawnSync('ps', ['-eo', 'pid=,ppid='], { encoding: 'utf8' });
  if (psResult.status !== 0 || !psResult.stdout) {
    return [];
  }
  const parentByPid = new Map<number, number>();
  for (const line of psResult.stdout.split('\n')) {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/);
    if (!match) {
      continue;
    }
    parentByPid.set(Number.parseInt(match[1] ?? '', 10), Number.parseInt(match[2] ?? '', 10));
  }
  const descendants: number[] = [];
  const queue = [rootPid];
  const visited = new Set<number>(queue);
  while (queue.length > 0) {
    const parentPid = queue.shift() ?? rootPid;
    for (const [pid, ppid] of parentByPid) {
      if (ppid !== parentPid || visited.has(pid)) {
        continue;
      }
      visited.add(pid);
      descendants.push(pid);
      queue.push(pid);
    }
  }
  return descendants;
}

function killElectronProcessTree(pid: number): { descendantPids: number[] } {
  const descendantPids = collectProcessTreePids(pid);
  for (const childPid of [...descendantPids].reverse()) {
    try {
      process.kill(childPid, 'SIGKILL');
    } catch {
      // Best-effort fallback for stuck Electron teardown.
    }
  }
  if (process.platform === 'linux') {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      // Best-effort fallback for Linux process groups.
    }
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // Best-effort fallback for stuck Electron teardown.
  }
  return { descendantPids };
}

async function bestEffortPageTeardownStep(
  testInfo: TestInfo,
  label: string,
  operation: () => Promise<void>,
  timeoutMs = PAGE_TEARDOWN_TIMEOUT_MS,
): Promise<void> {
  let timedOut = false;
  const operationPromise = operation().catch((error) => {
    if (timedOut) {
      console.warn('[electron.page.teardown] step failed after timeout', {
        label,
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    throw error;
  });
  try {
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<'timed_out'>((resolve) => {
      timeoutHandle = setTimeout(() => resolve('timed_out'), timeoutMs);
      timeoutHandle.unref?.();
    });
    const outcome = await Promise.race([
      operationPromise.then(() => 'completed' as const),
      timeoutPromise,
    ]);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (outcome === 'completed') {
      return;
    }
    timedOut = true;
  } catch (error) {
    console.warn('[electron.page.teardown] step failed', {
      label,
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  console.warn('[electron.page.teardown] step timed out', {
    label,
    timeoutMs,
    title: testInfo.title,
    file: testInfo.file,
  });
}

async function captureBaselineFlags(page: Page): Promise<{ body: Record<string, string>; html: Record<string, string> }> {
  return page.evaluate((keys) => {
    const capture = (target: HTMLElement | null): Record<string, string> => {
      const result: Record<string, string> = {};
      if (!target) {
        return result;
      }
      for (const key of keys) {
        const value = target.dataset[key];
        if (typeof value === 'string') {
          result[key] = value;
        }
      }
      return result;
    };
    return {
      body: capture(document.body),
      html: capture(document.documentElement),
    };
  }, [...BASELINE_DATASET_KEYS]);
}

async function resetMutableHarnessState(
  page: Page,
  baseline?: { body: Record<string, string>; html: Record<string, string> },
): Promise<void> {
  await page.evaluate(
    async ({ resetKeys, baselineFlags }) => {
      const clearAllDatasetKeys = (target: HTMLElement | null) => {
        if (!target) {
          return;
        }
        for (const key of Object.keys(target.dataset)) {
          delete target.dataset[key];
        }
        for (const key of resetKeys) {
          delete target.dataset[key];
        }
      };
      const applyDataset = (target: HTMLElement | null, values: Record<string, string>) => {
        if (!target) {
          return;
        }
        for (const [key, value] of Object.entries(values)) {
          target.dataset[key] = value;
        }
      };
      clearAllDatasetKeys(document.documentElement);
      clearAllDatasetKeys(document.body);
      applyDataset(document.documentElement, baselineFlags.html);
      applyDataset(document.body, baselineFlags.body);

      const resetWindow = window as typeof window & {
        __testProjectState?: unknown;
        __blackskiesDebugLog?: unknown;
        __snapshotRestoreDone?: boolean;
        __recoveryLog?: unknown;
        __testBudgetResponse?: unknown;
        __budgetRefresh?: unknown;
        __revealCalls?: unknown;
        __serviceHealthRetry?: unknown;
        __layoutCallLog?: unknown;
        __layoutState?: unknown;
        __stableDockHandleReady?: unknown;
        __testEnvSnapshotRestoreFlow?: unknown;
        __testEnvDefaultProjectId?: unknown;
        __testEnvDefaultProjectPath?: unknown;
        __testEnvAutoSeedProjectSummary?: unknown;
        __E2E_STARTUP_CONFIG?: unknown;
      };
      delete resetWindow.__testProjectState;
      delete resetWindow.__blackskiesDebugLog;
      delete resetWindow.__snapshotRestoreDone;
      delete resetWindow.__recoveryLog;
      delete resetWindow.__testBudgetResponse;
      delete resetWindow.__budgetRefresh;
      delete resetWindow.__revealCalls;
      delete resetWindow.__serviceHealthRetry;
      delete resetWindow.__layoutCallLog;
      delete resetWindow.__layoutState;
      delete resetWindow.__stableDockHandleReady;
      delete resetWindow.__testEnvSnapshotRestoreFlow;
      delete resetWindow.__testEnvDefaultProjectId;
      delete resetWindow.__testEnvDefaultProjectPath;
      delete resetWindow.__testEnvAutoSeedProjectSummary;
      delete resetWindow.__E2E_STARTUP_CONFIG;

      window.localStorage.clear();
      window.sessionStorage.clear();

      if (typeof window.indexedDB !== 'undefined' && typeof window.indexedDB.databases === 'function') {
        try {
          const dbs = await window.indexedDB.databases();
          await Promise.all(
            dbs
              .filter((db) => Boolean(db.name))
              .map(
                (db) =>
                  new Promise<void>((resolve) => {
                    const request = window.indexedDB.deleteDatabase(db.name as string);
                    request.onsuccess = () => resolve();
                    request.onerror = () => resolve();
                    request.onblocked = () => resolve();
                  }),
              ),
          );
        } catch {
          // ignore best-effort indexedDB cleanup failures
        }
      }
    },
    {
      resetKeys: [...RESETTABLE_DATASET_KEYS],
      baselineFlags: baseline ?? { body: {}, html: {} },
    },
  );
}

function resetPersistedHarnessState(repoRoot: string): void {
  const candidateLayoutDirs = [
    path.join(repoRoot, 'sample_project', 'proj_esther_estate', '.blackskies'),
    path.join(repoRoot, 'sample_project', 'Esther_Estate', '.blackskies'),
  ];
  for (const dir of candidateLayoutDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort cleanup for deterministic harness launches
    }
  }
}

function requireElectronBuildArtifacts(params: {
  packagedEntry: string;
  packagedEntryExists: boolean;
  rendererIndex: string;
  rendererIndexExists: boolean;
  devFallback: string;
  strict: boolean;
}): void {
  const {
    packagedEntry,
    packagedEntryExists,
    rendererIndex,
    rendererIndexExists,
    devFallback,
    strict,
  } = params;
  if (packagedEntryExists && rendererIndexExists) {
    return;
  }
  const message =
    '[electron.fixture] missing Electron build artifacts: ' +
    `packagedEntry=${packagedEntry} exists=${packagedEntryExists}, ` +
    `rendererIndex=${rendererIndex} exists=${rendererIndexExists}, ` +
    `devFallback=${devFallback}. Run app build:renderer and app build:main before e2e.`;
  if (strict) {
    throw new Error(message);
  }
  console.warn(message);
}

async function closeElectronApplicationSafely(
  application: ElectronApplication,
  timeoutMs = 15_000,
): Promise<{ forcedKill: boolean }> {
  const appProcess = application.process();
  const isProcessAlive = () =>
    Boolean(appProcess && appProcess.exitCode === null && appProcess.signalCode === null);
  const waitForProcessExit = async (waitMs: number): Promise<boolean> => {
    if (!appProcess || !isProcessAlive()) {
      return true;
    }
    const deadline = Date.now() + waitMs;
    while (Date.now() < deadline) {
      if (!isProcessAlive()) {
        return true;
      }
      await waitForTimeout(100);
    }
    return !isProcessAlive();
  };
  const closePromise = application.close().then(() => true).catch(() => true);
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<boolean>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(false), timeoutMs);
    timeoutHandle.unref?.();
  });
  const closeResolved = await Promise.race([closePromise, timeoutPromise]);
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
  if (closeResolved) {
    const processExited = await waitForProcessExit(2_000);
    if (processExited) {
      return { forcedKill: false };
    }
    console.warn('[electron.teardown] close resolved but process remained alive; escalating to SIGKILL', {
      pid: appProcess?.pid ?? null,
    });
  } else {
    console.warn('[electron.teardown] close timeout exceeded; escalating to SIGKILL', {
      pid: appProcess?.pid ?? null,
      timeoutMs,
    });
  }

  if (isProcessAlive()) {
    try {
      const tree = killElectronProcessTree(appProcess.pid);
      console.warn('[electron.teardown] kill fallback dispatched', {
        pid: appProcess.pid,
        descendantCount: tree.descendantPids.length,
        descendantPids: tree.descendantPids.slice(0, 10),
      });
    } catch {
      // best effort fallback for stuck Electron teardown
    }
  }

  await waitForProcessExit(5_000);
  return { forcedKill: true };
}

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use, testInfo) => {
    const useExternalService = process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE === '1';
    const appDir = path.resolve(__dirname, '..', '..');
    const repoRoot = path.resolve(appDir, '..');
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const packagedEntryExists = fs.existsSync(packagedEntry);
    const devFallbackExists = fs.existsSync(devFallback);
    const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
    const rendererIndexExists = fs.existsSync(rendererIndex);
    const strictPackagedArtifacts =
      process.env.CI === 'true' || process.env.PLAYWRIGHT === '1';
    requireElectronBuildArtifacts({
      packagedEntry,
      packagedEntryExists,
      rendererIndex,
      rendererIndexExists,
      devFallback,
      strict: strictPackagedArtifacts,
    });
    const entryPoint = packagedEntryExists ? packagedEntry : devFallback;
    const rendererUrl = rendererIndexExists ? pathToFileURL(rendererIndex).toString() : undefined;
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-e2e-userdata-'));
    const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
    const launchEnv: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'test',
      ...(rendererUrl ? { ELECTRON_RENDERER_URL: rendererUrl } : {}),
      PLAYWRIGHT: '1',
      BLACKSKIES_ENABLE_HARNESS_HOOKS: '1',
      ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
      BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_MODE: '1',
    };
    if (path.basename(testInfo.file) === 'visual.home.spec.ts') {
      launchEnv.BLACKSKIES_VISUAL_STABLE = '1';
    }
    if (process.platform === 'linux') {
      launchEnv.ELECTRON_DISABLE_SANDBOX = '1';
    }

    const prevServicePort = process.env.BLACKSKIES_SERVICES_PORT;
    const prevE2ePort = process.env.BLACKSKIES_E2E_PORT;
    process.env.BLACKSKIES_SERVICES_PORT = launchEnv.BLACKSKIES_SERVICES_PORT;
    process.env.BLACKSKIES_E2E_PORT = launchEnv[ 'BLACKSKIES_E2E_PORT' ] ?? launchEnv.BLACKSKIES_SERVICES_PORT;

    resetPersistedHarnessState(repoRoot);
    if (!useExternalService) {
      await startServiceStubs();
    }
    const application = await electron.launch({
      args: [
        ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
        `--user-data-dir=${userDataDir}`,
        entryPoint,
      ],
      env: launchEnv,
    });
    const appProcess = application.process();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    const maxChunkChars = 20_000;
    const maxJoinedChars = 100_000;
    const pushChunk = (target: string[], raw: unknown) => {
      const text = String(raw);
      target.push(text.length > maxChunkChars ? text.slice(-maxChunkChars) : text);
      while (target.join('').length > maxJoinedChars && target.length > 1) {
        target.shift();
      }
    };
    let processExited = false;
    let processExitCode: number | null = null;
    let processExitSignal: NodeJS.Signals | null = null;
    if (appProcess?.stdout) {
      appProcess.stdout.on('data', (chunk) => pushChunk(stdoutChunks, chunk));
    }
    if (appProcess?.stderr) {
      appProcess.stderr.on('data', (chunk) => pushChunk(stderrChunks, chunk));
    }
    if (appProcess) {
      appProcess.once('exit', (code, signal) => {
        processExited = true;
        processExitCode = code;
        processExitSignal = signal;
      });
    }

    const launchContext: ElectronLaunchContext = {
      appDir,
      entryPoint,
      rendererUrl,
      packagedEntry,
      packagedEntryExists,
      devFallback,
      devFallbackExists,
      rendererIndex,
      rendererIndexExists,
      launchEnv: {
        ELECTRON_RENDERER_URL: launchEnv.ELECTRON_RENDERER_URL,
        PLAYWRIGHT: launchEnv.PLAYWRIGHT,
        BLACKSKIES_SERVICES_PORT: launchEnv.BLACKSKIES_SERVICES_PORT,
      BLACKSKIES_E2E_PORT: launchEnv.BLACKSKIES_E2E_PORT,
      BLACKSKIES_E2E_MODE: launchEnv.BLACKSKIES_E2E_MODE,
      BLACKSKIES_E2E_EXTERNAL_SERVICE: launchEnv.BLACKSKIES_E2E_EXTERNAL_SERVICE,
      BLACKSKIES_ENABLE_HARNESS_HOOKS: launchEnv.BLACKSKIES_ENABLE_HARNESS_HOOKS,
      BLACKSKIES_VISUAL_STABLE: launchEnv.BLACKSKIES_VISUAL_STABLE,
    },
      getProcessState: () => ({
        pid: appProcess?.pid ?? null,
        exited: processExited,
        exitCode: processExitCode,
        exitSignal: processExitSignal,
      }),
      getOutput: () => ({
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
      }),
    };
    launchContextByApp.set(application, launchContext);

    try {
      await use(application);
    } finally {
      launchContextByApp.delete(application);
      const teardownResult = await closeElectronApplicationSafely(application);
      if (teardownResult.forcedKill) {
        const launchOutput = launchContext.getOutput();
        await testInfo.attach('electron-teardown-diagnostics.json', {
          body: Buffer.from(
            `${JSON.stringify(
              {
                forcedKill: true,
                process: launchContext.getProcessState(),
                launchEnv: launchContext.launchEnv,
                stdoutTail: launchOutput.stdout.slice(-10_000),
                stderrTail: launchOutput.stderr.slice(-10_000),
              },
              null,
              2,
            )}\n`,
            'utf-8',
          ),
          contentType: 'application/json',
        });
      }
      if (!useExternalService) {
        await stopServiceStubs();
      }
      process.env.BLACKSKIES_SERVICES_PORT = prevServicePort;
      process.env.BLACKSKIES_E2E_PORT = prevE2ePort;
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  page: async ({ electronApp }, use, testInfo) => {
    const launchContext = launchContextByApp.get(electronApp);
    const firstWindowTimeoutMs = 30_000;
    const processState = launchContext?.getProcessState();
    const appProcess = electronApp.process();
    const firstWindowPromise = electronApp
      .firstWindow()
      .then((window) => ({ kind: 'window' as const, window }))
      .catch((error) => ({ kind: 'firstWindowError' as const, error }));
    let exitListener: ((code: number | null, signal: NodeJS.Signals | null) => void) | null = null;
    const processExitPromise = appProcess
      ? new Promise<{
          kind: 'processExit';
          code: number | null;
          signal: NodeJS.Signals | null;
        }>((resolve) => {
          exitListener = (code, signal) => resolve({ kind: 'processExit', code, signal });
          appProcess.once('exit', exitListener);
      })
      : null;
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<{ kind: 'timeout' }>((resolve) => {
      timeoutHandle = setTimeout(() => resolve({ kind: 'timeout' }), firstWindowTimeoutMs);
      timeoutHandle.unref?.();
    });
    const raceCandidates = [firstWindowPromise, timeoutPromise];
    if (processExitPromise) {
      raceCandidates.push(processExitPromise);
    }
    const outcome = await Promise.race(raceCandidates);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    if (appProcess && exitListener) {
      appProcess.off('exit', exitListener);
    }

    if (!outcome || outcome.kind !== 'window') {
      const windows = electronApp.windows();
      const output = launchContext?.getOutput() ?? { stdout: '', stderr: '' };
      const resolvedProcessState = launchContext?.getProcessState() ??
        processState ?? {
          pid: appProcess?.pid ?? null,
          exited: false,
          exitCode: null,
          exitSignal: null,
        };
      const diagnostics = buildFirstWindowDiagnostics({
        reason: outcome?.kind ?? 'unknown',
        timeoutMs: firstWindowTimeoutMs,
        processState: resolvedProcessState,
        currentWindowCount: windows.length,
        launchContext,
        output,
        fallbackAppDir: path.resolve(__dirname, '..', '..'),
        fallbackEnv: {
          ELECTRON_RENDERER_URL: process.env.ELECTRON_RENDERER_URL,
          PLAYWRIGHT: process.env.PLAYWRIGHT,
          BLACKSKIES_SERVICES_PORT: process.env.BLACKSKIES_SERVICES_PORT,
          BLACKSKIES_E2E_PORT: process.env.BLACKSKIES_E2E_PORT,
          BLACKSKIES_E2E_MODE: process.env.BLACKSKIES_E2E_MODE,
          BLACKSKIES_E2E_EXTERNAL_SERVICE: process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE,
          BLACKSKIES_ENABLE_HARNESS_HOOKS: process.env.BLACKSKIES_ENABLE_HARNESS_HOOKS,
        },
      });
      console.error('[electron.firstWindow.diagnostics]', JSON.stringify(diagnostics, null, 2));
      await testInfo.attach('electron-first-window-diagnostics', {
        body: Buffer.from(`${JSON.stringify(diagnostics, null, 2)}\n`, 'utf-8'),
        contentType: 'application/json',
      });
      if (outcome?.kind === 'firstWindowError') {
        throw outcome.error;
      }
      if (outcome?.kind === 'processExit') {
        throw new Error(
          `electronApp.firstWindow aborted: process exited before window creation (code=${outcome.code}, signal=${String(outcome.signal)})`,
        );
      }
      throw new Error(
        `electronApp.firstWindow timed out after ${firstWindowTimeoutMs}ms before BrowserWindow creation`,
      );
    }
    const window = outcome.window;
    const runtimeDiagnostics: {
      pageErrors: string[];
      consoleErrors: Array<{ type: string; text: string }>;
    } = { pageErrors: [], consoleErrors: [] };
    const handleConsole = (msg: ConsoleMessage) => {
      const text = msg.text();
      const type = msg.type();
      console.log('[renderer]', type, text);
      if (type === 'error') {
        runtimeDiagnostics.consoleErrors.push({ type, text });
      }
    };
    const handlePageError = (err: Error) => {
      console.error('[renderer.pageerror]', err);
      runtimeDiagnostics.pageErrors.push(err?.stack ?? err?.message ?? String(err));
    };
    window.on('console', handleConsole);
    window.on('pageerror', handlePageError);

    const url = await window.url();
    console.log('[electron.url]', url);

    await window.waitForLoadState('domcontentloaded', { timeout: 5000 });
    try {
      const screenshotPath = testInfo.outputPath('boot.png');
      const screenshotBuffer = await window.screenshot();
      await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
      await fs.promises.writeFile(screenshotPath, screenshotBuffer);
      console.log('[boot.screenshot]', screenshotPath);

      // Playwright auto-attaches files created via `page.screenshot({ path })` to the currently
      // running fixture step, but the attach event can fire after the fixture step completes,
      // which is what led to "Internal error: step id not found: fixture@NN". Attach manually
      // while the fixture is alive so the attachment is tied to a `test.attach` step instead.
      await testInfo.attach('boot screenshot', {
        body: screenshotBuffer,
        contentType: 'image/png',
      });
    } catch {
      // best effort screenshot
    }

    await window.waitForFunction(
      () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
      null,
      { timeout: 30000 },
    );
    await baseExpect(window.getByTestId('app-root')).toBeVisible({ timeout: 30000 });
    const baselineFlags = await captureBaselineFlags(window);
    await resetMutableHarnessState(window, baselineFlags);

    try {
      await use(window);
    } finally {
      window.off('console', handleConsole);
      window.off('pageerror', handlePageError);
      await bestEffortPageTeardownStep(
        testInfo,
        'resetMutableHarnessState',
        async () => {
          await resetMutableHarnessState(window, baselineFlags);
        },
      );
      let allowBudget402Noise = false;
      await bestEffortPageTeardownStep(
        testInfo,
        'readAllowBudget402Noise',
        async () => {
          allowBudget402Noise = await window.evaluate(
            () =>
              Boolean(
                (window as typeof window & { __allowBudget402Noise?: boolean })
                  .__allowBudget402Noise,
              ),
          );
        },
      );
      const combinedErrors = [
        ...runtimeDiagnostics.pageErrors,
        ...runtimeDiagnostics.consoleErrors.map((entry) => entry.text),
      ];
      const budget402Pattern = /Failed to load resource: the server responded with a status of 402 \(Payment Required\)/;
      const unexpectedRuntimeErrors = combinedErrors.filter(
        (message) =>
          !RUNTIME_ERROR_ALLOWLIST.some((pattern) => pattern.test(message)) &&
          !(allowBudget402Noise && budget402Pattern.test(message)),
      );
      if (combinedErrors.length > 0) {
        let currentUrl: string | null = null;
        await bestEffortPageTeardownStep(
          testInfo,
          'window.url',
          async () => {
            currentUrl = window.url();
          },
        );
        await testInfo.attach('runtime-error-diagnostics.json', {
          body: Buffer.from(
            `${JSON.stringify(
              {
                url: currentUrl,
                failOnRuntimeErrors: FAIL_ON_RUNTIME_ERRORS,
                allowlist: RUNTIME_ERROR_ALLOWLIST.map((pattern) => pattern.source),
                allowBudget402Noise,
                pageErrors: runtimeDiagnostics.pageErrors,
                consoleErrors: runtimeDiagnostics.consoleErrors,
                unexpectedRuntimeErrors,
              },
              null,
              2,
            )}\n`,
            'utf-8',
          ),
          contentType: 'application/json',
        });
      }
      await bestEffortPageTeardownStep(
        testInfo,
        'closeWindow',
        async () => {
          await window.close();
        },
      );
      if (
        FAIL_ON_RUNTIME_ERRORS &&
        unexpectedRuntimeErrors.length > 0 &&
        testInfo.status !== 'failed' &&
        testInfo.status !== 'timedOut'
      ) {
        throw new Error(
          `Unexpected runtime errors captured: ${JSON.stringify(unexpectedRuntimeErrors.slice(0, 3))}`,
        );
      }
      if (testInfo.status === 'passed') {
        return;
      }
      // Capture failure screenshots while the page fixture step is still active so that the
      // attachment can be associated with a valid step and avoid "step id not found: fixture@NN".
      try {
        const failureScreenshot = await window.screenshot();
        await testInfo.attach('failure screenshot', {
          body: failureScreenshot,
          contentType: 'image/png',
        });
      } catch (error) {
        console.warn('[electron.fixture] failed to capture failure screenshot', error);
      }
    }
  },
});

export const expect = test.expect;
