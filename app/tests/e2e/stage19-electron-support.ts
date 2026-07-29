import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { _electron as electron, expect, type ElectronApplication, type Page } from '@playwright/test';

type ElectronProcess = NonNullable<ReturnType<ElectronApplication['process']>>;

export interface RecoveryCandidateArtifact {
  readonly schemaVersion: number;
  readonly projectId: string;
  readonly projectPath: string;
  readonly unitId: string;
  readonly originSessionId: string;
  readonly priorSessionGeneration: number;
  readonly priorSessionRevision: number;
  readonly durableBaselineFingerprint: string;
  readonly prose: string;
  readonly candidateVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RecoveryArtifact {
  readonly schemaVersion: number;
  readonly projectId: string;
  readonly projectPath: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly candidates: readonly RecoveryCandidateArtifact[];
}

export interface LaunchedStage19Application {
  readonly application: ElectronApplication;
  readonly userDataDirectory: string;
  readonly runtimeDirectory: string;
}

const RECOVERY_ARTIFACT_RELATIVE_PATH = join('recovery', 'project-spine-recovery-v1.json');
const POLL_INTERVAL_MS = 100;

function waitForTimeout(timeoutMs: number): Promise<void> {
  return new Promise((resolvePromise) => {
    const handle = setTimeout(resolvePromise, timeoutMs);
    handle.unref?.();
  });
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

export async function waitForProcessIdsToExit(
  observedPids: readonly number[],
  timeoutMs: number,
  description: string,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let remaining = observedPids.filter(isProcessRunning);
  while (remaining.length > 0 && Date.now() < deadline) {
    await waitForTimeout(POLL_INTERVAL_MS);
    remaining = observedPids.filter(isProcessRunning);
  }
  if (remaining.length > 0) {
    throw new Error(`${description} left process PIDs running: ${remaining.join(', ')}.`);
  }
}

interface ProcessTreeRow {
  readonly pid: number;
  readonly parentPid: number;
  readonly startedAt: number | null;
}

function processRowsFromWindows(): ProcessTreeRow[] | null {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      [
        'Get-CimInstance Win32_Process |',
        "Select-Object @{n='pid';e={[int]$_.ProcessId}},@{n='parentPid';e={[int]$_.ParentProcessId}},@{n='startedAt';e={$_.CreationDate.ToUniversalTime().ToString('o')}} |",
        'ConvertTo-Json -Compress',
      ].join(' '),
    ],
    { encoding: 'utf8', windowsHide: true },
  );
  if (result.status !== 0 || !result.stdout.trim()) return null;
  try {
    const parsed = JSON.parse(result.stdout) as
      | { pid?: unknown; parentPid?: unknown; startedAt?: unknown }
      | Array<{ pid?: unknown; parentPid?: unknown; startedAt?: unknown }>;
    return (Array.isArray(parsed) ? parsed : [parsed]).flatMap((entry) => {
      const pid = Number(entry.pid);
      const parentPid = Number(entry.parentPid);
      const startedAt = typeof entry.startedAt === 'string'
        ? Date.parse(entry.startedAt)
        : Number.NaN;
      return Number.isInteger(pid) && Number.isInteger(parentPid)
        ? [{ pid, parentPid, startedAt: Number.isFinite(startedAt) ? startedAt : null }]
        : [];
    });
  } catch {
    return null;
  }
}

