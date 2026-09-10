import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from './_electron.fixture';
import { getStage19Windows } from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const materializer = path.join(repoRoot, 'scripts', 'program6-human-review.mjs');
const lenses = ['Overview', 'Emotion', 'Continuity', 'Timeline', 'Pacing', 'Pressure', 'Signals'] as const;
const lensHeadings: Record<typeof lenses[number], string> = {
  Overview: 'Overview',
  Emotion: 'Emotion Graph',
  Continuity: 'Continuity review',
  Timeline: 'Timeline',
  Pacing: 'Pacing',
  Pressure: 'Pressure',
  Signals: 'Signals',
};

async function materializeReviewCorpus(root: string): Promise<{
  readonly projects: readonly string[];
}> {
  const result = spawnSync(process.execPath, [materializer, '--root', root], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`Program 6 review materializer failed: ${result.stderr || result.stdout}`);
  }
  const report = JSON.parse(result.stdout) as { fixtures?: { projects?: string[] } };
  const projects = report.fixtures?.projects;
  if (!projects || projects.length !== 3) throw new Error('Program 6 review materializer did not return all three projects.');
  return { projects };
}

async function openProject(writing: import('@playwright/test').Page, projectPath: string): Promise<void> {
  const snapshot = await writing.evaluate(async ({ projectPath }) => {
    const result = await window.projectSpine!.openProject({
      path: projectPath,
      discardUnsaved: true,
      operationId: `program6-e2e-open-${Date.now()}`,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.snapshot;
  }, { projectPath });
  expect(snapshot.project?.path.toLocaleLowerCase()).toBe(projectPath.toLocaleLowerCase());
}

test('real Program 6 corpus projects expose the complete source-linked Story Knowledge workflow', async ({ page, electronApp }) => {
  const reviewRoot = await mkdtemp(path.join(tmpdir(), 'black-skies-program6-e2e-'));
  try {
    const { projects } = await materializeReviewCorpus(reviewRoot);
    const { writing, command } = await getStage19Windows(electronApp, page);

    for (const projectPath of projects) {
      await openProject(writing, projectPath);
      await expect(command.getByRole('heading', { level: 1 })).toHaveText(/Lantern House|Northline Letters|Glass Orchard/);
      const projectId = path.basename(projectPath) === 'glass-orchard'
        ? 'proj_glass_orchard_review'
        : path.basename(projectPath) === 'northline-letters'
          ? 'proj_northline_letters_review'
          : 'proj_lantern_house_review';
      const firstUnitId = projectId === 'proj_glass_orchard_review'
        ? 'go_01'
        : projectId === 'proj_northline_letters_review'
          ? 'nl_01'
          : 'lh_01';
      expect(await readFile(path.join(projectPath, 'drafts', `${firstUnitId}.md`), 'utf8')).not.toMatch(/synthetic review-corpus prose/i);
      await command.getByRole('button', { name: 'Story Knowledge', exact: true }).click();
      await expect(command.getByTestId('stage19-program6-story-knowledge')).toBeVisible();
      await expect(command.getByText(/will be introduced only by its authorized product program/i)).toHaveCount(0);

      for (const lens of lenses) {
        await command.getByRole('button', { name: lens, exact: true }).click();
        await expect(command.getByTestId('stage19-program6-story-knowledge')).toBeVisible();
        await expect(command.getByRole('heading', { name: lensHeadings[lens], exact: true })).toBeVisible();
      }

      await command.getByRole('button', { name: 'Signals', exact: true }).click();
      await expect(command.getByTestId('program6-signals-lens')).toBeVisible();
      const bodyText = await command.locator('[data-testid="program6-signals-lens"]').innerText();
      expect(bodyText).not.toMatch(/must never be rendered|protected source explanation/i);

      const record = JSON.parse(await readFile(path.join(projectPath, 'story-intelligence.json'), 'utf8')) as {
        projectId: string;
        revision: number;
        durableSignals: Array<{ positionRefs: Array<{ selectionStart?: number; selectionEnd?: number; selectionFingerprint?: string; sourceFingerprint: string }> }>;
      };
      expect(record.projectId).toBe(projectId);
      const anchoredRef = record.durableSignals[0]?.positionRefs[0];
      expect(anchoredRef?.selectionStart).toEqual(expect.any(Number));
      expect(anchoredRef?.selectionEnd).toEqual(expect.any(Number));
      expect(anchoredRef?.selectionFingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(anchoredRef?.sourceFingerprint).toMatch(/^[a-f0-9]{64}$/);
      const anchoredDraft = await readFile(path.join(projectPath, 'drafts', `${firstUnitId}.md`), 'utf8');
      const selectedText = anchoredDraft.slice(anchoredRef!.selectionStart!, anchoredRef!.selectionEnd!);
      expect(createHash('sha256').update(selectedText, 'utf8').digest('hex')).toBe(anchoredRef!.selectionFingerprint);
      expect(anchoredRef!.selectionEnd).toBeGreaterThan(anchoredRef!.selectionStart!);
      const frontMatterEnd = anchoredDraft.indexOf('\n---', 3);
      const durableBody = (frontMatterEnd >= 0 ? anchoredDraft.slice(frontMatterEnd + 4) : anchoredDraft).replace(/^\r?\n/u, '');
      expect(createHash('sha256').update(durableBody.replace(/\r\n/g, '\n').replace(/\r/g, '\n'), 'utf8').digest('hex')).toBe(anchoredRef!.sourceFingerprint);
      if (projectId === 'proj_lantern_house_review') {
        await command.getByRole('button', { name: 'Suppress', exact: true }).click();
        await expect(command.locator('p[role="status"]').filter({ hasText: /signal suppressed requested/i })).toBeVisible();
        await expect.poll(async () => {
          const next = JSON.parse(await readFile(path.join(projectPath, 'story-intelligence.json'), 'utf8')) as { revision: number };
          return next.revision;
        }).toBe(1);
      }
      if (projectId === 'proj_northline_letters_review') {
        await expect(command.getByText(/stale/i).first()).toBeVisible();
      }
      if (projectId === 'proj_glass_orchard_review') {
        const observedDraftBefore = await readFile(path.join(projectPath, 'drafts', 'go_01.md'), 'utf8');
        await command.getByRole('button', { name: 'Emotion', exact: true }).click();
        await command.getByLabel('Emotion point story section').selectOption('go_01');
        await command.getByLabel('Emotion point lane').selectOption('observed');
        await command.getByLabel('Emotion point label').fill('measured unease');
        await command.getByLabel('Emotion point intensity').selectOption('high');
        await command.getByLabel('Emotion point subject').fill('Iris Bell');
        await command.getByRole('button', { name: 'Save feeling note', exact: true }).click();
        await expect(command.getByRole('cell', { name: 'measured unease', exact: true })).toBeVisible();
        await expect.poll(async () => {
          const next = JSON.parse(await readFile(path.join(projectPath, 'story-intelligence.json'), 'utf8')) as {
            authorRecords: Array<{ label?: string }>;
          };
          return next.authorRecords.some((authorRecord) => authorRecord.label === 'measured unease');
        }).toBe(true);
        expect(await readFile(path.join(projectPath, 'drafts', 'go_01.md'), 'utf8')).toBe(observedDraftBefore);

        await command.getByRole('button', { name: 'Signals', exact: true }).click();
        await expect(command.getByText('Protected signal metadata', { exact: true })).toBeVisible();
        await expect(command.getByText(/content is excluded; no summary is displayed/i)).toBeVisible();
        const detachedSourceReturns = [
          { lens: 'Pacing', unitId: 'go_02', title: 'A Red Apple' },
          { lens: 'Pressure', unitId: 'go_02', title: 'A Red Apple' },
          { lens: 'Signals', unitId: 'go_01', title: 'The Empty Conservatory' },
        ] as const;
        for (const sourceReturn of detachedSourceReturns) {
          const manuscriptBefore = await readFile(path.join(projectPath, 'drafts', `${sourceReturn.unitId}.md`), 'utf8');
          await command.bringToFront();
          await command.getByRole('button', { name: sourceReturn.lens, exact: true }).click();
          await command.getByRole('button', { name: 'Review source', exact: true }).first().click();
          await expect(command.getByRole('region', { name: 'Command Center' })).toBeVisible();
          expect(command.isClosed()).toBe(false);
          await expect(writing.getByRole('textbox', { name: `Manuscript editor: ${sourceReturn.title}` })).toBeVisible();
          await expect(writing.locator(`[data-manuscript-unit-id="${sourceReturn.unitId}"] [aria-current="location"]`)).toBeVisible();
          expect(await readFile(path.join(projectPath, 'drafts', `${sourceReturn.unitId}.md`), 'utf8')).toBe(manuscriptBefore);
        }

        await command.bringToFront();
        await command.getByRole('button', { name: 'Timeline', exact: true }).click();
        await command.getByRole('button', { name: 'Review source', exact: true }).first().click();
        await expect(command.getByRole('region', { name: 'Command Center' })).toBeVisible();
        expect(command.isClosed()).toBe(false);
        await expect(writing.getByRole('textbox', { name: 'Manuscript editor: A Red Apple' })).toBeVisible();
      }

      if (projectId === 'proj_glass_orchard_review') {
        const sourceReturns = [
          { lens: 'Pacing', unitId: 'go_02', title: 'A Red Apple' },
          { lens: 'Pressure', unitId: 'go_02', title: 'A Red Apple' },
          { lens: 'Signals', unitId: 'go_01', title: 'The Empty Conservatory' },
        ] as const;
        for (const sourceReturn of sourceReturns) {
          const manuscriptBefore = await readFile(path.join(projectPath, 'drafts', `${sourceReturn.unitId}.md`), 'utf8');
          await writing.getByRole('button', { name: 'Open Command Center here', exact: true }).click();
          await expect(writing.getByRole('region', { name: 'Command Center' })).toBeVisible();
          await writing.getByRole('button', { name: 'Story Knowledge', exact: true }).click();
          await writing.getByRole('button', { name: sourceReturn.lens, exact: true }).click();
          await expect(writing.getByRole('heading', { name: lensHeadings[sourceReturn.lens], exact: true })).toBeVisible();
          await writing.getByRole('button', { name: 'Review source', exact: true }).first().click();
          await expect(writing.getByRole('region', { name: 'Writing Studio' })).toBeVisible();
          await expect(writing.getByRole('textbox', { name: `Manuscript editor: ${sourceReturn.title}` })).toBeVisible();
          await expect(writing.locator(`[data-manuscript-unit-id="${sourceReturn.unitId}"] [aria-current="location"]`)).toBeVisible();
          expect(await readFile(path.join(projectPath, 'drafts', `${sourceReturn.unitId}.md`), 'utf8')).toBe(manuscriptBefore);
        }
      }
    }
  } finally {
    await rm(reviewRoot, { recursive: true, force: true });
  }
});
