#!/usr/bin/env node
import net from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import playwright from '../app/node_modules/playwright/index.js';
const { chromium } = playwright;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_PORT = 9999;
const ELECTRON_DEBUG_PORT = 9222;
const HEALTH_PATH = `/api/v1/healthz`;
const HEALTH_TIMEOUT_MS = 30_000;
const REPO_ROOT = path.resolve(__dirname, '..');

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
            `[truth] Port ${port} on ${host} is already in use; stop stray backend services and retry.`,
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

async function waitForDebuggerVersion(port, timeoutMs) {
  const url = `http://127.0.0.1:${port}/json/version`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload?.webSocketDebuggerUrl === 'string') {
          return payload.webSocketDebuggerUrl;
        }
      }
    } catch {
      // Ignore and retry until the port becomes available.
    }
    await delay(250);
  }
  throw new Error(`[truth] Electron did not expose a debugger endpoint on port ${port}`);
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
  console.log(`[truth] launching backend: ${backendCommand} ${backendArgs.join(' ')}`);
  const backendEnv = {
    ...process.env,
    BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_MODE: '1',
  };
  process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_MODE = '1';
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
    if (tests.length > 0) {
      throw new Error(
        `[truth] This command is fixed to the truth-lane scenario and does not accept test selection arguments: ${tests.join(
          ' ',
        )}`,
      );
    }

    const appDir = path.resolve(REPO_ROOT, 'app');
    const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
    const devFallback = path.resolve(appDir, 'main', 'main.ts');
    const entryPoint = existsSync(packagedEntry) ? packagedEntry : devFallback;
    const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
    const rendererUrl = pathToFileURL(rendererIndex).toString();
    const truthLauncherModule = 'scripts.launch_truth_electron';

    console.log('[truth] launching Electron app', {
      entryPoint: entryPoint === packagedEntry ? 'app/dist-electron/main/main.js' : 'app/main/main.ts',
      rendererUrl,
    });

    const launchEnv = {
      ...process.env,
      ELECTRON_RENDERER_URL: rendererUrl,
      BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_MODE: '1',
      BLACKSKIES_TRUTH_DEBUG_PORT: String(ELECTRON_DEBUG_PORT),
      PLAYWRIGHT: '1',
    };

    process.env.ELECTRON_RENDERER_URL = rendererUrl;
    process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_MODE = '1';
    process.env.BLACKSKIES_TRUTH_DEBUG_PORT = String(ELECTRON_DEBUG_PORT);
    process.env.PLAYWRIGHT = '1';

    await ensurePortAvailable('127.0.0.1', ELECTRON_DEBUG_PORT);

    let browser = null;
    let electronPid = null;
    const helperPython = process.env.PYTHON ?? 'C:/Dev/black-skies/.venv/Scripts/python.exe';
    let launcher;
    try {
      launcher = spawn(helperPython, ['-m', truthLauncherModule], {
        env: launchEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: REPO_ROOT,
      });
    } catch (error) {
      throw new Error(
        `[truth] Unable to start the Python Electron helper via Node spawn. See docs/reviews/truth_lane_definition_and_gap_report.md. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const helperPidPromise = new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      launcher.stdout?.setEncoding('utf8');
      launcher.stderr?.setEncoding('utf8');
      launcher.stdout?.on('data', (chunk) => {
        stdout += chunk;
      });
      launcher.stderr?.on('data', (chunk) => {
        stderr += chunk;
      });
      launcher.once('error', reject);
      launcher.once('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`[truth] Electron helper failed: ${stderr || stdout || code}`));
          return;
        }
        const pid = Number.parseInt(stdout.trim(), 10);
        if (!Number.isFinite(pid) || pid <= 0) {
          reject(new Error(`[truth] Electron helper did not return a valid PID: ${stdout || stderr}`));
          return;
        }
        resolve(pid);
      });
    });

    electronPid = await helperPidPromise;
    console.log('[truth] launched Electron PID', electronPid);

    const devtoolsEndpoint = await waitForDebuggerVersion(ELECTRON_DEBUG_PORT, 30_000);
    console.log('[truth] connecting over CDP', devtoolsEndpoint);
    browser = await chromium.connectOverCDP(devtoolsEndpoint);

    try {
      const context = browser.contexts()[0];
      if (!context) {
        throw new Error('[truth] Electron did not expose a browser context for validation');
      }
      let page = context.pages()[0] ?? null;
      for (let attempt = 0; attempt < 120 && !page; attempt += 1) {
        await delay(250);
        page = context.pages()[0] ?? null;
      }
      if (!page) {
        throw new Error('[truth] Electron did not open a window for validation');
      }
      await page.waitForLoadState('domcontentloaded');

      const statusPill = page.getByTestId('service-status-pill');
      await statusPill.waitFor({ state: 'visible', timeout: 30_000 });
      assert.equal(await statusPill.getAttribute('data-status'), 'online');

      const bridgeHealth = await page.evaluate(async () => {
        const result = await window.services?.checkHealth();
        return {
          ok: Boolean(result?.ok),
          status: result?.data?.status ?? null,
        };
      });
      assert.equal(bridgeHealth.ok, true);
      assert.equal(bridgeHealth.status, 'online');

      await page.getByTestId('dock-workspace').waitFor({ state: 'visible', timeout: 30_000 });

      const generateButton = page.getByTestId('workspace-action-generate');
      await generateButton.waitFor({ state: 'visible', timeout: 30_000 });
      await generateButton.click();

      await page.getByRole('dialog', { name: /Draft preflight/i }).waitFor({
        state: 'visible',
        timeout: 30_000,
      });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {
          // The app may already be shutting down; cleanup still continues.
        }
      }
      if (electronPid !== null) {
        try {
          process.kill(electronPid);
        } catch {
          // Ignore cleanup races on teardown.
        }
      }
      await delay(5_000);
    }
  } finally {
    cleanup();
    await new Promise((resolve) => {
      backend.once('exit', resolve);
      setTimeout(resolve, 5000);
    });
  }
}

run().catch((error) => {
  console.error('[truth] failed', error);
  process.exitCode = 1;
});
