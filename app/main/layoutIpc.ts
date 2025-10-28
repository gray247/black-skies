import { app, BrowserWindow, ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import {
  LAYOUT_CHANNELS,
  type FloatingPaneCloseRequest,
  type FloatingPaneDescriptor,
  type FloatingPaneOpenRequest,
  type LayoutLoadRequest,
  type LayoutLoadResponse,
  type LayoutPaneId,
  type LayoutSaveRequest,
} from '../shared/ipc/layout.js';

interface RegisterLayoutIpcOptions {
  devServerUrl: string | null;
  rendererIndexFile: string;
  preloadPath: string;
  getMainWindow(): BrowserWindow | null;
}

interface PersistedLayoutPayload {
  layout: unknown;
  floatingPanes: FloatingPaneDescriptor[];
}

const LAYOUT_DIR_NAME = '.blackskies';
const LAYOUT_FILE_NAME = 'layout.json';

const floatingWindows: Map<string, Map<LayoutPaneId, BrowserWindow>> = new Map();

function resolveLayoutDir(projectPath: string): string {
  return join(resolve(projectPath), LAYOUT_DIR_NAME);
}

function resolveLayoutFile(projectPath: string): string {
  return join(resolveLayoutDir(projectPath), LAYOUT_FILE_NAME);
}

async function ensureLayoutDir(projectPath: string): Promise<string> {
  const dir = resolveLayoutDir(projectPath);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function loadPersistedLayout(projectPath: string): Promise<PersistedLayoutPayload | null> {
  const filePath = resolveLayoutFile(projectPath);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedLayoutPayload;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return {
      layout: parsed.layout ?? null,
      floatingPanes: Array.isArray(parsed.floatingPanes) ? parsed.floatingPanes : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function savePersistedLayout(
  projectPath: string,
  payload: PersistedLayoutPayload,
): Promise<void> {
  await ensureLayoutDir(projectPath);
  const filePath = resolveLayoutFile(projectPath);
  const serialised = JSON.stringify(payload, null, 2);
  await fs.writeFile(filePath, serialised, 'utf-8');
}

async function resetPersistedLayout(projectPath: string): Promise<void> {
  try {
    const filePath = resolveLayoutFile(projectPath);
    await fs.rm(filePath, { force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

function getFloatingWindowRegistry(projectPath: string): Map<LayoutPaneId, BrowserWindow> {
  let registry = floatingWindows.get(projectPath);
  if (!registry) {
    registry = new Map();
    floatingWindows.set(projectPath, registry);
  }
  return registry;
}

function serializeFloatingWindows(projectPath: string): FloatingPaneDescriptor[] {
  const registry = floatingWindows.get(projectPath);
  if (!registry) {
    return [];
  }
  const result: FloatingPaneDescriptor[] = [];
  for (const [paneId, window] of registry.entries()) {
    if (window.isDestroyed()) {
      continue;
    }
    const bounds = window.getBounds();
    result.push({
      id: paneId,
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
    });
  }
  return result;
}

async function handleLoadLayout(request: LayoutLoadRequest): Promise<LayoutLoadResponse> {
  const payload = await loadPersistedLayout(request.projectPath);
  if (!payload) {
    return { layout: null, floatingPanes: [] };
  }
  return {
    layout: payload.layout as LayoutLoadResponse['layout'],
    floatingPanes: payload.floatingPanes ?? [],
  };
}

async function handleSaveLayout(request: LayoutSaveRequest): Promise<void> {
  const floatingState = request.floatingPanes ?? serializeFloatingWindows(request.projectPath);
  await savePersistedLayout(request.projectPath, {
    layout: request.layout ?? null,
    floatingPanes: floatingState,
  });
}

async function handleResetLayout(request: LayoutLoadRequest): Promise<void> {
  await resetPersistedLayout(request.projectPath);
}

function makeFloatingWindowUrl(
  options: RegisterLayoutIpcOptions,
  paneId: LayoutPaneId,
  projectPath: string,
): string | { file: string; search: string } {
  const searchParams = new URLSearchParams({
    floatingPane: paneId,
    projectPath,
  });
  if (options.devServerUrl) {
    const base = options.devServerUrl.endsWith('/')
      ? options.devServerUrl.slice(0, -1)
      : options.devServerUrl;
    return `${base}/?${searchParams.toString()}`;
  }
  return {
    file: options.rendererIndexFile,
    search: `?${searchParams.toString()}`,
  };
}

async function openFloatingWindow(
  options: RegisterLayoutIpcOptions,
  request: FloatingPaneOpenRequest,
): Promise<boolean> {
  const registry = getFloatingWindowRegistry(request.projectPath);
  const existing = registry.get(request.paneId);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return false;
  }

  const sandboxEnabled = app.isPackaged && process.platform !== 'win32';
  const parent = options.getMainWindow() ?? undefined;
  const window = new BrowserWindow({
    width: request.bounds?.width ?? 640,
    height: request.bounds?.height ?? 420,
    x: request.bounds?.x,
    y: request.bounds?.y,
    minWidth: 360,
    minHeight: 240,
    autoHideMenuBar: true,
    show: false,
    parent,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: sandboxEnabled,
      preload: options.preloadPath,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });
  window.on('closed', () => {
    registry.delete(request.paneId);
  });

  const target = makeFloatingWindowUrl(options, request.paneId, request.projectPath);
  if (typeof target === 'string') {
    await window.loadURL(target);
  } else {
    await window.loadFile(target.file, { search: target.search });
  }

  registry.set(request.paneId, window);
  return true;
}

async function closeFloatingWindow(request: FloatingPaneCloseRequest): Promise<void> {
  const registry = floatingWindows.get(request.projectPath);
  if (!registry) {
    return;
  }
  const window = registry.get(request.paneId);
  if (!window) {
    return;
  }
  registry.delete(request.paneId);
  if (!window.isDestroyed()) {
    window.close();
  }
}

export function registerLayoutIpc(options: RegisterLayoutIpcOptions): void {
  ipcMain.handle(LAYOUT_CHANNELS.load, async (_event, request: LayoutLoadRequest) => {
    return handleLoadLayout(request);
  });

  ipcMain.handle(LAYOUT_CHANNELS.save, async (_event, request: LayoutSaveRequest) => {
    await handleSaveLayout(request);
  });

  ipcMain.handle(LAYOUT_CHANNELS.reset, async (_event, request: LayoutLoadRequest) => {
    await handleResetLayout(request);
  });

  ipcMain.handle(LAYOUT_CHANNELS.listFloating, async (_event, projectPath: string) => {
    return serializeFloatingWindows(projectPath);
  });

  ipcMain.handle(LAYOUT_CHANNELS.openFloating, async (_event, request: FloatingPaneOpenRequest) => {
    return openFloatingWindow(options, request);
  });

  ipcMain.handle(LAYOUT_CHANNELS.closeFloating, async (_event, request: FloatingPaneCloseRequest) => {
    await closeFloatingWindow(request);
  });
}

