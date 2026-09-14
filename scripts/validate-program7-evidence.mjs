#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(repoRoot, 'scripts', 'program7-evidence-row.schema.json');
const defaultLedgerPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_evidence_ledger.jsonl');
const REQUIRED_ROOT_KEYS = ['evidenceId', 'exactCommit', 'package', 'evidenceClass', 'executionMode', 'precommitTreeHash', 'environment', 'corpus', 'preconditions', 'action', 'expected', 'observed', 'artifacts', 'result', 'reviewer', 'authoritySensitive', 'genuinelySubjective', 'limitations', 'freshness', 'humanReview', 'disposition'];
const REQUIRED_NESTED_KEYS = {
  environment: ['os', 'appMode', 'window', 'theme', 'zoom', 'runtime'],
  corpus: ['name', 'sha256'],
  artifact: ['path', 'sha256', 'containsProtectedContent'],
  freshness: ['capturedAt', 'invalidatedBy'],
  humanReview: ['required', 'basis', 'status', 'note'],
};
const EVIDENCE_CLASSES = new Set(['contract', 'fixture', 'component', 'runtime', 'live-local', 'manual']);
const EXECUTION_MODES = new Set(['real-cold', 'real-warm', 'fault-a', 'fault-b', 'not-applicable']);
const RESULTS = new Set(['Pass', 'Fail', 'Uncertain']);
const HUMAN_REVIEW_STATUSES = new Set(['pending', 'pass', 'fail', 'not-required']);
const DISPOSITIONS = new Set(['repair', 'exception', 'defer', 'closure', 'pending']);

function fail(message) {
  throw new Error(`[program7-evidence] ${message}`);
}

function exactKeys(value, expected) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join('|') === [...expected].sort().join('|');
}

function nonEmpty(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
}

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

function sha256Text(value) {
  return sha256Bytes(Buffer.from(value, 'utf8'));
}

function isAbsoluteArtifactPath(value) {
  return /^[A-Za-z]:[\\/]/u.test(value) || /^\\\\/u.test(value) || /^\//u.test(value);
}

function isTimestamp(value) {
  return typeof value === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && !Number.isNaN(Date.parse(value));
}

