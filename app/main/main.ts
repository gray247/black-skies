import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';
import { screen } from 'electron';
import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcessByStdio } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, delimiter, basename, isAbsolute, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Readable } from 'node:stream';

import { registerProjectLoaderIpc } from './projectLoaderIpc';
import {
  getLogger,
  initializeMainLogging,
  logWithLevel,
  getDiagnosticsLogFilePath,
  registerRendererLogSink,
  shutdownLogging,
  type LogLevel,
  type Logger,
} from './logging.js';
import {
  DIAGNOSTICS_CHANNELS,
  type DiagnosticsOpenResult,
} from '../shared/ipc/diagnostics.js';
import { registerLayoutIpc } from './layoutIpc.js';
import {
  DEFAULT_HEALTH_PROBE,
  DEFAULT_SERVICE_PORT_RANGE,
  loadRuntimeConfig,
  type ServicePortRange,
} from '../shared/config/runtime.js';
import { resolveConfiguredServicePort } from './serviceResolution.js';
import {
  createSplitCommandLifecycleSeam,
  buildSplitCommandOwnershipSyncMessage,
  type SplitCommandPrimaryCollapseReason,
  type SplitCommandSecondaryLossReason,
  type SplitCommandSecondaryLaunchContract,
  type SplitCommandLifecycleSeam,
  type SplitCommandPairFallbackState,
  type SplitCommandOwnershipSyncMessage,
  type SplitCommandWindowRole,
} from '../shared/splitCommandAuthority.js';
import {
  SPLIT_COMMAND_CHANNELS,
  type ActivateSplitCommandSurfaceRequest,
  type SplitCommandLogicalSurface,
  type SplitCommandSecondarySurfaceStatus,
  type SplitCommandSurfaceHostErrorCode,
  type SplitCommandSurfaceHostNotice,
  type SplitCommandSurfaceHostResult,
  type SplitCommandSurfaceHostState,
} from '../shared/ipc/splitCommand.js';
import { createMainProcessSessionTruthSnapshot } from './runtimeSessionTruth.js';
import { startOptionalServicesForCoreShell } from './optionalServiceStartup.js';
import { requiresBundledPython } from './pythonExecutablePolicy.js';
import {
  shouldEnableDedicatedStage19Host,
  shouldResolveLegacyPython,
  shouldStartLegacyServices,
} from './packagedRuntimePolicy.js';
import { deriveSplitCommandInitialPlacement, type InitialWindowBounds } from './splitCommandWindowPlacement.js';
import { PROJECT_SPINE_CHANNELS, type ProjectSpineWindowRole } from '../shared/ipc/projectSpine.js';
import {
  getProjectSpineSnapshot,
  registerProjectSpineIpc,
} from './projectSpineIpc.js';
import {
  executeDeterministicAiCritiqueFixture,
  invalidateAllAiCritiqueArtifacts,
  registerAiCritiqueIpc,
} from './aiCritiqueIpc.js';
import { registerFeedbackNotesIpc } from './feedbackNotesIpc.js';
import { registerLivingOutlineIpc } from './livingOutlineIpc.js';
import { registerStoryIntelligenceIpc } from './storyIntelligenceIpc.js';
import { registerManuscriptStructureIpc } from './manuscriptStructureIpc.js';
import {
  getCritiqueReviewSurfaceState,
  reconcileCritiqueReviewAuthority,
  registerCritiqueReviewIpc,
} from './critiqueReviewIpc.js';
import {
  CRITIQUE_REVIEW_CHANNELS,
  type CritiqueReviewSourceReturnMessageV1,
  type CritiqueReviewSurfaceStateV1,
} from '../shared/ipc/contextualProductShell.js';
import {
  clearPendingCloseRequest,
  consumeCoordinatedCloseAllowance,
  createPendingCloseRequest,
  hasPendingCloseRequest,
} from './closeConfirmationCoordinator.js';

function resolveProjectRoot(): string {
  const immediate = resolve(__dirname, '..');
  const candidates = [
    immediate,
    resolve(immediate, '..', 'app'),
    resolve(immediate, '..'),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'dist', 'index.html'))) {
      return candidate;
    }
  }
  return immediate;
}

const projectRoot = resolveProjectRoot();
const STAGE19_STARTUP_PROBE_KEY = Symbol.for('blackskies.stage19.internal.startupProbe');
const stage19StartupProbeStartedAt =
  process.env.STAGE19_INTERNAL_STARTUP_PROBE === '1' ? process.hrtime.bigint() : null;
const stage19StartupProbe = stage19StartupProbeStartedAt
  ? {
      schema: 'black-skies.stage19.internal-startup-probe.v1',
      writingVisibleMs: null as number | null,
      commandVisibleMs: null as number | null,
      twoWindowVisibleMs: null as number | null,
    }
  : null;

if (stage19StartupProbe) {
  Object.defineProperty(globalThis, STAGE19_STARTUP_PROBE_KEY, {
    configurable: false,
    enumerable: false,
    value: stage19StartupProbe,
    writable: false,
  });
}

function recordStage19StartupWindowVisible(role: 'writing' | 'command'): void {
  if (!stage19StartupProbe || !stage19StartupProbeStartedAt) {
    return;
  }
  const elapsedMs = Number(process.hrtime.bigint() - stage19StartupProbeStartedAt) / 1_000_000;
  if (role === 'writing') {
    stage19StartupProbe.writingVisibleMs ??= elapsedMs;
  } else {
    stage19StartupProbe.commandVisibleMs ??= elapsedMs;
  }
  if (
    stage19StartupProbe.twoWindowVisibleMs === null &&
    stage19StartupProbe.writingVisibleMs !== null &&
    stage19StartupProbe.commandVisibleMs !== null
  ) {
    stage19StartupProbe.twoWindowVisibleMs = Math.max(
      stage19StartupProbe.writingVisibleMs,
      stage19StartupProbe.commandVisibleMs,
    );
  }
}

if (process.env.PLAYWRIGHT !== '1') {
  process.on('exit', (code) => {
    console.log('[main] Process exiting with code', code);
  });
  process.on('uncaughtException', (error) => {
    console.error('[main] Uncaught exception', error);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[main] Unhandled rejection', reason);
  });
}
const repoRoot = resolve(projectRoot, '..');
const runtimeConfig = loadRuntimeConfig(
  process.env.BLACKSKIES_CONFIG_PATH ?? join(repoRoot, 'config', 'runtime.yaml'),
);
const projectSpineOriginSessionId = randomUUID();
const dedicatedStage19HostEnabled = shouldEnableDedicatedStage19Host(
  app.isPackaged,
  runtimeConfig.ui.experimentalSplitCommandWorkspace,
);
const splitCommandLifecycleSeam: SplitCommandLifecycleSeam | null =
  createSplitCommandLifecycleSeam({
    experimentalEnabled: dedicatedStage19HostEnabled,
    sessionGeneration: randomUUID(),
    onClear: clearSplitCommandPairRuntimeReferences,
  });
let splitCommandSecondaryLaunchContract: SplitCommandSecondaryLaunchContract | null = null;
const allowedPythonExecutables = runtimeConfig.service.allowedPythonExecutables.map((entry) =>
  entry.toLowerCase(),
);
const bundledPythonPath = runtimeConfig.service.bundledPythonPath ?? '';
const rendererDistDir = join(projectRoot, 'dist');
const rendererIndexFile = join(rendererDistDir, 'index.html');
const LEGACY_PRELOAD_PATH = join(__dirname, 'preload.js');
const STAGE19_PRELOAD_PATH = join(__dirname, 'stage19Preload.js');
const ACTIVE_PRELOAD_PATH = app.isPackaged
  ? STAGE19_PRELOAD_PATH
  : LEGACY_PRELOAD_PATH;

