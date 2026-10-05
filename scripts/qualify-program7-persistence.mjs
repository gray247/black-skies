#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(repoRoot, 'app');
const outputArgument = process.argv.indexOf('--output');
const outputPath = path.resolve(
  outputArgument >= 0 && process.argv[outputArgument + 1]
    ? process.argv[outputArgument + 1]
    : path.join(repoRoot, 'docs', 'product_systems', 'program_7_persistence_qualification.json'),
);
const allowDirty = process.argv.includes('--allow-dirty');
const testFiles = [
  'main/__tests__/feedbackNotesRepository.test.ts',
  'main/__tests__/ideationRepository.test.ts',
  'main/__tests__/revisionCandidateRepository.test.ts',
  'main/__tests__/storyFoundationRepository.test.ts',
  'main/__tests__/projectSpineIpc.test.ts',
  'main/__tests__/projectSessionCoordinator.test.ts',
  'main/__tests__/projectSpineRecoveryCheckpoints.test.ts',
  'main/__tests__/projectSpineRecoveryRepository.test.ts',
];
const matrixRequirements = {
  migration: [
    'reads legacy v1 losslessly and migrates it only on the first revision mutation',
    'revision candidate repository fails closed for unsupported persisted schema and duplicate IDs',
    'Ideation owner fails closed for unsupported persisted schema and duplicate IDs',
    'Story Foundation project-local authored truth owner fails closed for wrong versions and duplicate identities',
  ],
  corruption: [
    'Feedback Notes sidecar fails closed for corruption variants and ignores an abandoned temporary file',
    'Ideation owner fails closed for unsupported persisted schema and duplicate IDs',
    'revision candidate repository fails closed for unsupported persisted schema and duplicate IDs',
    'Story Foundation project-local authored truth owner fails closed for wrong versions and duplicate identities',
    'project-spine IPC fails closed without rewriting corrupt pending-acceptance evidence',
    'classifies corrupt JSON and incomplete envelopes without rewriting them',
  ],
  concurrency: [
    'Feedback Notes sidecar serializes concurrent revision mutations and preserves both items',
    'Ideation owner serializes concurrent same-revision writers to one winner and one STALE result',
    'revision candidate repository serializes concurrent expected revisions and preserves corrupt bytes',
    'Story Foundation project-local authored truth owner rejects stale and concurrent mutations without losing either durable winner',
    'serializes revision acceptance around its ProjectSpine save and rejects competing writes',
  ],
  recovery: [
    'Feedback Notes sidecar leaves an existing document intact when a revision write fails',
    'Ideation owner leaves the prior document intact and cleans the temporary file when atomic replacement fails',
    'revision candidate repository leaves the prior document intact and cleans the temporary file when atomic replacement fails',
    'Story Foundation project-local authored truth owner leaves the prior document intact when atomic replacement fails',
    'project-spine IPC reconciles an accepted manuscript when candidate finalization is interrupted',
    'keeps the prior-session envelope intact when atomic accepted-set rebinding fails',
    'preserves the prior envelope and cleans its temporary file when replacement fails',
  ],
};

function git(...args) {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout.trim();
}

function digest(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

async function run() {
  const dirtyBefore = git('status', '--porcelain');
  if (dirtyBefore && !allowDirty) {
    throw new Error('Program 7 persistence qualification requires a clean exact commit.');
  }
  const exactCommit = git('rev-parse', 'HEAD');
  const exactTree = git('rev-parse', 'HEAD^{tree}');
  const temporaryRoot = path.join(tmpdir(), `black-skies-p7-persistence-${randomUUID()}`);
  const reportPath = path.join(temporaryRoot, 'vitest.json');
  await mkdir(temporaryRoot, { recursive: true });
  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repoRoot, 'scripts', 'run-vitest-offline.mjs'),
        '--run',
        ...testFiles,
        '--reporter=json',
        `--outputFile=${reportPath}`,
      ],
      { cwd: appRoot, encoding: 'utf8', env: process.env },
    );
    if (result.error) throw result.error;
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const assertions = report.testResults.flatMap((file) =>
      file.assertionResults.map((assertion) => ({
        file: path.relative(repoRoot, file.name).replaceAll('\\', '/'),
        name: assertion.fullName,
        status: assertion.status,
        durationMs: assertion.duration ?? null,
      })),
    );
    const matrix = Object.entries(matrixRequirements).map(([family, requirements]) => {
      const checks = requirements.map((requirement) => {
        const assertion = assertions.find((candidate) => candidate.name.includes(requirement));
        return {
          requirement,
          matchedAssertion: assertion?.name ?? null,
          status: assertion?.status ?? 'missing',
        };
      });
      return {
        family,
        result: checks.every((check) => check.status === 'passed') ? 'Pass' : 'Fail',
        checks,
      };
    });
    const qualified = result.status === 0 && report.success === true && matrix.every((row) => row.result === 'Pass');
    const sourceArtifacts = await Promise.all(
      [
        ...testFiles.map((file) => path.join('app', file)),
        'app/main/feedbackNotesRepository.ts',
        'app/main/ideationRepository.ts',
        'app/main/revisionCandidateRepository.ts',
        'app/main/storyFoundationRepository.ts',
        'app/main/projectSpineIpc.ts',
      ].map(async (relativePath) => {
        const contents = await readFile(path.join(repoRoot, relativePath), 'utf8');
        return { path: relativePath.replaceAll('\\', '/'), sha256: digest(contents) };
      }),
    );
    const evidence = {
      schema: 'black-skies.program7.persistence-qualification.v1',
      rawEvidenceDirectory: temporaryRoot,
      status: qualified ? 'qualified' : 'not-qualified',
      exactCommit,
      exactTree,
      environment: { platform: process.platform, node: process.version },
      command: `node scripts/run-vitest-offline.mjs --run ${testFiles.join(' ')} --reporter=json`,
      testSummary: {
        files: testFiles.length,
        total: report.numTotalTests,
        passed: report.numPassedTests,
        failed: report.numFailedTests,
        skipped: report.numPendingTests,
      },
      matrix,
      sourceArtifacts,
      protectedEvidenceUsed: false,
      humanAcceptanceClaimed: false,
      capturedAt: new Date().toISOString(),
    };
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
    process.stdout.write(`${JSON.stringify(evidence.testSummary)}\n`);
    process.stdout.write(`P7_PERSISTENCE_QUALIFICATION_${qualified ? 'PASS' : 'FAIL'}\n`);
    if (!qualified) process.exitCode = 2;
  } finally {
    process.stderr.write('Program 7 raw qualification evidence retained at ' + temporaryRoot + '\n');
  }
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
