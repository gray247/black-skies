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
const node_path_1 = require("node:path");
const projectLoaderIpc_1 = require("./projectLoaderIpc");
const logging_js_1 = require("./logging.js");
const diagnostics_js_1 = require("../shared/ipc/diagnostics.js");
const projectRoot = (0, node_path_1.resolve)(__dirname, '..');
const rendererDistDir = (0, node_path_1.join)(projectRoot, 'dist');
const rendererIndexFile = (0, node_path_1.join)(rendererDistDir, 'index.html');
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? 'http://127.0.0.1:5173/';
const isDev = !electron_1.app.isPackaged;
const SERVICES_HOST = '127.0.0.1';
const MIN_PORT = 43750;
const MAX_PORT = 43850;
const PYTHON_EXECUTABLE = process.env.BLACKSKIES_PYTHON ?? 'python';
let mainWindow = null;
let servicesProcess = null;
let servicesPort = null;
let shuttingDown = false;
let mainLogger = null;
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
    for (let candidate = MIN_PORT; candidate <= MAX_PORT; candidate += 1) {
        // eslint-disable-next-line no-await-in-loop -- sequential probing avoids port races
        const available = await isPortAvailable(candidate);
        if (available) {
            return candidate;
        }
    }
    throw new Error(`Unable to find an available port between ${MIN_PORT} and ${MAX_PORT}.`);
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
    const url = `http://${SERVICES_HOST}:${port}/healthz`;
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
            logger.debug('Health probe failed', {
                attempt,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        await (0, promises_1.setTimeout)(attemptDelayMs);
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
            sandbox: false,
            preload: (0, node_path_1.join)(__dirname, 'preload.js'),
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