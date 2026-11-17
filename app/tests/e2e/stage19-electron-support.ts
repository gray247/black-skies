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

export interface Stage19SurfaceHostPreflightSnapshot {
  readonly viewport: {
    readonly width: number;
    readonly height: number;
    readonly devicePixelRatio: number;
  };
  readonly bridgePresent: boolean;
  readonly bridgeRole: string | null;
  readonly requestOutcome: 'ok' | 'null' | 'error' | 'unavailable';
  readonly cachedStatePresent: boolean;
  readonly statePresent: boolean;
  readonly stateSummary: {
    readonly schemaVersion: number | null;
    readonly primarySurface: string | null;
    readonly commandPlacement: string | null;
    readonly secondaryStatus: string | null;
    readonly projectId: string | null;
    readonly generation: number | null;
    readonly revision: number | null;
    readonly commandRole: string | null;
    readonly commandProjectId: string | null;
    readonly commandGeneration: number | null;
    readonly commandRevision: number | null;
  } | null;
  readonly controls: {
    readonly currentWindow: number;
    readonly secondWindow: number;
    readonly currentWindowDom: number;
    readonly secondWindowDom: number;
  };
  readonly error: string | null;
}

/**
 * Read the complete startup handoff in one browser-side probe. This is kept
 * separate from the product UI so a missing control can be classified as a
 * bridge, IPC, normalization, or renderer-projection failure.
 */
export async function readStage19SurfaceHostPreflight(
  page: Page,
): Promise<Stage19SurfaceHostPreflightSnapshot> {
  return page.evaluate(async () => {
    const bridge = window.splitCommand;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };
    const matchesButton = (button: HTMLButtonElement, label: string): boolean =>
      button.textContent?.trim() === label || button.getAttribute('aria-label') === label;
    const isVisible = (button: HTMLButtonElement): boolean => {
      if (button.hidden || button.getAttribute('aria-hidden') === 'true') return false;
      const style = window.getComputedStyle(button);
      return style.display !== 'none' && style.visibility !== 'hidden' && button.getClientRects().length > 0;
    };
    const countButton = (label: string, visibleOnly: boolean): number =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('button')).filter(
        (button) => matchesButton(button, label) && (!visibleOnly || isVisible(button)),
      ).length;
    const readControls = () => ({
      currentWindow: countButton('Open Command Center here', true),
      secondWindow: countButton('Open Command Center in second window', true),
      currentWindowDom: countButton('Open Command Center here', false),
      secondWindowDom: countButton('Open Command Center in second window', false),
    });
    const controls = {
      ...readControls(),
    };
    if (!bridge) {
      return {
        viewport,
        bridgePresent: false,
        bridgeRole: null,
        requestOutcome: 'unavailable' as const,
        cachedStatePresent: false,
        statePresent: false,
        stateSummary: null,
        controls,
        error: 'window.splitCommand is not exposed.',
      };
    }

    const summarize = (state: Awaited<ReturnType<typeof bridge.readSurfaceHostState>>) => {
      if (!state) return null;
      return {
        schemaVersion: state.schemaVersion,
        primarySurface: state.primarySurface,
        commandPlacement: state.commandPlacement,
        secondaryStatus: state.secondaryStatus,
        projectId: state.projectId,
        generation: state.generation,
        revision: state.revision,
        commandRole: state.commandSnapshot.role,
        commandProjectId: state.commandSnapshot.project?.projectId ?? null,
        commandGeneration: state.commandSnapshot.generation,
        commandRevision: state.commandSnapshot.revision,
      };
    };

    try {
      const requested = await bridge.requestSurfaceHostState();
      const cached = bridge.readSurfaceHostState();
      return {
        viewport,
        bridgePresent: true,
        bridgeRole: bridge.windowRole,
        requestOutcome: requested ? ('ok' as const) : ('null' as const),
        cachedStatePresent: Boolean(cached),
        statePresent: Boolean(requested ?? cached),
        stateSummary: summarize(requested ?? cached),
        controls: readControls(),
        error: null,
      };
    } catch (error) {
      return {
        viewport,
        bridgePresent: true,
        bridgeRole: bridge.windowRole,
        requestOutcome: 'error' as const,
        cachedStatePresent: Boolean(bridge.readSurfaceHostState()),
        statePresent: Boolean(bridge.readSurfaceHostState()),
        stateSummary: summarize(bridge.readSurfaceHostState()),
        controls,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

export type WritingStudioRailLabel =
  | 'Project Tools'
  | 'Story'
  | 'Review'
  | 'Writing Session'
  | 'Companion';

export async function openWritingStudioRail(
  writing: Page,
  label: WritingStudioRailLabel,
): Promise<void> {
  const closeControl = writing.getByRole('button', { name: `Close ${label}` });
  if (await closeControl.isVisible()) return;
  const opening = writing.getByRole('button', { name: `Open ${label}` });
  // Use the public reveal interaction. A hovered cue becomes a clipped keyboard
  // close control, so clicking its old box is not a reliable mouse action.
  if (await writing.evaluate(() => innerWidth < 800)) await opening.press('Enter');
  else await opening.hover();
  await expect(closeControl).toBeVisible();
}

/** Open the existing saved-section controls through their public disclosure.
 * The Outline is the default Story view; these older journeys exercise the
 * section-management controls deliberately, with their rail held open.
 */
export async function openSavedWritingSections(writing: Page): Promise<void> {
  await openWritingStudioRail(writing, 'Story');
  const story = writing.getByRole('region', { name: 'Story tools', exact: true });
  const lock = story.getByRole('button', { name: 'Keep open', exact: true });
  if (await lock.isVisible()) await lock.click();
  const disclosure = story.locator('details.stage19-outline-planning');
  if (!(await disclosure.evaluate(element => element.hasAttribute('open')))) await disclosure.locator(':scope > summary').click();
  await expect(writing.getByRole('complementary', { name: 'Story rail', exact: true })).toBeVisible();
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
            "document.querySelector('[data-stage19-logical-surface]') || document.querySelector('[data-stage19-role=\"writing\"]') ? 'primary' : document.querySelector('[data-stage19-role=\"command\"]') ? 'command' : 'unknown'",
          ),
        })),
    );
    const writingWindows = candidates.filter((candidate) => candidate.role === 'primary');
    const commandWindows = candidates.filter((candidate) => candidate.role === 'command');
    if (writingWindows.length !== 1) {
      throw new Error(`Expected exactly one Writing Studio BrowserWindow; found ${writingWindows.length}.`);
    }
    if (commandWindows.length > 1 || commandWindows[0]?.window.id === writingWindows[0].window.id) {
      throw new Error(`Expected at most one distinct Command Center BrowserWindow; found ${commandWindows.length}.`);
    }
    writingWindows[0].window.close();
  });
}

