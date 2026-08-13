import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test } from './_electron.fixture';
import {
  getStage19Windows,
  openWritingStudioRail,
  removeTemporaryDirectory,
} from './stage19-electron-support';

test.use({ splitCommandRuntimeConfig: true });

test('Program 3 reflows at large text, honors reduced motion, and preserves keyboard task access', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-program3-presentation-'));
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'Program 3 Presentation',
        operationId: 'program3-presentation-project',
      });
      if (!created.ok) throw new Error(created.error.message);
      const unit = await bridge.createUnit!({
        projectId: created.snapshot.project!.projectId,
        projectPath: created.snapshot.project!.path,
        generation: created.snapshot.generation,
        operationId: 'program3-presentation-unit',
        title: 'Readable Passage',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    await writing.setViewportSize({ width: 720, height: 900 });
    await writing.emulateMedia({ reducedMotion: 'reduce' });
    await writing.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const prose = `${'The signal crossed the empty harbor while Mara counted each unanswered bell. '.repeat(6)}End.`;
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: Readable Passage' });
    await editor.fill(prose);
    await openWritingStudioRail(writing, 'story tools');
    const manuscriptTools = writing.getByRole('region', { name: 'Story tools' });
    const railBox = await manuscriptTools.boundingBox();
    expect(railBox).not.toBeNull();
    expect(railBox!.x).toBeGreaterThanOrEqual(0);
    expect(railBox!.x + railBox!.width).toBeLessThanOrEqual(721);
    expect(await writing.getByRole('button', { name: 'Open project tools' }).evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).transitionDuration),
    )).toBeLessThanOrEqual(0.001);
    const enterFocus = writing.getByRole('button', { name: 'Enter Focus mode' });
    await enterFocus.focus();
    await writing.keyboard.press('Enter');
    await expect(writing.getByRole('navigation', { name: 'Writing Studio edge controls' }))
      .toHaveCount(0);
    await expect(editor).toContainText(prose);
    await expect(writing.getByRole('button', { name: 'Exit Focus mode' })).toBeFocused();
    await writing.keyboard.press('Enter');
    await expect(manuscriptTools).toBeVisible();

    await editor.focus();
    await writing.keyboard.press('Control+A');
    await openWritingStudioRail(writing, 'writing support');
    await writing.getByRole('button', { name: 'Review outbound critique request' }).click();
    await writing.getByLabel('OpenAI API key (session only; no readback)')
      .fill('synthetic-session-credential-123456');
    await writing.getByRole('button', { name: 'Set session key' }).click();
    await writing.getByRole('checkbox', {
      name: /Confirm that the exact visible passage is authorized for remote transmission/i,
    }).check();
    await writing.getByRole('button', { name: 'Approve and send exact payload' }).click();

    await command.setViewportSize({ width: 720, height: 900 });
    await command.emulateMedia({ reducedMotion: 'reduce' });
    await command.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expect(command.getByRole('heading', { name: 'Critique ready for your review' }))
      .toBeVisible();
    await expect(command.getByRole('region', { name: 'Advisory critique result' }))
      .toContainText('Deterministic advisory fixture');
    await expect(command.locator('.stage19-command-review__state')).toHaveText(/completed/i);
    await expect(command.locator('.stage19-command-review__header .stage19-spine__eyebrow'))
      .toHaveText(/Advisory critique.*author decides/i);

    const reviewBox = await command.locator('.stage19-command-review').boundingBox();
    expect(reviewBox).not.toBeNull();
    expect(reviewBox!.x).toBeGreaterThanOrEqual(0);
    expect(reviewBox!.x + reviewBox!.width).toBeLessThanOrEqual(721);
    expect(await command.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
      .toBe(true);

    const workspace = command.getByRole('navigation', { name: 'Command Center workspaces' });
    const review = workspace.getByRole('button', { name: 'Review', exact: true });
    const structure = workspace.getByRole('button', { name: 'Structure', exact: true });
    await review.focus();
    await command.keyboard.press('Tab');
    await expect(structure).toBeFocused();
    await command.keyboard.press('Enter');
    await expect(command.getByRole('heading', { name: 'Structure', exact: true })).toBeVisible();
    await command.keyboard.press('Shift+Tab');
    await expect(review).toBeFocused();
    await command.keyboard.press('Enter');
    await expect(command.getByRole('heading', { name: 'Critique ready for your review' }))
      .toBeVisible();
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

// HARNESS_ONLY
// Reason: Proves Program 3 large-text, responsive, reduced-motion, Focus, and keyboard behavior in built Electron.
// Owner: Program 3 P3-G automated qualification.
// Retire when: Installed Human Gate 2 evidence supplies equivalent presentation-state coverage.
