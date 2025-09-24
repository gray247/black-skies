import { app, BrowserWindow, dialog } from 'electron';
import type { ChildProcess } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const rendererDistDir = join(projectRoot, 'app', 'dist');
const rendererIndexFile = join(rendererDistDir, 'index.html');

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/';
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let servicesProcess: ChildProcess | null = null;
let shuttingDown = false;

async function startServices(): Promise<void> {
  if (servicesProcess) {
    return;
  }

  // TODO: Spawn and supervise the FastAPI services launcher once implemented.
  // Reference docs/architecture.md §3 for the full process topology requirements.
}

async function stopServices(): Promise<void> {
  const child = servicesProcess;
  if (!child) {
    return;
  }

  servicesProcess = null;

  const terminated = child.kill('SIGTERM');
  if (!terminated) {
    return;
  }

  // Give the process a short grace period before forcing termination.
  await delay(1_000);

  if (!child.killed && process.platform !== 'win32') {
    child.kill('SIGKILL');
  }
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

  app.whenReady().then(async () => {
    setupAppEventHandlers();
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.blackskies.desktop');
    }
    await bootstrap();
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
    dialog.showErrorBox('Black Skies failed to launch', message);
    app.quit();
  });
}