export async function getStage19Windows(
  electronApp: ElectronApplication,
  fixturePage?: Page,
): Promise<{ writing: Page; command: Page }> {
  await expect.poll(async () => {
    return (await Promise.all(electronApp.windows().map((candidate) =>
      candidate.locator('[data-stage19-role="writing"]').count(),
    ))).filter((count) => count > 0).length;
  }, { timeout: 30_000 }).toBe(1);

  const writingCandidate = (fixturePage &&
    await fixturePage.locator('[data-stage19-role="writing"]').count() > 0)
    ? fixturePage
    : (await Promise.all(electronApp.windows().map(async (candidate) => ({
        candidate,
        writing: await candidate.locator('[data-stage19-role="writing"]').count(),
      })))).find((entry) => entry.writing > 0)?.candidate;
  if (!writingCandidate) {
    throw new Error('Stage 19 did not expose Writing Studio.');
  }

  let lastSurfaceHostPreflight: Stage19SurfaceHostPreflightSnapshot | null = null;
  try {
    await expect
      .poll(
        async () => {
          lastSurfaceHostPreflight = await readStage19SurfaceHostPreflight(writingCandidate);
          return lastSurfaceHostPreflight;
        },
        { timeout: 8_000, intervals: [100, 250, 500, 1_000] },
      )
      .toMatchObject({
        bridgePresent: true,
        requestOutcome: 'ok',
        statePresent: true,
      });
  } catch (error) {
    throw new Error(
      `[SURFACE_HOST_PREFLIGHT_FAILED] ${JSON.stringify(lastSurfaceHostPreflight)}` +
        (error instanceof Error ? ` cause="${error.message}"` : ''),
    );
  }

  try {
    await expect
      .poll(
        async () => {
          lastSurfaceHostPreflight = await readStage19SurfaceHostPreflight(writingCandidate);
          return lastSurfaceHostPreflight;
        },
        { timeout: 4_000, intervals: [100, 250, 500, 1_000] },
      )
      .toMatchObject({
        controls: {
          currentWindow: 1,
          secondWindow: 1,
        },
      });
  } catch (error) {
    throw new Error(
      `[SURFACE_HOST_CONTROLS_MISSING] ${JSON.stringify(lastSurfaceHostPreflight)}` +
        (error instanceof Error ? ` cause="${error.message}"` : ''),
    );
  }

  const hasDistinctCommand = async (): Promise<boolean> =>
    (await Promise.all(electronApp.windows().map(async (candidate) => ({
      candidate,
      command: await candidate.locator('[data-stage19-role="command"]').count(),
    })))).some((entry) => entry.command > 0 && entry.candidate !== writingCandidate);

  if (!(await hasDistinctCommand())) {
    await writingCandidate.getByRole('button', {
      name: 'Open Command Center in second window',
    }).click();
  }

  await expect.poll(hasDistinctCommand, { timeout: 30_000 }).toBe(true);

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
    throw new Error('Stage 19 did not expose its optional distinct Command Center.');
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
  if (process.env.BLACKSKIES_RETAIN_TEST_ARTIFACTS === '1') {
    console.info(`[stage19.artifact] retained ${directory}`);
    return;
  }
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

/** Read the real window thumbnail before requesting a renderer capture. DOM
 * text alone cannot establish that the compositor actually painted glyphs.
 * This helper reads only the disposable app window, never the whole desktop.
 */
export async function readWritingPaintWitness(
  application: ElectronApplication,
  target: import('@playwright/test').Locator,
) {
  const dom = await target.evaluate(element => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && !node.textContent?.trim()) node = walker.nextNode();
    if (!node?.textContent) throw new Error('The paint witness has no manuscript text.');
    const start = node.textContent.search(/\S/u);
    const range = document.createRange(); range.setStart(node, start); range.setEnd(node, Math.min(node.textContent.length, start + 24));
    const rect = range.getClientRects()[0];
    if (!rect || rect.width < 2 || rect.height < 2 || rect.top < 0 || rect.bottom > innerHeight) throw new Error('The manuscript witness is outside the visible content area.');
    const color = getComputedStyle(node.parentElement!).color.match(/[\d.]+/gu)!.slice(0, 3).map(Number);
    return { text: range.toString(), rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, color, viewport: { width: innerWidth, height: innerHeight } };
  });
  const handle = await application.browserWindow(target.page());
  const windowId = await handle.evaluate(window => window.id);
  return application.evaluate(async ({ BrowserWindow, desktopCapturer }, { dom, windowId }) => {
    const window = BrowserWindow.fromId(windowId)!;
    const bounds = window.getBounds(), content = window.getContentBounds();
    const zoom = window.webContents.getZoomFactor();
    const sourceId = window.getMediaSourceId();
    const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: bounds.width, height: bounds.height }, fetchWindowIcons: false });
    const source = sources.find(source => source.id === sourceId);
    if (!source || source.thumbnail.isEmpty()) throw new Error('The independent app-window paint capture is unavailable.');
    const ink = (image: Electron.NativeImage, rect: { x: number; y: number; width: number; height: number }) => {
      const size = image.getSize(1), bytes = image.toBitmap({ scaleFactor: 1 });
      if (bytes.length !== size.width * size.height * 4) throw new Error('Unexpected native bitmap geometry.');
      const crop = { x: Math.max(0, Math.floor(rect.x)), y: Math.max(0, Math.floor(rect.y)), width: Math.min(size.width - Math.max(0, Math.floor(rect.x)), Math.ceil(rect.width)), height: Math.min(size.height - Math.max(0, Math.floor(rect.y)), Math.ceil(rect.height)) };
      let pixels = 0;
      for (let y = crop.y; y < crop.y + crop.height; y += 1) for (let x = crop.x; x < crop.x + crop.width; x += 1) {
        const at = (y * size.width + x) * 4;
        if (Math.abs(bytes[at + 2]! - dom.color[0]!) < 55 && Math.abs(bytes[at + 1]! - dom.color[1]!) < 55 && Math.abs(bytes[at]! - dom.color[2]!) < 55) pixels += 1;
      }
      return { pixels, crop, size, png: image.crop(crop).toPNG().toString('base64') };
    };
    const size = source.thumbnail.getSize(1);
    const sx = size.width / bounds.width, sy = size.height / bounds.height;
    const native = ink(source.thumbnail, { x: (content.x - bounds.x + dom.rect.x * zoom - 3) * sx, y: (content.y - bounds.y + dom.rect.y * zoom - 3) * sy, width: (dom.rect.width * zoom + 6) * sx, height: (dom.rect.height * zoom + 6) * sy });
    // The OS capture is taken first so capturePage cannot repair a missing OS
    // frame before the independent observation has been recorded.
    const captured = await window.webContents.capturePage();
    const capturedSize = captured.getSize(1);
    const cx = capturedSize.width / dom.viewport.width, cy = capturedSize.height / dom.viewport.height;
    const renderer = ink(captured, { x: dom.rect.x * cx, y: dom.rect.y * cy, width: dom.rect.width * cx, height: dom.rect.height * cy });
    return { dom, sourceId, bounds, content, zoom, native, renderer, rendererAlive: !window.webContents.isCrashed() };
  }, { dom, windowId });
}
