import type { Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function bootstrapHarness(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true, null, {
    timeout: 30_000,
  });
  await page.getByTestId('app-root').waitFor({ timeout: 30_000 });

  await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="companion-overlay"]') as HTMLElement | null;
    if (overlay) {
      overlay.style.display = 'none';
    }
  });

  const sampleProjectPath = path.resolve(__dirname, '../../../sample_project/Esther_Estate');
  await page.evaluate((projectPath) => {
    (window as any).__dev?.setProjectDir?.(projectPath ?? null);
  }, sampleProjectPath);

  const openProject = page.getByTestId('open-project');
  if (await openProject.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await openProject.click();
  }

  await page.getByTestId('dock-workspace').waitFor({ timeout: 30_000 });
}
