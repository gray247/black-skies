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
const E2E_FIXTURE_MATERIALIZE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'materialize_e2e_fixture.mjs');
const E2E_FIXTURE_CONTRACT_SCRIPT = path.join(REPO_ROOT, 'scripts', 'check_e2e_fixture_contract.mjs');
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

function runNodeScriptOrThrow(scriptPath, category, label, args = []) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) {
    throw makeFailureError(
      category,
      `[truth] ${label} failed to start: ${normalizeErrorMessage(result.error)}`,
    );
  }
  if ((result.status ?? 0) !== 0) {
    throw makeFailureError(
      category,
      `[truth] ${label} failed with exit code ${result.status ?? 'unknown'}`,
    );
  }
}

function extractSceneBody(markdown) {
  const content = String(markdown ?? '');
  const lines = content.split(/\r?\n/);
  if (lines.length >= 3 && lines[0].trim() === '---') {
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index].trim() === '---') {
        return lines.slice(index + 1).join('\n');
      }
    }
  }
  return lines.join('\n');
}

function computeBodySha256(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}

function readServiceSceneState(projectRootPath, unitId) {
  const pythonCommand = resolvePythonCommand();
  const helperScript = [
    'import json',
    'from pathlib import Path',
    'from blackskies.services.scene_docs import read_scene_document',
    'from blackskies.services.routers.draft.common import _compute_sha256',
    `project_root = Path(${JSON.stringify(projectRootPath)})`,
    `unit_id = ${JSON.stringify(unitId)}`,
    '_, _, body = read_scene_document(project_root, unit_id)',
    'print(json.dumps({"body": body, "digest": _compute_sha256(body)}))',
  ].join('\n');
  const result = spawnSync(pythonCommand, ['-c', helperScript], {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PATH: prependVenvPath(process.env.PATH),
    },
    encoding: 'utf8',
  });
  if (result.error) {
    throw new Error(`[truth] failed to inspect scene state: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `[truth] failed to inspect scene state: ${String(result.stderr ?? result.stdout ?? '').trim()}`,
    );
  }
  let parsed = null;
  try {
    parsed = JSON.parse(String(result.stdout ?? ''));
  } catch (error) {
    throw new Error(`[truth] failed to parse scene state helper output: ${normalizeErrorMessage(error)}`);
  }
  const body = typeof parsed?.body === 'string' ? parsed.body : null;
  const digest = typeof parsed?.digest === 'string' ? parsed.digest : null;
  if (!body || !/^[a-f0-9]{64}$/i.test(digest ?? '')) {
    throw new Error('[truth] scene state helper returned invalid payload.');
  }
  return { body, digest };
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

async function waitForHealth(url, timeoutMs, backendMonitor = null) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const spawnError = backendMonitor?.getSpawnError?.() ?? null;
    if (spawnError) {
      throw new Error(`[truth] backend failed to start: ${spawnError.message}`);
    }
    if (backendMonitor?.process && backendMonitor.process.exitCode !== null) {
      throw new Error(
        `[truth] backend exited before health became ready (code=${backendMonitor.process.exitCode}, signal=${String(
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

function collectOutlineSchemaDiagnostics(projectPath) {
  const outlinePath = path.join(projectPath, 'outline.json');
  const diagnostics = {
    project_path: projectPath,
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
    payload = JSON.parse(readFileSync(outlinePath, 'utf8'));
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
}

async function probeAnalyticsPreflight(baseUrl, projectId, projectPath, timeoutMs) {
  const endpoints = [
    `/api/v1/analytics/summary?project_id=${encodeURIComponent(projectId)}`,
    `/api/v1/analytics/scenes?project_id=${encodeURIComponent(projectId)}`,
  ];
  const outlineDiagnostics = collectOutlineSchemaDiagnostics(projectPath);
  const deadline = Date.now() + timeoutMs;
  let lastFailure = null;
  while (Date.now() < deadline) {
    let allHealthy = true;
    for (const endpoint of endpoints) {
      const url = `${baseUrl}${endpoint}`;
      try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
          allHealthy = false;
          lastFailure = {
            project_id: projectId,
            project_path: projectPath,
            expected_outline_path: outlineDiagnostics.outline_path,
            outline_exists: outlineDiagnostics.outline_exists,
            outline_validation: {
              valid_outline_schema: outlineDiagnostics.valid_outline_schema,
              outline_id: outlineDiagnostics.outline_id,
              scene_count: outlineDiagnostics.scene_count,
              issues: outlineDiagnostics.issues,
            },
            endpoint,
            status: response.status,
            body: (await response.text()).slice(0, 800),
          };
          break;
        }
      } catch (error) {
        allHealthy = false;
        lastFailure = {
          project_id: projectId,
          project_path: projectPath,
          expected_outline_path: outlineDiagnostics.outline_path,
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
  throw makeFailureError(
    FAILURE_CATEGORY.ARTIFACT_VALIDATION_FAIL,
    `[truth] analytics preflight failed within ${timeoutMs}ms: ${JSON.stringify(lastFailure ?? {})}`,
  );
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
  await cdp.send('Log.enable').catch(() => {});
  return cdp;
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocketImpl(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.eventHandlers = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve(), { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (typeof message.method === 'string') {
        const handlers = this.eventHandlers.get(message.method) ?? [];
        for (const handler of handlers) {
          try {
            handler(message.params ?? {});
          } catch {
            // best effort event fan-out
          }
        }
      }
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

  on(method, handler) {
    const handlers = this.eventHandlers.get(method) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(method, handlers);
    return () => {
      const current = this.eventHandlers.get(method) ?? [];
      this.eventHandlers.set(
        method,
        current.filter((entry) => entry !== handler),
      );
    };
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

function trimText(value, maxLength = 800) {
  const text = String(value ?? '');
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

function createActiveSceneRuntimeDiagnosticsCollector(cdp) {
  const consoleLogs = [];
  const pageErrors = [];
  const maxEntries = 200;
  const toPlainArg = (arg) => {
    if (!arg || typeof arg !== 'object') {
      return null;
    }
    if (Object.prototype.hasOwnProperty.call(arg, 'value')) {
      return trimText(arg.value, 400);
    }
    if (typeof arg.description === 'string') {
      return trimText(arg.description, 400);
    }
    if (arg.preview && typeof arg.preview.description === 'string') {
      return trimText(arg.preview.description, 400);
    }
    if (typeof arg.type === 'string') {
      return arg.type;
    }
    return null;
  };
  const pushBounded = (bucket, payload) => {
    bucket.push(payload);
    if (bucket.length > maxEntries) {
      bucket.shift();
    }
  };
  const unsubscribeConsole = cdp.on('Runtime.consoleAPICalled', (params) => {
    pushBounded(consoleLogs, {
      ts_ms: Date.now(),
      type: params?.type ?? null,
      text: Array.isArray(params?.args)
        ? params.args
            .map((arg) => toPlainArg(arg))
            .filter((entry) => entry !== null)
            .join(' ')
        : '',
      executionContextId: params?.executionContextId ?? null,
    });
  });
  const unsubscribeException = cdp.on('Runtime.exceptionThrown', (params) => {
    const details = params?.exceptionDetails ?? {};
    pushBounded(pageErrors, {
      ts_ms: Date.now(),
      text: details?.text ?? null,
      exception:
        details?.exception && typeof details.exception.description === 'string'
          ? trimText(details.exception.description, 1200)
          : null,
      url: details?.url ?? null,
      lineNumber: details?.lineNumber ?? null,
      columnNumber: details?.columnNumber ?? null,
    });
  });
  const unsubscribeLogEntry = cdp.on('Log.entryAdded', (params) => {
    const entry = params?.entry ?? {};
    if (entry.level !== 'error') {
      return;
    }
    pushBounded(pageErrors, {
      ts_ms: Date.now(),
      text: entry.text ?? null,
      source: entry.source ?? null,
      url: entry.url ?? null,
      lineNumber: entry.lineNumber ?? null,
    });
  });
  return {
    consoleLogs,
    pageErrors,
    dispose() {
      unsubscribeConsole();
      unsubscribeException();
      unsubscribeLogEntry();
    },
  };
}

async function collectActiveSceneDiagnosticSnapshot(cdp, targetSceneId) {
  return evaluate(
    cdp,
    `(() => {
      const targetSceneId = ${JSON.stringify(targetSceneId)};
      const body = document.body;
      const html = document.documentElement;
      const servicePill = document.querySelector('[data-testid="service-status-pill"]');
      const recoveryBanner = document.querySelector('[data-testid="recovery-banner"]');
      const dockWorkspace = document.querySelector('[data-testid="dock-workspace"]');
      const corkboardHeading = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).find(
        (node) => (node.textContent ?? '').trim() === 'Corkboard',
      );
      const activeSceneButton = document.querySelector(
        '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
      );
      const selectedSceneButtons = Array.from(
        document.querySelectorAll('.project-home__scene-button[aria-pressed="true"]'),
      );
      const sceneNodesWithTarget = Array.from(document.querySelectorAll('*'))
        .filter((node) => (node.textContent ?? '').includes(targetSceneId))
        .slice(0, 25)
        .map((node) => ({
          tag: node.tagName?.toLowerCase() ?? null,
          className: node.className ?? null,
          testId: node.getAttribute?.('data-testid') ?? null,
          text: (node.textContent ?? '').trim().slice(0, 200),
        }));
      const relevantStorage = Object.keys(window.localStorage)
        .filter((key) => /(blackskies|test|layout|recovery|dock|scene|project)/i.test(key))
        .sort()
        .reduce((acc, key) => {
          acc[key] = window.localStorage.getItem(key);
          return acc;
        }, {});
      const excerpt = (selector) => {
        const node = document.querySelector(selector);
        if (!node) {
          return null;
        }
        return (node.outerHTML ?? '').slice(0, 5000);
      };
      return {
        captured_at: new Date().toISOString(),
        targetSceneId,
        readyState: document.readyState,
        url: window.location.href,
        datasets: {
          body: { ...(body?.dataset ?? {}) },
          html: { ...(html?.dataset ?? {}) },
        },
        project: {
          loaded: body?.dataset?.projectLoaded ?? html?.dataset?.projectLoaded ?? null,
          path: body?.dataset?.projectPath ?? html?.dataset?.projectPath ?? null,
          id: body?.dataset?.projectId ?? html?.dataset?.projectId ?? null,
          activeSceneId: body?.dataset?.activeSceneId ?? html?.dataset?.activeSceneId ?? null,
        },
        service: {
          status: servicePill?.getAttribute('data-status') ?? null,
          reason: servicePill?.getAttribute('data-reason') ?? null,
        },
        recoveryBannerPresent: Boolean(recoveryBanner),
        dockWorkspacePresent: Boolean(dockWorkspace),
        corkboardHeadingPresent: Boolean(corkboardHeading),
        corkboardCardCounts: {
          byTestId: document.querySelectorAll('[data-testid="corkboard-card"]').length,
          byClass: document.querySelectorAll('.corkboard-card').length,
          bySceneId: document.querySelectorAll('[data-testid="corkboard-card"][data-scene-id]').length,
        },
        containsTargetScene: {
          count: sceneNodesWithTarget.length,
          nodes: sceneNodesWithTarget,
        },
        activeScene: {
          present: Boolean(activeSceneButton),
          text: activeSceneButton?.textContent?.trim() ?? null,
          selectedCount: selectedSceneButtons.length,
        },
        debugState: {
          blackSkiesDebugState:
            window.__blackSkiesDebugState ??
            window.__blackskiesDebugState ??
            window.__blackskiesDebugProjectState ??
            null,
          startupDebugState: window.__startupDebugState ?? null,
          dockRenderLog: window.__dockRenderLog ?? null,
          blackskiesDebugLogTail: Array.isArray(window.__blackskiesDebugLog)
            ? window.__blackskiesDebugLog.slice(-20)
            : null,
        },
        localStorageRelevant: relevantStorage,
        domExcerpt: {
          projectHome: excerpt('.project-home'),
          corkboardPane: excerpt('[data-pane-id="corkboard"]'),
          sceneList: excerpt('.project-home__scene-list'),
          dockWorkspace: excerpt('[data-testid="dock-workspace"]'),
        },
      };
    })()`,
  );
}

async function waitForSceneSelectionHook(cdp, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    lastStatus = await evaluate(
      cdp,
      `(() => ({
        hasDevApi: Boolean(window.__dev),
        hasDevSelectScene: typeof window.__dev?.selectScene === 'function',
        hookPresent: typeof window.__blackSkiesSelectScene === 'function',
      }))()`,
    );
    if (lastStatus?.hookPresent === true) {
      return lastStatus;
    }
    await delay(100);
  }
  return lastStatus ?? { hasDevApi: false, hasDevSelectScene: false, hookPresent: false };
}

async function attemptSceneSelectionWithDiagnostics(cdp, targetSceneId) {
  return evaluate(
    cdp,
    `(() => (async () => {
      const target = ${JSON.stringify(targetSceneId)};
      const now = Date.now();
      const toVisibility = (node) => {
        if (!node) {
          return { visible: false, display: null, visibility: null };
        }
        const style = window.getComputedStyle(node);
        return {
          visible: style.display !== 'none' && style.visibility !== 'hidden',
          display: style.display,
          visibility: style.visibility,
        };
      };
      const clickPayload = {
        targetSceneId: target,
        attemptedAt: new Date(now).toISOString(),
        selectorMatched: null,
        hasSelector: false,
        domSelectorMatched: null,
        domSelectorFound: false,
        selectionMethod: null,
        targetText: null,
        targetVisible: false,
        targetRect: null,
        clickDispatchedAt: null,
        eventDispatchedAt: null,
        devSelectResult: null,
        candidateSummary: {},
      };
      const candidateButtons = Array.from(document.querySelectorAll('button.project-home__scene-button'));
      const buttonFromDataScene = document.querySelector(
        'button.project-home__scene-button[data-scene-id="' + target + '"]',
      );
      const buttonFromIdNode = (() => {
        const idNode = Array.from(document.querySelectorAll('.project-home__scene-id')).find(
          (node) => (node.textContent ?? '').trim() === target,
        );
        return idNode?.closest('button') ?? null;
      })();
      const buttonFromText = candidateButtons.find((button) =>
        (button.textContent ?? '').includes(target),
      );
      const buttonFromAriaLabel = Array.from(document.querySelectorAll('button[aria-label]')).find((button) =>
        (button.getAttribute('aria-label') ?? '').includes(target),
      );
      clickPayload.candidateSummary = {
        sceneButtonsCount: candidateButtons.length,
        sceneIdNodesCount: document.querySelectorAll('.project-home__scene-id').length,
        sceneButtonsByDataSceneCount: document.querySelectorAll(
          'button.project-home__scene-button[data-scene-id]',
        ).length,
        corkboardByTestIdCount: document.querySelectorAll('[data-testid="corkboard-card"]').length,
        corkboardByClassCount: document.querySelectorAll('.corkboard-card').length,
      };
      const targetButton =
        buttonFromDataScene instanceof HTMLButtonElement
          ? buttonFromDataScene
          : buttonFromIdNode instanceof HTMLButtonElement
          ? buttonFromIdNode
          : buttonFromText instanceof HTMLButtonElement
            ? buttonFromText
            : buttonFromAriaLabel instanceof HTMLButtonElement
              ? buttonFromAriaLabel
              : null;
      if (targetButton) {
        clickPayload.hasSelector = true;
        clickPayload.domSelectorFound = true;
        clickPayload.domSelectorMatched =
          targetButton === buttonFromDataScene
            ? 'button.project-home__scene-button[data-scene-id="<scene-id>"]'
            : targetButton === buttonFromIdNode
              ? '.project-home__scene-id -> closest(button.project-home__scene-button)'
              : targetButton === buttonFromText
                ? '.project-home__scene-button (text contains scene id)'
                : 'button[aria-label*="<scene-id>"]';
        clickPayload.selectorMatched =
          clickPayload.domSelectorMatched;
        clickPayload.selectionMethod = 'button-click';
        clickPayload.targetText = (targetButton.textContent ?? '').trim().slice(0, 300);
        const rect = targetButton.getBoundingClientRect();
        clickPayload.targetRect = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
        clickPayload.targetVisible = toVisibility(targetButton).visible;
        targetButton.click();
        clickPayload.clickDispatchedAt = new Date().toISOString();
        return clickPayload;
      }
      const devSelectScene = window.__dev?.selectScene;
      if (typeof devSelectScene === 'function') {
        clickPayload.hasSelector = true;
        clickPayload.selectorMatched = '__dev.selectScene("<scene-id>")';
        clickPayload.selectionMethod = 'dev-api';
        try {
          clickPayload.devSelectResult = await devSelectScene(target);
        } catch (error) {
          clickPayload.selectionMethod = 'dev-api-throw';
          clickPayload.devSelectResult = {
            ok: false,
            method: 'hook',
            sceneId: target,
            hookPresent: typeof window.__blackSkiesSelectScene === 'function',
            error: error instanceof Error ? error.message : String(error),
          };
        }
        clickPayload.eventDispatchedAt = new Date().toISOString();
        return clickPayload;
      }
      window.dispatchEvent(new CustomEvent('test:select-scene', { detail: target }));
      clickPayload.hasSelector = true;
      clickPayload.selectorMatched = 'window.dispatchEvent("test:select-scene")';
      clickPayload.selectionMethod = 'event-only';
      clickPayload.eventDispatchedAt = new Date().toISOString();
      return clickPayload;
    })())()`,
  );
}

async function collectActiveScenePollSample(cdp, targetSceneId) {
  return evaluate(
    cdp,
    `(() => {
      const target = ${JSON.stringify(targetSceneId)};
      const activeButton = document.querySelector(
        '.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]',
      );
      const selectedButtons = Array.from(
        document.querySelectorAll('.project-home__scene-button[aria-pressed="true"]'),
      );
      const focused = document.activeElement;
      const generate = document.querySelector('[data-testid="workspace-action-generate"]');
      const critique = document.querySelector('[data-testid="workspace-action-critique"]');
      const summaryTarget = selectedButtons.find((node) => (node.textContent ?? '').includes(target));
      const bodySceneId = document.body?.dataset?.activeSceneId ?? null;
      const htmlSceneId = document.documentElement?.dataset?.activeSceneId ?? null;
      const debugProjectState = window.__blackskiesDebugProjectState ?? window.__testProjectState ?? null;
      const debugSceneId = debugProjectState?.activeSceneId ?? null;
      return {
        ts_ms: Date.now(),
        activeScene: {
          present: Boolean(activeButton),
          text: activeButton?.textContent?.trim() ?? null,
          selectedCount: selectedButtons.length,
          includesTarget:
            Boolean(summaryTarget) ||
            bodySceneId === target ||
            htmlSceneId === target ||
            debugSceneId === target,
        },
        markers: {
          bodySceneId,
          htmlSceneId,
          debugSceneId,
        },
        focusedElement: focused
          ? {
              tag: focused.tagName?.toLowerCase() ?? null,
              testId: focused.getAttribute?.('data-testid') ?? null,
              className: focused.className ?? null,
              text: (focused.textContent ?? '').trim().slice(0, 120),
            }
          : null,
        actions: {
          generate: {
            present: Boolean(generate),
            enabled: generate instanceof HTMLButtonElement ? !generate.disabled : null,
          },
          critique: {
            present: Boolean(critique),
            enabled: critique instanceof HTMLButtonElement ? !critique.disabled : null,
          },
        },
        corkboardCardCounts: {
          byTestId: document.querySelectorAll('[data-testid="corkboard-card"]').length,
          byClass: document.querySelectorAll('.corkboard-card').length,
          bySceneId: document.querySelectorAll('[data-testid="corkboard-card"][data-scene-id]').length,
        },
        debugActiveScene:
          window.__blackSkiesDebugState?.activeSceneId ??
          window.__blackskiesDebugState?.activeSceneId ??
          window.__blackskiesDebugProjectState?.activeSceneId ??
          window.__testProjectState?.activeSceneId ??
          null,
      };
    })()`,
  );
}

function writeActiveSceneTimeoutArtifact(payload) {
  mkdirSync(RECEIPT_DIR, { recursive: true });
  const artifactPath = path.join(RECEIPT_DIR, 'active_scene_timeout.json');
  writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return artifactPath;
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
  runNodeScriptOrThrow(
    E2E_FIXTURE_MATERIALIZE_SCRIPT,
    FAILURE_CATEGORY.ARTIFACT_VALIDATION_FAIL,
    'fixture materialization',
  );
  runNodeScriptOrThrow(
    E2E_FIXTURE_CONTRACT_SCRIPT,
    FAILURE_CATEGORY.ARTIFACT_VALIDATION_FAIL,
    'fixture contract verification',
  );
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
    await waitForHealth(`http://127.0.0.1:${SERVICE_PORT}${HEALTH_PATH}`, HEALTH_TIMEOUT_MS, {
      process: backend,
      getSpawnError: () => backendSpawnError,
    }).catch((error) => {
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

      console.log('[truth] probing analytics endpoints for resolved project');
      await probeAnalyticsPreflight(
        `http://127.0.0.1:${SERVICE_PORT}`,
        sampleLoadProbe.projectId,
        truthProject.projectPath,
        30_000,
      );

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
      // Truth lane asserts bridge-normalized UI health semantics, not raw backend /healthz payload fields.
      assert.equal(bridgeHealth.status, 'online');

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

      const activeSceneRuntimeDiagnostics = createActiveSceneRuntimeDiagnosticsCollector(cdp);
      try {
        const debugSnapshot = await evaluate(
        cdp,
        `Array.isArray(window.__blackskiesDebugLog) ? window.__blackskiesDebugLog.slice(-20) : null`,
        );
        console.log('[truth] renderer debug snapshot', debugSnapshot);

        const actionReadySceneId = sampleLoadProbe.sceneIds[0];
        const activeScenePreClickSnapshot = await collectActiveSceneDiagnosticSnapshot(cdp, actionReadySceneId);
        console.log('[truth] active scene pre-click snapshot', {
          targetSceneId: actionReadySceneId,
          project: activeScenePreClickSnapshot.project,
          service: activeScenePreClickSnapshot.service,
          recoveryBannerPresent: activeScenePreClickSnapshot.recoveryBannerPresent,
          dockWorkspacePresent: activeScenePreClickSnapshot.dockWorkspacePresent,
          corkboardHeadingPresent: activeScenePreClickSnapshot.corkboardHeadingPresent,
          corkboardCardCounts: activeScenePreClickSnapshot.corkboardCardCounts,
          containsTargetSceneCount: activeScenePreClickSnapshot.containsTargetScene?.count ?? null,
          activeScene: activeScenePreClickSnapshot.activeScene,
        });

        console.log(`[truth] selecting primary scene ${actionReadySceneId} before action readiness`);
        const sceneHookReadiness = await waitForSceneSelectionHook(cdp, 10_000);
        console.log('[truth] scene selection hook readiness', sceneHookReadiness);
        const sceneClickResult = await attemptSceneSelectionWithDiagnostics(cdp, actionReadySceneId);
        console.log('[truth] initial scene selection diagnostics', sceneClickResult);
        if (
          sceneClickResult.selectionMethod === 'dev-api' ||
          sceneClickResult.selectionMethod === 'dev-api-throw'
        ) {
          console.log('[truth] __dev.selectScene result', sceneClickResult.devSelectResult ?? null);
        }

        if (!sceneClickResult.hasSelector) {
          const noSelectorPayload = {
            recorded_at: new Date().toISOString(),
            reason: 'no_scene_selector_match',
            targetSceneId: actionReadySceneId,
            preClickSnapshot: activeScenePreClickSnapshot,
            clickResult: sceneClickResult,
            consoleLogs: activeSceneRuntimeDiagnostics.consoleLogs,
            pageErrors: activeSceneRuntimeDiagnostics.pageErrors,
          };
          const noSelectorArtifactPath = writeActiveSceneTimeoutArtifact(noSelectorPayload);
          receipt.artifacts.push({
            kind: 'active_scene_timeout',
            path: path.relative(REPO_ROOT, noSelectorArtifactPath),
          });
          throw new Error(
            `[truth] No selectable scene node found for ${actionReadySceneId}; wrote diagnostics to ${noSelectorArtifactPath}`,
          );
        }

        if (sceneClickResult.selectionMethod === 'dev-api-throw') {
          const thrownPayload = {
            recorded_at: new Date().toISOString(),
            reason: 'selectScene threw',
            targetSceneId: actionReadySceneId,
            hookReadiness: sceneHookReadiness,
            clickResult: sceneClickResult,
            preClickSnapshot: activeScenePreClickSnapshot,
            consoleLogs: activeSceneRuntimeDiagnostics.consoleLogs,
            pageErrors: activeSceneRuntimeDiagnostics.pageErrors,
          };
          const thrownArtifactPath = writeActiveSceneTimeoutArtifact(thrownPayload);
          receipt.artifacts.push({
            kind: 'active_scene_timeout',
            path: path.relative(REPO_ROOT, thrownArtifactPath),
          });
          throw new Error(
            `[truth] Scene selection failed: selectScene threw; diagnostics written to ${thrownArtifactPath}`,
          );
        }

        const devSelectResult = sceneClickResult.devSelectResult ?? null;
        if (
          sceneClickResult.selectionMethod === 'dev-api' &&
          devSelectResult &&
          devSelectResult.hookPresent === false
        ) {
          const hookMissingPayload = {
            recorded_at: new Date().toISOString(),
            reason: 'hook missing',
            targetSceneId: actionReadySceneId,
            hookReadiness: sceneHookReadiness,
            clickResult: sceneClickResult,
            preClickSnapshot: activeScenePreClickSnapshot,
            consoleLogs: activeSceneRuntimeDiagnostics.consoleLogs,
            pageErrors: activeSceneRuntimeDiagnostics.pageErrors,
          };
          const hookMissingArtifactPath = writeActiveSceneTimeoutArtifact(hookMissingPayload);
          receipt.artifacts.push({
            kind: 'active_scene_timeout',
            path: path.relative(REPO_ROOT, hookMissingArtifactPath),
          });
          throw new Error(
            `[truth] Scene selection failed: hook missing; diagnostics written to ${hookMissingArtifactPath}`,
          );
        }

        if (
          sceneClickResult.selectionMethod === 'dev-api' &&
          devSelectResult &&
          devSelectResult.ok !== true
        ) {
          const isMissingScene = /missing-scene/i.test(String(devSelectResult.error ?? ''));
          const selectionFailureReason = isMissingScene ? 'scene id missing' : 'selectScene threw';
          const selectionFailurePayload = {
            recorded_at: new Date().toISOString(),
            reason: selectionFailureReason,
            targetSceneId: actionReadySceneId,
            hookReadiness: sceneHookReadiness,
            clickResult: sceneClickResult,
            preClickSnapshot: activeScenePreClickSnapshot,
            consoleLogs: activeSceneRuntimeDiagnostics.consoleLogs,
            pageErrors: activeSceneRuntimeDiagnostics.pageErrors,
          };
          const selectionFailureArtifactPath = writeActiveSceneTimeoutArtifact(selectionFailurePayload);
          receipt.artifacts.push({
            kind: 'active_scene_timeout',
            path: path.relative(REPO_ROOT, selectionFailureArtifactPath),
          });
          throw new Error(
            `[truth] Scene selection failed: ${selectionFailureReason}; diagnostics written to ${selectionFailureArtifactPath}`,
          );
        }

        const selectionStartMs =
          Date.parse(sceneClickResult.clickDispatchedAt ?? sceneClickResult.eventDispatchedAt ?? '') || Date.now();
        const pollIntervalMs = 250;
        const activeScenePollSamples = [];
        const activeSceneDeadline = Date.now() + 30_000;
        let activeSceneSelected = false;
        while (Date.now() < activeSceneDeadline) {
          const sample = await collectActiveScenePollSample(cdp, actionReadySceneId);
          activeScenePollSamples.push(sample);
          if (activeScenePollSamples.length > 240) {
            activeScenePollSamples.shift();
          }
          if (sample?.activeScene?.present === true && sample?.activeScene?.includesTarget === true) {
            activeSceneSelected = true;
            break;
          }
          await delay(pollIntervalMs);
        }
        if (!activeSceneSelected) {
          const activeScenePostClickSnapshot = await collectActiveSceneDiagnosticSnapshot(cdp, actionReadySceneId);
          const timeoutReason =
            sceneClickResult.selectionMethod === 'dev-api' && devSelectResult?.hookPresent === false
              ? 'hook missing'
              : sceneClickResult.selectionMethod === 'dev-api' &&
                  /missing-scene/i.test(String(devSelectResult?.error ?? ''))
                ? 'scene id missing'
                : sceneClickResult.selectionMethod === 'dev-api-throw'
                  ? 'selectScene threw'
                  : 'commit marker not updated';
          const timeoutPayload = {
            recorded_at: new Date().toISOString(),
            reason: timeoutReason,
            timeout_ms: 30_000,
            poll_interval_ms: pollIntervalMs,
            targetSceneId: actionReadySceneId,
            preClickSnapshot: activeScenePreClickSnapshot,
            clickResult: sceneClickResult,
            pollSamples: activeScenePollSamples,
            consoleLogsSinceClick: activeSceneRuntimeDiagnostics.consoleLogs.filter(
              (entry) => (entry?.ts_ms ?? 0) >= selectionStartMs,
            ),
            pageErrorsSinceClick: activeSceneRuntimeDiagnostics.pageErrors.filter(
              (entry) => (entry?.ts_ms ?? 0) >= selectionStartMs,
            ),
            postClickSnapshot: activeScenePostClickSnapshot,
            finalDomExcerpt: activeScenePostClickSnapshot.domExcerpt,
          };
          const timeoutArtifactPath = writeActiveSceneTimeoutArtifact(timeoutPayload);
          receipt.artifacts.push({
            kind: 'active_scene_timeout',
            path: path.relative(REPO_ROOT, timeoutArtifactPath),
          });
          throw new Error(
            `[truth] Scene selection failed: ${timeoutReason}; diagnostics written to ${timeoutArtifactPath}`,
          );
        }
      } finally {
        activeSceneRuntimeDiagnostics.dispose();
      }

      console.log('[truth] waiting for generate button to enable');
      try {
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
      } catch (error) {
        const generateDiagnostics = await evaluate(
          cdp,
          `(() => {
            const generate = document.querySelector('[data-testid="workspace-action-generate"]') as HTMLButtonElement | null;
            const critique = document.querySelector('[data-testid="workspace-action-critique"]') as HTMLButtonElement | null;
            const activeScene = document.querySelector('.project-home__scene-card--active .project-home__scene-button[aria-pressed="true"]');
            const servicePill = document.querySelector('[data-testid="service-status-pill"]');
            const body = document.body;
            const html = document.documentElement;
            return {
              generatePresent: Boolean(generate),
              generateDisabled: generate ? generate.disabled : null,
              critiquePresent: Boolean(critique),
              critiqueDisabled: critique ? critique.disabled : null,
              activeScenePresent: Boolean(activeScene),
              serviceStatus: servicePill?.getAttribute('data-status') ?? null,
              projectLoadedBody: body?.dataset?.projectLoaded ?? null,
              projectLoadedHtml: html?.dataset?.projectLoaded ?? null,
              projectPathBody: body?.dataset?.projectPath ?? null,
              projectPathHtml: html?.dataset?.projectPath ?? null,
              debugProjectState: (window as typeof window & { __blackskiesDebugProjectState?: unknown })
                .__blackskiesDebugProjectState ?? null,
            };
          })()`,
        );
        throw new Error(
          `[truth] Generate action never enabled after scene selection: ${JSON.stringify(generateDiagnostics)}` +
            (error instanceof Error ? ` cause="${error.message}"` : ''),
        );
      }

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
      const critiqueSceneHookReadiness = await waitForSceneSelectionHook(cdp, 10_000);
      console.log('[truth] critique scene hook readiness', critiqueSceneHookReadiness);
      const sceneSelectionMode = await evaluate(
        cdp,
        `(() => (async () => {
          const targetSceneId = ${JSON.stringify(sampleLoadProbe.sceneIds[0])};
          const byDataScene = document.querySelector(
            \`button.project-home__scene-button[data-scene-id="\${targetSceneId}"]\`,
          );
          const buttons = Array.from(document.querySelectorAll('button.project-home__scene-button'));
          const targetButton = buttons.find((button) =>
            (button.textContent ?? '').includes(targetSceneId),
          );
          const realButton = byDataScene instanceof HTMLButtonElement ? byDataScene : targetButton;
          if (!(realButton instanceof HTMLButtonElement)) {
            throw new Error(
              \`[truth] Unable to locate a real scene button for scene \${targetSceneId}; synthetic fallback is not allowed in the truth lane.\`,
            );
          }
          const buttonVisible = (() => {
            const style = window.getComputedStyle(realButton);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })();
          const buttonRect = realButton.getBoundingClientRect();
          realButton.click();
          return {
            matchedSelector: byDataScene instanceof HTMLButtonElement
              ? 'button.project-home__scene-button[data-scene-id="<scene-id>"]'
              : '.project-home__scene-button (text contains scene id)',
            selectionMethod: 'button-click',
            targetText: realButton.textContent?.trim() ?? null,
            targetVisible: buttonVisible,
            targetRect: {
              x: buttonRect.x,
              y: buttonRect.y,
              width: buttonRect.width,
              height: buttonRect.height,
            },
            clickDispatchedAt: new Date().toISOString(),
          };
        })())()`,
      );
      console.log('[truth] scene selection mode', sceneSelectionMode);
      assert.equal(
        sceneSelectionMode?.selectionMethod,
        'button-click',
        'Truth lane must select the scene through a real scene button click',
      );
      assert.ok(
        typeof sceneSelectionMode?.matchedSelector === 'string' &&
          sceneSelectionMode.matchedSelector.includes('project-home__scene-button'),
        'Truth lane must match a real scene button selector',
      );

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
      const sceneState = readServiceSceneState(truthProject.projectPath, primarySceneId);
      const truthMarker = `TRUTH-LANE-MARKER-${Date.now()}`;
      const acceptedSceneEvidence = `TRUTH-LANE-SCENE-ID:${primarySceneId}`;
      let acceptedBody = `${sceneState.body}\n\n${truthMarker}\n${acceptedSceneEvidence}`;

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
            previous_sha256: sceneState.digest,
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
        const refreshedSceneState = readServiceSceneState(truthProject.projectPath, primarySceneId);
        acceptedBody = `${refreshedSceneState.body}\n\n${truthMarker}\n${acceptedSceneEvidence}`;
        acceptResponse = await fetch(`http://127.0.0.1:${SERVICE_PORT}/api/v1/draft/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...acceptRequestBase,
            unit: {
              id: primarySceneId,
              previous_sha256: refreshedSceneState.digest,
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
      for (const entry of snapshotsPayload) {
        assert.equal(typeof entry?.path, 'string', 'Snapshots list entry missing path');
        assert.ok(
          entry.path.startsWith('.snapshots/'),
          `Snapshot list entry must remain manual snapshot family (.snapshots/*), received ${entry.path}`,
        );
      }

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
      const normalizedExportContents = exportContents.replace(/\s+/g, ' ').trim();
      assert.ok(
        exportContents.includes(truthMarker),
        'Export artifact missing truth marker content from accepted scene',
      );
      assert.ok(
        acceptedBodyExcerpt.length > 0 && normalizedExportContents.includes(acceptedBodyExcerpt),
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
