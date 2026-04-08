import { test, expect } from './_electron.fixture';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('rejects invalid project root and surfaces an error state', async ({ page }) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blackskies-invalid-project-'));
  try {
    const draftsDir = path.join(tempRoot, 'drafts');
    fs.mkdirSync(draftsDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempRoot, 'outline.json'),
      JSON.stringify(
        {
          schema_version: 'OutlineSchema v1',
          outline_id: 'outline_invalid_project',
          acts: [],
          chapters: [],
          scenes: [{ id: 'sc_0001', order: 1, title: 'Invalid Scene' }],
        },
        null,
        2,
      ),
      'utf-8',
    );
    fs.writeFileSync(
      path.join(draftsDir, 'sc_0001.md'),
      ['---', 'id: sc_0001', 'title: Invalid Scene', 'order: 1', '---', '', 'Body.'].join('\n'),
      'utf-8',
    );
    // Intentionally omit project.json to exercise the canonical identity contract.

    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => Boolean((window as any).__dev?.setProjectDir), null, {
      timeout: 30_000,
    });

    await page.evaluate(async (projectPath) => {
      await window.__dev?.setProjectDir?.(projectPath ?? null);
    }, tempRoot);

    const loadResult = await page.evaluate(async (projectPath) => {
      const loader = (window as typeof window & { projectLoader?: any }).projectLoader;
      if (!loader?.loadProject) {
        return { ok: false, code: 'NO_LOADER' };
      }
      const response = await loader.loadProject({ path: projectPath });
      return {
        ok: Boolean(response?.ok),
        code: response?.ok ? null : (response?.error?.code ?? null),
      };
    }, tempRoot);
    expect(loadResult.ok).toBe(false);
    expect(loadResult.code).toBe('PROJECT_METADATA_INVALID');

    const openProjectButton = page.getByRole('button', { name: /open project/i });
    await expect(openProjectButton).toBeVisible({ timeout: 30_000 });
    await openProjectButton.click();

    await expect(page.getByText('Could not open project')).toBeVisible({ timeout: 30_000 });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
