#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = 'http://127.0.0.1:11434';
const model = 'qwen3:4b';
const projectId = 'proj_carmilla_program7_review';
const unitId = 'carmilla-prologue';
const schemaVersion = 'program7.local-ai-qualification.v1';

function argValue(argv, name, fallback) {
  const index = argv.indexOf(name);
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (value && !value.startsWith('-')) return value;
  return fallback;
}

function sha256(value) {
  return createHash('sha256').update(value.replace(/\r\n?/gu, '\n'), 'utf8').digest('hex');
}

function durableBody(markdown) {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const lines = normalized.split('\n');
  if (lines[0]?.trim() !== '---') return normalized;
  const closing = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (closing < 0) return normalized;
  return lines.slice(closing + 2).join('\n').replace(/^(?:\n)+/u, '');
}

function requestFor(operation, sourceText, bodySha256, requestId, purpose) {
  const bounds = {
    rewrite_candidate: { inputChars: 12_000, outputChars: 6_000 },
    revision_recheck: { inputChars: 8_000, outputChars: 2_000 },
    premise_alternative: { inputChars: 12_000, outputChars: 6_000 },
    emotion_analysis: { inputChars: 12_000, outputChars: 2_000 },
  }[operation];
  return {
    schema: 'program7.local-inference.request.v1',
    operation,
    model,
    requestId,
    projectId,
    source: { unitId, bodySha256, text: sourceText.slice(0, bounds.inputChars) },
    purpose,
    limits: bounds,
    protection: { excluded: false, class: 'ordinary' },
  };
}

async function gitCommit() {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot });
  return stdout.trim();
}

async function fileDigest(root, relative) {
  return sha256(await readFile(path.join(root, relative), 'utf8'));
}

