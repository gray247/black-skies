import AxeBuilder from '@axe-core/playwright';
import { rm, writeFile } from 'node:fs/promises';

import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true });

const PROGRAM7_SECTIONS = ['Revision Desk', 'Story Foundation', 'Ideas', 'History'] as const;
const MATRIX_REPORT_PATH = process.env.PROGRAM7_A11Y_MATRIX_OUTPUT;
const observedRows = new Map<string, { evidenceId: string; result: 'Pass' }>();

const MATRIX_PROFILES = [
  { id: '100-wide-normal', zoom: 100, viewport: 'wide', width: 1280, height: 900, reducedMotion: false },
  { id: '200-narrow-normal', zoom: 200, viewport: 'narrow', width: 640, height: 900, reducedMotion: false },
  { id: '100-wide-reduced', zoom: 100, viewport: 'wide', width: 1280, height: 900, reducedMotion: true },
] as const;

function routeId(section: string): string {
  return section === 'Revision Desk' ? 'revision-desk'
    : section === 'Story Foundation' ? 'story-foundation'
      : section === 'Ideas' ? 'ideas' : 'history';
}

function evidenceId(context: { topology: string; route: string; theme: string; zoom: number; viewport: string; reducedMotion: boolean }): string {
  return ['P7-A11Y', context.topology, context.route, context.theme, `${context.zoom}PCT`, context.viewport, context.reducedMotion ? 'reduced' : 'normal']
    .join('-').toUpperCase();
}

async function assertProgram7MechanicalA11y(
  page: import('@playwright/test').Page,
  route: string,
  context: { topology: 'attached' | 'detached'; route: string; theme: 'dark' | 'light'; zoom: number; viewport: 'wide' | 'narrow'; reducedMotion: boolean },
): Promise<void> {
  const axe = await new AxeBuilder({ page })
    .setLegacyMode(true)
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(axe.violations, `${route}: ${JSON.stringify(axe.violations, null, 2)}`).toHaveLength(0);

  const mechanical = await page.evaluate(() => {
    const isVisible = (element: HTMLElement): boolean => {
      const style = getComputedStyle(element);
      return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
    };
    const labels = Array.from(document.querySelectorAll<HTMLLabelElement>('label'));
    const controls = Array.from(document.querySelectorAll<HTMLElement>('button, input, select, textarea')).filter(isVisible);
    const unnamed = controls.flatMap((element) => {
      const labelled = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') ||
        element.textContent?.trim() || element.closest('label')?.textContent?.trim() ||
        (element.id ? labels.find((label) => label.htmlFor === element.id)?.textContent?.trim() : '');
      return labelled ? [] : [`${element.tagName.toLowerCase()}#${element.id}`];
    });
    const ids = Array.from(document.querySelectorAll<HTMLElement>('[id]')).map((element) => element.id);
    const positiveTabStops = Array.from(document.querySelectorAll<HTMLElement>('[tabindex]'))
      .filter((element) => isVisible(element) && Number(element.getAttribute('tabindex')) > 0).length;
    const p7Buttons = Array.from(document.querySelectorAll<HTMLElement>('.program7-create-develop button, .program7-revision-desk button, .program7-revision-capture button, .program7-revision-comparison button, .program7-story-foundation button, .program7-ideas-workspace button, .program7-history button, .program7-writing-revision-drawer button'))
      .filter(isVisible);
    const textElements = Array.from(document.querySelectorAll<HTMLElement>('.program7-create-develop *, .program7-writing-revision-drawer *'))
      .filter((element) => isVisible(element) && element.textContent?.trim() && element.children.length === 0 && !element.hasAttribute('aria-hidden') && !element.matches(':disabled'));
    const paleGrayValues = Array.from(new Set(textElements.flatMap((element) => {
      const style = getComputedStyle(element);
      return [style.color, style.backgroundColor].filter((value) => /rgb\((?:211,\s*211,\s*211|238,\s*238,\s*238|192,\s*192,\s*192)\)/u.test(value));
    })));
    return {
      unnamed,
      duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
      positiveTabStops,
      targetHeights: p7Buttons.map((button) => Math.round(button.getBoundingClientRect().height)),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      reducedMotionDuration: p7Buttons[0] ? getComputedStyle(p7Buttons[0]).transitionDuration : null,
      paleGrayValues,
    };
  });
  expect(mechanical.unnamed, `${route}: unnamed visible controls`).toEqual([]);
  expect(mechanical.duplicateIds, `${route}: duplicate IDs`).toEqual([]);
  expect(mechanical.positiveTabStops, `${route}: positive tabindex values`).toBe(0);
  expect(mechanical.targetHeights.every((height) => height >= 44), `${route}: target heights ${mechanical.targetHeights.join(', ')}`).toBe(true);
  expect(mechanical.horizontalOverflow, `${route}: horizontal overflow`).toBe(false);
  expect(mechanical.paleGrayValues, `${route}: prohibited pale-gray computed styles`).toEqual([]);
  if (context.reducedMotion && mechanical.reducedMotionDuration !== null) expect(mechanical.reducedMotionDuration).toBe('0s');
  observedRows.set(evidenceId(context), { evidenceId: evidenceId(context), result: 'Pass' });
}

