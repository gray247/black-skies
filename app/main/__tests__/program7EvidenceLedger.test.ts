import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '../../..');
const builder = path.join(repoRoot, 'scripts', 'build-program7-evidence-ledger.mjs');

async function runBuilder(root: string, unicodePacket: unknown) {
  const unicodePath = path.join(root, 'unicode.json');
  const ledgerPath = path.join(root, 'ledger.jsonl');
  await writeFile(unicodePath, `${JSON.stringify(unicodePacket)}\n`, 'utf8');
  await execFileAsync(process.execPath, [builder, '--ledger', ledgerPath, '--unicode', unicodePath], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024,
  });
  const rows = (await readFile(ledgerPath, 'utf8')).trim().split(/\r?\n/u).map((line) => JSON.parse(line));
  return rows.find((row: { evidenceId: string }) => row.evidenceId === 'P7-G2-PROTOCOL-UNICODE-MARKDOWN');
}

describe('Program 7 evidence ledger builder', () => {
  it('promotes a clean exact-bound qualification packet and keeps stale packets unresolved', async () => {
    const root = await mkdtemp(path.join(repoRoot, '.tmp-program7-ledger-'));
    try {
      const { stdout: commitOutput } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
      const exactCommit = commitOutput.trim();
      const { stdout: treeOutput } = await execFileAsync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: repoRoot });
      const exactTree = treeOutput.trim();
      const packet = {
        schema: 'program7.unicode-qualification.v2',
        exactCommit,
        exactTree,
        workingTreeClean: true,
        pass: true,
        observed: { tests: 18, passedTests: 18, failedTests: 0 },
        assertions: Array.from({ length: 18 }, () => ({ passed: true })),
        protectedEvidenceUsed: false,
        humanAcceptanceClaimed: false,
      };
      await expect(runBuilder(root, packet)).resolves.toMatchObject({ result: 'Pass' });
      await expect(runBuilder(root, { ...packet, exactCommit: '0'.repeat(40) })).resolves.toMatchObject({ result: 'Uncertain' });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe('Program 7 evidence artifact validation', () => {
  it.each(['hash', 'embedded commit'] as const)('reports an artifact %s failure without swallowing it', async (kind) => {
    const root = await mkdtemp(path.join(tmpdir(), 'black-skies-p7-validator-'));
    const validator = path.join(repoRoot, 'scripts', 'validate-program7-evidence.mjs');
    const lines = (await readFile(path.join(repoRoot, 'docs/product_systems/program_7_evidence_ledger.jsonl'), 'utf8')).trim().split(/\r?\n/u);
    const row = JSON.parse(lines[0]);
    const artifactPath = path.join(root, 'artifact.json');
    const contents = JSON.stringify({ exactCommit: '0'.repeat(40) });
    await writeFile(artifactPath, contents, 'utf8');
    row.artifacts = [{ path: artifactPath, sha256: kind === 'hash' ? '0'.repeat(64) : createHash('sha256').update(contents).digest('hex'), containsProtectedContent: false }];
    const ledger = path.join(root, 'ledger.jsonl');
    await writeFile(ledger, JSON.stringify(row) + '\n', 'utf8');
    const message = kind === 'hash' ? 'artifact hash does not match' : 'artifact embeds a different exact commit';
    await expect(execFileAsync(process.execPath, [validator, '--ledger', ledger], { cwd: repoRoot }))
      .rejects.toMatchObject({ stderr: expect.stringContaining(message) });
  });
});

describe('Program 7 external qualification packet', () => {
  it('samples and validates an external ledger without overwriting the historical sample', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'black-skies-p7-external-packet-'));
    const historicalSample = path.join(repoRoot, 'docs/product_systems/program_7_human_sample.json');
    const before = await readFile(historicalSample);
    const row = JSON.parse((await readFile(path.join(repoRoot, 'docs/product_systems/program_7_evidence_ledger.jsonl'), 'utf8')).trim().split(/\r?\n/u)[0]);
    const artifact = path.join(root, 'artifact.json');
    const contents = JSON.stringify({ exactCommit: row.exactCommit });
    await writeFile(artifact, contents, 'utf8');
    row.artifacts = [{ path: artifact, sha256: createHash('sha256').update(contents).digest('hex'), containsProtectedContent: false }];
    const ledger = path.join(root, 'ledger.jsonl');
    const sample = path.join(root, 'sample.json');
    await writeFile(ledger, JSON.stringify(row) + '\n', 'utf8');
    await execFileAsync(process.execPath, [path.join(repoRoot, 'scripts/program7-human-sampling.mjs'), '--ledger', ledger, '--output', sample], { cwd: repoRoot });
    const result = await execFileAsync(process.execPath, [path.join(repoRoot, 'scripts/validate-program7-evidence.mjs'), '--ledger', ledger, '--sample', sample], { cwd: repoRoot });
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, rows: 1, exactCommit: row.exactCommit });
    expect(await readFile(historicalSample)).toEqual(before);
  });
});