async function loadAppContracts() {
  const serviceUrl = pathToFileURL(path.join(repoRoot, 'app', 'dist-electron', 'main', 'program7LocalInferenceService.js')).href;
  const transportUrl = pathToFileURL(path.join(repoRoot, 'app', 'dist-electron', 'main', 'ollamaLocalInferenceTransport.js')).href;
  try {
    const [{ Program7LocalInferenceService }, { OllamaLocalInferenceTransport }] = await Promise.all([
      import(serviceUrl),
      import(transportUrl),
    ]);
    return { Program7LocalInferenceService, OllamaLocalInferenceTransport };
  } catch (error) {
    throw new Error(`The built Program 7 local-inference contracts are unavailable. Run pnpm --filter app build:main first. ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function run() {
  const fixtureRoot = path.resolve(argValue(process.argv.slice(2), '--fixture-root', ''));
  const outputPath = path.resolve(argValue(process.argv.slice(2), '--output', path.join(repoRoot, 'artifacts', 'program7', 'local-ai-qualification.json')));
  if (!fixtureRoot || !fixtureRoot.endsWith('carmilla-review')) {
    throw new Error('Usage: node scripts/qualify-program7-local-ai.mjs --fixture-root <...\\carmilla-review> [--output <json>]');
  }
  const draftPath = path.join(fixtureRoot, 'drafts', `${unitId}.md`);
  const storyPath = path.join(fixtureRoot, 'story-intelligence.json');
  const draftBefore = await fileDigest(fixtureRoot, path.join('drafts', `${unitId}.md`));
  const storyBefore = await fileDigest(fixtureRoot, 'story-intelligence.json');
  const durable = durableBody(await readFile(draftPath, 'utf8'));
  const bodySha256 = sha256(durable);
  const sourceText = durable.slice(0, 700);
  const { Program7LocalInferenceService, OllamaLocalInferenceTransport } = await loadAppContracts();
  const transport = new OllamaLocalInferenceTransport();
  const service = new Program7LocalInferenceService({ transport, timeoutMs: 30_000 });
  const operations = [
    ['rewrite_candidate', 'Offer one bounded, author-reviewable rewrite candidate without claiming ownership.'],
    ['revision_recheck', 'Report whether the opening concern appears resolved or still present after a hypothetical bounded edit.'],
    ['premise_alternative', 'Offer one bounded premise alternative for author review without changing the manuscript.'],
  ];
  const results = [];
  for (const [operation, purpose] of operations) {
    const request = requestFor(operation, sourceText, bodySha256, `program7-qualification-${operation}`, purpose);
    const started = Date.now();
    const response = await service.run(request, { authorInvoked: true });
    results.push({
      operation,
      status: response.status,
      responseTextLength: response.text.length,
      reason: response.reason,
      receipt: response.receipt,
      elapsedMs: Date.now() - started,
      request: { schema: request.schema, requestId: request.requestId, projectId: request.projectId, sourceUnitId: request.source.unitId, sourceBodySha256: request.source.bodySha256, sourceChars: request.source.text.length, limits: request.limits, protection: request.protection },
    });
  }

  const protectedRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-protected', 'Protected refusal control.');
  protectedRequest.protection = { excluded: false, class: 'metadata-only' };
  const protectedResponse = await service.run(protectedRequest, { authorInvoked: true });
  const cancelledController = new AbortController();
  cancelledController.abort();
  const cancelledRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-cancelled', 'Cancellation control.');
  const cancelledResponse = await service.run(cancelledRequest, { authorInvoked: true, signal: cancelledController.signal });
  const timeoutService = new Program7LocalInferenceService({ transport, timeoutMs: 1 });
  const timeoutRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-timeout', 'Timeout control.');
  const timeoutResponse = await timeoutService.run(timeoutRequest, { authorInvoked: true });
  const unavailableService = new Program7LocalInferenceService({
    transport: { request: async () => { throw new Error('qualification unavailable control'); } },
    timeoutMs: 1_000,
  });
  const unavailableRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-unavailable', 'Unavailable control.');
  const unavailableResponse = await unavailableService.run(unavailableRequest, { authorInvoked: true });
  const invalidService = new Program7LocalInferenceService({
    transport: { request: async () => ({ payload: { status: 'candidate', text: '', reason: 'invalid control' }, receipt: null }) },
    timeoutMs: 1_000,
  });
  const invalidRequest = requestFor('rewrite_candidate', sourceText, bodySha256, 'program7-qualification-invalid', 'Invalid response control.');
  const invalidResponse = await invalidService.run(invalidRequest, { authorInvoked: true });

  const draftAfter = await fileDigest(fixtureRoot, path.join('drafts', `${unitId}.md`));
  const storyAfter = await fileDigest(fixtureRoot, 'story-intelligence.json');
  const modelDigests = [...new Set(results.map((result) => result.receipt.modelDigest).filter(Boolean))];
  const actualModels = [...new Set(results.map((result) => result.receipt.actualModel).filter(Boolean))];
  const statusesValid = results.every((result) => result.status === 'candidate' || result.status === 'no_findings' || result.status === 'appears_resolved' || result.status === 'still_appears_present');
  const controlsValid = protectedResponse.status === 'failed' && !JSON.stringify(protectedResponse).includes(sourceText) && cancelledResponse.status === 'cancelled' && timeoutResponse.status === 'unavailable' && unavailableResponse.status === 'unavailable' && invalidResponse.status === 'failed';
  const qualified = actualModels.length === 1 && actualModels[0] === model && modelDigests.length === 1 && statusesValid && controlsValid && draftBefore === draftAfter && storyBefore === storyAfter;
  const evidence = {
    schemaVersion,
    status: qualified ? 'qualified' : 'not-qualified',
    exactCommit: await gitCommit(),
    endpoint,
    requestedModel: model,
    actualModels,
    modelDigests,
    fixture: { fixtureRoot, projectId, unitId, bodySha256, sourceChars: sourceText.length, sourcePath: 'drafts/carmilla-prologue.md' },
    operations: results,
    controls: {
      protectedRefusal: { status: protectedResponse.status, reason: protectedResponse.reason, sourceTextPackaged: JSON.stringify(protectedResponse).includes(sourceText) === false },
      cancellation: { status: cancelledResponse.status, reason: cancelledResponse.reason },
      timeout: { status: timeoutResponse.status, reason: timeoutResponse.reason },
      unavailable: { status: unavailableResponse.status, reason: unavailableResponse.reason },
      invalidResponse: { status: invalidResponse.status, reason: invalidResponse.reason },
    },
    truthMutation: { draftBefore, draftAfter, storyBefore, storyAfter, unchanged: draftBefore === draftAfter && storyBefore === storyAfter },
    generatedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
  if (!qualified) process.exitCode = 2;
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