async function setTheme(page: import('@playwright/test').Page, theme: 'dark' | 'light'): Promise<void> {
  const switchControl = page.getByRole('switch', { name: 'Light theme' });
  const expected = theme === 'light' ? 'true' : 'false';
  if (await switchControl.getAttribute('aria-checked') !== expected) await switchControl.click();
  await expect(switchControl).toHaveAttribute('aria-checked', expected);
}

async function exerciseCommandRoutes(
  surface: import('@playwright/test').Page,
  topology: 'attached' | 'detached',
  profile: (typeof MATRIX_PROFILES)[number],
  theme: 'dark' | 'light',
): Promise<void> {
  await surface.setViewportSize({ width: profile.width, height: profile.height });
  await surface.emulateMedia({ reducedMotion: profile.reducedMotion ? 'reduce' : 'no-preference' });
  await surface.evaluate((scale) => { document.documentElement.style.fontSize = `${scale}%`; }, profile.zoom);
  await setTheme(surface, theme);
  const createDevelop = surface.getByRole('button', { name: 'Create / Develop', exact: true });
  if (await createDevelop.count() === 0) {
    throw new Error(`Create / Develop missing after ${topology}-${theme}-${profile.id}: ${(await surface.locator('body').innerText()).slice(0, 2_000)}`);
  }
  await createDevelop.click();
  await expect(surface.getByTestId('program7-create-develop')).toBeVisible();
  for (const section of PROGRAM7_SECTIONS) {
    await surface.getByRole('button', { name: section, exact: true }).click();
    await expect(surface.getByTestId(`program7-create-develop-panel-${routeId(section)}`)).toBeVisible();
    await assertProgram7MechanicalA11y(surface, `${topology}-${theme}-${profile.id}-${section}`, {
      topology,
      route: routeId(section),
      theme,
      zoom: profile.zoom,
      viewport: profile.viewport,
      reducedMotion: profile.reducedMotion,
    });
  }
  await surface.getByRole('button', { name: 'Operations / Approvals', exact: true }).click();
  await assertProgram7MechanicalA11y(surface, `${topology}-${theme}-${profile.id}-operations-approvals`, {
    topology,
    route: 'operations-approvals',
    theme,
    zoom: profile.zoom,
    viewport: profile.viewport,
    reducedMotion: profile.reducedMotion,
  });
}

async function readProjectionParity(surface: import('@playwright/test').Page) {
  await surface.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  await surface.getByRole('button', { name: 'History', exact: true }).click();
  return surface.evaluate(() => ({
    project: document.querySelector('.stage19-spine__project, .stage19-command__identity h1')?.textContent?.trim() ?? null,
    route: document.querySelector('[data-testid="program7-create-develop"] h1')?.textContent?.trim() ?? null,
    sections: Array.from(document.querySelectorAll('[data-testid^="program7-create-develop-panel-"] h1, [data-testid^="program7-create-develop-panel-"] h2')).map((element) => element.textContent?.trim()),
  }));
}

