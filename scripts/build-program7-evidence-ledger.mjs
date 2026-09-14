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
const defaultLedgerPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_evidence_ledger.jsonl');
const pilotPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_local_ai_qualification.json');
const electronPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_electron_qualification.json');
const persistencePath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_persistence_qualification.json');
const unicodePath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_unicode_qualification.json');
const accessibilityPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_accessibility_qualification.json');
const scalePath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_scale_qualification.json');
const protocolPath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_qualification_protocol.md');
const samplePath = path.join(repoRoot, 'docs', 'product_systems', 'program_7_human_sample.json');
const packageReceiptPath = path.join(repoRoot, 'app', 'release', 'stage19-package-receipt.json');
const defaultLifecycleEvidencePath = 'C:\\Users\\gray2\\AppData\\Local\\Temp\\blackskies-program7-installed-final\\stage19-22-lifecycle-evidence.json';
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

function inputPath(name, fallback) {
  const supplied = argValue(name);
  return supplied ? path.resolve(supplied) : fallback;
}

const ledgerPath = inputPath('--ledger', defaultLedgerPath);

async function loadArtifact(filePath) {
  const bytes = await readFile(filePath);
  fileBuffers.set(filePath, bytes);
  return artifact(filePath);
}

async function loadQualification(filePath) {
  try {
    const bytes = await readFile(filePath);
    fileBuffers.set(filePath, bytes);
    return { document: JSON.parse(bytes.toString('utf8')), artifact: artifact(filePath) };
  } catch {
    return null;
  }
}

function exactBinding(document, exactCommit, exactTree) {
  return document?.exactCommit === exactCommit
    && (document.exactTree ?? document.precommitTreeHash) === exactTree;
}

function packetSafety(document) {
  return document?.protectedEvidenceUsed === false && document?.humanAcceptanceClaimed === false;
}

function allPass(values) {
  return Array.isArray(values) && values.length > 0 && values.every((value) => value === 'Pass' || value?.status === 'passed' || value?.result === 'Pass' || value?.passed === true);
}

function qualifiesUnicode(document, exactCommit, exactTree) {
  return document?.schema === 'program7.unicode-qualification.v2'
    && document.pass === true
    && exactBinding(document, exactCommit, exactTree)
    && document.workingTreeClean === true
    && document.observed?.tests === 18
    && document.observed?.passedTests === 18
    && document.observed?.failedTests === 0
    && document.assertions?.length === 18
    && allPass(document.assertions)
    && packetSafety(document);
}

function qualifiesAccessibility(document, exactCommit, exactTree) {
  return document?.schema === 'program7.accessibility-qualification.v1'
    && document.status === 'qualified'
    && exactBinding(document, exactCommit, exactTree)
    && document.cleanExactCommitBinding === true
    && allPass(document.rows)
    && Array.isArray(document.absentRows) && document.absentRows.length === 0
    && Array.isArray(document.failedRows) && document.failedRows.length === 0
    && Array.isArray(document.uncertainRows) && document.uncertainRows.length === 0
    && Array.isArray(document.unresolvedRequiredStates) && document.unresolvedRequiredStates.length === 0
    && Array.isArray(document.requiredStates) && document.requiredStates.length > 0
    && document.requiredStates.every((state) => document.stateBindings?.[state]?.result === 'Pass')
    && packetSafety(document);
}

function qualifiesScale(document, exactCommit, exactTree) {
  return document?.schema === 'black-skies.program7.scale-qualification.v1'
    && document.status === 'qualified'
    && exactBinding(document, exactCommit, exactTree)
    && document.matrixCompleteness?.assertionsComplete === true
    && document.matrixCompleteness?.observationsComplete === true
    && document.matrixCompleteness?.expectedScales?.length === 4
    && document.assertions?.length === 4
    && document.observations?.length === 4
    && document.electron?.requested === true
    && document.electron?.status === 'passed'
    && allPass(document.assertions)
    && packetSafety(document);
}

