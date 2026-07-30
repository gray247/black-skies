import AxeBuilder from '@axe-core/playwright';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getStage19Windows,
  removeTemporaryDirectory,
} from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

test('dedicated Stage 19 writing and command surfaces have no WCAG A/AA axe violations', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-a11y-'));
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Accessibility project',
        operationId: 'a11y-create-project',
      });
      if (!created.ok) throw new Error(created.error.message);
      const unit = await bridge.createUnit!({
        projectId: created.snapshot.project!.projectId,
        projectPath: created.snapshot.project!.path,
        generation: created.snapshot.generation,
        operationId: 'a11y-create-unit',
        title: 'Keyboard canvas',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    await expect(
      writing.getByRole('textbox', { name: 'Manuscript editor: Keyboard canvas' }),
    ).toBeVisible();
    await expect(command.getByRole('heading', { name: 'Accessibility project' })).toBeVisible();

    const [writingResults, commandResults] = await Promise.all([
      new AxeBuilder({ page: writing })
        .setLegacyMode(true)
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze(),
      new AxeBuilder({ page: command })
        .setLegacyMode(true)
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze(),
    ]);

    expect(
      writingResults.violations,
      JSON.stringify(writingResults.violations, null, 2),
    ).toHaveLength(0);
    expect(
      commandResults.violations,
      JSON.stringify(commandResults.violations, null, 2),
    ).toHaveLength(0);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises synthetic Stage 19 Electron state before installed-build qualification.
// Owner: Package 19.22 internal baseline verification.
// Retire when: An installed-build accessibility truth lane provides equivalent deterministic coverage.
