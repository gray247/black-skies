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
    await expect.poll(
      () => studio.evaluate((element) => getComputedStyle(element).backgroundColor),
      { message: 'Writing Studio should apply the light canvas surface after the theme state changes' },
    ).toBe('rgb(251, 248, 241)');
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
      if (rail.control === 'session tools') {
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
    await openWritingStudioRail(writing, 'story tools');
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

    await openWritingStudioRail(writing, 'story tools');
    await writing.getByRole('button', { name: '01 Opening' }).click();
    const openingEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Opening' });
    const openingProse = 'Rain crossed the windows before the first passenger arrived.';
    await openingEditor.fill(openingProse);
    await writing.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();
    await writing.getByRole('button', { name: 'Close', exact: true }).click();

    // Rail selection, rather than the in-manuscript jump control, must bring
    // the selected unit into view in a long continuous manuscript.
    await openWritingStudioRail(writing, 'story tools');
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
    await openWritingStudioRail(writing, 'story tools');
    await writing.getByRole('button', { name: 'Add story content' }).click();
    await writing.getByRole('button', { name: 'Note' }).click();
    const title = writing.getByRole('textbox', { name: `Title for ${crossingProse}` });
    await title.fill('Lantern crossing');
    await writing.getByRole('button', { name: 'Save note' }).click();

    await writing.getByRole('button', { name: 'Open 1 Note for Crossing' }).click();
    await writing.getByRole('button', { name: 'Locate in manuscript' }).click();
    await expect(writing.getByRole('alert').filter({ hasText: 'Returned to Lantern crossing.' })).toBeVisible();
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

    await openWritingStudioRail(writing, 'story tools');
    await writing.locator('details.stage19-manuscript-structure').evaluate((element) => { (element as HTMLDetailsElement).open = true; });
    await writing.getByRole('button', { name: 'Import Markdown' }).click();
    await expect.poll(async () => (await readdir(destinationPath)).filter((entry) => entry.startsWith('proj_intake_')).length).toBe(1);
    const importedDirectory = (await readdir(destinationPath)).find((entry) => entry.startsWith('proj_intake_'))!;
    const imported = { projectPath: join(destinationPath, importedDirectory) };
    await expect(writing.getByRole('button', { name: 'Rediscover' })).toBeVisible();
    await writing.getByRole('button', { name: 'Rediscover' }).click();
    await expect(writing.getByRole('heading', { name: 'Structure workspace' })).toBeVisible();
    await writing.waitForTimeout(250);
    const proposals = writing.getByRole('list', { name: 'Structure proposals' });
    await expect(proposals).toBeVisible();
    await expect(proposals.locator('[data-structure-proposal="true"]')).toHaveCount(3);
    await expect(proposals.locator('[data-structure-source-row="true"]')).toHaveCount(5);
    await proposals.getByRole('button', { name: 'Start boundary' }).first().click();
    await proposals.getByRole('button', { name: 'End boundary' }).first().click();
    await writing.getByRole('textbox', { name: 'Boundary label' }).fill('First pinned boundary');
    await writing.getByRole('button', { name: 'Pin boundary' }).click();

    const firstLabel = proposals.locator('[data-proposal-label]').first();
    await firstLabel.fill('First renamed');
    await proposals.getByRole('button', { name: 'Save name' }).first().click();
    await proposals.getByRole('button', { name: 'Split at paragraph boundary' }).first().click();
    await expect(proposals.locator('[data-structure-proposal="true"]')).toHaveCount(6);
    await proposals.locator('input[name="proposalId"]').nth(1).check();
    await proposals.locator('input[name="proposalId"]').nth(2).check();
    await writing.getByRole('button', { name: 'Merge selected' }).click();
    await proposals.getByRole('button', { name: 'Accept' }).nth(1).click();
    await proposals.getByRole('button', { name: 'Reject' }).nth(2).click();
    const structureDisclosure = writing.locator('details.stage19-manuscript-structure');
    const persistedBeforeStaging = await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8');
    await proposals.getByRole('button', { name: 'Move up' }).nth(1).click();
    await expect(writing.getByRole('button', { name: 'Save order' })).toBeVisible();
    await structureDisclosure.locator('summary').click();
    await expect(writing.getByRole('button', { name: 'Save order' })).toHaveCount(0);
    await structureDisclosure.locator('summary').click();
    await expect(writing.getByRole('button', { name: 'Save order' })).toHaveCount(0);
    expect(await readFile(`${imported.projectPath}/manuscript-structure.json`, 'utf8')).toBe(persistedBeforeStaging);
    await proposals.getByRole('button', { name: 'Move up' }).nth(1).click();
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

    await proposals.locator('[data-structure-proposal="true"]').nth(3).getByRole('button', { name: 'Accept' }).click();
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

// HARNESS_ONLY
// Reason: Proves the P3-D shell hierarchy, edge rails, Focus restoration, and responsive no-overlay geometry in built Electron.
// Owner: Program 3 P3-D automated qualification.
// Retire when: Installed-build Human Gate 2 evidence provides equivalent deterministic coverage.
