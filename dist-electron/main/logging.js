"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMainLogging = initializeMainLogging;
exports.getLogger = getLogger;
exports.logWithLevel = logWithLevel;
exports.registerRendererLogSink = registerRendererLogSink;
exports.shutdownLogging = shutdownLogging;
exports.getMainLogFilePath = getMainLogFilePath;
exports.getDiagnosticsLogFilePath = getDiagnosticsLogFilePath;
const electron_1 = require("electron");
const node_fs_1 = require("node:fs");
const node_fs_2 = require("node:fs");
const node_path_1 = require("node:path");
const node_util_1 = require("node:util");
const logging_js_1 = require("../shared/ipc/logging.js");
let loggingInitialized = false;
let mainLogStream = null;
let diagnosticsLogStream = null;
let mainLogPath = null;
let diagnosticsLogPath = null;
let rendererLogRegistered = false;
const loggerCache = new Map();
const originalConsole = new Map();
const CONSOLE_LEVELS = [
    ['log', 'info'],
    ['info', 'info'],
    ['warn', 'warn'],
    ['error', 'error'],
    ['debug', 'debug'],
];
function resolveBaseDirectory(app) {
    if (process.platform === 'win32' && process.env.APPDATA) {
        return (0, node_path_1.join)(process.env.APPDATA, 'BlackSkies');
    }
    return (0, node_path_1.join)(app.getPath('userData'), 'BlackSkies');
}
async function ensureDirectory(path) {
    await node_fs_2.promises.mkdir(path, { recursive: true });
}
function sanitizeDetails(details) {
    if (details === undefined || details === null) {
        return details;
    }
    if (details instanceof Error) {
        return {
            name: details.name,
            message: details.message,
            stack: details.stack,
        };
    }
    if (typeof details === 'bigint') {
        return details.toString();
    }
    if (typeof details === 'object') {
        try {
            return JSON.parse(JSON.stringify(details, (_key, value) => typeof value === 'bigint' ? value.toString() : value));
        }
        catch (error) {
            return (0, node_util_1.inspect)(details, { depth: 1, breakLength: 80 });
        }
    }
    return details;
}
function writeStructuredLog(entry) {
    const payload = { ...entry };
    if (payload.details === undefined) {
        delete payload.details;
    }
    const serialized = `${JSON.stringify(payload)}\n`;
    const targetStream = entry.origin === 'renderer' ? diagnosticsLogStream : mainLogStream;
    if (targetStream) {
        targetStream.write(serialized);
        return;
    }
    const fallback = entry.origin === 'renderer' ? originalConsole.get('warn') : originalConsole.get('error');
    fallback?.call(console, '[logging] stream unavailable', payload);
}
function formatConsoleArgs(args) {
    return args
        .map((argument) => {
        if (typeof argument === 'string') {
            return argument;
        }
        return (0, node_util_1.inspect)(argument, { depth: 1, breakLength: 80 });
    })
        .join(' ');
}
function patchConsole() {
    if (originalConsole.size > 0) {
        return;
    }
    const consoleLogger = getLogger('main.console');
    CONSOLE_LEVELS.forEach(([method, level]) => {
        const original = console[method].bind(console);
        originalConsole.set(method, original);
        console[method] = (...args) => {
            original(...args);
            const message = formatConsoleArgs(args);
            logWithLevel(consoleLogger, level, message);
        };
    });
}
function restoreConsole() {
    if (originalConsole.size === 0) {
        return;
    }
    originalConsole.forEach((implementation, method) => {
        console[method] = implementation;
    });
    originalConsole.clear();
}
function ensureInitialized() {
    if (!loggingInitialized || !mainLogStream || !diagnosticsLogStream) {
        throw new Error('Logging has not been initialized. Call initializeMainLogging() first.');
    }
}
function normalizeScope(scope, origin) {
    const trimmed = scope?.trim();
    if (trimmed) {
        return trimmed;
    }
    return origin === 'renderer' ? 'renderer' : 'main';
}
function createLogger(scope, origin) {
    const actualScope = normalizeScope(scope, origin);
    return {
        debug(message, details) {
            writeStructuredLog({
                timestamp: new Date().toISOString(),
                level: 'debug',
                origin,
                scope: actualScope,
                message,
                details: sanitizeDetails(details),
            });
        },
        info(message, details) {
            writeStructuredLog({
                timestamp: new Date().toISOString(),
                level: 'info',
                origin,
                scope: actualScope,
                message,
                details: sanitizeDetails(details),
            });
        },
        warn(message, details) {
            writeStructuredLog({
                timestamp: new Date().toISOString(),
                level: 'warn',
                origin,
                scope: actualScope,
                message,
                details: sanitizeDetails(details),
            });
        },
        error(message, details) {
            writeStructuredLog({
                timestamp: new Date().toISOString(),
                level: 'error',
                origin,
                scope: actualScope,
                message,
                details: sanitizeDetails(details),
            });
        },
    };
}
async function initializeMainLogging(app) {
    if (loggingInitialized) {
        return;
    }
    const baseDir = resolveBaseDirectory(app);
    const logsDir = (0, node_path_1.join)(baseDir, 'logs');
    const diagnosticsDir = (0, node_path_1.join)(baseDir, 'history', 'diagnostics');
    await Promise.all([ensureDirectory(logsDir), ensureDirectory(diagnosticsDir)]);
    mainLogPath = (0, node_path_1.join)(logsDir, 'main.log');
    diagnosticsLogPath = (0, node_path_1.join)(diagnosticsDir, 'renderer.log');
    mainLogStream = (0, node_fs_1.createWriteStream)(mainLogPath, { flags: 'a' });
    diagnosticsLogStream = (0, node_fs_1.createWriteStream)(diagnosticsLogPath, { flags: 'a' });
    loggingInitialized = true;
    patchConsole();
    const bootstrapLogger = getLogger('main.bootstrap');
    bootstrapLogger.info('Logging initialized', {
        mainLogPath,
        diagnosticsLogPath,
    });
}
function getLogger(scope, origin = 'main') {
    ensureInitialized();
    const key = `${origin}:${scope}`;
    const cached = loggerCache.get(key);
    if (cached) {
        return cached;
    }
    const logger = createLogger(scope, origin);
    loggerCache.set(key, logger);
    return logger;
}
function logWithLevel(logger, level, message, details) {
    switch (level) {
        case 'debug':
            logger.debug(message, details);
            break;
        case 'info':
            logger.info(message, details);
            break;
        case 'warn':
            logger.warn(message, details);
            break;
        case 'error':
            logger.error(message, details);
            break;
        default: {
            const exhaustiveCheck = level;
            throw new Error(`Unsupported log level: ${exhaustiveCheck}`);
        }
    }
}
function normalizeLogLevel(level) {
    if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
        return level;
    }
    return 'info';
}
function coerceMessage(message) {
    if (typeof message === 'string') {
        return message;
    }
    if (message === undefined) {
        return '';
    }
    return (0, node_util_1.inspect)(message, { depth: 1, breakLength: 80 });
}
function registerRendererLogSink() {
    ensureInitialized();
    if (rendererLogRegistered) {
        return;
    }
    electron_1.ipcMain.removeAllListeners(logging_js_1.LOGGING_CHANNELS.diagnostics);
    electron_1.ipcMain.on(logging_js_1.LOGGING_CHANNELS.diagnostics, (_event, payload) => {
        if (!payload) {
            return;
        }
        const level = normalizeLogLevel(payload.level);
        const scope = typeof payload.scope === 'string' ? payload.scope : 'renderer';
        const message = coerceMessage(payload.message);
        const logger = getLogger(scope, 'renderer');
        logWithLevel(logger, level, message, payload.details);
    });
    rendererLogRegistered = true;
}
async function shutdownLogging() {
    const tasks = [];
    if (mainLogStream) {
        const stream = mainLogStream;
        tasks.push(new Promise((resolve) => {
            stream.end(() => resolve());
        }));
        mainLogStream = null;
    }
    if (diagnosticsLogStream) {
        const stream = diagnosticsLogStream;
        tasks.push(new Promise((resolve) => {
            stream.end(() => resolve());
        }));
        diagnosticsLogStream = null;
    }
    loggerCache.clear();
    rendererLogRegistered = false;
    loggingInitialized = false;
    restoreConsole();
    if (tasks.length > 0) {
        await Promise.allSettled(tasks);
    }
}
function getMainLogFilePath() {
    return mainLogPath;
}
function getDiagnosticsLogFilePath() {
    return diagnosticsLogPath;
}
//# sourceMappingURL=logging.js.map