import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true, disableLocalAi: true, preserveTestArtifacts: true });

test('Program 7 hides unavailable local-AI controls while preserving manual revision alternatives', async ({ page, electronApp }) => {
  const { projectPath } = await materializeProgram7Carmilla();
  const { writing } = await getProgram7Windows(electronApp, page);
  await openProgram7Project(writing, projectPath);
  const draftPath = path.join(projectPath, 'drafts', 'carmilla-prologue.md');
  const before = await readFile(draftPath, 'utf8');
  await showCommandInWriting(writing);
  await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
  await expect(writing.getByText('Local AI is unavailable. You can still create and review revision alternatives yourself.', { exact: true })).toBeVisible();
  await expect(writing.getByRole('button', { name: 'Ask local AI for an alternative', exact: true })).toHaveCount(0);
  await writing.locator('#program7-candidate-purpose').fill('Offer a bounded alternative for author review.');
  await writing.locator('#program7-candidate-text').fill('A manual alternative remains available for author review.');
  await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
  await expect(writing.getByTestId('revision-comparison')).toBeVisible();
  expect(await readFile(draftPath, 'utf8')).toBe(before);
});

test.describe('Program 7 local-AI opt-in production bridge', () => {
  test.use({ disableLocalAi: false });

  test('author-requested local-AI candidate stays advisory until explicit acceptance', async ({ page, electronApp }) => {
    test.skip(process.env.PROGRAM7_E2E_LOCAL_AI !== '1', 'Opt in with PROGRAM7_E2E_LOCAL_AI=1 for the real qwen3:4b journey.');
    const { projectPath } = await materializeProgram7Carmilla();
    const { writing } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);
    const draftPath = path.join(projectPath, 'drafts', 'carmilla-prologue.md');
    const before = await readFile(draftPath, 'utf8');
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.locator('#program7-candidate-purpose').fill('Offer one bounded alternative for author review without changing the manuscript.');
    await writing.getByRole('button', { name: 'Ask local AI for an alternative', exact: true }).click();
    await expect(writing.locator('.program7-revision-capture__notice')).toContainText('Local AI revision alternative saved for your review.', { timeout: 35_000 });
    await expect(writing.getByTestId('revision-comparison')).toBeVisible();
    await expect(writing.getByRole('button', { name: 'Apply all of this alternative', exact: true })).toBeVisible();
    expect(await readFile(draftPath, 'utf8')).toBe(before);
  });
});
