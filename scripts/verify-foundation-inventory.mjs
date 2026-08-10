import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const states = new Set(['CORE', 'RETAINED_NON_BASELINE', 'DEFERRED', 'HISTORICAL_ONLY', 'REMOVABLE']);

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyCoverageManifest(manifest) {
  invariant(manifest.schema === 'black-skies.foundation-supported-core-coverage.v2', 'Supported-core coverage manifest schema is invalid.');
  invariant(manifest.percentageScope === 'Python supported core', 'Supported-core coverage percentage scope is invalid.');
  invariant(manifest.minimumBranchCoverage === 60, 'Supported-core coverage minimum must remain 60%.');
  invariant(Array.isArray(manifest.measured) && manifest.measured.length > 0, 'Supported-core measured coverage paths are missing.');
  invariant(Array.isArray(manifest.verifiedOutsidePercentage) && manifest.verifiedOutsidePercentage.length > 0, 'Supported-core behavior verified outside the percentage is missing.');
  invariant(Array.isArray(manifest.excluded) && manifest.excluded.length > 0, 'Supported-core exclusions are missing.');
  for (const entry of manifest.measured) {
    invariant(typeof entry.path === 'string' && entry.path && typeof entry.owner === 'string' && entry.owner && typeof entry.verification === 'string' && entry.verification, 'Supported-core entry is incomplete.');
    invariant(typeof entry.pythonModule === 'string' && entry.pythonModule, `Measured supported-core entry has no Python module: ${entry.path}.`);
    invariant(existsSync(path.join(repoRoot, entry.path)), `Supported-core path is missing: ${entry.path}.`);
    invariant(existsSync(path.join(repoRoot, entry.verification)), `Supported-core verification is missing: ${entry.verification}.`);
  }
  for (const entry of manifest.verifiedOutsidePercentage) {
    invariant(typeof entry.path === 'string' && entry.path && typeof entry.owner === 'string' && entry.owner && typeof entry.verification === 'string' && entry.verification, 'Supported-core outside-percentage entry is incomplete.');
    invariant(!Object.hasOwn(entry, 'pythonModule'), `Outside-percentage entry must not claim Python measurement: ${entry.path}.`);
    invariant(existsSync(path.join(repoRoot, entry.path)), `Supported-core path is missing: ${entry.path}.`);
    invariant(existsSync(path.join(repoRoot, entry.verification)), `Supported-core verification is missing: ${entry.verification}.`);
  }
  for (const entry of manifest.excluded) invariant(typeof entry.surface === 'string' && entry.surface && typeof entry.owner === 'string' && entry.owner && typeof entry.reopeningTrigger === 'string' && entry.reopeningTrigger, 'Supported-core exclusion is incomplete.');
}

function verifyInventory(inventory) {
  invariant(inventory.schema === 'black-skies.foundation-reachability-inventory.v1', 'Reachability inventory schema is invalid.');
  invariant(Array.isArray(inventory.entries) && inventory.entries.length > 0, 'Reachability inventory is empty.');
  for (const entry of inventory.entries) {
    invariant(typeof entry.surface === 'string' && entry.surface, 'Reachability entry has no surface.');
    invariant(states.has(entry.state), `Reachability entry ${entry.surface} has an invalid state.`);
    invariant(typeof entry.owner === 'string' && entry.owner, `Reachability entry ${entry.surface} has no owner.`);
    invariant(typeof entry.baselineSupported === 'boolean', `Reachability entry ${entry.surface} has no baseline-support classification.`);
    invariant(entry.baselineSupported === (entry.state === 'CORE'), `Reachability entry ${entry.surface} misstates baseline support.`);
    invariant(typeof entry.verification === 'string' && entry.verification, `Reachability entry ${entry.surface} has no verification.`);
    invariant(typeof entry.reopeningTrigger === 'string' && entry.reopeningTrigger, `Reachability entry ${entry.surface} has no reopening trigger.`);
    for (const field of ['packagedReachable', 'testReachable', 'qualificationHelperReachable', 'currentAuthorityReachable']) invariant(typeof entry[field] === 'boolean', `Reachability entry ${entry.surface} has invalid ${field}.`);
    invariant(entry.state !== 'REMOVABLE' || (!entry.packagedReachable && !entry.testReachable && !entry.qualificationHelperReachable && !entry.currentAuthorityReachable), `REMOVABLE surface ${entry.surface} remains reachable.`);
  }
}

try {
  verifyCoverageManifest(readJson('docs/testing/foundation_supported_core_coverage.json'));
  verifyInventory(readJson('docs/audits/foundation_reachability_inventory.json'));
  process.stdout.write('FOUNDATION_INVENTORY_POLICY_PASS\n');
} catch (error) {
  process.stderr.write(`[foundation-inventory] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
