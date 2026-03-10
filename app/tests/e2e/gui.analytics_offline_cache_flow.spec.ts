import { test, expect } from './_electron.fixture';
import { loadSampleProject } from './utils/sampleProject';

const { loadedProject } = loadSampleProject();
const sampleProjectPath = loadedProject.path;

test('analytics offline cache flow keeps cached metrics visible', async ({ page }) => {
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate((projectPath) => {
    (window as typeof window & { __dev?: { setProjectDir?: (dir: string) => void } }).__dev?.setProjectDir?.(
      projectPath ?? null,
    );
  }, sampleProjectPath);

  const openProjectButton = page.getByTestId('open-project');
  await expect(openProjectButton).toBeVisible({ timeout: 30_000 });
  await openProjectButton.click();
  await expect(page.getByTestId('dock-workspace')).toBeVisible({ timeout: 30_000 });

  const companionToggle = page.getByTestId('workspace-action-companion');
  await expect(companionToggle).toBeVisible({ timeout: 30_000 });
  await companionToggle.click();
  await expect(page.getByTestId('insights-toolbar')).toBeVisible({ timeout: 30_000 });

  await page.locator('.analytics-dashboard__readability-badge').first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByText(/Dialogue ratio/).waitFor({ timeout: 30_000 });
  await page.locator('.analytics-dashboard__pacing-strip span').first().waitFor({ state: 'visible', timeout: 30_000 });
  await expect(page.getByTestId('analytics-emotion-graph')).toBeVisible();

  await page.evaluate(() => {
    window.__dev?.overrideServices?.({
      async checkHealth() {
        throw new Error('offline');
      },
    });
    const event = new CustomEvent('test:service-health', {
      detail: { status: 'offline' },
    });
    document.dispatchEvent(event);
    window.dispatchEvent(event);
  });

  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null)
        ?.getAttribute('data-status') === 'offline',
    null,
    { timeout: 30_000 },
  );

  const offlineBanner = page.getByTestId('analytics-offline-banner').first();
  await expect(offlineBanner).toBeVisible({ timeout: 30_000 });

  await expect(page.locator('.analytics-dashboard__readability-badge').first()).toBeVisible();
  await expect(page.locator('.analytics-dashboard__pacing-strip span').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Corkboard' }).first()).toBeVisible();
  await expect(page.locator('.corkboard-card').first()).toBeVisible();

  await page.evaluate(() => {
    window.__dev?.overrideServices?.({
      async checkHealth() {
        return {
          ok: true,
          data: { status: 'online' },
        };
      },
    });
    const event = new CustomEvent('test:service-health', {
      detail: { status: 'online' },
    });
    document.dispatchEvent(event);
    window.dispatchEvent(event);
  });

  await expect(page.getByTestId('analytics-emotion-graph')).toBeVisible();
});