describe('Program 7 deterministic human sample validation', () => {
  it.each(['seed', 'selection'] as const)('rejects a substituted sample %s', async (kind) => {
    const root = await mkdtemp(path.join(tmpdir(), 'black-skies-p7-sample-integrity-'));
    const row = JSON.parse((await readFile(path.join(repoRoot, 'docs/product_systems/program_7_evidence_ledger.jsonl'), 'utf8')).trim().split(/\r?\n/u)[0]);
    const artifact = path.join(root, 'artifact.json');
    const contents = JSON.stringify({ exactCommit: row.exactCommit });
    await writeFile(artifact, contents, 'utf8');
    row.artifacts = [{ path: artifact, sha256: createHash('sha256').update(contents).digest('hex'), containsProtectedContent: false }];
    row.authoritySensitive = false;
    row.genuinelySubjective = false;
    const rows = Array.from({ length: 4 }, (_, index) => ({ ...row, evidenceId: 'RT-2B-OBJECTIVE-' + (index + 1) }));
    const ledger = path.join(root, 'ledger.jsonl');
    const samplePath = path.join(root, 'sample.json');
    await writeFile(ledger, rows.map((entry) => JSON.stringify(entry)).join('\n') + '\n', 'utf8');
    await execFileAsync(process.execPath, [path.join(repoRoot, 'scripts/program7-human-sampling.mjs'), '--ledger', ledger, '--output', samplePath], { cwd: repoRoot });
    const sample = JSON.parse(await readFile(samplePath, 'utf8'));
    const entry = sample.packages[row.package];
    if (kind === 'seed') entry.seed = '0'.repeat(64);
    else entry.selectedIds[0] = entry.eligiblePassIds.find((id: string) => !entry.selectedIds.includes(id));
    await writeFile(samplePath, JSON.stringify(sample), 'utf8');
    const message = kind === 'seed' ? 'human sample seed differs' : 'human sample deterministic selection differs';
    await expect(execFileAsync(process.execPath, [path.join(repoRoot, 'scripts/validate-program7-evidence.mjs'), '--ledger', ledger, '--sample', samplePath], { cwd: repoRoot }))
      .rejects.toMatchObject({ stderr: expect.stringContaining(message) });
  });
});

describe('Program 7 pilot failure reporting', () => {
  it('retains current observed failures without borrowing stale failures', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'black-skies-p7-pilot-ledger-'));
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
    const exactCommit = stdout.trim();
    const { stdout: treeOut } = await execFileAsync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: repoRoot });
    const pilot = JSON.parse(await readFile(path.join(repoRoot, 'docs/product_systems/program_7_local_ai_qualification.json'), 'utf8'));
    pilot.exactCommit = exactCommit;
    pilot.exactTree = treeOut.trim();
    pilot.precommitTreeHash = treeOut.trim();
    pilot.status = 'not-qualified';
    pilot.matrix[0].mechanicalPass = false;
    pilot.matrixSummary.mechanicalPassRows = 23;
    pilot.matrixSummary.mechanicalPass = false;
    const pilotPath = path.join(root, 'pilot.json');
    const ledger = path.join(root, 'ledger.jsonl');
    async function build() {
      await writeFile(pilotPath, JSON.stringify(pilot), 'utf8');
      await execFileAsync(process.execPath, [builder, '--ledger', ledger, '--pilot', pilotPath], { cwd: repoRoot });
      return (await readFile(ledger, 'utf8')).trim().split(/\r?\n/u).map((line) => JSON.parse(line));
    }
    const rows = await build();
    const failedId = 'RT-2B-' + pilot.matrix[0].scenarioId + '-' + pilot.matrix[0].executionMode.toUpperCase();
    expect(rows.find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Fail', disposition: 'repair', artifacts: [expect.objectContaining({ path: pilotPath })] });
    expect(rows.find((row) => row.evidenceId.startsWith('RT-2B-') && row.evidenceId !== failedId)).toMatchObject({ result: 'Uncertain' });
    const savedTree = pilot.exactTree;
    delete pilot.exactTree;
    delete pilot.precommitTreeHash;
    expect((await build()).find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Uncertain' });
    pilot.exactTree = savedTree;
    pilot.precommitTreeHash = savedTree;

    pilot.exactCommit = '0'.repeat(40);
    expect((await build()).find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Uncertain' });
    pilot.exactCommit = exactCommit;
    pilot.status = 'qualified';
    pilot.matrix[0].mechanicalPass = true;
    pilot.matrixSummary.mechanicalPassRows = 24;
    pilot.matrixSummary.mechanicalPass = true;
    pilot.providerPreconditionsVerified = true;
    pilot.workingTreeClean = true;
    expect((await build()).find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Pass' });
    delete pilot.exactTree;
    delete pilot.precommitTreeHash;
    expect((await build()).find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Uncertain' });
    pilot.exactTree = savedTree;
    pilot.precommitTreeHash = savedTree;
    pilot.providerPreconditionsVerified = false;
    expect((await build()).find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Uncertain' });
    pilot.providerPreconditionsVerified = true;
    pilot.workingTreeClean = false;
    expect((await build()).find((row) => row.evidenceId === failedId)).toMatchObject({ result: 'Uncertain' });
  });
});
