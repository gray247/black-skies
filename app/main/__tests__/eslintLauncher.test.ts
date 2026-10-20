import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');

describe('repository ESLint launchers', () => {
  for (const launcher of ['run-app-eslint.mjs', 'run-stage19-eslint.mjs']) {
    for (const exitCode of [0, 17]) {
      it(`${launcher} preserves arguments and exit ${exitCode} beneath a path with spaces`, () => {
        const temporaryRoot = path.resolve(tmpdir());
        const root = mkdtempSync(path.join(temporaryRoot, 'black skies lint & arguments '));
        try {
          const scripts = path.join(root, 'scripts');
          const modules = path.join(root, 'app', 'node_modules');
          const eslint = path.join(modules, 'eslint');
          mkdirSync(scripts, { recursive: true });
          mkdirSync(path.join(eslint, 'bin'), { recursive: true });
          mkdirSync(path.join(modules, '.bin'), { recursive: true });
          writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
          writeFileSync(path.join(eslint, 'package.json'), '{"name":"eslint","type":"commonjs","bin":{"eslint":"bin/eslint.js"}}');
          const receipt = path.join(root, 'arguments.json');
          writeFileSync(path.join(eslint, 'bin', 'eslint.js'), [
            "require('node:fs').writeFileSync(process.env.LINT_ARGUMENT_RECEIPT, JSON.stringify(process.argv.slice(2)));",
            'process.exit(Number(process.env.LINT_PROBE_EXIT));',
          ].join('\n'));
          // The old launcher resolves this shell shim; the corrected launcher
          // must invoke the installed JavaScript entry point through Node.
          writeFileSync(path.join(modules, '.bin', 'eslint'), 'exit 91\n');
          copyFileSync(path.join(repoRoot, 'scripts', launcher), path.join(scripts, launcher));

          const result = spawnSync(process.execPath, [path.join(scripts, launcher)], {
            cwd: root,
            env: { ...process.env, LINT_ARGUMENT_RECEIPT: receipt, LINT_PROBE_EXIT: String(exitCode) },
            encoding: 'utf8',
            timeout: 10_000,
          });
          expect(result.error).toBeUndefined();
          expect(result.status, result.stderr).toBe(exitCode);
          const args = JSON.parse(readFileSync(receipt, 'utf8')) as string[];
          expect(args.slice(0, 4)).toEqual(['--config', path.join(root, 'eslint.config.js'), '--max-warnings', '0']);
          expect(args).toContain(launcher === 'run-app-eslint.mjs'
            ? 'renderer/**/*.{ts,tsx}' : 'renderer/Stage19WritingSpineApp.tsx');
        } finally {
          if (path.dirname(root) !== temporaryRoot) throw new Error('Unexpected lint probe directory');
          rmSync(root, { recursive: true, force: true });
        }
      });
    }
  }
});
