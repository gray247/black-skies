// HARNESS_ONLY:
// Reason: exercises source return, manual revision acceptance, stale-source protection and restart using materialized projects and the Electron harness with local AI disabled.
// Owner: app/tests/e2e/program7-revision.spec.ts
// Retire when: installed-build qualification provides equivalent source-return, acceptance, persistence and History coverage without harness-only dependencies.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, restartElectronApp, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
  showWritingInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true, disableLocalAi: true, preserveTestArtifacts: true });

test('automatic Story Knowledge scan returns to the exact prose passage in a saved Markdown draft', async ({ page, electronApp }) => {
  const { projectPath } = await materializeProgram7Carmilla();
  const { writing } = await getProgram7Windows(electronApp, page);
  await openProgram7Project(writing, projectPath);
  await showCommandInWriting(writing);
  await writing.getByRole('button', { name: 'Story Knowledge', exact: true }).click();
  await writing.getByRole('button', { name: 'Scan manuscript automatically', exact: true }).click();
  await expect(writing.getByText(/Scan status: completed\./)).toBeVisible();
  const sourceReturn = writing.getByRole('button', { name: 'Return to source', exact: true }).first();
  await expect(sourceReturn).toBeVisible();
  await sourceReturn.click();

  const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Chapter I — An Early Fright' });
  await expect(editor).toBeFocused();
  await expect(writing.getByText(/selected the passage connected to this concern\./)).toBeVisible();
  const selectedText = await editor.evaluate(() => window.getSelection()?.toString() ?? '');
  expect(selectedText.trim()).not.toBe('');
  const savedDraft = await readFile(path.join(projectPath, 'drafts', 'carmilla-chapter-01.md'), 'utf8');
  const bodyStart = savedDraft.indexOf('\n---', 3) + 4;
  const savedProse = savedDraft.slice(bodyStart).replace(/^(?:\r?\n)+/u, '').replace(/\r\n?/gu, '\n').replace(/\n$/u, '');
  expect(savedProse).toContain(selectedText);
});

