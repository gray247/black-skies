import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(import.meta.dirname, '..', '..', '..', relativePath), 'utf8')) as Record<string, unknown>;
}

describe('Program 3 logical-surface performance protocol', () => {
  it('preserves the immutable V1 baseline while defining a distinct topology protocol', () => {
    const foundation = readJson('docs/testing/foundation_performance_budget.json') as {
      schema: string;
      measurementProtocol: string;
      baseline: { sourceCandidate: string };
    };
    const program3 = readJson('docs/testing/program3_surface_performance_protocol.json') as {
      schema: string;
      topologyVersion: string;
      acceptedLogicalSurfaces: string[];
      physicalPlacementPolicy: {
        singleScreenSupported: boolean;
        optionalSecondarySupported: boolean;
        allowedVisibleWindowCounts: number[];
        writingMutationOwnerCount: number;
      };
      historicalV1Baseline: {
        immutable: boolean;
        schema: string;
        measurementProtocol: string;
        sourceCandidate: string;
      };
      developmentHarness: Record<string, number | boolean | string>;
      exactCombinedCandidate: {
        status: string;
        requiredColdLaunchSampleCount: number;
        requiredMeasurements: string[];
        baseline: null;
      };
    };

    expect(program3).toMatchObject({
      schema: 'black-skies.program3-surface-performance-protocol.v1',
      topologyVersion: 'program3-logical-surfaces-v1',
      acceptedLogicalSurfaces: ['writing', 'command'],
      physicalPlacementPolicy: {
        singleScreenSupported: true,
        optionalSecondarySupported: true,
        allowedVisibleWindowCounts: [1, 2],
        writingMutationOwnerCount: 1,
      },
    });
    expect(program3.historicalV1Baseline).toEqual({
      immutable: true,
      sourceFile: 'docs/testing/foundation_performance_budget.json',
      schema: foundation.schema,
      measurementProtocol: foundation.measurementProtocol,
      sourceCandidate: foundation.baseline.sourceCandidate,
    });
    expect(program3.developmentHarness).toMatchObject({
      startupProbeSchema: 'black-skies.stage19.internal-startup-probe.v1',
      maximumInitialSurfaceReadyMs: 5000,
      maximumSteadyStateWorkingSetBytes: 1073741824,
      maximumSurfaceTransitionMs: 2000,
      maximumHundredUnitCreateMs: 15000,
      maximumUnitSelectionMs: 3000,
      zeroSurvivorTeardownRequired: true,
    });
    expect(program3.exactCombinedCandidate).toMatchObject({
      status: 'deferred-until-program4',
      requiredColdLaunchSampleCount: 5,
      baseline: null,
    });
    expect(program3.exactCombinedCandidate.requiredMeasurements).toEqual(expect.arrayContaining([
      'coldLaunchDurationMs',
      'steadyStateWorkingSetBytes',
      'logicalSurfaceCount',
      'visibleWindowCount',
      'surfaceTransitionMs',
      'zeroSurvivorProcessCount',
    ]));
  });
});
