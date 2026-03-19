import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './_electron.fixture';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');
const sourceProjectRoot = path.join(repoRoot, 'sample_project', 'Esther_Estate');
// Test-only temp fixture: this spec copies only the minimum on-disk project shape
// needed for deterministic editorial-review coverage. It exercises the real loader
// path, but temp-project loading itself is not a product feature.
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bs-editorial-review-e2e-'));
const tempProjectRoot = path.join(fixtureRoot, 'Esther_Estate');

const outline = JSON.parse(
  fs.readFileSync(path.join(sourceProjectRoot, 'outline.json'), 'utf8'),
) as { scenes: Array<{ id: string }> };
const primarySceneId = outline.scenes[0]?.id ?? 'sc_0001';

function writeEditorialFixture(
  projectRoot: string,
  manualReviewMarked = false,
  acceptedCurrentText = false,
): void {
  const longFormDir = path.join(projectRoot, '.blackskies', 'long_form');
  const chunksDir = path.join(longFormDir, 'chunks');
  fs.mkdirSync(chunksDir, { recursive: true });
  fs.writeFileSync(
    path.join(chunksDir, 'lf_editorial_review_playwright.json'),
    JSON.stringify(
      {
        chunk_id: 'lf_editorial_review_playwright',
        scene_ids: [primarySceneId],
        order: 1000,
        review_snapshot: {
          status: 'flagged',
          failure_class: 'patch_specificity_unresolved',
          summary: 'Local line still needs a concrete observed detail.',
          why_flagged: ['The rescue stayed vague on the kitchen line.'],
          targeted_lines: ['She felt the room soften around her.'],
          review_actions: [
            'accept_current_text',
            'regenerate_local_repair',
            'mark_for_manual_rewrite',
            'show_flag_reason',
          ],
        },
        carryover_snapshot: {
          carryover_risk: 'medium',
          carryover_mode: 'restricted',
          carryover_allowed: true,
          failure_class: 'patch_specificity_unresolved',
        },
      },
      null,
      2,
    ),
    'utf8',
  );
  fs.writeFileSync(
    path.join(longFormDir, 'manual_review.json'),
    JSON.stringify(manualReviewMarked ? { [primarySceneId]: true } : {}, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(longFormDir, 'accepted_review.json'),
    JSON.stringify(acceptedCurrentText ? { [primarySceneId]: true } : {}, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(longFormDir, 'review_action_state.json'),
    JSON.stringify({}, null, 2),
    'utf8',
  );
}

async function bootstrapEditorialProject(
  page: Parameters<typeof test>[0]['page'],
  projectPath: string,
): Promise<void> {
  await page.waitForFunction(
    () => (window as typeof window & { __APP_READY__?: boolean }).__APP_READY__ === true,
    null,
    { timeout: 30_000 },
  );
  await page.getByTestId('app-root').waitFor({ timeout: 30_000 });

  await page.evaluate(() => {
    const overlay = document.querySelector('[data-testid="companion-overlay"]') as HTMLElement | null;
    if (overlay) {
      overlay.style.display = 'none';
    }
  });

  await page.evaluate(async (targetPath) => {
    await window.__dev?.setProjectDir?.(targetPath);
    window.__dev?.overrideServices?.({
      async checkHealth() {
        return {
          ok: true,
          data: { status: 'online' },
          traceId: 'pw-editorial-health',
        };
      },
    });
    window.dispatchEvent(
      new CustomEvent('test:service-health', {
        detail: { status: 'online' },
      }),
    );
  }, projectPath);

  const openProject = page.getByTestId('open-project');
  if (await openProject.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await page
      .waitForFunction(
        () => {
          const button = document.querySelector('[data-testid="open-project"]') as
            | HTMLButtonElement
            | null;
          return button !== null && !button.disabled;
        },
        null,
        { timeout: 10_000 },
      )
      .catch(() => undefined);
    if (await openProject.isEnabled().catch(() => false)) {
      await openProject.click();
    }
  }

  await page.waitForFunction(
    () =>
      (document.querySelector('[data-testid="service-status-pill"]') as HTMLElement | null)
        ?.getAttribute('data-status') === 'online',
    null,
    { timeout: 30_000 },
  );
  await page.getByTestId('dock-workspace').waitFor({ timeout: 30_000 });
}

test.beforeAll(async () => {
  fs.cpSync(sourceProjectRoot, tempProjectRoot, { recursive: true });
  writeEditorialFixture(tempProjectRoot, false);
});

test.afterAll(async () => {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

test.describe('editorial review workflow', () => {
  test('reveals and hides persisted editorial flag reasons for flagged scenes', async ({ page }) => {
    writeEditorialFixture(tempProjectRoot, false);
    await bootstrapEditorialProject(page, tempProjectRoot);

    const sceneReviewBadge = page.locator('.project-home__scene-review-badge').first();
    await expect(page.getByRole('heading', { name: /Editorial review/i })).toBeVisible();
    await expect(sceneReviewBadge).toContainText('Flagged');
    await expect(sceneReviewBadge).toContainText('restricted');
    await expect(page.getByText(/patch_specificity_unresolved/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Show Flag Reason/i })).toBeVisible();
    await expect(page.getByText(/She felt the room soften around her\./i)).toHaveCount(0);

    await page.getByRole('button', { name: /Show Flag Reason/i }).click();

    await expect(page.getByText(/Local line still needs a concrete observed detail\./i)).toBeVisible();
    await expect(page.getByText(/The rescue stayed vague on the kitchen line\./i)).toBeVisible();
    await expect(page.getByText(/She felt the room soften around her\./i)).toBeVisible();
    const carryoverDetails = page.locator('.project-home__editorial-carryover');
    await expect(carryoverDetails).toContainText('medium');
    await expect(carryoverDetails).toContainText('restricted');
    await expect(page.getByRole('button', { name: /Hide Flag Reason/i })).toBeVisible();

    await page.getByRole('button', { name: /Hide Flag Reason/i }).click();
    await expect(page.getByText(/She felt the room soften around her\./i)).toHaveCount(0);
  });

  test('persists manual rewrite marks across reload and allows clearing them', async ({ page }) => {
    writeEditorialFixture(tempProjectRoot, false);
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(page.getByRole('heading', { name: /Editorial review/i })).toBeVisible();
    await page.getByRole('button', { name: /Mark For Manual Rewrite/i }).click();
    await expect(
      page.getByText(/This scene has been explicitly marked for manual rewrite\./i),
    ).toBeVisible();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Manual review');

    await page.reload();
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(
      page.getByText(/This scene has been explicitly marked for manual rewrite\./i),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Clear Manual Review Mark/i })).toBeVisible();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Manual review');

    await page.getByRole('button', { name: /Clear Manual Review Mark/i }).click();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Flagged');

    await page.reload();
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(
      page.getByText(/This scene has been explicitly marked for manual rewrite\./i),
    ).toHaveCount(0);
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Flagged');
  });

  test('persists accepted current text and shows safe carryover on reload', async ({ page }) => {
    writeEditorialFixture(tempProjectRoot, false, false);
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(page.getByRole('heading', { name: /Editorial review/i })).toBeVisible();
    await page.getByRole('button', { name: /Accept Current Text/i }).click();
    await expect(page.getByText(/Writer accepted the current text\./i)).toBeVisible();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Accepted');
    await expect(page.getByText(/safe · allowed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Accept Current Text/i })).toHaveCount(0);

    await page.reload();
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(page.getByText(/Writer accepted the current text\./i)).toBeVisible();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Accepted');
    await expect(page.getByText(/patch_specificity_unresolved/i)).toBeVisible();
    await expect(page.getByText(/safe · allowed/i)).toBeVisible();
  });

  test('persists regenerate local repair state and shows updated carryover on reload', async ({ page }) => {
    writeEditorialFixture(tempProjectRoot, false, false);
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(page.getByRole('heading', { name: /Editorial review/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retry Local Repair/i })).toBeVisible();

    await page.getByRole('button', { name: /Retry Local Repair/i }).click();

    await expect(page.getByText(/Retry Local Repair succeeded\./i)).toBeVisible();
    await expect(page.getByText(/succeeded · carryover updated/i)).toBeVisible();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Retry succeeded');
    await expect(page.getByText(/safe · allowed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Retry Local Repair/i })).toHaveCount(0);

    await page.getByRole('button', { name: /Show Flag Reason/i }).click();
    await expect(page.getByText(/patch_specificity_unresolved/i)).toBeVisible();
    await expect(page.getByText(/The rescue stayed vague on the kitchen line\./i)).toBeVisible();

    await page.reload();
    await bootstrapEditorialProject(page, tempProjectRoot);

    await expect(page.getByText(/Retry Local Repair succeeded\./i)).toBeVisible();
    await expect(page.getByText(/succeeded · carryover updated/i)).toBeVisible();
    await expect(page.locator('.project-home__scene-review-badge').first()).toContainText('Retry succeeded');
    await expect(page.getByText(/safe · allowed/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Retry Local Repair/i })).toHaveCount(0);

    await page.getByRole('button', { name: /Show Flag Reason/i }).click();
    await expect(page.getByText(/patch_specificity_unresolved/i)).toBeVisible();
    await expect(page.getByText(/The rescue stayed vague on the kitchen line\./i)).toBeVisible();
  });
});