async function ensureSchema() {
  let schema;
  try {
    schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  } catch (error) {
    fail(`schema could not be read: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || schema.type !== 'object' || schema.additionalProperties !== false) {
    fail('schema is not Draft 2020-12 strict at the root');
  }
  for (const [name, keys] of Object.entries({ root: REQUIRED_ROOT_KEYS, ...REQUIRED_NESTED_KEYS })) {
    const node = name === 'root' ? schema : schema.properties?.[name === 'artifact' ? 'artifacts' : name]?.items ?? schema.properties?.[name];
    if (!node || node.additionalProperties !== false || !Array.isArray(node.required)) fail(`schema is not strict for ${name}`);
    const missing = keys.filter((key) => !node.required.includes(key));
    if (missing.length > 0) fail(`schema is missing required ${name} keys`);
  }
}

async function packageIds() {
  const planPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_creation_revision_and_readiness_implementation_plan.md');
  const plan = await readFile(planPath, 'utf8');
  return new Set([...plan.matchAll(/^###\s+([A-Z0-9]+(?:-[A-Z0-9]+)+)\s+-/gmu)].map((match) => match[1]));
}

async function gitCommitExists(commit) {
  try {
    await execFileAsync('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: repoRoot });
  } catch {
    fail(`exactCommit ${commit} is not a reachable commit`);
  }
}

async function gitTreeForCommit(commit) {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', `${commit}^{tree}`], { cwd: repoRoot });
    return stdout.trim();
  } catch {
    fail(`exactCommit ${commit} has no readable tree`);
  }
}

async function validateArtifact(row, artifact, rowIndex) {
  if (!exactKeys(artifact, REQUIRED_NESTED_KEYS.artifact)) fail(`${row.evidenceId} artifact ${rowIndex} has unexpected keys`);
  nonEmpty(artifact.path, `${row.evidenceId} artifact path`);
  if (!isAbsoluteArtifactPath(artifact.path)) fail(`${row.evidenceId} artifact path is not absolute`);
  if (!/^[0-9a-f]{64}$/u.test(artifact.sha256)) fail(`${row.evidenceId} artifact hash is invalid`);
  if (artifact.containsProtectedContent !== false) fail(`${row.evidenceId} contains protected content`);
  try {
    await access(artifact.path);
    const digest = sha256Bytes(await readFile(artifact.path));
    if (digest !== artifact.sha256) fail(`${row.evidenceId} artifact hash does not match`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(`${row.evidenceId} `)) throw error;
    fail(`${row.evidenceId} artifact does not exist or cannot be read`);
  }
}

async function validateRow(row, rowNumber, packages) {
  if (!exactKeys(row, REQUIRED_ROOT_KEYS)) fail(`row ${rowNumber} has unexpected or missing fields`);
  nonEmpty(row.evidenceId, `row ${rowNumber} evidenceId`);
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/u.test(row.evidenceId)) fail(`${row.evidenceId} evidenceId format is invalid`);
  if (!/^[0-9a-f]{40}$/u.test(row.exactCommit)) fail(`${row.evidenceId} exactCommit is invalid`);
  if (!packages.has(row.package)) fail(`${row.evidenceId} package is not named by the implementation plan`);
  if (!EVIDENCE_CLASSES.has(row.evidenceClass) || !EXECUTION_MODES.has(row.executionMode)) fail(`${row.evidenceId} enum is invalid`);
  if (!/^(?:[0-9a-f]{40}|not-applicable)$/u.test(row.precommitTreeHash)) fail(`${row.evidenceId} precommitTreeHash is invalid`);
  for (const field of ['action', 'expected', 'observed', 'reviewer']) nonEmpty(row[field], `${row.evidenceId} ${field}`);
  if (!Array.isArray(row.preconditions) || row.preconditions.length < 1 || row.preconditions.some((value) => typeof value !== 'string' || value.trim() === '')) fail(`${row.evidenceId} preconditions are invalid`);
  if (!Array.isArray(row.limitations) || row.limitations.some((value) => typeof value !== 'string' || value.trim() === '')) fail(`${row.evidenceId} limitations are invalid`);
  if (!RESULTS.has(row.result) || !DISPOSITIONS.has(row.disposition)) fail(`${row.evidenceId} result or disposition is invalid`);
  if (!exactKeys(row.environment, REQUIRED_NESTED_KEYS.environment) || !['dark', 'light'].includes(row.environment.theme) || !Number.isInteger(row.environment.zoom) || row.environment.zoom < 1) fail(`${row.evidenceId} environment is invalid`);
  for (const field of ['os', 'appMode', 'window', 'runtime']) nonEmpty(row.environment[field], `${row.evidenceId} environment.${field}`);
  if (!exactKeys(row.corpus, REQUIRED_NESTED_KEYS.corpus)) fail(`${row.evidenceId} corpus is invalid`);
  nonEmpty(row.corpus.name, `${row.evidenceId} corpus.name`);
  if (!/^(?:[0-9a-f]{64}|not-applicable)$/u.test(row.corpus.sha256)) fail(`${row.evidenceId} corpus hash is invalid`);
  if (!Array.isArray(row.artifacts) || row.artifacts.length < 1) fail(`${row.evidenceId} must include an artifact`);
  for (let index = 0; index < row.artifacts.length; index += 1) await validateArtifact(row, row.artifacts[index], index);
  if (!exactKeys(row.freshness, REQUIRED_NESTED_KEYS.freshness) || !isTimestamp(row.freshness.capturedAt) || !Array.isArray(row.freshness.invalidatedBy) || row.freshness.invalidatedBy.some((value) => typeof value !== 'string' || value.trim() === '')) fail(`${row.evidenceId} freshness is invalid`);
  if (!exactKeys(row.humanReview, REQUIRED_NESTED_KEYS.humanReview) || typeof row.humanReview.required !== 'boolean' || !HUMAN_REVIEW_STATUSES.has(row.humanReview.status)) fail(`${row.evidenceId} humanReview is invalid`);
  for (const field of ['basis', 'note']) nonEmpty(row.humanReview[field], `${row.evidenceId} humanReview.${field}`);
  const requiresReview = row.authoritySensitive || row.genuinelySubjective || row.evidenceClass === 'live-local' || /protected|sovereign|local-ai|mutation/iu.test(`${row.action} ${row.expected} ${row.observed}`);
  if (requiresReview && (!row.humanReview.required || row.humanReview.status === 'not-required')) fail(`${row.evidenceId} requires Jason review`);
  if (row.humanReview.required && row.humanReview.status === 'not-required') fail(`${row.evidenceId} cannot mark required review as not-required`);
  if ((row.result === 'Fail' || row.result === 'Uncertain') && row.disposition === 'closure') fail(`${row.evidenceId} unresolved result cannot use closure`);
  await gitCommitExists(row.exactCommit);
  if (row.precommitTreeHash !== 'not-applicable') {
    const expectedTree = await gitTreeForCommit(row.exactCommit);
    if (row.precommitTreeHash !== expectedTree) {
      fail(`${row.evidenceId} precommitTreeHash does not match exactCommit tree`);
    }
  }
}

async function validateHumanSample(rows, exactCommit) {
  let sample;
  try {
    sample = JSON.parse(await readFile(path.join(repoRoot, 'docs', 'product_systems', 'program_7_human_sample.json'), 'utf8'));
  } catch {
    fail('deterministic human sample artifact could not be read');
  }
  if (sample.schemaVersion !== 'program7.human-sample.v1' || sample.algorithm !== 'program7-human-sample-v1') {
    fail('deterministic human sample schema or algorithm is invalid');
  }
  if (sample.exactCommit !== exactCommit) fail('human sample exactCommit does not match the evidence packet');
  if (!sample.jasonFields || sample.jasonFields.status !== '' || sample.jasonFields.decision !== '') {
    fail('human sample contains a Jason decision');
  }
  const expectedPackages = new Map();
  for (const row of rows) {
    if (row.result !== 'Pass' || row.authoritySensitive || row.genuinelySubjective) continue;
    const eligible = expectedPackages.get(row.package) ?? [];
    eligible.push(row.evidenceId);
    expectedPackages.set(row.package, eligible);
  }
  const packageEntries = sample.packages && typeof sample.packages === 'object' ? sample.packages : {};
  for (const [packageId, eligibleIds] of expectedPackages) {
    const entry = packageEntries[packageId];
    if (!entry) fail(`human sample is missing package ${packageId}`);
    const actualEligible = [...new Set(entry.eligiblePassIds ?? [])].sort();
    if (JSON.stringify(actualEligible) !== JSON.stringify([...eligibleIds].sort())) fail(`human sample eligible IDs differ for ${packageId}`);
    const expectedCount = eligibleIds.length < 3 ? eligibleIds.length : Math.max(3, Math.ceil(eligibleIds.length * 0.1));
    if (entry.sampleCount !== expectedCount || !Array.isArray(entry.selectedIds) || entry.selectedIds.length !== expectedCount) {
      fail(`human sample count is invalid for ${packageId}`);
    }
    if (new Set(entry.selectedIds).size !== entry.selectedIds.length || entry.selectedIds.some((id) => !eligibleIds.includes(id))) {
      fail(`human sample selected IDs are invalid for ${packageId}`);
    }
  }
  if (Object.keys(packageEntries).some((packageId) => !expectedPackages.has(packageId))) fail('human sample contains an unknown package');
}

async function main() {
  const argv = process.argv.slice(2);
  const ledgerIndex = argv.indexOf('--ledger');
  const ledgerPath = path.resolve(ledgerIndex >= 0 ? argv[ledgerIndex + 1] : defaultLedgerPath);
  await ensureSchema();
  const packages = await packageIds();
  let lines;
  try {
    lines = (await readFile(ledgerPath, 'utf8')).split(/\r?\n/u).filter((line) => line.trim() !== '');
  } catch {
    fail('ledger could not be read');
  }
  if (lines.length === 0) fail('ledger has no rows');
  const rows = [];
  for (let index = 0; index < lines.length; index += 1) {
    try {
      rows.push(JSON.parse(lines[index]));
    } catch {
      fail(`row ${index + 1} is not valid JSON`);
    }
  }
  const ids = new Set();
  const commits = new Set();
  const trees = new Set();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (ids.has(row.evidenceId)) fail(`${row.evidenceId} is duplicated`);
    ids.add(row.evidenceId);
    commits.add(row.exactCommit);
    trees.add(row.precommitTreeHash);
    await validateRow(row, index + 1, packages);
  }
  if (commits.size !== 1) fail('packet mixes exact commits');
  if (trees.size !== 1) fail('packet mixes precommit tree states');
  if ([...trees][0] === 'not-applicable') {
    // A clean exact-commit run is the only allowed reason for omitting the tree hash.
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], { cwd: repoRoot });
    if (stdout.trim() !== '') fail('not-applicable precommitTreeHash requires a clean worktree');
  }
  await validateHumanSample(rows, [...commits][0]);
  process.stdout.write(`${JSON.stringify({ ok: true, rows: rows.length, exactCommit: [...commits][0], precommitTreeHash: [...trees][0], evidenceIds: [...ids] }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
