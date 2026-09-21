import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true, disableLocalAi: true });

test('Program 7 local-AI controls fail closed when the project policy has not admitted inference', async ({ page, electronApp }) => {
  const { reviewRoot, projectPath } = await materializeProgram7Carmilla();
  try {
    const { writing } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);
    const draftPath = path.join(projectPath, 'drafts', 'carmilla-prologue.md');
    const before = await readFile(draftPath, 'utf8');
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await writing.locator('#program7-candidate-purpose').fill('Offer a bounded alternative for author review.');
    const localButton = writing.getByRole('button', { name: 'Ask local AI for an alternative', exact: true });
    await expect(localButton).toBeEnabled();
    await localButton.click();
    await expect(writing.locator('.program7-revision-capture__notice')).toContainText(/failed|unavailable|disabled|no change/i);
    await expect(writing.getByTestId('revision-comparison')).toHaveCount(0);
    expect(await readFile(draftPath, 'utf8')).toBe(before);
  } finally {
    await rm(reviewRoot, { recursive: true, force: true });
  }
});

test.describe('Program 7 local-AI opt-in production bridge', () => {
  test.use({ disableLocalAi: false });

  test('author-requested local-AI candidate stays advisory until explicit acceptance', async ({ page, electronApp }) => {
    test.skip(process.env.PROGRAM7_E2E_LOCAL_AI !== '1', 'Opt in with PROGRAM7_E2E_LOCAL_AI=1 for the real qwen3:4b journey.');
    const { reviewRoot, projectPath } = await materializeProgram7Carmilla();
    try {
      const { writing } = await getProgram7Windows(electronApp, page);
      await openProgram7Project(writing, projectPath);
      const draftPath = path.join(projectPath, 'drafts', 'carmilla-prologue.md');
      const before = await readFile(draftPath, 'utf8');
      await showCommandInWriting(writing);
      await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
      await writing.locator('#program7-candidate-purpose').fill('Offer one bounded alternative for author review without changing the manuscript.');
      await writing.getByRole('button', { name: 'Ask local AI for an alternative', exact: true }).click();
      await expect(writing.locator('.program7-revision-capture__notice')).toContainText('Local-AI candidate saved for author comparison.', { timeout: 35_000 });
      await expect(writing.getByTestId('revision-comparison')).toBeVisible();
      await expect(writing.getByRole('button', { name: 'Accept all candidate text', exact: true })).toBeVisible();
      expect(await readFile(draftPath, 'utf8')).toBe(before);
    } finally {
      await rm(reviewRoot, { recursive: true, force: true });
    }
  });
});