function qualifiesLifecycle(document, receipt, exactCommit, exactTree) {
  const lifecycleTree = document?.exactTree ?? document?.precommitTreeHash ?? document?.treeHash;
  const receiptTree = receipt?.exactTree ?? receipt?.precommitTreeHash ?? receipt?.treeHash;
  return document?.schema === 'black-skies.stage19-22.lifecycle-evidence.v1'
    && document.qualifiedCommit === exactCommit
    && (lifecycleTree === undefined || lifecycleTree === exactTree)
    && receipt?.schema === 'black-skies.stage19.package-receipt.v1'
    && receipt.qualifiedCommit === exactCommit
    && (receiptTree === undefined || receiptTree === exactTree)
    && document.installedOffline === true
    && document.qualificationMode === 'offline-firewall-isolated'
    && document.representativeWorkloadPassed === true
    && document.forbiddenRuntimeProcessCount === 0
    && document.uninstallRemovedApplication === true
    && document.externalDataPreserved === true
    && document.sameInstallerReinstallPassed === true
    && receipt.protectedEvidenceUsed === false;
}

function qualifiesPilot(document, exactCommit, exactTree) {
  const tree = document?.exactTree ?? document?.precommitTreeHash;
  return document?.schemaVersion === 'program7.local-ai-qualification.v1'
    && document.status === 'qualified'
    && document.exactCommit === exactCommit
    && (tree === undefined || tree === exactTree)
    && document.matrixSummary?.expectedRows === 24
    && document.matrixSummary?.observedRows === 24
    && document.matrixSummary?.mechanicalPassRows === 24
    && document.matrixSummary?.mechanicalPass === true
    && Array.isArray(document.matrix)
    && document.matrix.length === 24
    && document.matrix.every((row) => row?.mechanicalPass === true)
    && document.protectionScan?.pass === true
    && document.protectionScan?.hits?.length === 0
    && document.truthMutation?.unchanged === true
    && document.controls?.protectedRefusal?.sourceTextPackaged === false
    && document.controls?.cancellation?.status === 'cancelled'
    && document.controls?.timeout?.status === 'unavailable'
    && document.controls?.unavailable?.status === 'unavailable'
    && document.controls?.invalidResponse?.status === 'failed'
    && document.admission === 'pending-human';
}

