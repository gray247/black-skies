import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function median(values) {
  invariant(values.length % 2 === 1, "Cold-launch median requires an odd sample count.");
  return [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)];
}

function arrayOf(value, length, predicate) {
  return Array.isArray(value) && value.length === length && value.every(predicate);
}

export function validateProgram3CombinedReceipt(receipt, protocol) {
  const errors = [];
  const fail = (message) => errors.push(message);
  const performance = receipt?.installedLifecycle?.performance;
  const harness = protocol?.developmentHarness;
  const candidate = protocol?.exactCombinedCandidate;
  const expectedSamples = candidate?.requiredColdLaunchSampleCount;

  if (protocol?.schema !== "black-skies.program3-surface-performance-protocol.v1") {
    fail("Program 3 performance protocol schema is invalid.");
    return errors;
  }
  if (candidate?.status !== "active") fail("Program 3/4 installed candidate is not active.");
  if (candidate?.baseline !== null) fail("Program 3/4 installed candidate must not reuse a historical V1 baseline.");
  if (receipt?.installedLifecycle?.status !== "passed") fail("Installed lifecycle is not passing.");
  if (receipt?.installedLifecycle?.forbiddenRuntimeProcessCount !== 0) fail("Installed lifecycle found forbidden runtime processes.");
  if (receipt?.installedLifecycle?.zeroSurvivorProcessCount !== 0) fail("Installed lifecycle left owned processes after teardown.");
  if (performance?.coldLaunchProtocol !== "program3-writing-first-installed-median-v1") fail("Installed receipt used the wrong Writing-first measurement protocol.");
  if (performance?.pairedReference !== undefined) fail("Installed receipt incorrectly compared the Writing-first candidate to a paired historical reference.");
  if (performance?.coldLaunchProbeSchema !== harness?.startupProbeSchema) fail("Installed receipt startup probe schema differed.");
  if (performance?.coldLaunchStatistic !== "median") fail("Installed receipt did not use the governed median statistic.");
  const validColdLaunchSamples = arrayOf(performance?.coldLaunchSamplesMs, expectedSamples, Number.isFinite);
  if (!validColdLaunchSamples) fail("Installed receipt cold-launch samples are missing or invalid.");
  if (validColdLaunchSamples && performance?.coldLaunchDurationMs !== median(performance.coldLaunchSamplesMs)) fail("Installed receipt cold-launch metric is not the exact sample median.");
  if (!Number.isFinite(performance?.coldLaunchDurationMs) || performance.coldLaunchDurationMs > harness?.maximumInitialSurfaceReadyMs) fail("Canonical Writing startup exceeded its governed limit.");

  for (const [field, expected, label] of [
    ["coldLaunchSampleCanonicalWindowCounts", 1, "one canonical Writing window"],
    ["coldLaunchSampleCanonicalVisibleWindowCounts", 1, "one visible canonical Writing window"],
    ["coldLaunchSampleCanonicalSandboxedWindowCounts", 1, "one sandboxed canonical Writing window"],
    ["optionalSecondaryWindowCounts", 2, "two post-request windows"],
    ["optionalSecondarySandboxedWindowCounts", 2, "two sandboxed post-request windows"],
  ]) {
    if (!arrayOf(performance?.[field], expectedSamples, (value) => value === expected)) {
      fail(`Installed receipt did not prove ${label} for every governed sample.`);
    }
  }
  for (const field of ["currentWindowTransitionSamplesMs", "optionalSecondaryTransitionSamplesMs"]) {
    if (!arrayOf(performance?.[field], expectedSamples, (value) => Number.isFinite(value) && value <= harness?.maximumSurfaceTransitionMs)) {
      fail(`Installed receipt did not prove ${field} within its governed limit.`);
    }
  }
  if (!Number.isFinite(performance?.steadyStateWorkingSetBytes) || performance.steadyStateWorkingSetBytes > harness?.maximumSteadyStateWorkingSetBytes) {
    fail("Installed receipt steady-state memory exceeded its governed limit.");
  }
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const index = process.argv.indexOf("--receipt");
    invariant(index >= 0 && process.argv[index + 1], "A package receipt is required.");
    const receipt = JSON.parse(readFileSync(path.resolve(repoRoot, process.argv[index + 1]), "utf8"));
    const protocol = JSON.parse(readFileSync(path.join(repoRoot, "docs/testing/program3_surface_performance_protocol.json"), "utf8"));
    const errors = validateProgram3CombinedReceipt(receipt, protocol);
    invariant(errors.length === 0, errors.join("\n"));
    process.stdout.write("PROGRAM3_COMBINED_PERFORMANCE_PASS\n");
  } catch (error) {
    process.stderr.write(`[program3-combined-performance] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
