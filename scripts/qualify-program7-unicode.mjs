import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PROGRAM7_UNICODE_MATRIX_SCHEMA = 'program7.unicode-qualification.v2';
export const PROGRAM7_UNICODE_TEST_FILE = 'shared/__tests__/program7SourceBinding.test.ts';

const IMPLEMENTATION_FILES = [
  'app/shared/program7SourceBinding.ts',
  'app/shared/manuscriptStructure.ts',
];

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

const EXPECTED_ASSERTIONS = Object.freeze([
  {
    id: 'P7-G2-ASCII-UTF16',
    category: 'unicode',
    title: "round-trips 'ASCII' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-ACCENTED-UTF16',
    category: 'unicode',
    title: "round-trips 'accented Latin' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-COMBINING-UTF16',
    category: 'unicode',
    title: "round-trips 'combining mark' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-EMOJI-SURROGATE',
    category: 'unicode',
    title: "round-trips 'emoji surrogate pair' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-CJK-UTF16',
    category: 'unicode',
    title: "round-trips 'CJK' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-RTL-UTF16',
    category: 'unicode',
    title: "round-trips 'right-to-left' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-MARKDOWN-SOURCE',
    category: 'markdown',
    title: "round-trips 'Markdown source constructs' using UTF-16 source coordinates",
  },
  {
    id: 'P7-G2-LF-CURRENT',
    category: 'newline',
    title: "treats 'LF' and normalized LF as the same current source",
  },
  {
    id: 'P7-G2-CRLF-CURRENT',
    category: 'newline',
    title: "treats 'CRLF' and normalized LF as the same current source",
  },
  {
    id: 'P7-G2-MIXED-CURRENT',
    category: 'newline',
    title: "treats 'mixed' and normalized LF as the same current source",
  },
  {
    id: 'P7-G2-FINAL-NEWLINE',
    category: 'currentness',
    title:
      'keeps final-newline and no-final-newline currentness distinct while preserving anchor relocation',
  },
  {
    id: 'P7-G2-STALE-AMBIGUOUS',
    category: 'currentness',
    title: 'refuses a changed source without silently reattaching a UTF-16 anchor',
  },
  {
    id: 'P7-G2-CRLF-ANCHOR',
    category: 'contract',
    title: 'normalizes CRLF and stores exact UTF-16 coordinates and body hash',
  },
  {
    id: 'P7-G2-RESOLUTION-STATES',
    category: 'currentness',
    title:
      'returns exact, uniquely relocated, ambiguous, and stale states without silent reattachment',
  },
  {
    id: 'P7-G2-PROTECTED',
    category: 'protection',
    title: 'returns unavailable and protected metadata-only envelopes without source text',
  },
  {
    id: 'P7-G2-BODY-HASH',
    category: 'contract',
    title: 'derives and verifies the body hash when source text is supplied',
  },
  {
    id: 'P7-G2-RANGE-VALIDATION',
    category: 'contract',
    title: 'rejects incomplete, negative, and out-of-bounds exact coordinates',
  },
  {
    id: 'P7-G2-SELECTION-HASH',
    category: 'contract',
    title: 'rejects a mismatched stored selection fingerprint for an exact range',
  },
]);

function repositoryRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function gitValue(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function gitBinding(root) {
  const commit = gitValue(root, ['rev-parse', 'HEAD']);
  const tree = gitValue(root, ['rev-parse', 'HEAD^{tree}']);
  return {
    exactCommit: /^[0-9a-f]{40}$/u.test(commit ?? '') ? commit : 'not-applicable',
    exactTree: /^[0-9a-f]{40}$/u.test(tree ?? '') ? tree : 'not-applicable',
  };
}

function sourceArtifact(root, relativePath) {
  const absolutePath = path.resolve(root, relativePath);
  if (!existsSync(absolutePath))
    throw new Error(`Required source artifact is missing: ${relativePath}`);
  return {
    path: absolutePath,
    sha256: createHash('sha256').update(readFileSync(absolutePath)).digest('hex'),
  };
}

function assertionResults(report) {
  return (report?.testResults ?? []).flatMap((file) =>
    (file.assertionResults ?? []).map((assertion) => ({
      title: assertion.title,
      fullName: assertion.fullName,
      status: assertion.status,
    })),
  );
}

function mapAssertions(report) {
  const results = assertionResults(report);
  return EXPECTED_ASSERTIONS.map((expected) => {
    const matches = results.filter((result) => result.title === expected.title);
    return {
      ...expected,
      found: matches.length === 1,
      passed: matches.length === 1 && matches[0]?.status === 'passed',
      observed: matches.length === 1 ? matches[0] : null,
    };
  });
}

function vitestReport(root) {
  const appRoot = path.join(root, 'app');
  const vitestCli = path.join(appRoot, 'node_modules', 'vitest', 'vitest.mjs');
  if (!existsSync(vitestCli)) return { error: 'Vitest CLI is unavailable.' };
  const result = spawnSync(
    process.execPath,
    [vitestCli, 'run', PROGRAM7_UNICODE_TEST_FILE, '--reporter=json'],
    { cwd: appRoot, encoding: 'utf8' },
  );
  let report = null;
  try {
    report = JSON.parse(result.stdout ?? '');
  } catch {
    return { error: 'Vitest did not emit a parseable JSON report.', exitCode: result.status ?? 1 };
  }
  return { report, exitCode: result.status ?? 1 };
}

export function runProgram7UnicodeQualification(options = {}) {
  const root = options.root ?? repositoryRoot();
  const allowDirty = options.allowDirty === true;
  const binding = gitBinding(root);
  const dirtyOutput = gitValue(root, ['status', '--porcelain=v1', '--untracked-files=all']) ?? '';
  const workingTreeClean = dirtyOutput === '';
  const base = {
    schema: PROGRAM7_UNICODE_MATRIX_SCHEMA,
    ...binding,
    testFile: path.resolve(root, 'app', PROGRAM7_UNICODE_TEST_FILE),
    implementationFiles: IMPLEMENTATION_FILES.map((file) => path.resolve(root, file)),
    ...PROGRAM7_UNICODE_MATRIX,
    expectedAssertions: EXPECTED_ASSERTIONS,
    workingTreeClean,
    allowDirty,
    protectedEvidenceUsed: false,
    humanAcceptanceClaimed: false,
  };

  if (!workingTreeClean && !allowDirty) {
    return { ...base, pass: false, exitCode: 2, failure: 'WORKTREE_DIRTY' };
  }
  if (base.exactCommit === 'not-applicable' || base.exactTree === 'not-applicable') {
    return { ...base, pass: false, exitCode: 2, failure: 'EXACT_GIT_BINDING_UNAVAILABLE' };
  }

  let sourceArtifacts;
  try {
    sourceArtifacts = [path.join('app', PROGRAM7_UNICODE_TEST_FILE), ...IMPLEMENTATION_FILES].map(
      (file) => sourceArtifact(root, file),
    );
  } catch (error) {
    return {
      ...base,
      pass: false,
      exitCode: 2,
      failure: error instanceof Error ? error.message : String(error),
    };
  }

  const vitest = vitestReport(root);
  if (vitest.error)
    return {
      ...base,
      sourceArtifacts,
      pass: false,
      exitCode: vitest.exitCode ?? 1,
      failure: vitest.error,
    };
  const assertions = mapAssertions(vitest.report);
  const observedTestCount = vitest.report?.numTotalTests ?? null;
  const allAssertionsPresentAndPassed =
    assertions.length === EXPECTED_ASSERTIONS.length &&
    assertions.every((assertion) => assertion.found && assertion.passed);
  const pass =
    vitest.exitCode === 0 &&
    vitest.report?.success === true &&
    observedTestCount === PROGRAM7_UNICODE_MATRIX.expectedTests &&
    allAssertionsPresentAndPassed;
  return {
    ...base,
    sourceArtifacts,
    observed: {
      testFiles: vitest.report?.testResults?.length ?? null,
      tests: observedTestCount,
      passedTests: vitest.report?.numPassedTests ?? null,
      failedTests: vitest.report?.numFailedTests ?? null,
    },
    assertions,
    pass,
    exitCode: pass ? 0 : 2,
    ...(pass ? {} : { failure: 'EXPECTED_ASSERTION_OR_VITEST_RESULT_MISSING' }),
  };
}

function parseCli(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--allow-dirty') {
      options.allowDirty = true;
    } else if (argument === '--output') {
      const output = argv[index + 1];
      if (!output || output.startsWith('--')) throw new Error('--output requires a path.');
      options.outputPath = path.resolve(output);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

const executedModule = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (executedModule) {
  try {
    const options = parseCli(process.argv.slice(2));
    const summary = runProgram7UnicodeQualification(options);
    if (options.outputPath) {
      mkdirSync(path.dirname(options.outputPath), { recursive: true });
      writeFileSync(options.outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    }
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (!summary.pass) process.exitCode = summary.exitCode;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
