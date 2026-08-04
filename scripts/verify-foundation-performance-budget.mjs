import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const metricPaths = ['installer.byteLength', 'unpacked.byteLength', 'unpacked.asar.byteLength', 'unpacked.executable.byteLength', 'unpacked.rendererChunks.totalByteLength', 'installedLifecycle.performance.coldLaunchDurationMs', 'installedLifecycle.performance.steadyStateWorkingSetBytes'];

function readJson(filePath) { return JSON.parse(readFileSync(filePath, 'utf8')); }
function get(object, dottedPath) { return dottedPath.split('.').reduce((value, key) => value?.[key], object); }
function invariant(condition, message) { if (!condition) throw new Error(message); }
function argument(flag) { const index = process.argv.indexOf(flag); return index >= 0 ? process.argv[index + 1] : undefined; }
function median(values) {
  invariant(values.length % 2 === 1, 'Cold-launch median requires an odd sample count.');
  return [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)];
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
  const coldLaunch = receipt.installedLifecycle?.performance;
  invariant(budget.measurementProtocol === 'prepared-profile-process-cold-median-v2', 'Performance budget measurement protocol is invalid.');
  invariant(coldLaunch?.coldLaunchProtocol === budget.measurementProtocol, 'Receipt measurement protocol does not match the governed performance budget.');
  invariant(Number.isFinite(coldLaunch?.coldLaunchPreparationMs) && coldLaunch.coldLaunchPreparationMs > 0, 'Cold-launch preparation evidence is missing or invalid.');
  invariant(coldLaunch.coldLaunchPreparationWindowCount === 2, 'Cold-launch preparation did not prove two windows.');
  invariant(coldLaunch.coldLaunchPreparationVisibleWindowCount === 2, 'Cold-launch preparation did not prove two visible windows.');
  invariant(coldLaunch.coldLaunchPreparationSandboxedWindowCount === 2, 'Cold-launch preparation did not prove two sandboxed windows.');
  invariant(coldLaunch?.coldLaunchStatistic === 'median', 'Cold-launch measurement must use the governed median statistic.');
  invariant(coldLaunch?.coldLaunchSampleCount === 5, 'Cold-launch measurement must contain exactly five process-cold samples.');
  invariant(Array.isArray(coldLaunch?.coldLaunchSamplesMs) && coldLaunch.coldLaunchSamplesMs.length === 5, 'Cold-launch sample evidence is missing or malformed.');
  invariant(coldLaunch.coldLaunchSamplesMs.every(Number.isFinite), 'Cold-launch sample evidence contains an invalid value.');
  for (const [field, label] of [
    ['coldLaunchSampleWindowCounts', 'two windows'],
    ['coldLaunchSampleVisibleWindowCounts', 'two visible windows'],
    ['coldLaunchSampleSandboxedWindowCounts', 'two sandboxed windows']
  ]) {
    invariant(
      Array.isArray(coldLaunch[field]) && coldLaunch[field].length === 5 && coldLaunch[field].every((count) => count === 2),
      `Cold-launch samples did not each prove ${label}.`
    );
  }
  invariant(coldLaunch.coldLaunchDurationMs === median(coldLaunch.coldLaunchSamplesMs), 'Cold-launch metric must be the median of every governed sample.');
  for (const metric of metricPaths) invariant(Number.isFinite(get(receipt, metric)), `Measurement is missing or invalid: ${metric}.`);
  invariant(budget.baseline, 'Performance baseline is not established; this receipt is UNVERIFIED until a reviewed exact-candidate baseline is committed.');
  for (const metric of metricPaths) {
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
