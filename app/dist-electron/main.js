"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const node_events_1 = require("node:events");
const node_net_1 = __importDefault(require("node:net"));
const promises_1 = require("node:timers/promises");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const projectLoaderIpc_1 = require("./projectLoaderIpc");
const logging_js_1 = require("./logging.js");
const diagnostics_js_1 = require("../shared/ipc/diagnostics.js");
const layoutIpc_js_1 = require("./layoutIpc.js");
const runtime_js_1 = require("../shared/config/runtime.js");
const projectRoot = (0, node_path_1.resolve)(__dirname, '..');
const repoRoot = (0, node_path_1.resolve)(projectRoot, '..');
const runtimeConfig = (0, runtime_js_1.loadRuntimeConfig)(process.env.BLACKSKIES_CONFIG_PATH ?? (0, node_path_1.join)(repoRoot, 'config', 'runtime.yaml'));
const allowedPythonExecutables = runtimeConfig.service.allowedPythonExecutables.map((entry) => entry.toLowerCase());
const bundledPythonPath = runtimeConfig.service.bundledPythonPath ?? '';
const rendererDistDir = (0, node_path_1.join)(projectRoot, 'dist');
const rendererIndexFile = (0, node_path_1.join)(rendererDistDir, 'index.html');
const PRELOAD_PATH = (0, node_path_1.join)(__dirname, 'preload.js');
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/';
const isDev = !electron_1.app.isPackaged;
const SERVICES_HOST = '127.0.0.1';
const PORT_RANGE_ENV = process.env.BLACKSKIES_SERVICE_PORT_RANGE;
const DEFAULT_PYTHON_EXECUTABLE = 'python';
const RESOLVED_PORT_RANGE = resolvePortRange(PORT_RANGE_ENV, runtimeConfig.service.portRange ?? runtime_js_1.DEFAULT_SERVICE_PORT_RANGE);
const PYTHON_EXECUTABLE = resolvePythonExecutable();
let mainWindow = null;
let servicesProcess = null;
let servicesPort = null;
let shuttingDown = false;
let mainLogger = null;
function parseEnvInteger(key, fallback) {
    const raw = process.env[key];
    if (!raw) {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
const healthProbeDefaults = runtimeConfig.service.healthProbe ?? runtime_js_1.DEFAULT_HEALTH_PROBE;
const HEALTH_MAX_ATTEMPTS = parseEnvInteger('BLACKSKIES_HEALTH_MAX_ATTEMPTS', healthProbeDefaults.maxAttempts);
const HEALTH_BASE_DELAY_MS = parseEnvInteger('BLACKSKIES_HEALTH_BASE_DELAY_MS', healthProbeDefaults.baseDelayMs);
const HEALTH_MAX_DELAY_MS = parseEnvInteger('BLACKSKIES_HEALTH_MAX_DELAY_MS', healthProbeDefaults.maxDelayMs);
const HEALTH_ATTEMPT_TIMEOUT_MS = parseEnvInteger('BLACKSKIES_HEALTH_ATTEMPT_TIMEOUT_MS', 5_000);
function resolvePortRange(value, fallback) {
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
function resolvePythonExecutable() {
    if (!isDev && bundledPythonPath) {
        return fallbackPythonExecutable();
    }
    const override = process.env.BLACKSKIES_PYTHON;
    if (!override) {
        return fallbackPythonExecutable();
    }
    const normalized = (0, node_path_1.normalize)(override);
    if (!(0, node_path_1.isAbsolute)(normalized)) {
        console.warn('[main] Ignoring BLACKSKIES_PYTHON because it is not an absolute path.');
        return fallbackPythonExecutable();
    }
    try {
        const stats = (0, node_fs_1.statSync)(normalized);
        if (!stats.isFile()) {
            console.warn('[main] Ignoring BLACKSKIES_PYTHON because it does not point to a file.');
            return fallbackPythonExecutable();
        }
    }
    catch (error) {
        console.warn('[main] Ignoring BLACKSKIES_PYTHON because the path is inaccessible.', error);
        return fallbackPythonExecutable();
    }
    const base = (0, node_path_1.basename)(normalized).toLowerCase();
    if (allowedPythonExecutables.length > 0 && !allowedPythonExecutables.includes(base)) {
        console.warn('[main] BLACKSKIES_PYTHON is not in the allowed interpreter list.');
        return fallbackPythonExecutable();
    }
    if (!base.startsWith('python')) {
        console.warn('[main] BLACKSKIES_PYTHON does not appear to reference a Python binary.');
    }
    return normalized;
}
function fallbackPythonExecutable() {
    if (bundledPythonPath) {
        const resolvedBundled = resolveBundledExecutablePath(bundledPythonPath);
        if (resolvedBundled) {
            try {
                if ((0, node_fs_1.statSync)(resolvedBundled).isFile()) {
                    return resolvedBundled;
                }
            }
            catch (error) {
                console.warn('[main] Bundled Python path is not accessible.', error);
            }
        }
        else if (bundledPythonPath.includes('{{APP_RESOURCES}}')) {
            console.warn('[main] Unable to resolve bundled Python placeholder path.');
        }
    }
    return DEFAULT_PYTHON_EXECUTABLE;
}
function ensureMainLogger() {
    if (!mainLogger) {
        mainLogger = (0, logging_js_1.getLogger)('main.process');
    }
    return mainLogger;
}
async function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = node_net_1.default.createServer();
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
async function selectServicePort() {
    const { min, max } = RESOLVED_PORT_RANGE;
    const candidates = Array.from({ length: max - min + 1 }, (_, index) => min + index);
    for (let index = candidates.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
    }
    for (const candidate of candidates) {
        // eslint-disable-next-line no-await-in-loop -- sequential probing avoids port races
        const available = await isPortAvailable(candidate);
        if (available) {
            return candidate;
        }
    }
    throw new Error(`Unable to find an available port between ${min} and ${max}.`);
}
function resolveBundledExecutablePath(rawPath) {
    const candidate = rawPath.trim();
    if (!candidate) {
        return null;
    }
    const resourcesPath = process.resourcesPath ??
        process.env.BLACKSKIES_PACKAGE_RESOURCES ??
        null;
    let resolved = candidate;
    if (resolved.includes('{{APP_RESOURCES}}')) {
        if (!resourcesPath) {
            return null;
        }
        resolved = resolved.replace(/\{\{APP_RESOURCES\}\}/g, resourcesPath);
    }
    if (!(0, node_path_1.isAbsolute)(resolved)) {
        if (resourcesPath && !isDev) {
            resolved = (0, node_path_1.resolve)(resourcesPath, resolved);
        }
        else {
            resolved = (0, node_path_1.resolve)(repoRoot, resolved);
        }
    }
    return (0, node_path_1.normalize)(resolved);
}
function pipeStreamToLogger(stream, logger, level, source) {
    let buffer = '';
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
        buffer += chunk;
        let newlineIndex = buffer.indexOf('\n');
        while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
            buffer = buffer.slice(newlineIndex + 1);
            if (line.trim().length > 0) {
                (0, logging_js_1.logWithLevel)(logger, level, line, { source });
            }
            newlineIndex = buffer.indexOf('\n');
        }
    });
    stream.on('end', () => {
        const remaining = buffer.trim();
        if (remaining.length > 0) {
            (0, logging_js_1.logWithLevel)(logger, level, remaining, { source, partial: true });
        }
    });
}
async function waitForServicesHealthy(port) {
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
            }
            else {
                try {
                    const payload = (await response.json());
                    if (payload?.status === 'ok') {
                        return;
                    }
                    logger.warn('Health probe responded with unexpected payload', {
                        attempt,
                        payload,
                        traceId,
                    });
                }
                catch (parseError) {
                    logger.warn('Health probe returned unreadable payload', {
                        attempt,
                        traceId,
                        error: parseError instanceof Error ? parseError.message : String(parseError),
                    });
                }
            }
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                logger.warn('Health probe timed out', { attempt, timeoutMs: HEALTH_ATTEMPT_TIMEOUT_MS });
            }
            else {
                logger.debug('Health probe failed', {
                    attempt,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        finally {
            clearTimeout(timeoutHandle);
        }
        await (0, promises_1.setTimeout)(delayMs);
        delayMs = Math.min(HEALTH_MAX_DELAY_MS, Math.round(delayMs * 1.5));
    }
    throw new Error('FastAPI services did not become healthy within the allotted time.');
}
function resolvePythonModulePath() {
    if (!electron_1.app.isPackaged) {
        return (0, node_path_1.resolve)(projectRoot, '..', 'services', 'src');
    }
    return (0, node_path_1.join)(process.resourcesPath, 'python');
}
function buildPythonEnv() {
    const env = { ...process.env };
    const modulePath = resolvePythonModulePath();
    const segments = [modulePath];
    if (env.PYTHONPATH && env.PYTHONPATH.length > 0) {
        segments.push(env.PYTHONPATH);
    }
    env.PYTHONPATH = segments.join(node_path_1.delimiter);
    env.BLACKSKIES_PYTHONPATH = modulePath;
    if (electron_1.app.isPackaged) {
        env.BLACKSKIES_PACKAGE_RESOURCES = process.resourcesPath;
    }
    return env;
}
function resolveServicesCwd() {
    if (electron_1.app.isPackaged) {
        return process.resourcesPath;
    }
    return (0, node_path_1.resolve)(projectRoot, '..');
}
async function startServices() {
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
    const child = (0, node_child_process_1.spawn)(PYTHON_EXECUTABLE, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: buildPythonEnv(),
        cwd: resolveServicesCwd(),
    });
    const spawnPromise = new Promise((resolve, reject) => {
        child.once('spawn', () => resolve());
        child.once('error', (error) => reject(error));
    });
    const stdoutLogger = (0, logging_js_1.getLogger)('services.stdout', 'service');
    const stderrLogger = (0, logging_js_1.getLogger)('services.stderr', 'service');
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
    }
    catch (error) {
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
    }
    catch (error) {
        logger.error('FastAPI services failed health verification', {
            port,
            error: error instanceof Error ? error.message : String(error),
        });
        await stopServices();
        throw error instanceof Error ? error : new Error(String(error));
    }
}
async function stopServices() {
    const child = servicesProcess;
    if (!child) {
        return;
    }
    const logger = ensureMainLogger();
    servicesProcess = null;
    servicesPort = null;
    delete process.env.BLACKSKIES_SERVICES_PORT;
    logger.info('Stopping FastAPI services', { pid: child.pid });
    const exitPromise = (0, node_events_1.once)(child, 'exit');
    const terminated = child.kill('SIGTERM');
    let exitResult = null;
    if (terminated) {
        const raceResult = await Promise.race([
            exitPromise,
            (0, promises_1.setTimeout)(2_000).then(() => 'timeout'),
        ]);
        if (raceResult === 'timeout') {
            if (child.exitCode === null && child.signalCode === null) {
                if (process.platform !== 'win32') {
                    logger.warn('Escalating FastAPI services termination', { pid: child.pid });
                    child.kill('SIGKILL');
                }
                exitResult = await exitPromise;
            }
            else {
                exitResult = [child.exitCode, child.signalCode];
            }
        }
        else {
            exitResult = raceResult;
        }
    }
    else {
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
function resolveDiagnosticsDirectory() {
    const logPath = (0, logging_js_1.getDiagnosticsLogFilePath)();
    if (!logPath) {
        return null;
    }
    return (0, node_path_1.dirname)(logPath);
}
function registerDiagnosticsIpc() {
    electron_1.ipcMain.removeHandler(diagnostics_js_1.DIAGNOSTICS_CHANNELS.openHistory);
    electron_1.ipcMain.handle(diagnostics_js_1.DIAGNOSTICS_CHANNELS.openHistory, async () => {
        const directory = resolveDiagnosticsDirectory();
        if (!directory) {
            return {
                ok: false,
                error: 'Diagnostics folder is not available yet.',
            };
        }
        try {
            const result = await electron_1.shell.openPath(directory);
            if (typeof result === 'string' && result.length > 0) {
                return { ok: false, error: result };
            }
            return { ok: true, path: directory };
        }
        catch (error) {
            return {
                ok: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    });
}
async function createMainWindow() {
    const sandboxEnabled = electron_1.app.isPackaged && process.platform !== 'win32';
    const window = new electron_1.BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 960,
        minHeight: 640,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: sandboxEnabled,
            preload: PRELOAD_PATH,
        },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const allowedOrigins = new Set();
    if (isDev) {
        try {
            allowedOrigins.add(new URL(DEV_SERVER_URL).origin);
        }
        catch (error) {
            ensureMainLogger().warn('Failed to parse development server URL', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    window.webContents.on('will-navigate', (event, navigationUrl) => {
        if (navigationUrl.startsWith('file://')) {
            return;
        }
        let origin = null;
        try {
            origin = new URL(navigationUrl).origin;
        }
        catch {
            origin = null;
        }
        if (!origin || !allowedOrigins.has(origin)) {
            event.preventDefault();
        }
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
    }
    else {
        await window.loadFile(rendererIndexFile);
    }
    return window;
}
async function bootstrap() {
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown startup error';
        ensureMainLogger().error('Bootstrap failed', { message });
        electron_1.dialog.showErrorBox('Black Skies failed to launch', message);
        electron_1.app.quit();
    }
}
function setupAppEventHandlers() {
    electron_1.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            void bootstrap();
        }
    });
    electron_1.app.on('before-quit', () => {
        shuttingDown = true;
        void stopServices();
    });
    electron_1.app.on('quit', () => {
        void (0, logging_js_1.shutdownLogging)();
    });
    const handleProcessSignal = (_signal) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        void stopServices().finally(() => {
            electron_1.app.quit();
        });
    };
    process.on('SIGINT', handleProcessSignal);
    process.on('SIGTERM', handleProcessSignal);
}
const hasSingleInstanceLock = electron_1.app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (!mainWindow) {
            void bootstrap();
            return;
        }
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();
    });
    electron_1.app
        .whenReady()
        .then(async () => {
        await (0, logging_js_1.initializeMainLogging)(electron_1.app);
        (0, logging_js_1.registerRendererLogSink)();
        (0, projectLoaderIpc_1.registerProjectLoaderIpc)();
        registerDiagnosticsIpc();
        (0, layoutIpc_js_1.registerLayoutIpc)({
            devServerUrl: isDev ? DEV_SERVER_URL : null,
            rendererIndexFile,
            preloadPath: PRELOAD_PATH,
            getMainWindow: () => mainWindow,
        });
        ensureMainLogger().info('Electron app ready');
        setupAppEventHandlers();
        if (process.platform === 'win32') {
            electron_1.app.setAppUserModelId('com.blackskies.desktop');
        }
        await bootstrap();
    })
        .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
        ensureMainLogger().error('App failed to initialize', { message });
        electron_1.dialog.showErrorBox('Black Skies failed to launch', message);
        electron_1.app.quit();
    });
}
//# sourceMappingURL=main.js.map