test('Program 7 routes a current Carmilla finding through no-AI revision review and explicit acceptance', async ({ page, electronApp }, testInfo) => {
  const { projectPath, selectionStart, selectionEnd } = await materializeProgram7Carmilla();
    const { writing } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Story Knowledge', exact: true }).click();
    await writing.getByRole('button', { name: 'Signals', exact: true }).click();
    const signal = writing.locator('[data-signal-id="program7-carmilla-review-signal"]');
    await expect(signal).toHaveAttribute('data-currentness', 'current');
    await signal.getByRole('button', { name: 'Work on this', exact: true }).click();
    await expect(writing.getByTestId('program7-create-develop')).toBeVisible();
    await expect(writing.getByRole('heading', { name: 'Revision Desk', exact: true })).toBeVisible();
    let activeCard = writing.getByRole('article', { name: 'Revision task', exact: true }).first();
    await expect(activeCard).toBeVisible();

    await writing.getByRole('button', { name: 'Story Knowledge', exact: true }).click();
    await writing.getByRole('button', { name: 'Signals', exact: true }).click();
    await writing.locator('[data-signal-id="program7-carmilla-review-signal"]')
      .getByRole('button', { name: 'Work on this', exact: true }).click();
    await expect(writing.getByRole('article', { name: 'Revision task', exact: true })).toHaveCount(1);
    await expect(writing.getByText(/already in Revision Desk.*no duplicate was created/i)).toBeVisible();

    activeCard = writing.getByRole('article', { name: 'Revision task', exact: true }).first();
    await activeCard.getByRole('button', { name: 'Open passage in Writing Studio', exact: true }).click();
    await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Chapter I — An Early Fright' })).toBeFocused();
    await expect(writing.getByText('Opened Chapter I — An Early Fright and selected the passage connected to this concern.', { exact: true })).toBeVisible();
    const draftPath = path.join(projectPath, 'drafts', 'carmilla-chapter-01.md');
    const beforeDraft = await readFile(draftPath, 'utf8');
    const headerEnd = beforeDraft.indexOf('\n---', 3) + 4;
    const header = beforeDraft.slice(0, headerEnd);
    const savedBody = beforeDraft.slice(headerEnd).replace(/^(?:\r?\n)+/u, '');
    const firstSourceLine = savedBody.slice(selectionStart, selectionEnd).split('\n')[0]!;
    const sourceLine = writing.locator('.cm-line').filter({ hasText: firstSourceLine }).first();
    await testInfo.attach('source-return-scroll-topology', { contentType: 'application/json', body: JSON.stringify(await sourceLine.evaluate((element) => {
      const result = [];
      for (let node: HTMLElement | null = element as HTMLElement; node; node = node.parentElement) {
        const bounds = node.getBoundingClientRect();
        result.push({ tag: node.tagName, className: node.className, top: bounds.top, bottom: bounds.bottom, scrollTop: node.scrollTop, scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, overflowY: getComputedStyle(node).overflowY });
      }
      return { viewportHeight: window.innerHeight, ancestors: result };
    })) });
    await expect(sourceLine).toBeInViewport({ ratio: 0.5 });
    await expect.poll(() => sourceLine.evaluate((element) => {
      const canvas = element.closest('.stage19-writing-shell__canvas')!;
      const line = element.getBoundingClientRect();
      const visible = canvas.getBoundingClientRect();
      return line.top >= visible.top && line.bottom <= visible.bottom;
    })).toBe(true);
    for (const chapter of ['Chapter II', 'Chapter III']) {
      await writing.getByRole('button', { name: new RegExp(`^Write here: ${chapter} \u2014`) }).click();
      await showCommandInWriting(writing);
      await writing.getByRole('article', { name: 'Revision task', exact: true }).first()
        .getByRole('button', { name: 'Open passage in Writing Studio', exact: true }).click();
      await expect(writing.getByRole('textbox', { name: 'Manuscript editor: Chapter I \u2014 An Early Fright' })).toBeFocused();
      await expect(sourceLine).toBeInViewport({ ratio: 0.5 });
      await expect.poll(() => sourceLine.evaluate((element) => {
        const line = element.getBoundingClientRect();
        const canvas = element.closest('.stage19-writing-shell__canvas')!.getBoundingClientRect();
        return line.top >= canvas.top && line.bottom <= canvas.bottom;
      })).toBe(true);
    }



    await showCommandInWriting(writing);
    activeCard = writing.getByRole('article', { name: 'Revision task', exact: true }).first();
    await activeCard.getByRole('button', { name: 'Check after revising', exact: true }).click();
    await expect(activeCard.getByText(/Passage check:/)).toBeVisible();
    await activeCard.getByRole('button', { name: 'I’m satisfied — mark resolved', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Completed revision tasks', exact: true })).toBeVisible();
    await expect(writing.getByText(/This concern is now saved in Revision Desk/)).toHaveCount(0);

    const proposedText = 'A concise author-proposed opening alternative for review. A second sentence remains outside the selected part.';
    await writing.locator('#program7-candidate-purpose').fill('Tighten the opening source-linked passage.');
    await writing.locator('#program7-candidate-text').fill(proposedText);
    await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
    await expect(writing.getByTestId('revision-comparison')).toBeVisible();
    // CodeMirror virtualizes long documents; DOM selection text can omit unmounted lines.
    // The durable source binding and exact final bytes prove the selected coordinates.
    const alternatives = JSON.parse(await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8'));
    expect(alternatives.candidates).toHaveLength(1);
    expect(alternatives.candidates[0]).toMatchObject({
      sourceSnapshot: { text: savedBody.replace(/\n$/u, '') },
      sourceAnchor: { selectionStart, selectionEnd },
      provenance: { origin: 'manual' },
    });
    await expect(writing.getByTestId('revision-comparison-origin')).toHaveText('Draft');
    await expect(writing.getByText('Manual revision alternative saved. Your manuscript has not changed.', { exact: true })).toBeVisible();
    const selectedCandidateText = proposedText.slice(0, proposedText.indexOf('.') + 1);
    const draftBeforeAlternativeEdit = await readFile(draftPath, 'utf8');
    const comparison = writing.getByTestId('revision-comparison');
    await comparison.getByRole('button', { name: 'Edit alternative', exact: true }).click();
    const drawer = writing.getByTestId('writing-revision-drawer');
    const editedAlternative = `${selectedCandidateText}\nShe held her breath.`;
    await drawer.getByLabel('Revision alternative text').fill(editedAlternative);
    await expect(writing.getByRole('region', { name: 'Selected prose AI critique', exact: true })).toHaveCount(0);
    await drawer.getByRole('button', { name: 'Save revision alternative', exact: true }).click();
    await expect(drawer.getByText('Revision alternative saved. Your manuscript has not changed. Review it again before applying any part of it.', { exact: true })).toBeVisible();
    await expect(drawer.getByLabel('Revision alternative text')).toHaveValue(editedAlternative);
    const unsavedAlternative = `${editedAlternative}\nA final line.`;
    await drawer.getByLabel('Revision alternative text').fill(unsavedAlternative);
    page.once('dialog', async (dialog) => { await dialog.dismiss(); });
    await drawer.getByRole('button', { name: 'Close drawer', exact: true }).click();
    await expect(drawer).toBeVisible();
    await expect(drawer.getByLabel('Revision alternative text')).toHaveValue(unsavedAlternative);
    await drawer.getByLabel('Revision alternative text').fill(editedAlternative);
    await drawer.getByRole('button', { name: 'Close drawer', exact: true }).click();
    expect(await readFile(draftPath, 'utf8')).toBe(draftBeforeAlternativeEdit);
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await expect(writing.getByTestId('revision-comparison')).toBeVisible();
    const partial = writing.getByLabel('Part of this alternative to apply');
    await expect.poll(async () => partial.evaluate((element) => {
      const textarea = element as HTMLTextAreaElement;
      return textarea.selectionStart === textarea.selectionEnd;
    })).toBe(true);
    const partialBox = await partial.boundingBox();
    const pointerMetrics = await partial.evaluate((element, text) => {
      const style = getComputedStyle(element);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas text measurement is unavailable.');
      context.font = style.font;
      const fontSize = Number.parseFloat(style.fontSize);
      const parsedLineHeight = Number.parseFloat(style.lineHeight);
      return {
        paddingLeft: Number.parseFloat(style.paddingLeft),
        paddingTop: Number.parseFloat(style.paddingTop),
        lineHeight: Number.isFinite(parsedLineHeight) ? parsedLineHeight : fontSize * 1.2,
        textWidth: context.measureText(text).width,
      };
    }, selectedCandidateText);
    if (!partialBox) throw new Error('The partial alternative field has no visible bounds.');
    const pointerY = partialBox.y + pointerMetrics.paddingTop + pointerMetrics.lineHeight / 2;
    const pointerStartX = partialBox.x + pointerMetrics.paddingLeft + 2;
    await writing.mouse.move(pointerStartX, pointerY);
    await writing.mouse.down();
    await writing.mouse.move(pointerStartX + pointerMetrics.textWidth + 2, pointerY);
    await writing.mouse.up();
    await expect.poll(async () => partial.evaluate((element) => {
      const textarea = element as HTMLTextAreaElement;
      return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    })).toBe(selectedCandidateText);
    const partialBeforeTyping = await partial.inputValue();
    await partial.click();
    await expect(partial).toBeFocused();
    await writing.keyboard.type('x');
    expect(await partial.inputValue()).toBe(partialBeforeTyping);
    await writing.keyboard.press('Control+Home');
    await expect(partial).toBeFocused();
    for (let index = 0; index < selectedCandidateText.length; index += 1) {
      await writing.keyboard.press('Shift+ArrowRight');
    }
    await expect.poll(async () => partial.evaluate((element) => document.activeElement === element)).toBe(true);
    await expect.poll(async () => partial.evaluate((element) => {
      const textarea = element as HTMLTextAreaElement;
      return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    })).toBe(selectedCandidateText);
    await expect(writing.getByRole('button', { name: 'Apply only the selected part', exact: true })).toBeEnabled();
    await writing.getByRole('button', { name: 'Apply only the selected part', exact: true }).click();
    const expectedBody = `${savedBody.slice(0, selectionStart)}${selectedCandidateText}${savedBody.slice(selectionEnd)}`;
    const expectedDraft = `${header}\n${expectedBody}`;
    await expect.poll(async () => await readFile(draftPath, 'utf8')).toBe(expectedDraft);
    await expect(writing.getByText('This is the alternative you applied.', { exact: true })).toBeVisible();

    const restarted = await restartElectronApp(electronApp);
    const restartedPage = await restarted.firstWindow();
    const { writing: reopenedWriting } = await getProgram7Windows(restarted, restartedPage);
    await openProgram7Project(reopenedWriting, projectPath);
    await expect.poll(async () => await readFile(draftPath, 'utf8')).toBe(expectedDraft);
    await showCommandInWriting(reopenedWriting);
    await reopenedWriting.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await expect(reopenedWriting.getByTestId('revision-comparison')).toBeVisible();
    await expect(reopenedWriting.getByText('This is the alternative you applied.', { exact: true })).toBeVisible();
});


test('A changed saved passage blocks the earlier alternative without another manuscript write', async ({ page, electronApp }) => {
  const { projectPath } = await materializeProgram7Carmilla();
  const { writing } = await getProgram7Windows(electronApp, page);
  await openProgram7Project(writing, projectPath);
  await showCommandInWriting(writing);
  await writing.getByRole('button', { name: 'Story Knowledge', exact: true }).click();
  await writing.getByRole('button', { name: 'Signals', exact: true }).click();
  await writing.locator('[data-signal-id="program7-carmilla-review-signal"]')
    .getByRole('button', { name: 'Work on this', exact: true }).click();
  await writing.getByRole('article', { name: 'Revision task', exact: true }).first()
    .getByRole('button', { name: 'Open passage in Writing Studio', exact: true }).click();
  await showCommandInWriting(writing);
  await writing.locator('#program7-candidate-purpose').fill('Review the current opening.');
  await writing.locator('#program7-candidate-text').fill('An alternative that must become stale.');
  await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
  const draftPath = path.join(projectPath, 'drafts', 'carmilla-chapter-01.md');
  const before = await readFile(draftPath, 'utf8');
  await showWritingInWriting(writing);
  const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Chapter I — An Early Fright' });
  await editor.press('Control+Home');
  await editor.press('x');
  await editor.press('Control+s');
  await expect.poll(async () => await readFile(draftPath, 'utf8')).not.toBe(before);
  const changed = await readFile(draftPath, 'utf8');
  await showCommandInWriting(writing);
  await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  await expect(writing.getByTestId('revision-comparison-stale')).toContainText('passage changed');
  await expect(writing.getByRole('button', { name: 'Apply all of this alternative', exact: true })).toBeDisabled();
  await expect(writing.getByRole('button', { name: 'Apply only the selected part', exact: true })).toBeDisabled();
  const savedAlternatives = JSON.parse(await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8'));
  const earlierSource = savedAlternatives.candidates[0].sourceSnapshot.text;
  expect(before).toContain(earlierSource);
  await writing.getByTestId('revision-comparison').getByRole('button', { name: 'View alternative', exact: true }).click();
  const staleDrawer = writing.getByTestId('writing-revision-drawer');
  await expect(staleDrawer.getByRole('heading', { name: 'Saved source passage', exact: true })).toBeVisible();
  await expect(staleDrawer.getByRole('heading', { name: 'Your current manuscript', exact: true })).toHaveCount(0);
  await expect(staleDrawer.locator('pre')).toHaveText(earlierSource);
  await expect(staleDrawer.getByRole('alert')).toContainText('passage changed');
  await expect(staleDrawer.getByRole('heading', { name: 'View revision alternative', exact: true })).toBeVisible();
  await expect(staleDrawer.getByRole('textbox', { name: 'Revision alternative text' })).toBeDisabled();
  await expect(staleDrawer.getByRole('button', { name: 'Save revision alternative', exact: true })).toBeDisabled();
  await staleDrawer.getByRole('button', { name: 'Close drawer', exact: true }).click();
  await showCommandInWriting(writing);
  await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  const staleComparison = writing.getByTestId('revision-comparison');
  for (const name of ['Set this alternative aside', 'Do not use this alternative', 'Stop working on this alternative']) {
    await expect(staleComparison.getByRole('button', { name, exact: true })).toBeDisabled();
  }
  await expect(staleComparison.getByRole('button', { name: 'View alternative', exact: true })).toBeEnabled();
  await expect(staleComparison.getByRole('button', { name: 'Apply all of this alternative', exact: true })).toBeDisabled();
  const afterDecision = JSON.parse(await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8'));
  expect(afterDecision.candidates).toHaveLength(1);
  expect(afterDecision).toEqual(savedAlternatives);
  expect(await readFile(draftPath, 'utf8')).toBe(changed);
  const staleId = savedAlternatives.candidates[0].id;
  const staleCardId = `program7-history-item-revision-candidate:${staleId}`;
  const terminalRecords: { id: string; label: string; lifecycle: string }[] = [];
  for (const [action, label, lifecycle] of [
    ['Set this alternative aside', 'Set aside', 'parked'],
    ['Do not use this alternative', 'Not used', 'rejected'],
    ['Stop working on this alternative', 'Stopped', 'abandoned'],
  ]) {
    await showWritingInWriting(writing);
    await editor.click();
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.getByRole('button', { name: 'Revision Desk', exact: true }).click();
    await writing.locator('#program7-candidate-purpose').fill(`Current B — ${label}`);
    await writing.locator('#program7-candidate-text').fill('A current alternative that will not change the manuscript.');
    await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
    await writing.getByRole('button', { name: 'History', exact: true }).click();
    await expect(writing.getByTestId(staleCardId)).toContainText('Original has changed');
    await writing.getByRole('button', { name: 'Revision Desk', exact: true }).click();
    await writing.getByTestId('revision-comparison').getByRole('button', { name: 'Edit alternative', exact: true }).click();
    const drawer = writing.getByTestId('writing-revision-drawer');
    await drawer.getByRole('textbox', { name: 'Revision alternative text' }).fill('Edited current B; manuscript untouched.');
    await drawer.getByRole('button', { name: 'Save revision alternative', exact: true }).click();
    await drawer.getByRole('button', { name: 'Close drawer', exact: true }).click();
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.getByRole('button', { name: 'History', exact: true }).click();
    await expect(writing.getByTestId(staleCardId)).toContainText('Original has changed');
    await writing.getByRole('button', { name: 'Revision Desk', exact: true }).click();
    await writing.getByTestId('revision-comparison').filter({ has: writing.getByText(`Current B — ${label}`, { exact: true }) })
      .getByRole('button', { name: action, exact: true }).click();
    await expect(writing.getByText(`Revision alternative ${label.toLowerCase()}. Your manuscript has not changed.`, { exact: true })).toBeVisible();
    const records = JSON.parse(await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8')).candidates;
    const record = records.find((candidate: { purpose: string }) => candidate.purpose === `Current B — ${label}`);
    expect(record.lifecycle).toBe(lifecycle);
    terminalRecords.push({ id: record.id, label, lifecycle });
    await writing.getByRole('button', { name: 'History', exact: true }).click();
    await expect(writing.getByTestId(staleCardId)).toContainText('Original has changed');
    await expect(writing.getByTestId(`program7-history-item-revision-candidate:${record.id}`)).toContainText(label);
    expect(await readFile(draftPath, 'utf8')).toBe(changed);
  }
  await writing.getByRole('button', { name: 'Revision Desk', exact: true }).click();
  const unchangedStale = writing.getByTestId('revision-comparison').filter({ has: writing.getByText('Review the current opening.', { exact: true }) });
  await expect(unchangedStale.getByRole('button', { name: 'Apply all of this alternative', exact: true })).toBeDisabled();
  await expect(unchangedStale.getByRole('button', { name: 'Apply only the selected part', exact: true })).toBeDisabled();
  const durableAlternatives = await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8');
  const restarted = await restartElectronApp(electronApp);
  const { writing: reopened } = await getProgram7Windows(restarted, await restarted.firstWindow());
  await openProgram7Project(reopened, projectPath);
  await showCommandInWriting(reopened);
  await reopened.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  await reopened.getByRole('button', { name: 'History', exact: true }).click();
  await expect(reopened.getByTestId(staleCardId)).toContainText('Original has changed');
  for (const record of terminalRecords) {
    const card = reopened.getByTestId(`program7-history-item-revision-candidate:${record.id}`);
    await expect(card).toContainText(record.label);
    await expect(card.locator('time')).toHaveCount(2);
    await expect(card.getByRole('button', { name: /Apply/ })).toHaveCount(0);
  }
  expect(await readFile(draftPath, 'utf8')).toBe(changed);
  expect(await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8')).toBe(durableAlternatives);
});


test('Manual sentence replacement distinguishes a collapsed caret, whole section and selected source through a fresh restart', async ({ page, electronApp }, testInfo) => {
  const { projectPath } = await materializeProgram7Carmilla();
  const { writing } = await getProgram7Windows(electronApp, page);
  await openProgram7Project(writing, projectPath);
  await writing.evaluate(async () => {
    const bridge = window.projectSpine!;
    const current = await bridge.getSession();
    const created = await bridge.createUnit!({ projectId: current.project!.projectId, projectPath: current.project!.path, generation: current.generation, operationId: 'h6-selection-create', title: 'Selection scope check' });
    if (!created.ok) throw new Error(created.error.message);
  });
  const source = "The observatory's brass door had not opened in forty years. Mara pressed her palm against the cold glass and listened. Beyond it, the storm erased the road home. She knew the message inside was meant for her.\n\n";
  const replacement = 'Mara heard a faint rhythm beyond the glass.';
  const proposed = `${replacement} She held her breath.`;
  const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Selection scope check' });
  await editor.click();
  await editor.press('Control+a');
  await writing.keyboard.insertText(source);
  await expect.poll(async () => (await writing.evaluate(() => window.projectSpine!.getSession())).dirtyUnitIds.length).toBe(1);
  await editor.press('Control+s');
  const draftPath = await writing.evaluate(async () => {
    const current = await window.projectSpine!.getSession();
    return `${current.project!.path}/drafts/${current.activeUnitId}.md`;
  });
  await expect.poll(() => readFile(draftPath, 'utf8')).toContain(source);
  const before = await readFile(draftPath, 'utf8');
  await editor.press('Control+a');
  await editor.click();
  await expect.poll(() => writing.evaluate(() => window.getSelection()?.isCollapsed)).toBe(true);
  await showCommandInWriting(writing);
  await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  await writing.locator('#program7-candidate-purpose').fill('Caret only');
  await writing.locator('#program7-candidate-text').fill(proposed);
  await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
  await expect(writing.getByTestId('revision-comparison')).toBeVisible();
  const readCandidates = async () => JSON.parse(await readFile(path.join(projectPath, 'revision-candidates.json'), 'utf8')).candidates;
  await expect.poll(async () => (await readCandidates()).length).toBe(1);
  expect((await readCandidates())[0].sourceAnchor).toBeNull();
  await expect(writing.getByRole('button', { name: 'Apply only the selected part', exact: true })).toBeDisabled();
  expect(await readFile(draftPath, 'utf8')).toBe(before);

  await showWritingInWriting(writing);
  await editor.press('Control+a');
  await showCommandInWriting(writing);
  await writing.locator('#program7-candidate-purpose').fill('Whole section scope');
  await writing.locator('#program7-candidate-text').fill(proposed);
  await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
  await expect.poll(async () => (await readCandidates()).length).toBe(2);
  const whole = (await readCandidates()).find((candidate: { purpose: string }) => candidate.purpose === 'Whole section scope');
  expect(whole.sourceAnchor).toMatchObject({ selectionStart: 0, selectionEnd: source.length });
  const wholeComparison = writing.getByTestId('revision-comparison').filter({ has: writing.getByText('Whole section scope', { exact: true }) });
  await expect(wholeComparison.getByTestId('revision-replacement-text')).toHaveText(source);
  await expect(wholeComparison.getByText(/This replaces the entire saved section/)).toBeVisible();
  await expect(wholeComparison.getByRole('button', { name: 'Apply all of this alternative', exact: true })).toBeDisabled();
  await wholeComparison.getByTestId('revision-replacement-text').scrollIntoViewIfNeeded();
  await writing.screenshot({ path: testInfo.outputPath('whole-section-dark.png') });
  await writing.getByRole('switch', { name: 'Light theme', exact: true }).click();
  await writing.screenshot({ path: testInfo.outputPath('whole-section-light.png') });
  await writing.getByRole('switch', { name: 'Light theme', exact: true }).click();
  expect(await readFile(draftPath, 'utf8')).toBe(before);

  await showWritingInWriting(writing);
  await editor.press('Control+Home');
  for (let index = 0; index < 60; index += 1) await editor.press('ArrowRight');
  for (let index = 0; index < 58; index += 1) await editor.press('Shift+ArrowRight');
  await expect.poll(() => writing.evaluate(() => window.getSelection()?.toString())).toBe(source.slice(60, 118));
  await showCommandInWriting(writing);
  await writing.locator('#program7-candidate-purpose').fill('Make the sentence more tense');
  await writing.locator('#program7-candidate-text').fill(proposed);
  await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
  await expect.poll(async () => (await readCandidates()).length).toBe(3);
  const sentence = (await readCandidates()).find((candidate: { purpose: string }) => candidate.purpose === 'Make the sentence more tense');
  expect(sentence.sourceAnchor).toMatchObject({ selectionStart: 60, selectionEnd: 118 });
  const comparison = writing.getByTestId('revision-comparison').filter({ has: writing.getByText('Make the sentence more tense', { exact: true }) });
  await expect(comparison.getByTestId('revision-replacement-text')).toHaveText(source.slice(60, 118));
  const partial = comparison.getByLabel('Part of this alternative to apply');
  await partial.press('Control+Home');
  for (let index = 0; index < replacement.length; index += 1) await partial.press('Shift+ArrowRight');
  await comparison.getByRole('button', { name: 'Apply only the selected part', exact: true }).click();
  const expected = before.replace(source, `${source.slice(0, 60)}${replacement}${source.slice(118)}`);
  await expect.poll(() => readFile(draftPath, 'utf8')).toBe(expected);
  const restarted = await restartElectronApp(electronApp);
  const { writing: reopened } = await getProgram7Windows(restarted, await restarted.firstWindow());
  await openProgram7Project(reopened, projectPath);
  expect(await readFile(draftPath, 'utf8')).toBe(expected);
  await showCommandInWriting(reopened);
  await reopened.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  await reopened.getByRole('button', { name: 'History', exact: true }).click();
  await expect(reopened.getByText('Make the sentence more tense', { exact: true })).toBeVisible();
  const historical = (await readCandidates()).find((candidate: { id: string }) => candidate.id === sentence.id);
  const historyCard = reopened.getByTestId(`program7-history-item-revision-candidate:${sentence.id}`);
  await expect(historyCard).toContainText('Partly applied');
  await expect(historyCard).not.toContainText('Partially Accepted');
  await expect(historyCard.locator('time')).toHaveCount(2);
  await expect(historyCard.locator('time').nth(0)).toHaveAttribute('datetime', historical.createdAt);
  await expect(historyCard.locator('time').nth(1)).toHaveAttribute('datetime', historical.updatedAt);
  for (const theme of ['dark', 'light']) {
    const control = reopened.getByRole('switch', { name: 'Light theme', exact: true });
    if (await control.getAttribute('aria-checked') !== String(theme === 'light')) await control.click();
    await historyCard.scrollIntoViewIfNeeded();
    await expect(historyCard.locator('time').nth(0)).toBeInViewport();
    await expect(historyCard.locator('time').nth(1)).toBeInViewport();
    await reopened.screenshot({ path: testInfo.outputPath(`history-times-${theme}.png`) });
  }
});