function qualifiesElectron(document, exactCommit, exactTree) {
  return document?.schemaVersion === 'program7.electron-qualification.v1'
    && exactBinding(document, exactCommit, exactTree)
    && document.execution?.gpu === 'normal'
    && document.execution?.diagnosticGpuDisable === false
    && Array.isArray(document.suites)
    && document.suites.length === 4
    && document.suites.every((suite) => suite.result === 'Pass')
    && document.suiteSummary?.passed === 4
    && document.suiteSummary?.failed === 0
    && document.stage19?.criticalUnitFiles === 49
    && document.stage19?.criticalUnitPassed >= 803
    && document.stage19?.expectedSkips === 2
    && document.stage19?.startupPreflight === '1/1'
    && document.stage19?.electronPassed === '36/36'
    && document.stage19?.markers?.includes('STAGE19_REGRESSION_PASS')
    && document.stage19?.markers?.includes('CLEAN_RC_ELIGIBLE');
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
const unicodeQualification = await loadQualification(inputPath('--unicode', unicodePath));
const accessibilityQualification = await loadQualification(inputPath('--accessibility', accessibilityPath));
const scaleQualification = await loadQualification(inputPath('--scale', scalePath));
const protocolArtifact = await loadArtifact(protocolPath);
const sampleQualification = await loadQualification(samplePath);
const sampleArtifact = sampleQualification?.document?.exactCommit === exactCommit ? sampleQualification.artifact : null;
let packageReceiptArtifact = null;
try { packageReceiptArtifact = await loadArtifact(packageReceiptPath); } catch { packageReceiptArtifact = null; }
const lifecycleEvidencePath = inputPath('--lifecycle-evidence', defaultLifecycleEvidencePath);
let lifecycleEvidence = null;
try {
  const bytes = await readFile(lifecycleEvidencePath);
  fileBuffers.set(lifecycleEvidencePath, bytes);
  lifecycleEvidence = JSON.parse(bytes.toString('utf8'));
} catch { lifecycleEvidence = null; }
const lifecycleEvidenceArtifact = lifecycleEvidence ? artifact(lifecycleEvidencePath) : null;
let packageReceipt = null;
try { packageReceipt = JSON.parse(await readFile(packageReceiptPath, 'utf8')); } catch { packageReceipt = null; }
const environment = { os: 'Windows outer host', appMode: 'Node/Electron qualification', window: 'attached and detached surfaces where applicable', theme: 'dark', zoom: 100, runtime: 'Node 20+ / Electron 39.8.10 / normal GPU' };
const pilotQualified = qualifiesPilot(pilot, exactCommit, precommitTreeHash);
const electronQualified = qualifiesElectron(electron, exactCommit, precommitTreeHash);
const pilotEvidenceArtifact = pilotQualified ? pilotArtifact : protocolArtifact;
const electronEvidenceArtifact = electronQualified ? electronArtifact : protocolArtifact;
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
    observed: `${matrixRow.observed}; mechanicalPass=${String(matrixRow.mechanicalPass)}; packetBound=${String(pilotQualified)}`,
    result: !pilotQualified ? 'Uncertain' : matrixRow.mechanicalPass ? 'Pass' : 'Fail',
    authoritySensitive: subjective || ['Q11', 'Q12'].includes(matrixRow.scenarioId),
    genuinelySubjective: subjective,
    humanRequired: true,
    humanStatus: 'pending',
    humanBasis: subjective ? 'Jason scores usefulness, fidelity, fact preservation, voice, actionability, and uncertainty restraint.' : 'Safety and sovereignty behavior is authority-sensitive even when mechanically bounded.',
    limitations: ['Mechanical pilot evidence only; local-AI admission is not inferred.'],
    disposition: pilotQualified && matrixRow.mechanicalPass ? 'defer' : pilotQualified ? 'repair' : 'defer',
    artifacts: [pilotEvidenceArtifact],
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
    observed: `Suite packet exact binding and required summary checks: ${electronQualified ? 'passed' : 'not qualified'}; no subjective acceptance inferred.`,
    result: electronQualified ? 'Pass' : 'Uncertain', authoritySensitive: suiteNeedsReview, genuinelySubjective: false, humanRequired: suiteNeedsReview, humanStatus: suiteNeedsReview ? 'pending' : 'not-required', humanBasis: suiteNeedsReview ? 'Jason must review the no-AI/local-AI boundary before admission.' : 'Mechanical suite result only.', limitations: ['Suite is mechanical and does not decide usefulness, aesthetics, or admission.'], disposition: electronQualified ? 'closure' : 'defer', artifacts: [electronEvidenceArtifact],
  }));
}