function processRowsFromPosix(): ProcessTreeRow[] | null {
  const result = spawnSync('ps', ['-eo', 'pid=,ppid='], { encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout) return null;
  return result.stdout.split('\n').flatMap((line) => {
    const match = line.trim().match(/^(\d+)\s+(\d+)$/);
    return match
      ? [{
          pid: Number.parseInt(match[1] ?? '', 10),
          parentPid: Number.parseInt(match[2] ?? '', 10),
          startedAt: null,
        }]
      : [];
  });
}

export function collectProcessTreePids(rootPid: number): {
  readonly descendantPids: number[];
  readonly inventorySucceeded: boolean;
} {
  const rows = process.platform === 'win32'
    ? processRowsFromWindows()
    : processRowsFromPosix();
  if (!rows) return { descendantPids: [], inventorySucceeded: false };

  const rootStartedAt = rows.find((row) => row.pid === rootPid)?.startedAt ?? null;
  const descendants: number[] = [];
  const queue = [rootPid];
  const visited = new Set(queue);
  while (queue.length > 0) {
    const parentPid = queue.shift() ?? rootPid;
    for (const row of rows) {
      if (
        row.parentPid !== parentPid ||
        visited.has(row.pid) ||
        (
          rootStartedAt !== null &&
          row.startedAt !== null &&
          row.startedAt < rootStartedAt
        )
      ) continue;
      visited.add(row.pid);
      descendants.push(row.pid);
      queue.push(row.pid);
    }
  }
  return { descendantPids: descendants, inventorySucceeded: true };
}

export function killElectronProcessTree(
  pid: number,
  knownDescendantPids?: readonly number[],
): { descendantPids: number[]; inventorySucceeded: boolean } {
  const inventory = knownDescendantPids
    ? { descendantPids: [...knownDescendantPids], inventorySucceeded: true }
    : collectProcessTreePids(pid);

  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      encoding: 'utf8',
      windowsHide: true,
    });
    for (const childPid of [...inventory.descendantPids].reverse()) {
      if (!isProcessRunning(childPid)) continue;
      spawnSync('taskkill.exe', ['/PID', String(childPid), '/F'], {
        encoding: 'utf8',
        windowsHide: true,
      });
    }
  } else {
    for (const childPid of [...inventory.descendantPids].reverse()) {
      try {
        process.kill(childPid, 'SIGKILL');
      } catch {
        // The child may already have exited during teardown.
      }
    }
    if (process.platform === 'linux') {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        // The Electron process group may already have exited.
      }
    }
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // The root may already have exited during teardown.
    }
  }
  return inventory;
}

export async function terminateElectronApplicationAbruptly(
  application: ElectronApplication,
  timeoutMs = 15_000,
): Promise<{ pid: number; descendantPids: number[] }> {
  const electronProcess = application.process();
  if (!electronProcess || electronProcess.exitCode !== null || electronProcess.signalCode !== null) {
    throw new Error('Electron was not running when abrupt interruption was requested.');
  }
  const pid = electronProcess.pid;
  if (!Number.isInteger(pid)) {
    throw new Error('Electron did not expose a valid root PID for abrupt interruption.');
  }
  const inventory = collectProcessTreePids(pid as number);
  if (!inventory.inventorySucceeded) {
    throw new Error(`Unable to inventory the Electron process tree rooted at PID ${pid}.`);
  }
  if (inventory.descendantPids.length === 0) {
    throw new Error(`Electron PID ${pid} had no inventoried descendants; interruption proof is insufficient.`);
  }
  const observedPids = [pid as number, ...inventory.descendantPids];
  killElectronProcessTree(pid as number, inventory.descendantPids);
  await waitForProcessIdsToExit(observedPids, timeoutMs, 'Abrupt Electron interruption');
  return { pid: pid as number, descendantPids: inventory.descendantPids };
}

export async function requestWritingStudioClose(electronApp: ElectronApplication): Promise<void> {
  await electronApp.evaluate(async ({ BrowserWindow }) => {
    const candidates = await Promise.all(
      BrowserWindow.getAllWindows()
        .filter((window) => !window.isDestroyed())
        .map(async (window) => ({
          window,
          role: await window.webContents.executeJavaScript(
            "document.querySelector('[data-stage19-role=\"writing\"]') ? 'writing' : document.querySelector('[data-stage19-role=\"command\"]') ? 'command' : 'unknown'",
          ),
        })),
    );
    const writingWindows = candidates.filter((candidate) => candidate.role === 'writing');
    const commandWindows = candidates.filter((candidate) => candidate.role === 'command');
    if (writingWindows.length !== 1) {
      throw new Error(`Expected exactly one Writing Studio BrowserWindow; found ${writingWindows.length}.`);
    }
    if (commandWindows.length !== 1 || commandWindows[0].window.id === writingWindows[0].window.id) {
      throw new Error(`Expected exactly one distinct Command Center BrowserWindow; found ${commandWindows.length}.`);
    }
    writingWindows[0].window.close();
  });
}

