import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => process.cwd()),
  },
  dialog: {
    showOpenDialog: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}));

import {
  extractFrontMatter,
  loadProjectFromDisk,
  parseFrontMatterValue,
  runWithConcurrency,
  MAX_SCENE_READ_CONCURRENCY,
} from '../projectLoaderIpc';

describe('projectLoaderIpc helpers', () => {
  it('extractFrontMatter parses scalar and array values', () => {
    const raw = `---
id: sc-001
title: The Vault
order: 2
beats: ["setup", "turn"]
word_target: 900
---
Scene body`;

    const frontMatter = extractFrontMatter(raw);
    expect(frontMatter).not.toBeNull();
    expect(frontMatter).toMatchObject({
      id: 'sc-001',
      title: 'The Vault',
      order: 2,
      beats: ['setup', 'turn'],
      word_target: 900,
    });
  });

  it('parseFrontMatterValue handles quoted strings and numbers', () => {
    expect(parseFrontMatterValue('"whisper"')).toBe('whisper');
    expect(parseFrontMatterValue('["one","two"]')).toEqual(['one', 'two']);
    expect(parseFrontMatterValue('42')).toBe(42);
  });

  it('runWithConcurrency limits concurrent executions', async () => {
    const items = Array.from({ length: 5 }, (_, index) => index);
    let active = 0;
    let peak = 0;

    await runWithConcurrency(items, 2, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });

    expect(peak).toBeLessThanOrEqual(2);
    expect(MAX_SCENE_READ_CONCURRENCY).toBeGreaterThan(0);
  });

  it('loads persisted manual rewrite marks into editorial reviews', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bs-project-loader-'));
    await fs.writeFile(
      path.join(root, 'outline.json'),
      JSON.stringify({
        schema_version: 'OutlineSchema v1',
        outline_id: 'outline-001',
        acts: ['Act I'],
        chapters: [{ id: 'ch_0001', order: 1, title: 'Opening' }],
        scenes: [{ id: 'sc_0001', order: 1, title: 'Scene One', chapter_id: 'ch_0001' }],
      }),
      'utf8',
    );
    await fs.writeFile(
      path.join(root, 'project.json'),
      JSON.stringify({ name: 'Tmp Project' }),
      'utf8',
    );
    await fs.mkdir(path.join(root, 'drafts'), { recursive: true });
    await fs.writeFile(
      path.join(root, 'drafts', 'sc_0001.md'),
      `---
id: sc_0001
title: Scene One
order: 1
chapter_id: ch_0001
---
# Scene One`,
      'utf8',
    );
    await fs.mkdir(path.join(root, '.blackskies', 'long_form'), { recursive: true });
    await fs.writeFile(
      path.join(root, '.blackskies', 'long_form', 'manual_review.json'),
      JSON.stringify({ sc_0001: true }, null, 2),
      'utf8',
    );

    const { project } = await loadProjectFromDisk(root);

    expect(project.editorialReviews?.sc_0001?.manual_review?.marked).toBe(true);
    expect(project.editorialReviews?.sc_0001?.manual_review?.status).toBe(
      'manual_rewrite_requested',
    );
  });
});