const packagedQualified = qualifiesLifecycle(lifecycleEvidence, packageReceipt, exactCommit, precommitTreeHash);
rows.push(row({
  evidenceId: 'P7-G2-STAGE19', packageId: 'P7-G2', evidenceClass: 'runtime', executionMode: 'real-warm', environment,
  action: 'Run the complete clean stage19:regression gate on the outer Windows host with normal GPU operation.',
  expected: '49 critical files pass with at least the 803-test qualified baseline and 2 expected skips, startup 1/1, Electron 36/36, STAGE19_REGRESSION_PASS, and CLEAN_RC_ELIGIBLE.',
  observed: electronQualified
    ? `Clean outer-host packet passed 49 critical files, ${electron.stage19.criticalUnitPassed} passed, 2 skips, startup 1/1, Electron 36/36, STAGE19_REGRESSION_PASS, and CLEAN_RC_ELIGIBLE.`
    : 'Electron qualification packet is unavailable or not bound to this exact candidate; no Stage 19 pass is inferred.',
  result: electronQualified ? 'Pass' : 'Uncertain', disposition: electronQualified ? 'closure' : 'defer', artifacts: [electronEvidenceArtifact], limitations: ['The nested Codex sandbox reproduces STATUS_DLL_NOT_FOUND; the required outer-host normal-GPU run is the authoritative result.'],
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
  const qualification = id === 'P7-G2-PROTOCOL-UNICODE-MARKDOWN'
    ? unicodeQualification
    : id === 'P7-G2-PROTOCOL-ACCESSIBILITY-VISUAL'
      ? accessibilityQualification
      : scaleQualification;
  const qualifies = id === 'P7-G2-PROTOCOL-UNICODE-MARKDOWN'
    ? qualifiesUnicode(qualification?.document, exactCommit, precommitTreeHash)
    : id === 'P7-G2-PROTOCOL-ACCESSIBILITY-VISUAL'
      ? qualifiesAccessibility(qualification?.document, exactCommit, precommitTreeHash)
      : qualifiesScale(qualification?.document, exactCommit, precommitTreeHash);
  const artifactForQualification = qualifies ? qualification.artifact : protocolArtifact;
  rows.push(row({
    evidenceId: id, packageId: 'P7-G2', evidenceClass: 'contract', executionMode: 'not-applicable', environment,
    action: 'Bind the named qualification packet to the exact candidate before Human Gate 4.', expected,
    observed: qualifies
      ? 'The qualification packet is clean, exact-commit/tree bound, complete, and contains no protected-evidence or human-acceptance claim.'
      : qualification
        ? 'The qualification packet is present but is not a clean, complete, exact-commit/tree-bound qualification; no pass is inferred.'
        : 'Required qualification packet was unavailable; this remains an explicit unresolved prerequisite, not a pass.',
    result: qualifies ? 'Pass' : 'Uncertain', authoritySensitive: true, genuinelySubjective: false, humanRequired: true, humanStatus: 'pending',
    humanBasis: 'Jason must review the matrix evidence and any limitations before the gate.', limitations: qualifies ? ['Mechanical matrix proof only; it does not decide usefulness or human acceptance.'] : ['Mechanical qualification remains blocked until the named matrix is run and bound to this exact candidate.'], disposition: 'defer', artifacts: [artifactForQualification],
  }));
}

rows.push(row({
  evidenceId: 'P7-G2-PACKAGED', packageId: 'P7-G2', evidenceClass: 'contract', executionMode: 'not-applicable', environment,
  action: 'Run unpacked and installed NSIS qualification with the exact candidate and complete no-AI workflow.',
  expected: 'Unpacked and installed NSIS qualification use the same exact candidate and complete the offline firewall-isolated lifecycle.',
  observed: packagedQualified
    ? 'The exact package receipt and lifecycle packet match this candidate commit/tree and prove the offline firewall-isolated installed workflow, workload, cleanup, preservation, and reinstall.'
    : packageReceiptArtifact && lifecycleEvidenceArtifact
      ? 'Package and lifecycle artifacts exist, but exact commit/tree binding or the offline firewall-isolated success contract is incomplete; no packaged pass is inferred.'
      : 'Required package or lifecycle artifact was unavailable, so this remains an explicit unresolved prerequisite.',
  result: packagedQualified ? 'Pass' : 'Uncertain', authoritySensitive: true, genuinelySubjective: false, humanRequired: true, humanStatus: 'pending',
  humanBasis: packagedQualified
    ? 'Jason must review the exact packaged evidence and complete the authority-sensitive Human Gate 4 decision.'
    : 'Jason must review the unresolved offline-isolation prerequisite and its evidence before the gate.',
  limitations: packagedQualified
    ? ['Mechanical package proof does not decide Human Gate 4 acceptance.']
    : ['Application-only evidence cannot qualify the exact offline firewall-isolated lifecycle; an elevated PowerShell is required.'], disposition: 'defer',
  artifacts: packagedQualified
    ? [protocolArtifact, ...(packageReceiptArtifact ? [packageReceiptArtifact] : []), ...(lifecycleEvidenceArtifact ? [lifecycleEvidenceArtifact] : [])]
    : [protocolArtifact],
}));

await writeFile(ledgerPath, `${rows.map((value) => JSON.stringify(value)).join('\n')}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ rows: rows.length, exactCommit, precommitTreeHash }, null, 2)}\n`);
