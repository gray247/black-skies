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
