import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getStage19Windows,
  openWritingStudioRail,
  removeTemporaryDirectory,
  type WritingStudioRailLabel,
} from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

test('P3-D starts in dark appearance even when a prior preference exists', async ({ page }) => {
  await page.evaluate(() => window.localStorage.setItem('black-skies.stage19.theme.v1', 'light'));
  await page.reload();
  await expect(page.getByRole('region', { name: 'Writing Studio' })).toHaveAttribute('data-stage19-theme', 'light');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'black-skies.stage19.theme.v1',
      oldValue: 'light',
      newValue: null,
      storageArea: window.localStorage,
      url: window.location.href,
    }));
  });
  await expect(page.getByRole('region', { name: 'Writing Studio' })).toHaveAttribute('data-stage19-theme', 'dark');
});

test('P3-D keeps the literary manuscript primary while edge families and Focus remain reversible', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-p3d-writing-shell-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const project = await bridge.createProject({
        parentPath,
        title: 'P3-D Literary Canvas',
        operationId: 'p3d-create-project',
      });
      if (!project.ok) throw new Error(project.error.message);
      const unit = await bridge.createUnit!({
        projectId: project.snapshot.project!.projectId,
        projectPath: project.snapshot.project!.path,
        generation: project.snapshot.generation,
        operationId: 'p3d-create-unit',
        title: 'Unbroken Draft',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    const studio = writing.getByRole('region', { name: 'Writing Studio' });
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Unbroken Draft' });
    const prose = 'The night stayed quiet while the author kept the sentence alive.';
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'closed');
    await editor.fill(prose);
    await expect(editor).toContainText(prose);
    expect(await studio.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(0, 0, 0)');

    const themeSwitch = writing.getByRole('switch', { name: 'Light theme' });
    await expect(themeSwitch).toHaveAttribute('aria-checked', 'false');
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(studio).toHaveAttribute('data-stage19-theme', 'light');
    expect(await studio.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(251, 248, 241)');
    await expect(editor).toContainText(prose);
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(studio).toHaveAttribute('data-stage19-theme', 'dark');
    await expect(editor).toContainText(prose);

    const rails: ReadonlyArray<{
      control: WritingStudioRailLabel;
      panel: string;
      role: 'region' | 'complementary';
    }> = [
      { control: 'project tools', panel: 'Project tools', role: 'region' },
      { control: 'story tools', panel: 'Story tools', role: 'region' },
      { control: 'writing support', panel: 'Writing support', role: 'complementary' },
      { control: 'session tools', panel: 'Writing session tools', role: 'region' },
    ];
    for (const rail of rails) {
      await openWritingStudioRail(writing, rail.control);
      await expect(writing.getByRole(rail.role, { name: rail.panel })).toBeVisible();
      await expect(editor).toContainText(prose);
      await writing.getByRole('button', { name: 'Close', exact: true }).click();
      const edgeControl = writing.getByRole('button', { name: `Open ${rail.control}` });
      await expect(edgeControl).toBeFocused();
      await expect(writing.getByRole(rail.role, { name: rail.panel })).toHaveCount(0);
      await expect(editor).toContainText(prose);
    }

    await openWritingStudioRail(writing, 'story tools');
    await expect(writing.getByRole('complementary', {
      name: 'Story rail',
    })).toBeVisible();
    await writing.getByRole('button', { name: 'Enter Focus mode' }).click();
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'focus');
    await expect(writing.getByRole('navigation', { name: 'Writing Studio edge controls' })).toHaveCount(0);
    await expect(writing.getByRole('region', { name: 'Story tools' })).toHaveCount(0);
    await expect(writing.getByRole('textbox', { name: 'Ask Black Skies' })).toHaveCount(0);
    await expect(writing.getByRole('heading', { name: 'One continuous story' })).toHaveCount(0);
    await expect(writing.getByText(/Scroll through the whole story/)).toHaveCount(0);
    await expect(editor).toContainText(prose);

    await writing.getByRole('button', { name: 'Exit Focus mode' }).click();
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'left');
    await expect(writing.getByRole('region', { name: 'Story tools' })).toBeVisible();
    await expect(editor).toContainText(prose);

    await writing.setViewportSize({ width: 1000, height: 800 });
    await openWritingStudioRail(writing, 'writing support');
    const writingSupport = writing.getByRole('complementary', { name: 'Writing support' });
    expect(await writingSupport.evaluate((element) => ({
      position: getComputedStyle(element).position,
      width: element.getBoundingClientRect().width,
    }))).toMatchObject({ position: 'static' });
    const responsiveWidth = await writingSupport.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    expect(responsiveWidth).toBeGreaterThan(700);
    expect(responsiveWidth).toBeLessThanOrEqual(1_000);
    await expect(editor).toContainText(prose);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test('Program 5 bridge reads as one manuscript and returns a story point to its source passage', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-program5-bridge-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const project = await bridge.createProject({
        parentPath,
        title: 'Continuous Manuscript',
        operationId: 'program5-bridge-create-project',
      });
      if (!project.ok) throw new Error(project.error.message);
      for (const [index, title] of ['Opening', 'Crossing'].entries()) {
        const unit = await bridge.createUnit!({
          projectId: project.snapshot.project!.projectId,
          projectPath: project.snapshot.project!.path,
          generation: project.snapshot.generation,
          operationId: `program5-bridge-create-unit-${index + 1}`,
          title,
        });
        if (!unit.ok) throw new Error(unit.error.message);
      }
    }, parent);

    const crossingProse = 'Mara carried the lantern across the flooded station and listened for the signal.';
    const crossingEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Crossing' });
    await crossingEditor.fill(crossingProse);
    await writing.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();

    await openWritingStudioRail(writing, 'story tools');
    await writing.getByRole('button', { name: '01 Opening' }).click();
    const openingEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Opening' });
    const openingProse = 'Rain crossed the windows before the first passenger arrived.';
    await openingEditor.fill(openingProse);
    await writing.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await writing.getByRole('button', { name: 'Close', exact: true }).click();

    const manuscript = writing.getByLabel('Continuous manuscript');
    await expect(manuscript.locator('[data-manuscript-unit-id]')).toHaveCount(2);
    await expect(openingEditor).toContainText(openingProse);
    await expect(writing.getByRole('button', { name: 'Write in Crossing' })).toContainText(crossingProse);

    await writing.getByRole('button', { name: 'Write in Crossing' }).click();
    const activeCrossingEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Crossing' });
    await expect(activeCrossingEditor).toContainText(crossingProse);
    await expect(writing.getByRole('button', { name: 'Write in Opening' })).toContainText(openingProse);

    await activeCrossingEditor.selectText();
    await openWritingStudioRail(writing, 'story tools');
    await writing.getByRole('button', { name: 'Add to story here' }).click();
    const title = writing.getByRole('textbox', { name: `Title for ${crossingProse}` });
    await title.fill('Lantern crossing');
    await writing.locator('.stage19-living-outline__rename').getByRole('button', { name: 'Save' }).click();

    await writing.getByRole('button', { name: 'Lantern crossing', exact: true }).click();
    await expect(writing.getByRole('alert').filter({ hasText: 'Returned to Lantern crossing.' })).toBeVisible();
    expect(await activeCrossingEditor.evaluate(() => window.getSelection()?.toString())).toBe(crossingProse);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

// HARNESS_ONLY
// Reason: Proves the P3-D shell hierarchy, edge rails, Focus restoration, and responsive no-overlay geometry in built Electron.
// Owner: Program 3 P3-D automated qualification.
// Retire when: Installed-build Human Gate 2 evidence provides equivalent deterministic coverage.
