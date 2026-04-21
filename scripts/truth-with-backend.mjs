#!/usr/bin/env node
import net from 'node:net';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cpSync,
  closeSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket as NodeWebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_PORT = 9999;
const ELECTRON_DEBUG_PORT = 9222;
const HEALTH_PATH = `/api/v1/healthz`;
const HEALTH_TIMEOUT_MS = 30_000;
const REPO_ROOT = path.resolve(__dirname, '..');
const LAUNCH_PREFIX = 'blackskies-truth-';
const RECEIPT_DIR = path.join(REPO_ROOT, 'build', 'truth_receipts');
const AUDITED_CHAIN_CONTRACT_PATH = path.join(REPO_ROOT, 'docs', 'specs', 'audited_chain_contract.json');
const FAILURE_CATEGORY = Object.freeze({
  BOOT_FAIL: 'BOOT_FAIL',
  CDP_CONNECT_FAIL: 'CDP_CONNECT_FAIL',
  RECEIPT_CONTRACT_FAIL: 'RECEIPT_CONTRACT_FAIL',
  ARTIFACT_VALIDATION_FAIL: 'ARTIFACT_VALIDATION_FAIL',
});
let latestReceipt = buildTruthReceipt();
const WebSocketImpl = globalThis.WebSocket ?? NodeWebSocket;

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

function normalizeErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

function makeFailureError(category, message, details = {}) {
  const error = new Error(message);
  error.truthCategory = category;
  error.truthDetails = details;
  return error;
}

function recordFailure(receipt, category, message, details = {}) {
  receipt.failures.push({
    category,
    message,
    ...details,
  });
}

function classifyError(error) {
  if (error && typeof error === 'object' && typeof error.truthCategory === 'string') {
    return error.truthCategory;
  }
  const message = normalizeErrorMessage(error);
  if (/CDP websocket closed unexpectedly|debugger endpoint|page target|CDP/i.test(message)) {
    return FAILURE_CATEGORY.CDP_CONNECT_FAIL;
  }
  if (/receipt|provenance|forbidden_route|forbidden_result_origin|route=/i.test(message)) {
    return FAILURE_CATEGORY.RECEIPT_CONTRACT_FAIL;
  }
  if (/artifact|snapshot|export|accepted scene|metadata missing|authority violation/i.test(message)) {
    return FAILURE_CATEGORY.ARTIFACT_VALIDATION_FAIL;
  }
  return FAILURE_CATEGORY.BOOT_FAIL;
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

function extractSceneBody(markdown) {
  const normalized = String(markdown ?? '').replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  if (lines.length >= 3 && lines[0].trim() === '---') {
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index].trim() === '---') {
        return lines.slice(index + 1).join('\n');
      }
    }
  }
  return normalized;
}

function computeBodySha256(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n').trim();
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function parseProvenanceMetaLine(line, label) {
  const normalized = String(line ?? '').trim();
  const prefix = `${label}:`;
  if (!normalized.startsWith(prefix)) {
    return null;
  }
  const payload = normalized.slice(prefix.length).trim();
  const fields = Object.fromEntries(
    payload
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=');
        if (separatorIndex < 0) {
          return [part, ''];
        }
        return [part.slice(0, separatorIndex).trim(), part.slice(separatorIndex + 1).trim()];
      }),
  );
  if (!fields.route || !fields.origin || !fields.provider_called || !fields.budget_delta) {
    return null;
  }
  return {
    routeName: fields.route,
    origin: fields.origin,
    providerCalled: fields.provider_called === 'true',
    budgetDeltaRaw: fields.budget_delta,
  };
}

async function assertOkResponse(response, label) {
  if (response.ok) {
    return;
  }
  const bodyText = await response.text();
  throw new Error(`${label} failed: ${bodyText}`);
}

function buildTruthReceipt() {
  return {
    schema_version: 'TruthLaneReceipt v1',
    started_at: new Date().toISOString(),
    finished_at: null,
    ui_chain_passed: false,
    service_extension_passed: false,
    routes_hit: [],
    provenance: [],
    artifacts: [],
    failures: [],
  };
}

function writeTruthReceipt(receipt) {
  mkdirSync(RECEIPT_DIR, { recursive: true });
  const finalized = {
    ...receipt,
    finished_at: new Date().toISOString(),
  };
  const jsonPath = path.join(RECEIPT_DIR, 'latest.json');
  writeFileSync(jsonPath, `${JSON.stringify(finalized, null, 2)}\n`, 'utf8');

  const lines = [
    'Black Skies Truth Lane Receipt',
    `started_at: ${finalized.started_at}`,
    `finished_at: ${finalized.finished_at}`,
    `ui_chain_passed: ${String(finalized.ui_chain_passed)}`,
    `service_extension_passed: ${String(finalized.service_extension_passed)}`,
    '',
    'routes_hit:',
    ...(finalized.routes_hit.length
      ? finalized.routes_hit.map((route) => `- ${route}`)
      : ['- (none)']),
    '',
    'provenance:',
    ...(finalized.provenance.length
      ? finalized.provenance.map(
          (item) =>
            `- ${item.action}: route_name=${item.route_name}, provider_called=${String(
              item.provider_called,
            )}, result_origin=${item.result_origin}, budget_delta=${item.budget_delta}`,
        )
      : ['- (none)']),
    '',
    'artifacts:',
    ...(finalized.artifacts.length
      ? finalized.artifacts.map((item) => `- ${item.kind}: ${item.path}`)
      : ['- (none)']),
    '',
    'failures:',
    ...(finalized.failures.length
      ? finalized.failures.map((failure) => {
          const detailPairs = Object.entries(failure)
            .filter(([key]) => key !== 'category' && key !== 'message')
            .map(([key, value]) => `${key}=${String(value)}`);
          const detailSuffix = detailPairs.length ? ` (${detailPairs.join(', ')})` : '';
          return `- ${failure.category}: ${failure.message}${detailSuffix}`;
        })
      : ['- (none)']),
    '',
  ];
  const textPath = path.join(RECEIPT_DIR, 'latest.txt');
  writeFileSync(textPath, lines.join('\n'), 'utf8');
  console.log('[truth] receipt written', { jsonPath, textPath });
}

