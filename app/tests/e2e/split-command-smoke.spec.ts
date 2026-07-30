import { test, expect } from './_electron.fixture';
import { getStage19Windows } from './stage19-electron-support';

// HARNESS_ONLY:
// Reason: exercises the dedicated two-window activation seam under controlled runtime config.
// Owner: Package 19.22 internal baseline verification.
// Retire when: installed-build qualification provides equivalent deterministic activation coverage.

test.use({ splitCommandRuntimeConfig: true });

test.describe('Split Command smoke', () => {
  test('launches the dedicated Writing Studio and Command Center from runtime config', async ({
    page,
    electronApp,
  }) => {
    const { writing, command } = await getStage19Windows(electronApp, page);

    await expect(writing.getByRole('region', { name: 'Writing Studio' })).toBeVisible();
    await expect(command.getByRole('region', { name: 'Command Center' })).toBeVisible();
    await expect(writing.locator('[data-testid="dock-workspace"]')).toHaveCount(0);
    await expect(command.locator('[data-testid="dock-workspace"]')).toHaveCount(0);
    expect(electronApp.windows().length).toBe(2);
  });
});
