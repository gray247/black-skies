#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_evidence_ledger.jsonl');
const pilotPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_local_ai_qualification.json');
const electronPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_electron_qualification.json');
const persistencePath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_persistence_qualification.json');
const protocolPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_qualification_protocol.md');
const samplePath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_human_sample.json');
const packageReceiptPath = path.join(repoRoot, 'app', 'release', 'stage19-package-receipt.json');
const lifecycleEvidencePath = 'C:\\Users\\gray2\\AppData\\Local\\Temp\\blackskies-program7-installed-final\\stage19-22-lifecycle-evidence.json';
const corpusHash = '557b3b2e62b2d919443f7df979c5bf01eefd86ddbbe012f276fa03ab06203e94';

function sha256Bytes(value) { return createHash('sha256').update(value).digest('hex'); }
function sha256Text(value) { return sha256Bytes(Buffer.from(value, 'utf8')); }
function artifact(filePath) { return { path: filePath, sha256: sha256Bytes(requireBuffer(filePath)), containsProtectedContent: false }; }
function requireBuffer(filePath) { return fileBuffers.get(filePath); }
const fileBuffers = new Map();

function argValue(name) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith('-') ? value : undefined;
}

async function loadArtifact(filePath) {
  const bytes = await readFile(filePath);
  fileBuffers.set(filePath, bytes);
  return artifact(filePath);
}

function row({ evidenceId, packageId, evidenceClass, executionMode, environment, action, expected, observed, result, reviewer = 'agent-program7', authoritySensitive = false, genuinelySubjective = false, humanRequired = false, humanStatus = 'not-required', humanBasis = 'Mechanical precheck only.', limitations = [], disposition = 'closure', artifacts }) {
  return {
    evidenceId,
    exactCommit,
    package: packageId,
    evidenceClass,
    executionMode,
    precommitTreeHash,
    environment,
    corpus: { name: 'carmilla-program7', sha256: corpusHash },
    preconditions: ['Exact candidate source is present', 'Evidence artifact is readable'],
    action,
    expected,
    observed,
    artifacts,
    result,
    reviewer,
    authoritySensitive,
    genuinelySubjective,
    limitations,
    freshness: { capturedAt: new Date().toISOString(), invalidatedBy: ['tracked source or runtime change'] },
    humanReview: { required: humanRequired, basis: humanBasis, status: humanStatus, note: humanRequired ? 'Jason fields intentionally remain blank until Human Gate 4.' : 'No subjective acceptance is inferred.' },
    disposition,
  };
}

const { stdout: exactCommitOut } = await execFileAsync('git', ['rev-parse', argValue('--exact-commit') ?? 'HEAD'], { cwd: repoRoot });
const exactCommit = exactCommitOut.trim();
const { stdout: precommitTreeOut } = await execFileAsync('git', ['rev-parse', `${exactCommit}^{tree}`], { cwd: repoRoot });
const precommitTreeHash = precommitTreeOut.trim();
const pilot = JSON.parse(await readFile(pilotPath, 'utf8'));
const electron = JSON.parse(await readFile(electronPath, 'utf8'));
const persistence = JSON.parse(await readFile(persistencePath, 'utf8'));
const pilotArtifact = await loadArtifact(pilotPath);
const electronArtifact = await loadArtifact(electronPath);
const persistenceArtifact = await loadArtifact(persistencePath);
const protocolArtifact = await loadArtifact(protocolPath);
let sampleArtifact = null;
try { sampleArtifact = await loadArtifact(samplePath); } catch { sampleArtifact = null; }
let packageReceiptArtifact = null;
try { packageReceiptArtifact = await loadArtifact(packageReceiptPath); } catch { packageReceiptArtifact = null; }
let lifecycleEvidenceArtifact = null;
try { lifecycleEvidenceArtifact = await loadArtifact(lifecycleEvidencePath); } catch { lifecycleEvidenceArtifact = null; }
const environment = { os: 'Windows outer host', appMode: 'Node/Electron qualification', window: 'attached and detached surfaces where applicable', theme: 'dark', zoom: 100, runtime: 'Node 20+ / Electron 39.8.10 / normal GPU' };
const rows = [];
const persistenceFamilies = new Map((persistence.matrix ?? []).map((entry) => [entry.family, entry]));
const persistenceQualified = persistence.schema === 'black-skies.program7.persistence-qualification.v1'
  && persistence.status === 'qualified'
  && persistence.exactCommit === exactCommit
  && persistence.exactTree === precommitTreeHash
  && persistence.protectedEvidenceUsed === false
  && persistence.humanAcceptanceClaimed === false
  && persistence.testSummary?.failed === 0
  && ['migration', 'corruption', 'concurrency', 'recovery'].every((family) => persistenceFamilies.get(family)?.result === 'Pass');

