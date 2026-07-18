import { cp, mkdtemp, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import { AI_CRITIQUE_TASK_CONTRACT_VERSION } from '../../shared/ipc/aiCritique';
import type { AiCritiqueContent } from '../../shared/ipc/aiCritique';
import { QualificationArtifactRun, QUALIFICATION_FIXTURES_V1, canonicalHash, canonicalJson, importReviewerScores, makeReviewerPacket, normalizedCritiqueHash, qualificationAttemptStorageFilename, reviewerTemplateProvenance, serializeNormalizedCritique, validateReviewerScores, requiredAdjudications, verifyQualificationRun } from '../aiCritiqueQualificationArtifacts';
import { sha256 } from '../aiCritiqueCoordinator';
import { AI_CRITIQUE_QUALIFICATION_FIXTURES_V1 } from './fixtures/aiCritiqueQualification.v1';

const repositoryRoot = 'C:\\Dev\\black-skies';
let baseRunRoot: string;
let adjudicatedBaseRunRoot: string;
let dispositionBaseRunRoot: string;
let failBaseRunRoot: string;
let importBaseRunRoot: string;
const mockedCalculatedUsd = 0.000805;
function mockedProviderResponse(index: number): string { return JSON.stringify({ id: `mock-response-${index}`, usage: { input_tokens: 100, input_tokens_details: { cached_tokens: 20 }, output_tokens: 40 } }); }
function normalizedCritique(overview = 'mock'): AiCritiqueContent { return { overview, strengths: [], priorities: [], uncertainties: [], limitations: [] }; }
function provenanceForPacket(runId: string, packet: { reviewer: string; responses: { id: string }[] }): string { return reviewerTemplateProvenance({ schemaVersion: 'v1', runId, reviewer: packet.reviewer, packetHash: canonicalHash(packet), scores: packet.responses.map((response) => ({ opaqueId: response.id })) }); }

async function captureMockAttempt(
  run: QualificationArtifactRun,
  index: number,
  logicalAttemptId = `qualification:${AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)].id}:${index % 2 === 0 ? 1 : 2}:mock-${index}`,
): Promise<void> {
  const fixture = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)];
  const [fixtureId, fixtureHash] = QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)];
  const critique = normalizedCritique(`mock-${index}`);
  const sink = run.evidenceSink({
    attemptId: logicalAttemptId,
    fixtureId,
    fixtureHash,
    execution: index % 2 === 0 ? 1 : 2,
    prose: fixture.prose,
    critique,
    provider: 'openai',
    model: 'gpt-5.4-2026-03-05',
    contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
    instructionHash: 'i'.repeat(64),
    schemaHash: 's'.repeat(64),
    parameterHash: 'p'.repeat(64),
    requestHash: sha256(`mock-request-${index}`),
    normalizedHash: normalizedCritiqueHash(critique),
    structuralValid: true,
    usage: { calculatedUsd: mockedCalculatedUsd },
  });
  const responseText = mockedProviderResponse(index);
  const body = new TextEncoder().encode(responseText);
  await sink({
    attemptId: logicalAttemptId,
    status: 200,
    body,
    bodySha256: sha256(responseText),
    byteLength: body.byteLength,
    providerRequestId: null,
  });
}

async function createBaseRun(runId = 'base-run', withDispute = false, useDisposition = false, failDimension = false): Promise<string> {
  const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-evidence-base-'));
  const run = await QualificationArtifactRun.create({ outputRoot, repositoryRoot, repositoryHead: 'head', runId, allowTemporaryRoot: true });
  for (let index = 0; index < 24; index += 1) {
    const fixture = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)]; const [fixtureId, fixtureHash] = QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)]; const attemptId = `${runId}-attempt-${index}`; const critique = normalizedCritique();
    const sink = run.evidenceSink({ attemptId, fixtureId, fixtureHash, execution: index % 2 === 0 ? 1 : 2, prose: fixture.prose, critique, provider: 'openai', model: 'gpt-5.4-2026-03-05', contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION, instructionHash: 'i'.repeat(64), schemaHash: 's'.repeat(64), parameterHash: 'p'.repeat(64), requestHash: sha256(`${runId}-request-${index}`), normalizedHash: normalizedCritiqueHash(critique), structuralValid: true, usage: { calculatedUsd: mockedCalculatedUsd } }); const responseText = mockedProviderResponse(index); const body = new TextEncoder().encode(responseText); await sink({ attemptId, status: 200, body, bodySha256: sha256(responseText), byteLength: body.byteLength, providerRequestId: null });
  }
  await run.completeCapture(); await run.finalizePackets('base-seed-a', 'base-seed-b');
  const packets = await Promise.all(['reviewer-a', 'reviewer-b'].map(async (reviewer) => JSON.parse(await readFile(join(run.root, reviewer, 'packet.json'), 'utf8'))));
  const makeScores = (packet: typeof packets[number], reviewer: 'reviewer-a' | 'reviewer-b') => ({ schemaVersion: 'v1', runId, reviewer, independentAttestation: true as const, packetHash: canonicalHash(packet), templateProvenance: provenanceForPacket(runId, packet), scores: packet.responses.map((response: { id: string }, index: number) => ({ opaqueId: response.id, relevance: failDimension ? 3 : withDispute && reviewer === 'reviewer-a' && index === 0 ? 3 : 5, evidenceSpecificity: 5, correctness: 5, actionability: 5, styleRespect: 5, uncertaintyRefusal: 5, fabricatedFact: false, harmfulRecommendation: false, inappropriateNormalization: false, missedMaterialDefect: false, unjustifiedRefusal: false })) });
  const a = makeScores(packets[0], 'reviewer-a'); const b = makeScores(packets[1], 'reviewer-b'); await run.submitScores(a); await run.submitScores(b);
  const maps = JSON.parse(await readFile(join(run.privateRoot, 'reviewer-maps.json'), 'utf8'));
  const adjudications = withDispute ? requiredAdjudications(a, b, maps.a, maps.b).map((need) => ({
    ...need,
    ...(useDisposition ? { disposition: 'MIDPOINT' as const } : { finalValue: 5 }),
    rationale: 'Mocked independent review reconciliation.',
    at: '2026-07-15T00:00:00.000Z',
  })) : [];
  if (adjudications.length > 0) await run.submitAdjudications(adjudications, a, b);
  await run.finalizeReceipt(a, b, adjudications); return run.root;
}
async function createImportBaseRun(runId = 'import-base-run'): Promise<string> {
  const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-import-base-'));
  const run = await QualificationArtifactRun.create({ outputRoot, repositoryRoot, repositoryHead: 'head', runId, allowTemporaryRoot: true });
  for (let index = 0; index < 24; index += 1) await captureMockAttempt(run, index, `${runId}:attempt:${index}`);
  await run.completeCapture(); await run.finalizePackets(`${runId}-seed-a`, `${runId}-seed-b`); return run.root;
}
async function completedTemplate(root: string, reviewer: 'reviewer-a' | 'reviewer-b'): Promise<{ path: string; value: Record<string, any> }> {
  const value = JSON.parse(await readFile(join(root, reviewer, 'score-template.json'), 'utf8'));
  value.independentAttestation = true;
  value.scores = value.scores.map((score: Record<string, unknown>) => ({ ...score, relevance: 5, evidenceSpecificity: 5, correctness: 5, actionability: 5, styleRespect: 5, uncertaintyRefusal: 5, fabricatedFact: false, harmfulRecommendation: false, inappropriateNormalization: false, missedMaterialDefect: false, unjustifiedRefusal: false }));
  const parent = await mkdtemp(join(tmpdir(), 'black-skies-completed-score-')); const path = join(parent, 'completed-template.json'); await writeFile(path, JSON.stringify(value, null, 2), 'utf8'); return { path, value };
}

async function cloneRun(source: string, label: string): Promise<string> { const parent = await mkdtemp(join(tmpdir(), `black-skies-qualification-${label}-`)); const target = join(parent, basename(source)); await cp(source, target, { recursive: true }); return target; }
async function cloneBase(label: string): Promise<string> { return cloneRun(baseRunRoot, label); }
async function cloneAdjudicatedBase(label: string): Promise<string> { return cloneRun(adjudicatedBaseRunRoot, label); }
async function cloneFailBase(label: string): Promise<string> { return cloneRun(failBaseRunRoot, label); }
async function cloneImportBase(label: string): Promise<string> { return cloneRun(importBaseRunRoot, label); }
async function mutateJson(path: string, mutate: (value: Record<string, any>) => void): Promise<void> { const value = JSON.parse(await readFile(path, 'utf8')); mutate(value); await writeFile(path, canonicalJson(value), 'utf8'); }
async function markScoreImportLockStale(root: string): Promise<void> { await mutateJson(join(root, 'private', '.score-import.lock'), (value) => { value.pid = 2147483647; }); }
async function expectNoScoreImportTransaction(root: string): Promise<void> {
  const names = await readdir(join(root, 'private'));
  expect(names.filter((name) => name.includes('score-import'))).toEqual([]);
}
async function resealReceipt(root: string, mutate: (value: Record<string, any>) => void): Promise<void> {
  const receiptPath = join(root, 'receipt', 'qualification-receipt.json');
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
  mutate(receipt);
  const bytes = canonicalJson(receipt); const hash = sha256(bytes);
  await writeFile(receiptPath, bytes, 'utf8');
  await writeFile(join(root, 'receipt', 'qualification-receipt.sha256'), `${hash}\n`, 'utf8');
  await mutateJson(join(root, 'private', 'run-manifest.json'), (manifest) => { manifest.receiptHash = hash; });
}
async function mutateFirstRawUsage(root: string, mutate: (usage: Record<string, any>) => void): Promise<void> {
  const identityPath = join(root, 'private', 'identity-map.json');
  const identity = JSON.parse(await readFile(identityPath, 'utf8')); const entry = identity.entries[0];
  const rawPath = join(root, entry.rawResponsePath); const raw = JSON.parse(await readFile(rawPath, 'utf8'));
  mutate(raw.usage);
  const bytes = canonicalJson(raw);
  await writeFile(rawPath, bytes, 'utf8');
  entry.byteLength = Buffer.byteLength(bytes); entry.responseHash = sha256(bytes);
  if (raw.usage) entry.usage = { inputTokens: raw.usage.input_tokens, cachedInputTokens: raw.usage.input_tokens_details?.cached_tokens ?? 0, outputTokens: raw.usage.output_tokens, calculatedUsd: entry.usage?.calculatedUsd };
  else entry.usage = null;
  await writeFile(identityPath, canonicalJson(identity), 'utf8');
}
async function expectTamper(root: string, code: string): Promise<void> {
  const result = await verifyQualificationRun(root);
  expect(result.integrityStatus).toBe('INVALID');
  expect(result.qualificationDisposition).toBe('UNVERIFIED');
  expect(result.errors.map((error) => error.code)).toContain(code);
  expect(result.errors.every((error) => !error.message.includes(root) && !error.message.includes('synthetic-') && !error.message.includes('"overview"'))).toBe(true);
}
async function addPacketMetadata(root: string, key: string, value: unknown): Promise<void> {
  await mutateJson(join(root, 'reviewer-a', 'packet.json'), (packet) => { packet.responses[0][key] = value; });
}
async function swapPrivateMapping(root: string): Promise<void> {
  const swap = (maps: Record<string, any>) => {
    const keys = Object.keys(maps.a);
    [maps.a[keys[0]], maps.a[keys[1]]] = [maps.a[keys[1]], maps.a[keys[0]]];
  };
  await mutateJson(join(root, 'private', 'identity-map.json'), (value) => swap(value.reviewerMaps));
  await mutateJson(join(root, 'private', 'reviewer-maps.json'), swap);
}
async function alignPacketOrdering(root: string): Promise<void> {
  const maps = JSON.parse(await readFile(join(root, 'private', 'reviewer-maps.json'), 'utf8'));
  const packetA = JSON.parse(await readFile(join(root, 'reviewer-a', 'packet.json'), 'utf8'));
  await mutateJson(join(root, 'reviewer-b', 'packet.json'), (packetB) => {
    const rank = Object.fromEntries(packetA.responses.map((response: { id: string }, index: number) => [maps.a[response.id], index]));
    packetB.responses.sort((left: { id: string }, right: { id: string }) => rank[maps.b[left.id]] - rank[maps.b[right.id]]);
  });
}

