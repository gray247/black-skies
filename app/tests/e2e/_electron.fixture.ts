import { _electron as electron, test as base, expect as baseExpect } from '@playwright/test';
import type { ElectronApplication, Page } from 'playwright';
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

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use) => {
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
      await application.close();
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
    const timeoutPromise = new Promise<{ kind: 'timeout' }>((resolve) => {
      setTimeout(() => resolve({ kind: 'timeout' }), firstWindowTimeoutMs);
    });
    const raceCandidates = [firstWindowPromise, timeoutPromise];
    if (processExitPromise) {
      raceCandidates.push(processExitPromise);
    }
    const outcome = await Promise.race(raceCandidates);
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
    window.on('console', (msg) => {
      console.log('[renderer]', msg.type(), msg.text());
    });
    window.on('pageerror', (err) => {
      console.error('[renderer.pageerror]', err);
    });

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

    try {
      await use(window);
    } finally {
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
