"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeProjectPath = authorizeProjectPath;
exports.clampBoundsToDisplay = clampBoundsToDisplay;
exports.registerLayoutIpc = registerLayoutIpc;
const electron_1 = require("electron");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const layout_js_1 = require("../shared/ipc/layout.js");
const LAYOUT_SCHEMA_VERSION = 2;
const LAYOUT_DIR_NAME = '.blackskies';
const LAYOUT_FILE_NAME = 'layout.json';
const floatingWindows = new Map();
const authorizedProjectRoots = new Set();
function authorizeProjectPath(projectPath) {
    const resolved = (0, node_path_1.resolve)(projectPath);
    authorizedProjectRoots.add(resolved);
}
function getAuthorizedProjectPath(projectPath) {
    const resolved = (0, node_path_1.resolve)(projectPath);
    return authorizedProjectRoots.has(resolved) ? resolved : null;
}
function resolveLayoutDir(projectPath) {
    return (0, node_path_1.join)(projectPath, LAYOUT_DIR_NAME);
}
function resolveLayoutFile(projectPath) {
    return (0, node_path_1.join)(resolveLayoutDir(projectPath), LAYOUT_FILE_NAME);
}
async function ensureLayoutDir(projectPath) {
    const dir = resolveLayoutDir(projectPath);
    await node_fs_1.promises.mkdir(dir, { recursive: true });
    return dir;
}
async function loadPersistedLayout(projectPath) {
    const filePath = resolveLayoutFile(projectPath);
    try {
        const raw = await node_fs_1.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        const floating = Array.isArray(parsed.floatingPanes) ? parsed.floatingPanes : [];
        const normalisedFloating = floating
            .map((entry) => {
            if (!entry || typeof entry !== 'object') {
                return null;
            }
            const descriptor = entry;
            if (typeof descriptor.id !== 'string') {
                return null;
            }
            const bounds = descriptor.bounds;
            const normalizedBounds = bounds && typeof bounds === 'object'
                ? {
                    x: Number.isFinite(bounds.x) ? bounds.x : undefined,
                    y: Number.isFinite(bounds.y) ? bounds.y : undefined,
                    width: Number.isFinite(bounds.width) ? bounds.width : undefined,
                    height: Number.isFinite(bounds.height) ? bounds.height : undefined,
                }
                : undefined;
            const result = {
                id: descriptor.id,
                bounds: normalizedBounds && normalizedBounds.width && normalizedBounds.height
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
            .filter((entry) => entry !== null);
        return {
            version: typeof parsed.version === 'number' ? parsed.version : 1,
            layout: parsed.layout ?? null,
            floatingPanes: normalisedFloating,
        };
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}
async function savePersistedLayout(projectPath, payload) {
    await ensureLayoutDir(projectPath);
    const filePath = resolveLayoutFile(projectPath);
    const serialised = JSON.stringify({
        version: payload.version ?? LAYOUT_SCHEMA_VERSION,
        layout: payload.layout,
        floatingPanes: payload.floatingPanes,
    }, null, 2);
    await node_fs_1.promises.writeFile(filePath, serialised, 'utf-8');
}
async function resetPersistedLayout(projectPath) {
    try {
        const filePath = resolveLayoutFile(projectPath);
        await node_fs_1.promises.rm(filePath, { force: true });
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}
function getFloatingWindowRegistry(projectPath) {
    let registry = floatingWindows.get(projectPath);
    if (!registry) {
        registry = new Map();
        floatingWindows.set(projectPath, registry);
    }
    return registry;
}
function serializeFloatingWindows(projectPath) {
    const registry = floatingWindows.get(projectPath);
    if (!registry) {
        return [];
    }
    const result = [];
    for (const [paneId, window] of registry.entries()) {
        if (window.isDestroyed()) {
            continue;
        }
        const bounds = window.getBounds();
        const display = electron_1.screen.getDisplayMatching(bounds);
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
function clampBoundsToDisplay(bounds, displayId) {
    if (!bounds) {
        return undefined;
    }
    const displays = electron_1.screen.getAllDisplays();
    let targetDisplay = displayId ? displays.find((entry) => entry.id === displayId) : undefined;
    if (!targetDisplay) {
        targetDisplay = electron_1.screen.getDisplayMatching(bounds) ?? electron_1.screen.getPrimaryDisplay();
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
async function handleLoadLayout(request) {
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
        layout: payload.layout,
        floatingPanes: payload.floatingPanes ?? [],
        schemaVersion: payload.version ?? 1,
    };
}
async function handleSaveLayout(request) {
    const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
    if (!resolvedProjectPath) {
        throw new Error('Project path not authorized for layout persistence.');
    }
    const floatingState = request.floatingPanes ?? serializeFloatingWindows(resolvedProjectPath);
    await savePersistedLayout(resolvedProjectPath, {
        version: request.schemaVersion ?? LAYOUT_SCHEMA_VERSION,
        layout: request.layout ?? null,
        floatingPanes: floatingState,
    });
}
async function handleResetLayout(request) {
    const resolvedProjectPath = getAuthorizedProjectPath(request.projectPath);
    if (!resolvedProjectPath) {
        throw new Error('Project path not authorized for layout reset.');
    }
    await resetPersistedLayout(resolvedProjectPath);
}
function makeFloatingWindowUrl(options, paneId, projectPath) {
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
async function openFloatingWindow(options, request) {
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
    const sandboxEnabled = electron_1.app.isPackaged && process.platform !== 'win32';
    const safeBounds = clampBoundsToDisplay(request.bounds, request.displayId);
    const parent = options.getMainWindow() ?? undefined;
    const window = new electron_1.BrowserWindow({
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
    const allowedOrigins = new Set();
    if (options.devServerUrl) {
        try {
            allowedOrigins.add(new URL(options.devServerUrl).origin);
        }
        catch {
            // ignore malformed dev server URLs, navigation guard will fall back to denying
        }
    }
    window.webContents.on('will-navigate', (event, targetUrl) => {
        if (targetUrl.startsWith('file://')) {
            return;
        }
        let origin = null;
        try {
            origin = new URL(targetUrl).origin;
        }
        catch {
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
    }
    else {
        await window.loadFile(target.file, { search: target.search });
    }
    registry.set(request.paneId, window);
    return true;
}
async function closeFloatingWindow(request) {
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
function registerLayoutIpc(options) {
    electron_1.ipcMain.handle(layout_js_1.LAYOUT_CHANNELS.load, async (_event, request) => {
        return handleLoadLayout(request);
    });
    electron_1.ipcMain.handle(layout_js_1.LAYOUT_CHANNELS.save, async (_event, request) => {
        await handleSaveLayout(request);
    });
    electron_1.ipcMain.handle(layout_js_1.LAYOUT_CHANNELS.reset, async (_event, request) => {
        await handleResetLayout(request);
    });
    electron_1.ipcMain.handle(layout_js_1.LAYOUT_CHANNELS.listFloating, async (_event, projectPath) => {
        const resolvedProjectPath = getAuthorizedProjectPath(projectPath);
        if (!resolvedProjectPath) {
            console.warn('[layout] Ignoring list floating panes for unauthorized project path', {
                projectPath,
            });
            return [];
        }
        return serializeFloatingWindows(resolvedProjectPath);
    });
    electron_1.ipcMain.handle(layout_js_1.LAYOUT_CHANNELS.openFloating, async (_event, request) => {
        return openFloatingWindow(options, request);
    });
    electron_1.ipcMain.handle(layout_js_1.LAYOUT_CHANNELS.closeFloating, async (_event, request) => {
        await closeFloatingWindow(request);
    });
}
//# sourceMappingURL=layoutIpc.js.map