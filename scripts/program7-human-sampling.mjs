#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ledgerPathIndex = process.argv.indexOf('--ledger');
const ledgerPath = ledgerPathIndex >= 0 ? path.resolve(process.argv[ledgerPathIndex + 1]) : path.join(repoRoot, 'docs', 'product_systems', 'program_7_evidence_ledger.jsonl');
const outputPathIndex = process.argv.indexOf('--output');
const outputPath = outputPathIndex >= 0 ? path.resolve(process.argv[outputPathIndex + 1]) : path.join(repoRoot, 'docs', 'product_systems', 'program_7_human_sample.json');
const algorithm = 'program7-human-sample-v1';

function hash(value) { return createHash('sha256').update(value, 'utf8').digest('hex'); }
const rows = (await readFile(ledgerPath, 'utf8')).split(/\r?\n/u).filter(Boolean).map((line) => JSON.parse(line));
const exactCommit = rows[0]?.exactCommit;
const packages = {};
for (const row of rows) {
  if (row.result !== 'Pass' || row.authoritySensitive || row.genuinelySubjective) continue;
  packages[row.package] ??= [];
  packages[row.package].push(row);
}
const packageResults = {};
for (const [packageId, eligibleRows] of Object.entries(packages)) {
  const seed = hash(`${exactCommit}|${packageId}|${algorithm}`);
  const sorted = [...eligibleRows].sort((left, right) => hash(`${seed}|${left.evidenceId}`).localeCompare(hash(`${seed}|${right.evidenceId}`)));
  const sampleCount = eligibleRows.length < 3 ? eligibleRows.length : Math.max(3, Math.ceil(eligibleRows.length * 0.1));
  packageResults[packageId] = {
    seed,
    eligiblePassIds: eligibleRows.map((row) => row.evidenceId).sort(),
    selectedIds: sorted.slice(0, sampleCount).map((row) => row.evidenceId),
    sampleCount,
  };
}
const artifact = {
  schemaVersion: 'program7.human-sample.v1',
  exactCommit,
  algorithm,
  rule: 'For each package, hash exactCommit|packageId|program7-human-sample-v1, sort SHA256(seed|evidenceId), and select ceil(10%) with a minimum of three when at least three objective Pass rows exist; select all when fewer than three exist.',
  packages: packageResults,
  jasonFields: {
    status: '',
    notes: '',
    scores: {},
    decision: '',
  },
};
await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ outputPath, exactCommit, packages: packageResults }, null, 2)}\n`);
