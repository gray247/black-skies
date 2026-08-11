import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from './_electron.fixture';

const protocol = JSON.parse(readFileSync(
  resolve(import.meta.dirname, '..', '..', '..', 'docs', 'testing', 'program3_surface_performance_protocol.json'),
  'utf8',
)) as {
  topologyVersion: string;
  developmentHarness: {
    startupProbeSchema: string;
    maximumInitialSurfaceReadyMs: number;
    maximumSteadyStateWorkingSetBytes: number;
    maximumSurfaceTransitionMs: number;
  };
  physicalPlacementPolicy: {
    allowedVisibleWindowCounts: number[];
    writingMutationOwnerCount: number;
  };
};

test.use({ splitCommandRuntimeConfig: true });

test('Program 3 logical surfaces satisfy the versioned development topology protocol', async ({
  electronApp,
  page,
}) => {
  await expect(page.locator('[data-stage19-role="writing"]')).toBeVisible();

  const initial = await electronApp.evaluate(({ app, BrowserWindow }) => {
    const probe = (globalThis as typeof globalThis & {
      [key: symbol]: {
        schema: string;
        writingVisibleMs: number | null;
        commandVisibleMs: number | null;
        twoWindowVisibleMs: number | null;
      } | undefined;
    })[Symbol.for('blackskies.stage19.internal.startupProbe')];
    return {
      probe,
      visibleWindowCount: BrowserWindow.getAllWindows().filter((window) => window.isVisible()).length,
      workingSetBytes: app.getAppMetrics().reduce(
        (total, metric) => total + metric.memory.workingSetSize * 1024,
        0,
      ),
    };
  });

  expect(protocol.topologyVersion).toBe('program3-logical-surfaces-v1');
  expect(initial.probe?.schema).toBe(protocol.developmentHarness.startupProbeSchema);
  expect(initial.probe?.writingVisibleMs).not.toBeNull();
  expect(initial.probe?.writingVisibleMs ?? Number.POSITIVE_INFINITY)
    .toBeLessThan(protocol.developmentHarness.maximumInitialSurfaceReadyMs);
  expect(protocol.physicalPlacementPolicy.allowedVisibleWindowCounts)
    .toContain(initial.visibleWindowCount);
  expect(initial.workingSetBytes)
    .toBeLessThan(protocol.developmentHarness.maximumSteadyStateWorkingSetBytes);
  expect(await page.locator('[data-stage19-role="writing"]').count())
    .toBe(protocol.physicalPlacementPolicy.writingMutationOwnerCount);

  const currentWindowStartedAt = Date.now();
  await page.getByRole('button', { name: 'Open Command Center here' }).click();
  await expect(page.locator('[data-stage19-role="command"]')).toBeVisible();
  await expect.poll(() => electronApp.windows().length, { timeout: 30_000 }).toBe(1);
  const currentWindowTransitionMs = Date.now() - currentWindowStartedAt;
  expect(currentWindowTransitionMs)
    .toBeLessThan(protocol.developmentHarness.maximumSurfaceTransitionMs);
  await expect(page.getByRole('navigation', { name: 'Command Center workspaces' }))
    .toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Command Center workspaces' }).getByRole('button'))
    .toHaveCount(6);
  await expect(page.locator('[data-stage19-role="writing"]')).toHaveCount(0);

  await page.locator('.stage19-spine__surface-actions')
    .getByRole('button', { name: 'Return to Writing Studio' })
    .click();
  await expect(page.locator('[data-stage19-role="writing"]')).toBeVisible();

  const secondaryStartedAt = Date.now();
  await page.getByRole('button', { name: 'Open Command Center in second window' }).click();
  await expect.poll(() => electronApp.windows().length, { timeout: 30_000 }).toBe(2);
  const secondary = electronApp.windows().find((candidate) => candidate !== page);
  if (!secondary) throw new Error('Program 3 optional secondary Command window did not open.');
  await expect(secondary.locator('[data-stage19-role="command"]')).toBeVisible();
  const secondaryTransitionMs = Date.now() - secondaryStartedAt;
  expect(secondaryTransitionMs)
    .toBeLessThan(protocol.developmentHarness.maximumSurfaceTransitionMs);
  await expect(page.locator('[data-stage19-role="writing"]')).toBeVisible();
  expect(await page.locator('[data-stage19-role="writing"]').count())
    .toBe(protocol.physicalPlacementPolicy.writingMutationOwnerCount);

  console.log('[program3-surface-performance]', {
    startupWritingVisibleMs: initial.probe?.writingVisibleMs,
    startupCommandVisibleMs: initial.probe?.commandVisibleMs,
    initialVisibleWindowCount: initial.visibleWindowCount,
    steadyWorkingSetBytes: initial.workingSetBytes,
    currentWindowTransitionMs,
    secondaryTransitionMs,
  });
});

// HARNESS_ONLY
// Reason: Measures the accepted Program 3 logical-surface topology before the combined installed candidate.
// Owner: Program 3 P3-G automated qualification.
// Retire when: The Program 3 plus Program 4 installed protocol supplies equivalent exact-candidate evidence.
