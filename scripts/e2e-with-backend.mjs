#!/usr/bin/env node
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { existsSync } from 'node:fs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_PORT = 9999;
const HEALTH_PATH = `/api/v1/healthz`;
const ANALYTICS_PROJECT_ID = 'proj_esther_estate';
const HEALTH_TIMEOUT_MS = 30_000;
const PLAYWRIGHT_BASE_ARGS = ['--project=electron', '--reporter=list', '--trace=on'];
const DEFAULT_PLAYWRIGHT_WORKERS_ARG = '--workers=1';
const DEFAULT_SMOKE_TEST_FILES = ['gui.flows.spec.ts', 'dock-workspace.spec.ts'];
const REPO_ROOT = path.resolve(__dirname, '..');
const HARNESS_ANALYTICS_PROJECT_ROOT = path.resolve(REPO_ROOT, 'sample_project', ANALYTICS_PROJECT_ID);
const E2E_FIXTURE_MATERIALIZE_SCRIPT = path.resolve(__dirname, 'materialize_e2e_fixture.mjs');
const E2E_FIXTURE_CONTRACT_SCRIPT = path.resolve(__dirname, 'check_e2e_fixture_contract.mjs');
const TIMELINE_PATH = process.env.BLACKSKIES_E2E_TIMELINE_PATH?.trim() ?? '';
const timelineEvents = [];

function normalizeForwardedArgs(rawArgs) {
  const args = [...rawArgs];
  if (args[0] === '--') {
    args.shift();
  }
  return args.filter((arg) => arg !== '--');
}

function hasWorkerFlag(args) {
  return args.some((arg) => arg === '--workers' || arg.startsWith('--workers='));
}

function countWorkerFlags(args) {
  return args.filter((arg) => arg === '--workers' || arg.startsWith('--workers=')).length;
}

function hasTestSelectors(args) {
  const optionsWithValues = new Set([
    '--workers',
    '--project',
    '--reporter',
    '--trace',
    '--grep',
    '--grep-invert',
    '--config',
    '--retries',
    '--timeout',
    '-c',
    '-g',
  ]);
  let expectValueForOption = false;
  for (const arg of args) {
    if (expectValueForOption) {
      expectValueForOption = false;
      continue;
    }
    if (optionsWithValues.has(arg)) {
      expectValueForOption = true;
      continue;
    }
    if (arg.startsWith('-')) {
      continue;
    }
    return true;
  }
  return false;
}

function buildPlaywrightArgs(forwardedArgs, runFullSuite) {
  const hasUserWorkers = hasWorkerFlag(forwardedArgs);
  const selectorsProvided = hasTestSelectors(forwardedArgs);
  const smokeFilterArgs = runFullSuite || selectorsProvided ? [] : ['--grep', 'smoke_'];
  const defaultTestFiles = selectorsProvided ? [] : DEFAULT_SMOKE_TEST_FILES;
  const args = [
    'test',
    ...PLAYWRIGHT_BASE_ARGS,
    ...(hasUserWorkers ? [] : [DEFAULT_PLAYWRIGHT_WORKERS_ARG]),
    ...smokeFilterArgs,
    ...defaultTestFiles,
    ...forwardedArgs,
  ];
  if (countWorkerFlags(args) > 1) {
    throw new Error(
      `[e2e] invalid playwright arg synthesis: duplicate worker flags in ${JSON.stringify(args)}`,
    );
  }
  return args;
}

function assertArgNormalization() {
  const normalizedWithSeparator = normalizeForwardedArgs(['--', '--workers=1']);
  if (normalizedWithSeparator.length !== 1 || normalizedWithSeparator[0] !== '--workers=1') {
    throw new Error('[e2e] arg normalization assertion failed for ["--","--workers=1"]');
  }
  const normalizedWithoutSeparator = normalizeForwardedArgs(['--workers=1']);
  if (normalizedWithoutSeparator.length !== 1 || normalizedWithoutSeparator[0] !== '--workers=1') {
    throw new Error('[e2e] arg normalization assertion failed for ["--workers=1"]');
  }
  const noDuplicateWorkers = buildPlaywrightArgs(normalizedWithSeparator, false);
  if (countWorkerFlags(noDuplicateWorkers) !== 1) {
    throw new Error('[e2e] arg normalization assertion failed: duplicate worker flags emitted');
  }
}
export { normalizeForwardedArgs, buildPlaywrightArgs };

