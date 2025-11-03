import { app, BrowserWindow, ipcMain, screen } from 'electron';
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

const LAYOUT_SCHEMA_VERSION = 2;

interface PersistedLayoutPayload {
  version?: number;
  layout: unknown;
  floatingPanes: FloatingPaneDescriptor[];
}

const LAYOUT_DIR_NAME = '.blackskies';
const LAYOUT_FILE_NAME = 'layout.json';

const floatingWindows: Map<string, Map<LayoutPaneId, BrowserWindow>> = new Map();
const authorizedProjectRoots = new Set<string>();

export function authorizeProjectPath(projectPath: string): void {
  const resolved = resolve(projectPath);
  authorizedProjectRoots.add(resolved);
}

function getAuthorizedProjectPath(projectPath: string): string | null {
  const resolved = resolve(projectPath);
  return authorizedProjectRoots.has(resolved) ? resolved : null;
}

function resolveLayoutDir(projectPath: string): string {
  return join(projectPath, LAYOUT_DIR_NAME);
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
    const floating = Array.isArray(parsed.floatingPanes) ? parsed.floatingPanes : [];
    const normalisedFloating = floating
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }
        const descriptor = entry as Partial<FloatingPaneDescriptor> & { id?: unknown };
        if (typeof descriptor.id !== 'string') {
          return null;
        }
        const bounds = descriptor.bounds;
        const normalizedBounds =
          bounds && typeof bounds === 'object'
            ? {
                x: Number.isFinite(bounds.x) ? bounds.x : undefined,
                y: Number.isFinite(bounds.y) ? bounds.y : undefined,
                width: Number.isFinite(bounds.width) ? bounds.width : undefined,
                height: Number.isFinite(bounds.height) ? bounds.height : undefined,
              }
            : undefined;
        const result: FloatingPaneDescriptor = {
          id: descriptor.id as LayoutPaneId,
          bounds:
            normalizedBounds && normalizedBounds.width && normalizedBounds.height
              ? {
                  x: normalizedBounds.x ?? 0,
                  y: normalizedBounds.y ?? 0,
                  width: normalizedBounds.width,
                  height: normalizedBounds.height,
                }
              : undefined,
          displayId: typeof descriptor.displayId === 'number' ? descriptor.displayId : undefined,
        };
        return result;
      })
      .filter((entry): entry is FloatingPaneDescriptor => entry !== null);
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      layout: parsed.layout ?? null,
      floatingPanes: normalisedFloating,
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
  const serialised = JSON.stringify(
    {
      version: payload.version ?? LAYOUT_SCHEMA_VERSION,
      layout: payload.layout,
      floatingPanes: payload.floatingPanes,
    },
    null,
    2,
  );
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
    const display = screen.getDisplayMatching(bounds);
    result.push({
      id: paneId,
      bounds: {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      },
      displayId: display?.id,
    });
  }
  return result;
}

export function clampBoundsToDisplay(
  bounds: FloatingPaneDescriptor['bounds'] | undefined,
  displayId: number | undefined,
): Electron.Rectangle | undefined {
  if (!bounds) {
    return undefined;
  }
  const displays = screen.getAllDisplays();
  let targetDisplay = displayId ? displays.find((entry) => entry.id === displayId) : undefined;
  if (!targetDisplay) {
    targetDisplay = screen.getDisplayMatching(bounds) ?? screen.getPrimaryDisplay();
  }
  const workArea = targetDisplay.workArea;
  const width = Math.max(240, Math.min(bounds.width, workArea.width));
  const height = Math.max(180, Math.min(bounds.height, workArea.height));
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;
  const clampedX = Number.isFinite(bounds.x) ? Math.min(Math.max(bounds.x, workArea.x), maxX) : workArea.x;
  const clampedY = Number.isFinite(bounds.y) ? Math.min(Math.max(bounds.y, workArea.y), maxY) : workArea.y;
  return {
    x: clampedX,
    y: clampedY,
    width,
    height,
  };
}