function loadAuditedChainContract() {
  const raw = JSON.parse(readFileSync(AUDITED_CHAIN_CONTRACT_PATH, 'utf8'));
  const allowedOrigins = raw?.default_route_guards?.ui_truth_lane_allowed_result_origins;
  return {
    forbiddenRoutes: new Set(raw?.default_route_guards?.ui_truth_lane_forbidden_routes ?? []),
    forbiddenOrigins: new Set(raw?.default_route_guards?.ui_truth_lane_forbidden_result_origins ?? []),
    allowedOrigins: new Set(
      Array.isArray(allowedOrigins) && allowedOrigins.length > 0
        ? allowedOrigins
        : ['provider', 'fallback', 'local'],
    ),
    validRouteNames: new Set(['draft/critique', 'draft/rewrite']),
  };
}

function enforceTruthReceiptRules(receipt) {
  const contract = loadAuditedChainContract();
  const failures = [];
  const actionToRoute = new Map([
    ['critique', 'draft/critique'],
    ['rewrite', 'draft/rewrite'],
  ]);

  const forbiddenPhase4 = receipt.routes_hit.filter((route) => route.startsWith('/api/v1/phase4/'));
  for (const route of forbiddenPhase4) {
    failures.push(`route=${route} rule=forbidden_phase4_route artifact=routes_hit`);
  }
  for (const route of receipt.routes_hit) {
    if (contract.forbiddenRoutes.has(route)) {
      failures.push(`route=${route} rule=forbidden_route_from_contract artifact=routes_hit`);
    }
  }

  for (const item of receipt.provenance) {
    const action = String(item?.action ?? '').trim();
    const routeName = String(item?.route_name ?? '').trim();
    const resultOrigin = String(item?.result_origin ?? '').trim();
    const hasProviderCalled = typeof item?.provider_called === 'boolean';
    const hasBudgetDelta = Object.prototype.hasOwnProperty.call(item ?? {}, 'budget_delta');
    if (!routeName || !resultOrigin || !hasProviderCalled || !hasBudgetDelta) {
      failures.push(
        `route=${routeName || '(missing)'} rule=missing_provenance_fields artifact=provenance`,
      );
      continue;
    }
    if (!contract.validRouteNames.has(routeName)) {
      failures.push(`route=${routeName} rule=invalid_route_name_for_provenance artifact=provenance`);
    }
    const expectedRouteForAction = actionToRoute.get(action);
    if (expectedRouteForAction && routeName !== expectedRouteForAction) {
      failures.push(
        `route=${routeName} rule=action_route_mismatch:${action}->${expectedRouteForAction} artifact=provenance`,
      );
    }
    if (!contract.allowedOrigins.has(resultOrigin)) {
      failures.push(`route=${routeName} rule=invalid_result_origin:${resultOrigin} artifact=provenance`);
    }
    if (contract.forbiddenOrigins.has(resultOrigin)) {
      failures.push(`route=${routeName} rule=forbidden_result_origin:${resultOrigin} artifact=provenance`);
    }
    if (resultOrigin === 'provider' && item.provider_called !== true) {
      failures.push(`route=${routeName} rule=provider_origin_requires_provider_called artifact=provenance`);
    }
    if ((resultOrigin === 'fallback' || resultOrigin === 'local') && item.provider_called !== false) {
      failures.push(
        `route=${routeName} rule=${resultOrigin}_origin_requires_provider_not_called artifact=provenance`,
      );
    }
  }

  if (failures.length > 0) {
    throw makeFailureError(
      FAILURE_CATEGORY.RECEIPT_CONTRACT_FAIL,
      `Truth lane receipt rule violations:\n${failures.join('\n')}`,
      { violation_count: failures.length },
    );
  }
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

function commandExists(command) {
  if (process.platform === 'win32') {
    const probe = spawnSync('where', [command], { stdio: 'ignore' });
    return probe.status === 0;
  }
  const probe = spawnSync('which', [command], { stdio: 'ignore' });
  return probe.status === 0;
}

async function launchElectronProcess({
  electronBinary,
  electronArgs,
  launchEnv,
  electronStdoutPath,
  electronStderrPath,
  pidFile,
}) {
  if (process.platform === 'win32') {
    const launchScript = [
      '$ErrorActionPreference = "Stop";',
      `$pidFile = ${quotePowerShell(pidFile)};`,
      `$stdoutPath = ${quotePowerShell(electronStdoutPath)};`,
      `$stderrPath = ${quotePowerShell(electronStderrPath)};`,
      `$proc = Start-Process -FilePath ${quotePowerShell(electronBinary)} -ArgumentList ${toPowerShellArray(
        electronArgs,
      )} -WorkingDirectory ${quotePowerShell(REPO_ROOT)} -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru;`,
      'Set-Content -Path $pidFile -Value $proc.Id -NoNewline;',
    ].join(' ');
    const launcher = spawnSync('powershell.exe', ['-NoProfile', '-Command', launchScript], {
      env: launchEnv,
      stdio: 'inherit',
      cwd: REPO_ROOT,
    });
    if (launcher.error) {
      throw makeFailureError(
        FAILURE_CATEGORY.BOOT_FAIL,
        `[truth] Electron launcher failed before CDP attach: ${normalizeErrorMessage(launcher.error)}`,
      );
    }
    if (launcher.status !== 0) {
      throw makeFailureError(
        FAILURE_CATEGORY.BOOT_FAIL,
        `[truth] Electron launcher failed before CDP attach with exit code ${launcher.status ?? 'unknown'}`,
      );
    }
    if (!existsSync(pidFile)) {
      throw makeFailureError(
        FAILURE_CATEGORY.BOOT_FAIL,
        '[truth] Electron launcher did not write a PID file',
      );
    }
    const pid = Number.parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
    if (!Number.isFinite(pid) || pid <= 0) {
      throw makeFailureError(FAILURE_CATEGORY.BOOT_FAIL, '[truth] Electron launcher wrote an invalid PID');
    }
    return pid;
  }

  let stdoutFd;
  let stderrFd;
  try {
    let launchCommand = electronBinary;
    let launchArgs = electronArgs;
    if (process.platform === 'linux' && !process.env.DISPLAY && commandExists('xvfb-run')) {
      launchCommand = 'xvfb-run';
      launchArgs = ['-a', electronBinary, ...electronArgs];
    }
    if (launchCommand !== electronBinary) {
      console.log(`[truth] launching Electron via ${launchCommand} wrapper`);
    }
    stdoutFd = openSync(electronStdoutPath, 'a');
    stderrFd = openSync(electronStderrPath, 'a');
    const electron = spawn(launchCommand, launchArgs, {
      cwd: REPO_ROOT,
      env: launchEnv,
      detached: true,
      stdio: ['ignore', stdoutFd, stderrFd],
    });
    const launchOutcome = await new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn) => (value) => {
        if (!settled) {
          settled = true;
          fn(value);
        }
      };
      electron.once('error', settle(reject));
      electron.once('spawn', settle(resolve));
    });
    void launchOutcome;
    electron.unref();
    writeFileSync(pidFile, String(electron.pid), 'utf8');
    if (!Number.isFinite(electron.pid) || electron.pid <= 0) {
      throw makeFailureError(FAILURE_CATEGORY.BOOT_FAIL, '[truth] Electron launcher wrote an invalid PID');
    }
    return electron.pid;
  } catch (error) {
    throw makeFailureError(
      FAILURE_CATEGORY.BOOT_FAIL,
      `[truth] Electron launcher failed before CDP attach: ${normalizeErrorMessage(error)}`,
    );
  } finally {
    if (stdoutFd !== undefined) {
      closeSync(stdoutFd);
    }
    if (stderrFd !== undefined) {
      closeSync(stderrFd);
    }
  }
}

