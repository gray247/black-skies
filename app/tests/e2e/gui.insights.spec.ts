import { test, expect } from './_electron.fixture';
import { loadSampleProject } from './utils/sampleProject';
import { TID } from '../../renderer/utils/testIds';

const { loadedProject } = loadSampleProject();
const sampleProjectPath = loadedProject.path;

test('queues model insights offline and resumes when online', async ({ page }) => {
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate((projectPath) => {
    window.__dev?.setProjectDir?.(projectPath ?? null);
  }, sampleProjectPath);

  const openProjectButton = page.getByRole('button', { name: /open project/i });
  await expect(openProjectButton).toBeVisible({ timeout: 30_000 });
  await openProjectButton.click();

  await expect(page.getByTestId(TID.dockWorkspace)).toBeVisible({ timeout: 30_000 });
  const companionToggle = page.getByTestId('workspace-action-companion');
  await expect(companionToggle).toBeVisible({ timeout: 30_000 });
  await companionToggle.click();
  await expect(page.getByTestId('insights-toolbar')).toBeVisible({ timeout: 30_000 });

  await page.waitForFunction(
    () =>
      Boolean(
        (window as typeof window & {
          __testInsights?: { setServiceStatus?: unknown };
        }).__testInsights?.setServiceStatus,
      ),
  );

  await page.evaluate(() => {
    (window as any).__testInsights.selectScene('sc_0001');
    (window as any).__testInsights.setServiceStatus('offline');
  });

  const runAllInsights = page.getByRole('button', { name: /run all insights/i });
  await expect(runAllInsights).toBeEnabled({ timeout: 30_000 });
  await runAllInsights.click();

  await expect(page.getByTestId('insights-local-ran')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('insights-model-queued')).toBeVisible({ timeout: 30_000 });

  await page.evaluate(() => (window as any).__testInsights.setServiceStatus('online'));

  await expect(page.getByTestId('insights-model-resumed')).toBeVisible({ timeout: 30_000 });
});
