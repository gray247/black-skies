import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PROGRAM7_UNICODE_MATRIX_SCHEMA = 'program7.unicode-qualification.v1';
export const PROGRAM7_UNICODE_TEST_FILE = 'shared/__tests__/program7SourceBinding.test.ts';

export const PROGRAM7_UNICODE_MATRIX = Object.freeze({
  textClasses: Object.freeze([
    'ASCII',
    'accented Latin',
    'combining mark',
    'emoji surrogate pair',
    'CJK',
    'right-to-left',
    'Markdown source constructs',
  ]),
  newlineVariants: Object.freeze(['LF', 'CRLF', 'mixed']),
  currentnessStates: Object.freeze([
    'exact',
    'relocated',
    'ambiguous',
    'stale',
    'potentially-outdated',
  ]),
  expectedTests: 18,
});

function repositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function exactCommit(root) {
  const result = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const commit = result.status === 0 ? result.stdout.trim() : '';
  return /^[0-9a-f]{40}$/u.test(commit) ? commit : 'not-applicable';
}

function observedCounts(output) {
  const testFiles = output.match(/Test Files\s+\d+\s+passed/u)?.[0].match(/\d+/u)?.[0];
  const tests = output.match(/Tests\s+\d+\s+passed/u)?.[0].match(/\d+/u)?.[0];
  return {
    testFiles: testFiles === undefined ? null : Number(testFiles),
    tests: tests === undefined ? null : Number(tests),
  };
}

export function runProgram7UnicodeQualification(options = {}) {
  const root = options.root ?? repositoryRoot();
  const appRoot = path.join(root, 'app');
  const vitestCli = path.join(appRoot, 'node_modules', 'vitest', 'vitest.mjs');
  if (!existsSync(vitestCli)) {
    return {
      schema: PROGRAM7_UNICODE_MATRIX_SCHEMA,
      exactCommit: exactCommit(root),
      testFile: PROGRAM7_UNICODE_TEST_FILE,
      ...PROGRAM7_UNICODE_MATRIX,
      observed: { testFiles: null, tests: null },
      pass: false,
      exitCode: 1,
      error: 'Vitest CLI is unavailable.',
    };
  }

  const result = spawnSync(
    process.execPath,
    [vitestCli, 'run', PROGRAM7_UNICODE_TEST_FILE, '--reporter=dot'],
    {
      cwd: appRoot,
      encoding: 'utf8',
    },
  );
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const observed = observedCounts(output);
  return {
    schema: PROGRAM7_UNICODE_MATRIX_SCHEMA,
    exactCommit: exactCommit(root),
    testFile: PROGRAM7_UNICODE_TEST_FILE,
    ...PROGRAM7_UNICODE_MATRIX,
    observed,
    pass: result.status === 0 && observed.tests === PROGRAM7_UNICODE_MATRIX.expectedTests,
    exitCode: result.status ?? 1,
  };
}

const executedModule = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (executedModule) {
  const summary = runProgram7UnicodeQualification();
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = summary.exitCode;
}
