import { spawnSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElectronApplication, Page } from '@playwright/test';
import { expect } from './_electron.fixture';
import { getStage19Windows } from './stage19-electron-support';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const materializer = path.join(repoRoot, 'scripts', 'materialize-program7-carmilla-review.mjs');

export async function materializeProgram7Carmilla(): Promise<{
  readonly reviewRoot: string;
  readonly projectPath: string;
  readonly projectId: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}> {
  const reviewRoot = await mkdtemp(path.join(tmpdir(), 'black-skies-program7-e2e-'));
  const result = spawnSync(process.execPath, [materializer, '--root', reviewRoot], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Program 7 Carmilla materializer failed: ${result.stderr || result.stdout}`);
  }
  const report = JSON.parse(result.stdout) as { fixtureRoot?: string; projectId?: string; selectionStart: number; selectionEnd: number };
  if (!report.fixtureRoot || !report.projectId) throw new Error('Program 7 Carmilla materializer returned no project identity.');
  return { reviewRoot, projectPath: report.fixtureRoot, projectId: report.projectId, selectionStart: report.selectionStart, selectionEnd: report.selectionEnd };
}

export async function openProgram7Project(writing: Page, projectPath: string): Promise<void> {
  const snapshot = await writing.evaluate(async ({ projectPath: requestedPath }) => {
    const result = await window.projectSpine!.openProject({
      path: requestedPath,
      discardUnsaved: true,
      operationId: `program7-e2e-open-${Date.now()}`,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.snapshot;
  }, { projectPath });
  expect(snapshot.project?.path.toLocaleLowerCase()).toBe(projectPath.toLocaleLowerCase());
}

export async function getProgram7Windows(electronApp: ElectronApplication, page: Page): Promise<{
  readonly writing: Page;
  readonly command: Page;
}> {
  return getStage19Windows(electronApp, page);
}

export async function showCommandInWriting(writing: Page): Promise<void> {
  const control = writing.getByRole('button', { name: 'Open Command Center here', exact: true });
  if (await control.count()) await control.click();
  await expect(writing.getByRole('region', { name: 'Command Center' })).toBeVisible();
}

export async function showWritingInWriting(writing: Page): Promise<void> {
  const control = writing.getByRole('button', { name: 'Return to Writing Studio', exact: true });
  if (await control.count()) await control.click();
  await expect(writing.getByRole('region', { name: 'Writing Studio' })).toBeVisible();
}

export { repoRoot };
