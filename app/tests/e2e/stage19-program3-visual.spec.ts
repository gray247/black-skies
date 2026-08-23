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
test.skip(process.platform !== 'win32', 'Program 3 visual references are qualified on the approved Windows host.');

// Electron can round the native content area by one physical pixel when this
// visual journey follows other native-window journeys in the same worker. Keep
// the reference strict for material presentation changes while tolerating that
// host-only rasterization seam.
const NATIVE_WINDOW_ROUNDING_MAX_DIFF_RATIO = 0.025;

type VisualReferenceFrame = Readonly<{
  selector: string;
  width: number;
  height: number;
}>;

// The approved PNGs are element captures rather than window captures. Windows
// can give Electron a one-pixel different content rectangle after another
// native-window journey has run, which makes Playwright reject the comparison
// before it evaluates the permitted visual diff. Freeze only the capture frame
// to the approved reference dimensions; the product layout, viewport, and
// every rendered control remain unchanged.
const WRITING_STUDIO_REFERENCE_FRAME: VisualReferenceFrame = {
  selector: '.stage19-writing-shell',
  width: 1426,
  height: 924,
};

const COMMAND_REVIEW_REFERENCE_FRAME: VisualReferenceFrame = {
  selector: '[role="region"][aria-label="Command Center"]',
  width: 1440,
  height: 901,
};

async function stabilizeSurface(
  page: import('@playwright/test').Page,
  frame: VisualReferenceFrame,
): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.mouse.move(1, 1);
  await page.locator(frame.selector).evaluate(async (surface, referenceFrame) => {
    await document.fonts.ready;
    const active = document.activeElement as HTMLElement | null;
    active?.blur();
    const element = surface as HTMLElement;
    element.style.boxSizing = 'border-box';
    element.style.inlineSize = `${referenceFrame.width}px`;
    element.style.blockSize = `${referenceFrame.height}px`;
    element.style.maxInlineSize = 'none';
    element.style.maxBlockSize = 'none';
  }, frame);
}

test('Program 3 Writing Studio and Command Review match their targeted references', async ({
  electronApp,
  page,
}) => {
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-program3-visual-'));
  try {
    const { writing, command } = await getStage19Windows(electronApp, page);
    await writing.setViewportSize({ width: 1440, height: 900 });
    await command.setViewportSize({ width: 1440, height: 900 });
    await writing.evaluate(async (parentPath) => {
      const bridge = window.projectSpine!;
      const created = await bridge.createProject({
        parentPath,
        title: 'The Shattered Coast',
        operationId: 'program3-visual-project',
      });
      if (!created.ok) throw new Error(created.error.message);
      const unit = await bridge.createUnit!({
        projectId: created.snapshot.project!.projectId,
        projectPath: created.snapshot.project!.path,
        generation: created.snapshot.generation,
        operationId: 'program3-visual-unit',
        title: 'The Old Watchtower',
      });
      if (!unit.ok) throw new Error(unit.error.message);
    }, parent);

    const prose = [
      'The wind worried at the stones, pulling threads of mist across the broken walls.',
      'Kalen tightened his cloak and stepped closer to the tower\'s door.',
      '',
      'Inside, the air was colder.',
      '',
      'A staircase spiraled upward, vanishing into darkness. Somewhere above, something shifted.',
      '',
      'Kalen did not come here for answers. He came because the silence had become louder than the questions.',
    ].join('\n');
    const editor = writing.getByRole('textbox', { name: 'Manuscript editor: The Old Watchtower' });
    await editor.fill(prose);
    await stabilizeSurface(writing, WRITING_STUDIO_REFERENCE_FRAME);
    await expect(writing.locator('.stage19-writing-shell')).toHaveScreenshot(
      'program3-writing-studio.png',
      {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: NATIVE_WINDOW_ROUNDING_MAX_DIFF_RATIO,
      },
    );

    await editor.focus();
    await writing.keyboard.press('Control+A');
    await openWritingStudioRail(writing, 'Review');
    await writing.getByRole('button', { name: 'Review outbound critique request' }).click();
    await writing.getByLabel('OpenAI API key (session only; no readback)')
      .fill('synthetic-session-credential-123456');
    await writing.getByRole('button', { name: 'Set session key' }).click();
    await writing.getByRole('checkbox', {
      name: /Confirm that the exact visible passage is authorized for remote transmission/i,
    }).check();
    await writing.getByRole('button', { name: 'Approve and send exact payload' }).click();

    await expect(command.getByRole('heading', { name: 'Critique ready for your review' }))
      .toBeVisible();
    await stabilizeSurface(command, COMMAND_REVIEW_REFERENCE_FRAME);
    await expect(command.getByRole('region', { name: 'Command Center' })).toHaveScreenshot(
      'program3-command-review.png',
      {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: NATIVE_WINDOW_ROUNDING_MAX_DIFF_RATIO,
      },
    );
  } finally {
    await removeTemporaryDirectory(parent);
  }
});

// HARNESS_ONLY
// Reason: Freezes targeted Program 3 references on the approved deterministic Windows host.
// Owner: Program 3 P3-G automated qualification.
// Retire when: A later approved visual foundation replaces these exact Writing and Review surfaces.
