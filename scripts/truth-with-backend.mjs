#!/usr/bin/env node
import net from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_PORT = 9999;
const ELECTRON_DEBUG_PORT = 9222;
const HEALTH_PATH = `/api/v1/healthz`;
const HEALTH_TIMEOUT_MS = 30_000;
const REPO_ROOT = path.resolve(__dirname, '..');
const LAUNCH_PREFIX = 'blackskies-truth-';

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

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toPowerShellArray(values) {
  return `@(${values.map((value) => quotePowerShell(value)).join(', ')})`;
}

function resolveTruthProjectSourcePath(sampleRoot) {
  const outlinePath = path.join(sampleRoot, 'outline.json');
  if (existsSync(outlinePath)) {
    return sampleRoot;
  }

  const snapshotsRoot = path.join(sampleRoot, '.snapshots');
  if (existsSync(snapshotsRoot)) {
    const verificationPath = path.join(snapshotsRoot, 'last_verification.json');
    if (existsSync(verificationPath)) {
      try {
        const verification = JSON.parse(readFileSync(verificationPath, 'utf-8'));
        if (verification?.status === 'ok' && Array.isArray(verification.snapshots)) {
          for (const snapshot of verification.snapshots) {
            if (typeof snapshot?.path !== 'string') {
              continue;
            }
            const candidate = path.join(sampleRoot, snapshot.path);
            if (existsSync(path.join(candidate, 'outline.json'))) {
              return candidate;
            }
          }
        }
      } catch {
        // Fall back to scanning the project-local snapshot directory below.
      }
    }

    const snapshotCandidates = readdirSync(snapshotsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('ss_'))
      .map((entry) => path.join(snapshotsRoot, entry.name))
      .sort()
      .reverse();
    for (const candidate of snapshotCandidates) {
      if (existsSync(path.join(candidate, 'outline.json'))) {
        return candidate;
      }
    }
  }

  throw new Error(
    `[truth] Expected a project-local outline.json or verified snapshots under ${sampleRoot}, but none were found.`,
  );
}

function materializeTruthProjectRoot(sourcePath, launchRoot) {
  const projectBaseDir = path.join(launchRoot, 'project-base');
  const projectPath = path.join(projectBaseDir, 'Esther_Estate');
  mkdirSync(projectBaseDir, { recursive: true });
  cpSync(sourcePath, projectPath, { recursive: true, force: true });
  return { projectBaseDir, projectPath };
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

async function waitForDebuggerPage(port, timeoutMs) {
  const url = `http://127.0.0.1:${port}/json/list`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        const payload = await response.json();
        if (Array.isArray(payload)) {
          const pageTarget = payload.find((target) => target?.type === 'page');
          if (pageTarget?.webSocketDebuggerUrl) {
            return pageTarget;
          }
        }
      }
    } catch {
      // Ignore and retry until the page target appears.
    }
    await delay(250);
  }
  throw new Error(`[truth] Electron did not expose a page target on port ${port}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve(), { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (typeof message.id === 'number') {
        const pending = this.pending.get(message.id);
        if (!pending) {
          return;
        }
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message ?? 'CDP command failed'));
          return;
        }
        pending.resolve(message.result);
      }
    });
    this.ws.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('CDP websocket closed unexpectedly'));
      }
      this.pending.clear();
    });
  }

  async send(method, params = {}) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      this.pending.set(id, { resolve, reject });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  close() {
    this.ws.close();
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    includeCommandLineAPI: true,
  });
  if (result.exceptionDetails) {
    throw new Error(`[truth] CDP evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
  }
  return result.result?.value;
}

