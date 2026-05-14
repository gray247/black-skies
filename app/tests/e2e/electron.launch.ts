import { test as base, expect } from '@playwright/test';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'fs';
import os from 'os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type AppFixtures = {
  app: ElectronApplication;
  page: Page;
  tmpProjectDir: string;
};

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
      // best effort cleanup for deterministic launches
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
    '[electron.launch] missing Electron build artifacts: ' +
    `packagedEntry=${packagedEntry} exists=${packagedEntryExists}, ` +
    `rendererIndex=${rendererIndex} exists=${rendererIndexExists}, ` +
    `devFallback=${devFallback}. Run app build:renderer and app build:main before e2e.`;
  if (strict) {
    throw new Error(message);
  }
  console.warn(message);
}

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

async function closeElectronApplicationSafely(
  application: ElectronApplication,
  timeoutMs = 15_000,
): Promise<{ forcedKill: boolean }> {
  const appProcess = application.process();
  const isProcessAlive = () =>
    Boolean(appProcess && appProcess.exitCode === null && appProcess.signalCode === null);
  const closePromise = application.close().then(() => true).catch(() => true);
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<boolean>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(false), timeoutMs);
    timeoutHandle.unref?.();
  });
  const closed = await Promise.race([closePromise, timeoutPromise]);
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
  if (closed) {
    const deadline = Date.now() + 2_000;
    while (Date.now() < deadline) {
      if (!isProcessAlive()) {
        return { forcedKill: false };
      }
      await waitForTimeout(100);
    }
    console.warn('[electron.teardown] close resolved but process remained alive; escalating to SIGKILL', {
      pid: appProcess?.pid ?? null,
    });
  }

  if (!closed) {
    console.warn('[electron.teardown] close timeout exceeded; escalating to SIGKILL', {
      pid: appProcess?.pid ?? null,
      exitCode: appProcess?.exitCode ?? null,
      signalCode: appProcess?.signalCode ?? null,
      timeoutMs,
    });
  }
  if (appProcess?.pid !== null && appProcess?.pid !== undefined) {
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

  let processExitTimeout: NodeJS.Timeout | null = null;
  await Promise.race([
    closePromise,
    new Promise((resolve) => {
      processExitTimeout = setTimeout(resolve, 5_000);
      processExitTimeout?.unref?.();
    }),
  ]);
  if (processExitTimeout) {
    clearTimeout(processExitTimeout);
  }
  return { forcedKill: true };
}

export const test = base.extend<AppFixtures>({
  tmpProjectDir: async ({}, use) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-e2e-'));
    try {
      await use(dir);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },

  app: async ({}, use) => {
    const appDir = path.resolve(__dirname, '..', '..');
    const repoRoot = path.resolve(appDir, '..');
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const packagedEntryExists = fs.existsSync(packagedEntry);
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
    const rendererUrl = rendererIndexExists
      ? pathToFileURL(rendererIndex).toString()
      : undefined;
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-e2e-userdata-'));

    const disableAnimations = process.env.PLAYWRIGHT_DISABLE_ANIMATIONS === '1' || !!process.env.CI;
    const launchEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PLAYWRIGHT: '1',
      BLACKSKIES_ENABLE_HARNESS_HOOKS: '1',
      BLACKSKIES_E2E_MODE: '1',
      ...(disableAnimations ? { PLAYWRIGHT_DISABLE_ANIMATIONS: '1' } : {}),
    };

    if (!launchEnv.ELECTRON_RENDERER_URL && rendererUrl) {
      launchEnv.ELECTRON_RENDERER_URL = rendererUrl;
    }
    if (process.platform === 'linux') {
      launchEnv.ELECTRON_DISABLE_SANDBOX = '1';
    }
    resetPersistedHarnessState(repoRoot);

    const application = await electron.launch({
      args: [
        ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
        `--user-data-dir=${userDataDir}`,
        entryPoint,
      ],
      env: launchEnv,
    });

    try {
      await use(application);
    } finally {
      await closeElectronApplicationSafely(application);
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  page: async ({ app }, use) => {
    const firstWindow = await app.firstWindow();
    try {
      await use(firstWindow);
    } finally {
      let timeoutHandle: NodeJS.Timeout | null = null;
      const closePromise = firstWindow.close().catch(() => {
        // Best-effort window close before the app teardown fallback runs.
      });
      const timeoutPromise = new Promise<boolean>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(false), 5_000);
        timeoutHandle.unref?.();
      });
      const closed = await Promise.race([closePromise.then(() => true), timeoutPromise]);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (!closed) {
        console.warn('[electron.teardown] window close timed out before app shutdown');
      }
    }
  },
});

export { expect } from '@playwright/test';
