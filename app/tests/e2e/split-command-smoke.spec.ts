import { bootstrapHarness } from './_bootstrap';
import { test, expect } from './_electron.fixture';

test.use({ splitCommandRuntimeConfig: true });

test.describe('Split Command smoke', () => {
  test('launches the hidden Split Command shell from runtime config without changing the default app path', async ({
    page,
    electronApp,
  }) => {
    await bootstrapHarness(page, {
      expectedMode: 'full',
      requireDockWorkspace: false,
      requireCorkboardPane: false,
      requireSplitCommandWorkspace: true,
    });

    await expect(page.getByTestId('split-command-workspace')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('aside[aria-label="Command Center"]')).toBeVisible();
    await expect(page.locator('section[aria-label="Writing Studio"]')).toBeVisible();
    await expect(page.getByLabel('Story Navigation')).toBeVisible();
    await expect(page.getByTestId('workspace-action-generate')).toBeEnabled();
    await expect(page.locator('[data-testid="dock-workspace"]')).toHaveCount(0);
    expect(electronApp.windows().length).toBe(1);
  });
});