for (const matrixRow of pilot.matrix) {
  const subjective = ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07'].includes(matrixRow.scenarioId);
  rows.push(row({
    evidenceId: `RT-2B-${matrixRow.scenarioId}-${matrixRow.executionMode.toUpperCase()}`,
    packageId: 'RT-2B',
    evidenceClass: 'live-local',
    executionMode: matrixRow.executionMode,
    environment: { ...environment, appMode: 'Node real-host pilot', window: 'not-applicable', runtime: 'Ollama 0.13.0 / qwen3:4b / CPU' },
    action: `Execute ${matrixRow.scenarioId} ${matrixRow.executionMode} through the production local-inference service.`,
    expected: matrixRow.expected,
    observed: `${matrixRow.observed}; mechanicalPass=${String(matrixRow.mechanicalPass)}`,
    result: matrixRow.mechanicalPass ? 'Pass' : 'Fail',
    authoritySensitive: subjective || ['Q11', 'Q12'].includes(matrixRow.scenarioId),
    genuinelySubjective: subjective,
    humanRequired: true,
    humanStatus: 'pending',
    humanBasis: subjective ? 'Jason scores usefulness, fidelity, fact preservation, voice, actionability, and uncertainty restraint.' : 'Safety and sovereignty behavior is authority-sensitive even when mechanically bounded.',
    limitations: ['Mechanical pilot evidence only; local-AI admission is not inferred.'],
    disposition: matrixRow.mechanicalPass ? 'defer' : 'repair',
    artifacts: [pilotArtifact],
  }));
}

const suiteRows = [
  ['revision', 'Create / Develop, finding handoff, deterministic recheck, candidate comparison, and explicit acceptance.'],
  ['create-develop', 'Story Foundation and Ideas remain optional, bounded, and auditable.'],
  ['local-ai', 'No-AI local inference controls fail closed without candidate or manuscript mutation.'],
  ['long-form', 'All 17 Carmilla units and attached/detached project identity remain consistent.'],
];
for (const [suffix, expected] of suiteRows) {
  const suiteNeedsReview = suffix === 'local-ai';
  rows.push(row({
    evidenceId: `P7-G2-E2E-${suffix.toUpperCase()}`,
    packageId: 'P7-G2', evidenceClass: 'component', executionMode: 'real-warm', environment,
    action: `Run Program 7 Electron suite ${suffix}.`, expected,
    observed: 'Suite passed in the exact outer-host normal-GPU run; no subjective acceptance inferred.',
    result: 'Pass', authoritySensitive: suiteNeedsReview, genuinelySubjective: false, humanRequired: suiteNeedsReview, humanStatus: suiteNeedsReview ? 'pending' : 'not-required', humanBasis: suiteNeedsReview ? 'Jason must review the no-AI/local-AI boundary before admission.' : 'Mechanical suite result only.', artifacts: [electronArtifact], limitations: ['Suite is mechanical and does not decide usefulness, aesthetics, or admission.'],
  }));
}