export async function getStage19Windows(
  electronApp: ElectronApplication,
  fixturePage?: Page,
): Promise<{ writing: Page; command: Page }> {
  await expect.poll(async () => {
    const roles = await Promise.all(electronApp.windows().map(async (candidate) => ({
      writing: await candidate.locator('[data-stage19-role="writing"]').count(),
      command: await candidate.locator('[data-stage19-role="command"]').count(),
    })));
    return roles.filter((role) => role.writing > 0).length === 1 &&
      roles.filter((role) => role.command > 0).length === 1;
  }, { timeout: 30_000 }).toBe(true);

  const candidates = fixturePage
    ? [fixturePage, ...electronApp.windows().filter((candidate) => candidate !== fixturePage)]
    : electronApp.windows();
  const identified = await Promise.all(candidates.map(async (candidate) => ({
    candidate,
    writing: await candidate.locator('[data-stage19-role="writing"]').count(),
    command: await candidate.locator('[data-stage19-role="command"]').count(),
  })));
  const writing = identified.find((entry) => entry.writing > 0)?.candidate;
  const command = identified.find((entry) => entry.command > 0)?.candidate;
  if (!writing || !command || writing === command) {
    throw new Error('Stage 19 did not expose one distinct Writing Studio and Command Center.');
  }
  return { writing, command };
}

