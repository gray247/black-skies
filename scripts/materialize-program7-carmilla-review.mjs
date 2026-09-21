#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineRoot = path.join(
  repoRoot,
  'sample_project',
  'program_7_corpus',
  'carmilla',
  'derived',
  'baseline',
);
const projectId = 'proj_carmilla_program7_review';
const unitId = 'carmilla-chapter-01';
const signalId = 'program7-carmilla-review-signal';
const createdAt = '2026-09-13T00:00:00.000Z';
const passageOpening = 'The first occurrence in my existence, which produced a terrible';

function sha256(value) {
  return createHash('sha256').update(value.replace(/\r\n?/gu, '\n'), 'utf8').digest('hex');
}

function readRootArgument(argv) {
  const index = argv.indexOf('--root');
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (!value || value.startsWith('-')) {
    throw new Error('Usage: node scripts/materialize-program7-carmilla-review.mjs --root <directory>');
  }
  return path.resolve(value);
}

function editorBody(markdown) {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') return normalized;
  const closing = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closing < 0) return normalized;
  const framed = lines.slice(closing + 2).join('\n');
  return framed.endsWith('\n') ? framed.slice(0, -1) : framed;
}

function durableBody(body) {
  const normalized = body.replace(/\r\n?/gu, '\n').replace(/^(?:\n)+/u, '');
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

async function main() {
  const root = readRootArgument(process.argv.slice(2));
  await mkdir(root, { recursive: true });
  const projectRoot = path.join(root, 'carmilla-review');
  await cp(baselineRoot, projectRoot, { recursive: true, force: true });

  const draftPath = path.join(projectRoot, 'drafts', `${unitId}.md`);
  const draft = await readFile(draftPath, 'utf8');
  const durable = durableBody(editorBody(draft));
  const body = durable;
  const selectionStart = body.indexOf(passageOpening);
  const selectionEnd = selectionStart + Math.min(220, body.length - selectionStart);
  const selectedText = body.slice(selectionStart, selectionEnd);
  if (selectionStart < 0 || !selectedText.trim()) {
    throw new Error('The seeded Carmilla childhood-fright passage could not be located.');
  }
  const sourceFingerprint = sha256(durable);
  const selectionFingerprint = sha256(selectedText);
  const projectMetadataPath = path.join(projectRoot, 'project.json');
  const projectMetadata = JSON.parse(await readFile(projectMetadataPath, 'utf8'));
  projectMetadata.project_id = projectId;
  projectMetadata.name = 'Carmilla Program 7 Review Fixture';
  await writeFile(projectMetadataPath, `${JSON.stringify(projectMetadata, null, 2)}\n`, 'utf8');
  const outlinePath = path.join(projectRoot, 'outline.json');
  const outline = JSON.parse(await readFile(outlinePath, 'utf8'));
  outline.project_id = projectId;
  await writeFile(outlinePath, `${JSON.stringify(outline, null, 2)}\n`, 'utf8');
  const documentPath = path.join(projectRoot, 'story-intelligence.json');
  const document = JSON.parse(await readFile(documentPath, 'utf8'));
  document.projectId = projectId;
  document.revision = Number(document.revision ?? 0) + 1;
  document.updatedAt = createdAt;
  for (const record of document.authorRecords ?? []) {
    record.projectId = projectId;
    for (const reference of record.positionRefs ?? []) {
      reference.projectId = projectId;
      if (reference.unitId === unitId || reference.sourceId === unitId) {
        reference.sourceFingerprint = sourceFingerprint;
      }
    }
  }
  for (const event of document.history ?? []) event.projectId = projectId;
  for (const disposition of document.dispositions ?? []) disposition.projectId = projectId;
  document.durableSignals = [{
    schemaVersion: 'BlackSkiesStoryIntelligence v1',
    signalId,
    projectId,
    positionRefs: [{
      projectId,
      sourceKind: 'story-unit',
      sourceId: unitId,
      sourceRevision: 1,
      sourceFingerprint,
      unitId,
      selectionFingerprint,
      selectionStart,
      selectionEnd: selectionStart + selectedText.length,
      bodySha256: sourceFingerprint,
      orderIndex: 1,
      orderBasis: 'manuscript',
    }],
    sourceOwner: 'Program 7 disposable Carmilla review fixture',
    evidenceClass: 'observed',
    impact: 'attention',
    confidenceBand: 'medium',
    currentness: 'current',
    lifecycle: 'accepted',
    summary: 'The childhood fright begins after a long account of the castle and household.',
    evidenceSummary: 'Consider whether the turn into the childhood encounter needs a clearer transition.',
    provenance: {
      sourceOwner: 'Program 7 disposable Carmilla review fixture',
      origin: 'author',
      visibility: 'included',
      citationRequired: true,
      protectionClass: 'included',
    },
    createdAt,
    updatedAt: createdAt,
  }];
  document.dispositions = [];
  document.history = [];
  await writeFile(documentPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify({
    fixtureRoot: projectRoot,
    projectId,
    signalId,
    unitId,
    sourceFingerprint,
    selectionFingerprint,
    selectionStart,
    selectionEnd: selectionStart + selectedText.length,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