const explicitRendererUrl =
  process.env.VITE_DEV_SERVER_URL?.trim() || process.env.ELECTRON_RENDERER_URL?.trim() || null;
const isDev = Boolean(explicitRendererUrl?.startsWith('http://') || explicitRendererUrl?.startsWith('https://'));
const isPlaywright = process.env.PLAYWRIGHT === '1';
const shouldSpawnServices = process.env.BLACKSKIES_FORCE_SERVICES === '1' || !isPlaywright;
const START_URL = getStartUrl();

function getStartUrl(): string {
  if (explicitRendererUrl) {
    return explicitRendererUrl;
  }
  if (existsSync(rendererIndexFile)) {
    return pathToFileURL(rendererIndexFile).toString();
  }
  throw new Error(
    `Built renderer entry is unavailable at ${rendererIndexFile}. ` +
      'Run the renderer build or set VITE_DEV_SERVER_URL explicitly for development.',
  );
}

const SERVICES_HOST = '127.0.0.1';
const PORT_RANGE_ENV = process.env.BLACKSKIES_SERVICE_PORT_RANGE;
const DEFAULT_PYTHON_EXECUTABLE = 'python';
const RESOLVED_PORT_RANGE = resolvePortRange(
  PORT_RANGE_ENV,
  runtimeConfig.service.portRange ?? DEFAULT_SERVICE_PORT_RANGE,
);
const PYTHON_EXECUTABLE = shouldResolveLegacyPython(app.isPackaged)
  ? resolvePythonExecutable()
  : null;

let mainWindow: BrowserWindow | null = null;
let splitCommandSecondaryWindow: BrowserWindow | null = null;
const projectSpineWindows = new Map<
  number,
  { readonly role: ProjectSpineWindowRole; readonly window: BrowserWindow }
>();

let splitCommandPairTeardownInProgress = false;
let splitCommandSecondaryReturnInProgress = false;
let primaryLogicalSurface: SplitCommandLogicalSurface = 'writing';
let secondarySurfaceStatus: SplitCommandSecondarySurfaceStatus = 'closed';
let surfaceHostNotice: SplitCommandSurfaceHostNotice = null;
type ServicesProcess = ChildProcessByStdio<null, Readable, Readable>;

let servicesProcess: ServicesProcess | null = null;
let shuttingDown = false;
let coordinatedCloseShutdownInProgress = false;
let mainLogger: Logger | null = null;
let servicesSuppressed = false;

function parseEnvInteger(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const healthProbeDefaults = runtimeConfig.service.healthProbe ?? DEFAULT_HEALTH_PROBE;
const HEALTH_MAX_ATTEMPTS = parseEnvInteger(
  'BLACKSKIES_HEALTH_MAX_ATTEMPTS',
  healthProbeDefaults.maxAttempts,
);
const HEALTH_BASE_DELAY_MS = parseEnvInteger(
  'BLACKSKIES_HEALTH_BASE_DELAY_MS',
  healthProbeDefaults.baseDelayMs,
);
const HEALTH_MAX_DELAY_MS = parseEnvInteger(
  'BLACKSKIES_HEALTH_MAX_DELAY_MS',
  healthProbeDefaults.maxDelayMs,
);
const HEALTH_ATTEMPT_TIMEOUT_MS = parseEnvInteger(
  'BLACKSKIES_HEALTH_ATTEMPT_TIMEOUT_MS',
  5_000,
);

function resolvePortRange(value: string | undefined, fallback: ServicePortRange): ServicePortRange {
  if (!value) {
    return fallback;
  }
  const [minRaw, maxRaw] = value.split('-', 2);
  const min = Number.parseInt(minRaw ?? '', 10);
  const max = Number.parseInt(maxRaw ?? '', 10);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min || max > 65535) {
    console.warn('[main] Invalid BLACKSKIES_SERVICE_PORT_RANGE; falling back to defaults.');
    return fallback;
  }
  return { min, max };
}

function resolvePythonExecutable(): string {
  if (requiresBundledPython(app.isPackaged, bundledPythonPath)) {
    return fallbackPythonExecutable();
  }

  const override = process.env.BLACKSKIES_PYTHON;
  if (!override) {
    return fallbackPythonExecutable();
  }
  const normalized = normalize(override);
  if (!isAbsolute(normalized)) {
    console.warn('[main] Ignoring BLACKSKIES_PYTHON because it is not an absolute path.');
    return fallbackPythonExecutable();
  }
  try {
    const stats = statSync(normalized);
    if (!stats.isFile()) {
      console.warn('[main] Ignoring BLACKSKIES_PYTHON because it does not point to a file.');
      return fallbackPythonExecutable();
    }
  } catch (error) {
    console.warn('[main] Ignoring BLACKSKIES_PYTHON because the path is inaccessible.', error);
    return fallbackPythonExecutable();
  }
  const base = basename(normalized).toLowerCase();
  if (allowedPythonExecutables.length > 0 && !allowedPythonExecutables.includes(base)) {
    console.warn('[main] BLACKSKIES_PYTHON is not in the allowed interpreter list.');
    return fallbackPythonExecutable();
  }
  if (!base.startsWith('python')) {
    console.warn('[main] BLACKSKIES_PYTHON does not appear to reference a Python binary.');
  }
  return normalized;
}

function fallbackPythonExecutable(): string {
  if (bundledPythonPath) {
    const resolvedBundled = resolveBundledExecutablePath(bundledPythonPath);
    if (resolvedBundled) {
    if (existsSync(resolvedBundled)) {
      try {
        if (statSync(resolvedBundled).isFile()) {
          return resolvedBundled;
        }
      } catch (error) {
        console.warn('[main] Bundled Python path probe failed; ignoring.', error);
      }
    } else if (app.isPackaged) {
      console.warn('[main] Bundled Python path is not accessible or missing.', {
        path: resolvedBundled,
      });
    }
    } else if (bundledPythonPath.includes('{{APP_RESOURCES}}')) {
      console.warn('[main] Unable to resolve bundled Python placeholder path.');
    }
  }
  return DEFAULT_PYTHON_EXECUTABLE;
}

function ensureMainLogger(): Logger {
  if (!mainLogger) {
    mainLogger = getLogger('main.process');
  }
  return mainLogger;
}

function getSplitCommandWindowForRole(windowRole: SplitCommandWindowRole): BrowserWindow | null {
  if (windowRole === 'primary') {
    return mainWindow;
  }
  return splitCommandSecondaryWindow;
}

function registerProjectSpineWindow(
  window: BrowserWindow,
  role: ProjectSpineWindowRole,
): () => boolean {
  const webContentsId = window.webContents.id;
  projectSpineWindows.set(webContentsId, { role, window });
  let registered = true;
  return () => {
    if (!registered) {
      return false;
    }
    registered = false;
    return projectSpineWindows.delete(webContentsId);
  };
}

function resolveProjectSpineWindowRole(webContentsId: number): ProjectSpineWindowRole | null {
  return projectSpineWindows.get(webContentsId)?.role ?? null;
}