async function handleLoadLayout(request: LayoutLoadRequest): Promise<LayoutLoadResponse> {
  const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
  if (!resolvedProjectPath) {
    console.warn('[layout] Ignoring load for unauthorized project path', {
      projectPath: request.projectPath,
    });
    return { layout: null, floatingPanes: [], schemaVersion: LAYOUT_SCHEMA_VERSION };
  }
  const payload = await loadPersistedLayout(resolvedProjectPath);
  if (!payload) {
    return { layout: null, floatingPanes: [], schemaVersion: LAYOUT_SCHEMA_VERSION };
  }
  return {
    layout: payload.layout as LayoutLoadResponse['layout'],
    floatingPanes: payload.floatingPanes ?? [],
    schemaVersion: payload.version ?? 1,
  };
}

async function handleSaveLayout(request: LayoutSaveRequest): Promise<void> {
  const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
  if (!resolvedProjectPath) {
    throw new Error('Project path not authorized for layout persistence.');
  }
  const floatingState =
    request.floatingPanes ?? serializeFloatingWindows(resolvedProjectPath);
  await savePersistedLayout(resolvedProjectPath, {
    version: request.schemaVersion ?? LAYOUT_SCHEMA_VERSION,
    layout: request.layout ?? null,
    floatingPanes: floatingState,
  });
}

async function handleResetLayout(request: LayoutLoadRequest): Promise<void> {
  const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
  if (!resolvedProjectPath) {
    throw new Error('Project path not authorized for layout reset.');
  }
  await resetPersistedLayout(resolvedProjectPath);
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
  const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
  if (!resolvedProjectPath) {
    throw new Error('Project path not authorized for floating window.');
  }
  const registry = getFloatingWindowRegistry(resolvedProjectPath);
  const existing = registry.get(request.paneId);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return false;
  }

  const sandboxEnabled = app.isPackaged && process.platform !== 'win32';
  const safeBounds = clampBoundsToDisplay(request.bounds, request.displayId);
  const parent = options.getMainWindow() ?? undefined;
  const window = new BrowserWindow({
    width: safeBounds?.width ?? request.bounds?.width ?? 640,
    height: safeBounds?.height ?? request.bounds?.height ?? 420,
    x: safeBounds?.x ?? request.bounds?.x,
    y: safeBounds?.y ?? request.bounds?.y,
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
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const allowedOrigins = new Set<string>();
  if (options.devServerUrl) {
    try {
      allowedOrigins.add(new URL(options.devServerUrl).origin);
    } catch {
      // ignore malformed dev server URLs, navigation guard will fall back to denying
    }
  }
  window.webContents.on('will-navigate', (event, targetUrl) => {
    if (targetUrl.startsWith('file://')) {
      return;
    }
    let origin: string | null = null;
    try {
      origin = new URL(targetUrl).origin;
    } catch {
      origin = null;
    }
    if (!origin || !allowedOrigins.has(origin)) {
      event.preventDefault();
    }
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
  const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
  if (!resolvedProjectPath) {
    return;
  }
  const registry = floatingWindows.get(resolvedProjectPath);
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
    const resolvedProjectPath = getAuthorizedProjectPath(projectPath);
    if (!resolvedProjectPath) {
      console.warn('[layout] Ignoring list floating panes for unauthorized project path', {
        projectPath,
      });
      return [];
    }
    return serializeFloatingWindows(resolvedProjectPath);
  });

  ipcMain.handle(LAYOUT_CHANNELS.openFloating, async (_event, request: FloatingPaneOpenRequest) => {
    return openFloatingWindow(options, request);
  });

  ipcMain.handle(LAYOUT_CHANNELS.closeFloating, async (_event, request: FloatingPaneCloseRequest) => {
    await closeFloatingWindow(request);
  });
}