function assertElectronBuildArtifacts() {
  const appDir = path.resolve(REPO_ROOT, 'app');
  const packagedEntry = path.resolve(appDir, 'dist-electron', 'main', 'main.js');
  const rendererIndex = path.resolve(appDir, 'dist', 'index.html');
  const packagedEntryExists = existsSync(packagedEntry);
  const rendererIndexExists = existsSync(rendererIndex);
  console.log('[e2e] artifact preflight', {
    appDir,
    packagedEntry,
    packagedEntryExists,
    rendererIndex,
    rendererIndexExists,
  });
  if (!packagedEntryExists || !rendererIndexExists) {
    throw new Error(
      `[e2e] missing Electron build artifacts: packagedEntry=${packagedEntry} exists=${packagedEntryExists}, ` +
        `rendererIndex=${rendererIndex} exists=${rendererIndexExists}. ` +
        'Run `pnpm --dir app run build:renderer` and `pnpm --dir app run build:main` before e2e.',
    );
  }
}

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

function sanitizeColorEnv(env) {
  const nextEnv = { ...env };
  // Keep readable colored output; drop contradictory NO_COLOR when FORCE_COLOR is present.
  if (nextEnv.FORCE_COLOR && nextEnv.NO_COLOR) {
    delete nextEnv.NO_COLOR;
  }
  return nextEnv;
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

async function waitForHealth(url, timeoutMs, backendMonitor = null) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const spawnError = backendMonitor?.getSpawnError?.() ?? null;
    if (spawnError) {
      throw new Error(`[e2e] backend failed to start: ${spawnError.message}`);
    }
    if (backendMonitor?.process && backendMonitor.process.exitCode !== null) {
      throw new Error(
        `[e2e] backend exited before health became ready (code=${backendMonitor.process.exitCode}, signal=${String(
          backendMonitor.process.signalCode ?? 'null',
        )})`,
      );
    }
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

async function waitForAnalyticsHealth(baseUrl, timeoutMs) {
  const outlinePath = path.resolve(HARNESS_ANALYTICS_PROJECT_ROOT, 'outline.json');
  const projectRoot = HARNESS_ANALYTICS_PROJECT_ROOT;
  const analyticsEndpoints = [
    `/api/v1/analytics/summary?project_id=${encodeURIComponent(ANALYTICS_PROJECT_ID)}`,
    `/api/v1/analytics/scenes?project_id=${encodeURIComponent(ANALYTICS_PROJECT_ID)}`,
  ];
  const outlineDiagnostics = (() => {
    const diagnostics = {
      project_id: ANALYTICS_PROJECT_ID,
      project_path: projectRoot,
      outline_path: outlinePath,
      outline_exists: existsSync(outlinePath),
      outline_id: null,
      scene_count: null,
      valid_outline_schema: false,
      issues: [],
    };
    if (!diagnostics.outline_exists) {
      diagnostics.issues.push('outline.json missing');
      return diagnostics;
    }
    let payload = null;
    try {
      payload = JSON.parse(readFileSync(outlinePath, 'utf-8'));
    } catch (error) {
      diagnostics.issues.push(
        `outline.json invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
      return diagnostics;
    }
    diagnostics.outline_id = typeof payload?.outline_id === 'string' ? payload.outline_id : null;
    diagnostics.scene_count = Array.isArray(payload?.scenes) ? payload.scenes.length : null;
    if (!diagnostics.outline_id) {
      diagnostics.issues.push('outline_id missing');
    } else if (!/^out_\d{3}$/.test(diagnostics.outline_id)) {
      diagnostics.issues.push(`outline_id invalid: ${diagnostics.outline_id}`);
    }
    if (!Array.isArray(payload?.scenes)) {
      diagnostics.issues.push('scenes missing or not an array');
    } else {
      const badScene = payload.scenes.find(
        (scene) => !scene || typeof scene.chapter_id !== 'string' || !/^ch_\d{4}$/.test(scene.chapter_id),
      );
      if (badScene) {
        diagnostics.issues.push(`invalid scene.chapter_id: ${JSON.stringify(badScene?.chapter_id ?? null)}`);
      }
    }
    diagnostics.valid_outline_schema = diagnostics.issues.length === 0;
    return diagnostics;
  })();

  const deadline = Date.now() + timeoutMs;
  let lastFailure = null;
  while (Date.now() < deadline) {
    let allHealthy = true;
    for (const endpoint of analyticsEndpoints) {
      const url = `${baseUrl}${endpoint}`;
      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          allHealthy = false;
          const bodySnippet = (await response.text()).slice(0, 400);
          lastFailure = {
            project_id: ANALYTICS_PROJECT_ID,
            project_path: projectRoot,
            expected_outline_path: outlinePath,
            outline_exists: outlineDiagnostics.outline_exists,
            outline_validation: {
              valid_outline_schema: outlineDiagnostics.valid_outline_schema,
              outline_id: outlineDiagnostics.outline_id,
              scene_count: outlineDiagnostics.scene_count,
              issues: outlineDiagnostics.issues,
            },
            endpoint,
            status: response.status,
            body: bodySnippet,
          };
          break;
        }
      } catch (error) {
        allHealthy = false;
        lastFailure = {
          project_id: ANALYTICS_PROJECT_ID,
          project_path: projectRoot,
          expected_outline_path: outlinePath,
          outline_exists: outlineDiagnostics.outline_exists,
          outline_validation: {
            valid_outline_schema: outlineDiagnostics.valid_outline_schema,
            outline_id: outlineDiagnostics.outline_id,
            scene_count: outlineDiagnostics.scene_count,
            issues: outlineDiagnostics.issues,
          },
          endpoint,
          error: error instanceof Error ? error.message : String(error),
        };
        break;
      }
    }
    if (allHealthy) {
      return;
    }
    await delay(500);
  }
  throw new Error(
    `[e2e] analytics preflight failed within ${timeoutMs}ms: ${JSON.stringify(lastFailure ?? {})}`,
  );
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

async function classifyPortOccupancy(host, port, healthPath) {
  const healthUrl = `http://${host}:${port}${healthPath}`;
  try {
    const response = await fetch(healthUrl, { method: 'GET' });
    if (!response.ok) {
      let bodySnippet = '';
      try {
        bodySnippet = (await response.text()).slice(0, 200);
      } catch {
        // best-effort diagnostics only
      }
      return {
        classification: 'PORT_CONFLICT_STALE_OR_UNEXPECTED_SERVICE',
        healthy: false,
        status: response.status,
        bodySnippet,
      };
    }
    return {
      classification: 'PORT_OCCUPIED_REUSING_HEALTHY_BACKEND',
      healthy: true,
      status: response.status,
    };
  } catch (error) {
    return {
      classification: 'PORT_CONFLICT_STALE_OR_UNEXPECTED_SERVICE',
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function run() {
  recordTimelineEvent('launcher_start', {
    pid: process.pid,
    platform: process.platform,
  });
  let backend = null;
  let backendStartedByLauncher = false;

  const stopBackend = async () => {
    if (!backendStartedByLauncher || !backend || backend.killed || backend.exitCode !== null) {
      return;
    }
    backend.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => backend.once('exit', resolve)),
      delay(5_000),
    ]);
    if (backend.exitCode === null && !backend.killed) {
      backend.kill('SIGKILL');
      await Promise.race([
        new Promise((resolve) => backend.once('exit', resolve)),
        delay(2_000),
      ]);
    }
  };

  const cleanup = async () => {
    await stopBackend();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    const fixtureMaterializeExitCode = await spawnCommand(
      process.execPath,
      [E2E_FIXTURE_MATERIALIZE_SCRIPT],
      {
        stdio: 'inherit',
        cwd: REPO_ROOT,
      },
    );
    if (fixtureMaterializeExitCode !== 0) {
      throw new Error(
        `[e2e] fixture materialization failed with exit code ${fixtureMaterializeExitCode}`,
      );
    }
    recordTimelineEvent('fixture_materialized', {
      script: E2E_FIXTURE_MATERIALIZE_SCRIPT,
    });

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

    let reuseExistingBackend = false;
    try {
      await ensurePortAvailable('127.0.0.1', SERVICE_PORT);
      recordTimelineEvent('port_check_passed', {
        host: '127.0.0.1',
        port: SERVICE_PORT,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes(`Port ${SERVICE_PORT} on 127.0.0.1 is already in use`)
      ) {
        const occupancy = await classifyPortOccupancy('127.0.0.1', SERVICE_PORT, HEALTH_PATH);
        recordTimelineEvent('port_check_occupied', {
          host: '127.0.0.1',
          port: SERVICE_PORT,
          ...occupancy,
        });
        if (occupancy.healthy) {
          reuseExistingBackend = true;
          console.log(
            `[e2e] preflight: port ${SERVICE_PORT} is occupied by a healthy backend; reusing existing service.`,
          );
        } else {
          throw new Error(
            `[e2e] preflight: port ${SERVICE_PORT} occupied but health check failed; classify as stale/conflict. ` +
              `details=${JSON.stringify(occupancy)}`,
          );
        }
      } else {
        throw error;
      }
    }

    if (!reuseExistingBackend) {
      console.log(`[e2e] launching backend: ${backendCommand} ${backendArgs.join(' ')}`);
    }
    const backendEnv = {
      ...sanitizeColorEnv(process.env),
      BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
      BLACKSKIES_E2E_MODE: "1",
      BLACKSKIES_E2E_SYNTHETIC_MODE: "1",
      BLACKSKIES_E2E_EXTERNAL_SERVICE: "1",
      BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW: "1",
    };
    const sanitizedProcessEnv = sanitizeColorEnv(process.env);
    if (!('NO_COLOR' in sanitizedProcessEnv) && 'NO_COLOR' in process.env) {
      delete process.env.NO_COLOR;
    }
    process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_MODE = "1";
    process.env.BLACKSKIES_E2E_SYNTHETIC_MODE = "1";
    process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE = "1";
    process.env.BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW = "1";
    process.env.PATH = prependVenvPath(process.env.PATH);
    backendEnv.PATH = prependVenvPath(backendEnv.PATH);
    let backendSpawnError = null;
    if (!reuseExistingBackend) {
      backend = spawn(backendCommand, backendArgs, {
        env: backendEnv,
        stdio: 'inherit',
      });
      backendStartedByLauncher = true;
      backend.once('error', (error) => {
        backendSpawnError = error;
      });
      recordTimelineEvent('backend_spawned', {
        command: backendCommand,
        args: backendArgs,
        port: SERVICE_PORT,
      });
    }

    await waitForHealth(`http://127.0.0.1:${SERVICE_PORT}${HEALTH_PATH}`, HEALTH_TIMEOUT_MS, {
      process: backend,
      getSpawnError: () => backendSpawnError,
    });
    recordTimelineEvent('backend_healthy', {
      path: HEALTH_PATH,
      timeout_ms: HEALTH_TIMEOUT_MS,
    });
    const fixtureContractExitCode = await spawnCommand(
      process.execPath,
      [
        E2E_FIXTURE_CONTRACT_SCRIPT,
        '--project-id',
        ANALYTICS_PROJECT_ID,
        '--project-root',
        HARNESS_ANALYTICS_PROJECT_ROOT,
        '--base-url',
        `http://127.0.0.1:${SERVICE_PORT}`,
      ],
      {
        stdio: 'inherit',
        cwd: REPO_ROOT,
      },
    );
    if (fixtureContractExitCode !== 0) {
      throw new Error(
        `[e2e] fixture contract probe failed with exit code ${fixtureContractExitCode}`,
      );
    }
    recordTimelineEvent('analytics_preflight_healthy', {
      endpoints: [
        `/api/v1/analytics/summary?project_id=${encodeURIComponent(ANALYTICS_PROJECT_ID)}`,
        `/api/v1/analytics/scenes?project_id=${encodeURIComponent(ANALYTICS_PROJECT_ID)}`,
      ],
      project_id: ANALYTICS_PROJECT_ID,
      project_path: HARNESS_ANALYTICS_PROJECT_ROOT,
      timeout_ms: HEALTH_TIMEOUT_MS,
    });
    assertElectronBuildArtifacts();
    recordTimelineEvent('artifact_preflight_passed');
    const forwardedArgs = normalizeForwardedArgs(process.argv.slice(2));
    const runFullSuite = process.env.FULL_ANALYTICS_E2E === '1';
    const playwrightCli = path.resolve(
      __dirname,
      '..',
      'app',
      'node_modules',
      'playwright',
      'cli.js',
    );
    const playwrightArgs = buildPlaywrightArgs(forwardedArgs, runFullSuite);
    const command = process.execPath;
    const args = [playwrightCli, ...playwrightArgs];
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
        ...sanitizeColorEnv(process.env),
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
    await cleanup();
    if (backendStartedByLauncher && backend) {
      await new Promise((resolve) => {
        backend.once('exit', resolve);
        setTimeout(resolve, 5000);
      });
    }
    recordTimelineEvent('launcher_cleanup_complete');
    flushTimeline();
  }
}

const isDirectExecution = process.argv[1]
  ? path.resolve(process.argv[1]) === __filename
  : false;

if (isDirectExecution) {
  assertArgNormalization();
  run().catch((error) => {
    console.error('[e2e] failed', error);
    process.exitCode = 1;
  });
}
