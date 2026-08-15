import { test, expect } from './_electron.fixture';
import {
  readStage19SurfaceHostPreflight,
  type Stage19SurfaceHostPreflightSnapshot,
} from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

test('Stage 19 startup surface-host preflight completes the authority chain', async ({
  electronApp,
  page,
}, testInfo) => {
  await expect(page.locator('[data-stage19-role="writing"]')).toBeVisible();

  let lastSnapshot: Stage19SurfaceHostPreflightSnapshot | null = null;
  try {
    await expect
      .poll(
        async () => {
          lastSnapshot = await readStage19SurfaceHostPreflight(page);
          return lastSnapshot;
        },
        { timeout: 8_000, intervals: [100, 250, 500, 1_000] },
      )
      .toMatchObject({
        bridgePresent: true,
        bridgeRole: 'primary',
        requestOutcome: 'ok',
        statePresent: true,
        stateSummary: {
          schemaVersion: 1,
          primarySurface: 'writing',
          commandRole: 'command',
        },
      });
  } finally {
    if (lastSnapshot) {
      await testInfo.attach('stage19-surface-host-preflight.json', {
        body: Buffer.from(`${JSON.stringify(lastSnapshot, null, 2)}\n`, 'utf8'),
        contentType: 'application/json',
      });
    }
  }

  await expect(page.getByRole('button', { name: 'Open Command Center here' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Command Center in second window' })).toBeVisible();

  await page.getByRole('button', { name: 'Open Command Center here' }).click();
  await expect(page.getByRole('region', { name: 'Command Center' })).toBeVisible();
  await expect(page.locator('[data-stage19-logical-surface="command"]')).toBeVisible();

  await page
    .locator('.stage19-spine__surface-actions')
    .getByRole('button', { name: 'Return to Writing Studio' })
    .click();
  await expect(page.getByRole('button', { name: 'Open Command Center in second window' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Command Center in second window' }).click();
  let commandWindow: typeof page | null = null;
  await expect
    .poll(
      async () => {
        const candidates = await Promise.all(
          electronApp.windows().map(async (candidate) => ({
            candidate,
            role: await candidate.evaluate(() => window.splitCommand?.windowRole ?? null),
            command: await candidate.locator('[data-stage19-role="command"]').count(),
          })),
        );
        commandWindow =
          candidates.find(
            (candidate) =>
              candidate.candidate !== page &&
              candidate.role === 'secondary' &&
              candidate.command > 0,
          )?.candidate ?? null;
        return Boolean(commandWindow);
      },
      { timeout: 8_000, intervals: [100, 250, 500, 1_000] },
    )
    .toBe(true);

  if (!commandWindow) {
    throw new Error('[SURFACE_HOST_PREFLIGHT_FAILED] secondary Command Center window was not identified.');
  }
  await expect(commandWindow.getByRole('region', { name: 'Command Center' })).toBeVisible();
});
