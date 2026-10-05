import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { StoryFoundationDocumentV1 } from '../../shared/ipc/storyFoundation';
import type { LivingOutlineDocumentV1 } from '../../shared/ipc/livingOutline';
import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
  showCommandInWriting,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true, disableLocalAi: true, preserveTestArtifacts: true });

test('Program 7 Create / Develop keeps Foundation and Ideas optional, bounded, and auditable', async ({ page, electronApp }) => {
  const { reviewRoot, projectPath } = await materializeProgram7Carmilla();
  try {
    const { writing } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);
    const draftPath = path.join(projectPath, 'drafts', 'carmilla-prologue.md');
    const draftBefore = await readFile(draftPath, 'utf8');
    await showCommandInWriting(writing);
    await writing.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await expect(writing.getByTestId('program7-create-develop')).toBeVisible();

    await writing.getByRole('button', { name: 'Story Foundation', exact: true }).click();
    await expect(writing.getByTestId('story-foundation')).toBeVisible();
    await expect(writing.getByTestId('story-foundation-optional')).toContainText('may skip');
    const foundationQuestion = writing.locator('[data-testid^="story-foundation-question-"]').first();
    await foundationQuestion.getByLabel(/Answer state for/).selectOption('answered');
    await foundationQuestion.getByLabel('Your note').fill('The author controls the final premise and voice.');
    await foundationQuestion.getByRole('button', { name: 'Save answer', exact: true }).click();
    await expect(writing.getByText('Saved as your project note.', { exact: true })).toBeVisible();

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
    await expect(branch.getByRole('heading', { name: 'Explore this premise', exact: true })).toBeVisible();
    const foundationPath = path.join(projectPath, 'story-foundation.json');
    const beforePreview = await readFile(foundationPath, 'utf8');
    await branch.getByRole('button', { name: 'Preview destination', exact: true }).click();
    await expect(branch.getByRole('status')).toContainText('ready to send');
    expect(await readFile(foundationPath, 'utf8')).toBe(beforePreview);
    expect(await readFile(draftPath, 'utf8')).toBe(draftBefore);

    const promotedText = 'A letter creates a bounded alternate direction for author exploration.';
    await branch.getByRole('button', { name: 'Send to Story Foundation', exact: true }).click();
    await expect.poll(async () => {
      const document = JSON.parse(await readFile(foundationPath, 'utf8')) as StoryFoundationDocumentV1;
      const entry = document.entries.find((item) => item.questionId === 'aboutness');
      return entry?.versions.find((version) => version.id === entry.currentVersionId);
    }).toMatchObject({ posture: 'answered', text: promotedText, provenance: 'author' });
    await writing.getByRole('button', { name: 'Story Foundation', exact: true }).click();
    await expect(writing.getByTestId('story-foundation-question-aboutness').getByLabel('Your note')).toHaveValue(promotedText);
    await writing.getByRole('button', { name: 'Ideas', exact: true }).click();

    await branch.getByLabel('Send to', { exact: true }).selectOption('outline');
    await branch.getByRole('button', { name: 'Preview destination', exact: true }).click();
    await expect(branch.getByRole('status')).toContainText('ready to send');
    await branch.getByRole('button', { name: 'Send to Outline', exact: true }).click();
    await expect.poll(async () => {
      const document = JSON.parse(await readFile(path.join(projectPath, 'living-outline.json'), 'utf8')) as LivingOutlineDocumentV1;
      return document.items.find((item) => item.label === 'The letter path');
    }).toMatchObject({ body: promotedText, kind: 'fragment', state: 'planned', manuscriptUnitId: null });
    expect(await readFile(draftPath, 'utf8')).toBe(draftBefore);
    const foundationAfter = await readFile(foundationPath, 'utf8');
    const outlinePath = path.join(projectPath, 'living-outline.json');
    const outlineAfter = await readFile(outlinePath, 'utf8');
    const rejectedMessage = 'Project changed. Open the project again before sending.';
    await electronApp.evaluate(({ ipcMain }, message) => {
      ipcMain.removeHandler('program7:promotion-handoff');
      ipcMain.handle('program7:promotion-handoff', async () => ({ ok: false, error: { code: 'STALE_SESSION', message } }));
    }, rejectedMessage);
    await branch.getByRole('button', { name: 'Send to Outline', exact: true }).click();
    await expect(writing.getByText(rejectedMessage, { exact: true })).toBeVisible();
    expect(await readFile(foundationPath, 'utf8')).toBe(foundationAfter);
    expect(await readFile(outlinePath, 'utf8')).toBe(outlineAfter);

    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('program7:promotion-handoff');
      ipcMain.handle('program7:promotion-handoff', async () => { throw new Error('Controlled unavailable reply'); });
    });
    await branch.getByRole('button', { name: 'Send to Outline', exact: true }).click();
    await expect(writing.getByText('The handoff result could not be confirmed. Check the destination before sending again.', { exact: true })).toBeVisible();
    expect(await readFile(foundationPath, 'utf8')).toBe(foundationAfter);
    expect(await readFile(outlinePath, 'utf8')).toBe(outlineAfter);
    expect(await readFile(draftPath, 'utf8')).toBe(draftBefore);
  } finally {
    console.info(`Program 7 campaign artifact retained at ${reviewRoot}; project ${projectPath}`);
  }
});
