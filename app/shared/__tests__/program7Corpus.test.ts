import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
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
  screen: {},
}));

import { loadProjectFromDisk } from '../../main/projectLoaderIpc';

function repositoryRoot(): string {
  const current = process.cwd();
  return existsSync(resolve(current, 'sample_project', 'program_7_corpus'))
    ? current
    : resolve(current, '..');
}

describe('Program 7 Carmilla corpus', () => {
  it('loads both snapshots through the production ProjectSpine project loader', async () => {
    const root = repositoryRoot();
    const expectedUnits = ['carmilla-prologue'].concat(
      Array.from({ length: 16 }, (_, index) => `carmilla-chapter-${String(index + 1).padStart(2, '0')}`),
    );

    for (const name of ['baseline', 'revised'] as const) {
      const loaded = await loadProjectFromDisk(
        resolve(root, 'sample_project', 'program_7_corpus', 'carmilla', 'derived', name),
      );

      expect(loaded.issues.filter((issue) => issue.level === 'error')).toEqual([]);
      expect(loaded.project.projectId).toBe(`proj_carmilla_${name}`);
      expect(loaded.project.outline.schema_version).toBe('OutlineSchema v1');
      expect(loaded.project.outline.scenes.map((scene) => scene.id)).toEqual(expectedUnits);
      expect(loaded.project.scenes.map((scene) => scene.id)).toEqual(expectedUnits);
      expect(Object.keys(loaded.project.drafts).sort()).toEqual([...expectedUnits].sort());
      expect(loaded.project.bootstrapState).toBe('scaffold_initialized');
    }
  });

  it('verifies immutable source hashes, openable snapshots, ranges, and fixtures', () => {
    const root = repositoryRoot();
    const script = resolve(root, 'scripts', 'verify-program7-corpus.mjs');
    const result = spawnSync(process.execPath, [script], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('"ok": true');
    expect(result.stdout).toContain('"units": 17');
  });
});
