import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { spawn, type ChildProcessByStdio } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, join, resolve, delimiter } from 'node:path';
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

const projectRoot = resolve(__dirname, '..');
const rendererDistDir = join(projectRoot, 'dist');
const rendererIndexFile = join(rendererDistDir, 'index.html');

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/';
const isDev = !app.isPackaged;

const SERVICES_HOST = '127.0.0.1';
const MIN_PORT = 43750;
const MAX_PORT = 43850;
const PYTHON_EXECUTABLE = process.env.BLACKSKIES_PYTHON ?? 'python';

let mainWindow: BrowserWindow | null = null;
type ServicesProcess = ChildProcessByStdio<null, Readable, Readable>;

let servicesProcess: ServicesProcess | null = null;
let servicesPort: number | null = null;
let shuttingDown = false;
let mainLogger: Logger | null = null;

function ensureMainLogger(): Logger {
  if (!mainLogger) {
    mainLogger = getLogger('main.process');
  }
  return mainLogger;
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
  for (let candidate = MIN_PORT; candidate <= MAX_PORT; candidate += 1) {
    // eslint-disable-next-line no-await-in-loop -- sequential probing avoids port races
    const available = await isPortAvailable(candidate);
    if (available) {
      return candidate;
    }
  }

  throw new Error(`Unable to find an available port between ${MIN_PORT} and ${MAX_PORT}.`);
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
  const maxAttempts = 20;
  const attemptDelayMs = 250;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url);
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
      logger.debug('Health probe failed', {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await delay(attemptDelayMs);
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

  const logger = ensureMainLogger();
  const port = await selectServicePort();
  const args = ['-m', 'blackskies.services', '--host', SERVICES_HOST, '--port', String(port)];

  logger.info('Spawning FastAPI services', {
    executable: PYTHON_EXECUTABLE,
    args,
    port,
  });

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
      servicesPort = null;
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
  servicesPort = port;
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
  servicesPort = null;
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

async function createMainWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, 'preload.js'),
    },
  });

  window.on('ready-to-show', () => {
    window.show();
  });

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  if (isDev) {
    await window.loadURL(DEV_SERVER_URL);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    await window.loadFile(rendererIndexFile);
  }

  return window;
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
    await startServices();
    const window = await createMainWindow();
    mainWindow = window;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    ensureMainLogger().error('Bootstrap failed', { message });
    dialog.showErrorBox('Black Skies failed to launch', message);
    app.quit();
  }
}

function setupAppEventHandlers(): void {
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
    void stopServices();
  });

  app.on('quit', () => {
    void shutdownLogging();
  });

  const handleProcessSignal = (_signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    void stopServices().finally(() => {
      app.quit();
    });
  };

  process.on('SIGINT', handleProcessSignal);
  process.on('SIGTERM', handleProcessSignal);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();

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
      registerDiagnosticsIpc();
      ensureMainLogger().info('Electron app ready');
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

