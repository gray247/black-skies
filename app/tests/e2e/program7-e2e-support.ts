import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElectronApplication, Page } from '@playwright/test';
import { expect } from './_electron.fixture';
import { getStage19Windows } from './stage19-electron-support';
import { bootstrapFreshProject } from '../../main/projectBootstrap';

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
  const report = JSON.parse(result.stdout) as {
    fixtureRoot?: string;
    projectId?: string;
    selectionStart: number;
    selectionEnd: number;
  };
  if (!report.fixtureRoot || !report.projectId)
    throw new Error('Program 7 Carmilla materializer returned no project identity.');
  return {
    reviewRoot,
    projectPath: report.fixtureRoot,
    projectId: report.projectId,
    selectionStart: report.selectionStart,
    selectionEnd: report.selectionEnd,
  };
}

export async function materializeProgram7SyntheticProject(
  parentPath: string,
  scale: string,
  count: number,
): Promise<{ projectPath: string; projectId: string }> {
  const title = `Program 7 ${scale} synthetic scale`;
  const project = await bootstrapFreshProject({ parentPath, title, initialState: 'empty' });
  const outlinePath = path.join(project.projectPath, 'outline.json');
  const outline = JSON.parse(await readFile(outlinePath, 'utf8')) as {
    scenes: Array<{ id: string; title: string; order: number }>;
  };
  const units = Array.from({ length: count }, (_, index) => ({
    id: `unit_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    title: `Synthetic ${scale} Unit ${String(index + 1).padStart(3, '0')}`,
    order: index + 1,
  }));
  const draftsPath = path.join(project.projectPath, 'drafts');
  await mkdir(draftsPath, { recursive: true });
  await Promise.all(
    units.map((unit) =>
      writeFile(
        path.join(draftsPath, `${unit.id}.md`),
        `---\nid: ${unit.id}\ntitle: ${JSON.stringify(unit.title)}\norder: ${unit.order}\n---\n`,
        'utf8',
      ),
    ),
  );
  outline.scenes = units;
  await writeFile(outlinePath, `${JSON.stringify(outline, null, 2)}\n`, 'utf8');

  const writtenOutline = JSON.parse(await readFile(outlinePath, 'utf8')) as {
    scenes: Array<{ id: string }>;
  };
  if (writtenOutline.scenes.length !== count) {
    throw new Error(
      `Synthetic ${scale} outline read back ${writtenOutline.scenes.length} units, expected ${count}.`,
    );
  }
  const draftChecks = await Promise.all(
    writtenOutline.scenes.map((unit) => readFile(path.join(draftsPath, `${unit.id}.md`), 'utf8')),
  );
  if (draftChecks.length !== count || draftChecks.some((draft) => !draft.endsWith('---\n'))) {
    throw new Error(`Synthetic ${scale} drafts did not all pass the fixture readiness check.`);
  }
  return { projectPath: project.projectPath, projectId: project.projectId };
}

export async function openProgram7Project(writing: Page, projectPath: string): Promise<void> {
  const snapshot = await writing.evaluate(
    async ({ projectPath: requestedPath }) => {
      const result = await window.projectSpine!.openProject({
        path: requestedPath,
        discardUnsaved: true,
        operationId: `program7-e2e-open-${Date.now()}`,
      });
      if (!result.ok) throw new Error(result.error.message);
      return result.snapshot;
    },
    { projectPath },
  );
  expect(snapshot.project?.path.toLocaleLowerCase()).toBe(projectPath.toLocaleLowerCase());
}

export async function getProgram7Windows(
  electronApp: ElectronApplication,
  page: Page,
): Promise<{
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
