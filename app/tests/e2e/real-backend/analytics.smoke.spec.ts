import { test, expect } from '../_electron.realBackend.fixture';
import { TID } from '../../../renderer/utils/testIds';

test('loads Story Insights analytics from the real backend', async ({ page, backend }) => {
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(async (projectPath) => {
    await window.__dev?.setProjectDir?.(projectPath ?? null);
  }, backend.projectRoot);

  const openProjectButton = page.getByRole('button', { name: /open project/i });
  await expect(openProjectButton).toBeVisible({ timeout: 30_000 });
  await openProjectButton.click();

  await page.waitForFunction(
    () => (window as typeof window & { __appState?: { projectReady?: boolean } }).__appState?.projectReady === true,
    null,
    { timeout: 30_000 },
  );

  await expect(page.getByTestId(TID.dockWorkspace)).toBeVisible({ timeout: 30_000 });

  // Story Insights is part of the default dock layout; wait for real analytics data to render.
  await expect(page.getByTestId('analytics-emotion-graph')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('analytics-pacing-strip')).toBeVisible({ timeout: 30_000 });

  // Prove the renderer hit the real backend (no stub server) by asserting on Uvicorn access logs.
  await expect
    .poll(
      () =>
        backend.accessLog
          .filter((entry) => entry.status === 200)
          .map((entry) => entry.target.split('?', 1)[0]),
      { timeout: 30_000 },
    )
    .toEqual(expect.arrayContaining(['/api/v1/analytics/summary', '/api/v1/analytics/scenes']));
});
