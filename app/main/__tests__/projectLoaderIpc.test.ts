import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ipcMain } from 'electron';

const fsMock = vi.hoisted(() => ({
  access: vi.fn(),
  readFile: vi.fn(),
  readdir: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
  writeFile: vi.fn(),
}));

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

vi.mock('node:fs/promises', () => ({
  default: fsMock,
}));

import {
  registerProjectLoaderIpc,
  extractFrontMatter,
  parseFrontMatterValue,
  readProjectMetadata,
  resolveProjectRootPath,
  runWithConcurrency,
  MAX_SCENE_READ_CONCURRENCY,
} from '../projectLoaderIpc';

describe('projectLoaderIpc helpers', () => {
  beforeEach(() => {
    fsMock.access.mockReset();
    fsMock.readFile.mockReset();
    fsMock.readdir.mockReset();
    fsMock.mkdir.mockReset();
    fsMock.rm.mockReset();
    fsMock.writeFile.mockReset();
    vi.mocked(ipcMain.handle).mockReset();
  });

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

  it('readProjectMetadata exposes the canonical project id from project.json', async () => {
    const projectPath = join(tmpdir(), 'black-skies', 'sample_project', 'Esther_Estate');
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({ project_id: 'proj_esther_estate', name: 'Esther Estate' }),
    );

    await expect(readProjectMetadata(projectPath)).resolves.toEqual({
      projectId: 'proj_esther_estate',
      name: 'Esther Estate',
    });
    expect(fsMock.readFile).toHaveBeenCalledWith(join(projectPath, 'project.json'), 'utf8');
  });

  it('readProjectMetadata rejects unsupported schema versions', async () => {
    const projectPath = join(tmpdir(), 'black-skies', 'sample_project', 'Esther_Estate');
    fsMock.readFile.mockResolvedValue(
      JSON.stringify({
        schema_version: 'ProjectMetadataSchema v9',
        project_id: 'proj_esther_estate',
        name: 'Esther Estate',
      }),
    );

    await expect(readProjectMetadata(projectPath)).rejects.toMatchObject({
      code: 'PROJECT_UNSUPPORTED_VERSION',
    });
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

  it('walks upward from nested selections to the project root', async () => {
    const parentPath = join(tmpdir(), 'black-skies', 'sample_project', 'Esther_Estate');
    const nestedPath = join(parentPath, 'Esther_Estate', 'history', 'scenes');

    fsMock.access.mockImplementation(async (filePath: string) => {
      if (
        filePath === join(parentPath, 'outline.json') ||
        filePath === join(parentPath, 'project.json')
      ) {
        return undefined;
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    const result = await resolveProjectRootPath(nestedPath);

    expect(result.projectPath).toBe(parentPath);
    expect(result.issues).toEqual([
      expect.objectContaining({
        level: 'warning',
        message: 'Selected folder was nested inside a project root.',
      }),
    ]);
  });

  it('rejects create-project requests when the selected parent is already nested inside a project root', async () => {
    const existingProjectRoot = join(tmpdir(), 'black-skies-ipc-create-root');
    const nestedParent = join(existingProjectRoot, 'nested-save-location');

    fsMock.access.mockImplementation(async (filePath: string) => {
      if (
        filePath === join(existingProjectRoot, 'outline.json') ||
        filePath === join(existingProjectRoot, 'project.json')
      ) {
        return undefined;
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    });

    registerProjectLoaderIpc();

    const createHandler = vi.mocked(ipcMain.handle).mock.calls.find(
      ([channel]) => channel === 'project-loader:create-project',
    )?.[1];
    expect(createHandler).toBeTypeOf('function');

    const response = await (createHandler as (event: unknown, request: unknown) => Promise<unknown>)(
      {},
      {
        parentPath: nestedParent,
        title: 'Nested Story',
      },
    );

    expect(response).toMatchObject({
      ok: false,
      error: {
        code: 'NESTED_PROJECT_ROOT',
      },
    });
    expect(fsMock.mkdir).not.toHaveBeenCalled();
    expect(vi.mocked(ipcMain.handle)).toHaveBeenCalledWith(
      'project-loader:create-project',
      expect.any(Function),
    );
  });
});