function publishProjectSpineSession(): void {
  invalidateAllAiCritiqueArtifacts();
  reconcileCritiqueReviewAuthority();
  for (const registration of projectSpineWindows.values()) {
    if (
      registration.window.isDestroyed() ||
      registration.window.webContents.isDestroyed()
    ) {
      continue;
    }
    registration.window.webContents.send(
      PROJECT_SPINE_CHANNELS.sessionChanged,
      getProjectSpineSnapshot(registration.role),
    );
  }
  publishSplitCommandSurfaceHostState();
}

function publishCritiqueReviewState(state: CritiqueReviewSurfaceStateV1): void {
  for (const registration of projectSpineWindows.values()) {
    if (
      registration.window.isDestroyed() ||
      registration.window.webContents.isDestroyed()
    ) continue;
    registration.window.webContents.send(CRITIQUE_REVIEW_CHANNELS.stateChanged, state);
  }
}

function returnToCritiqueSource(message: CritiqueReviewSourceReturnMessageV1): void {
  primaryLogicalSurface = 'writing';
  publishSplitCommandSurfaceHostState();
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.focus();
  mainWindow.webContents.send(CRITIQUE_REVIEW_CHANNELS.sourceReturnRequested, message);
}

function installUnsavedCloseGuard(window: BrowserWindow): void {
  window.webContents.on('will-prevent-unload', (event) => {
    if (consumeCoordinatedCloseAllowance()) {
      event.preventDefault();
      return;
    }
    if (coordinatedCloseShutdownInProgress) {
      return;
    }
    const snapshot = getProjectSpineSnapshot('writing');
    const writingStudio = mainWindow;
    if (
      !snapshot.project?.projectId ||
      snapshot.dirtyUnitIds.length === 0 ||
      !writingStudio ||
      writingStudio.isDestroyed() ||
      writingStudio.webContents.isDestroyed()
    ) {
      return;
    }
    if (hasPendingCloseRequest()) return;
    const request = createPendingCloseRequest(
      snapshot.project.projectId,
      snapshot.generation,
      writingStudio.webContents.id,
    );
    if (!request) return;
    try {
      writingStudio.webContents.send(PROJECT_SPINE_CHANNELS.closeConfirmationRequest, request);
    } catch (error) {
      clearPendingCloseRequest();
      ensureMainLogger().warn('Unable to dispatch close confirmation to Writing Studio', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

function buildSplitCommandOwnershipSyncForRole(
  windowRole: SplitCommandWindowRole,
): SplitCommandOwnershipSyncMessage | null {
  if (!splitCommandLifecycleSeam) {
    return null;
  }
  if (splitCommandLifecycleSeam.registry.fallbackState.pairHealthStatus === 'cleared') {
    return null;
  }

  return buildSplitCommandOwnershipSyncMessage({
    activePairIdentity: splitCommandLifecycleSeam.registry.pairIdentity,
    claimedPairIdentity: splitCommandLifecycleSeam.runtimeContext.pairIdentity,
    windowRole,
    fallbackState: splitCommandLifecycleSeam.registry.fallbackState,
  });
}

function publishSplitCommandOwnershipSync(
  targetRoles: readonly SplitCommandWindowRole[],
): void {
  if (!splitCommandLifecycleSeam || targetRoles.length === 0) {
    return;
  }

  for (const windowRole of targetRoles) {
    const targetWindow = getSplitCommandWindowForRole(windowRole);
    if (!targetWindow || targetWindow.isDestroyed()) {
      continue;
    }

    const message = buildSplitCommandOwnershipSyncForRole(windowRole);
    if (!message) {
      continue;
    }

    targetWindow.webContents.send(SPLIT_COMMAND_CHANNELS.ownershipSync, message);
  }
}

function readSplitCommandWebContentsId(window: BrowserWindow | null): number | null {
  if (!window) return null;
  try {
    if (window.isDestroyed() || window.webContents.isDestroyed()) {
      return null;
    }
    const id = window.webContents.id;
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

function resolveSplitCommandSenderRole(
  senderWindow: BrowserWindow | null,
  senderWebContentsId?: number,
): SplitCommandWindowRole | null {
  // BrowserWindow wrappers returned by fromWebContents are not guaranteed to
  // preserve object identity across Electron's Windows implementation. The
  // webContents id is the stable identity for the lifetime of the renderer.
  const senderId = Number.isInteger(senderWebContentsId)
    ? senderWebContentsId
    : readSplitCommandWebContentsId(senderWindow);
  if (senderId === null) return null;
  if (senderId === readSplitCommandWebContentsId(mainWindow)) return 'primary';
  if (senderId === readSplitCommandWebContentsId(splitCommandSecondaryWindow)) {
    return 'secondary';
  }
  return null;
}

function buildSplitCommandSurfaceHostState(): SplitCommandSurfaceHostState | null {
  if (!splitCommandLifecycleSeam || !splitCommandLifecycleSeam.registry.isActive) {
    return null;
  }
  const commandSnapshot = getProjectSpineSnapshot('command');
  const secondaryWindowOpen = Boolean(
    splitCommandSecondaryWindow && !splitCommandSecondaryWindow.isDestroyed(),
  );
  return {
    schemaVersion: 1,
    primarySurface: primaryLogicalSurface,
    commandPlacement:
      secondaryWindowOpen || secondarySurfaceStatus === 'opening'
        ? 'secondary-window'
        : 'current-window',
    secondaryStatus: secondaryWindowOpen ? 'open' : secondarySurfaceStatus,
    notice: surfaceHostNotice,
    projectId: commandSnapshot.project?.projectId ?? null,
    generation: commandSnapshot.generation,
    revision: commandSnapshot.revision,
    commandSnapshot,
  };
}

function publishSplitCommandSurfaceHostState(
  targetRoles: readonly SplitCommandWindowRole[] = ['primary', 'secondary'],
): void {
  const state = buildSplitCommandSurfaceHostState();
  if (!state) return;
  for (const windowRole of targetRoles) {
    const targetWindow = getSplitCommandWindowForRole(windowRole);
    if (
      !targetWindow ||
      targetWindow.isDestroyed() ||
      targetWindow.webContents.isDestroyed()
    ) continue;
    targetWindow.webContents.send(SPLIT_COMMAND_CHANNELS.surfaceHostChanged, state);
  }
}

function surfaceHostFailure(
  code: SplitCommandSurfaceHostErrorCode,
  message: string,
): SplitCommandSurfaceHostResult | null {
  const state = buildSplitCommandSurfaceHostState();
  return state ? { ok: false, error: { code, message }, state } : null;
}

function validateSurfaceHostRequest(
  request: unknown,
  senderRole: SplitCommandWindowRole,
): SplitCommandSurfaceHostResult | null {
  if (!request || typeof request !== 'object') {
    return surfaceHostFailure('INVALID_REQUEST', 'Surface request is malformed.');
  }
  const candidate = request as Partial<ActivateSplitCommandSurfaceRequest>;
  if (
    typeof candidate.operationId !== 'string' ||
    candidate.operationId.trim().length === 0 ||
    (candidate.projectId !== null && typeof candidate.projectId !== 'string') ||
    !Number.isInteger(candidate.generation) ||
    (candidate.targetSurface !== 'writing' && candidate.targetSurface !== 'command') ||
    (candidate.placement !== 'current-window' && candidate.placement !== 'secondary-window') ||
    (candidate.targetSurface === 'writing' && candidate.placement !== 'current-window')
  ) {
    return surfaceHostFailure('INVALID_REQUEST', 'Surface request fields are invalid.');
  }
  if (
    senderRole === 'secondary' &&
    !(candidate.targetSurface === 'writing' && candidate.placement === 'current-window')
  ) {
    return surfaceHostFailure(
      'WRONG_WINDOW_ROLE',
      'The secondary Command window may only return control to Writing Studio.',
    );
  }
  const writingSnapshot = getProjectSpineSnapshot('writing');
  if ((writingSnapshot.project?.projectId ?? null) !== candidate.projectId) {
    return surfaceHostFailure('STALE_PROJECT', 'The active project changed before the surface request.');
  }
  if (writingSnapshot.generation !== candidate.generation) {
    return surfaceHostFailure(
      'STALE_GENERATION',
      'The project generation changed before the surface request.',
    );
  }
  return null;
}

function registerSplitCommandOwnershipIpc(): void {
  ipcMain.removeHandler(SPLIT_COMMAND_CHANNELS.requestOwnershipSync);
  ipcMain.removeHandler(SPLIT_COMMAND_CHANNELS.requestSurfaceHostState);
  ipcMain.removeHandler(SPLIT_COMMAND_CHANNELS.activateSurface);
  ipcMain.handle(SPLIT_COMMAND_CHANNELS.requestOwnershipSync, (event) => {
    if (!splitCommandLifecycleSeam) {
      return null;
    }

    const windowRole = resolveSplitCommandSenderRole(null, event.sender.id);
    if (!windowRole) {
      return null;
    }

    return buildSplitCommandOwnershipSyncForRole(windowRole);
  });
  ipcMain.handle(SPLIT_COMMAND_CHANNELS.requestSurfaceHostState, (event) => {
    const senderRole = resolveSplitCommandSenderRole(null, event.sender.id);
    const state = senderRole ? buildSplitCommandSurfaceHostState() : null;
    if (!state) {
      console.warn('[main] Split command surface-host state unavailable', {
        senderWebContentsId: event.sender.id,
        senderRole,
        primaryWebContentsId: readSplitCommandWebContentsId(mainWindow),
        secondaryWebContentsId: readSplitCommandWebContentsId(splitCommandSecondaryWindow),
        seamEnabled: Boolean(splitCommandLifecycleSeam),
        registryActive: splitCommandLifecycleSeam?.registry.isActive ?? false,
        primaryWindowRegistered: splitCommandLifecycleSeam?.registry.primaryWindowRegistered ?? false,
      });
    }
    return state;
  });
  ipcMain.handle(SPLIT_COMMAND_CHANNELS.activateSurface, async (event, request: unknown) => {
    const senderRole = resolveSplitCommandSenderRole(null, event.sender.id);
    if (!senderRole) {
      return surfaceHostFailure(
        'WRONG_WINDOW_ROLE',
        'This window is not part of the active Writing/Command surface host.',
      );
    }
    const invalid = validateSurfaceHostRequest(request, senderRole);
    if (invalid) return invalid;
    return activateSplitCommandSurface(request as ActivateSplitCommandSurfaceRequest);
  });
}

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => {
      server.close();
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, SERVICES_HOST);
  });
}

async function selectServicePort(): Promise<number> {
  const { min, max } = RESOLVED_PORT_RANGE;
  const candidates = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }

  for (const candidate of candidates) {
    const available = await isPortAvailable(candidate);
    if (available) {
      return candidate;
    }
  }

  throw new Error(`Unable to find an available port between ${min} and ${max}.`);
}

function resolveBundledExecutablePath(rawPath: string): string | null {
  const candidate = rawPath.trim();
  if (!candidate) {
    return null;
  }

  const resourcesPath =
    (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath ??
    process.env.BLACKSKIES_PACKAGE_RESOURCES ??
    null;

  let resolved = candidate;
  if (resolved.includes('{{APP_RESOURCES}}')) {
    if (!resourcesPath) {
      return null;
    }
    resolved = resolved.replace(/\{\{APP_RESOURCES\}\}/g, resourcesPath);
  }

  if (!isAbsolute(resolved)) {
    if (resourcesPath && !isDev) {
      resolved = resolve(resourcesPath, resolved);
    } else {
      resolved = resolve(repoRoot, resolved);
    }
  }

  return normalize(resolved);
}

function pipeStreamToLogger(
  stream: NodeJS.ReadableStream,
  logger: Logger,
  level: LogLevel,
  source: 'stdout' | 'stderr',
): void {
  let buffer = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk: string) => {
    buffer += chunk;
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
      buffer = buffer.slice(newlineIndex + 1);
      if (line.trim().length > 0) {
        logWithLevel(logger, level, line, { source });
      }
      newlineIndex = buffer.indexOf('\n');
    }
  });
  stream.on('end', () => {
    const remaining = buffer.trim();
    if (remaining.length > 0) {
      logWithLevel(logger, level, remaining, { source, partial: true });
    }
  });
}

async function waitForServicesHealthy(port: number): Promise<void> {
  const logger = ensureMainLogger();
  const url = `http://${SERVICES_HOST}:${port}/api/v1/healthz`;
  const maxAttempts = HEALTH_MAX_ATTEMPTS;
  let delayMs = HEALTH_BASE_DELAY_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), HEALTH_ATTEMPT_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const traceId = response.headers.get('x-trace-id') ?? undefined;
      if (!response.ok) {
        logger.warn('Health probe returned non-OK status', {
          attempt,
          status: response.status,
          traceId,
        });
      } else {
        try {
          const payload = (await response.json()) as { status?: string };
          if (payload?.status === 'ok') {
            return;
          }
          logger.warn('Health probe responded with unexpected payload', {
            attempt,
            payload,
            traceId,
          });
        } catch (parseError) {
          logger.warn('Health probe returned unreadable payload', {
            attempt,
            traceId,
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Health probe timed out', { attempt, timeoutMs: HEALTH_ATTEMPT_TIMEOUT_MS });
      } else {
        logger.debug('Health probe failed', {
          attempt,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      clearTimeout(timeoutHandle);
    }

    await delay(delayMs);
    delayMs = Math.min(HEALTH_MAX_DELAY_MS, Math.round(delayMs * 1.5));
  }

  throw new Error('FastAPI services did not become healthy within the allotted time.');
}

function resolvePythonModulePath(): string {
  if (!app.isPackaged) {
    return resolve(projectRoot, '..', 'services', 'src');
  }
  return join(process.resourcesPath, 'python');
}

function buildPythonEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const modulePath = resolvePythonModulePath();
  const segments = [modulePath];
  if (env.PYTHONPATH && env.PYTHONPATH.length > 0) {
    segments.push(env.PYTHONPATH);
  }
  env.PYTHONPATH = segments.join(delimiter);
  env.BLACKSKIES_PYTHONPATH = modulePath;
  if (app.isPackaged) {
    env.BLACKSKIES_PACKAGE_RESOURCES = process.resourcesPath;
  }
  return env;
}

function resolveServicesCwd(): string {
  if (app.isPackaged) {
    return process.resourcesPath;
  }
  return resolve(projectRoot, '..');
}

async function startServices(): Promise<void> {
  if (servicesProcess) {
    return;
  }
  if (!shouldStartLegacyServices(app.isPackaged)) {
    ensureMainLogger().info('Legacy Python services are disabled in the packaged Stage 19 host.');
    servicesProcess = null;
    delete process.env.BLACKSKIES_SERVICES_PORT;
    return;
  }

  const configuredServicePortRaw = process.env.BLACKSKIES_SERVICES_PORT;
  const configuredServicePort = resolveConfiguredServicePort();
  if (configuredServicePortRaw && configuredServicePort === null) {
    throw new Error(
      'BLACKSKIES_SERVICES_PORT must be a valid TCP port number when using an external backend.',
    );
  }
  if (configuredServicePort !== null) {
    const logger = ensureMainLogger();
    servicesProcess = null;
    logger.info('Using externally managed FastAPI services', {
      port: configuredServicePort,
      source: 'BLACKSKIES_SERVICES_PORT',
    });
    console.log('[main] Using external FastAPI services', {
      port: configuredServicePort,
      source: 'BLACKSKIES_SERVICES_PORT',
    });
    try {
      await waitForServicesHealthy(configuredServicePort);
      logger.info('External FastAPI services are healthy', { port: configuredServicePort });
    } catch (error) {
      logger.error('External FastAPI services failed health verification', {
        port: configuredServicePort,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof Error ? error : new Error(String(error));
    }
    return;
  }

  if (!shouldSpawnServices) {
    console.log('[main] Skipping service spawn (PLAYWRIGHT=1).');
    if (!servicesSuppressed) {
      ensureMainLogger().info('Skipping FastAPI services spawn because PLAYWRIGHT=1.');
      servicesSuppressed = true;
    }
    servicesProcess = null;
    if (process.env.BLACKSKIES_E2E_MODE === '1' && process.env.BLACKSKIES_E2E_PORT) {
      process.env.BLACKSKIES_SERVICES_PORT = process.env.BLACKSKIES_E2E_PORT;
    } else {
      delete process.env.BLACKSKIES_SERVICES_PORT;
    }
    console.log('[main] Playwright ports', {
      BLACKSKIES_SERVICES_PORT: process.env.BLACKSKIES_SERVICES_PORT,
      BLACKSKIES_E2E_PORT: process.env.BLACKSKIES_E2E_PORT,
    });
    return;
  }

  const logger = ensureMainLogger();
  const port = await selectServicePort();
  const args = ['-m', 'blackskies.services', '--host', SERVICES_HOST, '--port', String(port)];

  logger.info('Spawning FastAPI services', {
    executable: PYTHON_EXECUTABLE,
    args,
    port,
  });

  if (!PYTHON_EXECUTABLE) {
    throw new Error('Legacy Python executable is unavailable in the packaged Stage 19 host.');
  }
  const child = spawn(PYTHON_EXECUTABLE, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: buildPythonEnv(),
    cwd: resolveServicesCwd(),
  });

  const spawnPromise = new Promise<void>((resolve, reject) => {
    child.once('spawn', () => resolve());
    child.once('error', (error) => reject(error));
  });

  const stdoutLogger = getLogger('services.stdout', 'service');
  const stderrLogger = getLogger('services.stderr', 'service');

  if (child.stdout) {
    pipeStreamToLogger(child.stdout, stdoutLogger, 'info', 'stdout');
  }
  if (child.stderr) {
    pipeStreamToLogger(child.stderr, stderrLogger, 'error', 'stderr');
  }

  child.on('exit', (code, signal) => {
    const exitDetails = { code, signal, port, pid: child.pid };
    const exitLogger = ensureMainLogger();
    if (servicesProcess === child) {
      servicesProcess = null;
      delete process.env.BLACKSKIES_SERVICES_PORT;
    }

    exitLogger.info('FastAPI services exited', exitDetails);

    if (!shuttingDown) {
      exitLogger.error('FastAPI services terminated unexpectedly', exitDetails);
    }
  });

  try {
    await spawnPromise;
  } catch (error) {
    logger.error('Failed to spawn FastAPI services', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error instanceof Error ? error : new Error(String(error));
  }

  servicesProcess = child;
  process.env.BLACKSKIES_SERVICES_PORT = String(port);

  try {
    await waitForServicesHealthy(port);
    logger.info('FastAPI services are healthy', { port, pid: child.pid });
  } catch (error) {
    logger.error('FastAPI services failed health verification', {
      port,
      error: error instanceof Error ? error.message : String(error),
    });
    await stopServices();
    throw error instanceof Error ? error : new Error(String(error));
  }
}

async function stopServices(): Promise<void> {
  const child = servicesProcess;
  if (!child) {
    return;
  }

  const logger = ensureMainLogger();
  servicesProcess = null;
  delete process.env.BLACKSKIES_SERVICES_PORT;

  logger.info('Stopping FastAPI services', { pid: child.pid });

  const exitPromise = once(child, 'exit') as Promise<[
    number | null,
    NodeJS.Signals | null,
  ]>;

  const terminated = child.kill('SIGTERM');

  let exitResult: [number | null, NodeJS.Signals | null] | null = null;

  if (terminated) {
    const raceResult = await Promise.race<
      [number | null, NodeJS.Signals | null] | 'timeout'
    >([
      exitPromise,
      delay(2_000).then(() => 'timeout'),
    ]);

    if (raceResult === 'timeout') {
      if (child.exitCode === null && child.signalCode === null) {
        if (process.platform !== 'win32') {
          logger.warn('Escalating FastAPI services termination', { pid: child.pid });
          child.kill('SIGKILL');
        }
        exitResult = await exitPromise;
      } else {
        exitResult = [child.exitCode, child.signalCode];
      }
    } else {
      exitResult = raceResult;
    }
  } else {
    logger.warn('Failed to deliver SIGTERM to FastAPI services', { pid: child.pid });
    if (process.platform !== 'win32') {
      child.kill('SIGKILL');
    }
    exitResult = await exitPromise;
  }

  logger.info('FastAPI services stopped', {
    pid: child.pid,
    code: exitResult?.[0] ?? child.exitCode,
    signal: exitResult?.[1] ?? child.signalCode,
  });
}

function resolveDiagnosticsDirectory(): string | null {
  const logPath = getDiagnosticsLogFilePath();
  if (!logPath) {
    return null;
  }
  return dirname(logPath);
}

function registerDiagnosticsIpc(): void {
  ipcMain.removeHandler(DIAGNOSTICS_CHANNELS.openHistory);
  ipcMain.handle(
    DIAGNOSTICS_CHANNELS.openHistory,
    async (): Promise<DiagnosticsOpenResult> => {
      const directory = resolveDiagnosticsDirectory();
      if (!directory) {
        return {
          ok: false,
          error: 'Diagnostics folder is not available yet.',
        };
      }

      try {
        const result = await shell.openPath(directory);
        if (typeof result === 'string' && result.length > 0) {
          return { ok: false, error: result };
        }
        return { ok: true, path: directory };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
}

function installNavigationGuard(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  const allowedOrigins = new Set<string>();
  if (isDev) {
    try {
      allowedOrigins.add(new URL(START_URL).origin);
    } catch (error) {
      ensureMainLogger().warn('Failed to parse development server URL', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  window.webContents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith('file://')) {
      return;
    }
    let origin: string | null = null;
    try {
      origin = new URL(navigationUrl).origin;
    } catch {
      origin = null;
    }
    if (!origin || !allowedOrigins.has(origin)) {
      event.preventDefault();
    }
  });
}

async function createMainWindow(initialBounds?: InitialWindowBounds): Promise<BrowserWindow> {
  console.log('[main] Creating main window. projectRoot=', projectRoot);
  const windowOptions = {
    title: 'Black Skies — Writing Studio',
    width: initialBounds?.width ?? 1280,
    height: initialBounds?.height ?? 840,
    x: initialBounds?.x,
    y: initialBounds?.y,
    minWidth: 640,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    env: { ...process.env, PLAYWRIGHT: '1' },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: app.isPackaged,
      preload: ACTIVE_PRELOAD_PATH,
      additionalArguments: splitCommandLifecycleSeam
        ? [...splitCommandLifecycleSeam.launchArguments]
        : [],
    },
  } as BrowserWindowConstructorOptions & { env?: NodeJS.ProcessEnv };
  const window = new BrowserWindow(windowOptions);
  const unregisterProjectSpineWindow = registerProjectSpineWindow(window, 'writing');
  // The renderer can ask for its surface-host state as soon as loading starts.
  // Establish the primary host before loadURL so that first request receives
  // the same authoritative state as every later request.
  mainWindow = window;
  if (splitCommandLifecycleSeam && !splitCommandLifecycleSeam.registry.primaryWindowRegistered) {
    splitCommandLifecycleSeam.registry.registerPrimaryWindow();
    recordSplitCommandFocusOwnership('primary');
  }
  primaryLogicalSurface = 'writing';
  secondarySurfaceStatus = 'closed';
  surfaceHostNotice = null;
  installUnsavedCloseGuard(window);

  installNavigationGuard(window);

  window.on('ready-to-show', () => {
    window.show();
    recordStage19StartupWindowVisible('writing');
  });

  window.on('closed', () => {
    console.log('[main] Writing Studio closed', {
      hasSplitCommandLifecycleSeam: Boolean(splitCommandLifecycleSeam),
      secondaryWindowId: splitCommandSecondaryWindow?.id ?? null,
      secondaryWindowDestroyed: splitCommandSecondaryWindow?.isDestroyed() ?? null,
    });
    try {
      noteSplitCommandPrimaryCollapse('closed');
    } catch (error) {
      console.error('[main] Writing Studio pair cleanup failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      unregisterProjectSpineWindow();
      console.log('[main] Writing Studio pair cleanup completed', {
        secondaryWindowId: splitCommandSecondaryWindow?.id ?? null,
        secondaryWindowDestroyed: splitCommandSecondaryWindow?.isDestroyed() ?? null,
      });
      if (mainWindow === window) {
        mainWindow = null;
      }
    }
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] Renderer process gone', details);
    noteSplitCommandPrimaryCollapse('crashed', details);
  });
  window.on('unresponsive', () => {
    console.error('[main] BrowserWindow became unresponsive.');
  });

  console.log('[main] loading', START_URL);
  try {
    await window.loadURL(START_URL);
  } catch (error) {
    ensureMainLogger().warn('Failed to load renderer URL', {
      error: error instanceof Error ? error.message : String(error),
      url: START_URL,
    });
    if (START_URL !== rendererIndexFile) {
      try {
        await window.loadFile(rendererIndexFile);
      } catch (innerError) {
        ensureMainLogger().warn('Fallback loadFile failed', {
          error: innerError instanceof Error ? innerError.message : String(innerError),
          path: rendererIndexFile,
        });
      }
    }
  }

  if (!app.isPackaged && !isPlaywright) {
    window.webContents.openDevTools({ mode: 'detach' });
  }

  return window;
}

async function createSplitCommandSecondaryWindow(
  contract: SplitCommandSecondaryLaunchContract,
  initialBounds?: InitialWindowBounds,
): Promise<BrowserWindow> {
  console.log('[main] Creating split command secondary window. projectRoot=', projectRoot);
  const windowOptions = {
    title: 'Black Skies — Command Center',
    width: initialBounds?.width ?? 1280,
    height: initialBounds?.height ?? 840,
    x: initialBounds?.x,
    y: initialBounds?.y,
    minWidth: 640,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    env: { ...process.env, PLAYWRIGHT: '1' },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: app.isPackaged,
      preload: ACTIVE_PRELOAD_PATH,
      additionalArguments: [...contract.launchArguments],
    },
  } as BrowserWindowConstructorOptions & { env?: NodeJS.ProcessEnv };
  const window = new BrowserWindow(windowOptions);
  const unregisterProjectSpineWindow = registerProjectSpineWindow(window, 'command');

  installNavigationGuard(window);
  window.on('ready-to-show', () => {
    window.show();
    recordStage19StartupWindowVisible('command');
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] Split command secondary renderer gone', details);
    noteSplitCommandSecondaryLoss('crashed', details);
  });
  window.on('unresponsive', () => {
    console.error('[main] Split command secondary BrowserWindow became unresponsive.');
  });
  window.on('closed', () => {
    unregisterProjectSpineWindow();
    if (splitCommandPairTeardownInProgress || splitCommandSecondaryReturnInProgress) {
      if (splitCommandSecondaryWindow === window) {
        splitCommandSecondaryWindow = null;
      }
      splitCommandSecondaryLaunchContract = null;
      splitCommandLifecycleSeam?.registry.releaseSecondaryWindow();
      return;
    }
    try {
      noteSplitCommandSecondaryLoss('closed');
    } catch (error) {
      console.error('[main] Command Center loss diagnostics failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  console.log('[main] loading split command secondary', START_URL);
  try {
    await window.loadURL(START_URL);
  } catch (error) {
    ensureMainLogger().warn('Failed to load split command secondary renderer URL', {
      error: error instanceof Error ? error.message : String(error),
      url: START_URL,
    });
    if (START_URL !== rendererIndexFile) {
      try {
        await window.loadFile(rendererIndexFile);
      } catch (innerError) {
        ensureMainLogger().warn('Split command secondary fallback loadFile failed', {
          error: innerError instanceof Error ? innerError.message : String(innerError),
          path: rendererIndexFile,
        });
        window.destroy();
        throw innerError instanceof Error ? innerError : new Error(String(innerError));
      }
    } else {
      window.destroy();
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  return window;
}

function focusPrimarySurface(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.focus();
}

function closeSecondaryForPrimarySurface(
  nextPrimarySurface: SplitCommandLogicalSurface,
  notice: SplitCommandSurfaceHostNotice,
): void {
  primaryLogicalSurface = nextPrimarySurface;
  secondarySurfaceStatus = 'closed';
  surfaceHostNotice = notice;
  const secondaryWindow = splitCommandSecondaryWindow;
  splitCommandSecondaryReturnInProgress = true;
  try {
    if (secondaryWindow && !secondaryWindow.isDestroyed()) {
      secondaryWindow.close();
    }
  } finally {
    splitCommandSecondaryReturnInProgress = false;
    splitCommandSecondaryWindow = null;
    splitCommandSecondaryLaunchContract = null;
    splitCommandLifecycleSeam?.registry.releaseSecondaryWindow();
    if (
      splitCommandLifecycleSeam?.registry.isActive &&
      splitCommandLifecycleSeam.registry.fallbackState.pairHealthStatus !== 'healthy'
    ) {
      splitCommandLifecycleSeam.registry.prepareSecondaryRebuild();
    }
  }
  publishSplitCommandOwnershipSync(['primary']);
  publishSplitCommandSurfaceHostState(['primary']);
  focusPrimarySurface();
}

async function openSplitCommandSecondarySurface(
  initialBounds?: InitialWindowBounds,
): Promise<boolean> {
  if (!splitCommandLifecycleSeam) return false;
  if (splitCommandSecondaryWindow && !splitCommandSecondaryWindow.isDestroyed()) {
    splitCommandSecondaryWindow.show();
    splitCommandSecondaryWindow.focus();
    return true;
  }

  if (splitCommandLifecycleSeam.registry.fallbackState.pairHealthStatus !== 'healthy') {
    splitCommandLifecycleSeam.registry.prepareSecondaryRebuild();
    publishSplitCommandOwnershipSync(['primary']);
  }
  secondarySurfaceStatus = 'opening';
  surfaceHostNotice = null;
  publishSplitCommandSurfaceHostState(['primary']);

  try {
    splitCommandSecondaryLaunchContract =
      splitCommandLifecycleSeam.registry.createSecondaryLaunchContract();
    ensureMainLogger().info('Split command secondary launch contract prepared', {
      pairId: splitCommandSecondaryLaunchContract.pairIdentity.pairId,
      windowRole: splitCommandSecondaryLaunchContract.windowRole,
    });
    const secondaryWindow = await createSplitCommandSecondaryWindow(
      splitCommandSecondaryLaunchContract,
      initialBounds,
    );
    try {
      splitCommandLifecycleSeam.registry.registerSecondaryWindow();
      recordSplitCommandFocusOwnership('secondary');
    } catch (secondaryRegistrationError) {
      secondaryWindow.destroy();
      throw secondaryRegistrationError;
    }
    splitCommandSecondaryWindow = secondaryWindow;
    primaryLogicalSurface = 'writing';
    secondarySurfaceStatus = 'open';
    surfaceHostNotice = null;
    publishSplitCommandOwnershipSync(['primary', 'secondary']);
    publishSplitCommandSurfaceHostState(['primary', 'secondary']);
    ensureMainLogger().info('Split command secondary window launched', {
      pairId: splitCommandSecondaryLaunchContract.pairIdentity.pairId,
      windowRole: splitCommandSecondaryLaunchContract.windowRole,
    });
    return true;
  } catch (error) {
    noteSplitCommandSecondaryRebuildBlocked(error);
    splitCommandSecondaryLaunchContract = null;
    splitCommandSecondaryWindow = null;
    ensureMainLogger().warn('Split command secondary launch contract unavailable', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

async function activateSplitCommandSurface(
  request: ActivateSplitCommandSurfaceRequest,
): Promise<SplitCommandSurfaceHostResult | null> {
  if (request.targetSurface === 'writing') {
    primaryLogicalSurface = 'writing';
    surfaceHostNotice = null;
    publishSplitCommandSurfaceHostState();
    focusPrimarySurface();
    const state = buildSplitCommandSurfaceHostState();
    return state ? { ok: true, state } : null;
  }

  if (request.placement === 'current-window') {
    closeSecondaryForPrimarySurface('command', null);
    const state = buildSplitCommandSurfaceHostState();
    return state ? { ok: true, state } : null;
  }

  primaryLogicalSurface = 'command';
  surfaceHostNotice = null;
  const opened = await openSplitCommandSecondarySurface(
    deriveSplitCommandInitialPlacement(
      screen.getAllDisplays(),
      screen.getPrimaryDisplay(),
    ).commandCenter,
  );
  const currentSnapshot = getProjectSpineSnapshot('writing');
  if (
    (currentSnapshot.project?.projectId ?? null) !== request.projectId ||
    currentSnapshot.generation !== request.generation
  ) {
    if (opened) closeSecondaryForPrimarySurface('command', 'secondary-closed');
    return surfaceHostFailure(
      currentSnapshot.generation !== request.generation ? 'STALE_GENERATION' : 'STALE_PROJECT',
      'The active project changed while Command Center placement was opening.',
    );
  }
  if (!opened) {
    return surfaceHostFailure(
      'SECONDARY_UNAVAILABLE',
      'Command Center could not open in a second window and remains available here.',
    );
  }
  const state = buildSplitCommandSurfaceHostState();
  return state ? { ok: true, state } : null;
}

function noteSplitCommandSecondaryLoss(
  reason: SplitCommandSecondaryLossReason,
  details?: unknown,
  notice: SplitCommandSurfaceHostNotice = reason === 'closed'
    ? 'secondary-closed'
    : 'secondary-lost',
): void {
  if (!splitCommandLifecycleSeam || !splitCommandSecondaryWindow) {
    return;
  }

  const fallbackState = splitCommandLifecycleSeam.registry.markSecondaryLost(reason);
  primaryLogicalSurface = 'command';
  secondarySurfaceStatus = 'lost';
  surfaceHostNotice = notice;
  ensureMainLogger().warn('Split command secondary window lost', {
    pairId: splitCommandLifecycleSeam.registry.pairIdentity.pairId,
    reason,
    fallbackState,
    details,
  });

  clearSplitCommandPairRuntimeReferences();
  publishSplitCommandOwnershipSync(['primary']);
  publishSplitCommandSurfaceHostState(['primary']);
  recordSplitCommandFocusOwnership('secondary', details);
  focusPrimarySurface();
}

function noteSplitCommandSecondaryRebuildBlocked(details?: unknown): void {
  if (!splitCommandLifecycleSeam) {
    return;
  }

  const fallbackState =
    splitCommandLifecycleSeam.registry.markSecondaryRebuildBlocked('secondary-launch-failed');
  secondarySurfaceStatus = 'unavailable';
  surfaceHostNotice = 'secondary-launch-failed';
  ensureMainLogger().warn('Split command secondary rebuild blocked', {
    pairId: splitCommandLifecycleSeam.registry.pairIdentity.pairId,
    fallbackState,
    details,
  });

  publishSplitCommandOwnershipSync(['primary']);
  publishSplitCommandSurfaceHostState(['primary']);
}

function noteSplitCommandPrimaryCollapse(
  reason: SplitCommandPrimaryCollapseReason,
  details?: unknown,
): void {
  splitCommandPairTeardownInProgress = true;
  try {
    const lifecycleSeam = splitCommandLifecycleSeam;
    let fallbackState: SplitCommandPairFallbackState | null = null;
    if (lifecycleSeam && lifecycleSeam.registry.fallbackState.pairHealthStatus !== 'primary-lost') {
      fallbackState = lifecycleSeam.registry.markPrimaryCollapsed(reason);
    }

    // Command Center is subordinate to Writing Studio and has no mutation authority.
    // Tear it down before nonessential ownership diagnostics so no primary collapse
    // can leave an orphaned secondary window.
    clearSplitCommandPairRuntimeReferences();

    if (lifecycleSeam) {
      if (fallbackState) {
        ensureMainLogger().warn('Split command primary window collapsed', {
          pairId: lifecycleSeam.registry.pairIdentity.pairId,
          reason,
          fallbackState,
          details,
        });
      }
      recordSplitCommandFocusOwnership('primary', details);
    }
  } finally {
    splitCommandPairTeardownInProgress = false;
  }
}

function clearSplitCommandPairRuntimeReferences(): void {
  splitCommandSecondaryLaunchContract = null;

  const secondaryWindow = splitCommandSecondaryWindow;
  splitCommandSecondaryWindow = null;
  if (secondaryWindow && !secondaryWindow.isDestroyed()) {
    console.log('[main] Split Command secondary cleanup requested', {
      secondaryWindowId: secondaryWindow.id,
      method: 'close',
    });
    try {
      // Command Center is subordinate to Writing Studio and cannot hold shared
      // mutations. Close it through Electron's normal window lifecycle rather
      // than forcibly destroying it while Writing Studio's closed callback is
      // still unwinding.
      secondaryWindow.close();
    } finally {
      console.log('[main] Split Command secondary cleanup returned', {
        secondaryWindowId: secondaryWindow.id,
        destroyed: secondaryWindow.isDestroyed(),
      });
    }
  }
}

function initiateCoordinatedCloseShutdown(): void {
  if (coordinatedCloseShutdownInProgress) {
    return;
  }
  coordinatedCloseShutdownInProgress = true;
  const secondaryWindow = splitCommandSecondaryWindow;
  if (secondaryWindow && !secondaryWindow.isDestroyed()) {
    secondaryWindow.close();
  }
  const writingStudio = mainWindow;
  if (writingStudio && !writingStudio.isDestroyed()) {
    writingStudio.close();
  }
}

function recordSplitCommandFocusOwnership(
  windowRole: 'primary' | 'secondary',
  details?: unknown,
): void {
  if (!splitCommandLifecycleSeam) {
    return;
  }

  const focusOwnershipState = splitCommandLifecycleSeam.classifyFocusOwnership(windowRole);

  const logPayload = {
    pairId: splitCommandLifecycleSeam.registry.pairIdentity.pairId,
    focusOwnershipState,
    details,
  };

  if (focusOwnershipState.focusValidationReason === 'healthy') {
    ensureMainLogger().info('Split command focus ownership classified', logPayload);
  } else {
    ensureMainLogger().warn('Split command focus ownership rejected', logPayload);
  }

  const inputRoutingAuthority = splitCommandLifecycleSeam.classifyInputRoutingAuthority(windowRole);
  const inputLogPayload = {
    pairId: splitCommandLifecycleSeam.registry.pairIdentity.pairId,
    inputRoutingAuthority,
    details,
  };
  if (inputRoutingAuthority.focusValidationReason === 'healthy') {
    ensureMainLogger().info('Split command input ownership classified', inputLogPayload);
  } else {
    ensureMainLogger().warn('Split command input ownership rejected', inputLogPayload);
  }

  const mutationAuthority = splitCommandLifecycleSeam.classifyMutationAuthority(windowRole);
  const mutationLogPayload = {
    pairId: splitCommandLifecycleSeam.registry.pairIdentity.pairId,
    mutationAuthority,
    details,
  };
  if (mutationAuthority.mutationValidationReason === 'healthy') {
    ensureMainLogger().info('Split command mutation ownership classified', mutationLogPayload);
  } else {
    ensureMainLogger().warn('Split command mutation ownership rejected', mutationLogPayload);
  }
}

async function bootstrap(): Promise<void> {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    return;
  }

  try {
    await startOptionalServicesForCoreShell(startServices, ({ message }) => {
      servicesProcess = null;
      delete process.env.BLACKSKIES_SERVICES_PORT;
      ensureMainLogger().warn('Optional services unavailable; continuing with core writing shell', {
        error: message,
      });
    });
    const initialPlacement = splitCommandLifecycleSeam
      ? deriveSplitCommandInitialPlacement(screen.getAllDisplays(), screen.getPrimaryDisplay())
      : null;
    await createMainWindow(initialPlacement?.writingStudio);
    publishSplitCommandOwnershipSync(['primary']);
    publishSplitCommandSurfaceHostState(['primary']);
    // A second display expands an author-requested Command surface; it never
    // changes the Writing-first startup contract. The explicit test hook keeps
    // legacy lifecycle witnesses able to exercise the optional path without
    // making physical monitor count product authority.
    if (
      splitCommandLifecycleSeam &&
      initialPlacement?.displayMode === 'dual-display' &&
      process.env.BLACKSKIES_TEST_AUTOMATIC_SECONDARY === '1'
    ) {
      await openSplitCommandSecondarySurface(initialPlacement.commandCenter);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    ensureMainLogger().error('Bootstrap failed', { message });
    console.error('[main] Bootstrap failed', message);
    dialog.showErrorBox('Black Skies failed to launch', message);
    app.quit();
  }
}

function setupAppEventHandlers(): void {
  screen.on('display-removed', (_event, display) => {
    if (!splitCommandSecondaryWindow || splitCommandSecondaryWindow.isDestroyed()) return;
    noteSplitCommandSecondaryLoss(
      'destroyed',
      { displayId: display.id },
      'display-removed',
    );
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });

  app.on('before-quit', () => {
    shuttingDown = true;
    ensureMainLogger().info(
      'Main process session truth classified',
      createMainProcessSessionTruthSnapshot({
        kind: 'graceful-shutdown',
      }),
    );
    void stopServices();
  });

  app.on('quit', () => {
    void shutdownLogging();
  });

  const handleProcessSignal = (): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    void stopServices().finally(() => {
      app.quit();
    });
  };

  if (!isPlaywright) {
    process.on('SIGINT', handleProcessSignal);
    process.on('SIGTERM', handleProcessSignal);
  }
}

let hasSingleInstanceLock = true;

if (isPlaywright) {
  console.log('[main] Skipping single instance lock enforcement (PLAYWRIGHT=1).');
} else {
  hasSingleInstanceLock = app.requestSingleInstanceLock();
  console.log('[main] Single instance lock acquired?', hasSingleInstanceLock);
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      void bootstrap();
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  });

  app
    .whenReady()
    .then(async () => {
      await initializeMainLogging(app);
      registerRendererLogSink();
      registerProjectLoaderIpc();
      registerProjectSpineIpc({
        originSessionId: projectSpineOriginSessionId,
        resolveWindowRole: resolveProjectSpineWindowRole,
        publishSession: publishProjectSpineSession,
        initiateCoordinatedShutdown: initiateCoordinatedCloseShutdown,
        focusWritingWindow: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.focus();
        },
      });
      registerCritiqueReviewIpc({
        resolveWindowRole: resolveProjectSpineWindowRole,
        getWritingSnapshot: () => getProjectSpineSnapshot('writing'),
        publishState: publishCritiqueReviewState,
        requestSourceReturn: returnToCritiqueSource,
      });
      registerAiCritiqueIpc({
        processSessionId: projectSpineOriginSessionId,
        resolveWindowRole: resolveProjectSpineWindowRole,
        getWritingSnapshot: () => getProjectSpineSnapshot('writing'),
        execute: isPlaywright ? executeDeterministicAiCritiqueFixture : undefined,
      });
      registerFeedbackNotesIpc({
        resolveWindowRole: resolveProjectSpineWindowRole,
        getWritingSnapshot: () => getProjectSpineSnapshot('writing'),
      });
      registerLivingOutlineIpc({
        resolveWindowRole: resolveProjectSpineWindowRole,
        getWritingSnapshot: () => getProjectSpineSnapshot('writing'),
      });
      registerStoryIntelligenceIpc({
        resolveWindowRole: resolveProjectSpineWindowRole,
        getWritingSnapshot: () => getProjectSpineSnapshot('writing'),
      });
      registerManuscriptStructureIpc({
        resolveWindowRole: resolveProjectSpineWindowRole,
        getWritingSnapshot: () => getProjectSpineSnapshot('writing'),
      });
      registerDiagnosticsIpc();
      registerSplitCommandOwnershipIpc();
      publishCritiqueReviewState(getCritiqueReviewSurfaceState());
      registerLayoutIpc({
        devServerUrl: START_URL.startsWith('http') ? START_URL : null,
        rendererIndexFile,
        preloadPath: ACTIVE_PRELOAD_PATH,
        getMainWindow: () => mainWindow,
      });
      ensureMainLogger().info('Electron app ready');
      ensureMainLogger().info('Main process session truth classified', createMainProcessSessionTruthSnapshot({
        kind: 'app-startup',
      }));
      setupAppEventHandlers();
      if (process.platform === 'win32') {
        app.setAppUserModelId('com.blackskies.desktop');
      }
      await bootstrap();
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
      ensureMainLogger().error('App failed to initialize', { message });
      dialog.showErrorBox('Black Skies failed to launch', message);
      app.quit();
    });
}