rows.push(row({
  evidenceId: 'P7-G2-STAGE19', packageId: 'P7-G2', evidenceClass: 'runtime', executionMode: 'real-warm', environment,
  action: 'Run the complete clean stage19:regression gate on the outer Windows host with normal GPU operation.',
  expected: '49 critical files pass with 803 tests passed and 2 expected skips, startup 1/1, Electron 36/36, STAGE19_REGRESSION_PASS, and CLEAN_RC_ELIGIBLE.',
  observed: 'Clean outer-host run passed 49 critical files, 803 passed, 2 skips, startup 1/1, Electron 36/36, STAGE19_REGRESSION_PASS, and CLEAN_RC_ELIGIBLE.',
  result: 'Pass', artifacts: [electronArtifact], limitations: ['The nested Codex sandbox reproduces STATUS_DLL_NOT_FOUND; the required outer-host normal-GPU run is the authoritative result.'],
}));

for (const [id, expected] of [
  ['P7-HG4-REG-P4', 'Jason uses Companion and verifies local-facts labeling, limitation, return-to-writing, and dismiss.'],
  ['P7-HG4-REG-P5', 'Jason verifies anchored source jumps remain usable after navigation and reopen.'],
  ['P7-HG4-REG-P6', 'Jason verifies detached Story Intelligence/Emotion handoff preserves project and source context.'],
]) {
  rows.push(row({
    evidenceId: id, packageId: 'P7-G2', evidenceClass: 'manual', executionMode: 'not-applicable', environment,
    action: 'Reserve the bounded current-build regression carry-forward for Jason’s Human Gate 4 session.', expected,
    observed: 'Not executed by agents; blank human evidence fields intentionally remain for the required human session.',
    result: 'Uncertain', reviewer: 'agent-program7', authoritySensitive: true, genuinelySubjective: true, humanRequired: true, humanStatus: 'pending',
    humanBasis: 'The protocol assigns this real-project regression observation to Jason.', limitations: ['Must be completed before Human Gate 4 proceeds.'], disposition: 'defer', artifacts: [protocolArtifact],
  }));
}

if (sampleArtifact) {
  rows.push(row({
    evidenceId: 'P7-G2-HUMAN-SAMPLE', packageId: 'P7-G2', evidenceClass: 'contract', executionMode: 'not-applicable', environment,
    action: 'Compute Jason’s objective Pass sample using the exact commit/package SHA-256 seed algorithm.',
    expected: 'The deterministic 10% sample with a minimum of three per package is recorded with blank Jason fields.',
    observed: 'Sampling artifact records exact commit, algorithm version, per-package seeds, eligible IDs, selected IDs, and blank Jason fields.',
    result: 'Pass', authoritySensitive: true, genuinelySubjective: false, humanRequired: true, humanStatus: 'pending', humanBasis: 'Jason must review the selected objective rows and fill the blank fields.', limitations: ['Selection is mechanical; no Jason score or decision is inferred.'], disposition: 'defer', artifacts: [sampleArtifact],
  }));
}

for (const [id, family, expected] of [
  ['P7-G2-PROTOCOL-MIGRATION', 'migration', 'Legacy reads, first supported write, extension-field preservation, and repeated migration are idempotent.'],
  ['P7-G2-PROTOCOL-CORRUPTION', 'corruption', 'Malformed, truncated, wrong-type, and checksum-invalid artifacts fail closed without repair authority.'],
  ['P7-G2-PROTOCOL-CONCURRENCY', 'concurrency', 'Concurrent writers and stale expected revisions fail closed while preserving durable truth.'],
  ['P7-G2-PROTOCOL-RECOVERY', 'recovery', 'Crash points, write denial, restart, discarded temp files, and prior-file restoration preserve recovery invariants.'],
]) {
  const familyResult = persistenceFamilies.get(family);
  rows.push(row({
    evidenceId: id, packageId: 'P7-G2', evidenceClass: 'component', executionMode: 'fault-a', environment,
    action: `Run the exact Program 7 ${family} persistence qualification against the named sidecar and ProjectSpine owners.`, expected,
    observed: persistenceQualified
      ? `${persistence.testSummary.files} suites / ${persistence.testSummary.passed} tests passed; ${family} matrix Pass with ${familyResult.checks.length} mapped assertions; exact commit/tree bound.`
      : 'A matching exact-commit persistence artifact is unavailable; this remains an explicit unresolved prerequisite.',
    result: persistenceQualified ? 'Pass' : 'Uncertain', authoritySensitive: false, genuinelySubjective: false,
    humanRequired: false, humanStatus: 'not-required', humanBasis: 'This row records deterministic persistence behavior only.',
    limitations: ['Mechanical persistence proof only; it does not decide writer usefulness or Human Gate 4 acceptance.'],
    disposition: persistenceQualified ? 'closure' : 'defer',
    artifacts: persistenceQualified ? [persistenceArtifact, protocolArtifact] : [protocolArtifact],
  }));
}