async function waitForCondition(check, timeoutMs, label = 'condition') {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      if (await check()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  if (lastError) {
    throw new Error(`[truth] Timed out waiting for ${label}: ${lastError.message}`);
  }
  throw new Error(`[truth] Timed out after ${timeoutMs}ms waiting for ${label}`);
}

async function waitForProcessExit(pid, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      process.kill(pid, 0);
    } catch {
      return;
    }
    await delay(250);
  }
  throw new Error(`[truth] Electron process ${pid} did not exit before cleanup`);
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
  const launchRoot = mkdtempSync(path.join(os.tmpdir(), LAUNCH_PREFIX));
  const truthProjectSourcePath = resolveTruthProjectSourcePath(
    path.resolve(REPO_ROOT, 'sample_project', 'Esther_Estate'),
  );
  const truthProject = materializeTruthProjectRoot(truthProjectSourcePath, launchRoot);

  await ensurePortAvailable('127.0.0.1', SERVICE_PORT);
  console.log(`[truth] launching backend: ${backendCommand} ${backendArgs.join(' ')}`);
  const backendEnv = {
    ...process.env,
    BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_MODE: '1',
    BLACKSKIES_PROJECT_BASE_DIR: truthProject.projectBaseDir,
    PROJECT_BASE_DIR: truthProject.projectBaseDir,
  };
  process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_MODE = '1';
  process.env.BLACKSKIES_PROJECT_BASE_DIR = truthProject.projectBaseDir;
  process.env.PROJECT_BASE_DIR = truthProject.projectBaseDir;
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
    process.env.PLAYWRIGHT = '1';

    await ensurePortAvailable('127.0.0.1', ELECTRON_DEBUG_PORT);

    let browser = null;
    let electronPid = null;
    const userDataDir = path.join(launchRoot, 'electron-user-data');
    const pidFile = path.join(launchRoot, 'electron.pid');
    mkdirSync(userDataDir, { recursive: true });

    const electronBinary = path.resolve(
      REPO_ROOT,
      'app',
      'node_modules',
      'electron',
      'dist',
      process.platform === 'win32' ? 'electron.exe' : 'electron',
    );
    const electronArgs = [
      `--user-data-dir=${userDataDir}`,
      `--remote-debugging-port=${ELECTRON_DEBUG_PORT}`,
      '--remote-debugging-address=127.0.0.1',
      entryPoint,
    ];
    const launchScript = [
      '$ErrorActionPreference = "Stop";',
      `$pidFile = ${quotePowerShell(pidFile)};`,
      `$userDataDir = ${quotePowerShell(userDataDir)};`,
      'New-Item -ItemType Directory -Force -Path $userDataDir | Out-Null;',
      `$proc = Start-Process -FilePath ${quotePowerShell(electronBinary)} -ArgumentList ${toPowerShellArray(electronArgs)} -WorkingDirectory ${quotePowerShell(REPO_ROOT)} -WindowStyle Hidden -PassThru;`,
      'Set-Content -Path $pidFile -Value $proc.Id -NoNewline;',
    ].join(' ');

    const launcher = spawnSync('powershell.exe', ['-NoProfile', '-Command', launchScript], {
      env: launchEnv,
      stdio: 'inherit',
      cwd: REPO_ROOT,
    });
    if (launcher.status !== 0) {
      throw new Error(
        `[truth] Electron launcher failed before CDP attach with exit code ${
          launcher.status ?? 'unknown'
        }`,
      );
    }
    if (!existsSync(pidFile)) {
      throw new Error('[truth] Electron launcher did not write a PID file');
    }
    electronPid = Number.parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
    if (!Number.isFinite(electronPid) || electronPid <= 0) {
      throw new Error('[truth] Electron launcher wrote an invalid PID');
    }
    console.log('[truth] launched Electron PID', electronPid);

    const devtoolsEndpoint = await waitForDebuggerVersion(ELECTRON_DEBUG_PORT, 30_000);
    const pageTarget = await waitForDebuggerPage(ELECTRON_DEBUG_PORT, 30_000);
    console.log('[truth] debugger targets', {
      browser: devtoolsEndpoint,
      page: pageTarget?.webSocketDebuggerUrl ?? null,
      url: pageTarget?.url ?? null,
    });
    console.log('[truth] connecting over CDP', pageTarget.webSocketDebuggerUrl);
    const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    try {
      const launcherContext = await evaluate(
        cdp,
        `(() => (async () => ({
          hasProjectLoader: Boolean(window.projectLoader),
          samplePath: await window.projectLoader?.getSampleProjectPath?.(),
        }))())()`,
      );
      console.log('[truth] launcher context', launcherContext);
      console.log('[truth] resolved truth project path', truthProject.projectPath);
      const sampleLoadProbe = await evaluate(
        cdp,
        `(() => (async () => {
          const samplePath = ${JSON.stringify(truthProject.projectPath)};
          const response = await window.projectLoader?.loadProject?.({ path: samplePath });
          if (!response || typeof response !== 'object') {
            return { ok: false, error: 'Project loader returned an unexpected payload.' };
          }
          return {
            ok: Boolean(response.ok),
            error: response.ok ? null : response.error?.message ?? null,
            issueCount: response.ok ? response.issues?.length ?? 0 : response.error?.issues?.length ?? 0,
            projectId: response.ok ? response.project.path.split(/[\\\\/]/).at(-1) ?? null : null,
            sceneIds: response.ok ? response.project.scenes.map((scene) => scene.id) : [],
          };
        })())()`,
      );
      console.log('[truth] sample load probe', sampleLoadProbe);

      const samplePathLiteral = JSON.stringify(truthProject.projectPath);
      const sampleNameLiteral = JSON.stringify(path.basename(truthProject.projectPath));
      await evaluate(
        cdp,
        `(() => {
          localStorage.setItem(
            'blackskies.recent-projects',
            JSON.stringify([
              {
                path: ${samplePathLiteral},
                name: ${sampleNameLiteral},
                lastOpened: Date.now(),
              },
            ]),
          );
          localStorage.setItem('blackskies.last-project', ${samplePathLiteral});
          return true;
        })()`,
      );
      await cdp.send('Page.reload', { ignoreCache: true });
      console.log('[truth] seeded recent project and reloaded page');

      console.log('[truth] waiting for document.readyState');
      await waitForCondition(async () => {
        const readyState = await evaluate(cdp, 'document.readyState');
        return readyState === 'interactive' || readyState === 'complete';
      }, 30_000, 'document.readyState');

      console.log('[truth] waiting for recent project entry');
      await waitForCondition(async () => {
        const recentButtonPresent = await evaluate(
          cdp,
          `Boolean(document.querySelector('[data-testid="recent-projects-list"] button'))`,
        );
        return recentButtonPresent === true;
      }, 30_000, 'recent project entry');

      console.log('[truth] opening recent project');
      await evaluate(
        cdp,
        `(() => {
          const button = document.querySelector('[data-testid="recent-projects-list"] button');
          if (!button) {
            throw new Error('Recent project button not found');
          }
          button.click();
          return true;
        })()`,
      );

      console.log('[truth] waiting for service status pill');
      await waitForCondition(async () => {
        const status = await evaluate(
          cdp,
          `document.querySelector('[data-testid="service-status-pill"]')?.getAttribute('data-status') ?? null`,
        );
        return status === 'online';
      }, 30_000, 'service status pill');

      console.log('[truth] checking bridge health');
      const bridgeHealth = await evaluate(
        cdp,
        `(() => (async () => {
          const result = await window.services?.checkHealth();
          return {
            ok: Boolean(result?.ok),
            status: result?.data?.status ?? null,
          };
        })())()`,
      );
      assert.equal(bridgeHealth.ok, true);
      assert.equal(bridgeHealth.status, 'ok');

      console.log('[truth] waiting for dock workspace');
      await waitForCondition(async () => {
        const dockVisible = await evaluate(
          cdp,
          `Boolean(document.querySelector('[data-testid="dock-workspace"]'))`,
        );
        return dockVisible === true;
      }, 30_000, 'dock workspace');

      const debugSnapshot = await evaluate(
        cdp,
        `Array.isArray(window.__blackskiesDebugLog) ? window.__blackskiesDebugLog.slice(-20) : null`,
      );
      console.log('[truth] renderer debug snapshot', debugSnapshot);

      console.log('[truth] waiting for generate button to enable');
      await waitForCondition(async () => {
        const enabled = await evaluate(
          cdp,
          `(() => {
            const button = document.querySelector('[data-testid="workspace-action-generate"]');
            return Boolean(button) && !(button instanceof HTMLButtonElement ? button.disabled : false);
          })()`,
        );
        return enabled === true;
      }, 30_000, 'generate button enabled');

      console.log('[truth] invoking preflight bridge');
      const preflightResult = await evaluate(
        cdp,
        `(() => (async () => {
          const response = await window.services?.preflightDraft({
            projectId: ${JSON.stringify(sampleLoadProbe.projectId)},
            unitScope: 'scene',
            unitIds: ${JSON.stringify(sampleLoadProbe.sceneIds)},
          });
          if (!response || typeof response !== 'object') {
            return { ok: false, error: 'Preflight bridge returned an unexpected payload.' };
          }
          return {
            ok: Boolean(response.ok),
            status: response.ok ? response.data?.budget?.status ?? null : null,
            sceneCount: response.ok ? response.data?.scenes?.length ?? 0 : 0,
          };
        })())()`,
      );
      console.log('[truth] preflight bridge result', preflightResult);
      assert.equal(preflightResult.ok, true);
      assert.equal(preflightResult.status, 'ok');
      assert.equal(preflightResult.sceneCount, sampleLoadProbe.sceneIds.length);
    } finally {
      cdp.close();
      try {
        spawnSync('taskkill', ['/PID', String(electronPid), '/T', '/F'], { stdio: 'ignore' });
      } catch {
        try {
          process.kill(electronPid);
        } catch {
          // Ignore cleanup races on teardown.
        }
      }
      if (electronPid) {
        await waitForProcessExit(electronPid, 10_000).catch((error) => {
          console.warn('[truth] cleanup warning:', error.message);
        });
      }
      if (launchRoot) {
        for (let attempt = 0; attempt < 10; attempt += 1) {
          try {
            rmSync(launchRoot, { recursive: true, force: true });
            break;
          } catch (error) {
            if (attempt === 9) {
              console.warn('[truth] cleanup warning: failed to remove launch root', error.message);
              break;
            }
            await delay(250);
          }
        }
      }
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
