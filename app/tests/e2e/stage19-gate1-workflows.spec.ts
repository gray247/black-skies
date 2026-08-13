import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, markElectronApplicationExitedCleanly, test } from './_electron.fixture';
import {
  closeLaunchedApplicationBestEffort,
  getStage19Windows,
  launchStage19BuiltApplication,
  openWritingStudioRail,
  removeTemporaryDirectory,
  requestWritingStudioClose,
  waitForCleanElectronApplicationExit,
} from './stage19-electron-support';

test.use({
  splitCommandRuntimeConfig: true,
  skipPageCloseTeardown: true,
  skipFailureScreenshotAfterVerifiedExit: true,
});

test('Human Gate 1 workflows remain advisory, linked, isolated, and durable across reopen', async ({ electronApp, page }) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-stage19-gate1-e2e-'));
  let relaunched: Awaited<ReturnType<typeof launchStage19BuiltApplication>> | null = null;
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    expect(await writing.evaluate(() => ({
      livingOutline: Object.keys(window.livingOutline ?? {}).sort(),
      feedbackNotes: Object.keys(window.feedbackNotes ?? {}).sort(),
    }))).toEqual({
      livingOutline: ['createItem', 'deleteItem', 'get', 'linkItem', 'moveItem', 'updateItem'].sort(),
      feedbackNotes: ['createFromCritique', 'list'].sort(),
    });
    expect(await command.evaluate(() => ({
      livingOutline: typeof window.livingOutline,
      feedbackNotes: typeof window.feedbackNotes,
    }))).toEqual({ livingOutline: 'undefined', feedbackNotes: 'undefined' });

    const created = await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const project = await bridge.createProject({
        parentPath, title: 'Gate One Project', operationId: 'gate1-create-project',
      });
      if (!project.ok) throw new Error(project.error.message);
      const opening = await bridge.createUnit!({
        projectId: project.snapshot.project!.projectId,
        projectPath: project.snapshot.project!.path,
        generation: project.snapshot.generation,
        operationId: 'gate1-create-opening',
        title: 'Opening Signal',
      });
      if (!opening.ok) throw new Error(opening.error.message);
      const arrival = await bridge.createUnit!({
        projectId: opening.snapshot.project!.projectId,
        projectPath: opening.snapshot.project!.path,
        generation: opening.snapshot.generation,
        operationId: 'gate1-create-arrival',
        title: 'Impossible Arrival',
      });
      if (!arrival.ok) throw new Error(arrival.error.message);
      return {
        projectId: arrival.snapshot.project!.projectId,
        projectPath: arrival.snapshot.project!.path,
        openingUnitId: opening.data.unitId,
        arrivalUnitId: arrival.data.unitId,
      };
    }, parent);

    const openingProse = `${'Rain marked the station glass while Mara waited beneath a clock that had stopped before midnight. '.repeat(5)}End.`;
    await openWritingStudioRail(writing, 'story tools');
    await writing.getByRole('button', { name: /^01 Opening Signal$/ }).click();
    const openingEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Opening Signal' });
    await openingEditor.fill(openingProse);
    await writing.getByRole('button', { name: /^Save$/ }).click();
    await expect(writing.getByRole('status').filter({ hasText: 'Saved durably' })).toBeVisible();

    await openingEditor.focus();
    await writing.keyboard.press('Control+A');
    await writing.getByRole('button', { name: 'Add to story here' }).click();
    await expect(writing.getByText('Selected passage in Opening Signal')).toBeVisible();
    const openingOutlineTitle = writing.locator('.stage19-living-outline__rename input');
    await expect(openingOutlineTitle).toHaveValue(/Rain marked the station glass/);
    await openingOutlineTitle.fill('Opening question');
    await openingOutlineTitle.press('Enter');
    await writing.getByRole('button', { name: 'More options for Opening question' }).click();
    const openingOptions = writing.getByRole('region', { name: 'More options for Opening question' });
    await openingOptions.getByLabel('Source state').selectOption('authored');
    await openingOptions.getByRole('button', { name: 'Save options' }).click();
    await openingOptions.getByRole('button', { name: 'Close' }).click();
    await expect(writing.getByRole('button', { name: 'Show Opening question in manuscript' })).toBeVisible();

    await writing.getByRole('button', { name: /^02 Impossible Arrival$/ }).click();
    const arrivalEditor = writing.getByRole('textbox', { name: 'Manuscript editor: Impossible Arrival' });
    await arrivalEditor.fill('The ship arrived where no harbor existed.');
    await writing.getByRole('button', { name: /^Save$/ }).click();
    await writing.getByRole('button', { name: 'Add to story here' }).click();
    const arrivalOutlineTitle = writing.getByRole('textbox', { name: 'Title for New story point' });
    await arrivalOutlineTitle.fill('Bridge into the impossible arrival');
    await arrivalOutlineTitle.press('Enter');
    await writing.getByRole('button', { name: 'More options for Bridge into the impossible arrival' }).click();
    const arrivalOptions = writing.getByRole('region', { name: 'More options for Bridge into the impossible arrival' });
    await arrivalOptions.getByLabel('Structural meaning').selectOption('gap');
    await arrivalOptions.getByLabel('Source state').selectOption('proposed');
    await arrivalOptions.getByRole('button', { name: 'Save options' }).click();

    const protectedBeforeMove = await Promise.all([
      readFile(join(created.projectPath, 'outline.json'), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.openingUnitId}.md`), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.arrivalUnitId}.md`), 'utf8'),
    ]);
    const outlineItems = writing.locator('.stage19-living-outline__items > li');
    await expect(outlineItems).toHaveCount(2);
    const dragData = await writing.evaluateHandle(() => new DataTransfer());
    await outlineItems.nth(1).dispatchEvent('dragstart', { dataTransfer: dragData });
    await outlineItems.nth(0).dispatchEvent('dragover', { dataTransfer: dragData });
    await outlineItems.nth(0).dispatchEvent('drop', { dataTransfer: dragData });
    await expect(writing.getByText('Planning order saved. Accepted manuscript order was not changed.')).toBeVisible();
    await writing.getByText('Compare the story plan with the manuscript').click();
    await expect(writing.getByText('Preview only. Moving this plan never moves your written pages.')).toBeVisible();
    expect(await Promise.all([
      readFile(join(created.projectPath, 'outline.json'), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.openingUnitId}.md`), 'utf8'),
      readFile(join(created.projectPath, 'drafts', `${created.arrivalUnitId}.md`), 'utf8'),
    ])).toEqual(protectedBeforeMove);

    await writing.getByRole('button', { name: 'Enter Focus mode' }).click();
    await expect(writing.getByRole('complementary', { name: 'Story rail' })).toHaveCount(0);
    await expect(arrivalEditor).toContainText('The ship arrived where no harbor existed.');
    await writing.getByRole('button', { name: 'Exit Focus mode' }).click();

    await writing.getByRole('button', { name: /^01 Opening Signal$/ }).click();
    await openingEditor.focus();
    await writing.keyboard.press('Control+A');
    await openWritingStudioRail(writing, 'writing support');
    await writing.getByRole('button', { name: 'Review outbound critique request' }).click();
    await expect(writing.getByRole('heading', { name: 'Exact outbound preview' })).toBeVisible();
    await writing.getByLabel('OpenAI API key (session only; no readback)').fill('synthetic-session-credential-123456');
    await writing.getByRole('button', { name: 'Set session key' }).click();
    await writing.getByRole('checkbox', {
      name: /Confirm that the exact visible passage is authorized for remote transmission/i,
    }).check();
    await writing.getByRole('button', { name: 'Approve and send exact payload' }).click();
    await expect(command.getByRole('heading', { name: 'Critique ready for your review' })).toBeVisible();
    await expect(command.getByRole('region', { name: 'Advisory critique result' })).toContainText('Deterministic advisory fixture');
    await expect(command.locator('.stage19-command-review__limitation')).toContainText('no provider request or charge occurred');
    await command.getByLabel('Save only the concise advisory note you choose').fill('Keep the stopped-clock unease, but clarify the arrival trigger.');
    await command.getByRole('button', { name: 'Save advisory note' }).click();
    await expect(command.getByText('Advisory project note saved. It is separate from manuscript and outline files.')).toBeVisible();
    await expect(openingEditor).toContainText(openingProse);

    const livingSidecar = JSON.parse(await readFile(join(created.projectPath, 'living-outline.json'), 'utf8')) as {
      projectId: string; items: Array<{ label: string; manuscriptUnitId: string | null }>;
    };
    expect(livingSidecar.projectId).toBe(created.projectId);
    expect(livingSidecar.items.map((item) => [item.label, item.manuscriptUnitId])).toEqual([
      ['Bridge into the impossible arrival', created.arrivalUnitId],
      ['Opening question', created.openingUnitId],
    ]);
    const feedbackSidecar = JSON.parse(await readFile(join(created.projectPath, 'feedback-notes.json'), 'utf8')) as {
      projectId: string; notes: Array<{ body: string; advisory: boolean }>;
    };
    expect(feedbackSidecar).toMatchObject({
      projectId: created.projectId,
      notes: [{ body: 'Keep the stopped-clock unease, but clarify the arrival trigger.', advisory: true }],
    });

    const firstExit = waitForCleanElectronApplicationExit(electronApp);
    await requestWritingStudioClose(electronApp);
    expect(await firstExit).toEqual({ code: 0, signal: null });
    markElectronApplicationExitedCleanly(electronApp);

    relaunched = await launchStage19BuiltApplication('black-skies-stage19-gate1-reopen-');
    const reopened = await getStage19Windows(relaunched.application);
    await reopened.writing.evaluate(async (projectPath) => {
      const opened = await window.projectSpine!.openProject({ path: projectPath, operationId: 'gate1-reopen-project' });
      if (!opened.ok) throw new Error(opened.error.message);
    }, created.projectPath);
    await expect(reopened.writing.getByRole('heading', { name: 'Gate One Project' })).toBeVisible();
    await openWritingStudioRail(reopened.writing, 'story tools');
    await expect(reopened.writing.getByRole('button', { name: 'Bridge into the impossible arrival', exact: true })).toBeVisible();
    await expect(reopened.writing.getByText('Something goes here')).toBeVisible();
    await expect(reopened.writing.getByText('Suggested')).toBeVisible();
    await reopened.writing.getByRole('button', { name: 'Show Opening question in manuscript' }).click();
    await expect(reopened.writing.getByRole('textbox', { name: 'Manuscript editor: Opening Signal' })).toContainText(openingProse);
    const reopenedFeedbackSidecar = JSON.parse(await readFile(join(created.projectPath, 'feedback-notes.json'), 'utf8')) as {
      projectId: string; notes: Array<{ body: string; advisory: boolean }>;
    };
    expect(reopenedFeedbackSidecar).toEqual(feedbackSidecar);
    await expect(reopened.command.getByRole('heading', { name: 'No critique is waiting' })).toBeVisible();

    await reopened.writing.evaluate(async (parentPath) => {
      const isolated = await window.projectSpine!.createProject({
        parentPath, title: 'Isolated Empty Project', operationId: 'gate1-create-isolated',
      });
      if (!isolated.ok) throw new Error(isolated.error.message);
    }, parent);
    await expect(reopened.writing.getByRole('heading', { name: 'Isolated Empty Project' })).toBeVisible();
    await expect(reopened.command.getByRole('heading', { name: 'No critique is waiting' })).toBeVisible();
    await openWritingStudioRail(reopened.writing, 'story tools');
    await expect(reopened.writing.getByRole('region', { name: 'Story plan' }).getByText('0', { exact: true })).toBeVisible();
    await expect(reopened.writing.getByText('Keep the stopped-clock unease, but clarify the arrival trigger.')).toHaveCount(0);
    await reopened.writing.getByRole('button', { name: 'Add to story here' }).click();
    const unplacedTitle = reopened.writing.getByRole('textbox', { name: 'Title for New story point' });
    await unplacedTitle.fill('Unplaced thought');
    await unplacedTitle.press('Enter');
    await expect(reopened.writing.getByText('Not placed yet', { exact: true })).toBeVisible();

    const secondExit = waitForCleanElectronApplicationExit(relaunched.application);
    await requestWritingStudioClose(relaunched.application);
    expect(await secondExit).toEqual({ code: 0, signal: null });
    await removeTemporaryDirectory(relaunched.userDataDirectory);
    await removeTemporaryDirectory(relaunched.runtimeDirectory);
    relaunched = null;
  } finally {
    await closeLaunchedApplicationBestEffort(relaunched);
    await removeTemporaryDirectory(parent);
  }
});
// HARNESS_ONLY
// Reason: Exercises deterministic Gate 1 workflow and reopen state in built Electron windows.
// Owner: V2 Human Gate 1 automated qualification.
// Retire when: Installed-build Gate 1 workflow truth provides equivalent deterministic coverage.
