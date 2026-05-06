import { join } from 'node:path';

import { describe, expect, it, vi, beforeEach } from 'vitest';

const fsMock = vi.hoisted(() => ({
  access: vi.fn(),
  readFile: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => process.cwd()),
  },
  BrowserWindow: class BrowserWindowMock {},
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  screen: {
    getAllDisplays: vi.fn(() => []),
    getPrimaryDisplay: vi.fn(() => ({ id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } })),
    getDisplayMatching: vi.fn(() => ({ id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1080 } })),
  },
}));

vi.mock('node:fs', () => ({
  default: {
    promises: fsMock,
  },
  promises: fsMock,
}));

import {
  loadPersistedLayout,
  makeFloatingWindowUrl,
  shouldUseFileRendererEntry,
} from '../layoutIpc';
import {
  DEFAULT_LAYOUT,
  LAYOUT_SCHEMA_VERSION,
  isValidLayoutTree,
  sanitizeLayoutNode,
} from '../../shared/ipc/layout';

describe('layoutIpc loadPersistedLayout', () => {
  beforeEach(() => {
    fsMock.access.mockReset();
    fsMock.readFile.mockReset();
    fsMock.mkdir.mockReset();
    fsMock.rm.mockReset();
    fsMock.writeFile.mockReset();
  });

  it('clears invalid saved layouts and falls back to the default layout', async () => {
    const projectPath = 'C:/Dev/black-skies/sample_project/Esther_Estate';
    const layoutPath = join(projectPath, '.blackskies', 'layout.json');
    fsMock.readFile
      .mockResolvedValueOnce(
        JSON.stringify({
          version: LAYOUT_SCHEMA_VERSION,
          layout: {
            direction: 'row',
            first: 'outline',
            second: 'outline',
          },
          floatingPanes: [],
        }),
      )
      .mockRejectedValueOnce(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    const result = await loadPersistedLayout(projectPath);
    const secondResult = await loadPersistedLayout(projectPath);

    expect(result).toEqual(
      expect.objectContaining({
        layout: DEFAULT_LAYOUT,
        wasReset: true,
      }),
    );
    expect(secondResult).toBeNull();
    expect(fsMock.rm).toHaveBeenCalledWith(layoutPath, { force: true });
    expect(fsMock.rm).toHaveBeenCalledTimes(1);
  });

  it('drops unknown floating pane ids when loading persisted layout', async () => {
    const projectPath = 'C:/Dev/black-skies/sample_project/Esther_Estate';
    fsMock.readFile.mockResolvedValueOnce(
      JSON.stringify({
        version: LAYOUT_SCHEMA_VERSION,
        layout: DEFAULT_LAYOUT,
        floatingPanes: [
          {
            id: 'draftPreview',
            bounds: { x: 10, y: 20, width: 640, height: 420 },
            displayId: 1,
          },
          {
            id: 'unknown-pane',
            bounds: { x: 40, y: 50, width: 320, height: 240 },
            displayId: 1,
          },
        ],
      }),
    );

    const result = await loadPersistedLayout(projectPath);

    expect(result).toEqual(
      expect.objectContaining({
        layout: DEFAULT_LAYOUT,
        floatingPanes: [
          expect.objectContaining({
            id: 'draftPreview',
            bounds: { x: 10, y: 20, width: 640, height: 420 },
            displayId: 1,
          }),
        ],
      }),
    );
  });

  it('uses the dev server URL only when the renderer is running from http', () => {
    const devTarget = makeFloatingWindowUrl(
      {
        devServerUrl: 'http://127.0.0.1:5173/',
        rendererIndexFile: 'C:/Dev/black-skies/app/dist/index.html',
        preloadPath: 'C:/Dev/black-skies/app/dist-electron/main/preload.js',
        getMainWindow: () => null,
      },
      'draftPreview',
      'C:/Dev/black-skies/sample_project/Esther_Estate',
      undefined,
      'http://127.0.0.1:5173/',
    );

    const fileTarget = makeFloatingWindowUrl(
      {
        devServerUrl: 'http://127.0.0.1:5173/',
        rendererIndexFile: 'C:/Dev/black-skies/app/dist/index.html',
        preloadPath: 'C:/Dev/black-skies/app/dist-electron/main/preload.js',
        getMainWindow: () => null,
      },
      'draftPreview',
      'C:/Dev/black-skies/sample_project/Esther_Estate',
      undefined,
      'file:///C:/Dev/black-skies/app/dist/index.html',
    );

    expect(typeof devTarget).toBe('string');
    expect(devTarget).toContain('http://127.0.0.1:5173/');
    expect(fileTarget).toEqual({
      file: 'C:/Dev/black-skies/app/dist/index.html',
      search: expect.stringContaining('floatingPane=draftPreview'),
    });
    expect(
      makeFloatingWindowUrl(
        {
          devServerUrl: null,
          rendererIndexFile: 'C:/Dev/black-skies/app/dist/index.html',
          preloadPath: 'C:/Dev/black-skies/app/dist-electron/main/preload.js',
          getMainWindow: () => null,
        },
        'draftPreview',
        'C:/Dev/black-skies/sample_project/Esther_Estate',
        undefined,
        null,
      ),
    ).toEqual({
      file: 'C:/Dev/black-skies/app/dist/index.html',
      search: expect.stringContaining('floatingPane=draftPreview'),
    });
    expect(shouldUseFileRendererEntry('file:///C:/Dev/black-skies/app/dist/index.html')).toBe(true);
    expect(shouldUseFileRendererEntry('http://127.0.0.1:5173/')).toBe(false);
  });

  it('accepts the nested default layout tree as valid', () => {
    expect(isValidLayoutTree(DEFAULT_LAYOUT)).toBe(true);
    expect(sanitizeLayoutNode(DEFAULT_LAYOUT as never)).toEqual(DEFAULT_LAYOUT);
  });
});
