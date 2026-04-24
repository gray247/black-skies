#!/usr/bin/env node
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { existsSync } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_PORT = 9999;
const HEALTH_PATH = `/api/v1/healthz`;
const HEALTH_TIMEOUT_MS = 30_000;
const PLAYWRIGHT_ARGS = [
  '--project=electron',
  '--workers=1',
  '--reporter=list',
  '--trace=on',
];
const REPO_ROOT = path.resolve(__dirname, '..');
const TIMELINE_PATH = process.env.BLACKSKIES_E2E_TIMELINE_PATH?.trim() ?? '';
const timelineEvents = [];

function recordTimelineEvent(stage, details = {}) {
  if (!TIMELINE_PATH) {
    return;
  }
  timelineEvents.push({
    ts: new Date().toISOString(),
    stage,
    details,
  });
}

function flushTimeline() {
  if (!TIMELINE_PATH) {
    return;
  }
  const destination = path.resolve(REPO_ROOT, TIMELINE_PATH);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(
    destination,
    `${JSON.stringify({ version: 1, events: timelineEvents }, null, 2)}\n`,
    'utf-8',
  );
}

function resolvePythonCommand() {
  const envPython = process.env.PYTHON?.trim();
  if (envPython) {
    return envPython;
  }
  const venvPython = path.resolve(
    REPO_ROOT,
    '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python',
  );
  if (existsSync(venvPython)) {
    return venvPython;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function prependVenvPath(currentPath) {
  const venvBin = path.resolve(
    REPO_ROOT,
    '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
  );
  if (!existsSync(venvBin)) {
    return currentPath;
  }
  return `${venvBin}${path.delimiter}${currentPath ?? ''}`;
}

function splitCommand(command) {
  const tokens = [];
  if (!command) {
    return tokens;
  }
  const pattern = /"([^"]+)"|([^"\s]+)/g;
  let match;
  while ((match = pattern.exec(command)) !== null) {
    tokens.push(match[1] ?? match[2]);
  }
  return tokens;
}

function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code !== null) {
        resolve(code);
        return;
      }
      if (signal !== null) {
        reject(new Error(`Process terminated with signal ${signal}`));
        return;
      }
      resolve(0);
    });
  });
}

async function waitForHealth(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
      // ignore; backend may still be booting
    }
    await delay(500);
  }
  throw new Error(`Backend did not respond at ${url} within ${timeoutMs}ms`);
}

async function ensurePortAvailable(host, port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(
          new Error(
            `[e2e] Port ${port} on ${host} is already in use; stop stray backend services and retry.`,
          ),
        );
        return;
      }
      reject(err);
    });
    server.once('listening', () => {
      server.close(() => resolve());
    });
    server.listen(port, host);
  });
}

async function run() {
  recordTimelineEvent('launcher_start', {
    pid: process.pid,
    platform: process.platform,
  });
  let backend = null;

  const stopBackend = () => {
    if (backend && !backend.killed) {
      backend.kill('SIGTERM');
    }
  };

  const cleanup = () => {
    stopBackend();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    const serviceCommandEnv = process.env.E2E_SERVICE_COMMAND;
    const defaultCommand = [
      resolvePythonCommand(),
      '-m',
      'uvicorn',
      'blackskies.services.app:create_app',
      '--factory',
      '--host',
      '127.0.0.1',
      '--port',
      String(SERVICE_PORT),
    ];
    const overrideTokens = splitCommand(serviceCommandEnv);
    const backendTokens = overrideTokens.length ? overrideTokens : defaultCommand;
    const backendCommand = backendTokens[0];
    const backendArgs = backendTokens.slice(1);

    await ensurePortAvailable('127.0.0.1', SERVICE_PORT);
    recordTimelineEvent('port_check_passed', {
      host: '127.0.0.1',
      port: SERVICE_PORT,
    });
    console.log(`[e2e] launching backend: ${backendCommand} ${backendArgs.join(' ')}`);
    const backendEnv = {
      ...process.env,
      BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_MODE: "1",
      BLACKSKIES_E2E_SYNTHETIC_MODE: "1",
      BLACKSKIES_E2E_EXTERNAL_SERVICE: "1",
      BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW: "1",
    };
    process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_MODE = "1";
    process.env.BLACKSKIES_E2E_SYNTHETIC_MODE = "1";
    process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE = "1";
    process.env.BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW = "1";
    process.env.PATH = prependVenvPath(process.env.PATH);
    backendEnv.PATH = prependVenvPath(backendEnv.PATH);
    backend = spawn(backendCommand, backendArgs, {
      env: backendEnv,
      stdio: 'inherit',
    });
    recordTimelineEvent('backend_spawned', {
      command: backendCommand,
      args: backendArgs,
      port: SERVICE_PORT,
    });

    await waitForHealth(`http://127.0.0.1:${SERVICE_PORT}${HEALTH_PATH}`, HEALTH_TIMEOUT_MS);
    recordTimelineEvent('backend_healthy', {
      path: HEALTH_PATH,
      timeout_ms: HEALTH_TIMEOUT_MS,
    });
    const tests = process.argv.slice(2);
    const testFiles = tests.length ? tests : ['gui.flows.spec.ts', 'dock-workspace.spec.ts'];
    const runFullSuite = process.env.FULL_ANALYTICS_E2E === '1';
    const smokeFilterArgs =
      runFullSuite || tests.length > 0 ? [] : ['--grep', 'smoke_'];
    const playwrightBin = path.resolve(
      __dirname,
      '..',
      'app',
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'playwright.cmd' : 'playwright',
    );
    const playwrightArgs = [
      'test',
      ...PLAYWRIGHT_ARGS,
      ...smokeFilterArgs,
      ...testFiles,
    ];
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'cmd.exe' : playwrightBin;
    const args = isWindows
      ? ['/c', playwrightBin, ...playwrightArgs]
      : playwrightArgs;
    recordTimelineEvent('playwright_start', {
      command,
      args,
      cwd: path.resolve(REPO_ROOT, 'app'),
    });
    console.log('[e2e] running', command, args);
    process.env.PLAYWRIGHT = '1';
    const exitCode = await spawnCommand(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT: '1',
      },
      cwd: path.resolve(REPO_ROOT, 'app'),
    });
    recordTimelineEvent('playwright_exit', {
      exit_code: exitCode,
    });
    process.exitCode = exitCode;
  } catch (error) {
    recordTimelineEvent('launcher_error', {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    recordTimelineEvent('launcher_cleanup_start');
    cleanup();
    if (backend) {
      await new Promise((resolve) => {
        backend.once('exit', resolve);
        setTimeout(resolve, 5000);
      });
    }
    recordTimelineEvent('launcher_cleanup_complete');
    flushTimeline();
  }
}

run().catch((error) => {
  console.error('[e2e] failed', error);
  process.exitCode = 1;
});
