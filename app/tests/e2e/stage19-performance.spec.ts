import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getStage19Windows,
  removeTemporaryDirectory,
} from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

test('a 100-unit manuscript remains responsive within bounded regression ceilings', async ({
  electronApp,
  page,
}) => {
  test.slow();
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-performance-'));
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    const creationDurationMs = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Large manuscript',
        operationId: 'performance-create-project',
      });
      if (!created.ok) throw new Error(created.error.message);
      const startedAt = performance.now();
      for (let index = 1; index <= 100; index += 1) {
        const unit = await bridge.createUnit!({
          projectId: created.snapshot.project!.projectId,
          projectPath: created.snapshot.project!.path,
          generation: created.snapshot.generation,
          operationId: `performance-create-unit-${index}`,
          title: `Performance Unit ${String(index).padStart(3, '0')}`,
        });
        if (!unit.ok) throw new Error(unit.error.message);
      }
      return performance.now() - startedAt;
    }, parent);

    const binderButtons = writing
      .getByRole('complementary', { name: 'Manuscript binder and Living Outline' })
      .locator('.stage19-spine__unit-list button');
    await expect(binderButtons).toHaveCount(100);
    await expect(command.locator('dd').filter({ hasText: /^100$/ })).toBeVisible();
    expect(creationDurationMs).toBeLessThan(15_000);

    const selectionStartedAt = Date.now();
    await writing.getByRole('button', { name: /Performance Unit 100/ }).click();
    await expect(
      writing.getByRole('textbox', { name: 'Manuscript editor: Performance Unit 100' }),
    ).toBeVisible();
    const selectionDurationMs = Date.now() - selectionStartedAt;
    console.log('[stage19-performance]', { creationDurationMs, selectionDurationMs });
    expect(selectionDurationMs).toBeLessThan(3_000);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises synthetic Stage 19 Electron state before installed-build qualification.
// Owner: Package 19.22 internal baseline verification.
// Retire when: An installed-build performance truth lane provides equivalent deterministic coverage.
