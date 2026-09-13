import { rm } from 'node:fs/promises';
import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true });

test('Program 7 Create / Develop keeps Foundation and Ideas optional, bounded, and auditable', async ({ page, electronApp }) => {
  const { reviewRoot, projectPath } = await materializeProgram7Carmilla();
  try {
    const { writing } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await expect(writing.getByTestId('program7-create-develop')).toBeVisible();

    await writing.getByRole('button', { name: 'Story Foundation', exact: true }).click();
    await expect(writing.getByTestId('story-foundation')).toBeVisible();
    await expect(writing.getByTestId('story-foundation-optional')).toContainText('may skip');
    const foundationQuestion = writing.locator('[data-testid^="story-foundation-question-"]').first();
    await foundationQuestion.getByLabel('Answer posture').selectOption('answered');
    await foundationQuestion.getByLabel('Your note').fill('The author controls the final premise and voice.');
    await foundationQuestion.getByRole('button', { name: 'Save answer', exact: true }).click();
    await expect(writing.getByText('Saved as author project guidance.', { exact: true })).toBeVisible();

    await writing.getByRole('button', { name: 'Ideas', exact: true }).click();
    await expect(writing.getByTestId('ideas-workspace')).toBeVisible();
    await writing.locator('#ideas-seed-title').fill('A hidden correspondence');
    await writing.locator('#ideas-seed-body').fill('A private possibility for the author to revisit later.');
    await writing.locator('#ideas-seed-tags').fill('mystery, correspondence');
    await writing.getByRole('button', { name: 'Save idea', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'A hidden correspondence', exact: true })).toBeVisible();
    await writing.getByLabel('Select for a new direction').check();
    await writing.locator('#ideas-branch-name').fill('The letter path');
    await writing.locator('#ideas-branch-premise').fill('A letter creates a bounded alternate direction for author exploration.');
    await writing.locator('#ideas-branch-unknowns').fill('Who sent the letter?\nWhat remains intentionally unknown?');
    await writing.getByRole('button', { name: 'Create direction', exact: true }).click();
    const branch = writing.getByTestId(/^idea-branch-/).last();
    await expect(branch).toContainText('The letter path');
    await expect(branch.getByText('Premise test · advisory only', { exact: true })).toBeVisible();
    await branch.getByRole('button', { name: 'Preview destination', exact: true }).click();
    await expect(branch.getByRole('status')).toContainText('ready to send');
  } finally {
    await rm(reviewRoot, { recursive: true, force: true });
  }
});
