// HARNESS_ONLY
// Owner: writer foundation Batch 1. Disposable projects and service stubs verify
// desktop workflow wiring; retire this limitation only with an installed-candidate
// witness and the author's acceptance. No AI generation/admission is exercised.
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractProjectSpineDraftBody } from '../../shared/projectSpineDraft';
import { buildLivingOutlineSourceAnchor } from '../../shared/livingOutlineAnchors';
import { buildProgram7SourceEnvelope, revisionItemSources } from '../../shared/program7SourceBinding';
import { expect, restartElectronApp, test } from './_electron.fixture';
import { openProgram7Project, showCommandInWriting, showWritingInWriting } from './program7-e2e-support';
import {
  getStage19Windows,
  readWritingPaintWitness,
  openWritingStudioRail,
  removeTemporaryDirectory,
} from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true, disableLocalAi: true });

test('Catalog B8 grows a five-word Pin into a long manuscript and tests distant rail dragging', async ({ electronApp, page }, testInfo) => {
  test.setTimeout(120_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-sustained-growth-'));
  try {
    let { writing } = await getStage19Windows(electronApp, page);
    const nativeBounds = await electronApp.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows().find(value => value.id === 1)!;
      window.show(); window.focus(); window.webContents.focus();
      return window.getContentBounds();
    });
    await writing.setViewportSize({ width: nativeBounds.width, height: nativeBounds.height });
    const seed = 'Before.\n\nFive quiet trees await Mara.\n\nAfter.';
    const tinyFrom = seed.indexOf('Five quiet'), tinyTo = tinyFrom + 'Five quiet trees await Mara.'.length;
    const fixture = await writing.evaluate(async data => {
      const b = window.projectSpine!;
      const created = await b.createProject({ parentPath: data.parent, title: 'Growth from a small thought', operationId: 'growth-project' });
      if (!created.ok) throw new Error(created.error.message);
      const binding = { projectId: created.snapshot.project!.projectId, projectPath: created.snapshot.project!.path, generation: created.snapshot.generation };
      const unit = await b.createUnit!({ ...binding, title: 'Growing story', operationId: 'growth-unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      const id = unit.data.unitId, markdown = unit.snapshot.project!.drafts![id]!;
      const saved = await b.saveUnit!({ ...binding, operationId: 'growth-source', unitId: id, expectedMarkdown: markdown, submittedProse: data.seed, markdown: markdown + data.seed + '\n' });
      if (!saved.ok) throw new Error(saved.error.message);
      return { path: binding.projectPath, id };
    }, { parent, seed });
    // A fixture uses the existing optional chapter field; this does not add a chapter-assignment UI.
    const outlinePath = join(fixture.path, 'outline.json');
    const structure = JSON.parse(await readFile(outlinePath, 'utf8'));
    structure.chapters = [{ id: 'chapter1', order: 1, title: 'Before' }, { id: 'chapter2', order: 2, title: 'Forest' }];
    structure.scenes.find((unit: { id: string }) => unit.id === fixture.id).chapter_id = 'chapter2';
    await writeFile(outlinePath, JSON.stringify(structure));
    const draftPath = join(fixture.path, 'drafts', `${fixture.id}.md`), initial = await readFile(draftPath, 'utf8');
    const closing = initial.indexOf('\n---', 4);
    await writeFile(draftPath, initial.slice(0, closing) + '\nchapter_id: chapter2' + initial.slice(closing));
    await writing.evaluate(async () => {
      const bridge = window.projectSpine!, state = await bridge.getSession();
      const result = await bridge.reloadActiveProject!({ projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'growth-chapter-context' });
      if (!result.ok) throw new Error(result.error.message);
    });
    const anchor = await buildLivingOutlineSourceAnchor(fixture.id, seed, tinyFrom, tinyTo);
    const initialGroup = { id: 'tiny-forest', label: 'Tiny forest idea', customLabel: true, spans: [anchor] };
    const noteId = await writing.evaluate(async group => {
      const state = await window.projectSpine!.getSession(), bridge = window.livingOutline!;
      const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'growth-links' };
      const loaded = await bridge.get(binding); if (!loaded.ok) throw new Error(loaded.error.message);
      const note = await bridge.createItem({ ...binding, expectedRevision: loaded.data.document.revision, label: 'Tiny idea thought', body: 'Keep the original seed recognizable.', kind: 'fragment', state: 'authored', manuscriptUnitId: group.spans[0]!.unitId, sourceAnchor: group.spans[0] });
      if (!note.ok) throw new Error(note.error.message);
      const saved = await bridge.replaceWritingState!({ ...binding, expectedRevision: note.data.document.revision, groups: [group], noteAnchors: [] });
      if (!saved.ok) throw new Error(saved.error.message);
      return note.data.document.items.find(item => item.label === 'Tiny idea thought')!.id;
    }, initialGroup);
    await writing.reload();
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Growing story', exact: true });
    let expected = seed, offset = tinyFrom;
    const stages: { stage: number; words: number; characters: number; sourceStart: number }[] = [];
    for (let stage = 0; stage < 12; stage += 1) {
      const paragraphs = Array.from({ length: 140 }, (_, paragraph) => `Mara followed the winding path past lanterns and remembered the gate while wind moved through leaves at passage ${stage + 1} step ${paragraph + 1}.`).join('\n\n');
      const chunk = stage % 2 === 0 ? `${paragraphs}\n\n` : `\n\n${paragraphs}`;
      await editor.click(); await editor.press(stage % 2 === 0 ? 'Control+Home' : 'Control+End');
      await writing.keyboard.insertText(chunk);
      expected = stage % 2 === 0 ? chunk + expected : expected + chunk;
      if (stage % 2 === 0) offset += chunk.length;
      await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
      await expect.poll(async () => extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8'))).toBe(expected);
      await expect.poll(async () => {
        const metadata = JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
        const group = metadata.writingGroups.find((value: { id: string }) => value.id === 'tiny-forest');
        const note = metadata.items.find((value: { id: string }) => value.id === noteId);
        return { label: group.label, from: group.spans[0].selectionStart, to: group.spans[0].selectionEnd, noteFrom: note.sourceAnchor.selectionStart };
      }).toEqual({ label: 'Tiny forest idea', from: offset, to: offset + tinyTo - tinyFrom, noteFrom: offset });
      expect(JSON.parse(await readFile(outlinePath, 'utf8')).scenes.find((unit: { id: string }) => unit.id === fixture.id).chapter_id).toBe('chapter2');
      expect(await readFile(draftPath, 'utf8')).toContain('chapter_id: chapter2');
      await expect(writing.getByRole('button', { name: 'Save writing', exact: true })).toBeDisabled();
      stages.push({ stage: stage + 1, words: expected.match(/\S+/g)!.length, characters: expected.length, sourceStart: offset });
    }
    expect(stages.at(-1)!.words).toBeGreaterThan(35000);
    const groups = [
      { ...initialGroup, spans: [await buildLivingOutlineSourceAnchor(fixture.id, expected, offset, offset + tinyTo - tinyFrom)] },
      ...await Promise.all([...expected.matchAll(/Mara followed/g)].filter(match => match.index! > offset + tinyTo - tinyFrom).slice(0, 80).map(async (match, index) => ({ id: `long-rail-${index}`, label: `Trail ${String(index + 1).padStart(2, '0')}`, customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.id, expected, match.index!, match.index! + 13)] }))),
    ];
    await writing.evaluate(async groups => {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const state = await window.projectSpine!.getSession(), bridge = window.livingOutline!;
      const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'growth-long-rail' };
      // Test setup may meet the renderer's final anchor-refresh write. Re-read
      // only the expected metadata revision; never bypass the production guard.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const loaded = await bridge.get(binding); if (!loaded.ok) throw new Error(loaded.error.message);
        const saved = await bridge.replaceWritingState!({ ...binding, expectedRevision: loaded.data.document.revision, groups, noteAnchors: [] });
        if (saved.ok) return;
        if (saved.error.code !== 'STALE_OUTLINE' || attempt === 2) throw new Error(saved.error.message);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
    }, groups);
    await writing.reload();
    await openWritingStudioRail(writing, 'Story');
    const rail = writing.getByRole('region', { name: 'Story tools', exact: true });
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    await expect(rail.getByLabel('Outline order', { exact: true })).toHaveCount(0);
    const list = rail.getByRole('list', { name: 'Writing units and unpinned passages', exact: true });
    await expect(list.locator(':scope > li[data-writing-group-id]')).toHaveCount(81);
    const canvas = writing.locator('[data-manuscript-scroll-owner]');
    await canvas.evaluate(element => { element.scrollTop = 0; });
    const geometry = await canvas.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { right: box.right, top: box.top, gutter: element.offsetWidth - element.clientWidth };
    });
    expect(geometry.gutter).toBeGreaterThan(0);
    await writing.mouse.move(geometry.right - geometry.gutter / 2, geometry.top + 26);
    await writing.mouse.down();
    await writing.mouse.move(geometry.right - geometry.gutter / 2, geometry.top + 190, { steps: 12 });
    await writing.mouse.up();
    await expect.poll(() => canvas.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
    await expect(writing.locator('#stage19-writing-rail-right')).toHaveCount(0);
    await canvas.evaluate(element => { element.scrollTop = 0; });

    await rail.getByRole('button', { name: 'Tiny forest idea', exact: true }).click();
    await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toBe('Five quiet trees await Mara.');
    await rail.getByLabel('Actions for Tiny forest idea', { exact: true }).click();
    const handle = rail.getByRole('button', { name: 'Drag Tiny forest idea in the manuscript', exact: true });
    await list.evaluate(element => { element.scrollTop = 0; });
    await handle.scrollIntoViewIfNeeded();
    const handleBox = (await handle.boundingBox())!, listBox = (await list.boundingBox())!, railBox = (await rail.boundingBox())!;
    const visibleBottom = Math.min(listBox.y + listBox.height, railBox.y + railBox.height, writing.viewportSize()!.height) - 6;
    await writing.evaluate(() => {
      const events: string[] = [];
      (window as unknown as { nativeDragEvents: string[] }).nativeDragEvents = events;
      for (const type of ['dragstart', 'dragover', 'dragend']) document.addEventListener(type, event => { if (events.length < 80) events.push(`${event.type}:${(event.target as HTMLElement).tagName}`); }, { capture: true });
    });
    const scrollBefore = await list.evaluate(element => element.scrollTop);
    await electronApp.evaluate(({ BrowserWindow }) => { const owner = BrowserWindow.getAllWindows().find(window => window.id === 1)!; owner.show(); owner.focus(); owner.webContents.focus(); });
    await writing.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await writing.mouse.down();
    await writing.mouse.move(handleBox.x + handleBox.width / 2 + 8, handleBox.y + handleBox.height / 2 + 8, { steps: 3 });
    await writing.mouse.move(listBox.x + listBox.width / 2, visibleBottom, { steps: 5 });
    try { await expect.poll(() => list.evaluate(element => element.scrollTop), { timeout: 5000 }).toBeGreaterThan(scrollBefore + 120); }
    finally {
      await testInfo.attach('native-drag-geometry-events', { body: JSON.stringify({ nativeBounds, handleBox, listBox, railBox, visibleBottom, scrollBefore, scrollAfter: await list.evaluate(element => element.scrollTop), events: await writing.evaluate(() => (window as unknown as { nativeDragEvents: string[] }).nativeDragEvents) }), contentType: 'application/json' });
      await writing.mouse.move(listBox.x - 20, Math.max(railBox.y, listBox.y)); await writing.mouse.up();
    }
    // Cancelled drag changes no source or plan. Distant deliberate navigation stays exact.
    expect(extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8'))).toBe(expected);
    await rail.getByRole('button', { name: 'Trail 80', exact: true }).click();
    await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toBe('Mara followed');
    // Close/reopen the real secondary Command window while the long primary draft is dirty.
    const closeSecondary = async () => {
      await electronApp.evaluate(({ BrowserWindow }) => { for (const window of BrowserWindow.getAllWindows()) if (window.id !== 1 && !window.isDestroyed()) window.close(); });
      // Closing the secondary deliberately moves Command here. Wait for that
      // owner transition, then use its actual Return action before inspecting writing.
      await writing.getByRole('button', { name: 'Return to Writing Studio', exact: true }).click();
      await expect(writing.getByRole('region', { name: 'Writing Studio', exact: true })).toBeVisible();
    };
    await closeSecondary();
    await testInfo.attach('after-secondary-close-state', { body: JSON.stringify(await writing.evaluate(async () => ({ snapshot: await window.projectSpine!.getSession(), visibleEditors: [...document.querySelectorAll('.cm-content')].filter(node => node.getClientRects().length).map(node => node.getAttribute('aria-label')), visibleWriting: document.querySelector('[data-stage19-role="writing"]')?.textContent?.slice(0, 1000) }))), contentType: 'application/json' });
    await writing.screenshot({ path: testInfo.outputPath('after-secondary-close.png') });
    const activeEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Growing story', exact: true });
    await activeEditor.click(); await activeEditor.press('Control+End');
    const added = '\n\nWindow continuity keeps this unfinished sentence.';
    await writing.keyboard.insertText(added);
    await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds).toContain(fixture.id);
    await writing.getByRole('button', { name: 'Open Command Center in second window', exact: true }).click();
    await expect.poll(() => electronApp.windows().length).toBe(2);
    const command = electronApp.windows().find(window => window !== writing)!;
    await command.waitForFunction(() => window.projectSpine?.windowRole === 'command');
    const projected = await command.evaluate(() => window.projectSpine!.getSession());
    expect(projected.project!.projectId).toBe((await writing.evaluate(() => window.projectSpine!.getSession())).project!.projectId);
    expect(projected.project!.drafts).toBeUndefined();
    await closeSecondary();
    await expect(activeEditor).toContainText('Window continuity keeps this unfinished sentence.');
    expect(extractProjectSpineDraftBody(await readFile(draftPath, 'utf8'))).toBe(expected);
    expected += added;
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(async () => extractProjectSpineDraftBody(await readFile(draftPath, 'utf8'))).toBe(expected);
    await expect(writing.getByRole('button', { name: 'Save writing', exact: true })).toBeDisabled();
    await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds).toEqual([]);
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    const restarted = await restartElectronApp(electronApp);
    ({ writing } = await getStage19Windows(restarted, await restarted.firstWindow()));
    await openProgram7Project(writing, fixture.path); await showWritingInWriting(writing);
    expect(extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8'))).toBe(expected);
    const final = JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    expect(final.writingGroups.find((group: { id: string }) => group.id === 'tiny-forest').label).toBe('Tiny forest idea');
    expect(final.items.find((item: { id: string }) => item.id === noteId).body).toBe('Keep the original seed recognizable.');
    await testInfo.attach('actual-growth-stages', { body: JSON.stringify({ stages, fiveWordPinIdentity: 'tiny-forest', existingChapterIdentity: 'chapter2', originalNoteIdentity: noteId, longRailGroups: 81, nativeDragScroll: true, secondaryCloseReopenDirtyWriting: true, proseFreeCommandProjection: true, freshProcessSourceExact: true }), contentType: 'application/json' });
  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B7 retains unfinished forms through tabs, tools, rails and duplicate-title project return', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-retained-work-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const projects = await writing.evaluate(async parentPath => {
      const b = window.projectSpine!, projects: string[] = [];
      for (let n = 0; n < 2; n += 1) {
        const result = await b.createProject({ parentPath, title: 'Same project title', operationId: `retained-create-${n}` });
        if (!result.ok) throw new Error(result.error.message);
        projects.push(result.snapshot.project!.path);
        const binding = { projectId: result.snapshot.project!.projectId, projectPath: result.snapshot.project!.path, generation: result.snapshot.generation };
        const unit = await b.createUnit!({ ...binding, operationId: `retained-unit-${n}`, title: 'Same writing title' });
        if (!unit.ok) throw new Error(unit.error.message);
        const source = 'Five quiet trees await Mara.\n';
        const id = unit.data.unitId, markdown = unit.snapshot.project!.drafts![id]!;
        const saved = await b.saveUnit!({ ...binding, operationId: `retained-source-${n}`, unitId: id, expectedMarkdown: markdown, markdown: markdown + source, submittedProse: source.trimEnd() });
        if (!saved.ok) throw new Error(saved.error.message);
      }
      return projects;
    }, parent);
    const openDevelop = async () => {
      await showCommandInWriting(writing);
      await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    };
    await openProgram7Project(writing, projects[0]!);
    await openDevelop();
    await writing.getByRole('button', { name: 'Ideas', exact: true }).click();
    await writing.getByRole('textbox', { name: 'Your idea', exact: true }).fill('Unfinished forest idea A.');
    await writing.getByRole('textbox', { name: 'Direction name', exact: true }).fill('Duplicate direction name');
    await writing.getByRole('button', { name: 'Story Foundation', exact: true }).click();
    await writing.getByRole('textbox', { name: 'Your note for aboutness', exact: true }).fill('Unfinished guidance A.');
    await writing.getByRole('button', { name: 'Ideas', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Your idea', exact: true })).toHaveValue('Unfinished forest idea A.');
    await writing.getByRole('button', { name: 'Review', exact: true }).click();
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Your idea', exact: true })).toHaveValue('Unfinished forest idea A.');
    await showWritingInWriting(writing);
    await openWritingStudioRail(writing, 'Story');
    let rail = writing.getByRole('region', { name: 'Story tools', exact: true });
    await rail.locator('summary').filter({ hasText: 'Manual concerns' }).click();
    await rail.getByRole('textbox', { name: 'Manual concern', exact: true }).fill('Unfinished concern A.');
    await rail.getByRole('button', { name: 'Close', exact: true }).click();
    await openWritingStudioRail(writing, 'Story');
    rail = writing.getByRole('region', { name: 'Story tools', exact: true });
    await rail.locator('summary').filter({ hasText: 'Manual concerns' }).click();
    await expect(rail.getByRole('textbox', { name: 'Manual concern', exact: true })).toHaveValue('Unfinished concern A.');
    await openProgram7Project(writing, projects[1]!); await openDevelop();
    await writing.getByRole('button', { name: 'Ideas', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Your idea', exact: true })).toHaveValue('');
    await writing.getByRole('textbox', { name: 'Your idea', exact: true }).fill('Different unfinished idea B.');
    await openProgram7Project(writing, projects[0]!); await openDevelop();
    await writing.getByRole('button', { name: 'Ideas', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Your idea', exact: true })).toHaveValue('Unfinished forest idea A.');
    await expect(writing.getByRole('textbox', { name: 'Direction name', exact: true })).toHaveValue('Duplicate direction name');
    await writing.getByRole('button', { name: 'Story Foundation', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Your note for aboutness', exact: true })).toHaveValue('Unfinished guidance A.');
    await writing.getByRole('button', { name: 'Project Interchange', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Text and Markdown', exact: true })).toBeVisible();
    await expect(writing.getByRole('button', { name: 'Export saved source text', exact: true })).toBeVisible();
    await writing.getByRole('button', { name: 'Operations / Approvals', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Project operations', exact: true })).toBeVisible();
    await expect(writing.getByText(/Opening this screen starts no analysis/)).toBeVisible();
    await showWritingInWriting(writing);
    await writing.getByRole('button', { name: 'Open Companion', exact: true }).hover();
    const companion = writing.getByRole('region', { name: 'Companion', exact: true });
    await companion.getByRole('textbox', { name: 'Ask Black Skies', exact: true }).fill('Where is Notebook?');
    await companion.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Notebook and passage Notes', exact: true })).toBeVisible();
    await expect(writing.getByText('Built-in product help. No story was analyzed, no AI was called and no writing changed.', { exact: true })).toBeVisible();
    await writing.getByRole('button', { name: 'Open this tool', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Current tool: Outline', exact: true })).toBeVisible();
    await testInfo.attach('retained-work-boundaries', { body: JSON.stringify({ duplicateProjectTitles: true, tabs: true, tools: true, rails: true, acceptedRecordsUnchanged: true, restartPersistencePromised: false }), contentType: 'application/json' });
  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B6 text intake and full saved-source export preserve writing and cancellation', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-source-text-'));
  const sourcePath = join(parent, 'External.txt'), target = join(parent, 'Export.txt');
  const original = Buffer.from('\ufeffForest **idea** 🌲.\r\n\r\nMara waits at the gate.\r\n', 'utf8');
  await writeFile(sourcePath, original);
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const intake = await writing.evaluate(async paths => {
      const result = await window.manuscriptStructure!.importMarkdown({ projectId: '', projectPath: '', generation: 0, operationId: 'txt-intake', parentPath: paths.parent, filePath: paths.source });
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    }, { parent, source: sourcePath });
    expect(intake.sourceText).toBe(original.toString('utf8').slice(1).replace(/\r\n/g, '\n'));
    expect(await readFile(sourcePath)).toEqual(original);
    await openProgram7Project(writing, intake.projectPath);
    await showWritingInWriting(writing);
    const applied = await writing.evaluate(async () => {
      const spine = window.projectSpine!, bridge = window.manuscriptStructure!, snapshot = await spine.getSession();
      const binding = { projectId: snapshot.project!.projectId, projectPath: snapshot.project!.path, generation: snapshot.generation, operationId: 'txt-structure' };
      let result = await bridge.get(binding);
      if (!result.ok) throw new Error(result.error.message);
      result = await bridge.discover({ ...binding, expectedRevision: result.data.document.revision });
      if (!result.ok) throw new Error(result.error.message);
      for (const proposal of result.data.document.proposals) {
        result = await bridge.acceptProposal({ ...binding, proposalId: proposal.id, expectedRevision: result.data.document.revision });
        if (!result.ok) throw new Error(result.error.message);
      }
      result = await bridge.apply({ ...binding, expectedRevision: result.data.document.revision });
      if (!result.ok) throw new Error(result.error.message);
      const reloaded = await spine.reloadActiveProject!({ ...binding, operationId: 'txt-reload' });
      if (!reloaded.ok) throw new Error(reloaded.error.message);
      return reloaded.snapshot.project!;
    });
    const sources = await Promise.all(applied.units.map(unit => readFile(join(intake.projectPath, 'drafts', `${unit.id}.md`), 'utf8')));
    expect(sources.join('')).toContain('Forest **idea** 🌲.');
    expect(sources.join('')).toContain('Mara waits at the gate.');
    await openWritingStudioRail(writing, 'Project Tools');
    const tools = writing.getByRole('region', { name: 'Project Tools', exact: true });
    if (await tools.getByRole('button', { name: 'Keep open', exact: true }).isVisible()) await tools.getByRole('button', { name: 'Keep open', exact: true }).click();
    for (const width of [1440, 640]) {
      await writing.setViewportSize({ width, height: 900 });
      const actions = tools.locator('.stage19-writing-shell__file-actions');
      await actions.scrollIntoViewIfNeeded();
      await expect(actions.getByRole('button', { name: 'Import text or Markdown...', exact: true })).toBeVisible();
      const layout = await tools.evaluate(panel => {
        const actions = panel.querySelector('.stage19-writing-shell__file-actions')!, frame = actions.getBoundingClientRect();
        return { overflow: panel.scrollWidth - panel.clientWidth, buttons: [...actions.querySelectorAll('button')].map(button => {
          const rect = button.getBoundingClientRect();return { width: rect.width, height: rect.height, inside: rect.left >= frame.left - 1 && rect.right <= frame.right + 1 };
        }) };
      });
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.buttons).toHaveLength(3);
      for (const button of layout.buttons) { expect(button.inside).toBe(true); expect(button.width).toBeLessThan(340); expect(button.height).toBeLessThan(100); }
    }
    const beforeCancel = await writing.evaluate(() => window.projectSpine!.getSession());
    await electronApp.evaluate(({ dialog }) => {
      const cancel = Object.assign(async () => { cancel.calls += 1; return { canceled: true, filePaths: [] }; }, { calls: 0 });
      dialog.showOpenDialog = cancel as typeof dialog.showOpenDialog;
    });
    await tools.getByRole('button', { name: 'Import text or Markdown...', exact: true }).click();
    await expect.poll(() => electronApp.evaluate(({ dialog }) => (dialog.showOpenDialog as unknown as { calls: number }).calls)).toBe(1);
    const afterCancel = await writing.evaluate(() => window.projectSpine!.getSession());
    expect(afterCancel.project!.projectId).toBe(beforeCancel.project!.projectId);
    expect(afterCancel.project!.path).toBe(beforeCancel.project!.path);
    expect(afterCancel.project!.drafts).toEqual(beforeCancel.project!.drafts);
    await writing.setViewportSize({ width: 1440, height: 900 });
    await expect(writing.getByText(/Both exports include all saved writing sections/)).toBeVisible();
    await electronApp.evaluate(({ dialog }) => { dialog.showSaveDialog = async () => ({ canceled: true, filePath: '' }); });
    await writing.getByRole('button', { name: 'Export source text...', exact: true }).click();
    await expect(writing.getByText('Export cancelled. No file was created.', { exact: false })).toBeVisible();
    await electronApp.evaluate(({ dialog }, filePath) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath }); }, target);
    await writing.getByRole('button', { name: 'Export source text...', exact: true }).click();
    await expect.poll(async () => readFile(target, 'utf8').catch(() => '')).toContain('Forest **idea** 🌲.');
    const exported = await readFile(target, 'utf8');
    for (const source of sources) expect(exported).toContain(extractProjectSpineDraftBody(source));
    expect(await readFile(sourcePath)).toEqual(original);
    expect(await Promise.all(applied.units.map(unit => readFile(join(intake.projectPath, 'drafts', `${unit.id}.md`), 'utf8')))).toEqual(sources);
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Project Interchange', exact: true }).click();
    for (const width of [1440, 640]) {
      await writing.setViewportSize({ width, height: 900 });
      const interchange = writing.getByRole('region', { name: 'Text and Markdown interchange' });
      const buttons = interchange.locator('.stage19-text-interchange__actions button');
      await expect(buttons).toHaveCount(3);
      expect(await interchange.evaluate(node => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
      for (const button of await buttons.all()) { const rect = await button.boundingBox(); expect(rect!.width).toBeLessThan(340); expect(rect!.height).toBeLessThan(100); }
    }
    await testInfo.attach('source-text-qualification', { body: JSON.stringify({ intake: intake.document.source, exported, originalUnchanged: true, nativePickerStubbed: true }), contentType: 'application/json' });
  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B5 native vocabulary survives restart, crosses projects in its session, and removes only the selected word', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-vocabulary-'));
  const word = 'blackskiesqzxvljmara';
  let native = electronApp;
  let added = false;
  try {
    let { writing } = await getStage19Windows(native, page);
    const project = await writing.evaluate(async parentPath => {
      const result = await window.projectSpine!.createProject({ parentPath, title: 'Vocabulary A', operationId: 'vocab-a' });
      if (!result.ok) throw new Error(result.error.message);
      return result.snapshot.project!;
    }, parent);
    await writing.getByText('Spell Checker', { exact: true }).click();
    const vocabulary = writing.getByRole('region', { name: 'Spell Checker', exact: true });
    const before = await writing.evaluate(async () => {
      const b = window.projectSpine!, state = await b.getSession();
      return b.spellingDictionary!({ projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'vocab-inspect', action: 'inspect' });
    });
    if (!before.ok) throw new Error(before.error.message);
    expect(before.data.words).not.toContain(word);
    await vocabulary.getByLabel('Accepted word', { exact: true }).fill(word);
    await vocabulary.getByRole('button', { name: 'Accept dictionary', exact: true }).click();
    added = true;
    await expect(vocabulary.getByText('Dictionary updated. Check the manuscript again to refresh underlines.', { exact: true })).toBeVisible();
    await expect(vocabulary.getByRole('button', { name: `Remove accepted word ${word}`, exact: true })).toBeVisible();
    const other = await writing.evaluate(async parentPath => {
      const result = await window.projectSpine!.createProject({ parentPath, title: 'Vocabulary B', operationId: 'vocab-b' });
      if (!result.ok) throw new Error(result.error.message);
      return result.snapshot.project!;
    }, parent);
    native = await restartElectronApp(native);
    ({ writing } = await getStage19Windows(native, await native.firstWindow()));
    await openProgram7Project(writing, other.path); await showWritingInWriting(writing);
    const inspected = await writing.evaluate(async value => {
      const b = window.projectSpine!, state = await b.getSession();
      const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'vocab-restart' };
      const current = await b.spellingDictionary!({ ...binding, action: 'inspect' });
      const invalid = await b.spellingDictionary!({ ...binding, action: 'accept', word: 'two words' });
      const stale = await b.spellingDictionary!({ ...binding, projectId: 'other-project', action: 'remove', word: value });
      return { current, invalid, stale };
    }, word);
    expect(inspected.current).toMatchObject({ ok: true, data: { words: expect.arrayContaining([word]), languages: ['en-US'], scope: 'electron-session-and-possible-os' } });
    expect(inspected.invalid.ok).toBe(false); expect(inspected.stale.ok).toBe(false);
    const removed = await writing.evaluate(async value => {
      const b = window.projectSpine!, state = await b.getSession();
      return b.spellingDictionary!({ projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'vocab-remove', action: 'remove', word: value });
    }, word);
    expect(removed.ok).toBe(true);
    if (removed.ok) { expect(removed.data.words).not.toContain(word); expect(removed.data.words.slice().sort()).toEqual(before.data.words.slice().sort()); }
    added = false;
    await testInfo.attach('native-vocabulary-scope', { body: JSON.stringify({ from: project.projectId, across: other.projectId, restart: true, removedExactly: true, osDictionaryScopeNotClaimedIsolated: true }), contentType: 'application/json' });
  } finally {
    if (added) await native.evaluate(({ BrowserWindow }, value) => { BrowserWindow.getAllWindows()[0]?.webContents.session.removeWordFromSpellCheckerDictionary(value); }, word).catch(() => undefined);
    await removeTemporaryDirectory(parent);
  }
});

test('Catalog B5 preferences preserve exact source, dirty writing, history and project scope', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-preferences-'));
  try {
    let { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const fixture = await writing.evaluate(async parentPath => {
      const bridge = window.projectSpine!;
      const result = await bridge.createProject({ parentPath, title: 'Display choices', operationId: 'prefs-create' });
      if (!result.ok) throw new Error(result.error.message);
      const binding = { projectId: result.snapshot.project!.projectId, projectPath: result.snapshot.project!.path, generation: result.snapshot.generation };
      const unit = await bridge.createUnit!({ ...binding, title: 'Forest display', operationId: 'prefs-unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      const id = unit.data.unitId;
      const saved = await bridge.saveUnit!({ ...binding, operationId: 'prefs-source', unitId: id, expectedMarkdown: unit.snapshot.project!.drafts![id]!, submittedProse: 'Five quiet trees await Mara.\n\nA second paragraph.', markdown: unit.snapshot.project!.drafts![id]! + 'Five quiet trees await Mara.\n\nA second paragraph.\n' });
      if (!saved.ok) throw new Error(saved.error.message);
      await bridge.selectUnit({ ...binding, operationId: 'prefs-select', unitId: id });
      return { path: binding.projectPath, id };
    }, parent);
    const sourcePath = join(fixture.path, 'drafts', `${fixture.id}.md`), source = await readFile(sourcePath, 'utf8');
    let editor = writing.getByRole('textbox', { name: 'Manuscript editor: Forest display', exact: true });
    await expect(editor).toHaveAttribute('lang', 'en-US');
    await expect(editor).toHaveAttribute('spellcheck', 'true');
    await editor.click(); await editor.press('Control+End'); await editor.pressSequentially(' New growth.');
    const dirty = await editor.innerText();
    await writing.getByText('Writing preferences', { exact: true }).first().click();
    const form = writing.getByRole('form', { name: 'Writing preferences', exact: true });
    await form.getByLabel('Typeface', { exact: true }).selectOption('mono');
    await form.getByLabel('Text size (px)', { exact: true }).fill('25');
    await form.getByLabel('Line height', { exact: true }).fill('2');
    await form.getByLabel('Extra paragraph spacing (px)', { exact: true }).fill('14');
    await form.getByLabel('First-line indentation (em)', { exact: true }).fill('2');
    await form.getByLabel('Optional story word goal', { exact: true }).fill('5');
    await form.getByLabel('US English spelling', { exact: true }).uncheck();
    await form.getByRole('button', { name: 'Save preferences', exact: true }).click();
    await expect(form.getByText('Writing preferences saved. Manuscript source is unchanged.', { exact: true })).toBeVisible();
    expect(await readFile(sourcePath, 'utf8')).toBe(source);
    await expect.poll(() => editor.innerText()).toBe(dirty);
    await expect(editor).toHaveCSS('font-family', 'Consolas, monospace');
    await expect(editor).toHaveAttribute('spellcheck', 'false');
    await expect(editor.locator('.writing-paragraph-start').first()).toHaveCSS('padding-top', '14px');
    await expect(editor.locator('.writing-paragraph-first').first()).toHaveCSS('text-indent', '50px');
    await expect(writing.getByRole('status', { name: 'Story word count', exact: true })).toContainText('goal · reached');
    await form.getByLabel('Text size (px)', { exact: true }).fill('30');
    await form.getByRole('button', { name: 'Cancel preferences', exact: true }).click();
    await expect(editor.locator('..')).toHaveCount(1);
    // A presentation change must not rebuild the editor or discard typing Undo.
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(editor).not.toContainText('New growth');
    await writing.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect(editor).toContainText('New growth');
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(async () => (await readFile(sourcePath, 'utf8')).includes('New growth')).toBe(true);
    const savedSource = await readFile(sourcePath, 'utf8');
    const restarted = await restartElectronApp(electronApp);
    ({ writing } = await getStage19Windows(restarted, await restarted.firstWindow()));
    await openProgram7Project(writing, fixture.path);
    await showWritingInWriting(writing);
    editor = writing.getByRole('textbox', { name: 'Manuscript editor: Forest display', exact: true });
    await expect(editor).toHaveCSS('font-family', 'Consolas, monospace');
    expect(await readFile(sourcePath, 'utf8')).toBe(savedSource);
    const metadata = JSON.parse(await readFile(join(fixture.path, 'project.json'), 'utf8'));
    expect(metadata.writing_preferences.values.fontSize).toBe(25);
    expect(metadata.writing_preferences.values.wordGoal).toBe(5);
    const other = await writing.evaluate(async parentPath => {
      const result = await window.projectSpine!.createProject({ parentPath, title: 'Other display', operationId: 'prefs-other' });
      if (!result.ok) throw new Error(result.error.message);
      return result.snapshot.project!.writingPreferences;
    }, parent);
    expect(other?.values.font).toBe('default');
    expect(other?.values.wordGoal).toBeNull();
    await testInfo.attach('display-only-source-and-preferences', { body: JSON.stringify({ sourceUnchangedDuringPreferences: true, savedSource, metadata: metadata.writing_preferences }), contentType: 'application/json' });
  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B5 qualifies the bundled US-English dictionary, correction and reopening offline', async ({ electronApp, page }, testInfo) => {
  const { writing } = await getStage19Windows(electronApp, page);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-dictionary-'));
  try {
  const configure = await electronApp.evaluate(({ BrowserWindow, app }) => {
    const contents = BrowserWindow.getAllWindows()[0]!.webContents, session = contents.session;
    const available = session.availableSpellCheckerLanguages;
    session.setSpellCheckerEnabled(true);
    if (available.includes('en-US')) session.setSpellCheckerLanguages(['en-US']);
    session.enableNetworkEmulation({ offline: true });
    return { available, configured: session.getSpellCheckerLanguages(), enabled: session.isSpellCheckerEnabled(), profile: app.getPath('userData') };
  });
  await testInfo.attach('electron-dictionary-configuration', { body: JSON.stringify(configure, null, 2), contentType: 'application/json' });
  expect(configure.available).toContain('en-US');
  await writing.evaluate(async parentPath => {
    const bridge = window.projectSpine!;
    const project = await bridge.createProject({ parentPath, title: 'Native dictionary probe', operationId: 'dictionary-project' });
    if (!project.ok) throw new Error(project.error.message);
    const binding = { projectId: project.snapshot.project!.projectId, projectPath: project.snapshot.project!.path, generation: project.snapshot.generation };
    const unit = await bridge.createUnit!({ ...binding, title: 'Dictionary writing', operationId: 'dictionary-unit' });
    if (!unit.ok) throw new Error(unit.error.message);
    const later = await bridge.createUnit!({ ...binding, title: 'Later spelling', operationId: 'dictionary-later-unit' });
    if (!later.ok) throw new Error(later.error.message);
    const raw = later.snapshot.project!.drafts![later.data.unitId]!;
    const saved = await bridge.saveUnit!({ ...binding, unitId: later.data.unitId, expectedMarkdown: raw,
      markdown: raw + 'A qzxvwlj in the forest.\n', submittedProse: 'A qzxvwlj in the forest.', operationId: 'dictionary-later-save' });
    if (!saved.ok) throw new Error(saved.error.message);
    const selected = await bridge.selectUnit({ ...binding, unitId: unit.data.unitId, operationId: 'dictionary-select' });
    if (!selected.ok) throw new Error(selected.error.message);
  }, parent);
  const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Dictionary writing', exact: true });
  const underlines = writing.getByRole('checkbox', { name: 'Spelling underlines' });
  const openSpelling = () => writing.getByText('Spell Checker', { exact: true }).click();
  await expect(editor).toHaveAttribute('spellcheck', 'true');
  await expect(underlines).toBeVisible();
  await expect(underlines).toBeChecked();
  await underlines.click();
  await expect(editor).toHaveAttribute('spellcheck', 'false');
  await underlines.click();
  await expect(editor).toHaveAttribute('spellcheck', 'true');
  await editor.click(); await editor.pressSequentially('foorrrest forest. ');
  const liveMark = editor.locator('.stage19-writing-spelling');
  await editor.pressSequentially('qzxvwlj ');
  await expect(liveMark).toHaveText(['foorrrest', 'qzxvwlj']);
  await editor.fill('foorrrest forest. ');
  await expect(liveMark).toHaveText('foorrrest');
  await editor.press('Control+a');
  const selection = await writing.evaluate(() => {
    const clipboard = new DataTransfer();
    const event = new ClipboardEvent('copy', { clipboardData: clipboard, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    return { copied: clipboard.getData('text/plain'), collapsed: window.getSelection()?.isCollapsed };
  });
  expect(selection).toEqual({ copied: 'foorrrest forest. \n\nA qzxvwlj in the forest.', collapsed: false });
  await writing.keyboard.press('Escape');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await writing.getByRole('button', { name: 'Find & replace', exact: true }).click();
  const find = writing.locator('[data-writing-find-input]');
  await find.fill('forest');
  await find.press('Control+a');
  expect(await find.evaluate((input: HTMLInputElement) => [input.selectionStart, input.selectionEnd])).toEqual([0, 6]);
  await writing.getByRole('button', { name: 'Close search', exact: true }).click();
  await liveMark.click({ button: 'right' });
  const suggestions = writing.getByRole('group', { name: 'Spelling suggestions' });
  await expect(suggestions.getByRole('button', { name: 'Add to dictionary' })).toBeVisible();
  await suggestions.getByRole('button', { name: 'forest', exact: true }).click();
  await expect(editor).toHaveText('forest forest. ');
  await writing.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(liveMark).toHaveText('foorrrest');
  await expect(writing.getByRole('group', { name: 'Writing highlights' }).getByRole('checkbox', { name: 'Spelling underlines' })).toBeChecked();
  await expect.poll(() => writing.evaluate(async () => (await window.projectSpine!.checkSpelling!('foorrrest')).misspelled)).toBe(true);
  const result = await writing.evaluate(async () => { const forest = await window.projectSpine!.checkSpelling!('forest'), typo = await window.projectSpine!.checkSpelling!('foorrrest'); return { forest: forest.misspelled, mistake: typo.misspelled, suggestions: typo.suggestions }; });
  await testInfo.attach('electron-offline-dictionary-result', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  expect(result.forest).toBe(false); expect(result.mistake).toBe(true); expect(result.suggestions).toContain('forest');
  await openSpelling();
  const panel = writing.getByRole('region', { name: 'Spell Checker' });
  await panel.getByRole('button', { name: 'Check manuscript' }).click();
  await expect(panel.getByRole('status')).toHaveText('2 possible misspellings in the manuscript.');
  const marks = writing.locator('.stage19-writing-spelling');
  await expect(marks).toHaveText(['foorrrest', 'qzxvwlj']);
  const originalViewport = await writing.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  await writing.setViewportSize({ width: 500, height: 700 });
  const entry = panel.getByRole('textbox', { name: 'Accepted word', exact: true });
  const accept = panel.getByRole('button', { name: 'Accept dictionary', exact: true });
  const accepted = panel.getByRole('button', { name: 'Show accepted words', exact: true });
  const entryBox = (await entry.boundingBox())!;
  expect((await accept.boundingBox())!.y).toBeGreaterThanOrEqual(entryBox.y + entryBox.height);
  expect((await accepted.boundingBox())!.y).toBeGreaterThanOrEqual(entryBox.y + entryBox.height);
  await panel.getByRole('button', { name: 'Close Spell Checker' }).click();
  await expect(panel).toBeHidden();
  await writing.setViewportSize(originalViewport);
  await underlines.click();
  await expect(marks).toHaveCount(0);
  await underlines.click();
  await expect(marks).toHaveText(['foorrrest', 'qzxvwlj']);
  await editor.press('Control+Home');
  for (let index = 0; index < 'foorrrest'.length; index += 1) await editor.press('Shift+ArrowRight');
  await writing.getByText('Spell Checker', { exact: true }).click();
  await writing.getByRole('button', { name: 'Check selected word', exact: true }).click();
  await writing.getByRole('button', { name: 'Use forest', exact: true }).click();
  await expect(editor).toHaveText('forest forest. ');
  await expect(marks).toHaveText(['qzxvwlj']);
  await panel.getByRole('button', { name: 'Lock Spell Checker' }).click();
  await panel.getByRole('button', { name: 'Next misspelling', exact: true }).click();
  await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Later spelling', exact: true })).toBeVisible();
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Unlock Spell Checker' })).toHaveAttribute('aria-pressed', 'true');
  await panel.getByRole('button', { name: 'Close Spell Checker' }).click();
  await writing.getByRole('button', { name: 'Write here: Dictionary writing, section 1', exact: true }).click();
  await writing.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(editor).toHaveText('foorrrest forest. ');
  await writing.getByRole('button', { name: 'Redo', exact: true }).click();
  await expect(editor).toHaveText('forest forest. ');
  await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
  await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
  await underlines.click();
  await expect(editor).toHaveAttribute('spellcheck', 'false');
  const originalSession = await writing.evaluate(() => window.projectSpine!.getSession());
  const restarted = await restartElectronApp(electronApp);
  const windows = await getStage19Windows(restarted, await restarted.firstWindow());
  await openProgram7Project(windows.writing, originalSession.project!.path);
  const reopened = windows.writing.getByRole('textbox', { name: 'Manuscript editor: Dictionary writing', exact: true });
  await expect(reopened).toHaveText('forest forest.');
  await expect(reopened).toHaveAttribute('spellcheck', 'false');
  const retained = await windows.writing.evaluate(() => window.projectSpine!.checkSpelling!('foorrrest'));
  expect(retained).toMatchObject({ available: true, misspelled: true, suggestions: expect.arrayContaining(['forest']) });

  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B5 compares the isolated bridge with the native checker in one offline session', async ({ electronApp, page }, testInfo) => {
  const { writing } = await getStage19Windows(electronApp, page);
  const words = ['foorrrest', 'qzxvwlj', 'forest', 'xxzzqpa'];
  const configuration = await electronApp.evaluate(({ BrowserWindow, app }) => {
    const owner = BrowserWindow.getAllWindows().find(window => window.id === 1)!;
    const session = owner.webContents.session;
    session.enableNetworkEmulation({ offline: true });
    return { userData: app.getPath('userData'), sessionData: app.getPath('sessionData'), storagePath: session.storagePath,
      languages: session.getSpellCheckerLanguages(), enabled: session.isSpellCheckerEnabled(),
      arguments: owner.webContents.getLastWebPreferences().additionalArguments, preferences: owner.webContents.getLastWebPreferences().spellcheck, preferenceKeys: Object.keys(owner.webContents.getLastWebPreferences()), preferenceThen: typeof (owner.webContents.getLastWebPreferences() as unknown as { then?: unknown }).then };
  });
  const path = join(configuration.sessionData, 'Dictionaries', 'en-US-10-2.bdic');
  const { createHash } = await import('node:crypto');
  await testInfo.attach('native-dictionary-source', { body: JSON.stringify({ ...configuration, dictionaryPath: path,
    dictionarySha256: createHash('sha256').update(await readFile(path)).digest('hex') }), contentType: 'application/json' });
  await writing.evaluate(() => { const input = document.createElement('textarea'); input.id = 'native-spelling-control'; input.spellcheck = true; input.lang = 'en-US'; document.body.appendChild(input); });
  await writing.locator('#native-spelling-control').fill(words.join(' '));
  await writing.locator('#native-spelling-control').press('Space');
  const before = await writing.evaluate(words => Promise.all(words.map(async word => ({ word, result: await window.projectSpine!.checkSpelling!(word) }))), words);
  try {
    await electronApp.evaluate(async ({ BrowserWindow }) => {
      const owner = BrowserWindow.getAllWindows().find(window => window.id === 1)!;
      const probe = new BrowserWindow({ title: 'Development spelling diagnostic', width: 500, height: 300,
        webPreferences: { session: owner.webContents.session, spellcheck: true, nodeIntegration: true, contextIsolation: false, sandbox: false } });
      (globalThis as unknown as { nativeSpellingProbe?: import('electron').BrowserWindow }).nativeSpellingProbe = probe;
      await probe.loadURL('data:text/html,<textarea spellcheck="true" lang="en-US"></textarea>');
      probe.show(); probe.focus(); probe.webContents.focus();
      await probe.webContents.executeJavaScript('document.querySelector("textarea").focus()');
      await probe.webContents.insertText('foorrrest qzxvwlj forest xxzzqpa ');
    });
    const sampleNative = () => electronApp.evaluate(async () => {
      const probe = (globalThis as unknown as { nativeSpellingProbe: import('electron').BrowserWindow }).nativeSpellingProbe;
      return await probe.webContents.executeJavaScript('({ results: ["foorrrest","qzxvwlj","forest","xxzzqpa"].map(word => ({word,misspelled:require("electron").webFrame.isWordMisspelled(word),suggestions:require("electron").webFrame.getWordSuggestions(word)})) })');
    });
    const native = await sampleNative();
    const after = await writing.evaluate(words => Promise.all(words.map(async word => ({ word, result: await window.projectSpine!.checkSpelling!(word) }))), words);
    await testInfo.attach('native-and-isolated-spelling', { body: JSON.stringify({ before, native, after }), contentType: 'application/json' });
    expect(after.find(value => value.word === 'foorrrest')!.result.misspelled).toBe(true);
    expect(after.find(value => value.word === 'forest')!.result.misspelled).toBe(false);
  } finally {
    await electronApp.evaluate(() => {
      const state = globalThis as unknown as { nativeSpellingProbe?: import('electron').BrowserWindow };
      state.nativeSpellingProbe?.destroy(); delete state.nativeSpellingProbe;
    });
  }
});

test('Catalog B5 diagnoses dictionary provisioning before offline qualification', async ({ electronApp, page }, testInfo) => {
  const { writing } = await getStage19Windows(electronApp, page);
  const boot = await electronApp.evaluate(({ app, BrowserWindow }) => {
    const owner = BrowserWindow.getAllWindows().find(window => window.id === 1)!;
    owner.webContents.session.enableNetworkEmulation({ offline: true });
    return { packaged: app.isPackaged, appPath: app.getAppPath(), resourcesPath: process.resourcesPath, profile: app.getPath('sessionData'), runtime: process.versions.electron };
  });
  const resources = boot.packaged ? join(boot.resourcesPath, 'dictionaries') : join(boot.appPath, '..', '..', 'resources', 'dictionaries');
  const metadata = JSON.parse(await readFile(join(resources, 'manifest.json'), 'utf8'));
  const { createHash } = await import('node:crypto');
  const verified: Record<string, string> = {};
  for (const name of ['en-US-10-2.bdic', 'LICENSE', 'en-US.aff', 'en-US.dic', 'HUNSPELL-LICENSE']) {
    const hash = createHash('sha256').update(await readFile(join(resources, name))).digest('hex');
    expect(hash).toBe(name === metadata.dictionary ? metadata.sha256 : name === 'LICENSE' ? metadata.licenseSha256 : metadata.localChecker.files[name]);
    verified[name] = hash;
  }
  expect(metadata.localChecker).toMatchObject({ engine: 'nspell', version: '2.1.5', dictionaryVersion: '4.0.0' });
  await electronApp.evaluate(({ BrowserWindow }) => {
    const state = globalThis as unknown as { spellingMarkerControl?: { word: string | null; listener: (event: { preventDefault(): void }, params: { misspelledWord: string }) => void } };
    const listener = (event: { preventDefault(): void }, params: { misspelledWord: string }) => { event.preventDefault(); state.spellingMarkerControl!.word = params.misspelledWord; };
    state.spellingMarkerControl = { word: null, listener };
    BrowserWindow.getAllWindows().find(window => window.id === 1)!.webContents.on('context-menu', listener);
  });
  try {
    // The control uses the actual provider installed in this app frame. It is
    // outside the manuscript menu, so the browser's spelling marker is visible
    // to its native context-menu event rather than intercepted by unit actions.
    await writing.evaluate(() => {
      const input = document.createElement('textarea'); input.id = 'automatic-spelling-control'; input.spellcheck = true; input.lang = 'en-US';
      input.style.cssText = 'position:fixed;left:40px;top:100px;width:260px;height:64px;z-index:2147483647;font:18px serif';
      document.body.appendChild(input);
    });
    const control = writing.locator('#automatic-spelling-control');
    const marker = async () => {
      await electronApp.evaluate(() => { (globalThis as unknown as { spellingMarkerControl: { word: string | null } }).spellingMarkerControl.word = null; });
      await control.click({ button: 'right', position: { x: 16, y: 12 } });
      return electronApp.evaluate(() => (globalThis as unknown as { spellingMarkerControl: { word: string | null } }).spellingMarkerControl.word);
    };
    await control.fill('foorrrest'); await control.press('Space');
    await expect.poll(marker, { timeout: 10_000 }).toBe('foorrrest');
    await control.fill('forest'); await control.press('Space');
    await expect.poll(marker, { timeout: 10_000 }).toBe('');
    await testInfo.attach('offline-spelling-provenance-and-native-marking', { body: JSON.stringify({ boot, metadata, verified, automaticMisspelling: 'foorrrest', correctlySpelledMarker: '' }), contentType: 'application/json' });
  } finally {
    await writing.evaluate(() => document.querySelector('#automatic-spelling-control')?.remove());
    await electronApp.evaluate(({ BrowserWindow }) => {
      const state = globalThis as unknown as { spellingMarkerControl?: { listener: (event: { preventDefault(): void }, params: { misspelledWord: string }) => void } };
      if (state.spellingMarkerControl) BrowserWindow.getAllWindows().find(window => window.id === 1)?.webContents.removeListener('context-menu', state.spellingMarkerControl.listener);
      delete state.spellingMarkerControl;
    });
  }
});

test('Catalog B4 Ideas copies use real Foundation/Outline owners with stale-target guards and durable retry identity', async ({ electronApp, page }, testInfo) => {
  test.setTimeout(90_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-destinations-'));
  try {
    let { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const fixture = await writing.evaluate(async parentPath => {
      const bridge = window.projectSpine!;
      const made = await bridge.createProject({ parentPath, title: 'Manual destinations', operationId: 'destination-project' });
      if (!made.ok) throw new Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation, operationId: 'destination-setup' };
      const unit = await bridge.createUnit!({ ...binding, title: 'Unchanged story', operationId: 'destination-unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      const raw = unit.snapshot.project!.drafts![unit.data.unitId]!;
      const saved = await bridge.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw, markdown: raw + 'The forest remained untouched.\n', submittedProse: 'The forest remained untouched.', operationId: 'destination-source' });
      if (!saved.ok) throw new Error(saved.error.message);
      let ideas = await window.ideation!.get({ ...binding, operationId: 'get-ideas' });
      if (!ideas.ok) throw new Error(ideas.error.message);
      const ids: string[] = [];
      for (const text of ['The gate remembers every visitor.', 'The river forgets every name.']) {
        ideas = await window.ideation!.captureSeed({ ...binding, expectedRevision: ideas.data.document.revision, title: 'Same idea name', body: text, kind: 'fragment', tags: [], protected: false });
        if (!ideas.ok) throw new Error(ideas.error.message);
        ids.push(ideas.data.document.seeds.at(-1)!.id);
      }
      const branches: string[] = [];
      for (let index = 0; index < ids.length; index += 1) {
        ideas = await window.ideation!.createBranch({ ...binding, expectedRevision: ideas.data.document.revision, name: 'Same direction name', seedIds: [ids[index]!], premise: index ? 'The river forgets every name.' : 'The gate remembers every visitor.', unknowns: [] });
        if (!ideas.ok) throw new Error(ideas.error.message);
        branches.push(ideas.data.document.branches.at(-1)!.id);
      }
      const foundation = await window.storyFoundation!.setAnswer({ ...binding, expectedRevision: 0, questionId: 'aboutness', posture: 'answered', text: 'Original chosen guidance.' });
      if (!foundation.ok) throw new Error(foundation.error.message);
      return { path: binding.projectPath, unitId: unit.data.unitId, branchId: branches[0]!, otherBranchId: branches[1]! };
    }, parent);
    const manuscript = () => readFile(join(fixture.path, 'drafts', `${fixture.unitId}.md`), 'utf8');
    const original = await manuscript();
    const foundation = async () => JSON.parse(await readFile(join(fixture.path, 'story-foundation.json'), 'utf8'));
    const outline = async () => JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    const ideasDisk = async () => JSON.parse(await readFile(join(fixture.path, 'ideation.json'), 'utf8'));
    const showIdeas = async () => {
      await showCommandInWriting(writing); await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
      await writing.getByRole('button', { name: 'Ideas', exact: true }).click();
    };
    await writing.reload(); await showIdeas();
    const branch = () => writing.getByTestId(`idea-branch-${fixture.branchId}`);
    await expect(branch().getByRole('blockquote', { name: 'Current Foundation guidance' })).toHaveText('Original chosen guidance.');
    await branch().getByRole('button', { name: 'Preview destination' }).click();
    await expect(branch().getByRole('button', { name: 'Send to Story Foundation' })).toBeEnabled();
    await branch().getByRole('button', { name: 'Close destination preview without sending' }).click();
    await expect(branch().getByRole('button', { name: 'Send to Story Foundation' })).toHaveCount(0);
    expect((await foundation()).entries[0].versions).toHaveLength(1);
    expect(await manuscript()).toBe(original);
    await branch().getByRole('button', { name: 'Preview destination' }).click();
    await branch().getByRole('button', { name: 'Send to Story Foundation' }).waitFor({ state: 'visible' });
    await writing.evaluate(async () => {
      const state = await window.projectSpine!.getSession(), binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'intervening-guidance' };
      const current = await window.storyFoundation!.get(binding);
      if (!current.ok) throw new Error(current.error.message);
      const result = await window.storyFoundation!.setAnswer({ ...binding, expectedRevision: current.data.document.revision, questionId: 'aboutness', posture: 'answered', text: 'Later deliberate guidance.' });
      if (!result.ok) throw new Error(result.error.message);
    });
    await branch().getByRole('button', { name: 'Send to Story Foundation' }).click();
    await expect(writing.getByText('Story Foundation changed after this preview. Prepare it again before replacing guidance.', { exact: true })).toBeVisible();
    expect((await foundation()).entries[0].versions.at(-1).text).toBe('Later deliberate guidance.');
    await expect(branch().getByRole('blockquote', { name: 'Current Foundation guidance' })).toHaveText('Later deliberate guidance.');
    await branch().getByRole('button', { name: 'Preview destination' }).click();
    await branch().getByRole('button', { name: 'Send to Story Foundation' }).click();
    await expect.poll(async () => (await foundation()).entries[0].versions.at(-1).text).toBe('The gate remembers every visitor.');
    const foundationVersions = (await foundation()).entries[0].versions.length;
    const foundationPackageId = (await foundation()).entries[0].versions.at(-1).sourcePromotionId;
    expect(foundationPackageId).toBeTruthy();
    await branch().getByRole('button', { name: 'Send to Story Foundation' }).click();
    await expect(writing.getByText(/This preview was already copied. Newer author guidance was preserved./)).toBeVisible();
    expect((await foundation()).entries[0].versions.length).toBe(foundationVersions);
    await writing.evaluate(async () => {
      const state = await window.projectSpine!.getSession(), binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'author-guidance-after-copy' };
      const current = await window.storyFoundation!.get(binding);
      if (!current.ok) throw new Error(current.error.message);
      const changed = await window.storyFoundation!.setAnswer({ ...binding, expectedRevision: current.data.document.revision, questionId: 'aboutness', posture: 'answered', text: 'Author guidance after the copy.' });
      if (!changed.ok) throw new Error(changed.error.message);
    });
    await branch().getByRole('button', { name: 'Send to Story Foundation' }).click();
    await expect(branch().getByRole('blockquote', { name: 'Current Foundation guidance' })).toHaveText('Author guidance after the copy.');
    expect((await foundation()).entries[0].versions.length).toBe(foundationVersions + 1);
    expect((await foundation()).entries[0].versions.at(-2).sourcePromotionId).toBe(foundationPackageId);
    await branch().getByLabel('Send to', { exact: true }).selectOption('outline');
    await branch().getByRole('button', { name: 'Preview destination' }).click();
    await branch().getByRole('button', { name: 'Send to Outline', exact: true }).click();
    await expect(writing.getByText('The accepted idea was written as an author-owned Living Outline note. Open Outline to review it.', { exact: true })).toBeVisible();
    const committedOutline = await outline();
    expect(committedOutline.items).toHaveLength(1);
    const noteId = committedOutline.items[0].id;
    expect((await outline()).items[0]).toMatchObject({ body: 'The gate remembers every visitor.', manuscriptUnitId: null, sourcePromotionId: expect.any(String) });
    expect(await manuscript()).toBe(original);
    const restarted = await restartElectronApp(electronApp);
    ({ writing } = await getStage19Windows(restarted, await restarted.firstWindow()));
    await openProgram7Project(writing, fixture.path); await showIdeas();
    await branch().getByLabel('Send to', { exact: true }).selectOption('outline');
    await branch().getByRole('button', { name: 'Send to Outline', exact: true }).click();
    await expect(writing.getByText(/This preview was already copied. Its current Note was preserved./)).toBeVisible();
    expect((await outline()).items).toHaveLength(1); expect((await outline()).items[0].id).toBe(noteId);
    const changed = await writing.evaluate(async branchId => {
      const state = await window.projectSpine!.getSession(), binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'change-premise-after-preview' };
      const current = await window.ideation!.get(binding);
      if (!current.ok) throw new Error(current.error.message);
      const next = await window.ideation!.addPremiseVersion({ ...binding, expectedRevision: current.data.document.revision, branchId, text: 'The gate remembers only a promise.', unresolvedAreas: [] });
      if (!next.ok) throw new Error(next.error.message);
      return next.data.document;
    }, fixture.branchId);
    expect(changed.promotionPackages.length).toBeGreaterThan(0);
    await writing.reload(); await showIdeas();
    await branch().getByLabel('Send to', { exact: true }).selectOption('outline');
    // Select the earlier previewed text explicitly: it remains historical, but cannot be sent.
    await branch().getByLabel('Text to preview').fill('The gate remembers every visitor.');
    await expect(branch().getByRole('button', { name: 'Send to Outline', exact: true })).toBeDisabled();
    await expect(branch().getByText('The preview source changed. Prepare a fresh preview before sending.', { exact: true })).toBeVisible();
    expect((await ideasDisk()).branches.find((item: { id: string }) => item.id === fixture.otherBranchId).premiseVersions).toHaveLength(1);
    expect((await outline()).items).toHaveLength(1); expect(await manuscript()).toBe(original);
    await writing.screenshot({ path: testInfo.outputPath('catalog-manual-destinations.png') });
  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B3 manual concern keeps paired evidence, guarded alternatives, author decision and History identity', async ({ electronApp, page }, testInfo) => {
  test.setTimeout(90_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-concern-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const bodies = ['The gate was sealed.', 'The gate stood open.'];
    const fixture = await writing.evaluate(async ({ parentPath, bodies }) => {
      const bridge = window.projectSpine!;
      const made = await bridge.createProject({ parentPath, title: 'Paired evidence story', operationId: 'concern-project' });
      if (!made.ok) throw new Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation };
      const ids: string[] = [];
      for (let index = 0; index < bodies.length; index += 1) {
        const unit = await bridge.createUnit!({ ...binding, title: `Gate passage ${index + 1}`, operationId: `concern-unit-${index}` });
        if (!unit.ok) throw new Error(unit.error.message);
        ids.push(unit.data.unitId);
        const raw = unit.snapshot.project!.drafts![unit.data.unitId]!;
        const saved = await bridge.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw, markdown: raw + bodies[index] + '\n', submittedProse: bodies[index], operationId: `concern-source-${index}` });
        if (!saved.ok) throw new Error(saved.error.message);
      }
      await bridge.selectUnit({ ...binding, unitId: ids[0]!, operationId: 'concern-select' });
      return { path: binding.projectPath, ids };
    }, { parentPath: parent, bodies });
    const body = async (index: number) => extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${fixture.ids[index]}.md`), 'utf8'));
    const concerns = async () => JSON.parse(await readFile(join(fixture.path, 'feedback-notes.json'), 'utf8'));
    const candidates = async () => JSON.parse(await readFile(join(fixture.path, 'revision-candidates.json'), 'utf8'));
    const anchor = await buildLivingOutlineSourceAnchor(fixture.ids[0]!, bodies[0]!, 0, bodies[0]!.length);
    const noteId = await writing.evaluate(async anchor => {
      const state = await window.projectSpine!.getSession(), binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'concern-note' };
      const outline = await window.livingOutline!.get(binding);
      if (!outline.ok) throw new Error(outline.error.message);
      const made = await window.livingOutline!.createItem({ ...binding, expectedRevision: outline.data.document.revision,
        label: 'Gate intention', body: 'Retain the gate planning thought.', kind: 'fragment', state: 'authored', noteScope: 'passage', sourceWasSpan: true,
        manuscriptUnitId: anchor.unitId, sourceAnchor: anchor, sourceAnchors: [anchor] });
      if (!made.ok) throw new Error(made.error.message);
      return made.data.document.items[0]!.id;
    }, anchor);
    await writing.reload(); await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    await writing.getByRole('region', { name: 'Story tools' }).getByRole('button', { name: 'Keep open', exact: true }).click();
    await writing.locator('summary').filter({ hasText: /^Manual concerns ·/u }).click();
    const capture = writing.getByRole('region', { name: 'Manual concern capture' });
    await capture.getByLabel('Manual concern', { exact: true }).fill('Decide how the gate opened between these passages.');
    for (let index = 0; index < 2; index += 1) {
      if (index) await writing.evaluate(async unitId => {
        const state = await window.projectSpine!.getSession();
        const selected = await window.projectSpine!.selectUnit({ projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, unitId, operationId: 'concern-select-related' });
        if (!selected.ok) throw new Error(selected.error.message);
      }, fixture.ids[index]!);
      const editor = writing.getByRole('textbox', { name: `Manuscript editor: Gate passage ${index + 1}`, exact: true });
      await editor.click(); await editor.press('Control+Home'); await editor.press('Control+Shift+End');
      await capture.getByRole('button', { name: index ? 'Attach selected related evidence' : 'Attach selected primary evidence' }).click();
    }
    await expect(capture.locator('blockquote').nth(0)).toHaveText(bodies[0]!);
    await expect(capture.locator('blockquote').nth(1)).toHaveText(bodies[1]!);
    await capture.getByRole('button', { name: 'Keep manual concern' }).click();
    await expect(capture.getByText('Concern kept in Outline, Review and Revision Desk.', { exact: true })).toBeVisible();
    await expect.poll(async () => (await concerns()).notes.length).toBe(1);
    const concernId = (await concerns()).notes[0].id;
    expect((await concerns()).notes[0]).toMatchObject({ provenance: { source: 'manual' }, relatedSources: [{ unitId: fixture.ids[1] }] });
    expect((await concerns()).notes[0].relatedSources[0]).not.toHaveProperty('text');
    const [primarySource, relatedSource] = revisionItemSources((await concerns()).notes[0]);
    const neighboringConcernId = await writing.evaluate(async ({ source, related, projectPath }) => {
      const bridge = window.feedbackNotes!, state = await window.projectSpine!.getSession();
      const binding = { projectId: state.project!.projectId, projectPath, generation: state.generation, operationId: 'second-manual-concern' };
      const notes = await bridge.listRevisionItems!({ ...binding, scope: 'all' });
      if (!notes.ok) throw new Error(notes.error.message);
      const created = await bridge.createRevisionItem!({ ...binding, expectedRevision: notes.revision, source: source!, relatedSources: [related!], manual: true, body: 'Decide whether Julian should notice the change.' });
      if (!created.ok) throw new Error(created.error.message);
      return created.data.id;
    }, { source: primarySource, related: relatedSource, projectPath: fixture.path });
    expect(neighboringConcernId).not.toBe(concernId);
    await writing.reload(); await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    await writing.getByRole('region', { name: 'Story tools' }).getByRole('button', { name: 'Keep open', exact: true }).click();
    await expect(writing.locator(`[data-outline-concern-id="${concernId}"]`)).toHaveCount(2);
    await expect(writing.locator(`[data-outline-concern-id="${neighboringConcernId}"]`)).toHaveCount(2);
    await writing.locator(`[data-outline-concern-id="${concernId}"]`).first().click();
    const linked = writing.locator('.writing-outline-concern__sources');
    await expect(linked.getByRole('button', { name: 'Read primary evidence', exact: true })).toBeVisible();
    await expect(linked.getByRole('button', { name: 'Read related evidence', exact: true })).toBeVisible();
    await linked.getByRole('button', { name: 'Read related evidence', exact: true }).click();
    await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toBe(bodies[1]);
    const outlineFile = join(fixture.path, 'living-outline.json');
    const beforeMergeNote = JSON.parse(await readFile(outlineFile, 'utf8')).items.find((item: { id: string }) => item.id === noteId);
    const beforeMergeConcerns = (await concerns()).notes;
    for (let index = 0; index < 2; index += 1) {
      const sourceRow = writing.locator('[data-writing-outline-spans]').filter({
        has: writing.getByRole('button', { name: bodies[index]!, exact: true }),
      });
      await sourceRow.getByRole('button', { name: bodies[index]!, exact: true }).click();
      await writing.getByRole('button', { name: 'Pin', exact: true }).click();
      await expect(writing.locator('[data-writing-group-id]')).toHaveCount(index + 1);
    }
    const groups = writing.locator('[data-writing-group-id]');
    await groups.nth(0).locator('summary').filter({ hasText: '⋯' }).click();
    await groups.nth(1).locator('summary').filter({ hasText: '⋯' }).click();
    await groups.nth(0).getByRole('checkbox', { name: /^Compare / }).check();
    await groups.nth(1).getByRole('checkbox', { name: /^Compare / }).check();
    await writing.getByRole('button', { name: 'Join selected units' }).click();
    await expect.poll(async () => JSON.parse(await readFile(outlineFile, 'utf8')).writingGroups.length).toBe(1);
    expect(JSON.parse(await readFile(outlineFile, 'utf8')).items.find((item: { id: string }) => item.id === noteId)).toEqual(beforeMergeNote);
    expect((await concerns()).notes).toEqual(beforeMergeConcerns);
    await writing.reload();
    await openWritingStudioRail(writing, 'Story');
    await expect(writing.locator('[data-writing-group-id]')).toHaveCount(1);
    await expect(writing.locator(`[data-outline-concern-id="${concernId}"]`)).toHaveCount(1);
    await writing.locator(`[data-outline-concern-id="${concernId}"]`).click();
    await expect(linked.getByRole('button', { name: 'Read primary evidence', exact: true })).toBeVisible();
    await expect(linked.getByRole('button', { name: 'Read related evidence', exact: true })).toBeVisible();
    await linked.getByRole('button', { name: 'Mark intentional' }).click();
    await expect(writing.locator(`[data-outline-concern-id="${concernId}"]`)).toHaveCount(0);
    await expect(writing.locator(`[data-outline-concern-id="${neighboringConcernId}"]`)).toHaveCount(1);
    await expect.poll(async () => (await concerns()).notes.find((item: { id: string }) => item.id === concernId).lifecycle).toBe('intentional');
    await writing.reload();
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.getByRole('button', { name: 'History', exact: true }).click();
    const historyConcern = writing.getByTestId(`program7-history-item-feedback-note:${concernId}`);
    await historyConcern.getByText('Decision history', { exact: true }).click();
    await expect(historyConcern.getByText(/Marked intentional by you/)).toBeVisible();
    await expect(historyConcern.locator('blockquote[aria-label="Current related evidence"]').last()).toHaveText(bodies[1]!);
    await historyConcern.getByRole('button', { name: 'Reopen concern' }).click();
    try {
      await expect.poll(async () => (await concerns()).notes.find((item: { id: string }) => item.id === concernId).lifecycle).toBe('active');
    } catch (error) {
      await testInfo.attach('reopen-visible-state', { body: await writing.locator('body').innerText(), contentType: 'text/plain' });
      throw error;
    }
    await expect(historyConcern.getByRole('button', { name: 'Reopen concern' })).toHaveCount(0);
    await historyConcern.getByText('Decision history', { exact: true }).click();
    await expect(historyConcern.getByText(/Reopened by you/)).toBeVisible();
    await expect(historyConcern.getByText(/Marked intentional by you/)).toBeVisible();
    await showWritingInWriting(writing);
    if (!(await writing.locator('#stage19-writing-rail-left').isVisible())) await openWritingStudioRail(writing, 'Story');
    await writing.locator(`[data-outline-concern-id="${concernId}"]`).click();
    await linked.getByRole('button', { name: 'Open in Review' }).click();
    const card = writing.locator(`[data-concern-id="${concernId}"]:visible`);
    await expect(card.getByRole('button', { name: 'Read related evidence' })).toBeEnabled();
    await expect(card.locator('blockquote[aria-label="Current primary evidence"]')).toHaveText(bodies[0]!);
    await expect(card.locator('blockquote[aria-label="Current related evidence"]')).toHaveText(bodies[1]!);
    await card.getByRole('button', { name: 'Consider a revision' }).click();
    await writing.getByRole('button', { name: 'Revision Desk', exact: true }).click();
    await writing.getByLabel('Proposed text', { exact: true }).fill('Mara unsealed the gate.');
    await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
    await expect(writing.getByTestId('revision-comparison')).toBeVisible();
    const candidateId = (await candidates()).candidates[0].id;
    expect((await candidates()).candidates[0]).toMatchObject({ concernId, sourceAnchor: { unitId: fixture.ids[0], selectionStart: 0, selectionEnd: bodies[0]!.length } });
    await writing.getByRole('checkbox', { name: 'This replaces the entire saved section. I intend to replace this entire section.' }).check();
    const setRelated = async (text: string) => writing.evaluate(async ({ unitId, text, before }) => {
      const bridge = window.projectSpine!, state = await bridge.getSession(), raw = state.project!.drafts![unitId]!;
      if (!raw.includes(before)) throw new Error('Related fixture source no longer matches.');
      const saved = await bridge.saveUnit!({ projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation,
        operationId: `change-related-${text.length}`, unitId, expectedMarkdown: raw, markdown: raw.replace(before, text), submittedProse: text });
      if (!saved.ok) throw new Error(saved.error.message);
    }, { unitId: fixture.ids[1]!, text, before: await body(1) });
    await setRelated('The distant sea was silent.');
    await writing.getByRole('button', { name: 'Apply all of this alternative' }).click();
    await expect(writing.getByText('A concern evidence source changed or became unavailable. No revision was applied.', { exact: true })).toBeVisible();
    expect(await body(0)).toBe(bodies[0]);
    await setRelated(bodies[1]!);
    await writing.getByRole('button', { name: 'Apply all of this alternative' }).click();
    await expect.poll(() => body(0)).toBe('Mara unsealed the gate.');
    await showWritingInWriting(writing);
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await writing.getByRole('button', { name: 'Undo applied revision', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(() => body(0)).toBe(bodies[0]);
    const outlineAfterUndo = JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    expect(outlineAfterUndo.items[0]).toMatchObject({ id: noteId, body: 'Retain the gate planning thought.', sourceAnchor: { selectionStart: 0, selectionEnd: bodies[0]!.length } });
    expect((await candidates()).candidates[0].lifecycle).toBe('accepted');
    await writing.getByRole('button', { name: 'Redo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(() => body(0)).toBe('Mara unsealed the gate.');
    const revisedEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Gate passage 1', exact: true });
    await revisedEditor.press('Control+End'); await revisedEditor.pressSequentially(' A later author choice.');
    await expect(writing.getByRole('button', { name: 'Undo applied revision', exact: true })).toHaveCount(0);
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(() => body(0)).toBe('Mara unsealed the gate. A later author choice.');
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(() => body(0)).toBe('Mara unsealed the gate.');
    await showCommandInWriting(writing); await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await card.getByRole('button', { name: 'Check source availability' }).click();
    await card.getByRole('button', { name: 'I’m satisfied — mark resolved', exact: true }).click();
    await expect.poll(async () => (await concerns()).notes[0].lifecycle).toBe('resolved');
    expect((await concerns()).notes.find((item: { id: string }) => item.id === neighboringConcernId).lifecycle).toBe('active');
    await writing.getByRole('button', { name: 'History', exact: true }).click();
    const historicalConcern = writing.getByTestId(`program7-history-item-feedback-note:${concernId}`);
    const historicalCandidate = writing.getByTestId(`program7-history-item-revision-candidate:${candidateId}`);
    await expect(historicalConcern).toContainText(concernId);
    await expect(historicalCandidate).toContainText(concernId);
    await historicalCandidate.getByRole('button', { name: 'Review linked concern' }).click();
    await expect(card).toBeVisible(); await expect(card).toBeFocused(); await expect(card).toContainText('Finished');
    expect(await body(1)).toBe(bodies[1]);
    await writing.screenshot({ path: testInfo.outputPath('catalog-paired-concern-history.png') });
    await writing.reload();
    expect((await candidates()).candidates[0]).toMatchObject({ id: candidateId, concernId, lifecycle: 'accepted' });
    expect((await concerns()).notes[0]).toMatchObject({ id: concernId, lifecycle: 'resolved' });
    expect(await body(0)).toBe('Mara unsealed the gate.');
    await showWritingInWriting(writing);
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Gate passage 1', exact: true });
    await editor.click(); await editor.press('Control+Home'); await editor.press('Control+Shift+End');
    await showCommandInWriting(writing); await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.getByLabel('Alternative name', { exact: true }).fill('Deliberately remove this passage.');
    await writing.getByRole('checkbox', { name: 'Propose deleting the exact linked passage' }).check();
    await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
    const deletion = writing.getByTestId('revision-comparison').filter({ hasText: 'Deliberately remove this passage.' });
    await expect(deletion).toContainText('No replacement words will be inserted.');
    await deletion.getByRole('checkbox', { name: 'This replaces the entire saved section. I intend to replace this entire section.' }).check();
    await deletion.getByRole('button', { name: 'Delete this linked passage' }).click();
    await expect.poll(() => body(0)).toBe('');
    expect(await body(1)).toBe(bodies[1]);
    await expect.poll(async () => (await candidates()).candidates.at(-1).lifecycle).toBe('accepted');
    expect((await candidates()).candidates.at(-1)).toMatchObject({ deleteSource: true, candidateText: '', lifecycle: 'accepted' });
    await showWritingInWriting(writing);
    await writing.getByRole('button', { name: 'Undo applied revision', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(() => body(0)).toBe('Mara unsealed the gate.');
    expect((await candidates()).candidates.at(-1).lifecycle).toBe('accepted');
  } finally { await removeTemporaryDirectory(parent); }
});

test('Catalog B2 Notebook persists independent identities, guards drafts and restores only a deleted Note', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-notebook-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const fixture = await writing.evaluate(async parentPath => {
      const bridge = window.projectSpine!;
      const made = await bridge.createProject({ parentPath, title: 'Catalog Notebook', operationId: 'notebook-create' });
      if (!made.ok) throw new Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation };
      const unit = await bridge.createUnit!({ ...binding, title: 'Notebook story', operationId: 'notebook-unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      const source = 'The forest kept its winter promise.';
      const raw = unit.snapshot.project!.drafts![unit.data.unitId]!;
      const saved = await bridge.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw, markdown: raw + source + '\n', submittedProse: source, operationId: 'notebook-source' });
      if (!saved.ok) throw new Error(saved.error.message);
      return { path: binding.projectPath, id: unit.data.unitId };
    }, parent);
    const disk = () => readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8');
    const original = await disk();
    const metadata = async () => JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    const showNotebook = async () => {
      await openWritingStudioRail(writing, 'Story');
      await writing.getByRole('region', { name: 'Story tools' }).getByRole('button', { name: 'Keep open', exact: true }).click();
      await writing.locator('summary').filter({ hasText: /^Notebook ·/u }).click();
    };
    await writing.reload(); await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await showNotebook();
    const notebook = writing.getByRole('region', { name: 'All-story Notebook' });
    const add = async (scope: 'whole-story' | 'unattached', body: string) => {
      await notebook.getByRole('button', { name: 'New Notebook Note' }).click();
      await notebook.getByLabel('Notebook Note name', { exact: true }).fill('Same title');
      await notebook.getByLabel('Notebook Note text', { exact: true }).fill(body);
      await notebook.getByLabel('New Note scope').selectOption(scope);
      await notebook.getByRole('button', { name: 'Keep Notebook Note' }).click();
      await expect(notebook.getByRole('group', { name: 'Notebook Note editor' })).toHaveCount(0);
      return (await metadata()).items.find((item: { body: string }) => item.body === body).id as string;
    };
    const first = await add('whole-story', 'First whole-story thought');
    const second = await add('unattached', 'Independent second thought');
    const select = (id: string) => notebook.locator(`[data-notebook-note-id="${id}"]`).getByRole('button').click();
    await notebook.getByLabel('Search Notes').fill('second thought');
    await expect(notebook.locator('[data-notebook-note-id]')).toHaveCount(1);
    await notebook.getByLabel('Search Notes').fill('');
    await select(second);
    await notebook.getByLabel('Notebook Note text', { exact: true }).fill('Unsaved revision');
    await notebook.getByRole('button', { name: 'Delete Notebook Note' }).click();
    await expect(notebook.getByText('Keep or discard this Note’s unsaved edits before deleting it.')).toBeVisible();
    expect((await metadata()).items).toHaveLength(2);
    // Closing the rail must retain this project-bound draft in its owning view.
    await writing.getByRole('region', { name: 'Story tools' }).getByRole('button', { name: 'Close', exact: true }).click();
    await openWritingStudioRail(writing, 'Story');
    const summary = writing.locator('summary').filter({ hasText: /^Notebook ·/u });
    if (!(await summary.evaluate(node => (node.parentElement as HTMLDetailsElement).open))) await summary.click();
    await expect(notebook.getByLabel('Notebook Note text', { exact: true })).toHaveValue('Unsaved revision');
    await notebook.getByRole('button', { name: 'Keep Notebook Note' }).click();
    await expect.poll(async () => (await metadata()).items.find((item: { id: string }) => item.id === second).body).toBe('Unsaved revision');
    await select(second); await notebook.getByRole('button', { name: 'Delete Notebook Note' }).click();
    await expect.poll(async () => (await metadata()).items.length).toBe(1);
    const third = await add('whole-story', 'Later independent thought');
    await notebook.getByRole('button', { name: 'Undo Note deletion' }).click();
    await expect.poll(async () => (await metadata()).items.length).toBe(3);
    expect((await metadata()).items.map((item: { id: string }) => item.id)).toEqual([first, third, second]);
    expect(await disk()).toBe(original);
    await writing.reload(); await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled(); await showNotebook();
    await select(second);
    await expect(notebook.getByLabel('Notebook Note text', { exact: true })).toHaveValue('Unsaved revision');
    await expect(notebook.getByText('Deliberately unattached Note', { exact: true })).toHaveCount(2);
    await expect(notebook.getByRole('button', { name: 'Undo Note deletion' })).toBeDisabled();
    expect((await metadata()).items.find((item: { id: string }) => item.id === first).noteScope).toBe('whole-story');
    expect(await disk()).toBe(original);
    await writing.screenshot({ path: testInfo.outputPath('catalog-notebook.png') });
  } finally { await removeTemporaryDirectory(parent); }
});

test('B1 writer units, Notes, rails, Find/Replace, follow and Back use the real desktop owners', async ({
  electronApp,
  page,
}, testInfo) => {
  test.setTimeout(150_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-writer-b1-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1000 });
    await writing.bringToFront();
    const fixture = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Forest writer foundation',
        operationId: 'b1-create',
      });
      if (!created.ok) throw new Error(created.error.message);
      let current = created.snapshot;
      const bodies = [
        'forest\n\nmoon glass winter\n\n' +
          Array.from(
            { length: 70 },
            (_, index) => `Idea ${index + 1}: Lena follows the river. A red shirt marks the path.`,
          ).join('\n\n'),
        'Hero’s journey. Bring the clock home.\n\nThe last shirt becomes a reminder.',
      ];
      const ids: string[] = [];
      for (const [index, title] of ['Forest ideas', 'River return'].entries()) {
        const binding = {
          projectId: current.project!.projectId,
          projectPath: current.project!.path,
          generation: current.generation,
        };
        const made = await bridge.createUnit!({
          ...binding,
          title,
          operationId: `b1-unit-${index}`,
        });
        if (!made.ok) throw new Error(made.error.message);
        current = made.snapshot;
        const id = made.data.unitId;
        ids.push(id);
        const raw = current.project!.drafts![id]!;
        const saved = await bridge.saveUnit!({
          ...binding,
          unitId: id,
          expectedMarkdown: raw,
          markdown: raw + bodies[index] + '\n',
          submittedProse: bodies[index]!,
          operationId: `b1-save-${index}`,
        });
        if (!saved.ok) throw new Error(saved.error.message);
        current = saved.snapshot;
      }
      const selected = await bridge.selectUnit({
        projectId: current.project!.projectId,
        projectPath: current.project!.path,
        generation: current.generation,
        unitId: ids[0]!,
        operationId: 'b1-select-first',
      });
      if (!selected.ok) throw new Error(selected.error.message);
      return { path: current.project!.path, ids, bodies };
    }, parent);
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Forest ideas' });
    await expect(editor).toContainText('forest');
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    const originalFiles = await Promise.all(
      fixture.ids.map((id) => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')),
    );

    // Real selection + toolbar formatting, Undo and Redo preserve neighboring text.
    await editor.click();
    await editor.press('Control+Home');
    await editor.press('Control+Shift+ArrowRight');
    await expect
      .poll(() => writing.evaluate(() => window.getSelection()?.toString()))
      .toMatch(/^forest/);
    await writing.getByRole('button', { name: 'Bold', exact: true }).click();
    await expect(editor.locator('strong')).toHaveText('forest');
    await expect(editor.locator('strong')).toHaveCSS('font-weight', '700');
    expect(await editor.innerText()).not.toContain('*');
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(editor.locator('strong')).toHaveCount(0);

    // Beginning/end Pin spans both storage sections but creates one writer unit.
    await editor.press('Control+Home');
    await writing.getByRole('button', { name: 'Pin', exact: true }).click();
    await expect(writing.getByText('Click the beginning of the unit.')).toBeVisible();
    await editor.dispatchEvent('pointerup');
    await expect(writing.getByText('First pin placed. Click its end.')).toBeVisible();
    const end = writing.locator('[data-writing-source]');
    await end.evaluate((source) => {
      const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
      let last: Node | null = null;
      for (let node = walker.nextNode(); node; node = walker.nextNode())
        if (!node.parentElement?.closest('[data-writing-decoration]')) last = node;
      if (!last) throw new Error('Missing source');
      const range = document.createRange();
      range.setStart(last, last.textContent!.length);
      range.collapse(true);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
    });
    await end.dispatchEvent('pointerup');
    await expect(writing.getByText('Writing units and Notes saved.')).toBeVisible();
    const pinned = JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    expect(pinned.writingGroups).toHaveLength(1);
    expect(pinned.writingGroups[0].spans).toHaveLength(2);
    expect(
      await Promise.all(
        fixture.ids.map((id) => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')),
      ),
    ).toEqual(originalFiles);

    await openWritingStudioRail(writing, 'Story');
    const rail = writing.getByRole('region', { name: 'Story tools' });
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    await editor.press('Escape');
    await expect(rail.getByRole('button', { name: 'Locked open' })).toBeVisible();
    const outline = writing.getByRole('list', { name: 'Writing units and unpinned passages' });
    await expect(outline.locator(':scope > li')).toHaveCount(1);
    for (const text of [
      'The forest should feel strange.',
      'Remember Tomas.',
      'The return changes home.',
    ]) {
      const menu = outline.locator('[data-writing-group-id] > details.stage19-outline-row-actions');
      if (!(await menu.evaluate(el => el.hasAttribute('open')))) await menu.locator('summary').first().click();
      await menu.getByRole('button', { name: 'Add Note', exact: true }).click();
      await writing.getByLabel('Note text', { exact: true }).fill(text);
      await expect(writing.getByRole('button', { name: 'Keep Note' })).toBeEnabled();
      await writing.getByRole('button', { name: 'Keep Note' }).click();
      await expect(writing.getByRole('heading', { name: 'Edit Note' })).toBeVisible();
      await writing.getByRole('button', { name: 'Close Note' }).click();
    }

    await outline.getByRole('button', { name: /^Rename / }).click();
    await outline.getByLabel('Unit name', { exact: true }).fill('Forest and return');
    await outline.getByRole('button', { name: 'Save unit name' }).click();
    await expect(
      outline.getByRole('button', { name: 'Forest and return', exact: true }),
    ).toBeVisible();
    expect(
      await Promise.all(
        fixture.ids.map((id) => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')),
      ),
    ).toEqual(originalFiles);
    const notes = JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    expect(notes.items).toHaveLength(3);
    for (const item of notes.items) expect(item.sourceAnchors).toHaveLength(2);
    const pencil = writing.getByRole('button', { name: 'Open Note: Remember Tomas.' }).first();
    await pencil.click();
    await expect(writing.getByLabel('Note text', { exact: true })).toHaveValue('Remember Tomas.');
    await writing.getByRole('button', { name: 'Close Note' }).click();

    await writing.getByRole('button', { name: 'Find & replace', exact: true }).click();
    await writing.getByLabel('Find', { exact: true }).fill('shirt');
    await writing.getByLabel('Replace with', { exact: true }).fill('blouse');
    await writing.getByRole('button', { name: 'Replace all 71 matches', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.getByText('Writing units and Notes saved.')).toBeVisible();
    for (const id of fixture.ids)
      await expect.poll(() => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')).toContain('blouse');

    await writing.getByRole('button', { name: 'Undo replacement', exact: true }).click();
    await expect(editor).toContainText('red shirt');
    await writing.getByRole('button', { name: 'Close search' }).click();

    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.getByText('Writing units and Notes saved.')).toBeVisible();
    for (const id of fixture.ids)
      await expect.poll(() => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')).not.toContain('blouse');
    await expect(writing.getByRole('button', { name: 'Save writing', exact: true })).toBeDisabled();
    // Many rows exercise inner-outline scrolling against real native geometry.
    const paragraphs = [...fixture.bodies[0]!.matchAll(/[^\n]+/gu)];
    const groups = await Promise.all(
      paragraphs.map(async (match, index) => ({
        id: `row-${index}`,
        label: match[0].slice(0, 100),
        spans: [
          await buildLivingOutlineSourceAnchor(
            fixture.ids[0]!,
            fixture.bodies[0]!,
            match.index!,
            match.index! + match[0].length,
          ),
        ],
      })),
    );
    groups.push({
      id: 'last',
      label: 'River return',
      spans: [
        await buildLivingOutlineSourceAnchor(
          fixture.ids[1]!,
          fixture.bodies[1]!,
          0,
          fixture.bodies[1]!.length,
        ),
      ],
    });
    await writing.evaluate(async (groups) => {
      const snapshot = await window.projectSpine!.getSession();
      const bridge = window.livingOutline!;
      const binding = {
        operationId: 'b1-row-fixture',
        projectId: snapshot.project!.projectId,
        projectPath: snapshot.project!.path,
        generation: snapshot.generation,
      };
      const current = await bridge.get(binding);
      if (!current.ok) throw new Error(current.error.message);
      const saved = await bridge.replaceWritingState!({
        ...binding,
        expectedRevision: current.data.document.revision,
        groups,
        noteAnchors: [],
      });
      if (!saved.ok) throw new Error(saved.error.message);
    }, groups);
    await writing.reload();
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    await writing.locator('[data-manuscript-scroll-owner]').evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      node.dispatchEvent(new Event('scroll'));
    });
    await expect(outline.locator(':scope > li').last()).toBeInViewport();
    await writing.getByRole('button', { name: 'Open Command Center here' }).click();
    await expect(writing.getByRole('heading', { name: 'Current tool: Review' })).toBeVisible();
    await writing.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(writing.getByRole('region', { name: 'Writing Studio' })).toBeVisible();
    await expect(rail.getByRole('button', { name: 'Locked open' })).toBeVisible();
    await writing.getByRole('button', { name: 'Open Companion', exact: true }).hover();
    const companion = writing.getByRole('region', { name: 'Companion', exact: true });
    await expect(companion.getByRole('textbox', { name: 'Ask Black Skies' })).toBeVisible();
    await companion.getByRole('button', { name: 'Keep open', exact: true }).click();
    await companion.getByRole('textbox', { name: 'Ask Black Skies' }).press('Escape');
    await expect(companion.getByRole('button', { name: 'Locked open' })).toBeVisible();
    await companion.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(companion).not.toBeVisible();
    await expect(rail.getByRole('button', { name: 'Locked open' })).toBeVisible();
    await writing.screenshot({ path: testInfo.outputPath('writer-foundation.png') });

    // Reload verifies durable metadata independently of the mounted components.
    await writing.reload();
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    await expect(
      writing
        .getByRole('list', { name: 'Writing units and unpinned passages' })
        .locator(':scope > li'),
    ).toHaveCount(groups.length);
    expect(
      JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8')).items,
    ).toHaveLength(3);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

test.describe('Batch A development-build checks', () => {
  test.use({ preserveTestArtifacts: true });

  test('Batch A selection, formatting, three search scopes and saved Undo', async ({
    electronApp,
    page,
  }, testInfo) => {
    test.setTimeout(150_000);
    const handoffRoot = process.env.BLACKSKIES_BATCH_A_HANDOFF_DIR;
    const parent = await mkdtemp(join(handoffRoot ?? tmpdir(), 'black-skies-batch-a-'));
    const bodies = [
      'forest\n\nMara wore a red shirt. The red shirt was damp.\nJulian held the glass. Another glass waited.\n\nIdeas: moon glass winter.\n\nLiteral checks: [forest] İ 🌲.',
      'At the river, her red shirt caught the moonlight.\nJulian left the glass behind.\n\nLast line.',
    ];
    try {
      const { writing } = await getStage19Windows(electronApp, page);
      await writing.setViewportSize({ width: 1600, height: 1000 });
      await writing.bringToFront();
      const fixture = await writing.evaluate(
        async ({ parentPath, bodies }) => {
          const bridge = window.projectSpine!;
          const made = await bridge.createProject({
            parentPath,
            title: 'Batch A · Forest and poison',
            operationId: 'batch-a-project',
          });
          if (!made.ok) throw new Error(made.error.message);
          let current = made.snapshot;
          const ids: string[] = [];
          for (const [index, title] of ['Forest ideas', 'River revelation'].entries()) {
            const binding = {
              projectId: current.project!.projectId,
              projectPath: current.project!.path,
              generation: current.generation,
            };
            const unit = await bridge.createUnit!({
              ...binding,
              title,
              operationId: `batch-a-unit-${index}`,
            });
            if (!unit.ok) throw new Error(unit.error.message);
            current = unit.snapshot;
            const id = unit.data.unitId;
            ids.push(id);
            const raw = current.project!.drafts![id]!;
            const saved = await bridge.saveUnit!({
              ...binding,
              unitId: id,
              expectedMarkdown: raw,
              markdown: raw + bodies[index] + '\n',
              submittedProse: bodies[index]!,
              operationId: `batch-a-save-${index}`,
            });
            if (!saved.ok) throw new Error(saved.error.message);
            current = saved.snapshot;
          }
          const selected = await bridge.selectUnit({
            projectId: current.project!.projectId,
            projectPath: current.project!.path,
            generation: current.generation,
            unitId: ids[0]!,
            operationId: 'batch-a-start',
          });
          if (!selected.ok) throw new Error(selected.error.message);
          return { path: current.project!.path, ids };
        },
        { parentPath: parent, bodies },
      );
      const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Forest ideas' });
      const button = (name: string) => writing.getByRole('button', { name, exact: true });
      const selected = () =>
        writing.evaluate(() => {
          const selection = window.getSelection();
          const node = selection?.anchorNode;
          return {
            text: selection?.toString() ?? '',
            offset: selection?.anchorOffset ?? -1,
            unitId: (node instanceof Element ? node : node?.parentElement)?.closest<HTMLElement>(
              '[data-manuscript-unit-id]',
            )?.dataset.manuscriptUnitId,
          };
        });
      const disk = async () =>
        Promise.all(
          fixture.ids.map(async (id) =>
            extractProjectSpineDraftBody(
              await readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8'),
            ),
          ),
        );
      const save = async () => {
        await button('Save writing').click();
        await expect(
          writing.getByText('Writing units and Notes saved.', { exact: true }),
        ).toBeVisible();
        await expect(button('Save writing')).toBeDisabled();
      };
      const firstWord = async () => {
        await editor.click();
        await editor.press('Control+Home');
        await editor.press('Control+Shift+ArrowRight');
        await expect.poll(async () => (await selected()).text).toBe('forest');
      };
      const log: string[] = [];
      const record = (result: string) => {
        log.push(result);
        console.log(result);
      };
      await expect(button('Pin')).toBeEnabled();

      await test.step('A1 visible Bold/Italic, trailing newline, toggle, Undo and Redo', async () => {
        await editor.click();
        await editor.press('Control+Home');
        await editor.press('Shift+ArrowDown');
        await expect.poll(async () => (await selected()).text).toMatch(/^forest\n+$/u);
        await button('Bold').click();
        await expect(editor.locator('strong')).toHaveText('forest');
        await expect(editor.locator('strong')).toHaveCSS('font-weight', '700');
        expect(await editor.innerText()).not.toContain('*');
        await button('Undo').click();
        await expect(editor.locator('strong')).toHaveCount(0);
        await button('Redo').click();
        await expect(editor.locator('strong')).toHaveText('forest');
        await button('Undo').click();
        await firstWord();
        await button('Italic').click();
        await expect(editor.locator('em')).toHaveText('forest');
        await expect(editor.locator('em')).toHaveCSS('font-style', 'italic');
        expect(await editor.innerText()).not.toContain('*');
        await button('Italic').click();
        await expect(editor.locator('em')).toHaveCount(0);
        await firstWord();
        await button('Bold').click();
        await button('Italic').click();
        await expect(editor.locator('strong em, em strong')).toHaveText('forest');
        expect(await editor.innerText()).not.toContain('*');
        await button('Italic').click();
        await expect(editor.locator('strong')).toHaveText('forest');
        await expect(editor.locator('em')).toHaveCount(0);
        await button('Bold').click();
        await expect(editor.locator('strong')).toHaveCount(0);

        // Select prose by native DOM Range, including its trailing space as in
        // the author's drag selection. The assertion is on visible font style.
        await editor.evaluate((element) => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const at = node.textContent?.indexOf('red shirt ') ?? -1;
            if (at < 0) continue;
            const range = document.createRange();
            range.setStart(node, at); range.setEnd(node, at + 10);
            const selection = window.getSelection()!;
            selection.removeAllRanges(); selection.addRange(range);
            const rect = range.getBoundingClientRect();
            element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: rect.right - 1, clientY: rect.top + rect.height / 2, pointerType: 'mouse', isPrimary: true, button: 0 }));
            return;
          }
          throw new Error('Missing red shirt in visible writing');
        });
        await expect.poll(async () => (await selected()).text).toBe('red shirt ');
        await button('Italic').click();
        await expect(editor.locator('em')).toHaveText('red shirt');
        await expect(editor.locator('em')).toHaveCSS('font-style', 'italic');
        expect(await editor.innerText()).not.toContain('*');
        await editor.click();
        await editor.press('Control+Home');
        await editor.press('Control+Shift+ArrowRight');
        await button('Bold').click();
        await expect(editor.locator('strong')).toHaveText('forest');
        await save();
        const formatted = bodies[0]!.replace(/^forest/u, '**forest**').replace('The red shirt was', 'The *red shirt* was');
        await expect.poll(disk).toEqual([formatted, bodies[1]]);
        await writing.screenshot({ path: testInfo.outputPath('batch-a-visible-formatting.png') });
        await writing.reload();
        await expect(editor.locator('strong')).toHaveText('forest');
        await expect(editor.locator('em')).toHaveText('red shirt');
        expect(await editor.innerText()).not.toContain('*');
        await button('Write here: River revelation, section 2').click();
        const preview = writing.getByRole('group', { name: 'Writing preview: Forest ideas' });
        expect(await preview.innerText()).not.toContain('*');
        await expect(preview.locator('[data-writing-span]').filter({ hasText: /^forest$/u })).toHaveCSS('font-weight', '700');
        await button('Write here: Forest ideas, section 1').click();
        await expect(editor.locator('strong')).toHaveText('forest');
        await editor.fill(bodies[0]!);
        await save();
        await expect.poll(disk).toEqual(bodies);
        record('A1 visible selected Bold/Italic, whitespace, nested styles, Undo/Redo, exact save, reload and inactive preview: PASS.');
      });
      await test.step('A2 true document boundaries and selected-word scope', async () => {
        await editor.press('Control+End');
        await editor.press('Control+Shift+Home');
        await expect.poll(async () => (await selected()).text).toBe(bodies[0]);
        await firstWord();
        await button('Find & replace').click();
        await expect(
          writing.getByRole('search', { name: 'Find and replace writing' }),
        ).toBeVisible();
        await writing.getByLabel('Search scope', { exact: true }).selectOption('selection');
        await writing.getByLabel('Find', { exact: true }).fill('FOREST');
        await expect(writing.getByText('1 matches', { exact: true })).toBeVisible();
        await writing.getByLabel('Match case', { exact: true }).check();
        await expect(button('Replace all 0 matches')).toBeDisabled();
        await writing.getByLabel('Match case', { exact: true }).uncheck();
        await writing.getByLabel('Find', { exact: true }).fill('shirt');
        await expect(button('Replace next')).toBeDisabled();
        await writing.getByLabel('Find', { exact: true }).fill('forest');
        await writing.getByLabel('Replace with', { exact: true }).fill('woodland');
        await button('Replace all 1 matches').click();
        await save();
        await expect.poll(disk).toEqual([bodies[0]!.replace(/^forest/u, 'woodland'), bodies[1]]);
        await button('Undo replacement').click();
        await save();
        await expect.poll(disk).toEqual(bodies);
        await editor.click();
        await editor.press('Control+Home');
        await editor.pressSequentially('New ');
        await expect(button('Replace next')).toBeDisabled();
        await expect(
          writing.getByText('Selected writing changed. Reopen Find to choose its current range.'),
        ).toBeVisible();
        await button('Undo').click();
        await save();
        await expect.poll(disk).toEqual(bodies);
        record(
          'A2 document edges, selected-only replacement, case/zero matches and stale-selection guard: PASS.',
        );
      });
      await test.step('A3 current-section replacement and literal search', async () => {
        await writing.getByLabel('Search scope', { exact: true }).selectOption('current');
        await writing.getByLabel('Find', { exact: true }).fill('[forest]');
        await expect(writing.getByText('1 matches', { exact: true })).toBeVisible();
        await writing.getByLabel('Find', { exact: true }).fill('');
        await expect(button('Replace all 0 matches')).toBeDisabled();
        await writing.getByLabel('Find', { exact: true }).fill('shirt');
        await writing.getByLabel('Replace with', { exact: true }).fill('blouse');
        await expect(writing.getByText('2 matches', { exact: true })).toBeVisible();
        await writing.getByText('Preview replacements · first 2 of 2').click();
        await expect(writing.locator('[data-writing-search] del')).toHaveCount(2);
        await button('Replace next').click();
        await save();
        await expect.poll(disk).toEqual([bodies[0]!.replace('shirt', 'blouse'), bodies[1]]);
        await button('Undo replacement').click();
        await save();
        await expect.poll(disk).toEqual(bodies);
        await button('Replace all 2 matches').click();
        await save();
        await expect.poll(disk).toEqual([bodies[0]!.replaceAll('shirt', 'blouse'), bodies[1]]);
        await button('Undo replacement').click();
        await save();
        await expect.poll(disk).toEqual(bodies);

        await editor.click();
        await editor.press('Control+Home');
        await writing.getByLabel('Find', { exact: true }).fill('glass');
        await writing.getByLabel('Replace with', { exact: true }).fill('glasses');
        await button('Replace next').click();
        await button('Replace next').click();
        await save();
        await expect
          .poll(disk)
          .toEqual([
            bodies[0]!
              .replace('Julian held the glass.', 'Julian held the glasses.')
              .replace('Another glass waited.', 'Another glasses waited.'),
            bodies[1],
          ]);
        await editor.fill(bodies[0]!);
        await save();
        await expect.poll(disk).toEqual(bodies);
        record(
          'A3 current-section Replace next/all, literal/empty search, preview and replacement containing the query: PASS; other section unchanged.',
        );
      });
      await test.step('A4 whole-manuscript Find next, save/Undo and later-edit protection', async () => {
        await button('Close search').click();
        await editor.click();
        await editor.press('Control+Home');
        await button('Find & replace').click();
        await writing.getByLabel('Search scope', { exact: true }).selectOption('manuscript');
        await writing.getByLabel('Find', { exact: true }).fill('shirt');
        await writing.getByLabel('Replace with', { exact: true }).fill('blouse');
        await expect(writing.getByText('3 matches', { exact: true })).toBeVisible();
        await button('Find next').click();
        await expect.poll(async () => (await selected()).text).toBe('shirt');
        const first = await selected();
        expect(first.unitId).toBe(fixture.ids[0]);
        await button('Find next').click();
        await expect.poll(async () => (await selected()).offset).not.toBe(first.offset);
        expect((await selected()).unitId).toBe(fixture.ids[0]);
        await button('Find next').click();
        await expect.poll(async () => (await selected()).unitId).toBe(fixture.ids[1]);
        await button('Find next').click();
        await expect.poll(async () => (await selected()).unitId).toBe(fixture.ids[0]);
        await button('Replace all 3 matches').click();
        await save();
        await expect.poll(disk).toEqual(bodies.map((body) => body.replaceAll('shirt', 'blouse')));
        await button('Undo').click();
        await save();
        await expect.poll(disk).toEqual(bodies);
        await button('Redo').click();
        await save();
        await expect.poll(disk).toEqual(bodies.map(body => body.replaceAll('shirt', 'blouse')));
        await editor.click();
        await editor.press('Control+z');
        await save();
        await expect.poll(disk).toEqual(bodies);
        await editor.click();
        await editor.press('Control+y');
        await save();
        await expect.poll(disk).toEqual(bodies.map(body => body.replaceAll('shirt', 'blouse')));
        await button('Undo replacement').click();
        await save();
        await expect.poll(disk).toEqual(bodies);
        await button('Replace all 3 matches').click();
        await editor.click();
        await editor.press('Control+Home');
        await editor.pressSequentially('New ');
        // The shared timeline exposes only its newest action. A batch cannot
        // skip the later authored prefix; ordinary Undo must reverse it first.
        await expect(button('Undo replacement')).toBeDisabled();
        await save();
        await expect
          .poll(disk)
          .toEqual([
            'New ' + bodies[0]!.replaceAll('shirt', 'blouse'),
            bodies[1]!.replaceAll('shirt', 'blouse'),
          ]);
        await button('Undo').click();
        await button('Undo replacement').click();
        await save();
        await expect.poll(disk).toEqual(bodies);
        record(
          'A4 Find next across sections/wrap, both-section save, batch Undo and refusal over newer writing: PASS.',
        );
      });
      await button('Close search').click();
      await editor.click();
      await editor.press('Control+Home');
      await writing.reload();
      await expect(editor).toContainText('forest');
      await expect(button('Pin')).toBeEnabled();
      await expect.poll(disk).toEqual(bodies);
      record('Saved-data reload: PASS; handoff starts from the unchanged test fixture.');
      await writing.screenshot({ path: testInfo.outputPath('batch-a-ready.png') });
      await testInfo.attach('batch-a-results.txt', {
        body: Buffer.from(log.join('\n') + '\n'),
        contentType: 'text/plain',
      });
      if (handoffRoot) {
        const runtime = await electronApp.evaluate(({ app }) => ({
          userDataDir: app.getPath('userData'),
          runtimeConfigPath: process.env.BLACKSKIES_CONFIG_PATH,
        }));
        await writeFile(
          join(handoffRoot, 'batch-a-handoff.json'),
          JSON.stringify(
            {
              ...runtime,
              projectPath: fixture.path,
              unitIds: fixture.ids,
              bodies,
              buildEntry: join(process.cwd(), 'dist-electron', 'main', 'main.js'),
              rendererEntry: join(process.cwd(), 'dist', 'index.html'),
            },
            null,
            2,
          ) + '\n',
        );
      }
    } finally {
      if (!handoffRoot) await removeTemporaryDirectory(parent);
    }
  });
});


test('Outline arrangement and comparison preserve source order, legacy metadata, exact prose and Notes', async ({ electronApp, page }, testInfo) => {
  test.setTimeout(100_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-outline-tools-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1680, height: 1050 });
    await writing.bringToFront();
    const bodies = ['forest\n\nLoose idea.\n\nmoon\n\nMore writing.', 'winter\n\nThe river ending.'];
    const fixture = await writing.evaluate(async ({ parent, bodies }) => {
      const bridge = window.projectSpine!;
      const made = await bridge.createProject({ parentPath: parent, title: 'Outline tools', operationId: 'outline-create' });
      if (!made.ok) throw new Error(made.error.message);
      let current = made.snapshot;
      const ids: string[] = [];
      for (const [index, title] of ['Forest ideas', 'River return'].entries()) {
        const binding = { projectId: current.project!.projectId, projectPath: current.project!.path, generation: current.generation };
        const unit = await bridge.createUnit!({ ...binding, title, operationId: `outline-unit-${index}` });
        if (!unit.ok) throw new Error(unit.error.message);
        current = unit.snapshot;
        ids.push(unit.data.unitId);
        const raw = current.project!.drafts![unit.data.unitId]!;
        const saved = await bridge.saveUnit!({ ...binding, unitId: unit.data.unitId,
          expectedMarkdown: raw, markdown: raw + bodies[index] + '\n', submittedProse: bodies[index]!, operationId: `outline-save-${index}` });
        if (!saved.ok) throw new Error(saved.error.message);
        current = saved.snapshot;
      }
      const selected = await bridge.selectUnit({ projectId: current.project!.projectId, projectPath: current.project!.path,
        generation: current.generation, unitId: ids[0]!, operationId: 'outline-select' });
      if (!selected.ok) throw new Error(selected.error.message);
      return { path: current.project!.path, ids };
    }, { parent, bodies });
    const fullBodies = await Promise.all(fixture.ids.map(async id => extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8'))));
    const groups = [
      { id: 'forest', label: 'Forest image', customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.ids[0]!, fullBodies[0]!, 0, 6)] },
      { id: 'moon', label: 'Moon image', customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.ids[0]!, fullBodies[0]!, fullBodies[0]!.indexOf('moon'), fullBodies[0]!.indexOf('moon') + 4)] },
      { id: 'winter', label: 'Winter return', customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.ids[1]!, fullBodies[1]!, 0, 8)] },
    ];
    await writing.evaluate(async groups => {
      const state = await window.projectSpine!.getSession();
      const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'outline-seed' };
      const outline = await window.livingOutline!.get(binding);
      if (!outline.ok) throw new Error(outline.error.message);
      const note = await window.livingOutline!.createItem({ ...binding, expectedRevision: outline.data.document.revision,
        label: 'Winter thought', body: 'Keep the cold quiet.', kind: 'fragment', state: 'authored', manuscriptUnitId: groups[2]!.spans[0]!.unitId, sourceAnchor: groups[2]!.spans[0] });
      if (!note.ok) throw new Error(note.error.message);
      const saved = await window.livingOutline!.replaceWritingState!({ ...binding, expectedRevision: note.data.document.revision, groups: [groups[2]!, groups[0]!, groups[1]!], noteAnchors: [] });
      if (!saved.ok) throw new Error(saved.error.message);
    }, groups);
    await writing.reload();
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    const disk = () => Promise.all(fixture.ids.map(id => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')));
    const original = await disk();
    const metadata = async () => JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    const before = await metadata();
    await openWritingStudioRail(writing, 'Story');
    const rail = writing.getByRole('region', { name: 'Story tools' });
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    const outline = writing.getByRole('list', { name: 'Writing units and unpinned passages' });
    const planIds = () => outline.locator(':scope > li[data-writing-group-id]').evaluateAll(rows => rows.map(row => row.getAttribute('data-writing-group-id')));
    const openRowActions = async (label: string) => {
      const menu = rail.getByLabel('Actions for ' + label, { exact: true });
      if (!(await menu.evaluate(el => el.parentElement?.hasAttribute('open')))) await menu.click();
    };
    await expect(rail.getByLabel('Outline order', { exact: true })).toHaveCount(0);
    // Legacy saved order remains intact, while the only visible Outline follows source.
    expect(before.writingGroups.map((group: { id: string }) => group.id)).toEqual(['winter', 'forest', 'moon']);
    await expect.poll(planIds).toEqual(['forest', 'moon', 'winter']);
    await rail.getByRole('button', { name: 'Expand outline in Command Center' }).click();
    await expect(writing.getByRole('heading', { name: 'Current tool: Outline' })).toBeVisible();
    const handle = writing.getByRole('button', { name: 'Drag Winter return in the manuscript' });
    await expect(handle).toHaveAttribute('draggable', 'true');
    const transfer = await writing.evaluateHandle(() => new DataTransfer());
    await handle.dispatchEvent('dragstart', { dataTransfer: transfer });
    const marker = outline.getByRole('button', { name: 'Insert before Forest image', exact: true });
    await expect(marker).toBeVisible();
    await marker.dispatchEvent('drop', { dataTransfer: transfer });
    await expect.poll(planIds).toEqual(['winter', 'forest', 'moon']);
    await writing.getByRole('button', { name: 'Back', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(async () => (await metadata()).items[0].manuscriptUnitId).toBe(fixture.ids[0]);
    expect((await metadata()).writingGroups.map((group: { id: string }) => group.id)).toEqual(['winter', 'forest', 'moon']);
    expect((await disk()).map(extractProjectSpineDraftBody)).toEqual(['winter\n\n' + bodies[0], 'The river ending.']);
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(disk).toEqual(original);
    await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds).toEqual([]);
    await expect(writing.getByRole('button', { name: 'Save writing', exact: true })).toBeDisabled();
    await expect.poll(planIds).toEqual(['forest', 'moon', 'winter']);
    // Electron requires the native owner foregrounded for the OS drag loop.
    await electronApp.evaluate(({ BrowserWindow }) => {
      const owner = BrowserWindow.getAllWindows().find(window => window.id === 1)!;
      owner.show(); owner.focus(); owner.webContents.focus();
    });
    await writing.evaluate(() => {
      const records: unknown[] = [];
      (window as unknown as { currentMoveDrag: unknown[] }).currentMoveDrag = records;
      for (const type of ['dragstart', 'dragenter', 'dragover', 'drop', 'dragend']) document.addEventListener(type, event => {
        const drag = event as DragEvent;
        if (records.length < 50) records.push({ type, x: drag.clientX, y: drag.clientY, types: [...(drag.dataTransfer?.types ?? [])], target: (drag.target as Element)?.closest('[data-writing-group-id]')?.getAttribute('data-writing-group-id'), data: type === 'drop' ? drag.dataTransfer?.getData('application/x-black-skies-writing-unit') : undefined });
      }, { capture: true });
    });
    const nativeHandle = rail.getByRole('button', { name: 'Drag Winter return in the manuscript', exact: true });
    await nativeHandle.scrollIntoViewIfNeeded();
    await expect(nativeHandle).toBeInViewport();
    const adjacentTarget = outline.getByRole('button', { name: 'Moon image', exact: true });
    await expect(adjacentTarget).toBeInViewport();
    await nativeHandle.dragTo(adjacentTarget, { timeout: 5000 });
    await testInfo.attach('native-direct-move-events', { body: JSON.stringify(await writing.evaluate(() => (window as unknown as { currentMoveDrag: unknown[] }).currentMoveDrag)), contentType: 'application/json' });
    await expect.poll(planIds).toEqual(['forest', 'winter', 'moon']);
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(disk).toEqual(original);
    await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds).toEqual([]);
    await expect(writing.getByRole('button', { name: 'Save writing', exact: true })).toBeDisabled();
    await expect.poll(planIds).toEqual(['forest', 'moon', 'winter']);
    expect((await metadata()).items).toMatchObject(before.items.map((item: Record<string, unknown>) => ({ ...item, updatedAt: expect.any(String) })));
    for (const label of ['Forest image', 'Winter return']) {
      await openRowActions(label);
      await rail.getByRole('checkbox', { name: 'Compare ' + label, exact: true }).check();
    }
    await rail.getByRole('button', { name: 'Compare selected · 2' }).click();
    const comparison = writing.getByRole('region', { name: 'Selected passage comparison' });
    await expect(comparison.getByRole('article', { name: 'Compared unit: Forest image' }).locator('.stage19-outline-comparison__prose')).toHaveText('forest');
    await expect(comparison.getByRole('article', { name: 'Compared unit: Winter return' }).locator('.stage19-outline-comparison__prose')).toHaveText('winter');
    await expect(comparison.getByRole('button', { name: 'Keep the cold quiet.' })).toBeVisible();
    await rail.getByRole('button', { name: 'Expand outline in Command Center' }).click();
    await expect(writing.getByRole('heading', { name: 'Current tool: Outline' })).toBeVisible();
    await expect(comparison).toBeVisible();
    await writing.getByRole('button', { name: 'Back', exact: true }).click();
    await openRowActions('Winter return');
    await expect(rail.getByRole('checkbox', { name: 'Compare Winter return' })).toBeChecked();
    await expect(rail.getByLabel('Outline order', { exact: true })).toHaveCount(0);
    await expect(comparison).toBeVisible();
    await comparison.getByRole('article', { name: 'Compared unit: Winter return' }).getByRole('button', { name: 'Read passage 1' }).click();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: River return' })).toContainText('winter');
    expect(await disk()).toEqual(original);
    await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds).toEqual([]);
    await writing.screenshot({ path: testInfo.outputPath('outline-tools.png') });
    await writing.reload();
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    await expect.poll(planIds).toEqual(['forest', 'moon', 'winter']);
    expect((await metadata()).writingGroups.map((group: { id: string }) => group.id)).toEqual(['winter', 'forest', 'moon']);
    expect((await metadata()).items).toMatchObject(before.items.map((item: Record<string, unknown>) => ({ ...item, updatedAt: expect.any(String) })));
    expect(await disk()).toEqual(original);
    // A membership Undo must not erase a later independent unit name.
    const moonRow = outline.locator('[data-writing-group-id="moon"]');
    await moonRow.locator('.stage19-outline-row-actions > summary').click();
    await moonRow.getByRole('button', { name: 'Unpin', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(2);
    await openRowActions('Forest image');
    await rail.getByRole('button', { name: 'Rename Forest image', exact: true }).click();
    await writing.getByRole('textbox', { name: 'Unit name', exact: true }).fill('Forest renamed after Unpin');
    await writing.getByRole('button', { name: 'Save unit name', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.find((group: { id: string }) => group.id === 'forest')?.label).toBe('Forest renamed after Unpin');
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(3);
    expect((await metadata()).writingGroups.find((group: { id: string }) => group.id === 'forest'))
      .toMatchObject({ label: 'Forest renamed after Unpin', customLabel: true });
    expect((await metadata()).items).toMatchObject(before.items.map((item: Record<string, unknown>) => ({ ...item, updatedAt: expect.any(String) })));
    expect(await disk()).toEqual(original);
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

for (const interruptMetadata of [false, true]) {
test(`Catalog B1 gap ${interruptMetadata ? 'recovers final metadata after renderer restart' : 'preview, fill, preserved planning Note, Undo and reopen use durable owners'}`, async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-catalog-gap-'));
  try {
    let { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const source = 'forest moon glass winter';
    const fixture = await writing.evaluate(async ({ parent, source }) => {
      const bridge = window.projectSpine!;
      const made = await bridge.createProject({ parentPath: parent, title: 'Catalog gap', operationId: 'gap-create' });
      if (!made.ok) throw new Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation };
      const unit = await bridge.createUnit!({ ...binding, title: 'Forest page', operationId: 'gap-unit' });
      if (!unit.ok) throw new Error(unit.error.message);
      const raw = unit.snapshot.project!.drafts![unit.data.unitId]!;
      const saved = await bridge.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw, markdown: raw + source + '\n', submittedProse: source, operationId: 'gap-source' });
      if (!saved.ok) throw new Error(saved.error.message);
      const selected = await bridge.selectUnit({ ...binding, unitId: unit.data.unitId, operationId: 'gap-select' });
      if (!selected.ok) throw new Error(selected.error.message);
      return { path: binding.projectPath, id: unit.data.unitId };
    }, { parent, source });
    await writing.reload();
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Forest page', exact: true });
    await expect(editor).toBeVisible(); await editor.press('Control+Home');
    const disk = () => readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8');
    const metadata = async () => JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    const originalDisk = await disk();
    await writing.locator('summary').filter({ hasText: /^Gaps · 0$/u }).click();
    await writing.getByLabel('Gap name', { exact: true }).fill('Bridge gap');
    await writing.getByLabel('Gap planning information', { exact: true }).fill('Keep original planning intention.');
    await writing.getByRole('button', { name: 'Keep gap at writing cursor' }).click();
    await expect.poll(async () => (await metadata()).items.length).toBe(1);
    const gapId = (await metadata()).items[0].id;
    await expect(writing.getByRole('button', { name: 'Preview gap fill' })).toBeDisabled();
    await writing.getByLabel('Write missing passage', { exact: true }).fill('The bridge opens.');
    await writing.getByRole('button', { name: 'Preview gap fill' }).click();
    const preview = writing.getByRole('region', { name: 'Gap fill preview' });
    await expect(preview).toBeVisible(); expect(await disk()).toBe(originalDisk);
    await preview.getByRole('button', { name: 'Cancel gap fill' }).click(); expect(await disk()).toBe(originalDisk);
    await writing.getByRole('button', { name: 'Preview gap fill' }).click();
    if (interruptMetadata) await electronApp.evaluate(async (_electron, projectPath) => {
      const fs = process.getBuiltinModule('fs/promises') as typeof import('node:fs/promises');
      const rename = fs.rename.bind(fs);
      let remaining = 3;
      fs.rename = async (from, to) => {
        if (String(to).includes(projectPath) && String(to).endsWith('living-outline.json') &&
            (await fs.readFile(from, 'utf8')).includes('"pendingGap": null') && remaining > 0) {
          remaining -= 1; if (!remaining) fs.rename = rename;
          throw Object.assign(new Error('Injected final gap metadata lock'), { code: 'EBUSY' });
        }
        return rename(from, to);
      };
    }, fixture.path);
    await preview.getByRole('button', { name: 'Fill this gap' }).click();
    const filled = 'The bridge opens.\n\n' + source;
    await expect.poll(async () => extractProjectSpineDraftBody(await disk())).toBe(filled);
    if (interruptMetadata) {
      await expect(writing.getByText('The story plan change could not be saved.', { exact: true })).toBeVisible();
      expect((await metadata()).items[0]).toMatchObject({ id: gapId, kind: 'gap', body: 'Keep original planning intention.' });
      expect((await metadata()).pendingGap.gapId).toBe(gapId);
      const resumed = await restartElectronApp(electronApp, { simulateInterruptedExit: true });
      ({ writing } = await getStage19Windows(resumed, await resumed.firstWindow()));
      await openProgram7Project(writing, fixture.path);
      await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Forest page', exact: true })).toBeVisible();
      await writing.getByRole('button', { name: 'Finish gap save' }).click();
    }
    await expect.poll(async () => (await metadata()).items[0].kind).toBe('fragment');
    expect((await metadata()).items[0]).toMatchObject({ id: gapId, label: 'Bridge gap', body: 'Keep original planning intention.', state: 'authored', sourceAnchor: { unitId: fixture.id, selectionStart: 0, selectionEnd: 17 } });
    expect((await metadata()).pendingGap).toBeNull();
    if (!interruptMetadata) {
      await writing.getByRole('button', { name: 'Undo gap fill', exact: true }).click();
      await expect.poll(async () => extractProjectSpineDraftBody(await disk())).toBe(source);
      await expect.poll(async () => (await metadata()).items[0].kind).toBe('gap');
      await writing.getByRole('button', { name: 'Redo', exact: true }).click();
      await expect.poll(async () => (await metadata()).items[0].kind).toBe('fragment');
      await expect.poll(async () => extractProjectSpineDraftBody(await disk())).toBe(filled);
    }
    const save = writing.getByRole('button', { name: 'Save writing', exact: true });
    if (await save.isEnabled()) await save.click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await writing.reload(); await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Forest page', exact: true })).toBeVisible();
    const final = await metadata();
    expect(final.items).toHaveLength(1); expect(final.writingGroups).toHaveLength(1);
    expect(final.items[0]).toMatchObject({ id: gapId, body: 'Keep original planning intention.', kind: 'fragment' });
    expect(extractProjectSpineDraftBody(await disk())).toBe(filled);
    await writing.screenshot({ path: testInfo.outputPath('catalog-gap-saved.png') });
  } finally { await removeTemporaryDirectory(parent); }
});
}

test('Writing organization milestone moves actual prose and Notes, restores history, and saves split/join boundaries', async ({ electronApp, page }, testInfo) => {
  test.setTimeout(120_000);
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-writing-organization-'));
  try {
    let { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1680, height: 1050 });
    await writing.bringToFront();
    const bodies = ['**forest** moon glass winter', 'river ending'];
    const fixture = await writing.evaluate(async ({ parent, bodies }) => {
      const bridge = window.projectSpine!;
      const made = await bridge.createProject({ parentPath: parent, title: 'Writing organization', operationId: 'organization-create' });
      if (!made.ok) throw new Error(made.error.message);
      let current = made.snapshot;
      const ids: string[] = [];
      for (const [index, title] of ['Forest ideas', 'River return'].entries()) {
        const binding = { projectId: current.project!.projectId, projectPath: current.project!.path, generation: current.generation };
        const unit = await bridge.createUnit!({ ...binding, title, operationId: `organization-unit-${index}` });
        if (!unit.ok) throw new Error(unit.error.message);
        current = unit.snapshot; ids.push(unit.data.unitId);
        const raw = current.project!.drafts![unit.data.unitId]!;
        const saved = await bridge.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw,
          markdown: raw + bodies[index] + '\n', submittedProse: bodies[index]!, operationId: `organization-save-${index}` });
        if (!saved.ok) throw new Error(saved.error.message);
        current = saved.snapshot;
      }
      const selected = await bridge.selectUnit({ projectId: current.project!.projectId, projectPath: current.project!.path,
        generation: current.generation, unitId: ids[0]!, operationId: 'organization-select' });
      if (!selected.ok) throw new Error(selected.error.message);
      return { path: current.project!.path, ids };
    }, { parent, bodies });
    const disk = () => Promise.all(fixture.ids.map(id => readFile(join(fixture.path, 'drafts', `${id}.md`), 'utf8')));
    const savedBodies = async () => (await disk()).map(extractProjectSpineDraftBody);
    expect(await savedBodies()).toEqual(bodies);
    const groups = [
      { id: 'forest', label: 'Forest image', customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.ids[0]!, bodies[0]!, 2, 8)] },
      { id: 'middle', label: 'Middle passage', customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.ids[0]!, bodies[0]!, 11, bodies[0]!.length)] },
      { id: 'river', label: 'River ending', customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.ids[1]!, bodies[1]!, 0, 5)] },
    ];
    const noteId = await writing.evaluate(async groups => {
      const state = await window.projectSpine!.getSession();
      const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'organization-seed' };
      const outline = await window.livingOutline!.get(binding);
      if (!outline.ok) throw new Error(outline.error.message);
      const note = await window.livingOutline!.createItem({ ...binding, expectedRevision: outline.data.document.revision,
        label: 'Forest thought', body: 'Keep the forest image.', kind: 'fragment', state: 'authored', manuscriptUnitId: groups[0]!.spans[0]!.unitId, sourceAnchor: groups[0]!.spans[0] });
      if (!note.ok) throw new Error(note.error.message);
      const saved = await window.livingOutline!.replaceWritingState!({ ...binding, expectedRevision: note.data.document.revision, groups, noteAnchors: [] });
      if (!saved.ok) throw new Error(saved.error.message);
      return note.data.document.items[0]!.id;
    }, groups);
    const metadata = async () => JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    await writing.reload();
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    const rail = writing.getByRole('region', { name: 'Story tools' });
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    const outline = writing.getByRole('list', { name: 'Writing units and unpinned passages' });
    const forest = outline.locator('[data-writing-group-id="forest"]');
    await forest.locator('.stage19-outline-row-actions > summary').click();
    await forest.locator('summary').filter({ hasText: 'Organize this writing' }).click();
    const originalDisk = await disk();
    await forest.getByRole('button', { name: 'Move', exact: true }).click();
    await expect(writing.getByRole('button', { name: 'Cancel move' })).toBeVisible();
    expect(await disk()).toEqual(originalDisk);
    await writing.keyboard.press('Escape');
    await expect(writing.getByRole('button', { name: 'Cancel move' })).toHaveCount(0);
    expect(await disk()).toEqual(originalDisk);
    await forest.getByRole('button', { name: 'Move', exact: true }).click();
    await outline.locator('[data-writing-group-id="river"]').getByRole('button', { name: 'Insert before River ending' }).click();
    await expect(writing.getByRole('region', { name: 'Passage move preview' })).toHaveCount(0);
    const moved = [' moon glass winter', '**forest**\n\nriver ending'];
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(savedBodies).toEqual(moved);
    await expect.poll(async () => (await metadata()).items[0].manuscriptUnitId).toBe(fixture.ids[1]);
    const movedState = await metadata();
    expect(movedState.items[0]).toMatchObject({ id: noteId, body: 'Keep the forest image.', sourceAnchor: { unitId: fixture.ids[1], selectionStart: 2, selectionEnd: 8 } });
    expect(movedState.writingGroups.map((group: { id: string }) => group.id)).toEqual(['forest', 'middle', 'river']);
    expect(movedState.writingGroups[0].spans[0]).toMatchObject({ unitId: fixture.ids[1], selectionStart: 2, selectionEnd: 8 });
    await expect(writing.locator(`[data-manuscript-unit-id="${fixture.ids[1]}"] [data-writing-span]`).filter({ hasText: /^forest$/u })).toHaveCSS('font-weight', '700');
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(savedBodies).toEqual(bodies);
    await expect.poll(async () => (await metadata()).items[0].manuscriptUnitId).toBe(fixture.ids[0]);
    await writing.getByRole('button', { name: 'Redo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect.poll(savedBodies).toEqual(moved);
    await expect.poll(async () => (await metadata()).items[0].manuscriptUnitId).toBe(fixture.ids[1]);
    // Fresh main process, not just a renderer reload, verifies durable identities/links.
    const restarted = await restartElectronApp(electronApp);
    ({ writing } = await getStage19Windows(restarted, await restarted.firstWindow()));
    await openProgram7Project(writing, fixture.path); await showWritingInWriting(writing);
    await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
    await openWritingStudioRail(writing, 'Story');
    const resumedRail = writing.getByRole('region', { name: 'Story tools' });
    await resumedRail.getByRole('button', { name: 'Keep open', exact: true }).click();
    expect(await savedBodies()).toEqual(moved);
    expect((await metadata()).items[0].id).toBe(noteId);
    const resumedOutline = writing.getByRole('list', { name: 'Writing units and unpinned passages' });
    const noteBeforeSplit = (await metadata()).items[0];
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Forest ideas', exact: true });
    await editor.press('Control+End');
    for (let step = 0; step < 'winter'.length; step += 1) await editor.press('ArrowLeft');
    const cursor = await writing.evaluate(() => {
      const selection = window.getSelection()!;
      const content = document.querySelector('.cm-content')!;
      const prefix = document.createRange(); prefix.selectNodeContents(content);
      prefix.setEnd(selection.focusNode!, selection.focusOffset);
      const fragment = prefix.cloneContents();
      fragment.querySelectorAll('[data-writing-decoration]').forEach(node => node.remove());
      return { offset: fragment.textContent?.length, text: selection.focusNode?.textContent, localOffset: selection.focusOffset };
    });
    // Browser caret movement passes pin widgets and native selection updates.
    // Independently measure the resulting source position instead of assuming
    // one keypress always corresponds to exactly one source character.
    expect(cursor.offset).toBeGreaterThan(1);
    expect(cursor.offset).toBeLessThan(moved[0]!.length);
    const middle = resumedOutline.locator('[data-writing-group-id="middle"]');
    await middle.locator('.stage19-outline-row-actions > summary').click();
    await middle.locator('summary').filter({ hasText: 'Organize this writing' }).click();
    await middle.getByRole('button', { name: 'Split at writing cursor' }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(4);
    expect((await metadata()).writingGroups.find((group: { id: string }) => group.id === 'middle').spans[0].selectionEnd).toBe(cursor.offset);
    expect(await savedBodies()).toEqual(moved);
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(3);
    for (const label of ['Forest image', 'Middle passage']) {
      const menu = resumedRail.getByLabel('Actions for ' + label, { exact: true });
      if (!(await menu.evaluate(el => el.parentElement?.hasAttribute('open')))) await menu.click();
      await resumedRail.getByRole('checkbox', { name: 'Compare ' + label, exact: true }).check();
    }
    await resumedRail.getByRole('button', { name: 'Join selected units' }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(2);
    expect((await metadata()).writingGroups.find((group: { customLabel?: boolean; label: string }) => group.label === 'Middle passage / Forest image')?.customLabel).toBe(true);
    expect(await savedBodies()).toEqual(moved);
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(3);
    expect((await metadata()).items[0]).toEqual(noteBeforeSplit);
    await writing.screenshot({ path: testInfo.outputPath('writing-organization-stopped.png') });
  } finally {
    await removeTemporaryDirectory(parent);
  }
});


test('Native local unit controls retain names, Notes and writing through Split, Join, Extend and direct Move', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-local-unit-controls-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1200, height: 900 });
    const bodies = ['Mother knew about the poison.\n\nLoose words.', 'river ending'];
    const fixture = await writing.evaluate(async ({ parent, bodies }) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({ parentPath: parent, title: 'Local controls review', operationId: 'local-create' });
      if (!created.ok) throw new Error(created.error.message);
      let state = created.snapshot;
      const ids: string[] = [];
      for (const [index, title] of ['Mother and loose writing', 'River return'].entries()) {
        const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation };
        const made = await bridge.createUnit!({ ...binding, title, operationId: `local-unit-${index}` });
        if (!made.ok) throw new Error(made.error.message);
        state = made.snapshot; ids.push(made.data.unitId);
        const raw = state.project!.drafts![made.data.unitId]!;
        const saved = await bridge.saveUnit!({ ...binding, unitId: made.data.unitId, expectedMarkdown: raw,
          markdown: raw + bodies[index] + '\n', submittedProse: bodies[index]!, operationId: `local-save-${index}` });
        if (!saved.ok) throw new Error(saved.error.message);
        state = saved.snapshot;
      }
      const selected = await bridge.selectUnit({ projectId: state.project!.projectId, projectPath: state.project!.path,
        generation: state.generation, unitId: ids[0]!, operationId: 'local-select' });
      if (!selected.ok) throw new Error(selected.error.message);
      return { path: state.project!.path, ids };
    }, { parent, bodies });
    await writing.reload();
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Mother and loose writing', exact: true });
    await editor.press('Control+Home'); await editor.press('Shift+End');
    await editor.press('Shift+F10');
    const controls = writing.getByRole('dialog', { name: 'Writing passage actions' });
    await controls.getByRole('button', { name: 'Pin selection', exact: true }).click();
    const metadata = async () => JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
    const disk = async () => Promise.all(fixture.ids.map(async id => extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', id + '.md'), 'utf8'))));
    await expect.poll(async () => (await metadata()).writingGroups?.length).toBe(1);
    await editor.press('Control+Home'); await editor.press('ArrowRight'); await editor.press('Shift+F10');
    await controls.getByRole('button', { name: 'Name unit', exact: true }).click();
    await controls.getByLabel('Unit name', { exact: true }).fill('Mother knows');
    await controls.getByRole('button', { name: 'Save unit name', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups[0].label).toBe('Mother knows');
    const originalId = (await metadata()).writingGroups[0].id;
    await editor.press('Control+Home'); await editor.press('Shift+End');
    await writing.getByRole('button', { name: 'Notes', exact: true }).click();
    await writing.getByLabel('Note text', { exact: true }).fill('Mother source stays linked.');
    await expect(writing.getByRole('button', { name: 'Keep Note', exact: true })).toBeEnabled();
    await writing.getByRole('button', { name: 'Keep Note', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Edit Note', exact: true })).toBeVisible();
    await writing.getByRole('button', { name: 'Close Note', exact: true }).click();
    const noteId = (await metadata()).items[0].id;
    await editor.press('Control+Home');
    for (let step = 0; step < 14; step += 1) await editor.press('ArrowRight');
    await editor.press('Shift+F10');
    await expect(controls.getByText('Split: 2 + 3 words. Writing stays unchanged.')).toBeVisible();
    await controls.getByRole('button', { name: 'Split before “about”', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(2);
    expect((await metadata()).writingGroups[0]).toMatchObject({ id: originalId, label: 'Mother knows', customLabel: true });
    expect((await metadata()).writingGroups[1]).toMatchObject({ label: 'about the poison.', customLabel: false });
    await editor.press('Control+Home'); await editor.press('Shift+End'); await editor.press('Shift+F10');
    await controls.getByRole('button', { name: 'Join units', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(1);
    expect((await metadata()).writingGroups[0].label).toBe('Mother knows');
    const joinedId = (await metadata()).writingGroups[0].id;
    // Local controls stay reachable without revealing the ordinary toolbar in Focus.
    await writing.getByRole('button', { name: 'Enter Focus mode', exact: true }).click();
    for (const width of [1200, 640]) {
      await writing.setViewportSize({ width, height: 900 });
      await editor.press('Control+Home'); await editor.press('ArrowRight'); await editor.press('Shift+F10');
      await expect(controls.getByRole('button', { name: 'Name unit', exact: true })).toBeVisible();
      const box = (await controls.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(900);
      await writing.keyboard.press('Escape');
    }
    await writing.getByRole('button', { name: 'Exit Focus mode', exact: true }).click();
    await writing.setViewportSize({ width: 1200, height: 900 });
    await editor.press('Control+Home');
    for (let step = 0; step < 14; step += 1) await editor.press('ArrowRight');
    await editor.press('Control+Shift+End'); await editor.press('Shift+F10');
    await expect(controls.getByText(/Result: 7 words/)).toBeVisible();
    await controls.getByRole('button', { name: 'Extend unit', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups[0].spans[0].selectionEnd).toBe(bodies[0]!.length);
    expect((await metadata()).writingGroups[0]).toMatchObject({ id: joinedId, label: 'Mother knows' });
    await editor.press('Control+Home'); await editor.press('ArrowRight'); await editor.press('Shift+F10');
    await controls.getByRole('button', { name: 'Move', exact: true }).click();
    const target = writing.locator(`[data-manuscript-unit-id="${fixture.ids[1]}"]`);
    await target.getByRole('button', { name: `Insert writing here, position ${bodies[1]!.length}`, exact: true }).click();
    // Undo before the first Save must clear every affected dirty receipt too.
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds).toEqual([]);
    expect(await disk()).toEqual(bodies);
    await writing.getByRole('button', { name: 'Redo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(disk).toEqual(['', bodies[1] + '\n\n' + bodies[0]]);
    expect((await metadata()).items[0]).toMatchObject({ id: noteId, body: 'Mother source stays linked.', manuscriptUnitId: fixture.ids[1], sourceAnchor: { selectionStart: bodies[1]!.length + 2, selectionEnd: bodies[1]!.length + 31 } });
    expect((await metadata()).writingGroups[0]).toMatchObject({ id: joinedId, label: 'Mother knows', spans: [{ unitId: fixture.ids[1] }] });
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(disk).toEqual(bodies);
    // Restore only the first-paragraph Pin: the earlier whole-unit Extend
    // concealed the separator case reported in the recovered author example.
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    // Membership Undo saves through its existing owner automatically.
    const saveParagraphBaseline = writing.getByRole('button', { name: 'Save writing', exact: true });
    if (await saveParagraphBaseline.isEnabled()) await saveParagraphBaseline.click();
    await expect.poll(async () => (await metadata()).writingGroups[0].spans[0].selectionEnd).toBe(29);
    await openWritingStudioRail(writing, 'Story');
    const riverRow = writing.getByRole('button', { name: 'river ending', exact: true }).locator('..');
    await writing.getByRole('button', { name: 'Drag Mother knows in the manuscript', exact: true }).dragTo(riverRow);
    await expect(writing.getByText('Passage moved with its Notes. Save writing keeps it; Undo restores it.', { exact: true })).toBeVisible();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(disk).toEqual(['Loose words.', 'Mother knew about the poison.\n\nriver ending']);
    expect((await metadata()).writingGroups[0]).toMatchObject({ id: joinedId, label: 'Mother knows', spans: [{ unitId: fixture.ids[1], selectionStart: 0, selectionEnd: 29 }] });
    expect((await metadata()).items[0]).toMatchObject({ id: noteId, body: 'Mother source stays linked.', manuscriptUnitId: fixture.ids[1], sourceAnchor: { selectionStart: 0, selectionEnd: 29 } });
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(disk).toEqual(bodies);
    await editor.press('Control+Home'); await editor.press('ArrowRight'); await editor.press('Shift+F10');
    await controls.getByRole('button', { name: 'Move', exact: true }).click();
    await target.getByRole('button', { name: `Insert writing here, position ${bodies[1]!.length}`, exact: true }).click();
    const movedParagraph = ['Loose words.', bodies[1] + '\n\nMother knew about the poison.\n\n'];
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(disk).toEqual(bodies);
    await writing.getByRole('button', { name: 'Redo', exact: true }).click();
    await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    await expect.poll(disk).toEqual(movedParagraph);
    await expect(writing.getByRole('status', { name: 'Story word count' })).toHaveText('9 words');
    expect((await metadata()).writingGroups[0]).toMatchObject({ id: joinedId, label: 'Mother knows', spans: [{ unitId: fixture.ids[1], selectionStart: bodies[1]!.length + 2, selectionEnd: bodies[1]!.length + 31 }] });
    expect((await metadata()).items[0]).toMatchObject({ id: noteId, body: 'Mother source stays linked.', manuscriptUnitId: fixture.ids[1], sourceAnchor: { selectionStart: bodies[1]!.length + 2, selectionEnd: bodies[1]!.length + 31 } });
    await writing.screenshot({ path: testInfo.outputPath('native-local-unit-controls.png') });
    const restarted = await restartElectronApp(electronApp);
    const reopened = await getStage19Windows(restarted, await restarted.firstWindow());
    await openProgram7Project(reopened.writing, fixture.path);
    await showWritingInWriting(reopened.writing);
    await reopened.writing.getByRole('button', { name: 'Write here: River return, section 2', exact: true }).click();
    await expect(reopened.writing.getByRole('textbox', { name: 'Manuscript editor: River return', exact: true })).toContainText('Mother knew about the poison.');
    await expect(reopened.writing.getByRole('status').filter({ hasText: /^Saved$/u })).toBeVisible();
    expect(await disk()).toEqual(movedParagraph);
    expect((await metadata()).writingGroups[0]).toMatchObject({ id: joinedId, label: 'Mother knows' });
    expect((await metadata()).items[0]).toMatchObject({ id: noteId, body: 'Mother source stays linked.', manuscriptUnitId: fixture.ids[1] });
  } finally { await removeTemporaryDirectory(parent); }
});

for (const size of [
  { name: '30000 words', words: 30_000, pins: 80, width: 1600 },
  { name: 'narrow window with many tiny units', words: 350, pins: 120, width: 760 },
  { name: 'minimum 640px window', words: 350, pins: 120, width: 640 },
]) {
  test(`Writer edge: ${size.name} retains source, Notes and manual outline browsing`, async ({ electronApp, page }, testInfo) => {
    test.setTimeout(180_000);
    const parent = await mkdtemp(join(tmpdir(), 'black-skies-writer-edge-'));
    try {
      const { writing } = await getStage19Windows(electronApp, page);
      await writing.setViewportSize({ width: size.width, height: 900 });
      // Unique fixed-width words let an independent DOM check recover source
      // offsets even when CodeMirror virtualizes a long rendered paragraph.
      const source = Array.from({ length: size.words }, (_, index) => index === size.words - 1 ? 'winter' : `f${String(index).padStart(5, '0')}`).join(' ');
      const fixture = await writing.evaluate(async ({ parent, source }) => {
        const bridge = window.projectSpine!;
        const created = await bridge.createProject({ parentPath: parent, title: 'Writer edge qualification', operationId: 'edge-create' });
        if (!created.ok) throw new Error(created.error.message);
        let current = created.snapshot;
        const binding = { projectId: current.project!.projectId, projectPath: current.project!.path, generation: current.generation };
        const made = await bridge.createUnit!({ ...binding, title: 'Long writing', operationId: 'edge-unit' });
        if (!made.ok) throw new Error(made.error.message);
        current = made.snapshot;
        const id = made.data.unitId;
        const saved = await bridge.saveUnit!({ ...binding, unitId: id, expectedMarkdown: current.project!.drafts![id]!, markdown: current.project!.drafts![id]! + source + '\n', submittedProse: source, operationId: 'edge-save' });
        if (!saved.ok) throw new Error(saved.error.message);
        const selected = await bridge.selectUnit({ ...binding, unitId: id, operationId: 'edge-select' });
        if (!selected.ok) throw new Error(selected.error.message);
        return { path: selected.snapshot.project!.path, id };
      }, { parent, source });
      const body = extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8'));
      const groups = await Promise.all(Array.from({ length: size.pins }, async (_, index) => {
        const from = Math.round(index * (size.words - 1) / (size.pins - 1)) * 7;
        return { id: `edge-${index}`, label: `Word ${index + 1}`, customLabel: true, spans: [await buildLivingOutlineSourceAnchor(fixture.id, body, from, from + 6)] };
      }));
      const noteId = await writing.evaluate(async groups => {
        const state = await window.projectSpine!.getSession();
        const binding = { projectId: state.project!.projectId, projectPath: state.project!.path, generation: state.generation, operationId: 'edge-outline' };
        const outline = await window.livingOutline!.get(binding);
        if (!outline.ok) throw new Error(outline.error.message);
        const last = groups[groups.length - 1]!;
        const note = await window.livingOutline!.createItem({ ...binding, expectedRevision: outline.data.document.revision,
          label: 'Last word thought', body: 'Keep winter in view.', kind: 'fragment', state: 'authored', manuscriptUnitId: last.spans[0]!.unitId, sourceAnchor: last.spans[0] });
        if (!note.ok) throw new Error(note.error.message);
        const saved = await window.livingOutline!.replaceWritingState!({ ...binding, expectedRevision: note.data.document.revision, groups, noteAnchors: [] });
        if (!saved.ok) throw new Error(saved.error.message);
        return note.data.document.items[0]!.id;
      }, groups);
      await writing.reload();
      const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Long writing', exact: true });
      await expect(editor).toBeVisible();
      await openWritingStudioRail(writing, 'Story');
      const rail = writing.getByRole('region', { name: 'Story tools' });
      if (size.width < 800) {
        await writing.screenshot({ path: testInfo.outputPath('narrow-before-lock.png') });
        await testInfo.attach('narrow-rail-geometry', { body: JSON.stringify(await rail.evaluate(element => ({ rail: element.getBoundingClientRect().toJSON(), buttons: [...element.querySelectorAll('button')].slice(0, 3).map(button => ({ text: button.textContent, box: button.getBoundingClientRect().toJSON() })), viewport: { width: innerWidth, height: innerHeight } }))), contentType: 'application/json' });
      }
      await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
      const outline = writing.getByRole('list', { name: 'Writing units and unpinned passages' });
      const first = outline.locator('[data-writing-group-id="edge-0"]');
      const last = outline.locator(`[data-writing-group-id="edge-${size.pins - 1}"]`);
      const expectVisibleReadingRange = async () => {
        const expected = await writing.evaluate(async (sourceLength) => {
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          const canvas = document.querySelector('[data-manuscript-scroll-owner]')!;
          const content = canvas.querySelector('.cm-content')!;
          const frame = canvas.getBoundingClientRect();
          // Independent browser DOM geometry determines the visible source,
          // rather than assuming the document-end caret is the viewport center.
          const point = document.caretRangeFromPoint((frame.left + frame.right) / 2, (frame.top + frame.bottom) / 2);
          if (!point || !content.contains(point.startContainer)) throw new Error('No visible source at the writing viewport center');
          const before = document.createRange();
          before.selectNodeContents(content);
          before.setEnd(point.startContainer, point.startOffset);
          const fragment = before.cloneContents();
          fragment.querySelectorAll('[data-writing-decoration]').forEach(node => node.remove());
          const renderedPrefix = fragment.textContent ?? '';
          const token = [...renderedPrefix.matchAll(/f\d{5}|winter/gu)].at(-1);
          if (!token) throw new Error('No unique source word before the viewport center');
          const wordStart = token[0] === 'winter' ? sourceLength - 6 : Number(token[0].slice(1)) * 7;
          const offset = wordStart + renderedPrefix.length - token.index;
          const rows = [...document.querySelectorAll<HTMLElement>('[data-writing-outline-list] > li')];
          const index = rows.findIndex(row => (JSON.parse(row.dataset.writingOutlineSpans ?? '[]') as { from: number; to: number }[]).some(span => span.from <= offset && offset < span.to));
          if (index < 0) throw new Error(`No outline range for visible source offset ${offset}`);
          return { index, offset };
        }, source.length);
        // Either the visible reading area or the deliberate end caret is valid
        // follow context. Unrelated rows are not accepted.
        const visibleRatio = (node: Element) => new Promise<number>(resolve => {
          const observer = new IntersectionObserver(entries => { observer.disconnect(); resolve(entries[0]!.intersectionRatio); });
          observer.observe(node);
        });
        try {
          await expect.poll(async () => (await Promise.all([
            outline.locator(':scope > li').nth(expected.index).evaluate(visibleRatio), last.evaluate(visibleRatio),
          ])).some(ratio => ratio >= 0.1), { message: `Visible source offset ${expected.offset} or deliberate end caret` }).toBe(true);
        } catch (error) {
          const layout = await outline.evaluate((list) => {
            const canvas = document.querySelector('[data-manuscript-scroll-owner]')!;
            const row = list.querySelector('[aria-current="location"]');
            return {
              canvas: { top: canvas.scrollTop, height: canvas.clientHeight, total: canvas.scrollHeight },
              list: { bounds: list.getBoundingClientRect().toJSON(), top: list.scrollTop },
              row: { ranges: row?.getAttribute('data-writing-outline-spans'), bounds: row?.getBoundingClientRect().toJSON() },
            };
          });
          await testInfo.attach('outline-follow-layout', { body: JSON.stringify({ expected, layout }), contentType: 'application/json' });
          throw error;
        }
      };
      await expect(writing.getByRole('button', { name: 'Pin', exact: true })).toBeEnabled();
      await editor.press('Control+End');
      await expectVisibleReadingRange();
      await first.scrollIntoViewIfNeeded();
      await expect(first).toBeInViewport({ ratio: 0.1 });
      // An unchanged browser selection notification is background noise. A new
      // deliberate click in the writing is a separate, valid follow request.
      await writing.evaluate(async () => {
        document.dispatchEvent(new Event('selectionchange'));
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      await expect(first).toBeInViewport({ ratio: 0.1 });
      await rail.getByRole('button', { name: 'Close', exact: true }).click();
      await openWritingStudioRail(writing, 'Story');
      await expectVisibleReadingRange();
      await writing.getByRole('region', { name: 'Story tools' }).getByRole('button', { name: 'Keep open', exact: true }).click();
      await editor.press('Control+End');
      await editor.pressSequentially(' A new ending.');
      await writing.getByRole('button', { name: 'Save writing', exact: true }).click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
      await expect.poll(async () => extractProjectSpineDraftBody(await readFile(join(fixture.path, 'drafts', `${fixture.id}.md`), 'utf8'))).toBe(source + ' A new ending.');
      await expect(writing.getByText('Writing units and Notes saved.', { exact: true })).toBeVisible();
      const stored = JSON.parse(await readFile(join(fixture.path, 'living-outline.json'), 'utf8'));
      expect(stored.writingGroups).toHaveLength(size.pins);
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0]).toMatchObject({ id: noteId, body: 'Keep winter in view.' });
      const controls = writing.locator('.stage19-writing-shell__topbar').locator('button, [role="switch"], .stage19-spine__save-state');
      for (const control of await controls.all()) {
        if (!(await control.isVisible())) continue;
        const box = await control.boundingBox();
        expect(box, await control.innerText()).not.toBeNull();
        expect(box!.x, 'Header controls must not be clipped at the left edge').toBeGreaterThanOrEqual(-1);
        expect(box!.x + box!.width, 'Header controls must fit inside the supported window').toBeLessThanOrEqual(size.width + 1);
      }
      await writing.screenshot({ path: testInfo.outputPath('writer-edge.png') });
    } finally {
      await removeTemporaryDirectory(parent);
    }
  });
}

test('Writer selection crosses pinned, unpinned and active section boundaries in both directions', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-cross-selection-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1000 });
    const bodies = [
      'Julian watched the dark water. Mara wore a red shirt.',
      'Mother knew about the poison. The ferry bell rang.',
      'On the walk home Mara pulled her green shirt tight.',
    ];
    const fixture = await writing.evaluate(async ({ parent, bodies }) => {
      const api = window.projectSpine!;
      const made = await api.createProject({ parentPath: parent, title: 'Cross passage selection', operationId: 'cross-create' });
      if (!made.ok) throw new Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation };
      const ids: string[] = [];
      for (const [index, body] of bodies.entries()) {
        const unit = await api.createUnit!({ ...binding, title: 'Passage ' + (index + 1), operationId: 'cross-unit-' + index });
        if (!unit.ok) throw new Error(unit.error.message);
        const id = unit.data.unitId;
        ids.push(id);
        const raw = unit.snapshot.project!.drafts![id]!;
        const saved = await api.saveUnit!({ ...binding, unitId: id, expectedMarkdown: raw, markdown: raw + body + '\n', submittedProse: body, operationId: 'cross-save-' + index });
        if (!saved.ok) throw new Error(saved.error.message);
      }
      await api.selectUnit({ ...binding, unitId: ids[0]!, operationId: 'cross-select' });
      return { ...binding, ids };
    }, { parent, bodies });
    const files = await Promise.all(fixture.ids.map(id => readFile(join(fixture.projectPath, 'drafts', id + '.md'), 'utf8')));
    const groups = await Promise.all([0, 2].map(async index => ({
      id: 'cross-pin-' + index, label: bodies[index]!, customLabel: false,
      spans: [await buildLivingOutlineSourceAnchor(fixture.ids[index]!, bodies[index]!, 0, bodies[index]!.length)],
    })));
    await writing.evaluate(async ({ binding, groups }) => {
      const api = window.livingOutline!;
      const outline = await api.get({ ...binding, operationId: 'cross-outline' });
      if (!outline.ok) throw new Error(outline.error.message);
      const saved = await api.replaceWritingState!({ ...binding, operationId: 'cross-pins', expectedRevision: outline.data.document.revision, groups, noteAnchors: [] });
      if (!saved.ok) throw new Error(saved.error.message);
    }, { binding: fixture, groups });
    await writing.reload();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Passage 1', exact: true })).toBeVisible();

    const coordinate = async (index: number, offset: number) => writing.evaluate(({ id, offset }) => {
      const section = document.querySelector('[data-manuscript-unit-id="' + id + '"]')!;
      const source = section.querySelector('.cm-content, [data-writing-source]')!;
      const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
      let remaining = offset, node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.parentElement?.closest('[data-writing-decoration]')) continue;
        if (remaining <= (node.textContent?.length ?? 0)) {
          const range = document.createRange();
          range.setStart(node, remaining);
          range.setEnd(node, Math.min(remaining + 1, node.textContent!.length));
          const rect = range.getBoundingClientRect();
          return { x: rect.left + 1, y: rect.top + rect.height / 2 };
        }
        remaining -= node.textContent?.length ?? 0;
      }
      throw new Error('Selection offset is unavailable');
    }, { id: fixture.ids[index]!, offset });
    const drag = async (reverse: boolean) => {
      await writing.bringToFront();
      await writing.setViewportSize({ width: 1280, height: 1000 });
      // Begin a new selection, rather than starting a native drag of an old
      // highlight. Activating a later section may also have scrolled the page.
      await writing.locator('[data-manuscript-scroll-owner]').evaluate(element => { element.scrollTop = 0; });
      await writing.evaluate(() => { window.getSelection()?.removeAllRanges(); });
      await writing.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const start = await coordinate(reverse ? 2 : 0, reverse ? bodies[2]!.length - 2 : 2);
      const end = await coordinate(reverse ? 0 : 2, reverse ? 2 : bodies[2]!.length - 2);
      const viewport = await writing.evaluate(() => ({ width: innerWidth, height: innerHeight }));
      for (const point of [start, end]) {
        expect(point.x).toBeGreaterThanOrEqual(0); expect(point.x).toBeLessThan(viewport.width);
        expect(point.y).toBeGreaterThanOrEqual(0); expect(point.y).toBeLessThan(viewport.height);
      }
      const pointHit = (point: { x: number; y: number }) => writing.evaluate(({ x, y }) => {
        const target = document.elementFromPoint(x, y);
        return { unitId: target?.closest<HTMLElement>('[data-manuscript-unit-id]')?.dataset.manuscriptUnitId,
          className: target?.className, decoration: Boolean(target?.closest('[data-writing-decoration]')) };
      }, point);
      const initialHit = await pointHit(start);
      expect(initialHit).toMatchObject({ unitId: fixture.ids[reverse ? 2 : 0], decoration: false });
      await writing.mouse.move(start.x, start.y);
      await writing.mouse.down();
      await writing.mouse.move(end.x, end.y, { steps: 24 });
      await writing.mouse.up();
      try {
        await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toContain(bodies[1]);
      } catch (error) {
        const selection = await writing.evaluate(() => ({
          focus: document.hasFocus(),
          active: document.activeElement?.className,
          anchor: window.getSelection()?.anchorNode?.parentElement?.className,
          head: window.getSelection()?.focusNode?.parentElement?.className,
          readingMode: document.querySelector('.cm-content')?.getAttribute('data-document-selection'),
        }));
        await testInfo.attach('cross-passage-drag', { body: JSON.stringify({ reverse, start, end, viewport, initialHit, finalHit: await pointHit(end), selection }), contentType: 'application/json' });
        throw error;
      }
      await expect(writing.getByRole('button', { name: 'Merge pins', exact: true })).toBeEnabled();
      const paint = await writing.locator('.cm-content .cm-line').first().evaluate(line => getComputedStyle(line, '::selection').backgroundColor);
      expect(paint).not.toBe('rgba(0, 0, 0, 0)');
      expect(paint).not.toBe('transparent');
    };

    await drag(false);
    await writing.getByRole('button', { name: 'Merge pins', exact: true }).click();
    const metadata = async () => JSON.parse(await readFile(join(fixture.projectPath, 'living-outline.json'), 'utf8'));
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(1);
    expect((await metadata()).writingGroups[0].spans.map((span: { unitId: string }) => span.unitId)).toEqual(fixture.ids);
    await openWritingStudioRail(writing, 'Story');
    const rail = writing.getByRole('region', { name: 'Story tools', exact: true });
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    const mergedRow = rail.locator('[data-writing-group-id]').first();
    await expect(mergedRow.locator('[data-writing-unit-number]')).toHaveAttribute('data-writing-unit-number', '1');
    await expect(mergedRow).toContainText('3 passages');
    await mergedRow.locator('.stage19-outline-source').click();
    await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toContain(bodies[1]);
    const mergedCopy = await writing.evaluate(() => {
      const clipboardData = new DataTransfer();
      document.dispatchEvent(new ClipboardEvent('copy', { clipboardData, bubbles: true, cancelable: true }));
      return clipboardData.getData('text/plain');
    });
    expect(mergedCopy).toBe(bodies.join('\n\n'));
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(2);
    await writing.getByRole('button', { name: 'Redo', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(1);

    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(async () => (await metadata()).writingGroups.length).toBe(2);

    await writing.getByRole('button', { name: 'Write here: Passage 3, section 3', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Passage 3', exact: true })).toBeVisible();
    await expect(writing.getByRole('button', { name: 'Close menu', exact: true })).toHaveCount(0);
    await expect(writing.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
    await drag(true);
    await writing.getByRole('button', { name: 'Write here: Passage 2, section 2', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Passage 2', exact: true })).toBeVisible();
    await expect(writing.getByRole('button', { name: 'Undo', exact: true })).toBeEnabled();
    await drag(false);
    const copied = await writing.evaluate(() => {
      const clipboardData = new DataTransfer();
      document.dispatchEvent(new ClipboardEvent('copy', { clipboardData, bubbles: true, cancelable: true }));
      return clipboardData.getData('text/plain');
    });
    expect(copied).toBe([bodies[0]!.slice(2), bodies[1], bodies[2]!.slice(0, -2)].join('\n\n'));
    const middle = writing.getByRole('textbox', { name: 'Manuscript editor: Passage 2', exact: true });
    const begin = await coordinate(1, 2);
    const end = await coordinate(1, bodies[1]!.length - 2);
    await writing.mouse.move(begin.x, begin.y);
    await writing.mouse.down();
    await writing.mouse.move(end.x, end.y, { steps: 12 });
    await writing.mouse.up();
    await expect(middle).toHaveAttribute('contenteditable', 'true');
    await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toBe(bodies[1]!.slice(2, -2));
    await writing.keyboard.type('replacement');
    await expect(middle).toHaveText(bodies[1]!.slice(0, 2) + 'replacement' + bodies[1]!.slice(-2));
    await middle.press('Control+z');
    await expect(middle).toHaveText(bodies[1]!);
    expect(await Promise.all(fixture.ids.map(id => readFile(join(fixture.projectPath, 'drafts', id + '.md'), 'utf8')))).toEqual(files);
  } finally { await removeTemporaryDirectory(parent); }
});



test('Edited concern sources retain markers, decision quotes and History-only reopening through source Undo', async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-edited-concern-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1600, height: 1100 });
    const bodies = [
      'On the ferry Mara wore a red shirt.',
      'Mother knew about the poison.',
      'Julian exchanged their glasses while she watched the water.',
      'The ferry bell rang once as a waiter began stacking chairs.',
      'On the walk home Mara wore a green shirt.',
      'At the jetty the ferryman offered Julian his arm.',
      'A lamp burned beside a letter with the date crossed out.',
      'Mara said she had wanted him to switch the glasses.',
      'There was still a question he could ask.',
      'Downstairs the kettle began to sing.',
    ];
    const evidenceIndexes = [0, 4];
    const fixture = await writing.evaluate(async ({ parent, bodies }) => {
      const api = window.projectSpine!;
      const made = await api.createProject({ parentPath: parent, title: 'Edited concern review', operationId: 'edited-create' });
      if (!made.ok) throw Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation };
      const ids: string[] = [];
      for (const [index, body] of bodies.entries()) {
        const unit = await api.createUnit!({ ...binding, title: 'Shirt passage ' + (index + 1), operationId: 'edited-unit-' + index });
        if (!unit.ok) throw Error(unit.error.message);
        ids.push(unit.data.unitId);
        const raw = unit.snapshot.project!.drafts![unit.data.unitId]!;
        const saved = await api.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw, markdown: raw + body + '\n', submittedProse: body, operationId: 'edited-save-' + index });
        if (!saved.ok) throw Error(saved.error.message);
      }
      return { binding, ids };
    }, { parent, bodies });
    // Match the desktop review: two pinned sources among ten saved sections,
    // with unpinned writing between and after the concern evidence.
    await openWritingStudioRail(writing, 'Story');
    const rail = writing.getByRole('region', { name: 'Story tools', exact: true });
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    for (const [pinIndex, sourceIndex] of evidenceIndexes.entries()) {
      await rail.locator('.stage19-outline-source').filter({ hasText: bodies[sourceIndex]! }).click();
      await writing.getByRole('button', { name: 'Pin', exact: true }).click();
      await expect(rail.locator('[data-writing-group-id]')).toHaveCount(pinIndex + 1);
    }
    await expect.poll(async () => JSON.parse(await readFile(join(fixture.binding.projectPath, 'living-outline.json'), 'utf8')).writingGroups.length).toBe(2);
    const sources = await Promise.all(evidenceIndexes.map(index => buildProgram7SourceEnvelope({ projectId: fixture.binding.projectId, generation: fixture.binding.generation, unitId: fixture.ids[index]!, sourceText: bodies[index]!, selectionStart: 0, selectionEnd: bodies[index]!.length, lens: 'continuity' })));
    const ids = await writing.evaluate(async ({ binding, sources }) => {
      const api = window.feedbackNotes!;
      const first = await api.createRevisionItem!({ ...binding, expectedRevision: 0, operationId: 'edited-shirt', manual: true, source: sources[0]!, relatedSources: [sources[1]!], body: 'Shirt changes from red to green. Is that intended?' });
      if (!first.ok) throw Error(first.error.message);
      const second = await api.createRevisionItem!({ ...binding, expectedRevision: first.revision, operationId: 'edited-timing', manual: true, source: { ...sources[1]!, lens: 'timeline' }, body: 'Check how long the walk takes.' });
      if (!second.ok) throw Error(second.error.message);
      return { shirt: first.data.id, timing: second.data.id };
    }, { binding: fixture.binding, sources });
    await writing.reload();
    await openWritingStudioRail(writing, 'Story');
    await rail.getByRole('button', { name: 'Keep open', exact: true }).click();
    await expect(rail.locator('[data-writing-group-id]')).toHaveCount(2);
    await rail.locator('.stage19-outline-source').filter({ hasText: 'On the walk home' }).click();
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Shirt passage 5', exact: true });
    const cotton = bodies[4]!.replace('green', 'cotton');
    await editor.fill(cotton);
    const shirt = rail.locator('[data-outline-concern-id="' + ids.shirt + '"]');
    await expect(shirt).toHaveCount(2);
    await expect(shirt.first()).toHaveAttribute('data-concern-source-state', 'changed');
    await expect(shirt.first()).toHaveAttribute('title', /Source changed/);
    await shirt.first().click();
    const disclosure = rail.locator('.writing-outline-concern__sources');
    await expect(disclosure.getByLabel('Original related evidence')).toHaveText(bodies[4]!);
    await expect(disclosure.getByLabel('Current related evidence')).toHaveText(cotton);
    await disclosure.getByRole('button', { name: 'Mark addressed', exact: true }).click();
    await expect(shirt).toHaveCount(0);
    await expect(rail.locator('[data-outline-concern-id="' + ids.timing + '"]')).toHaveCount(1);
    const notes = async () => JSON.parse(await readFile(join(fixture.binding.projectPath, 'feedback-notes.json'), 'utf8'));
    await expect.poll(async () => (await notes()).notes.find((item: { id: string }) => item.id === ids.shirt).lifecycle).toBe('resolved');
    const addressed = (await notes()).notes.find((item: { id: string }) => item.id === ids.shirt);
    expect(addressed.dispositionHistory[0].sourceEvidence[1].text).toBe(cotton);
    // A restart must resolve the saved Pin against the saved cotton source,
    // rather than retaining an obsolete green-source fingerprint.
    const savedLinks = JSON.parse(await readFile(join(fixture.binding.projectPath, 'living-outline.json'), 'utf8'));
    const relatedPin = savedLinks.writingGroups.find((group: { spans: { unitId: string }[] }) => group.spans.some(span => span.unitId === fixture.ids[4]));
    expect(relatedPin.spans[0]).toEqual(await buildLivingOutlineSourceAnchor(fixture.ids[4]!, cotton, 0, cotton.length));
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(editor).toHaveText(bodies[4]!);
    await expect(shirt).toHaveCount(0);
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.getByRole('button', { name: 'History', exact: true }).click();
    const history = writing.getByTestId('program7-history-item-feedback-note:' + ids.shirt);
    await history.getByText('Decision history', { exact: true }).click();
    await expect(history.getByLabel('Recorded related evidence')).toHaveText(cotton);
    await expect(history.getByLabel('Current related evidence').first()).toHaveText(bodies[4]!);
    await expect(history.getByText('Current source differs from this decision.')).toBeVisible();
    await history.getByRole('button', { name: 'Reopen concern', exact: true }).click();
    await expect.poll(async () => (await notes()).notes.find((item: { id: string }) => item.id === ids.shirt).lifecycle).toBe('active');
    await showWritingInWriting(writing);
    await openWritingStudioRail(writing, 'Story');
    await expect(shirt).toHaveCount(2);
    await expect(rail.getByRole('button', { name: 'Reopen concern' })).toHaveCount(0);
    const reopened = (await notes()).notes.find((item: { id: string }) => item.id === ids.shirt);
    expect(reopened.dispositionHistory.map((event: { disposition: string }) => event.disposition)).toEqual(['resolved', 'reopened']);
    expect(reopened.dispositionHistory[0].sourceEvidence[1].text).toBe(cotton);
    await writing.reload();
    await openWritingStudioRail(writing, 'Story');
    await expect(shirt).toHaveCount(2);
    expect(extractProjectSpineDraftBody(await readFile(join(fixture.binding.projectPath, 'drafts', fixture.ids[4] + '.md'), 'utf8'))).toBe(bodies[4]);
    // Repeat the decision, then start a fresh main process. A renderer-only
    // reload cannot qualify recovery of the split Command Center authority.
    await rail.locator('.stage19-outline-source').filter({ hasText: 'On the walk home' }).click();
    await editor.fill(cotton);
    await shirt.first().click();
    await disclosure.getByRole('button', { name: 'Mark addressed', exact: true }).click();
    await expect(shirt).toHaveCount(0);
    try {
      await expect.poll(async () => {
        const note = (await notes()).notes.find((item: { id: string }) => item.id === ids.shirt);
        return { lifecycle: note.lifecycle, history: note.dispositionHistory.map((event: { disposition: string }) => event.disposition) };
      }).toEqual({ lifecycle: 'resolved', history: ['resolved', 'reopened', 'resolved'] });
    } catch (error) {
      await testInfo.attach('concern-decision-failure', { body: JSON.stringify({
        messages: await writing.locator('[role="status"], [role="alert"], .program7-revision-capture__notice').allTextContents(),
        session: await writing.evaluate(() => window.projectSpine!.getSession()),
        concern: (await notes()).notes.find((item: { id: string }) => item.id === ids.shirt),
      }), contentType: 'application/json' });
      throw error;
    }
    expect(extractProjectSpineDraftBody(await readFile(join(fixture.binding.projectPath, 'drafts', fixture.ids[4] + '.md'), 'utf8'))).toBe(cotton);
    const finalLinks = JSON.parse(await readFile(join(fixture.binding.projectPath, 'living-outline.json'), 'utf8'));
    expect(finalLinks.writingGroups.find((group: { spans: { unitId: string }[] }) => group.spans.some(span => span.unitId === fixture.ids[4])).spans[0]).toEqual(await buildLivingOutlineSourceAnchor(fixture.ids[4]!, cotton, 0, cotton.length));
    const restarted = await restartElectronApp(electronApp);
    const resumed = (await getStage19Windows(restarted, await restarted.firstWindow())).writing;
    await openProgram7Project(resumed, fixture.binding.projectPath);
    await showWritingInWriting(resumed);
    await openWritingStudioRail(resumed, 'Story');
    const resumedRail = resumed.getByRole('region', { name: 'Story tools', exact: true });
    await expect(resumedRail.locator('[data-writing-group-id]')).toHaveCount(2);
    await expect(resumedRail.getByText('Some unit sources changed and need reconnection. Their records are retained.')).toHaveCount(0);
    await expect(resumedRail.locator('[data-outline-concern-id="' + ids.shirt + '"]')).toHaveCount(0);
    await expect(resumedRail.locator('[data-outline-concern-id="' + ids.timing + '"]')).toHaveCount(1);
    await expect(resumed.getByRole('button', { name: 'Open Command Center here', exact: true })).toBeVisible();
    expect(extractProjectSpineDraftBody(await readFile(join(fixture.binding.projectPath, 'drafts', fixture.ids[4] + '.md'), 'utf8'))).toBe(cotton);
  } finally { await removeTemporaryDirectory(parent); }
});

for (const configuration of [
  { name: 'short wide', paragraphs: 3, width: 1280, accessibility: false },
  { name: 'short narrow accessibility', paragraphs: 3, width: 640, accessibility: true },
  { name: 'long wide accessibility', paragraphs: 600, width: 1280, accessibility: true },
  { name: 'long narrow', paragraphs: 600, width: 640, accessibility: false },
]) test(`Writing paint witness: ${configuration.name} retains visible text through scrolling, Undo, Focus and surface switches`, async ({ electronApp, page }, testInfo) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-paint-witness-'));
  try {
    const { writing } = await getStage19Windows(electronApp, page);
    const owner = await electronApp.browserWindow(writing);
    const displays = await electronApp.evaluate(({ screen }) => screen.getAllDisplays().map(display => ({ id: display.id, workArea: display.workArea, scaleFactor: display.scaleFactor })));
    await testInfo.attach('available-displays', { body: JSON.stringify(displays), contentType: 'application/json' });
    const showOnDisplay = async (area: (typeof displays)[number]['workArea']) => {
      await owner.evaluate((window, { area, width, height }) => {
        window.unmaximize();
        window.setBounds({ x: area.x + 12, y: area.y + 12, width, height });
        window.show(); window.focus(); window.webContents.focus();
      }, { area, width: Math.min(configuration.width + 18, area.width - 48), height: Math.min(938, area.height - 48) });
      await expect.poll(async () => {
        const viewport = await writing.evaluate(() => ({ width: innerWidth, height: innerHeight }));
        const bounds = await owner.evaluate(window => window.getContentBounds());
        return Math.max(Math.abs(viewport.width - bounds.width), Math.abs(viewport.height - bounds.height));
      }).toBeLessThanOrEqual(3);
    };
    await showOnDisplay(displays[0]!.workArea);
    await electronApp.evaluate(({ app }, enabled) => { app.setAccessibilitySupportEnabled(enabled); }, configuration.accessibility);
    const body = Array.from({ length: configuration.paragraphs }, (_, index) => `Passage ${index + 1}: Moonlight crossed the quiet water while Mara watched the forest.`).join('\n\n');
    const fixture = await writing.evaluate(async ({ parentPath, body }) => {
      const api = window.projectSpine!;
      const made = await api.createProject({ parentPath, title: 'Disposable paint witness', operationId: 'paint-project' });
      if (!made.ok) throw Error(made.error.message);
      const binding = { projectId: made.snapshot.project!.projectId, projectPath: made.snapshot.project!.path, generation: made.snapshot.generation };
      const unit = await api.createUnit!({ ...binding, title: 'Paint passage', operationId: 'paint-unit' });
      if (!unit.ok) throw Error(unit.error.message);
      const raw = unit.snapshot.project!.drafts![unit.data.unitId]!;
      const saved = await api.saveUnit!({ ...binding, unitId: unit.data.unitId, expectedMarkdown: raw, markdown: raw + body + '\n', submittedProse: body, operationId: 'paint-seed' });
      if (!saved.ok) throw Error(saved.error.message);
      return { ...binding, unitId: unit.data.unitId };
    }, { parentPath: parent, body });
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Paint passage', exact: true });
    // CodeMirror deliberately virtualizes long documents; DOM text is not the whole source.
    const readEditor = () => editor.evaluate(element => (element as unknown as { cmView: { view: { state: { doc: { toString(): string } } } } }).cmView.view.state.doc.toString());
    await expect.poll(readEditor).toBe(body);
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    const before = await readFile(join(fixture.projectPath, 'drafts', fixture.unitId + '.md'), 'utf8');
    const observe = async (name: string, expectedInk = true) => {
      await writing.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const lines = editor.locator('.cm-line');
      // CodeMirror overscans beyond the viewport. Observe an actually visible
      // glyph range without scrolling it (which could mask missing painting).
      const index = await lines.evaluateAll(nodes => {
        const canvas = document.querySelector('[data-manuscript-scroll-owner]')!.getBoundingClientRect();
        let last = -1;
        nodes.forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          if (node.textContent?.trim() && rect.top >= Math.max(0, canvas.top) && rect.bottom <= Math.min(innerHeight, canvas.bottom)) last = index;
        });
        return last;
      });
      expect(index, 'the scrolled manuscript must contain a fully visible line').toBeGreaterThanOrEqual(0);
      const line = lines.nth(index);
      const result = await readWritingPaintWitness(electronApp, line);
      await testInfo.attach(`${name}-native-window`, { body: Buffer.from(result.native.png, 'base64'), contentType: 'image/png' });
      await testInfo.attach(`${name}-renderer`, { body: Buffer.from(result.renderer.png, 'base64'), contentType: 'image/png' });
      await testInfo.attach(`${name}-paint`, { body: JSON.stringify({ ...result, native: { ...result.native, png: undefined }, renderer: { ...result.renderer, png: undefined } }), contentType: 'application/json' });
      expect(result.rendererAlive).toBe(true);
      expect(result.dom.text.trim().length).toBeGreaterThan(3);
      if (expectedInk) {
        expect(result.native.pixels, 'DOM text must also be painted in the independent native-window capture').toBeGreaterThan(5);
        expect(result.renderer.pixels, 'The compositor capture must contain manuscript glyphs').toBeGreaterThan(5);
      } else {
        expect(result.native.pixels, 'The negative control must detect text present in DOM but absent from the screen').toBe(0);
        expect(result.renderer.pixels).toBe(0);
      }
    };
    await editor.press('Control+End'); await observe('after-scrolling');
    await editor.press('End'); await editor.pressSequentially(' temporary');
    await writing.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(readEditor).toBe(body); await editor.press('Control+End'); await observe('after-undo');
    await writing.getByRole('button', { name: 'Enter Focus mode', exact: true }).click(); await observe('focus');
    await writing.getByRole('button', { name: 'Exit Focus mode', exact: true }).click();
    await showCommandInWriting(writing); await showWritingInWriting(writing);
    await editor.press('Control+End'); await observe('surface-return');
    await openWritingStudioRail(writing, 'Project Tools');
    const tools = writing.getByRole('region', { name: 'Project Tools', exact: true });
    await tools.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await tools.getByRole('button', { name: 'Close', exact: true }).click();
    await observe('project-tools-scroll-return');
    // Historical review launchers used the other physical display. Exercise
    // every display this host actually has; retain the inventory on single-screen CI.
    for (const display of displays.slice(1)) {
      await showOnDisplay(display.workArea);
      await editor.press('Control+End');
      await openWritingStudioRail(writing, 'Project Tools');
      await tools.evaluate(element => { element.scrollTop = element.scrollHeight; });
      await tools.getByRole('button', { name: 'Close', exact: true }).click();
      await observe(`physical-display-${display.id}-scroll-return`);
      await showCommandInWriting(writing); await showWritingInWriting(writing);
      await observe(`physical-display-${display.id}-surface-return`);
    }
    if (configuration.name === 'short wide') {
      await editor.locator('.cm-line').last().evaluate(element => { (element as HTMLElement).style.visibility = 'hidden'; });
      try { await observe('missing-paint-negative-control', false); }
      finally { await editor.locator('.cm-line').last().evaluate(element => { (element as HTMLElement).style.visibility = ''; }); }
      await observe('negative-control-restored');
    }
    const save = writing.getByRole('button', { name: 'Save writing', exact: true });
    if (await save.isEnabled()) await save.click();
    await expect(writing.locator('.stage19-writing-shell__status .stage19-spine__save-state')).toHaveText('Saved');
    expect(await readFile(join(fixture.projectPath, 'drafts', fixture.unitId + '.md'), 'utf8')).toBe(before);
  } finally { await removeTemporaryDirectory(parent); }
});
