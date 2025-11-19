#!/usr/bin/env node
import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const SERVICE_PORT = 9999;
const HEALTH_PATH = `/api/v1/healthz`;
const HEALTH_TIMEOUT_MS = 30_000;
const PLAYWRIGHT_ARGS = [
  '--project=electron',
  '--workers=1',
  '--reporter=list',
  '--trace=on',
];

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
  const serviceCommandEnv = process.env.E2E_SERVICE_COMMAND;
  const defaultCommand = [
    process.env.PYTHON ?? 'C:/Dev/black-skies/.venv/Scripts/python.exe',
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
  console.log(`[e2e] launching backend: ${backendCommand} ${backendArgs.join(' ')}`);
  const backendEnv = {
    ...process.env,
    BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_MODE: "1",
  };
  process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_MODE = "1";
  process.env.PATH = `C:/Dev/black-skies/.venv/Scripts;` + process.env.PATH;
  const backend = spawn(backendCommand, backendArgs, {
    env: backendEnv,
    stdio: 'inherit',
  });

  const stopBackend = () => {
    if (!backend.killed) {
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
    await waitForHealth(`http://127.0.0.1:${SERVICE_PORT}${HEALTH_PATH}`, HEALTH_TIMEOUT_MS);
    const tests = process.argv.slice(2);
    const testFiles = tests.length ? tests : ['gui.flows.spec.ts', 'dock-workspace.spec.ts'];
    const runFullSuite = process.env.FULL_ANALYTICS_E2E === '1';
    const smokeFilterArgs = runFullSuite ? [] : ['--grep', 'smoke_'];
    const testArgs = [
      '--filter',
      'app',
      'exec',
      'playwright',
      'test',
      ...PLAYWRIGHT_ARGS,
      ...smokeFilterArgs,
      ...testFiles,
    ];
    const pnpmExecPath = process.env.npm_execpath;
    let pnpmCommand;
    let pnpmArgs;
    if (pnpmExecPath) {
      pnpmCommand = process.execPath;
      pnpmArgs = [pnpmExecPath, ...testArgs];
    } else {
      pnpmCommand = 'corepack';
      pnpmArgs = ['pnpm', ...testArgs];
    }
    const exitCode = await spawnCommand(pnpmCommand, pnpmArgs, {
      stdio: 'inherit',
    });
    process.exitCode = exitCode;
  } finally {
    cleanup();
    await new Promise((resolve) => {
      backend.once('exit', resolve);
      setTimeout(resolve, 5000);
    });
  }
}

run().catch((error) => {
  console.error('[e2e] failed', error);
  process.exitCode = 1;
});
