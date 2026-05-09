// Reference scenario only. The authoritative truth lane is `pnpm test:truth`
// via `scripts/truth-with-backend.mjs` and `scripts/launch_truth_electron.py`.
// TRUTH_LANE_REFERENCE:
// Reason: quick real-service sanity probe; not the authoritative receipt-producing lane.
// Owner: scripts/truth-with-backend.mjs
import { test, expect } from './electron.launch';

test.describe('Truth lane: real service path', () => {
  test.skip(
    process.env.BLACKSKIES_E2E_EXTERNAL_SERVICE !== '1',
    'Real-service reference spec runs only when BLACKSKIES_E2E_EXTERNAL_SERVICE=1.',
  );

  test('boots the renderer, loads the sample project, and reaches the real backend', async ({
    page,
  }) => {
    await page.waitForLoadState('domcontentloaded');

    const statusPill = page.getByTestId('service-status-pill');
    await expect(statusPill).toBeVisible({ timeout: 30_000 });
    await expect(statusPill).toHaveAttribute('data-status', 'online', { timeout: 30_000 });

    const bridgeHealth = await page.evaluate(async () => {
      const result = await window.services?.checkHealth();
      return {
        ok: Boolean(result?.ok),
        status: result?.data?.status ?? null,
      };
    });

    expect(bridgeHealth.ok).toBe(true);
    expect(bridgeHealth.status).toBe('online');

    await expect(page.getByTestId('dock-workspace')).toBeVisible({ timeout: 30_000 });

    const generateButton = page.getByTestId('workspace-action-generate');
    await expect(generateButton).toBeVisible({ timeout: 30_000 });
    await generateButton.click();

    await expect(page.getByRole('dialog', { name: /Draft preflight/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