async function closeDetachedCommand(electronApp: import('@playwright/test').ElectronApplication): Promise<void> {
  await electronApp.evaluate(async ({ BrowserWindow }) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (window.isDestroyed()) continue;
      const role = await window.webContents.executeJavaScript(
        "document.querySelector('[data-stage19-role=\"command\"]') ? 'command' : 'other'",
      );
      if (role === 'command') window.close();
    }
  });
}

test('Program 7 reaches objective accessibility matrix gates on attached and detached surfaces', async ({ page, electronApp }) => {
  const { reviewRoot, projectPath } = await materializeProgram7Carmilla();
  try {
    const { writing, command } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);

    // A Command Center can be detached or hosted inside Writing Studio, but
    // it cannot occupy both topologies at once. Exercise the detached window
    // first, then return it to Writing Studio before using that page handle.
    for (const profile of MATRIX_PROFILES) {
      for (const theme of ['dark', 'light'] as const) {
        await exerciseCommandRoutes(command, 'detached', profile, theme);
      }
    }
    const detachedParity = await readProjectionParity(command);

    await closeDetachedCommand(electronApp);
    await expect(writing.getByRole('region', { name: 'Command Center' })).toBeVisible();
    for (const profile of MATRIX_PROFILES) {
      for (const theme of ['dark', 'light'] as const) {
        await exerciseCommandRoutes(writing, 'attached', profile, theme);
      }
    }
    const attachedParity = await readProjectionParity(writing);
    expect(attachedParity).toEqual(detachedParity);

    // Editing an alternative deliberately returns to Writing Studio. Test the
    // drawer separately and re-open Command Center before each candidate.
    for (const profile of MATRIX_PROFILES) {
      for (const theme of ['dark', 'light'] as const) {
        await writing.setViewportSize({ width: profile.width, height: profile.height });
        await writing.emulateMedia({ reducedMotion: profile.reducedMotion ? 'reduce' : 'no-preference' });
        await writing.evaluate((scale) => { document.documentElement.style.fontSize = `${scale}%`; }, profile.zoom);
        await setTheme(writing, theme);
        await showCommandInWriting(writing);
        await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
        await writing.getByRole('button', { name: 'Revision Desk', exact: true }).click();
        await writing.locator('#program7-candidate-purpose').fill('Clarify the opening transition.');
        await writing.locator('#program7-candidate-text').fill(`Author-written alternative at ${profile.id}.`);
        await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
        await expect(writing.getByTestId('revision-comparison')).toBeVisible();
        const latestComparison = writing.getByTestId('revision-comparison').last();
        await latestComparison.getByRole('button', { name: 'Edit candidate', exact: true }).click();
        await expect(writing.getByTestId('writing-revision-drawer')).toBeVisible();
        await assertProgram7MechanicalA11y(writing, `attached-${theme}-${profile.id}-manual-alternative`, {
          topology: 'attached',
          route: 'manual-alternative',
          theme,
          zoom: profile.zoom,
          viewport: profile.viewport,
          reducedMotion: profile.reducedMotion,
        });
        await writing.getByRole('button', { name: 'Close drawer', exact: true }).click();
      }
    }
  } finally {
    if (MATRIX_REPORT_PATH) {
      await writeFile(MATRIX_REPORT_PATH, `${JSON.stringify({ rows: [...observedRows.values()] }, null, 2)}\n`, 'utf8');
    }
    await rm(reviewRoot, { recursive: true, force: true });
  }
});

// Mechanical coverage intentionally excludes loading, protected, cancelled,
// and provider-failure fixtures that require controlled transport/state seams;
// renderer tests cover their redaction/degraded postures without inventing
// runtime evidence or human visual acceptance.