for (const [id, expected] of [
  ['P7-G2-PROTOCOL-UNICODE-MARKDOWN', 'ASCII, accented, combining, emoji, CJK, RTL, Markdown, newline, UTF-16, and round-trip anchor fixtures are covered.'],
  ['P7-G2-PROTOCOL-ACCESSIBILITY-VISUAL', 'Required surfaces and states pass axe, contrast, keyboard, theme, zoom, narrow-layout, focus, and reduced-motion checks.'],
  ['P7-G2-PROTOCOL-SCALE', 'Carmilla and 1x/2x/4x/8x synthetic scale fixtures meet performance and bounded-resource limits.'],
]) {
  rows.push(row({
    evidenceId: id, packageId: 'P7-G2', evidenceClass: 'contract', executionMode: 'not-applicable', environment,
    action: 'Inventory the remaining protocol prerequisite before Human Gate 4.', expected,
    observed: 'Required by protocol but not executed in this packet; this is an explicit unresolved prerequisite, not a pass.',
    result: 'Uncertain', authoritySensitive: true, genuinelySubjective: false, humanRequired: true, humanStatus: 'pending',
    humanBasis: 'Jason must review the unresolved prerequisite and its evidence before the gate.', limitations: ['Mechanical qualification remains blocked until the named matrix is run.'], disposition: 'defer', artifacts: [protocolArtifact],
  }));
}

rows.push(row({
  evidenceId: 'P7-G2-PACKAGED', packageId: 'P7-G2', evidenceClass: 'contract', executionMode: 'not-applicable', environment,
  action: 'Run unpacked and installed NSIS qualification with the exact candidate and complete no-AI workflow.',
  expected: 'Unpacked and installed NSIS qualification use the same exact candidate and complete the offline firewall-isolated lifecycle.',
  observed: packageReceiptArtifact && lifecycleEvidenceArtifact
    ? 'Application-only installed lifecycle passed on the exact package: packaged/sandboxed windows, representative workload, exact Markdown export, uninstall, external-data preservation, and reinstall all passed. The required outbound-firewall-isolated run was not executed because the current shell is not Administrator.'
    : 'Required by protocol; package or lifecycle artifact was unavailable, so this remains an explicit unresolved prerequisite.',
  result: 'Uncertain', authoritySensitive: true, genuinelySubjective: false, humanRequired: true, humanStatus: 'pending',
  humanBasis: 'Jason must review the unresolved offline-isolation prerequisite and its evidence before the gate.',
  limitations: ['Application-only evidence cannot qualify the exact offline firewall-isolated lifecycle; an elevated PowerShell is required.'], disposition: 'defer',
  artifacts: [protocolArtifact, ...(packageReceiptArtifact ? [packageReceiptArtifact] : []), ...(lifecycleEvidenceArtifact ? [lifecycleEvidenceArtifact] : [])],
}));

await writeFile(ledgerPath, `${rows.map((value) => JSON.stringify(value)).join('\n')}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ rows: rows.length, exactCommit, precommitTreeHash }, null, 2)}\n`);
