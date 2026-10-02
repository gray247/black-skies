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

test('Program 7 routes a current Carmilla finding through no-AI revision review and explicit acceptance', async ({ page, electronApp }) => {
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
    const partial = writing.getByLabel('Part of this alternative to apply');
    const selectedCandidateText = proposedText.slice(0, proposedText.indexOf('.') + 1);
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
  expect(await readFile(draftPath, 'utf8')).toBe(changed);
});
