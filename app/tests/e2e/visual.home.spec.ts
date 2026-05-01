import { test, expect } from './_electron.fixture';
import { TID } from '../../renderer/utils/testIds';

// HARNESS_ONLY:
// Reason: visual baseline snapshot in packaged harness mode.
// Owner: app/tests/e2e/visual.home.spec.ts
// Retire when: visual baseline strategy is replaced or consolidated.
// Intentional gate: this lane is opt-in via VISUAL_STRICT=1 because the
// whole-page snapshot is cross-platform nondeterministic under the current design.
// Run manually with:
// VISUAL_STRICT=1 pnpm --filter app exec playwright test tests/e2e/visual.home.spec.ts --project=electron --workers=1

test.describe('Visual snapshots', () => {
  test.skip(process.env.VISUAL_STRICT !== '1', 'Visual snapshots are opt-in via VISUAL_STRICT=1');

  test('home screen', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(
      () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
      null,
      { timeout: 30_000 },
    );
    await page.getByTestId('app-root').waitFor({ timeout: 30_000 });
    await page.evaluate(() => {
      const overlay = document.querySelector(
        '[data-testid="companion-overlay"]',
      ) as HTMLElement | null;
      if (overlay) {
        overlay.style.display = 'none';
      }
    });
    await page.getByTestId('dock-workspace').waitFor({ timeout: 30_000 });
    await page.waitForSelector('[data-testid="visual-home-ready"]', { state: 'attached' });
    const openProjectButton = page.getByTestId(TID.openProjectBtn);
    await expect(openProjectButton).toBeVisible();
    await expect(openProjectButton).toBeEnabled();
    await expect(openProjectButton).toHaveText('Open project...');
    await expect(page.locator('.app-shell__workspace-subtitle')).toHaveText('No project loaded');
    await expect(page.locator('body')).not.toHaveAttribute('data-project-loaded', '1');
    await expect(page.locator('html')).not.toHaveAttribute('data-project-loaded', '1');
    await expect(page.getByTestId('recovery-banner')).toBeHidden();
    await page.mouse.move(1, 1);
    await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (active && typeof active.blur === 'function') {
        active.blur();
      }
    });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const events = (window as typeof window & {
            __blackskiesDebugLog?: Array<{ scope?: string }>;
          }).__blackskiesDebugLog ?? [];
          return events.some((entry) => entry.scope === 'project-home.load.success');
        }),
      )
      .toBe(false);
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      maxDiffPixels: 200,
    });
  });
});
