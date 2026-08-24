import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getStage19Windows,
  openWritingStudioRail,
  removeTemporaryDirectory,
  type WritingStudioRailLabel,
} from './stage19-electron-support';

async function snapshotStructureCanonicalFiles(projectPath: string): Promise<Record<string, string>> {
  const relativePaths = ['manuscript-intake.md', 'manuscript-structure.json', 'outline.json'];
  const draftEntries = await readdir(join(projectPath, 'drafts'), { withFileTypes: true });
  relativePaths.push(
    ...draftEntries
      .filter((entry) => entry.isFile())
      .map((entry) => join('drafts', entry.name)),
  );
  const snapshot: Record<string, string> = {};
  for (const relativePath of relativePaths.sort()) {
    snapshot[relativePath] = (await readFile(join(projectPath, relativePath))).toString('base64');
  }
  return snapshot;
}

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

test('P5-UX-01 keeps no-project startup tools composed and unavailable controls readable', async ({
  electronApp,
  page,
}) => {
  const { writing } = await getStage19Windows(electronApp, page);
  const studio = writing.getByRole('region', { name: 'Writing Studio' });
  await writing.setViewportSize({ width: 1900, height: 1000 });
  const themeSwitch = writing.getByRole('switch', { name: 'Light theme' });
  if (await themeSwitch.getAttribute('aria-checked') !== 'true') await themeSwitch.click();
  await expect(studio).toHaveAttribute('data-stage19-theme', 'light');
  await openWritingStudioRail(writing, 'Story');
  await expect(writing.getByRole('heading', { name: 'No active project' })).toBeVisible();
  await expect(writing.getByRole('status')).toContainText('No project open');

  for (const viewport of [
    { width: 1900, height: 1000 },
    { width: 1000, height: 800 },
  ]) {
    await writing.setViewportSize(viewport);
    const composition = await writing.evaluate(() => {
      const lifecycle = document.querySelector('.stage19-spine__welcome-grid .stage19-spine__lifecycle');
      if (!(lifecycle instanceof HTMLElement)) throw new Error('No-project lifecycle controls are unavailable');
      const groups = Array.from(lifecycle.querySelectorAll<HTMLElement>('[data-project-tool]'));
      const overlaps = (left: DOMRect, right: DOMRect): boolean =>
        left.left < right.right - 1 && left.right > right.left + 1 &&
        left.top < right.bottom - 1 && left.bottom > right.top + 1;
      const groupRects = groups.map((group) => group.getBoundingClientRect());
      const actionBottoms = groups.map((group) =>
        group.querySelector('button')?.getBoundingClientRect().bottom ?? null);
      const headingTops = groups.map((group) =>
        group.querySelector('h3')?.getBoundingClientRect().top ?? null);
      const groupOverlap = groupRects.some((rect, index) =>
        groupRects.slice(index + 1).some((candidate) => overlaps(rect, candidate)));
      const overlapPairs = groups.flatMap((group) => {
        const content = Array.from(group.querySelectorAll<HTMLElement>(
          'button, input, .stage19-spine__lifecycle-help',
        )).filter((element) => element.getClientRects().length > 0);
        const rects = content.map((element) => element.getBoundingClientRect());
        return rects.flatMap((rect, index) =>
          rects.slice(index + 1).flatMap((candidate, candidateIndex) =>
            overlaps(rect, candidate)
              ? [`${content[index]?.tagName}:${content[index]?.textContent?.trim() ?? ''} / ${content[index + candidateIndex + 1]?.tagName}:${content[index + candidateIndex + 1]?.textContent?.trim() ?? ''}`]
              : []));
      });
      return {
        groupCount: groups.length,
        groupOverlap,
        aligned: window.innerWidth < 1400 || (
          Math.max(...groupRects.map((rect) => rect.top)) - Math.min(...groupRects.map((rect) => rect.top)) <= 1 &&
          Math.max(...groupRects.map((rect) => rect.bottom)) - Math.min(...groupRects.map((rect) => rect.bottom)) <= 1 &&
          Math.max(...headingTops.filter((value): value is number => value !== null)) - Math.min(...headingTops.filter((value): value is number => value !== null)) <= 1 &&
          Math.max(...actionBottoms.filter((value): value is number => value !== null)) - Math.min(...actionBottoms.filter((value): value is number => value !== null)) <= 1
        ),
        overlapPairs,
        overflow: groups.some((group) =>
          group.scrollWidth > group.clientWidth + 1 || group.scrollHeight > group.clientHeight + 1),
      };
    });
    expect(composition).toEqual({
      groupCount: 2,
      groupOverlap: false,
      aligned: true,
      overlapPairs: [],
      overflow: false,
    });
  }

  await expect(writing.getByRole('button', { name: 'Open Writing Session' })).toHaveCount(0);

  const askButton = writing.getByRole('button', { name: 'Ask' });
  await expect(askButton).toBeDisabled();
  expect(await askButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderStyle: style.borderStyle,
      cursor: style.cursor,
      textDecorationLine: style.textDecorationLine,
      title: element.title,
    };
  })).toEqual({
    borderStyle: 'dashed',
    cursor: 'not-allowed',
    textDecorationLine: 'none',
    title: 'Open a project before asking Companion',
  });
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
    await writing.setViewportSize({ width: 1900, height: 1000 });
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'closed');
    await editor.fill(prose);
    await expect(editor).toContainText(prose);
    expect(await studio.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe('rgb(0, 0, 0)');
    const proseGeometry = await writing.evaluate(() => {
      const content = document.querySelector('.stage19-spine__editor .cm-content');
      const card = document.querySelector('.stage19-spine__editor-card');
      if (!(content instanceof HTMLElement) || !(card instanceof HTMLElement)) throw new Error('Prose geometry is unavailable');
      return {
        contentWidth: content.getBoundingClientRect().width,
        cardWidth: card.getBoundingClientRect().width,
      };
    });
    expect(proseGeometry.contentWidth).toBeGreaterThan(950);
    expect(proseGeometry.contentWidth).toBeLessThanOrEqual(proseGeometry.cardWidth);

    const themeSwitch = writing.getByRole('switch', { name: 'Light theme' });
    await expect(themeSwitch).toHaveAttribute('aria-checked', 'false');
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(studio).toHaveAttribute('data-stage19-theme', 'light');
    await expect.poll(
      () => studio.evaluate((element) => getComputedStyle(element).backgroundColor),
      { message: 'Writing Studio should apply the light canvas surface after the theme state changes' },
    ).toBe('rgb(251, 248, 241)');
    await expect(editor).toContainText(prose);
    await openWritingStudioRail(writing, 'Project Tools');
    const projectTools = writing.getByRole('region', { name: 'Project Tools' });
    const projectPresentation = await projectTools.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      helperColors: Array.from(element.querySelectorAll('.stage19-spine__lifecycle-help, .stage19-spine__lifecycle label'))
        .map((node) => getComputedStyle(node).color),
    }));
    expect(projectPresentation.height).toBeLessThan(320);
    expect(projectPresentation.helperColors.length).toBeGreaterThan(0);
    expect(projectPresentation.helperColors.every((color) => color === 'rgb(87, 81, 73)')).toBe(true);
    expect(projectPresentation.helperColors).not.toContain('rgb(119, 112, 103)');
    const edgePresentation = await writing.locator('#stage19-writing-edge-right').evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return { position: style.position, fontSize: style.fontSize, width: rect.width, height: rect.height };
    });
    expect(edgePresentation.position).toBe('fixed');
    expect(parseFloat(edgePresentation.fontSize)).toBeGreaterThanOrEqual(12.8);
    expect(edgePresentation.width).toBeGreaterThan(0);
    expect(edgePresentation.height).toBeGreaterThan(0);
    await projectTools.getByRole('button', { name: 'Close', exact: true }).click();
    await openWritingStudioRail(writing, 'Review');
    const credentialLabel = writing.getByText('OpenAI API key (session only; no readback)');
    expect(await credentialLabel.evaluate((element) => getComputedStyle(element).color)).toBe('rgb(87, 81, 73)');
    await writing.getByRole('complementary', { name: 'Review' }).getByRole('button', { name: 'Close', exact: true }).click();
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(studio).toHaveAttribute('data-stage19-theme', 'dark');
    await expect(editor).toContainText(prose);

    const rails: ReadonlyArray<{
      control: WritingStudioRailLabel;
      panel: string;
      role: 'region' | 'complementary';
    }> = [
      { control: 'Project Tools', panel: 'Project Tools', role: 'region' },
      { control: 'Story', panel: 'Story rail', role: 'complementary' },
      { control: 'Review', panel: 'Review', role: 'complementary' },
      { control: 'Writing Session', panel: 'Writing Session', role: 'region' },
    ];
    for (const rail of rails) {
      if (rail.control === 'Writing Session') {
        const hitTest = await writing.evaluate(() => {
          const button = document.getElementById('stage19-writing-edge-bottom');
          if (!button) return { targetId: null, viewport: null, button: null, companion: null };
          const buttonRect = button.getBoundingClientRect();
          const target = document.elementFromPoint(
            buttonRect.left + buttonRect.width / 2,
            buttonRect.top + buttonRect.height / 2,
          );
          const companion = document.querySelector('.stage19-companion-bar')?.getBoundingClientRect();
          return {
            targetId: target?.closest('button')?.id ?? null,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio,
            },
            button: { top: buttonRect.top, bottom: buttonRect.bottom, height: buttonRect.height },
            companion: companion
              ? { top: companion.top, bottom: companion.bottom, height: companion.height }
              : null,
          };
        });
        expect(hitTest).toMatchObject({ targetId: 'stage19-writing-edge-bottom' });
      }
      await openWritingStudioRail(writing, rail.control);
      await expect(writing.getByRole(rail.role, { name: rail.panel })).toBeVisible();
      await expect(editor).toContainText(prose);
      await writing.getByRole('button', { name: 'Close', exact: true }).click();
      const edgeControl = writing.getByRole('button', { name: `Open ${rail.control}` });
      await expect(edgeControl).toBeFocused();
      await expect(writing.getByRole(rail.role, { name: rail.panel })).toHaveCount(0);
      await expect(editor).toContainText(prose);
    }

    await openWritingStudioRail(writing, 'Story');
    await expect(writing.getByRole('complementary', {
      name: 'Story rail',
    })).toBeVisible();
    await writing.getByRole('button', { name: 'Enter Focus mode' }).click();
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'focus');
    await expect(writing.getByRole('navigation', { name: 'Writing Studio edge controls' })).toHaveCount(0);
    await expect(writing.getByRole('complementary', { name: 'Story rail' })).toHaveCount(0);
    await expect(writing.getByRole('textbox', { name: 'Ask Black Skies' })).toHaveCount(0);
    await expect(writing.getByRole('heading', { name: 'One continuous story' })).toHaveCount(0);
    await expect(writing.getByText(/Scroll through the whole story/)).toHaveCount(0);
    await expect(editor).toContainText(prose);

    await writing.getByRole('button', { name: 'Exit Focus mode' }).click();
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'left');
    await expect(writing.getByRole('complementary', { name: 'Story rail' })).toBeVisible();
    await expect(editor).toContainText(prose);

    await writing.setViewportSize({ width: 1000, height: 800 });
    await openWritingStudioRail(writing, 'Review');
    const writingSupport = writing.getByRole('complementary', { name: 'Review' });
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

