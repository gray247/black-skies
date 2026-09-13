import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true });

test('Program 7 routes a current Carmilla finding through no-AI revision review and explicit acceptance', async ({ page, electronApp }) => {
  const { reviewRoot, projectPath } = await materializeProgram7Carmilla();
  try {
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
    const activeCard = writing.getByRole('article', { name: /^Revision item / }).first();
    await expect(activeCard).toBeVisible();
    await activeCard.getByRole('button', { name: 'Run deterministic recheck', exact: true }).click();
    await expect(activeCard.getByText(/Deterministic:/)).toBeVisible();
    await activeCard.getByRole('button', { name: 'Mark resolved', exact: true }).click();
    await expect(writing.getByRole('heading', { name: 'Completed revision tasks', exact: true })).toBeVisible();
    await expect(writing.getByText('Program 6 finding routed to Revision Desk. No manuscript text changed.', { exact: true })).toHaveCount(0);

    const draftPath = path.join(projectPath, 'drafts', 'carmilla-prologue.md');
    const beforeCandidate = await readFile(draftPath, 'utf8');
    await writing.locator('#program7-candidate-purpose').fill('Tighten the opening source-linked passage.');
    await writing.locator('#program7-candidate-text').fill('A concise author-proposed opening alternative for review.');
    await writing.getByRole('button', { name: 'Save alternative', exact: true }).click();
    await expect(writing.getByTestId('revision-comparison')).toBeVisible();
    await expect(writing.getByTestId('revision-comparison-origin')).toHaveText('Manual author entry');
    await expect(writing.getByText('Candidate; still not manuscript truth.', { exact: true })).toBeVisible();
    await writing.getByRole('button', { name: 'Accept all candidate text', exact: true }).click();
    await expect.poll(async () => (await readFile(draftPath, 'utf8')) !== beforeCandidate).toBe(true);
    await expect(writing.locator('.program7-revision-capture__notice')).toHaveText(
      'Candidate accepted into the manuscript through the explicit destination-owner action.',
    );
  } finally {
    await rm(reviewRoot, { recursive: true, force: true });
  }
});
