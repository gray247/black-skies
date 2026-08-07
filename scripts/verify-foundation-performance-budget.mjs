import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const absoluteMetricPaths = ['installer.byteLength', 'unpacked.byteLength', 'unpacked.asar.byteLength', 'unpacked.executable.byteLength', 'unpacked.rendererChunks.totalByteLength', 'installedLifecycle.performance.steadyStateWorkingSetBytes'];

function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf8')); }
function get(object, dottedPath) { return dottedPath.split('.').reduce((value, key) => value?.[key], object); }
function invariant(condition, message) { if (!condition) throw new Error(message); }
function argument(flag) { const index = process.argv.indexOf(flag); return index >= 0 ? process.argv[index + 1] : undefined; }
function median(values) {
  invariant(values.length % 2 === 1, 'Cold-launch median requires an odd sample count.');
  return [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)];
}
function assertColdLaunchMeasurement(measurement, label) {
  invariant(measurement?.coldLaunchMeasurementSource === 'main-process-monotonic-probe', `${label} measurement source is invalid.`);
  invariant(measurement?.coldLaunchProbeSchema === 'black-skies.stage19.internal-startup-probe.v1', `${label} probe schema is invalid.`);
  invariant(Number.isFinite(measurement?.coldLaunchPreparationMs) && measurement.coldLaunchPreparationMs > 0, `${label} preparation evidence is missing or invalid.`);
  invariant(measurement.coldLaunchPreparationWindowCount === 2, `${label} preparation did not prove two windows.`);
  invariant(measurement.coldLaunchPreparationVisibleWindowCount === 2, `${label} preparation did not prove two visible windows.`);
  invariant(measurement.coldLaunchPreparationSandboxedWindowCount === 2, `${label} preparation did not prove two sandboxed windows.`);
  invariant(measurement?.coldLaunchStatistic === 'median', `${label} measurement must use the governed median statistic.`);
  invariant(measurement?.coldLaunchSampleCount === 5, `${label} measurement must contain exactly five process-cold samples.`);
  invariant(Array.isArray(measurement?.coldLaunchSamplesMs) && measurement.coldLaunchSamplesMs.length === 5, `${label} sample evidence is missing or malformed.`);
  invariant(measurement.coldLaunchSamplesMs.every(Number.isFinite), `${label} sample evidence contains an invalid value.`);
  for (const [field, requirement] of [
    ['coldLaunchSampleWindowCounts', 'two windows'],
    ['coldLaunchSampleVisibleWindowCounts', 'two visible windows'],
    ['coldLaunchSampleSandboxedWindowCounts', 'two sandboxed windows']
  ]) {
    invariant(
      Array.isArray(measurement[field]) && measurement[field].length === 5 && measurement[field].every((count) => count === 2),
      `${label} samples did not each prove ${requirement}.`
    );
  }
  invariant(measurement.coldLaunchDurationMs === median(measurement.coldLaunchSamplesMs), `${label} metric must be the median of every governed sample.`);
}

try {
  const receiptArgument = argument('--receipt');
  invariant(receiptArgument, 'A package receipt is required.');
  const budget = readJson(path.join(repoRoot, 'docs/testing/foundation_performance_budget.json'));
  const receipt = readJson(path.resolve(repoRoot, receiptArgument));
  invariant(budget.schema === 'black-skies.foundation-performance-budget.v1', 'Performance budget schema is invalid.');
  invariant(receipt.qualifiedCommit === process.env.GITHUB_SHA || !process.env.GITHUB_SHA, 'Receipt is not bound to this GitHub candidate.');
  invariant(receipt.installedLifecycle?.status === 'passed', 'Installed lifecycle is not a passing measurement.');
  invariant(receipt.installedLifecycle?.forbiddenRuntimeProcessCount === 0, 'Installed lifecycle found forbidden runtime processes.');
  invariant(receipt.installedLifecycle?.zeroSurvivorProcessCount === 0, 'Installed lifecycle left owned processes after teardown.');
  const candidateColdLaunch = receipt.installedLifecycle?.performance;
  invariant(budget.measurementProtocol === 'interleaved-main-process-monotonic-two-window-median-v5', 'Performance budget measurement protocol is invalid.');
  invariant(candidateColdLaunch?.coldLaunchProtocol === budget.measurementProtocol, 'Receipt measurement protocol does not match the governed performance budget.');
  assertColdLaunchMeasurement(candidateColdLaunch, 'Candidate cold-launch');
  const pairedReference = candidateColdLaunch?.pairedReference;
  invariant(typeof pairedReference?.sourceCandidate === 'string' && pairedReference.sourceCandidate.length === 40, 'Paired startup reference source candidate is missing or invalid.');
  invariant(Number.isFinite(pairedReference?.executable?.byteLength) && typeof pairedReference.executable.sha256 === 'string', 'Paired startup reference executable evidence is invalid.');
  invariant(Number.isFinite(pairedReference?.asar?.byteLength) && typeof pairedReference.asar.sha256 === 'string', 'Paired startup reference ASAR evidence is invalid.');
  invariant(pairedReference?.performance?.coldLaunchProtocol === budget.measurementProtocol, 'Paired startup reference measurement protocol is invalid.');
  assertColdLaunchMeasurement(pairedReference?.performance, 'Paired startup reference');
  const startupRatio = candidateColdLaunch.coldLaunchDurationMs / pairedReference.performance.coldLaunchDurationMs;
  invariant(Number.isFinite(pairedReference.candidateToReferenceRatio) && pairedReference.candidateToReferenceRatio > 0, 'Paired startup ratio is missing or invalid.');
  invariant(Math.abs(pairedReference.candidateToReferenceRatio - startupRatio) < 0.000001, 'Paired startup ratio does not match the exact candidate and reference medians.');
  for (const metric of absoluteMetricPaths) invariant(Number.isFinite(get(receipt, metric)), `Measurement is missing or invalid: ${metric}.`);
  invariant(budget.baseline, 'Performance baseline is not established; this receipt is UNVERIFIED until a reviewed exact-candidate baseline is committed.');
  invariant(pairedReference.sourceCandidate === budget.baseline.reference.sourceCandidate, 'Paired startup reference does not match the governed baseline source candidate.');
  invariant(pairedReference.executable.sha256 === budget.baseline.reference.executable.sha256, 'Paired startup reference executable does not match the governed baseline.');
  invariant(pairedReference.asar.sha256 === budget.baseline.reference.asar.sha256, 'Paired startup reference ASAR does not match the governed baseline.');
  const baselineStartupRatio = get(budget.baseline.metrics, 'installedLifecycle.performance.coldLaunchCandidateToReferenceRatio');
  invariant(Number.isFinite(baselineStartupRatio), 'Baseline paired startup ratio is missing or invalid.');
  invariant(startupRatio <= baselineStartupRatio * (1 + budget.maximumRegressionPercent / 100), `Performance budget exceeded for paired startup ratio: ${startupRatio} > ${baselineStartupRatio}.`);
  for (const metric of absoluteMetricPaths) {
    const baseline = get(budget.baseline.metrics, metric);
    const actual = get(receipt, metric);
    invariant(Number.isFinite(baseline), `Baseline metric is missing: ${metric}.`);
    invariant(actual <= baseline * (1 + budget.maximumRegressionPercent / 100), `Performance budget exceeded for ${metric}: ${actual} > ${baseline}.`);
  }
  process.stdout.write('FOUNDATION_PERFORMANCE_BUDGET_PASS\n');
} catch (error) {
  process.stderr.write(`[foundation-performance] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