test('Slice 1 keeps long prose in a private canvas scroll region while rails stay fixed', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-slice1-geometry-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const project = await bridge.createProject({
        parentPath,
        title: 'Slice 1 Geometry',
        operationId: 'slice1-geometry-create-project',
      });
      if (!project.ok) throw new Error(project.error.message);
      const unit = await bridge.createUnit!({
        projectId: project.snapshot.project!.projectId,
        projectPath: project.snapshot.project!.path,
        generation: project.snapshot.generation,
        operationId: 'slice1-geometry-create-unit',
        title: 'Long Draft',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    const studio = writing.getByRole('region', { name: 'Writing Studio' });
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Long Draft' });
    await editor.fill(Array.from({ length: 180 }, (_, index) => `Line ${index + 1}: the manuscript remains one continuous draft.`).join('\n'));
    await openWritingStudioRail(writing, 'Story');
    const geometryBefore = await writing.evaluate(() => {
      const shell = document.querySelector('.stage19-writing-shell');
      const canvas = document.querySelector('[data-manuscript-scroll-owner="true"]');
      const rail = document.querySelector('#stage19-writing-rail-left');
      if (!(shell instanceof HTMLElement) || !(canvas instanceof HTMLElement) || !(rail instanceof HTMLElement)) {
        throw new Error('Slice 1 geometry nodes are missing');
      }
      const railRect = rail.getBoundingClientRect();
      return {
        shellOverflow: getComputedStyle(shell).overflowY,
        canvasOverflow: getComputedStyle(canvas).overflowY,
        canvasScrollHeight: canvas.scrollHeight,
        canvasClientHeight: canvas.clientHeight,
        canvasTop: canvas.getBoundingClientRect().top,
        railTop: railRect.top,
        railBottom: railRect.bottom,
      };
    });
    expect(geometryBefore.shellOverflow).toBe('hidden');
    expect(geometryBefore.canvasOverflow).toBe('auto');
    expect(geometryBefore.canvasScrollHeight).toBeGreaterThan(geometryBefore.canvasClientHeight);

    const geometryAfter = await writing.evaluate(() => {
      const canvas = document.querySelector('[data-manuscript-scroll-owner="true"]');
      const rail = document.querySelector('#stage19-writing-rail-left');
      if (!(canvas instanceof HTMLElement) || !(rail instanceof HTMLElement)) throw new Error('Slice 1 nodes are missing');
      canvas.scrollTop = canvas.scrollHeight;
      const railRect = rail.getBoundingClientRect();
      return {
        canvasTop: canvas.getBoundingClientRect().top,
        railTop: railRect.top,
        railBottom: railRect.bottom,
        canvasScrollTop: canvas.scrollTop,
      };
    });
    expect(geometryAfter.canvasScrollTop).toBeGreaterThan(0);
    expect(geometryAfter.canvasTop).toBe(geometryBefore.canvasTop);
    expect(geometryAfter.railTop).toBe(geometryBefore.railTop);
    expect(geometryAfter.railBottom).toBe(geometryBefore.railBottom);
    await expect(editor).toBeInViewport();
    await expect(studio).toHaveAttribute('data-stage19-writing-rail', 'left');
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

    await openWritingStudioRail(writing, 'Story');
    await writing.getByRole('button', { name: '01 Opening' }).click();
    const openingEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Opening' });
    const openingProse = 'Rain crossed the windows before the first passenger arrived.';
    await openingEditor.fill(openingProse);
    await writing.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await writing.getByRole('button', { name: 'Close', exact: true }).click();

    // Rail selection, rather than the in-manuscript jump control, must bring
    // the selected unit into view in a long continuous manuscript.
    await openWritingStudioRail(writing, 'Story');
    await writing.getByRole('button', { name: '02 Crossing' }).click();
    await expect(crossingEditor).toBeInViewport();
    await writing.getByRole('button', { name: '01 Opening' }).click();
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
    await openWritingStudioRail(writing, 'Story');
    await writing.getByRole('button', { name: 'Add story content' }).click();
    await writing.getByRole('button', { name: 'Note' }).click();
    const title = writing.getByRole('textbox', { name: `Title for ${crossingProse}` });
    await title.fill('Lantern crossing');
    const saveNote = writing.getByRole('button', { name: 'Save note and close' });
    await expect(saveNote).toBeVisible();
    const saveNotePresentation = await saveNote.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        fontSize: style.fontSize,
        color: style.color,
        backgroundColor: style.backgroundColor,
        width: rect.width,
        height: rect.height,
      };
    });
    expect(parseFloat(saveNotePresentation.fontSize)).toBeGreaterThanOrEqual(12.8);
    expect(saveNotePresentation.color).not.toBe('rgb(119, 112, 103)');
    expect(saveNotePresentation.width).toBeGreaterThan(0);
    expect(saveNotePresentation.height).toBeGreaterThan(0);
    await saveNote.click();

    const noteMarker = writing.getByRole('button', { name: 'Open Note Lantern crossing for Crossing' });
    await expect(noteMarker).toContainText('Lantern crossing');
    await writing.getByRole('button', { name: 'Select multiple' }).click();
    const checkboxCenters = await writing.getByRole('complementary', { name: 'Story rail' }).evaluate((element) => {
      const centers = (selector: string) => Array.from(element.querySelectorAll<HTMLInputElement>(selector))
        .map((input) => {
          const rect = input.getBoundingClientRect();
          return rect.left + rect.width / 2;
        });
      return {
        units: centers('input[aria-label^="Select Unit"]'),
        notes: centers('input[aria-label^="Select Note"]'),
      };
    });
    expect(checkboxCenters.units).toHaveLength(2);
    expect(Math.max(...checkboxCenters.units) - Math.min(...checkboxCenters.units)).toBeLessThan(1);
    expect(Math.abs(checkboxCenters.units[0]! - checkboxCenters.notes[0]!)).toBeLessThan(16);
    await writing.getByRole('button', { name: 'Done selecting' }).click();
    await noteMarker.press('F2');
    const renamedTitle = writing.getByRole('textbox', { name: 'Title for Lantern crossing' });
    await expect(renamedTitle).toBeFocused();
    await renamedTitle.fill('Lantern crossing revised');
    await writing.getByRole('button', { name: 'Save note and close' }).click();
    const renamedMarker = writing.getByRole('button', { name: 'Open Note Lantern crossing revised for Crossing' });
    await expect(renamedMarker).toContainText('Lantern crossing revised');
    const longTitle = `${'A deliberately long Note title with ordinary words '.repeat(4)}ending`;
    await renamedMarker.press('F2');
    const longTitleEditor = writing.getByRole('textbox', { name: 'Title for Lantern crossing revised' });
    await longTitleEditor.fill(longTitle);
    await writing.getByRole('button', { name: 'Save note and close' }).click();
    const longTitleMarker = writing.getByRole('button', { name: `Open Note ${longTitle} for Crossing` });
    await expect(longTitleMarker).toBeVisible();
    expect(await writing.getByRole('complementary', { name: 'Story rail' }).evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollLeft: element.scrollLeft,
      scrollWidth: element.scrollWidth,
    }))).toEqual(expect.objectContaining({ scrollLeft: 0 }));
    expect(await writing.getByRole('complementary', { name: 'Story rail' }).evaluate((element) =>
      element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    const canvasScrollBeforeOpen = await writing.locator('[data-manuscript-scroll-owner="true"]').evaluate((element) => element.scrollTop);
    await longTitleMarker.click();
    await expect(writing.getByRole('textbox', { name: `Title for ${longTitle}` })).not.toBeFocused();
    expect(await writing.locator('[data-manuscript-scroll-owner="true"]').evaluate((element) => element.scrollTop)).toBe(canvasScrollBeforeOpen);
    await writing.getByRole('button', { name: 'Locate in manuscript' }).click();
    await expect(writing.getByRole('alert').filter({ hasText: `Returned to ${longTitle}.` })).toBeVisible();
    expect(await activeCrossingEditor.evaluate(() => window.getSelection()?.toString())).toBe(crossingProse);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test('Program 5 imports, paginates, edits, applies, and reloads a disposable Markdown structure', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-program5-structure-'));
  const sourcePath = join(parent, 'intake.md');
  const destinationPath = join(parent, 'destination');
  const source = '# First\nFirst exact prose.\n\n# Second\nSecond exact prose.\n\n# Third\nThird exact prose.\n';
  await writeFile(sourcePath, source, 'utf8');
  await mkdir(destinationPath);
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const created = await window.projectSpine!.createProject({ parentPath, title: 'Program 5 Structure Host', operationId: 'program5-structure-host' });
      if (!created.ok) throw new Error(created.error.message);
    }, parent);
    await writing.keyboard.press('Control+s');
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await electronApp.evaluate(({}, paths) => {
      process.env.BLACKSKIES_E2E_STRUCTURE_MARKDOWN_PATH = paths.filePath;
      process.env.BLACKSKIES_E2E_STRUCTURE_DIRECTORY_PATH = paths.parentPath;
    }, { parentPath: destinationPath, filePath: sourcePath });

    await openWritingStudioRail(writing, 'Story');
    await writing.locator('details.stage19-manuscript-structure').evaluate((element) => { (element as HTMLDetailsElement).open = true; });
    await writing.getByRole('button', { name: 'Import Markdown' }).click();
    await expect.poll(async () => (await readdir(destinationPath)).filter((entry) => entry.startsWith('proj_intake_')).length).toBe(1);
    const importedDirectory = (await readdir(destinationPath)).find((entry) => entry.startsWith('proj_intake_'))!;
    const imported = { projectPath: join(destinationPath, importedDirectory) };
    await expect(writing.getByRole('button', { name: 'Rediscover' })).toBeVisible();
    await writing.getByRole('button', { name: 'Rediscover' }).click();
    await expect(writing.getByRole('heading', { name: 'Structure', exact: true })).toBeVisible();
    const importedPreview = writing.getByRole('region', { name: 'Imported manuscript structure review' });
    const importedSource = writing.getByLabel('Imported manuscript source');
    await expect(importedPreview).toBeVisible();
    await expect(importedSource).toHaveText(source);
    await expect(writing.getByRole('heading', { name: 'Imported manuscript — structure review' })).toBeVisible();
    await expect(writing.getByText('Read-only until accepted structure is applied.')).toBeVisible();
    await expect(writing.getByRole('heading', { name: 'No manuscript unit selected' })).toHaveCount(0);
    await expect(writing.getByRole('textbox', { name: /Manuscript editor:/ })).toHaveCount(0);
    await writing.waitForTimeout(250);
    const proposals = writing.getByRole('list', { name: 'Structure proposals' });
    await expect(proposals).toBeVisible();
    await expect(proposals.locator('[data-structure-proposal="true"]')).toHaveCount(3);
    await expect(proposals.locator('[data-structure-source-row="true"]')).toHaveCount(0);
    await expect(proposals.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(writing.getByRole('button', { name: 'Merge selected' })).toHaveCount(0);
    const structureLayout = await writing.locator('details.stage19-manuscript-structure').evaluate((element) => {
      const workspace = element.querySelector<HTMLElement>('.stage19-manuscript-structure__workspace')!;
      const list = element.querySelector<HTMLElement>('.stage19-manuscript-structure__proposals')!;
      return {
        workspaceOverflowX: getComputedStyle(workspace).overflowX,
        workspaceOverflowY: getComputedStyle(workspace).overflowY,
        listOverflowX: getComputedStyle(list).overflowX,
        listOverflowY: getComputedStyle(list).overflowY,
        workspaceHorizontalOverflow: workspace.scrollWidth - workspace.clientWidth,
        listHorizontalOverflow: list.scrollWidth - list.clientWidth,
      };
    });
    expect(structureLayout.workspaceOverflowX).toBe('visible');
    expect(structureLayout.workspaceOverflowY).toBe('visible');
    expect(structureLayout.listOverflowX).toBe('visible');
    expect(structureLayout.listOverflowY).toBe('visible');
    expect(structureLayout.workspaceHorizontalOverflow).toBeLessThanOrEqual(1);
    expect(structureLayout.listHorizontalOverflow).toBeLessThanOrEqual(1);
    const secondProposal = proposals.locator('[data-structure-proposal="true"]').nth(1);
    const secondProposalId = await secondProposal.getAttribute('data-structure-proposal-id');
    await secondProposal.getByRole('button', { name: /Second/ }).click();
    await expect(writing.locator(`[data-imported-proposal-id="${secondProposalId}"]`).first()).toHaveAttribute('aria-pressed', 'true');

    const selectedControls = writing.getByRole('region', { name: 'Selected section controls' });
    await expect(selectedControls).toContainText('Second');
    await writing.getByText('More section actions').click();
    await writing.getByText('Advanced boundary tools').click();
    await writing.getByLabel('Start boundary').selectOption({ index: 1 });
    await writing.getByLabel('End boundary').selectOption({ index: 2 });
    await writing.getByRole('textbox', { name: 'Boundary label' }).fill('First pinned boundary');
    await writing.getByRole('button', { name: 'Pin boundary' }).click();

    await writing.getByRole('textbox', { name: 'Section name' }).fill('Second renamed');
    await writing.getByRole('button', { name: 'Save name' }).click();
    await expect(writing.getByRole('button', { name: /Merge with next:/ })).toHaveCount(1);
    await writing.getByRole('button', { name: /Merge with next:/ }).click();
    await writing.locator('details.stage19-manuscript-structure__more-actions').evaluate((element) => {
      if (!(element as HTMLDetailsElement).open) (element.querySelector('summary') as HTMLElement).click();
    });
    await writing.getByLabel('Split selected section at').selectOption({ index: 1 });
    await writing.getByRole('button', { name: 'Split section' }).click();
    await expect.poll(async () => proposals.locator('[data-structure-proposal="true"]').count()).toBeGreaterThan(2);

    const undecidedProposals = proposals.locator('[data-structure-proposal="true"]').filter({ hasText: 'Needs decision' });
    await expect.poll(async () => undecidedProposals.count()).toBeGreaterThan(1);
    await undecidedProposals.first().getByRole('button').click();
    const acceptProposal = selectedControls.getByRole('button', { name: 'Accept' });
    await acceptProposal.click();
    await expect(acceptProposal).toBeDisabled();
    await proposals.locator('[data-structure-proposal="true"]').filter({ hasText: 'Needs decision' }).last().getByRole('button').click();
    const rejectProposal = selectedControls.getByRole('button', { name: 'Reject' });
    await rejectProposal.click();
    await expect(rejectProposal).toBeDisabled();
    const structureDisclosure = writing.locator('details.stage19-manuscript-structure');
    const persistedBeforeStaging = await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8');
    const proposalRows = proposals.locator('[data-structure-proposal="true"]');
    let firstStaged = false;
    for (let index = 0; index < await proposalRows.count(); index += 1) {
      await proposalRows.nth(index).getByRole('button').click();
      await writing.locator('details.stage19-manuscript-structure__more-actions').evaluate((element) => {
        if (!(element as HTMLDetailsElement).open) (element.querySelector('summary') as HTMLElement).click();
      });
      const moveDown = writing.getByRole('button', { name: 'Move down' });
      const moveUp = writing.getByRole('button', { name: 'Move up' });
      if (await moveDown.isEnabled()) { await moveDown.click(); firstStaged = true; break; }
      if (await moveUp.isEnabled()) { await moveUp.click(); firstStaged = true; break; }
    }
    expect(firstStaged).toBe(true);
    await expect(writing.getByRole('button', { name: 'Save order' })).toBeVisible();
    await structureDisclosure.locator(':scope > summary').click();
    await expect(writing.getByRole('button', { name: 'Save order' })).toHaveCount(0);
    await structureDisclosure.locator(':scope > summary').click();
    await expect(writing.getByRole('button', { name: 'Save order' })).toHaveCount(0);
    expect(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')).toBe(persistedBeforeStaging);
    let secondStaged = false;
    for (let index = 0; index < await proposalRows.count(); index += 1) {
      await proposalRows.nth(index).getByRole('button').click();
      await writing.locator('details.stage19-manuscript-structure__more-actions').evaluate((element) => {
        if (!(element as HTMLDetailsElement).open) (element.querySelector('summary') as HTMLElement).click();
      });
      const moveDown = writing.getByRole('button', { name: 'Move down' });
      const moveUp = writing.getByRole('button', { name: 'Move up' });
      if (await moveDown.isEnabled()) { await moveDown.click(); secondStaged = true; break; }
      if (await moveUp.isEnabled()) { await moveUp.click(); secondStaged = true; break; }
    }
    expect(secondStaged).toBe(true);
    await writing.getByRole('button', { name: 'Cancel order' }).click();
    expect(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')).toBe(persistedBeforeStaging);
    await writing.getByRole('button', { name: 'Apply accepted structure to Units' }).click();

    const sourceOnDisk = await readFile(`${imported.projectPath}/manuscript-intake.md`, 'utf8');
    await expect.poll(async () => {
      const persisted = JSON.parse(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')) as { proposals: Array<{ state: string; appliedUnitId: string | null }> };
      return persisted.proposals.filter((proposal) => proposal.state === 'accepted' && proposal.appliedUnitId).length;
    }).toBeGreaterThan(0);
    const structureAfterFirstApply = JSON.parse(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')) as { proposals: Array<{ state: string; appliedUnitId: string | null; anchor: { selectionStart: number; selectionEnd: number } }> };
    const firstDrafts = await readdir(`${imported.projectPath}/drafts`);
    const firstMaterialized = structureAfterFirstApply.proposals.filter((proposal) => proposal.state === 'accepted' && proposal.appliedUnitId);
    await expect(writing.locator('[data-manuscript-unit-id]')).toHaveCount(firstMaterialized.length);
    await expect(writing.getByRole('textbox', { name: /Manuscript editor:/ }).first()).toBeVisible();
    await expect(writing.getByLabel('Imported manuscript source')).toHaveCount(0);
    const firstApplyActual = await Promise.all(firstMaterialized.map(async (proposal) => {
      const draft = await readFile(`${imported.projectPath}/drafts/${proposal.appliedUnitId}.md`, 'utf8');
      return { id: proposal.appliedUnitId, prose: draft.slice(draft.indexOf('\n---\n') + 5).trimEnd(), expected: sourceOnDisk.slice(proposal.anchor.selectionStart, proposal.anchor.selectionEnd).trimEnd() };
    }));
    const firstRanges = firstMaterialized.map((proposal) => `${proposal.anchor.selectionStart}:${proposal.anchor.selectionEnd}`);
    const firstApplyEvidence = { actual: firstApplyActual, draftCount: firstDrafts.length, uniqueProse: new Set(firstApplyActual.map((entry) => entry.prose)).size, uniqueRanges: new Set(firstRanges).size };
    expect(firstApplyEvidence.actual.every((entry) => entry.prose === entry.expected)).toBe(true);
    expect(firstApplyEvidence.uniqueProse).toBe(firstApplyEvidence.actual.length);
    expect(firstApplyEvidence.uniqueRanges).toBe(firstApplyEvidence.actual.length);
    expect(firstApplyEvidence.draftCount).toBe(firstApplyEvidence.actual.length);

    await proposals.locator('[data-structure-proposal="true"]').filter({ hasText: 'Needs decision' }).first().getByRole('button').click();
    await writing.getByRole('region', { name: 'Selected section controls' }).getByRole('button', { name: 'Accept' }).click();
    await expect(writing.getByRole('button', { name: 'Apply accepted structure to Units' })).toBeEnabled();
    await writing.getByRole('button', { name: 'Apply accepted structure to Units' }).click();
    await expect.poll(async () => {
      const persisted = JSON.parse(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')) as { proposals: Array<{ state: string; appliedUnitId: string | null }> };
      return persisted.proposals.filter((proposal) => proposal.state === 'accepted' && proposal.appliedUnitId).length;
    }).toBeGreaterThan(firstMaterialized.length);
    const structureAfterSecondApply = JSON.parse(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')) as { proposals: Array<{ state: string; appliedUnitId: string | null; anchor: { selectionStart: number; selectionEnd: number } }> };
    const secondMaterialized = structureAfterSecondApply.proposals.filter((proposal) => proposal.state === 'accepted' && proposal.appliedUnitId);
    await expect(writing.locator('[data-manuscript-unit-id]')).toHaveCount(secondMaterialized.length);
    const secondIds = new Set<string>();
    const secondActual = await Promise.all(secondMaterialized.map(async (proposal) => {
      if (secondIds.has(proposal.appliedUnitId!)) throw new Error('duplicate applied Unit id');
      secondIds.add(proposal.appliedUnitId!);
      const draft = await readFile(`${imported.projectPath}/drafts/${proposal.appliedUnitId}.md`, 'utf8');
      return draft.slice(draft.indexOf('\n---\n') + 5).trimEnd() === sourceOnDisk.slice(proposal.anchor.selectionStart, proposal.anchor.selectionEnd).trimEnd();
    }));
    const secondRanges = secondMaterialized.map((proposal) => `${proposal.anchor.selectionStart}:${proposal.anchor.selectionEnd}`);
    const secondApplyEvidence = { allExact: secondActual.every(Boolean), unitCount: secondIds.size, draftCount: (await readdir(`${imported.projectPath}/drafts`)).length, uniqueRanges: new Set(secondRanges).size };
    expect(secondApplyEvidence.allExact).toBe(true);
    expect(secondApplyEvidence.unitCount).toBe(secondApplyEvidence.draftCount);
    expect(secondApplyEvidence.uniqueRanges).toBe(secondApplyEvidence.unitCount);

    const overlapBefore = await snapshotStructureCanonicalFiles(imported.projectPath);
    const overlapResult = await writing.evaluate(async () => {
      const session = await window.projectSpine!.getSession();
      const structure = await window.manuscriptStructure!.get({
        projectId: session.project!.projectId,
        projectPath: session.project!.path,
        generation: session.generation,
        operationId: 'program5-structure-overlap-check',
      });
      if (!structure.ok) throw new Error(structure.error.message);
      if (structure.data.availability !== 'ready') throw new Error(`Structure became unavailable after Apply: ${structure.data.message ?? 'no message'}`);
      const applied = structure.data.document.proposals.find((proposal) => proposal.appliedUnitId);
      if (!applied) throw new Error('Apply did not persist an applied proposal.');
      return window.manuscriptStructure!.setBoundary({
        projectId: session.project!.projectId,
        projectPath: session.project!.path,
        generation: session.generation,
        expectedRevision: structure.data.document.revision,
        operationId: 'program5-structure-overlap-boundary',
        start: applied.anchor.selectionStart,
        end: applied.anchor.selectionStart + 1,
        label: 'Must reject',
      });
    });
    expect(overlapResult.ok).toBe(false);
    if (!overlapResult.ok) expect(overlapResult.error.code).toBe('OVERLAPPING_ACCEPTED_RANGES');
    expect(await snapshotStructureCanonicalFiles(imported.projectPath)).toEqual(overlapBefore);

    const reopened = await writing.evaluate(async (projectPath) => {
      const spine = window.projectSpine!;
      const session = await spine.getSession();
      const opened = await spine.openProject({ path: projectPath, operationId: 'program5-structure-reopen' });
      const result = await spine.reloadActiveProject!({
        projectId: opened.snapshot.project!.projectId,
        projectPath,
        generation: opened.snapshot.generation,
        operationId: 'program5-structure-reload',
      });
      return { result, generation: session.generation, opened };
    }, imported.projectPath);
    expect(reopened.result.ok).toBe(true);
    expect(reopened.result.snapshot.project?.path).toBe(imported.projectPath);
    expect(reopened.result.snapshot.generation).toBeGreaterThan(reopened.generation);
    expect(imported.projectPath).not.toBe(parent);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test('Program 5 keeps a substantial Markdown intake bounded, exact, and durable across reopen', async ({
  electronApp,
  page,
}) => {
  test.setTimeout(90_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-program5-substantial-'));
  const sourcePath = join(parent, 'substantial-manuscript.md');
  const destinationPath = join(parent, 'destination');
  const paragraph = Array.from({ length: 8 }, (_, sentenceIndex) =>
    `Sentence ${sentenceIndex + 1} keeps this deterministic chapter substantial while preserving exact source order, punctuation, and stable anchor evidence.`,
  ).join(' ');
  const source = Array.from({ length: 120 }, (_, chapterIndex) => {
    const chapter = String(chapterIndex + 1).padStart(3, '0');
    return `# Chapter ${chapter}\n\n${Array.from({ length: 4 }, (_, paragraphIndex) =>
      `Chapter ${chapter}, paragraph ${paragraphIndex + 1}. ${paragraph}`,
    ).join('\n\n')}\n`;
  }).join('\n');
  expect(source.length).toBeGreaterThan(300_000);
  await writeFile(sourcePath, source, 'utf8');
  await mkdir(destinationPath);

  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const created = await window.projectSpine!.createProject({
        parentPath,
        title: 'Program 5 Substantial Structure Host',
        operationId: 'program5-substantial-host',
      });
      if (!created.ok) throw new Error(created.error.message);
    }, parent);
    await writing.keyboard.press('Control+s');
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await electronApp.evaluate(({}, paths) => {
      process.env.BLACKSKIES_E2E_STRUCTURE_MARKDOWN_PATH = paths.filePath;
      process.env.BLACKSKIES_E2E_STRUCTURE_DIRECTORY_PATH = paths.parentPath;
    }, { parentPath: destinationPath, filePath: sourcePath });

    await openWritingStudioRail(writing, 'Story');
    await writing.locator('details.stage19-manuscript-structure').evaluate((element) => {
      (element as HTMLDetailsElement).open = true;
    });
    await writing.getByRole('button', { name: 'Import Markdown' }).click();
    await expect.poll(async () => (await readdir(destinationPath)).filter((entry) => entry.startsWith('proj_substantial-manuscript_')).length).toBe(1);
    const importedDirectory = (await readdir(destinationPath)).find((entry) => entry.startsWith('proj_substantial-manuscript_'))!;
    const projectPath = join(destinationPath, importedDirectory);
    await writing.getByRole('button', { name: 'Rediscover' }).click();

    await expect.poll(async () => {
      const persisted = JSON.parse(await readFile(join(projectPath, 'manuscript-structure.json'), 'utf8')) as { proposals: unknown[] };
      return persisted.proposals.length;
    }).toBe(120);
    const proposals = writing.getByRole('list', { name: 'Structure proposals' });
    await expect(proposals.locator('[data-structure-proposal="true"]')).toHaveCount(12);
    await expect(writing.getByRole('navigation', { name: 'Structure pages' })).toContainText('Page 1 of 10');
    const renderedProposalTextLength = await proposals.evaluate((element) => element.textContent?.length ?? 0);
    expect(renderedProposalTextLength).toBeLessThan(80_000);
    expect(renderedProposalTextLength).toBeLessThan(source.length / 5);

    await proposals.locator('[data-structure-proposal="true"]').first().getByRole('button').click();
    await writing.locator('details.stage19-manuscript-structure__more-actions').evaluate((element) => {
      if (!(element as HTMLDetailsElement).open) (element.querySelector('summary') as HTMLElement).click();
    });
    await writing.getByRole('textbox', { name: 'Section name' }).fill('Qualified opening');
    await writing.getByRole('button', { name: 'Save name' }).click();
    await writing.getByRole('region', { name: 'Selected section controls' }).getByRole('button', { name: 'Accept' }).click();
    await proposals.locator('[data-structure-proposal="true"]').nth(1).getByRole('button').click();
    await writing.getByRole('region', { name: 'Selected section controls' }).getByRole('button', { name: 'Reject' }).click();
    await writing.getByRole('navigation', { name: 'Structure pages' }).getByRole('button', { name: 'Next', exact: true }).click();
    await expect(writing.getByRole('navigation', { name: 'Structure pages' })).toContainText('Page 2 of 10');
    await expect(proposals.locator('[data-structure-proposal="true"]')).toHaveCount(12);
    await writing.getByRole('navigation', { name: 'Structure pages' }).getByRole('button', { name: 'Previous', exact: true }).click();
    await writing.getByRole('button', { name: 'Apply accepted structure to Units' }).click();

    await expect.poll(async () => {
      const persisted = JSON.parse(await readFile(join(projectPath, 'manuscript-structure.json'), 'utf8')) as { proposals: Array<{ appliedUnitId: string | null }> };
      return persisted.proposals.filter((proposal) => proposal.appliedUnitId).length;
    }).toBe(1);
    expect(await readFile(join(projectPath, 'manuscript-intake.md'), 'utf8')).toBe(source);

    const reopened = await writing.evaluate(async (path) => {
      const opened = await window.projectSpine!.openProject({
        path,
        operationId: 'program5-substantial-reopen',
      });
      if (!opened.ok) throw new Error(opened.error.message);
      const reloaded = await window.projectSpine!.reloadActiveProject!({
        projectId: opened.snapshot.project!.projectId,
        projectPath: path,
        generation: opened.snapshot.generation,
        operationId: 'program5-substantial-reload',
      });
      if (!reloaded.ok) throw new Error(reloaded.error.message);
      const structure = await window.manuscriptStructure!.get({
        projectId: reloaded.snapshot.project!.projectId,
        projectPath: path,
        generation: reloaded.snapshot.generation,
        operationId: 'program5-substantial-structure-get',
      });
      if (!structure.ok || structure.data.availability !== 'ready') {
        throw new Error(structure.ok ? 'Structure was not ready after reopen' : structure.error.message);
      }
      return {
        proposalCount: structure.data.document.proposals.length,
        accepted: structure.data.document.proposals.filter((proposal) => proposal.state === 'accepted').length,
        rejected: structure.data.document.proposals.filter((proposal) => proposal.state === 'rejected').length,
        applied: structure.data.document.proposals.filter((proposal) => proposal.appliedUnitId).length,
        qualifiedOpeningApplied: structure.data.document.proposals.some((proposal) =>
          proposal.label === 'Qualified opening' && proposal.state === 'accepted' && Boolean(proposal.appliedUnitId)),
        uniqueAnchors: new Set(structure.data.document.proposals.map((proposal) =>
          `${proposal.anchor.selectionStart}:${proposal.anchor.selectionEnd}:${proposal.anchor.selectionFingerprint}`)).size,
        sourceStatus: structure.data.sourceStatus,
      };
    }, projectPath);
    expect(reopened).toEqual({
      proposalCount: 120,
      accepted: 1,
      rejected: 1,
      applied: 1,
      qualifiedOpeningApplied: true,
      uniqueAnchors: 120,
      sourceStatus: 'current',
    });
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

// HARNESS_ONLY
// Reason: Proves the P3-D shell hierarchy, edge rails, Focus restoration, and responsive no-overlay geometry in built Electron.
// Owner: Program 3 P3-D automated qualification.
// Retire when: Installed-build Human Gate 2 evidence provides equivalent deterministic coverage.