function waitForCleanElectronExit(
  electronProcess: ElectronProcess | undefined,
  timeoutMs = 15_000,
): Promise<{ code: number; signal: null }> {
  if (!electronProcess) {
    return Promise.reject(new Error('Electron child process was unavailable before shutdown.'));
  }
  const completedExit = (): { code: number; signal: null } | null => {
    if (electronProcess.signalCode) {
      throw new Error(`Electron exited by signal ${electronProcess.signalCode}, not a clean exit.`);
    }
    return typeof electronProcess.exitCode === 'number'
      ? { code: electronProcess.exitCode, signal: null }
      : null;
  };
  try {
    const exit = completedExit();
    if (exit) return Promise.resolve(exit);
  } catch (error) {
    return Promise.reject(error);
  }
  return new Promise((resolvePromise, reject) => {
    let timeoutHandle: NodeJS.Timeout | null = null;
    const cleanup = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      electronProcess.off('exit', onExit);
      electronProcess.off('error', onError);
    };
    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      if (signal || code === null) {
        reject(new Error(`Electron exited by signal ${signal ?? 'unknown'}, not a clean exit.`));
        return;
      }
      resolvePromise({ code, signal: null });
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    electronProcess.once('exit', onExit);
    electronProcess.once('error', onError);
    try {
      const exit = completedExit();
      if (exit) {
        cleanup();
        resolvePromise(exit);
        return;
      }
    } catch (error) {
      cleanup();
      reject(error);
      return;
    }
    timeoutHandle = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for Electron to exit.`));
    }, timeoutMs);
    timeoutHandle.unref?.();
  });
}

export async function waitForCleanElectronApplicationExit(
  application: ElectronApplication,
  timeoutMs = 15_000,
): Promise<{ code: number; signal: null }> {
  const electronProcess = application.process();
  if (!electronProcess || !Number.isInteger(electronProcess.pid)) {
    throw new Error('Electron did not expose a valid root PID before clean shutdown.');
  }
  const pid = electronProcess.pid as number;
  const inventory = collectProcessTreePids(pid);
  if (!inventory.inventorySucceeded || inventory.descendantPids.length === 0) {
    throw new Error(`Unable to inventory the active Electron process tree rooted at PID ${pid} before clean shutdown.`);
  }
  const observedPids = [pid, ...inventory.descendantPids];
  const exit = await waitForCleanElectronExit(electronProcess, timeoutMs);
  await waitForProcessIdsToExit(observedPids, timeoutMs, 'Clean Electron shutdown');
  return exit;
}

export async function launchStage19BuiltApplication(
  prefix = 'black-skies-stage19-relaunch-',
): Promise<LaunchedStage19Application> {
  const appDirectory = resolve(process.cwd());
  const userDataDirectory = fs.mkdtempSync(join(tmpdir(), `${prefix}userdata-`));
  const runtimeDirectory = fs.mkdtempSync(join(tmpdir(), `${prefix}runtime-`));
  const runtimeConfigPath = join(runtimeDirectory, 'runtime.yaml');
  fs.writeFileSync(
    runtimeConfigPath,
    'ui:\n  enable_docking: false\n  experimental_split_command_workspace: true\n',
    'utf8',
  );
  const application = await electron.launch({
    args: [
      ...(process.platform === 'linux' ? ['--no-sandbox'] : []),
      '--disable-gpu',
      `--user-data-dir=${userDataDirectory}`,
      resolve(appDirectory, 'dist-electron', 'main', 'main.js'),
    ],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PLAYWRIGHT: '1',
      BLACKSKIES_ENABLE_HARNESS_HOOKS: '1',
      BLACKSKIES_CONFIG_PATH: runtimeConfigPath,
      ELECTRON_RENDERER_URL: pathToFileURL(resolve(appDirectory, 'dist', 'index.html')).toString(),
      ...(process.platform === 'linux' ? { ELECTRON_DISABLE_SANDBOX: '1' } : {}),
    },
  });
  return { application, userDataDirectory, runtimeDirectory };
}

export async function removeTemporaryDirectory(directory: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await rm(directory, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException).code;
      if (!['EBUSY', 'EPERM', 'ENOTEMPTY'].includes(code ?? '') || attempt === 3) throw error;
      console.warn('[stage19.cleanup] temporary directory remained busy; retrying', {
        directory,
        attempt,
        code,
      });
      await waitForTimeout(attempt * 100);
    }
  }
  throw lastError;
}

export function recoveryArtifactPath(projectPath: string): string {
  return join(projectPath, RECOVERY_ARTIFACT_RELATIVE_PATH);
}

export async function readRecoveryArtifact(projectPath: string): Promise<RecoveryArtifact> {
  return JSON.parse(await readFile(recoveryArtifactPath(projectPath), 'utf8')) as RecoveryArtifact;
}

export async function waitForRecoveryCandidates(
  projectPath: string,
  expectedProse: readonly string[],
  timeoutMs = 15_000,
): Promise<RecoveryArtifact> {
  let observed: RecoveryArtifact | null = null;
  await expect.poll(async () => {
    try {
      observed = await readRecoveryArtifact(projectPath);
      const prose = observed.candidates.map((candidate) => candidate.prose).sort();
      return JSON.stringify(prose) === JSON.stringify([...expectedProse].sort());
    } catch {
      return false;
    }
  }, { timeout: timeoutMs, intervals: [100] }).toBe(true);
  if (!observed) throw new Error('Recovery artifact polling completed without a parsed artifact.');
  return observed;
}

export async function waitForRecoveryArtifactRemoval(
  projectPath: string,
  timeoutMs = 15_000,
): Promise<void> {
  await expect.poll(() => fs.existsSync(recoveryArtifactPath(projectPath)), {
    timeout: timeoutMs,
    intervals: [100],
  }).toBe(false);
}

export async function readDurableDraftByTitle(
  projectPath: string,
  title: string,
): Promise<{ unitId: string; draftPath: string; contents: string }> {
  const outline = JSON.parse(await readFile(join(projectPath, 'outline.json'), 'utf8')) as {
    scenes?: Array<{ id?: unknown; title?: unknown }>;
  };
  const matches = (outline.scenes ?? []).filter((scene) => scene.title === title && typeof scene.id === 'string');
  if (matches.length !== 1) {
    throw new Error(`Expected one outline unit titled ${JSON.stringify(title)}; found ${matches.length}.`);
  }
  const unitId = matches[0].id as string;
  const draftPath = join(projectPath, 'drafts', `${unitId}.md`);
  return { unitId, draftPath, contents: await readFile(draftPath, 'utf8') };
}

export async function closeLaunchedApplicationBestEffort(
  launched: LaunchedStage19Application | null,
): Promise<void> {
  if (!launched) return;
  let processHandle: ElectronProcess | undefined;
  try {
    processHandle = launched.application.process() ?? undefined;
  } catch {
    // A cleanly exited Playwright Electron connection may already be disposed.
  }
  if (processHandle?.exitCode === null && processHandle.signalCode === null) {
    const pid = processHandle.pid;
    if (Number.isInteger(pid)) {
      // Failure cleanup is deliberately abrupt and never counts as close evidence.
      const tree = killElectronProcessTree(pid as number);
      await waitForProcessIdsToExit(
        [pid as number, ...tree.descendantPids],
        5_000,
        'Best-effort Electron failure cleanup',
      );
    }
  }
  await removeTemporaryDirectory(launched.userDataDirectory);
  await removeTemporaryDirectory(launched.runtimeDirectory);
}