function createSyntheticTruthProjectSource(launchRoot) {
  const sourceRoot = path.join(launchRoot, 'truth-source', 'Esther_Estate');
  const draftsDir = path.join(sourceRoot, 'drafts');
  const projectId = 'Esther_Estate';
  const chapterId = 'ch_0001';
  const sceneId = 'sc_0001';
  mkdirSync(draftsDir, { recursive: true });
  writeFileSync(
    path.join(sourceRoot, 'project.json'),
    `${JSON.stringify(
      {
        name: 'Esther Estate',
        project_id: projectId,
        scenes: [
          {
            id: sceneId,
            title: 'Opening Scene',
            order: 1,
            chapter_id: chapterId,
          },
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    path.join(sourceRoot, 'outline.json'),
    `${JSON.stringify(
      {
        schema_version: 'OutlineSchema v1',
        outline_id: 'out_001',
        acts: ['Act I: Verified Baseline'],
        chapters: [
          {
            id: chapterId,
            order: 1,
            title: 'Chapter 1',
          },
        ],
        scenes: [
          {
            id: sceneId,
            title: 'Opening Scene',
            order: 1,
            chapter_id: chapterId,
            beat_refs: ['inciting'],
          },
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    path.join(draftsDir, `${sceneId}.md`),
    [
      '---',
      `id: ${sceneId}`,
      'title: Opening Scene',
      'order: 1',
      '---',
      '',
      'Esther stepped into the archive and marked the first verified page.',
      '',
    ].join('\n'),
    'utf8',
  );
  return sourceRoot;
}

function resolveTruthProjectSourcePath(sampleRoot, launchRoot) {
  const outlinePath = path.join(sampleRoot, 'outline.json');
  if (existsSync(outlinePath)) {
    return sampleRoot;
  }

  const fallbackSourcePath = createSyntheticTruthProjectSource(launchRoot);
  console.warn(
    `[truth] sample source missing at ${sampleRoot}; using synthetic source at ${fallbackSourcePath}.`,
  );
  return fallbackSourcePath;
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

async function attachCdpClient(wsUrl) {
  const cdp = new CdpClient(wsUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  return cdp;
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocketImpl(wsUrl);
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
  const receipt = latestReceipt;
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
  const launchRoot = mkdtempSync(path.join(os.tmpdir(), LAUNCH_PREFIX));
  const truthProjectSourcePath = resolveTruthProjectSourcePath(
    path.resolve(REPO_ROOT, 'sample_project', 'Esther_Estate'),
    launchRoot,
  );
  const truthProject = materializeTruthProjectRoot(truthProjectSourcePath, launchRoot);
  const runArtifactDir = path.join(RECEIPT_DIR, `run_${Date.now()}`);
  mkdirSync(runArtifactDir, { recursive: true });
  const electronStdoutPath = path.join(runArtifactDir, 'electron.stdout.log');
  const electronStderrPath = path.join(runArtifactDir, 'electron.stderr.log');
  const electronLauncherPath = path.join(runArtifactDir, 'electron.launch.txt');

  await ensurePortAvailable('127.0.0.1', SERVICE_PORT).catch((error) => {
    throw makeFailureError(FAILURE_CATEGORY.BOOT_FAIL, normalizeErrorMessage(error));
  });
  console.log(`[truth] launching backend: ${backendCommand} ${backendArgs.join(' ')}`);
  const backendEnv = {
    ...process.env,
    BLACKSKIES_SERVICES_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_PORT: String(SERVICE_PORT),
    BLACKSKIES_E2E_MODE: '1',
    BLACKSKIES_E2E_SYNTHETIC_MODE: '0',
    BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW: '0',
    BLACKSKIES_PROJECT_BASE_DIR: truthProject.projectBaseDir,
    PROJECT_BASE_DIR: truthProject.projectBaseDir,
  };
  process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
  process.env.BLACKSKIES_E2E_MODE = '1';
  process.env.BLACKSKIES_E2E_SYNTHETIC_MODE = '0';
  process.env.BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW = '0';
  process.env.BLACKSKIES_PROJECT_BASE_DIR = truthProject.projectBaseDir;
  process.env.PROJECT_BASE_DIR = truthProject.projectBaseDir;
  process.env.PATH = prependVenvPath(process.env.PATH);
  backendEnv.PATH = prependVenvPath(backendEnv.PATH);
  const backend = spawn(backendCommand, backendArgs, {
    env: backendEnv,
    stdio: 'inherit',
  });
  let backendSpawnError = null;
  backend.once('error', (error) => {
    backendSpawnError = error;
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
    await waitForHealth(`http://127.0.0.1:${SERVICE_PORT}${HEALTH_PATH}`, HEALTH_TIMEOUT_MS).catch((error) => {
      throw makeFailureError(FAILURE_CATEGORY.BOOT_FAIL, normalizeErrorMessage(error));
    });
    if (backendSpawnError) {
      throw makeFailureError(
        FAILURE_CATEGORY.BOOT_FAIL,
        `[truth] backend launch failed: ${normalizeErrorMessage(backendSpawnError)}`,
      );
    }
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
      BLACKSKIES_E2E_SYNTHETIC_MODE: '0',
      BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW: '0',
      BLACKSKIES_TRUTH_DEBUG_PORT: String(ELECTRON_DEBUG_PORT),
      PLAYWRIGHT: '1',
    };
    if (process.platform === 'linux') {
      launchEnv.ELECTRON_DISABLE_SANDBOX = '1';
    }

    process.env.ELECTRON_RENDERER_URL = rendererUrl;
    process.env.BLACKSKIES_SERVICES_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_PORT = String(SERVICE_PORT);
    process.env.BLACKSKIES_E2E_MODE = '1';
    process.env.BLACKSKIES_E2E_SYNTHETIC_MODE = '0';
    process.env.BLACKSKIES_ENABLE_PHASE4_MOCK_FLOW = '0';
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
    if (process.platform === 'linux') {
      electronArgs.unshift('--no-sandbox');
    }
    const electronCommand = `${electronBinary} ${electronArgs.join(' ')}`;
    writeFileSync(electronLauncherPath, `${electronCommand}\n`, 'utf8');
    receipt.artifacts.push({ kind: 'electron_launch_command', path: path.relative(REPO_ROOT, electronLauncherPath) });
    receipt.artifacts.push({ kind: 'electron_stdout_log', path: path.relative(REPO_ROOT, electronStdoutPath) });
    receipt.artifacts.push({ kind: 'electron_stderr_log', path: path.relative(REPO_ROOT, electronStderrPath) });
    electronPid = await launchElectronProcess({
      electronBinary,
      electronArgs,
      launchEnv,
      electronStdoutPath,
      electronStderrPath,
      pidFile,
    });
    console.log('[truth] launched Electron PID', electronPid);

    const connectDebugger = async () => {
      const devtoolsEndpoint = await waitForDebuggerVersion(ELECTRON_DEBUG_PORT, 30_000);
      const pageTarget = await waitForDebuggerPage(ELECTRON_DEBUG_PORT, 30_000);
      return { devtoolsEndpoint, pageTarget };
    };
    let debuggerInfo;
    try {
      debuggerInfo = await connectDebugger();
    } catch (firstError) {
      console.warn('[truth] initial CDP connect attempt failed; retrying once', normalizeErrorMessage(firstError));
      await delay(800);
      try {
        debuggerInfo = await connectDebugger();
      } catch (secondError) {
        throw makeFailureError(
          FAILURE_CATEGORY.CDP_CONNECT_FAIL,
          `[truth] Failed to connect to CDP after retry: ${normalizeErrorMessage(secondError)}`,
        );
      }
    }
    const { devtoolsEndpoint, pageTarget } = debuggerInfo;
    console.log('[truth] debugger targets', {
      browser: devtoolsEndpoint,
      page: pageTarget?.webSocketDebuggerUrl ?? null,
      url: pageTarget?.url ?? null,
    });
    console.log('[truth] connecting over CDP', pageTarget.webSocketDebuggerUrl);
    let cdp = null;
    try {
      cdp = await attachCdpClient(pageTarget.webSocketDebuggerUrl);
    } catch (firstAttachError) {
      console.warn(
        '[truth] initial CDP websocket attach failed; retrying once',
        normalizeErrorMessage(firstAttachError),
      );
      await delay(800);
      try {
        const retryPageTarget = await waitForDebuggerPage(ELECTRON_DEBUG_PORT, 30_000);
        cdp = await attachCdpClient(retryPageTarget.webSocketDebuggerUrl);
      } catch (secondAttachError) {
        throw makeFailureError(
          FAILURE_CATEGORY.CDP_CONNECT_FAIL,
          `[truth] Initial CDP attach failed after retry: ${normalizeErrorMessage(secondAttachError)}`,
        );
      }
    }

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
            projectId: response.ok
              ? response.project?.project_id ?? response.project?.path?.split(/[\\\\/]/).at(-1) ?? null
              : null,
            sceneIds: response.ok
              ? (() => {
                  const projectScenes = Array.isArray(response.project?.scenes)
                    ? response.project.scenes
                        .map((scene) => (scene && typeof scene.id === 'string' ? scene.id : null))
                        .filter((sceneId) => typeof sceneId === 'string')
                    : [];
                  if (projectScenes.length > 0) {
                    return projectScenes;
                  }
                  const outlineScenes = Array.isArray(response.project?.outline?.scenes)
                    ? response.project.outline.scenes
                        .map((scene) => (scene && typeof scene.id === 'string' ? scene.id : null))
                        .filter((sceneId) => typeof sceneId === 'string')
                    : [];
                  return outlineScenes;
                })()
              : [],
          };
        })())()`,
      );
      console.log('[truth] sample load probe', sampleLoadProbe);
      if (!sampleLoadProbe.ok || !sampleLoadProbe.projectId || sampleLoadProbe.sceneIds.length === 0) {
        throw makeFailureError(
          FAILURE_CATEGORY.RECEIPT_CONTRACT_FAIL,
          '[truth] Failed to resolve project + scene identities from loaded project',
          {
            sample_load_ok: sampleLoadProbe.ok,
            sample_load_error: sampleLoadProbe.error,
            sample_load_issue_count: sampleLoadProbe.issueCount,
            sample_load_project_id: sampleLoadProbe.projectId,
            sample_load_scene_count: sampleLoadProbe.sceneIds.length,
          },
        );
      }

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
      try {
        await cdp.send('Page.reload', { ignoreCache: true });
      } catch (error) {
        console.warn('[truth] CDP reload command warning', normalizeErrorMessage(error));
      }
      await delay(750);
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

      const critiqueBridgeShape = await evaluate(
        cdp,
        `(() => ({
          hasCritiqueDraft: typeof window.services?.critiqueDraft === 'function',
          hasPhase4Critique: typeof window.services?.phase4Critique === 'function',
          hasRewriteDraft: typeof window.services?.rewriteDraft === 'function',
          hasPhase4Rewrite: typeof window.services?.phase4Rewrite === 'function',
          phase4FlagExposed: window.__phase4MockFlowEnabled ?? null,
          phase4Override: window.__BLACKSKIES_PHASE4_MOCK ?? null,
        }))()`,
      );
      console.log('[truth] critique bridge shape', critiqueBridgeShape);
      await evaluate(
        cdp,
        `(() => {
          window.__BLACKSKIES_PHASE4_MOCK = false;
          return window.__BLACKSKIES_PHASE4_MOCK;
        })()`,
      );

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
      if (preflightResult.ok !== true) {
        throw makeFailureError(
          FAILURE_CATEGORY.RECEIPT_CONTRACT_FAIL,
          '[truth] Preflight bridge returned a non-success payload',
          {
            preflight_ok: preflightResult.ok,
            preflight_status: preflightResult.status,
            preflight_scene_count: preflightResult.sceneCount,
          },
        );
      }
      assert.equal(preflightResult.status, 'ok');
      assert.equal(preflightResult.sceneCount, sampleLoadProbe.sceneIds.length);
      receipt.routes_hit.push('/api/v1/draft/preflight');

      console.log(`[truth] selecting primary scene ${sampleLoadProbe.sceneIds[0]} before critique`);
      const sceneSelectionMode = await evaluate(
        cdp,
        `(() => {
          const targetSceneId = ${JSON.stringify(sampleLoadProbe.sceneIds[0])};
          const buttons = Array.from(document.querySelectorAll('.project-home__scene-button'));
          const targetButton = buttons.find((button) =>
            (button.textContent ?? '').includes(targetSceneId),
          );
          if (targetButton instanceof HTMLButtonElement) {
            targetButton.click();
            return 'button';
          }
          window.dispatchEvent(new CustomEvent('test:select-scene', { detail: targetSceneId }));
          return 'event';
        })()`,
      );
      console.log('[truth] scene selection mode', sceneSelectionMode);

      console.log('[truth] waiting for critique button to enable');
      await waitForCondition(async () => {
        const enabled = await evaluate(
          cdp,
          `(() => {
            const button = document.querySelector('[data-testid="workspace-action-critique"]');
            return Boolean(button) && !(button instanceof HTMLButtonElement ? button.disabled : false);
          })()`,
        );
        return enabled === true;
      }, 30_000, 'critique button enabled');

      console.log('[truth] opening critique modal');
      await evaluate(
        cdp,
        `(() => {
          const button = document.querySelector('[data-testid="workspace-action-critique"]');
          if (!(button instanceof HTMLButtonElement)) {
            throw new Error('Critique button not found');
          }
          button.click();
          return true;
        })()`,
      );

      await waitForCondition(async () => {
        const hasCritiqueProvenance = await evaluate(
          cdp,
          `(() => Array.from(document.querySelectorAll('.critique-modal__meta'))
            .some((entry) => (entry.textContent ?? '').includes('Critique provenance:')))()`,
        );
        return hasCritiqueProvenance === true;
      }, 30_000, 'critique provenance metadata');

      const critiqueTruth = await evaluate(
        cdp,
        `(() => {
          const entries = Array.from(document.querySelectorAll('.critique-modal__meta'))
            .map((entry) => (entry.textContent ?? '').trim());
          const critiqueProvenance = entries.find((entry) => entry.startsWith('Critique provenance:')) ?? null;
          const budgetLine = entries.find((entry) => entry.startsWith('Budget source:')) ?? null;
          return { critiqueProvenance, budgetLine };
        })()`,
      );
      assert.ok(critiqueTruth.critiqueProvenance, 'Missing critique provenance line');
      assert.ok(critiqueTruth.budgetLine, 'Missing critique budget source line');
      const critiqueMeta = parseProvenanceMetaLine(critiqueTruth.critiqueProvenance, 'Critique provenance');
      assert.ok(critiqueMeta, 'Critique provenance line format is invalid');
      const critiqueRouteName = critiqueMeta.routeName.trim();
      const critiqueOrigin = critiqueMeta.origin.trim();
      const critiqueProviderCalled = critiqueMeta.providerCalled;
      const critiqueBudgetDeltaRaw = critiqueMeta.budgetDeltaRaw.trim();
      assert.equal(
        critiqueRouteName,
        'draft/critique',
        'Critique default route must remain draft/critique',
      );
      assert.ok(
        critiqueOrigin === 'provider' || critiqueOrigin === 'fallback',
        `Critique result origin must be provider or fallback, received ${critiqueOrigin}`,
      );
      assert.equal(
        critiqueProviderCalled,
        critiqueOrigin === 'provider',
        'Critique provider_called must match critique result_origin',
      );
      if (critiqueOrigin === 'provider') {
        assert.match(
          critiqueTruth.budgetLine,
          /Budget source: budgeted provider call/i,
          'Provider critiques must advertise budgeted provider call source',
        );
      } else if (critiqueBudgetDeltaRaw !== 'none') {
        assert.match(
          critiqueTruth.budgetLine,
          /Budget source: estimate only/i,
          'Fallback critiques with budget estimates must advertise estimate-only source',
        );
      } else {
        assert.match(
          critiqueTruth.budgetLine,
          /Budget source: no budgeted action\./i,
          'Missing critique estimate should fall back to no-budgeted-action text',
        );
      }
      receipt.routes_hit.push('/api/v1/draft/critique');
      receipt.provenance.push({
        action: 'critique',
        route_name: critiqueRouteName,
        provider_called: critiqueProviderCalled,
        result_origin: critiqueOrigin,
        budget_delta: critiqueBudgetDeltaRaw,
      });

      console.log('[truth] requesting rewrite from critique modal');
      await evaluate(
        cdp,
        `(() => {
          const textarea = document.querySelector('.critique-modal textarea');
          if (!(textarea instanceof HTMLTextAreaElement)) {
            throw new Error('Critique rewrite textarea not found');
          }
          textarea.value = 'Tighten pacing beats';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          const button = Array.from(document.querySelectorAll('.critique-modal button'))
            .find((entry) => (entry.textContent ?? '').includes('Generate rewrite'));
          if (!(button instanceof HTMLButtonElement)) {
            throw new Error('Generate rewrite button not found');
          }
          button.click();
          return true;
        })()`,
      );

      await waitForCondition(async () => {
        const hasRewriteProvenance = await evaluate(
          cdp,
          `(() => Array.from(document.querySelectorAll('.critique-modal__meta'))
            .some((entry) => (entry.textContent ?? '').includes('Rewrite provenance:')))()`,
        );
        return hasRewriteProvenance === true;
      }, 30_000, 'rewrite provenance metadata');

      const rewriteTruth = await evaluate(
        cdp,
        `(() => {
          const entries = Array.from(document.querySelectorAll('.critique-modal__meta'))
            .map((entry) => (entry.textContent ?? '').trim());
          const rewriteProvenance = entries.find((entry) => entry.startsWith('Rewrite provenance:')) ?? null;
          const budgetLine = entries.find((entry) => entry.startsWith('Budget source:')) ?? null;
          return { rewriteProvenance, budgetLine };
        })()`,
      );
      assert.ok(rewriteTruth.rewriteProvenance, 'Missing rewrite provenance line');
      assert.ok(rewriteTruth.budgetLine, 'Missing rewrite budget source line');
      const rewriteMeta = parseProvenanceMetaLine(rewriteTruth.rewriteProvenance, 'Rewrite provenance');
      assert.ok(rewriteMeta, 'Rewrite provenance line format is invalid');
      const rewriteRouteName = rewriteMeta.routeName.trim();
      const rewriteOrigin = rewriteMeta.origin.trim();
      const rewriteProviderCalled = rewriteMeta.providerCalled;
      assert.equal(
        rewriteRouteName,
        'draft/rewrite',
        'Rewrite default route must remain draft/rewrite',
      );
      assert.ok(
        rewriteOrigin === 'provider' || rewriteOrigin === 'fallback',
        `Rewrite result origin must be provider or fallback, received ${rewriteOrigin}`,
      );
      assert.equal(
        rewriteProviderCalled,
        rewriteOrigin === 'provider',
        'Rewrite provider_called must match rewrite result_origin',
      );
      assert.match(
        rewriteTruth.budgetLine,
        /Budget source: no budgeted action\./i,
        'Rewrite budget attribution must remain no-budgeted-action',
      );
      receipt.routes_hit.push('/api/v1/draft/rewrite');
      receipt.provenance.push({
        action: 'rewrite',
        route_name: rewriteRouteName,
        provider_called: rewriteProviderCalled,
        result_origin: rewriteOrigin,
        budget_delta: rewriteMeta.budgetDeltaRaw,
      });
      receipt.ui_chain_passed = true;

      const primarySceneId = sampleLoadProbe.sceneIds?.[0] ?? null;
      assert.ok(primarySceneId, 'Missing primary scene id for truth accept/export checks');
      assert.ok(sampleLoadProbe.projectId, 'Missing project id for truth accept/export checks');

      console.log('[truth] validating accept persistence');
      const sceneFilePath = path.join(truthProject.projectPath, 'drafts', `${primarySceneId}.md`);
      assert.ok(existsSync(sceneFilePath), `Scene file missing for truth lane: ${sceneFilePath}`);
      const sceneDocument = readFileSync(sceneFilePath, 'utf8');
      const sceneBody = extractSceneBody(sceneDocument);
      const previousSha = computeBodySha256(sceneBody);
      const truthMarker = `TRUTH-LANE-MARKER-${Date.now()}`;
      const acceptedSceneEvidence = `TRUTH-LANE-SCENE-ID:${primarySceneId}`;
      let acceptedBody = `${sceneBody}\n\n${truthMarker}\n${acceptedSceneEvidence}`;

      const acceptRequestBase = {
        project_id: sampleLoadProbe.projectId,
        draft_id: `dr_truth_${primarySceneId}`,
        unit_id: primarySceneId,
        message: 'Truth lane acceptance validation.',
        snapshot_label: 'truth-lane-accept',
      };
      let acceptResponse = await fetch(`http://127.0.0.1:${SERVICE_PORT}/api/v1/draft/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...acceptRequestBase,
          unit: {
            id: primarySceneId,
            previous_sha256: previousSha,
            text: acceptedBody,
            meta: {},
          },
        }),
      });
      if (!acceptResponse.ok && acceptResponse.status === 409) {
        const conflictBodyText = await acceptResponse.text();
        let conflictPayload = null;
        try {
          conflictPayload = JSON.parse(conflictBodyText);
        } catch {
          throw new Error(`Accept route failed: ${conflictBodyText}`);
        }
        if (conflictPayload?.code !== 'CONFLICT') {
          throw new Error(`Accept route failed: ${conflictBodyText}`);
        }
        const refreshedSceneBody = extractSceneBody(readFileSync(sceneFilePath, 'utf8'));
        const refreshedPreviousSha = computeBodySha256(refreshedSceneBody);
        acceptedBody = `${refreshedSceneBody}\n\n${truthMarker}\n${acceptedSceneEvidence}`;
        acceptResponse = await fetch(`http://127.0.0.1:${SERVICE_PORT}/api/v1/draft/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...acceptRequestBase,
            unit: {
              id: primarySceneId,
              previous_sha256: refreshedPreviousSha,
              text: acceptedBody,
              meta: {},
            },
          }),
        });
      }
      await assertOkResponse(acceptResponse, 'Accept route');
      const acceptPayload = await acceptResponse.json();
      const acceptedBodyExcerpt = acceptedBody
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
      const snapshotPath = acceptPayload?.snapshot?.path;
      const snapshotId = acceptPayload?.snapshot?.snapshot_id;
      assert.equal(typeof snapshotPath, 'string', 'Accept payload missing snapshot.path');
      assert.equal(typeof snapshotId, 'string', 'Accept payload missing snapshot.snapshot_id');
      const absoluteSnapshotPath = path.join(truthProject.projectPath, snapshotPath);
      assert.ok(
        snapshotPath.startsWith('history/snapshots/'),
        `Snapshot authority violation: expected history/snapshots/*, received ${snapshotPath}`,
      );
      assert.ok(
        !snapshotPath.startsWith('.snapshots/'),
        `Snapshot authority violation: accept path must not use .snapshots/* (${snapshotPath})`,
      );
      assert.ok(
        existsSync(absoluteSnapshotPath),
        `Accept snapshot path was not persisted: ${absoluteSnapshotPath}`,
      );
      const snapshotMetadataPath = path.join(absoluteSnapshotPath, 'metadata.json');
      assert.ok(
        existsSync(snapshotMetadataPath),
        `Accept snapshot metadata missing: ${snapshotMetadataPath}`,
      );
      const snapshotMetadata = JSON.parse(readFileSync(snapshotMetadataPath, 'utf8'));
      assert.equal(
        snapshotMetadata?.snapshot_id,
        snapshotId,
        'Snapshot metadata snapshot_id must match accept response snapshot_id',
      );
      const snapshotScenePath = path.join(absoluteSnapshotPath, 'drafts', `${primarySceneId}.md`);
      assert.ok(
        existsSync(snapshotScenePath),
        `Snapshot did not include accepted scene draft: ${snapshotScenePath}`,
      );
      const snapshotSceneBody = extractSceneBody(readFileSync(snapshotScenePath, 'utf8'));
      assert.equal(
        snapshotSceneBody.replace(/\r\n/g, '\n').trimEnd(),
        acceptedBody.replace(/\r\n/g, '\n').trimEnd(),
        'Snapshot scene body must match accepted editor-resolved text',
      );

      const persistedSceneAfterAccept = readFileSync(sceneFilePath, 'utf8');
      const persistedAcceptedBody = extractSceneBody(persistedSceneAfterAccept);
      assert.equal(
        persistedAcceptedBody.replace(/\r\n/g, '\n').trimEnd(),
        acceptedBody.replace(/\r\n/g, '\n').trimEnd(),
        'Accept payload/source mismatch: persisted body must equal submitted editor-resolved text',
      );
      receipt.routes_hit.push('/api/v1/draft/accept');
      receipt.artifacts.push({ kind: 'accept_snapshot', path: snapshotPath });

      console.log('[truth] validating snapshot list and recovery paths');
      const snapshotsResponse = await fetch(
        `http://127.0.0.1:${SERVICE_PORT}/api/v1/snapshots?projectId=${encodeURIComponent(
          sampleLoadProbe.projectId,
        )}`,
      );
      await assertOkResponse(snapshotsResponse, 'Snapshots list route');
      const snapshotsPayload = await snapshotsResponse.json();
      assert.ok(Array.isArray(snapshotsPayload), 'Snapshots response must be an array');
      assert.ok(snapshotsPayload.length > 0, 'Snapshots response must include at least one entry');

      const recoveryResponse = await fetch(
        `http://127.0.0.1:${SERVICE_PORT}/api/v1/draft/recovery?project_id=${encodeURIComponent(
          sampleLoadProbe.projectId,
        )}`,
      );
      await assertOkResponse(recoveryResponse, 'Recovery status route');
      const recoveryPayload = await recoveryResponse.json();
      assert.equal(recoveryPayload?.project_id, sampleLoadProbe.projectId);
      assert.equal(recoveryPayload?.status, 'idle');
      assert.ok(recoveryPayload?.last_snapshot?.snapshot_id, 'Recovery payload missing last snapshot id');
      assert.equal(
        recoveryPayload?.last_snapshot?.snapshot_id,
        snapshotId,
        'Recovery status last_snapshot must point at the accept snapshot',
      );
      receipt.routes_hit.push('/api/v1/snapshots');
      receipt.routes_hit.push('/api/v1/draft/recovery');

      console.log('[truth] validating export artifacts');
      const exportResponse = await fetch(`http://127.0.0.1:${SERVICE_PORT}/api/v1/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: sampleLoadProbe.projectId,
          format: 'md',
          include_meta_header: true,
        }),
      });
      await assertOkResponse(exportResponse, 'Export route');
      receipt.routes_hit.push('/api/v1/export');
      const exportPayload = await exportResponse.json();
      assert.equal(exportPayload?.project_id, sampleLoadProbe.projectId);
      const exportPath = exportPayload?.path;
      assert.equal(typeof exportPath, 'string', 'Export payload missing path');
      const absoluteExportPath = path.join(truthProject.projectPath, exportPath);
      assert.ok(existsSync(absoluteExportPath), `Export artifact missing on disk: ${absoluteExportPath}`);
      const exportContents = readFileSync(absoluteExportPath, 'utf8');
      assert.ok(
        exportContents.includes(truthMarker),
        'Export artifact missing truth marker content from accepted scene',
      );
      assert.ok(
        acceptedBodyExcerpt.length > 0 && exportContents.includes(acceptedBodyExcerpt),
        'Export artifact missing expected accepted-scene body excerpt',
      );
      assert.ok(
        exportContents.includes(acceptedSceneEvidence),
        'Export artifact missing accepted scene_id evidence marker',
      );
      receipt.artifacts.push({ kind: 'export', path: exportPath });
      receipt.service_extension_passed = true;
      enforceTruthReceiptRules(receipt);
      writeTruthReceipt(receipt);
    } finally {
      if (cdp) {
        cdp.close();
      }
      if (electronPid) {
        if (process.platform === 'win32') {
          const taskkill = spawnSync('taskkill', ['/PID', String(electronPid), '/T', '/F'], { stdio: 'ignore' });
          if (taskkill.error || taskkill.status !== 0) {
            try {
              process.kill(electronPid);
            } catch {
              // Ignore cleanup races on teardown.
            }
          }
        } else {
          try {
            process.kill(electronPid, 'SIGTERM');
          } catch {
            // Ignore cleanup races on teardown.
          }
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
  const category = classifyError(error);
  const message = normalizeErrorMessage(error);
  const details =
    error && typeof error === 'object' && error.truthDetails && typeof error.truthDetails === 'object'
      ? error.truthDetails
      : {};
  recordFailure(latestReceipt, category, message, {
    error_name: error instanceof Error ? error.name : 'Error',
    ...details,
  });
  writeTruthReceipt(latestReceipt);
  console.error('[truth] failed', error);
  process.exitCode = 1;
});
