import { spawnSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const probePath = path.join(
  repoRoot,
  'app',
  'main',
  '__tests__',
  'runVitestOfflineExitCode.probe.test.ts',
);

describe('offline Vitest runner exit contract', () => {
  it('bounds worker concurrency without inflating timeouts or enabling retries', () => {
    for (const configPath of ['app/vite.config.ts', 'app/vitest.config.mjs']) {
      const source = readFileSync(path.join(repoRoot, configPath), 'utf8');
      expect(source).toMatch(/maxWorkers:\s*4/);
      expect(source).not.toMatch(/\b(?:testTimeout|hookTimeout|retry)\s*:/);
    }
  });

  it(
    'returns a nonzero process status when Vitest reports a failed test',
    () => {
      writeFileSync(
        probePath,
        [
          "import { expect, it } from 'vitest';",
          "it('intentional exit-code probe failure', () => expect('red').toBe('green'));",
          '',
        ].join('\n'),
        'utf8',
      );

      try {
        const result = spawnSync(
          process.execPath,
          [
            path.join(repoRoot, 'scripts', 'run-vitest-offline.mjs'),
            '--run',
            'main/__tests__/runVitestOfflineExitCode.probe.test.ts',
            '--reporter=dot',
          ],
          {
            cwd: path.join(repoRoot, 'app'),
            encoding: 'utf8',
            timeout: 30_000,
          },
        );

        expect(result.error).toBeUndefined();
        expect(result.status).toBe(1);
        expect(`${result.stdout}\n${result.stderr}`).toContain('1 failed');
      } finally {
        unlinkSync(probePath);
      }
    },
    35_000,
  );
});
