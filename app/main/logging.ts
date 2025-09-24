import type { App } from 'electron';
import { ipcMain } from 'electron';
import { createWriteStream, type WriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { inspect } from 'node:util';

import {
  LOGGING_CHANNELS,
  type DiagnosticsLogLevel,
  type DiagnosticsLogPayload,
} from '../shared/ipc/logging';

export type LogLevel = DiagnosticsLogLevel;

export type LogOrigin = 'main' | 'renderer' | 'service';

export interface Logger {
  debug: (message: string, details?: unknown) => void;
  info: (message: string, details?: unknown) => void;
  warn: (message: string, details?: unknown) => void;
  error: (message: string, details?: unknown) => void;
}

interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  origin: LogOrigin;
  scope: string;
  message: string;
  details?: unknown;
}

let loggingInitialized = false;
let mainLogStream: WriteStream | null = null;
let diagnosticsLogStream: WriteStream | null = null;
let mainLogPath: string | null = null;
let diagnosticsLogPath: string | null = null;
let rendererLogRegistered = false;

const loggerCache = new Map<string, Logger>();
const originalConsole = new Map<ConsoleMethod, Console[ConsoleMethod]>();

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const CONSOLE_LEVELS: ReadonlyArray<[ConsoleMethod, LogLevel]> = [
  ['log', 'info'],
  ['info', 'info'],
  ['warn', 'warn'],
  ['error', 'error'],
  ['debug', 'debug'],
];

function resolveBaseDirectory(app: App): string {
  if (process.platform === 'win32' && process.env.APPDATA) {
    return join(process.env.APPDATA, 'BlackSkies');
  }

  return join(app.getPath('userData'), 'BlackSkies');
}

async function ensureDirectory(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

function sanitizeDetails(details: unknown): unknown {
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
      return JSON.parse(
        JSON.stringify(details, (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
    } catch (error) {
      return inspect(details, { depth: 1, breakLength: 80 });
    }
  }

  return details;
}

function writeStructuredLog(entry: StructuredLogEntry): void {
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

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((argument) => {
      if (typeof argument === 'string') {
        return argument;
      }
      return inspect(argument, { depth: 1, breakLength: 80 });
    })
    .join(' ');
}

function patchConsole(): void {
  if (originalConsole.size > 0) {
    return;
  }

  const consoleLogger = getLogger('main.console');

  CONSOLE_LEVELS.forEach(([method, level]) => {
    const original = console[method].bind(console);
    originalConsole.set(method, original);
    console[method] = (...args: unknown[]) => {
      original(...args);
      const message = formatConsoleArgs(args);
      logWithLevel(consoleLogger, level, message);
    };
  });
}

function restoreConsole(): void {
  if (originalConsole.size === 0) {
    return;
  }

  originalConsole.forEach((implementation, method) => {
    console[method] = implementation;
  });
  originalConsole.clear();
}

function ensureInitialized(): void {
  if (!loggingInitialized || !mainLogStream || !diagnosticsLogStream) {
    throw new Error('Logging has not been initialized. Call initializeMainLogging() first.');
  }
}

function normalizeScope(scope: string, origin: LogOrigin): string {
  const trimmed = scope?.trim();
  if (trimmed) {
    return trimmed;
  }
  return origin === 'renderer' ? 'renderer' : 'main';
}

function createLogger(scope: string, origin: LogOrigin): Logger {
  const actualScope = normalizeScope(scope, origin);

  return {
    debug(message: string, details?: unknown) {
      writeStructuredLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        origin,
        scope: actualScope,
        message,
        details: sanitizeDetails(details),
      });
    },
    info(message: string, details?: unknown) {
      writeStructuredLog({
        timestamp: new Date().toISOString(),
        level: 'info',
        origin,
        scope: actualScope,
        message,
        details: sanitizeDetails(details),
      });
    },
    warn(message: string, details?: unknown) {
      writeStructuredLog({
        timestamp: new Date().toISOString(),
        level: 'warn',
        origin,
        scope: actualScope,
        message,
        details: sanitizeDetails(details),
      });
    },
    error(message: string, details?: unknown) {
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

export async function initializeMainLogging(app: App): Promise<void> {
  if (loggingInitialized) {
    return;
  }

  const baseDir = resolveBaseDirectory(app);
  const logsDir = join(baseDir, 'logs');
  const diagnosticsDir = join(baseDir, 'history', 'diagnostics');

  await Promise.all([ensureDirectory(logsDir), ensureDirectory(diagnosticsDir)]);

  mainLogPath = join(logsDir, 'main.log');
  diagnosticsLogPath = join(diagnosticsDir, 'renderer.log');
  mainLogStream = createWriteStream(mainLogPath, { flags: 'a' });
  diagnosticsLogStream = createWriteStream(diagnosticsLogPath, { flags: 'a' });
  loggingInitialized = true;

  patchConsole();

  const bootstrapLogger = getLogger('main.bootstrap');
  bootstrapLogger.info('Logging initialized', {
    mainLogPath,
    diagnosticsLogPath,
  });
}

export function getLogger(scope: string, origin: LogOrigin = 'main'): Logger {
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

export function logWithLevel(
  logger: Logger,
  level: LogLevel,
  message: string,
  details?: unknown,
): void {
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
      const exhaustiveCheck: never = level;
      throw new Error(`Unsupported log level: ${exhaustiveCheck}`);
    }
  }
}

function normalizeLogLevel(level: DiagnosticsLogLevel | undefined): LogLevel {
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level;
  }
  return 'info';
}

function coerceMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }
  if (message === undefined) {
    return '';
  }
  return inspect(message, { depth: 1, breakLength: 80 });
}

export function registerRendererLogSink(): void {
  ensureInitialized();

  if (rendererLogRegistered) {
    return;
  }

  ipcMain.removeAllListeners(LOGGING_CHANNELS.diagnostics);
  ipcMain.on(LOGGING_CHANNELS.diagnostics, (_event, payload: DiagnosticsLogPayload) => {
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

export async function shutdownLogging(): Promise<void> {
  const tasks: Array<Promise<void>> = [];

  if (mainLogStream) {
    const stream = mainLogStream;
    tasks.push(
      new Promise((resolve) => {
        stream.end(() => resolve());
      }),
    );
    mainLogStream = null;
  }

  if (diagnosticsLogStream) {
    const stream = diagnosticsLogStream;
    tasks.push(
      new Promise((resolve) => {
        stream.end(() => resolve());
      }),
    );
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

export function getMainLogFilePath(): string | null {
  return mainLogPath;
}

export function getDiagnosticsLogFilePath(): string | null {
  return diagnosticsLogPath;
}

