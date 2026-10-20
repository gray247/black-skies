// HARNESS_ONLY:
// Reason: exercises a materialized 17-unit Carmilla project through the Electron harness and production project bridge, not an installed-product truth receipt.
// Owner: app/tests/e2e/program7-long-form.spec.ts
// Retire when: installed-build qualification provides equivalent long-form project, unit-selection and attached/detached session coverage without harness-only dependencies.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from './_electron.fixture';
import {
  getProgram7Windows,
  materializeProgram7Carmilla,
  openProgram7Project,
} from './program7-e2e-support';

test.use({ splitCommandRuntimeConfig: true, disableLocalAi: true, preserveTestArtifacts: true });

test('Program 7 Carmilla long-form review exposes all 17 units across current and detached surfaces', async ({ page, electronApp }) => {
  const { reviewRoot, projectPath, projectId } = await materializeProgram7Carmilla();
  try {
    const { writing, command } = await getProgram7Windows(electronApp, page);
    await openProgram7Project(writing, projectPath);
    const draftFiles = await (async () => {
      const draftsRoot = path.join(projectPath, 'drafts');
      const entries = await (await import('node:fs/promises')).readdir(draftsRoot);
      return entries.filter((entry) => entry.endsWith('.md'));
    })();
    expect(draftFiles).toHaveLength(17);
    const prologue = await readFile(path.join(projectPath, 'drafts', 'carmilla-prologue.md'), 'utf8');
    expect(prologue).toContain('PROLOGUE');
    expect(prologue.split(/\s+/u).filter(Boolean).length).toBeGreaterThan(80);

    await expect(writing.locator('[data-manuscript-unit-id]')).toHaveCount(17);
    await writing.locator('[data-manuscript-unit-id]').last().getByRole('button').first().click();
    await expect(writing.locator('[data-manuscript-unit-id]').last().locator('[aria-current="location"]')).toHaveCount(1);
    const sessions = await Promise.all([writing, command].map(async (surface) => surface.evaluate(async () => {
      const session = await window.projectSpine!.getSession();
      return { role: window.projectSpine!.windowRole, projectId: session.project?.projectId ?? null };
    })));
    expect(sessions.map((entry) => entry.projectId)).toEqual([projectId, projectId]);
    expect(new Set(sessions.map((entry) => entry.role))).toEqual(new Set(['writing', 'command']));

    await command.getByRole('button', { name: 'Create / Develop', exact: true }).click();
    await expect(command.getByTestId('program7-create-develop')).toBeVisible();
    await expect(command.getByRole('heading', { name: 'Develop your story', exact: true })).toBeVisible();
    await command.getByRole('button', { name: 'History', exact: true }).click();
    await expect(command.getByTestId('program7-history')).toBeVisible();
    await expect(command.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
  } finally {
    console.info(`Program 7 campaign artifact retained at ${reviewRoot}; project ${projectPath}`);
  }
});
