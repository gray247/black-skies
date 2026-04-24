#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildPlaywrightArgs, normalizeForwardedArgs } from './e2e-with-backend.mjs';

function countWorkerFlags(args) {
  return args.filter((arg) => arg === '--workers' || arg.startsWith('--workers=')).length;
}

function assertNoStandaloneSeparator(args, context) {
  assert.equal(args.includes('--'), false, `${context}: standalone "--" must not be forwarded`);
}

function assertNoDuplicateWorkers(args, context) {
  assert.equal(countWorkerFlags(args), 1, `${context}: duplicate worker flags detected`);
}

function assertContains(args, expected, context) {
  for (const token of expected) {
    assert.equal(args.includes(token), true, `${context}: missing "${token}"`);
  }
}

// Case 1: separator-prefixed forwarding normalizes and keeps user workers flag.
const normalizedWithSeparator = normalizeForwardedArgs(['--', '--workers=1']);
assert.deepEqual(
  normalizedWithSeparator,
  ['--workers=1'],
  'separator normalization failed for ["--","--workers=1"]',
);
const argsWithSeparator = buildPlaywrightArgs(normalizedWithSeparator, false);
assertNoStandaloneSeparator(argsWithSeparator, 'separator-prefixed args');
assertNoDuplicateWorkers(argsWithSeparator, 'separator-prefixed args');

// Case 2: direct workers flag remains unchanged and deduped.
const normalizedDirectWorkers = normalizeForwardedArgs(['--workers=1']);
assert.deepEqual(
  normalizedDirectWorkers,
  ['--workers=1'],
  'plain workers arg normalization failed for ["--workers=1"]',
);
const argsDirectWorkers = buildPlaywrightArgs(normalizedDirectWorkers, false);
assertNoStandaloneSeparator(argsDirectWorkers, 'direct workers args');
assertNoDuplicateWorkers(argsDirectWorkers, 'direct workers args');

// Case 3: user-supplied workers override default workers without duplication.
const argsWorkers2 = buildPlaywrightArgs(normalizeForwardedArgs(['--workers=2']), false);
assertNoStandaloneSeparator(argsWorkers2, 'user workers=2 args');
assertNoDuplicateWorkers(argsWorkers2, 'user workers=2 args');
assertContains(argsWorkers2, ['--workers=2'], 'user workers=2 args');

// Case 4: explicit selector should suppress default smoke selectors/files.
const argsExplicitSelector = buildPlaywrightArgs(normalizeForwardedArgs(['gui.flows.spec.ts']), false);
assertNoStandaloneSeparator(argsExplicitSelector, 'explicit selector args');
assertNoDuplicateWorkers(argsExplicitSelector, 'explicit selector args');
assert.equal(
  argsExplicitSelector.includes('dock-workspace.spec.ts'),
  false,
  'explicit selector args: default smoke file must not be injected',
);
assert.equal(
  argsExplicitSelector.includes('--grep'),
  false,
  'explicit selector args: default smoke grep must not be injected',
);

// Case 5: option-only forwarding should still include default smoke selectors/files (avoids no-tests-found shape).
const argsOptionOnly = buildPlaywrightArgs(normalizeForwardedArgs(['--grep', 'smoke_']), false);
assertNoStandaloneSeparator(argsOptionOnly, 'option-only args');
assertNoDuplicateWorkers(argsOptionOnly, 'option-only args');
assertContains(argsOptionOnly, ['gui.flows.spec.ts', 'dock-workspace.spec.ts'], 'option-only args');
assertContains(argsOptionOnly, ['--grep', 'smoke_'], 'option-only args');

console.log('e2e launcher args test: ok');