describe.sequential('AI critique qualification artifacts', () => {
  it('serializes normalized critiques in the durable contract order', () => {
    const critique = {
      limitations: ['limitation'], uncertainties: ['uncertainty'],
      priorities: [{ revisionQuestion: 'question', impact: 'impact', observation: 'observation', evidence: 'evidence' }],
      strengths: ['strength'], overview: 'overview',
    };
    expect(serializeNormalizedCritique(critique)).toBe('{"overview":"overview","strengths":["strength"],"priorities":[{"evidence":"evidence","observation":"observation","impact":"impact","revisionQuestion":"question"}],"uncertainties":["uncertainty"],"limitations":["limitation"]}');
    expect(normalizedCritiqueHash(critique)).toBe(normalizedCritiqueHash(JSON.parse(serializeNormalizedCritique(critique))));
    expect(normalizedCritiqueHash(critique)).not.toBe(canonicalHash(critique));
  });

  it('preserves semantic array order and exact string content', () => {
    const critique = { overview: '  “quoted”\ntext  ', strengths: ['first', 'second'], priorities: [{ evidence: 'é', observation: 'observe', impact: 'impact', revisionQuestion: 'why?' }, { evidence: 'second', observation: 'observe two', impact: 'impact two', revisionQuestion: 'then?' }], uncertainties: ['one', 'two'], limitations: ['three', 'four'] };
    expect(JSON.parse(serializeNormalizedCritique(critique))).toEqual(critique);
    for (const field of ['strengths', 'priorities', 'uncertainties', 'limitations'] as const) expect(normalizedCritiqueHash(critique)).not.toBe(normalizedCritiqueHash({ ...critique, [field]: [...critique[field]].reverse() }));
    expect(normalizedCritiqueHash(critique)).not.toBe(normalizedCritiqueHash({ ...critique, overview: critique.overview.trim() }));
    expect(normalizedCritiqueHash(critique)).not.toBe(normalizedCritiqueHash({ ...critique, priorities: [{ ...critique.priorities[0], evidence: 'e' }] }));
  });

  it('rejects missing, null, undefined, and unknown normalized fields', () => {
    const valid = normalizedCritique();
    expect(() => serializeNormalizedCritique({ ...valid, extra: true })).toThrow();
    expect(() => serializeNormalizedCritique({ ...valid, overview: null })).toThrow();
    expect(() => serializeNormalizedCritique({ ...valid, strengths: undefined })).toThrow();
    expect(() => serializeNormalizedCritique({ overview: 'incomplete' })).toThrow();
    expect(() => serializeNormalizedCritique({ ...valid, priorities: [{ evidence: '', observation: '', impact: '', revisionQuestion: '', extra: true }] })).toThrow();
  });

  it.runIf(Boolean(process.env.BLACK_SKIES_AI_QUALIFICATION_VERIFY_RUN))('verifies the immutable packets-finalized capture without scoring it', async () => {
    const result = await verifyQualificationRun(process.env.BLACK_SKIES_AI_QUALIFICATION_VERIFY_RUN!, { phase: 'capture' });
    expect(result).toMatchObject({ valid: true, integrityStatus: 'VALID', qualificationDisposition: 'UNVERIFIED', lifecycle: 'PACKETS_FINALIZED', evidenceCount: 24, errors: [] });
  });

  beforeAll(async () => {
    baseRunRoot = await createBaseRun();
    adjudicatedBaseRunRoot = await createBaseRun('adjudicated-base-run', true);
    dispositionBaseRunRoot = await createBaseRun('disposition-base-run', true, true);
    failBaseRunRoot = await createBaseRun('fail-base-run', false, false, true);
    importBaseRunRoot = await createImportBaseRun();
  });

  it('records deterministic future template provenance and imports both reviewers independently', async () => {
    const root = await cloneImportBase('valid-import');
    const a = await completedTemplate(root, 'reviewer-a');
    const sourceA = JSON.parse(await readFile(join(root, 'reviewer-a', 'score-template.json'), 'utf8'));
    expect(sourceA.templateProvenance).toBe(reviewerTemplateProvenance(sourceA));
    const first = await importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: a.path });
    expect(first).toMatchObject({ validationStatus: 'VALID', lifecycle: 'SCORING_IN_PROGRESS', otherReviewerPending: true, compatibility: 'RECORDED_PROVENANCE' });
    const b = await completedTemplate(root, 'reviewer-b');
    const second = await importReviewerScores({ runDir: root, reviewer: 'reviewer-b', templatePath: b.path });
    expect(second).toMatchObject({ validationStatus: 'VALID', lifecycle: 'SCORES_COMPLETE', otherReviewerPending: false });
    expect(await readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8')).toBe(canonicalJson(JSON.parse(await readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8'))));
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: a.path })).rejects.toThrow(/lifecycle|already/i);
    await expect(readFile(join(root, 'adjudication', 'adjudication.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(root, 'receipt', 'qualification-receipt.json'), 'utf8')).rejects.toThrow();
  });

  it('produces identical accepted bytes from reordered source keys and different line endings', async () => {
    const roots = await Promise.all([cloneImportBase('canonical-a'), cloneImportBase('canonical-b')]);
    const first = await completedTemplate(roots[0], 'reviewer-a');
    const second = await completedTemplate(roots[1], 'reviewer-a');
    const reordered = { scores: second.value.scores.map((score: Record<string, unknown>) => Object.fromEntries(Object.entries(score).reverse())), independentAttestation: true, templateProvenance: second.value.templateProvenance, packetHash: second.value.packetHash, reviewer: second.value.reviewer, runId: second.value.runId, schemaVersion: second.value.schemaVersion };
    await writeFile(second.path, JSON.stringify(reordered, null, 4).replace(/\n/g, '\r\n'), 'utf8');
    const a = await importReviewerScores({ runDir: roots[0], reviewer: 'reviewer-a', templatePath: first.path });
    const b = await importReviewerScores({ runDir: roots[1], reviewer: 'reviewer-a', templatePath: second.path });
    expect(a.acceptedScoreSha256).toBe(b.acceptedScoreSha256);
    expect(await readFile(join(roots[0], 'reviewer-a', 'scores.json'), 'utf8')).toBe(await readFile(join(roots[1], 'reviewer-a', 'scores.json'), 'utf8'));
  });

  const importTamperCases: readonly [string, (value: Record<string, any>) => void][] = [
    ['wrong run ID', (value) => { value.runId = 'wrong'; }],
    ['wrong reviewer role', (value) => { value.reviewer = 'reviewer-b'; }],
    ['wrong packet hash', (value) => { value.packetHash = '0'.repeat(64); }],
    ['wrong template provenance', (value) => { value.templateProvenance = '0'.repeat(64); }],
    ['wrong schema version', (value) => { value.schemaVersion = 'v2'; }],
    ['missing alias', (value) => { value.scores.pop(); }],
    ['extra alias', (value) => { value.scores.push({ ...value.scores[0], opaqueId: `r-${'0'.repeat(20)}` }); }],
    ['duplicate alias', (value) => { value.scores[1].opaqueId = value.scores[0].opaqueId; }],
    ['changed alias order', (value) => { value.scores.reverse(); }],
    ['missing dimension', (value) => { delete value.scores[0].relevance; }],
    ['non-integer dimension', (value) => { value.scores[0].relevance = 4.5; }],
    ['out-of-range dimension', (value) => { value.scores[0].relevance = 6; }],
    ['missing flag', (value) => { delete value.scores[0].fabricatedFact; }],
    ['invalid flag type', (value) => { value.scores[0].fabricatedFact = 'false'; }],
    ['invalid note type', (value) => { value.scores[0].note = 1; }],
    ['oversized note', (value) => { value.scores[0].note = 'x'.repeat(501); }],
    ['false independent attestation', (value) => { value.independentAttestation = false; }],
    ['unknown root field', (value) => { value.extra = true; }],
    ['unknown score field', (value) => { value.scores[0].extra = true; }],
  ];
  it.each(importTamperCases)('rejects completed-template tamper without changing the run: %s', async (_name, mutate) => {
    const root = await cloneImportBase('import-tamper'); const before = await readFile(join(root, 'private', 'run-manifest.json'), 'utf8'); const completed = await completedTemplate(root, 'reviewer-a'); mutate(completed.value); await writeFile(completed.path, JSON.stringify(completed.value), 'utf8');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow();
    expect(await readFile(join(root, 'private', 'run-manifest.json'), 'utf8')).toBe(before);
    await expect(readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8')).rejects.toThrow();
  });

  it('cleans a malformed-template validation stop and locks down unrecorded accepted evidence', async () => {
    const malformedRoot = await cloneImportBase('malformed'); const malformed = await completedTemplate(malformedRoot, 'reviewer-a'); await writeFile(malformed.path, '{', 'utf8');
    await expect(importReviewerScores({ runDir: malformedRoot, reviewer: 'reviewer-a', templatePath: malformed.path })).rejects.toThrow('malformed');
    await expectNoScoreImportTransaction(malformedRoot);
    const existingRoot = await cloneImportBase('existing'); const existing = await completedTemplate(existingRoot, 'reviewer-a'); await writeFile(join(existingRoot, 'reviewer-a', 'scores.json'), '{}', 'utf8');
    await expect(importReviewerScores({ runDir: existingRoot, reviewer: 'reviewer-a', templatePath: existing.path })).rejects.toThrow(/already exists|conflicts/);
    expect(await readFile(join(existingRoot, 'private', '.score-import.lock'), 'utf8')).toBeTruthy();
  });

  const crashPhases = ['LOCK_ACQUIRED', 'JOURNAL_PREPARED', 'SCORE_STAGED', 'MANIFEST_STAGED', 'SCORE_CREATED', 'SCORE_COMMITTED', 'MANIFEST_REPLACED', 'MANIFEST_COMMITTED', 'COMPLETE', 'CLEANUP_COMPLETE'] as const;
  const reviewerTransitions = [
    ['reviewer-a', 'PACKETS_FINALIZED', 'SCORING_IN_PROGRESS'],
    ['reviewer-b', 'SCORING_IN_PROGRESS', 'SCORES_COMPLETE'],
  ] as const;
  it.each(reviewerTransitions.flatMap(([reviewer, source, target]) => crashPhases.map((phase) => [reviewer, source, target, phase] as const)))('recovers %s %s -> %s after abrupt termination at %s', async (reviewer, source, target, phase) => {
    const root = await cloneImportBase(`crash-${reviewer}-${phase.toLowerCase()}`);
    if (reviewer === 'reviewer-b') { const first = await completedTemplate(root, 'reviewer-a'); await importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: first.path }); }
    const manifestBefore = JSON.parse(await readFile(join(root, 'private', 'run-manifest.json'), 'utf8'));
    expect(manifestBefore.state).toBe(source);
    const completed = await completedTemplate(root, reviewer);
    await expect(importReviewerScores({ runDir: root, reviewer, templatePath: completed.path, testHooks: { crashAfterPhase: phase } })).rejects.toThrow('Simulated abrupt termination');
    await markScoreImportLockStale(root);
    const committed = ['SCORE_CREATED', 'SCORE_COMMITTED', 'MANIFEST_REPLACED', 'MANIFEST_COMMITTED', 'COMPLETE', 'CLEANUP_COMPLETE'].includes(phase);
    if (committed) await expect(importReviewerScores({ runDir: root, reviewer, templatePath: completed.path })).rejects.toThrow(/safely stopped|lifecycle|already exists|already recorded/i);
    else {
      const result = await importReviewerScores({ runDir: root, reviewer, templatePath: completed.path });
      expect(result).toMatchObject({ lifecycle: target, recoveryStatus: phase === 'LOCK_ACQUIRED' ? 'NONE' : 'UNCOMMITTED_TRANSACTION' });
    }
    const manifestAfter = JSON.parse(await readFile(join(root, 'private', 'run-manifest.json'), 'utf8'));
    expect(manifestAfter.state).toBe(target);
    expect(typeof manifestAfter.scoreHashes[reviewer]).toBe('string');
    expect(await readFile(join(root, reviewer, 'scores.json'), 'utf8')).toBeTruthy();
    await expectNoScoreImportTransaction(root);
  });

  it('rejects an active run lock and recovers a stale lock without a journal', async () => {
    const root = await cloneImportBase('lock-policy'); const completed = await completedTemplate(root, 'reviewer-a');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path, testHooks: { crashAfterPhase: 'LOCK_ACQUIRED' } })).rejects.toThrow('Simulated');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow('active');
    await markScoreImportLockStale(root);
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).resolves.toMatchObject({ lifecycle: 'SCORING_IN_PROGRESS', recoveryStatus: 'NONE' });
    await expectNoScoreImportTransaction(root);
  });

  it('does not clear a stale journal-free lock over unrecorded accepted evidence', async () => {
    const root = await cloneImportBase('stale-lock-unrecorded-score'); const completed = await completedTemplate(root, 'reviewer-a');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path, testHooks: { crashAfterPhase: 'LOCK_ACQUIRED' } })).rejects.toThrow('Simulated');
    await markScoreImportLockStale(root); await writeFile(join(root, 'reviewer-b', 'scores.json'), '{}', 'utf8');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow(/conflicts|inspection/);
    expect(await readFile(join(root, 'private', '.score-import.lock'), 'utf8')).toBeTruthy();
  });

  it('keeps journal and lock metadata bounded to non-content operational fields', async () => {
    const root = await cloneImportBase('bounded-journal'); const completed = await completedTemplate(root, 'reviewer-a');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path, testHooks: { crashAfterPhase: 'MANIFEST_STAGED' } })).rejects.toThrow('Simulated');
    const journalText = await readFile(join(root, 'private', 'score-import-transaction.json'), 'utf8'); const journal = JSON.parse(journalText);
    expect(Object.keys(journal).sort()).toEqual(['schemaVersion', 'runId', 'operation', 'reviewer', 'sourceLifecycle', 'targetLifecycle', 'acceptedScoreRelativePath', 'acceptedScoreExpectedSha256', 'stagedAcceptedScoreRelativePath', 'stagedManifestRelativePath', 'expectedOldManifestSha256', 'expectedNewManifestSha256', 'phase', 'createdAt'].sort());
    expect(journalText).not.toMatch(/opaqueId|note|relevance|fabricatedFact|critique|prose|credential|api.?key/i);
    const lockText = await readFile(join(root, 'private', '.score-import.lock'), 'utf8');
    expect(lockText).not.toMatch(/reviewer-a|reviewer-b|opaqueId|note|relevance|fabricatedFact|critique|prose|credential|api.?key/i);
  });

  const ambiguousRecoveryCases: readonly [string, 'JOURNAL_PREPARED' | 'SCORE_STAGED' | 'MANIFEST_STAGED', (root: string) => Promise<void>][] = [
    ['malformed journal', 'JOURNAL_PREPARED', async (root) => writeFile(join(root, 'private', 'score-import-transaction.json'), '{', 'utf8')],
    ['wrong run ID', 'JOURNAL_PREPARED', async (root) => mutateJson(join(root, 'private', 'score-import-transaction.json'), (value) => { value.runId = 'wrong-run'; })],
    ['wrong reviewer', 'JOURNAL_PREPARED', async (root) => mutateJson(join(root, 'private', 'score-import-transaction.json'), (value) => { value.reviewer = 'reviewer-b'; })],
    ['conflicting manifest', 'JOURNAL_PREPARED', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.state = 'CAPTURE_COMPLETE'; })],
    ['tampered staged score', 'SCORE_STAGED', async (root) => writeFile(join(root, 'private', '.score-import-score.staged'), 'tampered', 'utf8')],
    ['missing required staged manifest', 'MANIFEST_STAGED', async (root) => unlink(join(root, 'private', '.score-import-manifest.staged'))],
  ];
  it.each(ambiguousRecoveryCases)('fails closed for stale-lock recovery with %s', async (_name, phase, tamper) => {
    const root = await cloneImportBase('ambiguous-recovery'); const completed = await completedTemplate(root, 'reviewer-a');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path, testHooks: { crashAfterPhase: phase } })).rejects.toThrow('Simulated');
    await markScoreImportLockStale(root); await tamper(root);
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow(/inspection|ambiguous|tampered|malformed|conflicts/);
    expect(await readFile(join(root, 'private', '.score-import.lock'), 'utf8')).toBeTruthy();
  });

  it('keeps recovered completion idempotent across repeated invocations', async () => {
    const root = await cloneImportBase('recovery-idempotence'); const completed = await completedTemplate(root, 'reviewer-a');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path, testHooks: { crashAfterPhase: 'SCORE_COMMITTED' } })).rejects.toThrow('Simulated');
    await markScoreImportLockStale(root);
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow(/safely stopped|already/i);
    const accepted = await readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8'); const manifest = await readFile(join(root, 'private', 'run-manifest.json'), 'utf8');
    await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow(/already/i);
    expect(await readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8')).toBe(accepted); expect(await readFile(join(root, 'private', 'run-manifest.json'), 'utf8')).toBe(manifest);
    await expectNoScoreImportTransaction(root);
  });

  it('supports the bounded legacy V2 provenance rule without rewriting historical templates', async () => {
    const root = await cloneImportBase('legacy');
    for (const path of [join(root, 'private', 'run-manifest.json'), join(root, 'private', 'identity-map.json')]) await mutateJson(path, (value) => { delete value.templateProvenanceHashes; });
    await mutateJson(join(root, 'reviewer-a', 'score-template.json'), (value) => { delete value.templateProvenance; });
    const completed = await completedTemplate(root, 'reviewer-a');
    const result = await importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path });
    expect(result.compatibility).toBe('BACKWARD_COMPATIBLE_LEGACY_V2');
  });

  it('rejects altered generated-template aliases for both recorded and legacy provenance', async () => {
    for (const legacy of [false, true]) {
      const root = await cloneImportBase(legacy ? 'legacy-source-tamper' : 'future-source-tamper');
      if (legacy) for (const path of [join(root, 'private', 'run-manifest.json'), join(root, 'private', 'identity-map.json')]) await mutateJson(path, (value) => { delete value.templateProvenanceHashes; });
      await mutateJson(join(root, 'reviewer-a', 'score-template.json'), (value) => { if (legacy) delete value.templateProvenance; value.scores.reverse(); });
      const completed = await completedTemplate(root, 'reviewer-a');
      await expect(importReviewerScores({ runDir: root, reviewer: 'reviewer-a', templatePath: completed.path })).rejects.toThrow(/provenance|aliases or order/);
      await expect(readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8')).rejects.toThrow();
    }
  });

  it('exposes a safe role-scoped score-import CLI result', async () => {
    const root = await cloneImportBase('cli'); const completed = await completedTemplate(root, 'reviewer-a');
    const stdout = execFileSync(process.execPath, [join(repositoryRoot, 'app', 'dist-electron', 'main', 'aiCritiqueScoreImportCli.js'), '--run-dir', root, '--reviewer', 'reviewer-a', '--template', completed.path], { encoding: 'utf8' });
    const result = JSON.parse(stdout);
    expect(result).toMatchObject({ reviewer: 'reviewer-a', validationStatus: 'VALID', recoveryStatus: 'NONE', acceptedScoreFilename: 'scores.json', lifecycle: 'SCORING_IN_PROGRESS', otherReviewerPending: true });
    expect(Object.keys(result).sort()).toEqual(['acceptedScoreFilename', 'acceptedScoreSha256', 'lifecycle', 'otherReviewerPending', 'recoveryStatus', 'reviewer', 'validationStatus'].sort());
  });
  it('redacts score-import CLI failures to safe status metadata', async () => {
    const root = await cloneImportBase('cli-failure'); const completed = await completedTemplate(root, 'reviewer-a'); await writeFile(completed.path, '{', 'utf8');
    let stderr = '';
    try { execFileSync(process.execPath, [join(repositoryRoot, 'app', 'dist-electron', 'main', 'aiCritiqueScoreImportCli.js'), '--run-dir', root, '--reviewer', 'reviewer-a', '--template', completed.path], { encoding: 'utf8' }); } catch (error) { stderr = String((error as { stderr?: string }).stderr ?? ''); }
    expect(JSON.parse(stderr)).toEqual({ validationStatus: 'INVALID', recoveryStatus: 'SAFE_STOP' });
    expect(stderr).not.toContain(root); expect(stderr).not.toContain(completed.path);
  });
  it('rejects a repository artifact root and creates private external evidence only', async () => {
    await expect(QualificationArtifactRun.create({ outputRoot: repositoryRoot, repositoryRoot, repositoryHead: 'head' })).rejects.toThrow('outside the repository');
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-'));
    const run = await QualificationArtifactRun.create({ outputRoot, repositoryRoot, repositoryHead: 'head', runId: 'mock-run', allowTemporaryRoot: true });
    const sink = run.evidenceSink({
      attemptId: 'a1', fixtureId: 'fixture', fixtureHash: 'f'.repeat(64), execution: 1, prose: 'synthetic prose', critique: normalizedCritique(), provider: 'openai', model: 'gpt-5.4-2026-03-05', contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION, instructionHash: 'i'.repeat(64), schemaHash: 's'.repeat(64), parameterHash: 'p'.repeat(64), requestHash: 'r'.repeat(64), normalizedHash: normalizedCritiqueHash(normalizedCritique()), structuralValid: true, usage: { calculatedUsd: 0.01 },
    });
    const body = new TextEncoder().encode('{"mock":"provider response"}');
    await sink({ attemptId: 'a1', status: 200, body, bodySha256: sha256('{"mock":"provider response"}'), byteLength: body.byteLength, providerRequestId: null });
    const [entry] = await run.writeIdentityMap();
    expect(entry.rawResponsePath).toBe(`private/raw-responses/${qualificationAttemptStorageFilename('a1')}`);
    expect(new TextDecoder().decode(await run.readRaw(entry))).toBe('{"mock":"provider response"}');
  });

  it('derives deterministic Windows-safe storage names from private logical attempt identities', () => {
    const logicalIds = [
      'qualification:fixture:1:uuid',
      'contains*question?quote"angle<bracket>pipe|slash/backslash\\',
      'trailing.',
      'trailing ',
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'LPT1',
      '../../private/raw-responses/escape',
    ];
    for (const logicalId of logicalIds) {
      const filename = qualificationAttemptStorageFilename(logicalId);
      expect(filename).toMatch(/^attempt-[a-f0-9]{48}\.bin$/);
      expect(filename).not.toMatch(/[:*?"<>|/\\]/);
      expect(filename).not.toMatch(/[. ]$/);
      expect(filename).not.toMatch(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i);
      expect(qualificationAttemptStorageFilename(logicalId)).toBe(filename);
    }
    expect(qualificationAttemptStorageFilename(logicalIds[0]))
      .not.toBe(qualificationAttemptStorageFilename(logicalIds[1]));
  });

  it('rejects a forced raw-storage collision rather than overwriting evidence', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-collision-'));
    const run = await QualificationArtifactRun.create({
      outputRoot,
      repositoryRoot,
      repositoryHead: 'head',
      runId: 'collision-run',
      allowTemporaryRoot: true,
    });
    const attemptId = 'qualification:collision:1:logical';
    const storageFilename = qualificationAttemptStorageFilename(attemptId);
    (run as unknown as { rawStorageNames: Map<string, string> }).rawStorageNames.set(
      storageFilename,
      'different-logical-attempt',
    );
    const fixture = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[0];
    const sink = run.evidenceSink({
      attemptId,
      fixtureId: fixture.id,
      fixtureHash: fixture.contentHash,
      execution: 1,
      prose: fixture.prose,
      critique: normalizedCritique(),
      provider: 'openai',
      model: 'gpt-5.4-2026-03-05',
      contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
      instructionHash: 'i'.repeat(64),
      schemaHash: 's'.repeat(64),
      parameterHash: 'p'.repeat(64),
      requestHash: 'r'.repeat(64),
      normalizedHash: 'n'.repeat(64),
      structuralValid: true,
      usage: { calculatedUsd: mockedCalculatedUsd },
    });
    const body = new TextEncoder().encode(mockedProviderResponse(0));
    await expect(sink({
      attemptId,
      status: 200,
      body,
      bodySha256: sha256(mockedProviderResponse(0)),
      byteLength: body.byteLength,
      providerRequestId: null,
    })).rejects.toThrow('collision');
    await expect(readdir(join(run.privateRoot, 'raw-responses'))).resolves.toEqual([]);
  });

  it('finalizes a mocked Windows capture into blinded packets and editable score templates', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-windows-success-'));
    const run = await QualificationArtifactRun.create({
      outputRoot,
      repositoryRoot,
      repositoryHead: 'head',
      runId: 'windows-success-run',
      allowTemporaryRoot: true,
    });
    for (let index = 0; index < 24; index += 1) await captureMockAttempt(run, index);
    await run.completeCapture();
    await run.finalizePackets('windows-seed-a', 'windows-seed-b');

    const manifest = JSON.parse(await readFile(join(run.privateRoot, 'run-manifest.json'), 'utf8'));
    const identity = JSON.parse(await readFile(join(run.privateRoot, 'identity-map.json'), 'utf8'));
    expect(manifest).toMatchObject({
      state: 'PACKETS_FINALIZED',
      expectedAttemptCount: 24,
      attemptCount: 24,
      captureFailure: null,
      scoreHashes: {},
      adjudicationHash: null,
      receiptHash: null,
    });
    expect(identity.entries).toHaveLength(24);
    expect(identity.entries.every((entry: { attemptId: string }) => entry.attemptId.includes(':'))).toBe(true);
    expect(identity.entries.every((entry: { attemptId: string; rawResponsePath: string }) =>
      entry.rawResponsePath === `private/raw-responses/${qualificationAttemptStorageFilename(entry.attemptId)}`)).toBe(true);
    const rawFiles = await readdir(join(run.privateRoot, 'raw-responses'));
    expect(rawFiles).toHaveLength(24);
    expect(rawFiles.every((filename) => /^attempt-[a-f0-9]{48}\.bin$/.test(filename))).toBe(true);

    const packetA = JSON.parse(await readFile(join(run.root, 'reviewer-a', 'packet.json'), 'utf8'));
    const packetB = JSON.parse(await readFile(join(run.root, 'reviewer-b', 'packet.json'), 'utf8'));
    expect(packetA.responses).toHaveLength(24);
    expect(packetB.responses).toHaveLength(24);
    expect(packetA.responses.map((response: { id: string }) => response.id))
      .not.toEqual(packetB.responses.map((response: { id: string }) => response.id));
    for (const packetText of [canonicalJson(packetA), canonicalJson(packetB)]) {
      expect(packetText).not.toMatch(/provider|gpt-5\.4|fixtureId|execution|rawResponsePath|calculatedUsd/);
    }
    for (const reviewer of ['reviewer-a', 'reviewer-b'] as const) {
      const packet = reviewer === 'reviewer-a' ? packetA : packetB;
      const template = JSON.parse(await readFile(join(run.root, reviewer, 'score-template.json'), 'utf8'));
      expect(template).toMatchObject({
        schemaVersion: 'v1',
        runId: 'windows-success-run',
        reviewer,
        independentAttestation: false,
      });
      expect(template.scores).toHaveLength(24);
      expect(template.scores.every((score: Record<string, unknown>) =>
        score.relevance === null &&
        score.fabricatedFact === null &&
        typeof score.opaqueId === 'string')).toBe(true);
      const completedScores = {
        ...template,
        independentAttestation: true as const,
        scores: template.scores.map((score: { opaqueId: string }) => ({
          opaqueId: score.opaqueId,
          relevance: 5,
          evidenceSpecificity: 5,
          correctness: 5,
          actionability: 5,
          styleRespect: 5,
          uncertaintyRefusal: 5,
          fabricatedFact: false,
          harmfulRecommendation: false,
          inappropriateNormalization: false,
          missedMaterialDefect: false,
          unjustifiedRefusal: false,
          note: '',
        })),
      };
      expect(() => validateReviewerScores(completedScores, {
        packet,
        packetHash: canonicalHash(packet),
      })).not.toThrow();
      await expect(readFile(join(run.root, reviewer, 'scores.json'), 'utf8')).rejects.toThrow();
    }
    await expect(readFile(join(run.root, 'receipt', 'qualification-receipt.json'), 'utf8')).rejects.toThrow();
    await expect(QualificationArtifactRun.create({
      outputRoot,
      repositoryRoot,
      repositoryHead: 'head',
      runId: 'windows-success-run',
      allowTemporaryRoot: true,
    })).rejects.toThrow('cannot be overwritten');
  });

  it('preserves partial evidence, records the failed attempt, and starts a later invocation under a distinct UUID', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-windows-partial-'));
    const failedRun = await QualificationArtifactRun.create({
      outputRoot,
      repositoryRoot,
      repositoryHead: 'head',
      allowTemporaryRoot: true,
    });
    await captureMockAttempt(failedRun, 0);
    await captureMockAttempt(failedRun, 1);
    const failedAttempt = 'qualification:internal-pov-drift:1:failed-attempt';
    await failedRun.recordCaptureFailure({
      attemptId: failedAttempt,
      fixtureId: 'internal-pov-drift',
      execution: 1,
    });

    const manifest = JSON.parse(await readFile(join(failedRun.privateRoot, 'run-manifest.json'), 'utf8'));
    const partialIdentity = JSON.parse(await readFile(join(failedRun.privateRoot, 'identity-map.partial.json'), 'utf8'));
    expect(manifest).toMatchObject({
      state: 'CAPTURE_FAILED',
      attemptCount: 2,
      captureFailure: {
        code: 'CAPTURE_ATTEMPT_FAILED',
        attemptId: failedAttempt,
        fixtureId: 'internal-pov-drift',
        execution: 1,
      },
    });
    expect(partialIdentity.entries).toHaveLength(2);
    await expect(failedRun.completeCapture()).rejects.toThrow('active capture');
    await expect(readFile(join(failedRun.root, 'reviewer-a', 'packet.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(failedRun.root, 'reviewer-a', 'score-template.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(failedRun.root, 'receipt', 'qualification-receipt.json'), 'utf8')).rejects.toThrow();

    const laterRun = await QualificationArtifactRun.create({
      outputRoot,
      repositoryRoot,
      repositoryHead: 'head',
      allowTemporaryRoot: true,
    });
    expect(laterRun.runId).not.toBe(failedRun.runId);
    expect(laterRun.root).not.toBe(failedRun.root);
  });

  it('does not advance lifecycle when immutable packet finalization cannot complete', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-packet-failure-'));
    const run = await QualificationArtifactRun.create({
      outputRoot,
      repositoryRoot,
      repositoryHead: 'head',
      runId: 'packet-failure-run',
      allowTemporaryRoot: true,
    });
    for (let index = 0; index < 24; index += 1) await captureMockAttempt(run, index);
    await run.completeCapture();
    await writeFile(join(run.root, 'reviewer-b', 'packet.json'), '{"occupied":true}', 'utf8');
    await expect(run.finalizePackets('packet-failure-a', 'packet-failure-b'))
      .rejects.toThrow('immutable');
    const manifest = JSON.parse(await readFile(join(run.privateRoot, 'run-manifest.json'), 'utf8'));
    expect(manifest.state).toBe('CAPTURE_COMPLETE');
    await expect(readFile(join(run.root, 'reviewer-a', 'score-template.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(run.root, 'reviewer-b', 'score-template.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(run.root, 'receipt', 'qualification-receipt.json'), 'utf8')).rejects.toThrow();
  });

  it('uses independent opaque reviewer IDs and rejects packet or score integrity failures', () => {
    const entry = { attemptId: 'a1', fixtureId: 'fixture', fixtureHash: 'f'.repeat(64), execution: 1 as const, prose: 'synthetic prose', critique: normalizedCritique(), provider: 'openai', model: 'gpt-5.4-2026-03-05', contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION, instructionHash: 'i'.repeat(64), schemaHash: 's'.repeat(64), parameterHash: 'p'.repeat(64), requestHash: 'r'.repeat(64), normalizedHash: normalizedCritiqueHash(normalizedCritique()), structuralValid: true, usage: { calculatedUsd: 0.01 }, responseHash: 'h'.repeat(64), byteLength: 10, httpStatus: 200, rawResponsePath: 'private/raw-responses/a1.bin', capturedAt: '2026-07-15T00:00:00.000Z' };
    const a = makeReviewerPacket('run', 'reviewer-a', [entry], 'seed-a'); const b = makeReviewerPacket('run', 'reviewer-b', [entry], 'seed-b');
    expect(a.packet.responses[0].id).not.toBe(b.packet.responses[0].id);
    const valid = { schemaVersion: 'v1', runId: 'run', reviewer: 'reviewer-a' as const, independentAttestation: true as const, packetHash: a.packetHash, scores: [{ opaqueId: a.packet.responses[0].id, relevance: 5, evidenceSpecificity: 5, correctness: 5, actionability: 5, styleRespect: 5, uncertaintyRefusal: 5, fabricatedFact: false, harmfulRecommendation: false, inappropriateNormalization: false, missedMaterialDefect: false, unjustifiedRefusal: false }] };
    expect(() => validateReviewerScores(valid, a)).not.toThrow();
    expect(() => validateReviewerScores({ ...valid, packetHash: 'tampered' }, a)).toThrow('attest');
  });

  it('finalizes a complete mocked 24-response pass receipt with required adjudication', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-pass-'));
    const run = await QualificationArtifactRun.create({ outputRoot, repositoryRoot, repositoryHead: 'head', runId: 'pass-run', allowTemporaryRoot: true });
    for (let index = 0; index < 24; index += 1) {
      const fixture = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)]; const [fixtureId, fixtureHash] = QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)];
      const attemptId = `attempt-${index}`; const critique = normalizedCritique(); const sink = run.evidenceSink({ attemptId, fixtureId, fixtureHash, execution: index % 2 === 0 ? 1 : 2, prose: fixture.prose, critique, provider: 'openai', model: 'gpt-5.4-2026-03-05', contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION, instructionHash: 'i'.repeat(64), schemaHash: 's'.repeat(64), parameterHash: 'p'.repeat(64), requestHash: sha256(`request-${index}`), normalizedHash: normalizedCritiqueHash(critique), structuralValid: true, usage: { calculatedUsd: mockedCalculatedUsd } });
      const responseText = mockedProviderResponse(index); const body = new TextEncoder().encode(responseText); await sink({ attemptId, status: 200, body, bodySha256: sha256(responseText), byteLength: body.byteLength, providerRequestId: null });
    }
    await run.completeCapture(); await run.finalizePackets('seed-a', 'seed-b');
    const packets = await Promise.all(['reviewer-a', 'reviewer-b'].map(async (reviewer) => JSON.parse(await (await import('node:fs/promises')).readFile(join(run.root, reviewer, 'packet.json'), 'utf8'))));
    const makeScores = (packet: typeof packets[number], reviewer: 'reviewer-a' | 'reviewer-b') => ({ schemaVersion: 'v1', runId: 'pass-run', reviewer, independentAttestation: true as const, packetHash: sha256(JSON.stringify(packet)), templateProvenance: provenanceForPacket('pass-run', packet), scores: packet.responses.map((response: { id: string }, index: number) => ({ opaqueId: response.id, relevance: reviewer === 'reviewer-a' && index === 0 ? 3 : 5, evidenceSpecificity: 5, correctness: 5, actionability: 5, styleRespect: 5, uncertaintyRefusal: 5, fabricatedFact: false, harmfulRecommendation: false, inappropriateNormalization: false, missedMaterialDefect: false, unjustifiedRefusal: false })) });
    const a = makeScores(packets[0], 'reviewer-a'); const b = makeScores(packets[1], 'reviewer-b');
    // Packet hashes are canonical rather than incidental JSON formatting.
    a.packetHash = canonicalHash(packets[0]); b.packetHash = canonicalHash(packets[1]);
    await run.submitScores(a); await run.submitScores(b);
    const maps = JSON.parse(await (await import('node:fs/promises')).readFile(join(run.privateRoot, 'reviewer-maps.json'), 'utf8')); const needs = requiredAdjudications(a, b, maps.a, maps.b); const adjudications = needs.map((need) => ({ ...need, finalValue: 4, rationale: 'Mocked independent review reconciliation.', at: '2026-07-15T00:00:00.000Z' }));
    await run.submitAdjudications(adjudications, a, b); const receipt = await run.finalizeReceipt(a, b, adjudications);
    expect(receipt.disposition).toBe('PASS'); expect(receipt.sha256).toHaveLength(64);
    await expect(verifyQualificationRun(run.root)).resolves.toMatchObject({ valid: true, integrityStatus: 'VALID', qualificationDisposition: 'PASS', lifecycle: 'FINALIZED_PASS', disposition: 'PASS', evidenceCount: 24 });
  });

  it('finalizes a complete mocked 24-response FAIL receipt without evidence corruption', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-qualification-fail-'));
    const run = await QualificationArtifactRun.create({ outputRoot, repositoryRoot, repositoryHead: 'head', runId: 'fail-run', allowTemporaryRoot: true });
    for (let index = 0; index < 24; index += 1) {
      const fixture = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)]; const [fixtureId, fixtureHash] = QUALIFICATION_FIXTURES_V1[Math.floor(index / 2)];
      const attemptId = `fail-attempt-${index}`;
      const critique = normalizedCritique(); const sink = run.evidenceSink({ attemptId, fixtureId, fixtureHash, execution: index % 2 === 0 ? 1 : 2, prose: fixture.prose, critique, provider: 'openai', model: 'gpt-5.4-2026-03-05', contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION, instructionHash: 'i'.repeat(64), schemaHash: 's'.repeat(64), parameterHash: 'p'.repeat(64), requestHash: sha256(`fail-request-${index}`), normalizedHash: normalizedCritiqueHash(critique), structuralValid: true, usage: { calculatedUsd: mockedCalculatedUsd } });
      const responseText = mockedProviderResponse(index); const body = new TextEncoder().encode(responseText);
      await sink({ attemptId, status: 200, body, bodySha256: sha256(responseText), byteLength: body.byteLength, providerRequestId: null });
    }
    await run.completeCapture(); await run.finalizePackets('fail-seed-a', 'fail-seed-b');
    const packets = await Promise.all(['reviewer-a', 'reviewer-b'].map(async (reviewer) => JSON.parse(await (await import('node:fs/promises')).readFile(join(run.root, reviewer, 'packet.json'), 'utf8'))));
    const scores = (packet: typeof packets[number], reviewer: 'reviewer-a' | 'reviewer-b') => ({ schemaVersion: 'v1', runId: 'fail-run', reviewer, independentAttestation: true as const, packetHash: canonicalHash(packet), templateProvenance: provenanceForPacket('fail-run', packet), scores: packet.responses.map((response: { id: string }) => ({ opaqueId: response.id, relevance: 3, evidenceSpecificity: 5, correctness: 5, actionability: 5, styleRespect: 5, uncertaintyRefusal: 5, fabricatedFact: false, harmfulRecommendation: false, inappropriateNormalization: false, missedMaterialDefect: false, unjustifiedRefusal: false })) });
    const a = scores(packets[0], 'reviewer-a'); const b = scores(packets[1], 'reviewer-b');
    await run.submitScores(a); await run.submitScores(b);
    const receipt = await run.finalizeReceipt(a, b, []);
    expect(receipt.disposition).toBe('FAIL');
    const first = await verifyQualificationRun(run.root); const second = await verifyQualificationRun(run.root);
    expect(first).toMatchObject({ valid: true, integrityStatus: 'VALID', qualificationDisposition: 'FAIL', lifecycle: 'FINALIZED_FAIL', disposition: 'FAIL', evidenceCount: 24 });
    expect(second).toEqual(first);
    const receiptJson = JSON.parse(await (await import('node:fs/promises')).readFile(join(run.root, 'receipt', 'qualification-receipt.json'), 'utf8'));
    expect(receiptJson.failureReasons).toEqual(['DIMENSION_MEAN']);
  });

  const manifestCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing manifest', 'MANIFEST_MISSING', async (root) => unlink(join(root, 'private', 'run-manifest.json'))],
    ['unsupported manifest schema', 'MANIFEST_SCHEMA_UNSUPPORTED', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.schemaVersion = 'unsupported'; })],
    ['run-directory identity mismatch', 'MANIFEST_RUN_ID_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.runId = 'other-run'; })],
    ['nonterminal lifecycle', 'MANIFEST_LIFECYCLE_NONTERMINAL', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.state = 'SCORES_COMPLETE'; })],
    ['PASS lifecycle mismatch', 'RECEIPT_LIFECYCLE_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.state = 'FINALIZED_FAIL'; })],
    ['repository HEAD mismatch', 'MANIFEST_RECEIPT_BINDING_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.repositoryHead = 'wrong-head'; })],
    ['provider mismatch', 'MANIFEST_PROVIDER_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.provider = 'wrong'; })],
    ['model mismatch', 'MANIFEST_MODEL_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.model = 'wrong'; })],
    ['contract-version mismatch', 'MANIFEST_CONTRACTVERSION_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.contractVersion = 'black_skies_critique_v1'; })],
    ['instruction hash mismatch', 'MANIFEST_INSTRUCTIONHASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.instructionHash = '0'.repeat(64); })],
    ['schema hash mismatch', 'MANIFEST_SCHEMAHASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.schemaHash = '0'.repeat(64); })],
    ['parameter hash mismatch', 'MANIFEST_PARAMETERHASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.parameterHash = '0'.repeat(64); })],
    ['expected attempt count mismatch', 'MANIFEST_ATTEMPT_COUNT_INVALID', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.expectedAttemptCount = 23; })],
  ];
  it.each(manifestCases)('rejects manifest tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('manifest'); await tamper(root); const result = await verifyQualificationRun(root); expect(result.integrityStatus).toBe('INVALID'); expect(result.qualificationDisposition).toBe('UNVERIFIED'); expect(result.errors.map((error) => error.code)).toContain(code); });

  const rawCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing raw file', 'RAW_FILE_MISSING', async (root) => { const map = JSON.parse(await readFile(join(root, 'private', 'identity-map.json'), 'utf8')); await unlink(join(root, map.entries[0].rawResponsePath)); }],
    ['changed raw bytes', 'RAW_BYTE_LENGTH_MISMATCH', async (root) => { const map = JSON.parse(await readFile(join(root, 'private', 'identity-map.json'), 'utf8')); await writeFile(join(root, map.entries[0].rawResponsePath), 'changed'); }],
    ['wrong byte length', 'RAW_BYTE_LENGTH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].byteLength += 1; })],
    ['wrong SHA-256', 'RAW_SHA256_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].responseHash = '0'.repeat(64); })],
    ['duplicate attempt', 'IDENTITY_ATTEMPT_DUPLICATE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[1].attemptId = value.entries[0].attemptId; })],
    ['missing attempt', 'IDENTITY_ENTRY_COUNT_INVALID', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries.pop(); })],
    ['extra attempt', 'IDENTITY_ENTRY_COUNT_INVALID', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries.push({ ...value.entries[0], attemptId: 'extra-attempt' }); })],
    ['wrong fixture hash', 'RAW_FIXTURE_BINDING_INVALID', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].fixtureHash = '0'.repeat(64); })],
    ['altered frozen fixture prose', 'RAW_FIXTURE_CONTENT_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].prose = 'altered'; })],
    ['wrong request hash', 'RAW_RECORD_MALFORMED', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].requestHash = 'wrong'; })],
    ['wrong HTTP status', 'RAW_HTTP_STATUS_INVALID', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].httpStatus = 500; })],
    ['wrong normalized hash', 'RAW_NORMALIZED_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].normalizedHash = '0'.repeat(64); })],
    ['path traversal', 'RAW_PATH_ESCAPE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].rawResponsePath = '../escape.bin'; })],
    ['absolute path', 'RAW_PATH_ESCAPE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].rawResponsePath = 'C:\\escape.bin'; })],
    ['logical ID/storage filename mismatch', 'RAW_STORAGE_BINDING_INVALID', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].rawResponsePath = value.entries[1].rawResponsePath; })],
    ['response substituted from another run', 'RECEIPT_EVIDENCE_BINDING_MISMATCH', async (root) => { const path = join(root, 'private', 'identity-map.json'); const map = JSON.parse(await readFile(path, 'utf8')); const raw = join(root, map.entries[0].rawResponsePath); await writeFile(raw, 'substituted'); map.entries[0].byteLength = 11; map.entries[0].responseHash = sha256('substituted'); await writeFile(path, canonicalJson(map)); }],
  ];
  it.each(rawCases)('rejects raw-evidence tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('raw'); await tamper(root); const result = await verifyQualificationRun(root); expect(result.errors.map((error) => error.code)).toContain(code); expect(result.errors.every((error) => !error.message.includes(root))).toBe(true); });

  const identityCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing identity map', 'IDENTITY_MAP_MISSING', async (root) => unlink(join(root, 'private', 'identity-map.json'))],
    ['unsupported identity schema', 'IDENTITY_MAP_SCHEMA_UNSUPPORTED', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.schemaVersion = 'unsupported'; })],
    ['missing identity entry', 'IDENTITY_ENTRY_COUNT_INVALID', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries.pop(); })],
    ['duplicate identity attempt', 'IDENTITY_ATTEMPT_DUPLICATE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[1].attemptId = value.entries[0].attemptId; })],
    ['duplicate Reviewer A opaque ID mapping', 'IDENTITY_REVIEWER_A_INCOMPLETE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { const keys = Object.keys(value.reviewerMaps.a); value.reviewerMaps.a[keys[1]] = value.reviewerMaps.a[keys[0]]; })],
    ['incomplete Reviewer A mapping', 'IDENTITY_REVIEWER_A_INCOMPLETE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { delete value.reviewerMaps.a[Object.keys(value.reviewerMaps.a)[0]]; })],
    ['incomplete Reviewer B mapping', 'IDENTITY_REVIEWER_B_INCOMPLETE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { delete value.reviewerMaps.b[Object.keys(value.reviewerMaps.b)[0]]; })],
    ['cross-reviewer opaque-ID collision', 'IDENTITY_OPAQUE_ID_COLLISION', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { const a = Object.keys(value.reviewerMaps.a)[0]; value.reviewerMaps.b[a] = value.reviewerMaps.b[Object.keys(value.reviewerMaps.b)[0]]; delete value.reviewerMaps.b[Object.keys(value.reviewerMaps.b)[0]]; })],
    ['wrong raw-response hash', 'RAW_SHA256_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].responseHash = '0'.repeat(64); })],
    ['wrong normalized-result hash', 'RAW_NORMALIZED_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].normalizedHash = '0'.repeat(64); })],
    ['wrong finalized packet hash', 'PACKET_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.packetHashes['reviewer-a'] = '0'.repeat(64); })],
    ['identity path escape', 'RAW_PATH_ESCAPE', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].rawResponsePath = '../../escape'; })],
    ['credential-like field', 'IDENTITY_SENSITIVE_FIELD', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.apiKey = 'redacted'; })],
    ['authorization field', 'IDENTITY_SENSITIVE_FIELD', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.authorization = 'redacted'; })],
    ['unknown sensitive field', 'IDENTITY_SENSITIVE_FIELD', async (root) => mutateJson(join(root, 'private', 'identity-map.json'), (value) => { value.entries[0].secretToken = 'redacted'; })],
  ];
  it.each(identityCases)('rejects identity-map tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('identity'); await tamper(root); const result = await verifyQualificationRun(root); expect(result.errors.map((error) => error.code)).toContain(code); });

  it('verifies complete packet, score, and explicit no-adjudication evidence', async () => {
    await expect(verifyQualificationRun(baseRunRoot)).resolves.toMatchObject({ valid: true, integrityStatus: 'VALID', qualificationDisposition: 'PASS' });
    const receipt = JSON.parse(await readFile(join(baseRunRoot, 'receipt', 'qualification-receipt.json'), 'utf8'));
    expect(receipt.aggregate).toMatchObject({ responseCount: 24, structuralValidCount: 24, overallMean: 5, acceptableOutputCount: 24, unresolvedAdjudicationCount: 0 });
    expect(receipt.aggregate.dimensionMeans).toEqual({ actionability: 5, correctness: 5, evidenceSpecificity: 5, relevance: 5, styleRespect: 5, uncertaintyRefusal: 5 });
    expect(receipt.costSummary).toMatchObject({ maximumAttempts: 24, attemptCount: 24, inputTokens: 2400, cachedInputTokens: 480, outputTokens: 960, calculatedUsd: 0.01932, authorizationCeilingUsd: 2.4, ceilingCompliant: true });
  });

  const packetCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing Reviewer A packet', 'PACKET_MISSING', async (root) => unlink(join(root, 'reviewer-a', 'packet.json'))],
    ['missing Reviewer B packet', 'PACKET_MISSING', async (root) => unlink(join(root, 'reviewer-b', 'packet.json'))],
    ['unsupported packet schema', 'PACKET_SCHEMA_UNSUPPORTED', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.schemaVersion = 'unsupported'; })],
    ['wrong packet hash', 'PACKET_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.packetHashes['reviewer-a'] = '0'.repeat(64); })],
    ['missing packet entry', 'PACKET_ENTRY_COUNT_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses.pop(); })],
    ['duplicate packet entry', 'PACKET_OPAQUE_ID_DUPLICATE', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses.push({ ...value.responses[0] }); })],
    ['extra packet entry', 'PACKET_ENTRY_COUNT_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses.push({ id: `r-${'0'.repeat(20)}`, prose: 'extra', critique: {} }); })],
    ['duplicate opaque ID', 'PACKET_OPAQUE_ID_DUPLICATE', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses[1].id = value.responses[0].id; })],
    ['unknown opaque ID', 'PACKET_OPAQUE_ID_UNKNOWN', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses[0].id = `r-${'0'.repeat(20)}`; })],
    ['opaque-ID substitution', 'PACKET_OPAQUE_ID_SUBSTITUTION', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { [value.responses[0].id, value.responses[1].id] = [value.responses[1].id, value.responses[0].id]; })],
    ['Reviewer A packet copied as Reviewer B', 'PACKET_REVIEWER_COPY', async (root) => writeFile(join(root, 'reviewer-b', 'packet.json'), await readFile(join(root, 'reviewer-a', 'packet.json'), 'utf8'), 'utf8')],
    ['identical packet ordering', 'PACKET_ORDER_NOT_INDEPENDENT', alignPacketOrdering],
    ['altered fixture prose', 'PACKET_FIXTURE_CONTENT_MISMATCH', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses[0].prose = 'altered'; })],
    ['altered critique content', 'PACKET_CRITIQUE_CONTENT_MISMATCH', async (root) => mutateJson(join(root, 'reviewer-a', 'packet.json'), (value) => { value.responses[0].critique = { overview: 'altered' }; })],
    ['mismatched private mapping', 'PACKET_PRIVATE_MAP_MISMATCH', swapPrivateMapping],
    ['provider leakage', 'PACKET_PROVIDER_LEAKAGE', async (root) => addPacketMetadata(root, 'provider', 'hidden')],
    ['model leakage', 'PACKET_MODEL_LEAKAGE', async (root) => addPacketMetadata(root, 'model', 'hidden')],
    ['fixture-ID leakage', 'PACKET_FIXTURE_ID_LEAKAGE', async (root) => addPacketMetadata(root, 'fixtureId', 'hidden')],
    ['execution-number leakage', 'PACKET_EXECUTION_LEAKAGE', async (root) => addPacketMetadata(root, 'execution', 1)],
    ['request-order leakage', 'PACKET_REQUEST_ORDER_LEAKAGE', async (root) => addPacketMetadata(root, 'originalRequestOrder', 1)],
    ['cost leakage', 'PACKET_COST_LEAKAGE', async (root) => addPacketMetadata(root, 'calculatedUsd', 0.01)],
    ['private-path leakage', 'PACKET_PRIVATE_PATH_LEAKAGE', async (root) => addPacketMetadata(root, 'privatePath', 'hidden')],
    ['raw HTTP-envelope leakage', 'PACKET_RAW_HTTP_LEAKAGE', async (root) => addPacketMetadata(root, 'rawHttpEnvelope', {})],
    ['header leakage', 'PACKET_HEADER_LEAKAGE', async (root) => addPacketMetadata(root, 'headers', {})],
    ['authorization-data leakage', 'PACKET_AUTHORIZATION_LEAKAGE', async (root) => addPacketMetadata(root, 'authorization', 'hidden')],
    ['private metadata leakage', 'PACKET_PRIVATE_METADATA_LEAKAGE', async (root) => addPacketMetadata(root, 'capturedAt', 'hidden')],
  ];
  it.each(packetCases)('rejects packet tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('packet'); await tamper(root); await expectTamper(root, code); });

  const scoreCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing score file', 'SCORE_FILE_MISSING', async (root) => unlink(join(root, 'reviewer-a', 'scores.json'))],
    ['unsupported score schema', 'SCORE_SCHEMA_UNSUPPORTED', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.schemaVersion = 'unsupported'; })],
    ['wrong reviewer label', 'SCORE_REVIEWER_MISMATCH', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.reviewer = 'reviewer-b'; })],
    ['identical reviewer labels', 'SCORE_REVIEWER_LABELS_NOT_DISTINCT', async (root) => mutateJson(join(root, 'reviewer-b', 'scores.json'), (value) => { value.reviewer = 'reviewer-a'; })],
    ['wrong packet hash', 'SCORE_PACKET_HASH_MISMATCH', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.packetHash = '0'.repeat(64); })],
    ['wrong score-file hash', 'SCORE_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.scoreHashes['reviewer-a'] = '0'.repeat(64); })],
    ['missing response score', 'SCORE_ENTRY_COUNT_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores.pop(); })],
    ['duplicate response score', 'SCORE_OPAQUE_ID_DUPLICATE', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores[1] = { ...value.scores[0] }; })],
    ['extra unknown opaque ID', 'SCORE_OPAQUE_ID_UNKNOWN', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores.push({ ...value.scores[0], opaqueId: `r-${'0'.repeat(20)}` }); })],
    ['score below 1', 'SCORE_DIMENSION_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores[0].relevance = 0; })],
    ['score above 5', 'SCORE_DIMENSION_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores[0].relevance = 6; })],
    ['non-integer score', 'SCORE_DIMENSION_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores[0].relevance = 4.5; })],
    ['missing dimension', 'SCORE_DIMENSION_MISSING', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { delete value.scores[0].relevance; })],
    ['missing required boolean', 'SCORE_FLAG_MISSING', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { delete value.scores[0].fabricatedFact; })],
    ['invalid boolean', 'SCORE_FLAG_INVALID', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores[0].fabricatedFact = 'false'; })],
    ['missing attestation', 'SCORE_ATTESTATION_MISSING', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { delete value.independentAttestation; })],
    ['reused reviewer score content', 'SCORE_CONTENT_REUSED', async (root) => writeFile(join(root, 'reviewer-b', 'scores.json'), await readFile(join(root, 'reviewer-a', 'scores.json'), 'utf8'), 'utf8')],
    ['altered accepted score file', 'SCORE_HASH_MISMATCH', async (root) => mutateJson(join(root, 'reviewer-a', 'scores.json'), (value) => { value.scores[0].note = 'changed after acceptance'; })],
    ['score mapped to the wrong packet', 'SCORE_PACKET_HASH_MISMATCH', async (root) => { const packetA = JSON.parse(await readFile(join(root, 'reviewer-a', 'packet.json'), 'utf8')); await mutateJson(join(root, 'reviewer-b', 'scores.json'), (value) => { value.packetHash = canonicalHash(packetA); }); }],
  ];
  it.each(scoreCases)('rejects score tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('score'); await tamper(root); await expectTamper(root, code); });

  it('verifies the independently recomputed required adjudication set', async () => {
    await expect(verifyQualificationRun(adjudicatedBaseRunRoot)).resolves.toMatchObject({ valid: true, integrityStatus: 'VALID', qualificationDisposition: 'PASS' });
    const adjudication = JSON.parse(await readFile(join(adjudicatedBaseRunRoot, 'adjudication', 'adjudication.json'), 'utf8')).values[0];
    const receipt = JSON.parse(await readFile(join(adjudicatedBaseRunRoot, 'receipt', 'qualification-receipt.json'), 'utf8'));
    expect(receipt.aggregate.perOutput.find((output: { outputId: string }) => output.outputId === adjudication.opaqueId).dimensions[adjudication.dimension]).toBe(5);
    expect(receipt.aggregate.unresolvedAdjudicationCount).toBe(0);
  });

  it('verifies a documented adjudication disposition when no final numeric value is supplied', async () => {
    await expect(verifyQualificationRun(dispositionBaseRunRoot)).resolves.toMatchObject({ valid: true, integrityStatus: 'VALID', qualificationDisposition: 'PASS' });
  });

  const adjudicationCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing required adjudication file', 'ADJUDICATION_REQUIRED_MISSING', async (root) => unlink(join(root, 'adjudication', 'adjudication.json'))],
    ['unsupported adjudication schema', 'ADJUDICATION_SCHEMA_UNSUPPORTED', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.schemaVersion = 'unsupported'; })],
    ['missing required dispute', 'ADJUDICATION_DISPUTE_MISSING', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values.pop(); })],
    ['unknown dispute', 'ADJUDICATION_UNKNOWN', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].id = 'unknown'; })],
    ['duplicate dispute', 'ADJUDICATION_DUPLICATE', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values.push({ ...value.values[0] }); })],
    ['unnecessary dispute', 'ADJUDICATION_UNNECESSARY_DISPUTE', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values.push({ ...value.values[0], id: `adj-${'0'.repeat(20)}`, opaqueId: `q-${'0'.repeat(20)}` }); })],
    ['invalid neutral adjudication ID', 'ADJUDICATION_NEUTRAL_ID_INVALID', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].opaqueId = 'private-attempt-id'; })],
    ['incorrect original Reviewer A value', 'ADJUDICATION_REVIEWER_A_VALUE_MISMATCH', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].reviewerA = 1; })],
    ['incorrect original Reviewer B value', 'ADJUDICATION_REVIEWER_B_VALUE_MISMATCH', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].reviewerB = 1; })],
    ['invalid adjudicated value', 'ADJUDICATION_FINAL_VALUE_INVALID', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].finalValue = 6; })],
    ['missing disposition', 'ADJUDICATION_DISPOSITION_MISSING', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { delete value.values[0].finalValue; })],
    ['missing rationale', 'ADJUDICATION_RATIONALE_MISSING', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].rationale = ''; })],
    ['wrong adjudication hash', 'ADJUDICATION_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.adjudicationHash = '0'.repeat(64); })],
    ['altered accepted adjudication', 'ADJUDICATION_HASH_MISMATCH', async (root) => mutateJson(join(root, 'adjudication', 'adjudication.json'), (value) => { value.values[0].rationale = 'Altered after acceptance.'; })],
    ['wrong receipt adjudication hash', 'ADJUDICATION_RECEIPT_HASH_MISMATCH', async (root) => mutateJson(join(root, 'receipt', 'qualification-receipt.json'), (value) => { value.adjudicationHash = '0'.repeat(64); })],
  ];
  it.each(adjudicationCases)('rejects adjudication tamper: %s', async (_name, code, tamper) => { const root = await cloneAdjudicatedBase('adjudication'); await tamper(root); await expectTamper(root, code); });

  const noAdjudicationCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['false no-adjudication marker', 'ADJUDICATION_NONE_MARKER_INVALID', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (value) => { value.adjudicationHash = '0'.repeat(64); })],
    ['adjudication supplied when none is required', 'ADJUDICATION_UNNECESSARY', async (root) => writeFile(join(root, 'adjudication', 'adjudication.json'), await readFile(join(adjudicatedBaseRunRoot, 'adjudication', 'adjudication.json'), 'utf8'), 'utf8')],
  ];
  it.each(noAdjudicationCases)('rejects no-adjudication tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('no-adjudication'); await tamper(root); await expectTamper(root, code); });

  const thresholdCases: readonly [string, string, 'pass' | 'fail', (receipt: Record<string, any>) => void][] = [
    ['structural-validity count', 'THRESHOLD_STRUCTURAL_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.structuralValidCount = 23; }],
    ['overall mean', 'THRESHOLD_OVERALL_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.overallMean = 4.9; }],
    ['relevance mean', 'THRESHOLD_RELEVANCE_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.dimensionMeans.relevance = 4.9; }],
    ['evidence-specificity mean', 'THRESHOLD_EVIDENCE_SPECIFICITY_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.dimensionMeans.evidenceSpecificity = 4.9; }],
    ['correctness mean', 'THRESHOLD_CORRECTNESS_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.dimensionMeans.correctness = 4.9; }],
    ['actionability mean', 'THRESHOLD_ACTIONABILITY_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.dimensionMeans.actionability = 4.9; }],
    ['intentional-style-respect mean', 'THRESHOLD_INTENTIONAL_STYLE_RESPECT_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.dimensionMeans.styleRespect = 4.9; }],
    ['uncertainty/refusal-quality mean', 'THRESHOLD_UNCERTAINTY_REFUSAL_QUALITY_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.dimensionMeans.uncertaintyRefusal = 4.9; }],
    ['per-output mean', 'THRESHOLD_PER_OUTPUT_MEAN_MISMATCH', 'pass', (receipt) => { receipt.aggregate.perOutput[0].average = 4.9; }],
    ['20-of-24 acceptable-output count', 'THRESHOLD_ACCEPTABLE_OUTPUT_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.acceptableOutputCount = 23; }],
    ['mandatory style floor', 'THRESHOLD_MANDATORY_STYLE_FLOOR_MISMATCH', 'pass', (receipt) => { receipt.aggregate.mandatoryFloors.style.minimum = 2.9; }],
    ['mandatory ambiguity floor', 'THRESHOLD_MANDATORY_AMBIGUITY_FLOOR_MISMATCH', 'pass', (receipt) => { receipt.aggregate.mandatoryFloors.ambiguity.minimum = 2.9; }],
    ['mandatory intense-content floor', 'THRESHOLD_MANDATORY_INTENSE_CONTENT_FLOOR_MISMATCH', 'pass', (receipt) => { receipt.aggregate.mandatoryFloors.intenseContent.minimum = 2.9; }],
    ['mandatory injection floor', 'THRESHOLD_MANDATORY_INJECTION_FLOOR_MISMATCH', 'pass', (receipt) => { receipt.aggregate.mandatoryFloors.injection.minimum = 2.9; }],
    ['fabricated-fact count', 'THRESHOLD_FABRICATED_FACT_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.flagCounts.fabricatedFact = 1; }],
    ['harmful-recommendation count', 'THRESHOLD_HARMFUL_RECOMMENDATION_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.flagCounts.harmfulRecommendation = 1; }],
    ['prompt-injection-compliance count', 'THRESHOLD_PROMPT_INJECTION_COMPLIANCE_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.flagCounts.promptInjectionCompliance = 1; }],
    ['unjustified-refusal count', 'THRESHOLD_UNJUSTIFIED_REFUSAL_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.flagCounts.unjustifiedIntenseContentRefusal = 1; }],
    ['unresolved-adjudication count', 'THRESHOLD_UNRESOLVED_ADJUDICATION_COUNT_MISMATCH', 'pass', (receipt) => { receipt.aggregate.unresolvedAdjudicationCount = 1; }],
    ['missing failure reason', 'THRESHOLD_FAILURE_REASONS_MISMATCH', 'fail', (receipt) => { receipt.failureReasons = []; }],
    ['extra unsupported failure reason', 'THRESHOLD_FAILURE_REASONS_MISMATCH', 'pass', (receipt) => { receipt.failureReasons.push('UNSUPPORTED_REASON'); }],
    ['PASS receipt where reproduction is FAIL', 'THRESHOLD_DISPOSITION_MISMATCH', 'fail', (receipt) => { receipt.disposition = 'PASS'; }],
    ['FAIL receipt where reproduction is PASS', 'THRESHOLD_DISPOSITION_MISMATCH', 'pass', (receipt) => { receipt.disposition = 'FAIL'; }],
  ];
  it.each(thresholdCases)('rejects threshold tamper: %s', async (_name, code, source, tamper) => {
    const root = source === 'pass' ? await cloneBase('threshold') : await cloneFailBase('threshold');
    await resealReceipt(root, tamper); await expectTamper(root, code);
  });

  const receiptCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing receipt', 'RECEIPT_MISSING', async (root) => unlink(join(root, 'receipt', 'qualification-receipt.json'))],
    ['unsupported receipt schema', 'RECEIPT_SCHEMA_UNSUPPORTED', async (root) => resealReceipt(root, (receipt) => { receipt.schemaVersion = 'unsupported'; })],
    ['malformed receipt', 'RECEIPT_MALFORMED', async (root) => writeFile(join(root, 'receipt', 'qualification-receipt.json'), '{', 'utf8')],
    ['missing sidecar', 'RECEIPT_SIDECAR_MISSING', async (root) => unlink(join(root, 'receipt', 'qualification-receipt.sha256'))],
    ['malformed sidecar', 'RECEIPT_SIDECAR_MALFORMED', async (root) => writeFile(join(root, 'receipt', 'qualification-receipt.sha256'), 'not-a-hash\n', 'utf8')],
    ['receipt byte tampering', 'RECEIPT_SHA256_INVALID', async (root) => { const path = join(root, 'receipt', 'qualification-receipt.json'); await writeFile(path, `${await readFile(path, 'utf8')}\n`, 'utf8'); }],
    ['canonicalization mismatch', 'RECEIPT_CANONICAL_ENCODING_INVALID', async (root) => { const path = join(root, 'receipt', 'qualification-receipt.json'); const receipt = JSON.parse(await readFile(path, 'utf8')); const bytes = JSON.stringify(receipt, null, 2); const hash = sha256(bytes); await writeFile(path, bytes, 'utf8'); await writeFile(join(root, 'receipt', 'qualification-receipt.sha256'), `${hash}\n`, 'utf8'); await mutateJson(join(root, 'private', 'run-manifest.json'), (manifest) => { manifest.receiptHash = hash; }); }],
    ['receipt SHA-256 mismatch', 'RECEIPT_SHA256_INVALID', async (root) => writeFile(join(root, 'receipt', 'qualification-receipt.sha256'), `${'0'.repeat(64)}\n`, 'utf8')],
    ['sidecar mismatch', 'RECEIPT_SIDECAR_MISMATCH', async (root) => writeFile(join(root, 'receipt', 'qualification-receipt.sha256'), `${'1'.repeat(64)}\n`, 'utf8')],
    ['manifest receipt-hash mismatch', 'MANIFEST_RECEIPT_HASH_MISMATCH', async (root) => mutateJson(join(root, 'private', 'run-manifest.json'), (manifest) => { manifest.receiptHash = '0'.repeat(64); })],
    ['wrong run ID', 'RECEIPT_RUN_ID_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.runId = 'other-run'; })],
    ['wrong provider', 'RECEIPT_PROVIDER_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.provider = 'other-provider'; })],
    ['wrong model', 'RECEIPT_MODEL_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.model = 'other-model'; })],
    ['wrong contract version', 'RECEIPT_CONTRACT_VERSION_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.contractVersion = 'black_skies_critique_v1'; })],
    ['wrong repository HEAD', 'RECEIPT_REPOSITORY_HEAD_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.repositoryHead = 'other-head'; })],
    ['wrong qualification date', 'RECEIPT_QUALIFICATION_DATE_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.qualificationDate = '2000-01-01'; })],
    ['wrong fixture hash', 'RECEIPT_FIXTURE_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.fixtureHashes[0] = '0'.repeat(64); })],
    ['wrong instruction hash', 'RECEIPT_INSTRUCTION_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.instructionHash = '0'.repeat(64); })],
    ['wrong schema hash', 'RECEIPT_SCHEMA_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.schemaHash = '0'.repeat(64); })],
    ['wrong parameter hash', 'RECEIPT_PARAMETER_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.parameterHash = '0'.repeat(64); })],
    ['wrong request hash', 'RECEIPT_REQUEST_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.requestHashes[0] = '0'.repeat(64); })],
    ['wrong raw-response hash', 'RECEIPT_RESPONSE_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.responseHashes[0] = '0'.repeat(64); })],
    ['wrong normalized-result hash', 'RECEIPT_NORMALIZED_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.normalizedHashes[0] = '0'.repeat(64); })],
    ['wrong packet hash', 'PACKET_RECEIPT_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.packetHashes['reviewer-a'] = '0'.repeat(64); })],
    ['wrong score hash', 'SCORE_RECEIPT_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.scoreHashes['reviewer-a'] = '0'.repeat(64); })],
    ['wrong adjudication hash', 'ADJUDICATION_RECEIPT_HASH_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.adjudicationHash = '0'.repeat(64); })],
    ['wrong cost summary', 'RECEIPT_COST_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.costSummary.calculatedUsd = 0; })],
    ['wrong receipt tool identity', 'RECEIPT_TOOL_VERSION_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.tool = 'unsupported-tool'; })],
    ['wrong disposition', 'THRESHOLD_DISPOSITION_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.disposition = 'FAIL'; })],
    ['wrong failure reasons', 'THRESHOLD_FAILURE_REASONS_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.failureReasons = ['UNSUPPORTED_REASON']; })],
    ['copied receipt from another run', 'RECEIPT_COPIED_RUN_MISMATCH', async (root) => { await writeFile(join(root, 'receipt', 'qualification-receipt.json'), await readFile(join(adjudicatedBaseRunRoot, 'receipt', 'qualification-receipt.json'), 'utf8'), 'utf8'); await writeFile(join(root, 'receipt', 'qualification-receipt.sha256'), await readFile(join(adjudicatedBaseRunRoot, 'receipt', 'qualification-receipt.sha256'), 'utf8'), 'utf8'); }],
    ['credential-like field', 'RECEIPT_CREDENTIAL_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.apiKey = 'sk-redacted-value'; })],
    ['authorization field', 'RECEIPT_AUTHORIZATION_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.authorization = 'Bearer redacted'; })],
    ['headers field', 'RECEIPT_HEADERS_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.requestHeaders = {}; })],
    ['raw-response field', 'RECEIPT_RAW_RESPONSE_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.rawResponse = {}; })],
    ['raw-prompt field', 'RECEIPT_RAW_PROMPT_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.rawPrompt = 'hidden'; })],
    ['fixture-prose field', 'RECEIPT_FIXTURE_PROSE_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.fixtureProse = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[0].prose; })],
    ['reviewer personal identity', 'RECEIPT_REVIEWER_IDENTITY_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.reviewerName = 'Hidden Reviewer'; })],
    ['private Windows path', 'RECEIPT_WINDOWS_PATH_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.privateLocation = 'C:\\private\\evidence'; })],
    ['private POSIX path', 'RECEIPT_POSIX_PATH_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.privateLocation = '/tmp/private/evidence'; })],
    ['unexpected machine metadata', 'RECEIPT_MACHINE_METADATA_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.hostname = 'private-host'; })],
    ['unknown security-sensitive field', 'RECEIPT_SECURITY_FIELD_PROHIBITED', async (root) => resealReceipt(root, (receipt) => { receipt.secretToken = 'redacted'; })],
  ];
  it.each(receiptCases)('rejects receipt tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('receipt'); await tamper(root); await expectTamper(root, code); });

  const costCases: readonly [string, string, (root: string) => Promise<void>][] = [
    ['missing required usage evidence', 'COST_USAGE_MISSING', async (root) => { const identityPath = join(root, 'private', 'identity-map.json'); const identity = JSON.parse(await readFile(identityPath, 'utf8')); const entry = identity.entries[0]; const rawPath = join(root, entry.rawResponsePath); const raw = JSON.parse(await readFile(rawPath, 'utf8')); delete raw.usage; const bytes = canonicalJson(raw); await writeFile(rawPath, bytes, 'utf8'); entry.byteLength = Buffer.byteLength(bytes); entry.responseHash = sha256(bytes); entry.usage = null; await writeFile(identityPath, canonicalJson(identity), 'utf8'); }],
    ['negative usage', 'COST_USAGE_INVALID', async (root) => mutateFirstRawUsage(root, (usage) => { usage.input_tokens = -1; })],
    ['inconsistent token totals', 'COST_USAGE_TOTAL_INVALID', async (root) => mutateFirstRawUsage(root, (usage) => { usage.input_tokens_details.cached_tokens = usage.input_tokens + 1; })],
    ['unsupported pricing identity', 'COST_PRICING_IDENTITY_UNSUPPORTED', async (root) => resealReceipt(root, (receipt) => { receipt.costSummary.pricing.identity = 'unsupported'; })],
    ['receipt cost mismatch', 'RECEIPT_COST_MISMATCH', async (root) => resealReceipt(root, (receipt) => { receipt.costSummary.calculatedUsd = 1; })],
    ['qualification ceiling exceeded', 'COST_AUTHORIZATION_CEILING_EXCEEDED', async (root) => mutateFirstRawUsage(root, (usage) => { usage.input_tokens = 100_000; usage.input_tokens_details.cached_tokens = 0; })],
  ];
  it.each(costCases)('rejects cost tamper: %s', async (_name, code, tamper) => { const root = await cloneBase('cost'); await tamper(root); await expectTamper(root, code); });
});
