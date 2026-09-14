#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRoot = path.join(repoRoot, 'app');
const testFile = 'main/__tests__/program7ScalePerformance.test.ts';

function git(...args) {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  return result.stdout.trim();
}

export async function run() {
  if (!process.argv.includes('--allow-dirty') && git('status', '--porcelain')) {
    throw new Error('Program 7 scale qualification requires a clean exact commit (or --allow-dirty).');
  }
  const exactCommit = git('rev-parse', 'HEAD');
  const exactTree = git('rev-parse', 'HEAD^{tree}');
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'black-skies-p7-scale-qualification-'));
  const reportPath = path.join(temporaryRoot, 'vitest.json');
  const metricsPath = path.join(temporaryRoot, 'scale-metrics.json');
  try {
    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, 'scripts', 'run-vitest-offline.mjs'), '--run', testFile, '--reporter=json', `--outputFile=${reportPath}`],
      { cwd: appRoot, encoding: 'utf8', env: { ...process.env, P7_SCALE_REPORT_PATH: metricsPath }, stdio: 'inherit' },
    );
    if (result.error) throw result.error;
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const assertions = report.testResults.flatMap((file) => file.assertionResults.map((assertion) => ({
      name: assertion.fullName,
      status: assertion.status,
      durationMs: assertion.duration ?? null,
    })));
    const scales = assertions.filter((assertion) => /\dx Carmilla-derived/.test(assertion.name));
    const observations = await readFile(metricsPath, 'utf8').then((contents) => JSON.parse(contents)).catch(() => []);
    const electronRequested = process.argv.includes('--electron');
    let electronStatus = 'not-requested';
    if (electronRequested) {
      const playwrightCli = process.platform === 'win32'
        ? path.join(appRoot, 'node_modules', '.bin', 'playwright.cmd')
        : path.join(appRoot, 'node_modules', '.bin', 'playwright');
      const electronResult = spawnSync(playwrightCli, ['test', 'tests/e2e/program7-scale-performance.spec.ts', '--project', 'electron', '--workers=1', '--reporter=line'], {
        cwd: appRoot,
        encoding: 'utf8',
        env: process.env,
        stdio: 'inherit',
      });
      electronStatus = electronResult.status === 0 ? 'passed' : 'failed';
    }
    const unitQualified = result.status === 0 && report.success === true && scales.length === 4 && scales.every((assertion) => assertion.status === 'passed');
    const complete = unitQualified && electronStatus === 'passed';
    const status = complete ? 'qualified' : unitQualified ? 'partial' : 'not-qualified';
    const summary = {
      schema: 'black-skies.program7.scale-qualification.v1',
      status,
      exactCommit,
      exactTree,
      platform: process.platform,
      node: process.version,
      command: `node scripts/run-vitest-offline.mjs --run ${testFile} --reporter=json`,
      assertions,
      observations,
      electron: { requested: electronRequested, status: electronStatus, spec: 'app/tests/e2e/program7-scale-performance.spec.ts' },
      limitations: [
        'The existing IdeationRepository tag-filter surface is used for deterministic search qualification; no separate free-text search route exists on the current Program 7 surface.',
        'process.resourceUsage().maxRSS is a process high-water observation; it is not a per-process Windows working-set attribution or host physical-memory measurement.',
      ],
      capturedAt: new Date().toISOString(),
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.stdout.write(`P7_SCALE_QUALIFICATION_${complete ? 'PASS' : status.toUpperCase()}\n`);
    return complete ? 0 : 2;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  run().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
