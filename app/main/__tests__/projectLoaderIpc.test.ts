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
});
