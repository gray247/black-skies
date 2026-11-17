import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error The installed qualification verifier is plain Node.js.
import { validateProgram3CombinedReceipt } from '../../../scripts/verify-program3-combined-performance.mjs';
// @ts-expect-error The installed smoke witness is plain Node.js.
import {
  assertOfflineSpellingContext,
  createColdLaunchMeasurement,
  installedQualificationProfiles,
} from '../../scripts/stage19-installed-smoke.mjs';

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const protocol = JSON.parse(
  readFileSync(resolve(repoRoot, 'docs/testing/program3_surface_performance_protocol.json'), 'utf8'),
);

function receipt(): any {
  return {
    installedLifecycle: {
      status: 'passed',
      forbiddenRuntimeProcessCount: 0,
      zeroSurvivorProcessCount: 0,
      performance: {
        coldLaunchProtocol: 'program3-writing-first-installed-median-v1',
        coldLaunchProbeSchema: 'black-skies.stage19.internal-startup-probe.v1',
        coldLaunchStatistic: 'median',
        coldLaunchDurationMs: 420,
        coldLaunchSamplesMs: [400, 410, 420, 430, 440],
        coldLaunchSampleCanonicalWindowCounts: [1, 1, 1, 1, 1],
        coldLaunchSampleCanonicalVisibleWindowCounts: [1, 1, 1, 1, 1],
        coldLaunchSampleCanonicalSandboxedWindowCounts: [1, 1, 1, 1, 1],
        currentWindowTransitionSamplesMs: [40, 41, 42, 43, 44],
        optionalSecondaryTransitionSamplesMs: [50, 51, 52, 53, 54],
        optionalSecondaryWindowCounts: [2, 2, 2, 2, 2],
        optionalSecondarySandboxedWindowCounts: [2, 2, 2, 2, 2],
        steadyStateWorkingSetBytes: 512_000_000,
      },
    },
  };
}

describe('Program 3/4 installed qualification', () => {
  it('requires disposable Windows isolation, an external data root and an identified pre-install firewall for spelling', () => {
    const options = { platform: 'win32', environment: { GITHUB_ACTIONS: 'true', RUNNER_OS: 'Windows', RUNNER_TEMP: 'C:/runner-temp',
      BLACKSKIES_STABILITY_FIREWALL_RULE: 'BlackSkies-19.19-' + 'a'.repeat(32), BLACKSKIES_STABILITY_FIREWALL_ACTIVATED_AT: '2026-11-17T04:00:00.000Z' },
      executablePath: 'C:/runner-temp/install/Black Skies.exe', root: 'C:/runner-temp/external/spelling', checkout: 'C:/checkout' };
    expect(() => assertOfflineSpellingContext(options)).not.toThrow();
    expect(() => assertOfflineSpellingContext({ ...options, platform: 'linux' })).toThrow(/disposable Windows/);
    expect(() => assertOfflineSpellingContext({ ...options, environment: { ...options.environment, GITHUB_ACTIONS: 'false' } })).toThrow(/disposable Windows/);
    expect(() => assertOfflineSpellingContext({ ...options, root: 'C:/checkout/profiles' })).toThrow();
    expect(() => assertOfflineSpellingContext({ ...options, executablePath: 'C:/Program Files/Black Skies.exe' })).toThrow();
    expect(() => assertOfflineSpellingContext({ ...options, environment: { ...options.environment, BLACKSKIES_STABILITY_FIREWALL_RULE: '' } })).toThrow(/firewall/);
  });

  it('activates the outbound block before any installer launch can auto-start the app', () => {
    const lifecycle = readFileSync(resolve(repoRoot, 'scripts/stage19-installed-lifecycle.ps1'), 'utf8');
    expect(lifecycle.indexOf('New-NetFirewallRule')).toBeGreaterThan(0);
    expect(lifecycle.indexOf('New-NetFirewallRule')).toBeLessThan(lifecycle.indexOf('$installerProcess = Start-Process'));
    expect(lifecycle).toContain('--stability-spelling-only');
  });

  it('keeps current and historical topology contracts distinct', () => {
    expect(installedQualificationProfiles['current-program3-program4']).toMatchObject({
      initialVisibleWindowCount: 1,
      postOptionalSecondaryVisibleWindowCount: 2,
      writingGlobalNames: ['aiCritique', 'critiqueReview', 'feedbackNotes', 'livingOutline', 'projectSpine', 'splitCommand', 'manuscriptStructure', 'storyIntelligence'],
      commandGlobalNames: ['critiqueReview', 'feedbackNotes', 'projectSpine', 'splitCommand', 'storyIntelligence'],
    });
    expect(installedQualificationProfiles['historical-v1-reference']).toMatchObject({
      initialVisibleWindowCount: 2,
      postOptionalSecondaryVisibleWindowCount: 2,
    });
  });

  it('accepts five exact Writing-first samples without a historical paired reference', () => {
    expect(validateProgram3CombinedReceipt(receipt(), protocol)).toEqual([]);
  });

  it('rejects an old two-window startup measurement or a paired V1 comparison', () => {
    const oldTopology = receipt();
    oldTopology.installedLifecycle.performance.coldLaunchSampleCanonicalWindowCounts[0] = 2;
    expect(validateProgram3CombinedReceipt(oldTopology, protocol)).toEqual(
      expect.arrayContaining([expect.stringContaining('one canonical Writing window')]),
    );
    const pairedReference = receipt();
    pairedReference.installedLifecycle.performance.pairedReference = { sourceCandidate: 'historical' };
    expect(validateProgram3CombinedReceipt(pairedReference, protocol)).toEqual(
      expect.arrayContaining([expect.stringContaining('paired historical reference')]),
    );
  });

  it('records one-window topology before cleaning up the launched application', () => {
    const measurement = createColdLaunchMeasurement({
      durationMs: 420,
      harnessReadyAtMs: 515,
      probe: { schema: 'black-skies.stage19.internal-startup-probe.v1', writingVisibleMs: 420 },
      truth: {
        isPackaged: true,
        version: '1.0.0-rc1',
        windows: [
          { visible: true, sandbox: true },
          { visible: true, sandbox: true },
        ],
      },
      canonicalReadiness: [{ visible: true, sandbox: true }],
      currentWindowTransitionMs: 90,
      optionalSecondaryTransitionMs: 180,
      forbiddenRuntimeProcessCount: 0,
    });

    expect(measurement).toMatchObject({
      canonicalWindowCount: 1,
      canonicalVisibleWindowCount: 1,
      canonicalSandboxedWindowCount: 1,
      postOptionalWindowCount: 2,
      postOptionalVisibleWindowCount: 2,
      postOptionalSandboxedWindowCount: 2,
      currentWindowTransitionMs: 90,
      optionalSecondaryTransitionMs: 180,
    });
  });
});
