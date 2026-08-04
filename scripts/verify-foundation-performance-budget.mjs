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
