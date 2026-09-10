import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IDEATION_FILENAME, IDEATION_FIXED_CORE_QUESTIONS, IDEATION_MAX_OBJECT_HISTORY, IDEATION_SCHEMA_VERSION } from '../../shared/ipc/ideation';
import { PROGRAM7_LOCAL_INFERENCE_ENDPOINT, PROGRAM7_LOCAL_INFERENCE_MODEL, PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA } from '../../shared/localInference';
import { IdeationRepository, IdeationRepositoryError } from '../ideationRepository';
import { program7LocalInferenceSchemaHash } from '../program7LocalInferenceService';
import { program7LocalInferencePromptHash } from '../ollamaLocalInferenceTransport';

const roots: string[] = [];
async function project(): Promise<string> { const root = await mkdtemp(join(tmpdir(), 'black-skies-ideation-')); roots.push(root); return root; }
function store(root: string, provider?: (input: any) => Promise<unknown>) {
  let next = 0;
  return new IdeationRepository(root, () => new Date('2026-09-09T12:00:00.000Z'), () => 'id-' + (++next), provider);
}
function trustedAlternativeResponse(request: any): unknown {
  return {
    schema: PROGRAM7_LOCAL_INFERENCE_RESPONSE_SCHEMA,
    requestId: request.requestId,
    model: PROGRAM7_LOCAL_INFERENCE_MODEL,
    status: 'candidate',
    text: 'An advisory alternative.',
    reason: 'For comparison only.',
    usage: { inputChars: request.source.text.length, outputChars: 'An advisory alternative.'.length },
    receipt: {
      endpoint: PROGRAM7_LOCAL_INFERENCE_ENDPOINT,
      requestedModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      actualModel: PROGRAM7_LOCAL_INFERENCE_MODEL,
      modelDigest: 'b'.repeat(64),
      ollamaVersion: '0.13.0',
      promptSha256: program7LocalInferencePromptHash(request),
      schemaSha256: program7LocalInferenceSchemaHash(),
      startedAt: '2026-09-09T12:00:00.000Z',
      firstTokenAt: '2026-09-09T12:00:00.000Z',
      endedAt: '2026-09-09T12:00:00.000Z',
      promptTokens: 4,
      outputTokens: 'An advisory alternative.'.length,
    },
  };
}
async function seedPair(repository: IdeationRepository) {
  const first = await repository.captureSeed('project-a', 0, { title: 'A locked room', body: 'A fragment about a house that forgets its visitors.', kind: 'fragment', tags: ['gothic', 'house'], protected: false });
  const second = await repository.captureSeed('project-a', 1, { title: 'A missing bell', body: 'A question about a bell that rings before danger.', kind: 'question', tags: ['gothic'], protected: false });
  return { first, second, firstId: first.document.seeds[0]!.id, secondId: second.document.seeds[1]!.id };
}

describe('Ideation owner', () => {
  afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

  it('reads an absent sidecar and captures author-owned seed/version provenance', async () => {
    const root = await project(); const repository = store(root);
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'ready', document: { schemaVersion: IDEATION_SCHEMA_VERSION, projectId: 'project-a', revision: 0, seeds: [] } });
    const result = await repository.captureSeed('project-a', 0, { title: '  The bell house  ', body: '  A house hears a bell before every disappearance.  ', kind: 'partial-premise', tags: [' gothic ', 'gothic'], protected: true });
    const seed = result.document.seeds[0]!;
    expect(seed.tags).toEqual(['gothic']); expect(seed.protected).toBe(true);
    expect(seed.versions[0]).toMatchObject({ title: 'The bell house', body: 'A house hears a bell before every disappearance.', provenance: { kind: 'author', actor: 'author', authorRequested: false } });
    await expect(readFile(join(root, IDEATION_FILENAME), 'utf8')).resolves.toContain('BlackSkiesIdeation v1');
  });

  it('preserves seed and premise history, marks dependent branches stale, and rejects stale revisions', async () => {
    const root = await project(); const repository = store(root); const { first, firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'House branch', seedIds: [firstId], premise: 'A house remembers every visitor except one.', unknowns: [{ id: 'u1', statement: 'Why does the house forget?', posture: 'intentional-ambiguity', revisitCondition: null }] });
    const branchId = branch.document.branches[0]!.id;
    const revised = await repository.updateSeed('project-a', 3, { seedId: firstId, title: 'A house that forgets', body: 'The house forgets one visitor and remembers the bell.', kind: 'fragment', tags: ['gothic'] });
    expect(revised.document.seeds[0]!.versions).toHaveLength(2); expect(revised.document.branches[0]!.posture).toBe('stale');
    await expect(repository.addPremiseVersion('project-a', 2, { branchId, text: 'Stale write', unresolvedAreas: [] })).rejects.toMatchObject({ code: 'STALE' } satisfies Partial<IdeationRepositoryError>);
    expect(first.document.revision).toBe(1);
  });

  it('copies, splits, merges, and combines branches without erasing source contribution lineage', async () => {
    const root = await project(); const repository = store(root); const { firstId, secondId } = await seedPair(repository);
    const firstBranch = await repository.createBranch('project-a', 2, { name: 'First', seedIds: [firstId], premise: 'The house remembers.', unknowns: [] }); const firstBranchId = firstBranch.document.branches[0]!.id;
    const copied = await repository.copyBranch('project-a', 3, firstBranchId, 'Copied'); const copiedId = copied.document.branches[1]!.id;
    expect(copied.document.branches[1]).toMatchObject({ parentBranchId: firstBranchId, posture: 'draft', lineageBranchIds: [firstBranchId] });
    expect(copied.document.branches[1]!.sourceContributions).toEqual(copied.document.branches[0]!.sourceContributions);
    expect(copied.document.branches[1]!.premiseVersions[0]!.provenance).toEqual(copied.document.branches[0]!.premiseVersions[0]!.provenance);
    expect(copied.document.branches[1]!.premiseVersions[0]!.createdAt).toBe(copied.document.branches[0]!.premiseVersions[0]!.createdAt);
    const secondBranch = await repository.createBranch('project-a', 4, { name: 'Second', seedIds: [secondId], premise: 'The bell warns.', unknowns: [] }); const secondBranchId = secondBranch.document.branches[2]!.id;
    const merged = await repository.mergeBranches('project-a', 5, [firstBranchId, secondBranchId], 'Combined', 'The bell teaches the house to remember.'); const mergedBranch = merged.document.branches.find((branch) => branch.name === 'Combined')!;
    expect(mergedBranch.lineageBranchIds).toEqual([firstBranchId, secondBranchId]); expect(mergedBranch.sourceContributions).toEqual([...merged.document.branches.find((branch) => branch.id === firstBranchId)!.sourceContributions, ...merged.document.branches.find((branch) => branch.id === secondBranchId)!.sourceContributions]); expect(mergedBranch.sourceContributions.map((item) => item.seedId)).toEqual([firstId, secondId]); expect(merged.document.branches.filter((branch) => branch.posture === 'merged')).toHaveLength(2);
    const split = await repository.splitBranch('project-a', 6, { branchId: copiedId, name: 'Split', premise: 'A separate memory.', seedIds: [firstId] }); expect(split.document.branches.at(-1)).toMatchObject({ parentBranchId: copiedId, lineageBranchIds: [firstBranchId, copiedId] });
    const combined = await repository.combineSeeds('project-a', 7, { seedIds: [firstId, secondId], name: 'Second combination', premise: 'The bell and house share a secret.', contributions: [{ seedId: firstId, importance: 'anchor', classification: 'central', sourceVersionId: null, note: 'setting' }, { seedId: secondId, importance: 'supporting', classification: 'thematic', sourceVersionId: null, note: 'warning' }] });
    expect(combined.document.branches.at(-1)!.sourceContributions).toHaveLength(2); expect(combined.document.branches.at(-1)!.sourceContributions[1]).toMatchObject({ classification: 'thematic', note: 'warning' });
  });

  it('rejects merges whose overlapping seeds cannot retain distinct lineage', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository);
    const firstBranch = await repository.createBranch('project-a', 2, { name: 'First overlap', seedIds: [firstId], premise: 'First premise.', unknowns: [] });
    const secondBranch = await repository.createBranch('project-a', 3, { name: 'Second overlap', seedIds: [firstId], premise: 'Second premise.', unknowns: [] });
    await expect(repository.mergeBranches('project-a', 4, [firstBranch.document.branches[0]!.id, secondBranch.document.branches[1]!.id], 'Invalid overlap', 'Would lose one contribution.')).rejects.toMatchObject({ code: 'INVALID_LINEAGE' } satisfies Partial<IdeationRepositoryError>);
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'ready', document: { revision: 4 } });
  });

  it('keeps explicit unknown and intentional ambiguity visible in fixed-core/advisory tests', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'Ambiguous', seedIds: [firstId], premise: 'The house may be remembering or inventing.', unknowns: [{ id: 'u1', statement: 'Whether the house is reliable.', posture: 'intentional-ambiguity', revisitCondition: 'after character clarification' }] }); const branchId = branch.document.branches[0]!.id;
    const tested = await repository.testPremise('project-a', 3, { branchId, answers: { 'focal-force': 'The house' }, purpose: null }); const test = tested.document.premiseTests[0]!;
    expect(test.fixedCore).toEqual(IDEATION_FIXED_CORE_QUESTIONS); expect(test.adaptive.map((question) => question.id)).toContain('ambiguity-purpose'); expect(test.findings.some((finding) => finding.uncertainty === 'unknown')).toBe(true);
    const revised = await repository.addPremiseVersion('project-a', 4, { branchId, text: 'The house chooses what to remember.', unresolvedAreas: [{ id: 'u2', statement: 'The choice may remain unexplained.', posture: 'unknown', revisitCondition: null }] });
    expect(revised.document.branches[0]!.premiseVersions).toHaveLength(2); expect(revised.document.branches[0]!.premiseVersions[0]!.supersededAt).not.toBeNull();
  });

  it('archives/restores, filters the library, prepares promotion only, and bounds history', async () => {
    const root = await project(); const repository = store(root); const { firstId, secondId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'Promotable', seedIds: [firstId, secondId], premise: 'The bell unlocks the house.', unknowns: [] }); const branchId = branch.document.branches[0]!.id;
    await expect(repository.restoreBranch('project-a', 3, branchId)).rejects.toMatchObject({ code: 'INVALID' } satisfies Partial<IdeationRepositoryError>);
    const beforeLifecycle = branch.document.branches[0]!; const archived = await repository.archiveBranch('project-a', 3, branchId); expect(archived.document.branches[0]!.posture).toBe('archived'); expect(archived.document.branches[0]!.sourceContributions).toEqual(beforeLifecycle.sourceContributions); expect(archived.document.branches[0]!.lineageBranchIds).toEqual(beforeLifecycle.lineageBranchIds); expect(archived.document.branches[0]!.premiseVersions).toEqual(beforeLifecycle.premiseVersions);
    await expect(repository.preparePromotion('project-a', 4, { branchId, destination: 'outline', seedIds: [firstId], selectedText: 'not allowed while archived' })).rejects.toMatchObject({ code: 'ARCHIVED_BRANCH' } satisfies Partial<IdeationRepositoryError>);
    const restored = await repository.restoreBranch('project-a', 4, branchId); expect(restored.document.branches[0]!.sourceContributions).toEqual(beforeLifecycle.sourceContributions); expect(restored.document.branches[0]!.lineageBranchIds).toEqual(beforeLifecycle.lineageBranchIds); expect(restored.document.branches[0]!.premiseVersions).toEqual(beforeLifecycle.premiseVersions); const promoted = await repository.preparePromotion('project-a', 5, { branchId, destination: 'outline', seedIds: [firstId], selectedText: 'The bell unlocks the house.' });
    expect(promoted.document.promotionPackages[0]).toMatchObject({ status: 'prepared', destination: 'outline', selectedTextSha256: createHash('sha256').update('The bell unlocks the house.', 'utf8').digest('hex'), sourceContributions: [beforeLifecycle.sourceContributions[0]], provenance: { sourceReference: expect.stringContaining('selectedSha256=') } }); expect(promoted.document.branches.find((candidate) => candidate.id === branchId)!.posture).toBe('draft');
    const filtered = await repository.filterLibrary('project-a', { kind: 'question', tag: 'gothic' }); expect(filtered.document.seeds).toHaveLength(1); expect(filtered.document.seeds[0]!.id).toBe(secondId); expect(restored.document.history.length).toBeLessThanOrEqual(200);
  });

  it('projects filtered library results without protected or unrelated records', async () => {
    const root = await project(); const repository = store(root);
    const visible = await repository.captureSeed('project-a', 0, { title: 'Visible question', body: 'A visible question.', kind: 'question', tags: ['gothic'], protected: false });
    const hidden = await repository.captureSeed('project-a', 1, { title: 'Protected question', body: 'Do not show this.', kind: 'question', tags: ['gothic'], protected: true });
    await repository.createBranch('project-a', 2, { name: 'Protected branch', seedIds: [hidden.document.seeds[1]!.id], premise: 'Protected premise.', unknowns: [] });
    const filtered = await repository.filterLibrary('project-a', { kind: 'question', tag: 'gothic' });
    expect(filtered.document.seeds.map((seed) => seed.id)).toEqual([visible.document.seeds[0]!.id]);
    expect(filtered.document.branches).toEqual([]); expect(filtered.document.premiseTests).toEqual([]); expect(filtered.document.promotionPackages).toEqual([]); expect(filtered.document.aiAlternatives).toEqual([]);
    expect(filtered.document.history.every((item) => item.objectId === visible.document.seeds[0]!.id)).toBe(true);
  });

  it('bounds seed history when branches repeatedly link the same seed', async () => {
    const root = await project(); const repository = store(root);
    const captured = await repository.captureSeed('project-a', 0, { title: 'Repeated source', body: 'A source reused across branches.', kind: 'fragment', tags: [], protected: false });
    const seedId = captured.document.seeds[0]!.id;
    for (let index = 0; index < IDEATION_MAX_OBJECT_HISTORY - 1; index += 1) {
      await repository.createBranch('project-a', index + 1, { name: `Branch ${index}`, seedIds: [seedId], premise: `Premise ${index}.`, unknowns: [] });
    }
    const beforeOverflow = await readFile(join(root, IDEATION_FILENAME), 'utf8');
    await expect(repository.createBranch('project-a', IDEATION_MAX_OBJECT_HISTORY, { name: 'Overflow', seedIds: [seedId], premise: 'Overflow premise.', unknowns: [] })).rejects.toMatchObject({ code: 'INVALID' } satisfies Partial<IdeationRepositoryError>);
    await expect(readFile(join(root, IDEATION_FILENAME), 'utf8')).resolves.toBe(beforeOverflow);
    const result = await repository.read('project-a');
    expect(result.document.seeds[0]!.history).toHaveLength(IDEATION_MAX_OBJECT_HISTORY);
  });

  it('fails closed when persisted adaptive questions diverge from the branch-derived set', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'Adaptive validation', seedIds: [firstId], premise: 'The house listens.', unknowns: [] });
    await repository.testPremise('project-a', 3, { branchId: branch.document.branches[0]!.id, answers: {}, purpose: null });
    const filePath = join(root, IDEATION_FILENAME); const parsed = JSON.parse(await readFile(filePath, 'utf8')) as any; parsed.premiseTests[0].adaptive[0] = { id: 'tampered-question', prompt: 'A well-shaped but unapproved question.', required: false, adaptive: true }; const tampered = JSON.stringify(parsed, null, 2) + '\n'; await writeFile(filePath, tampered, 'utf8');
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { revision: 0, seeds: [] } });
    await expect(readFile(filePath, 'utf8')).resolves.toBe(tampered);
  });

  it('keeps a valid historical premise test readable through archive and restore', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'Lifecycle validation', seedIds: [firstId], premise: 'The house listens.', unknowns: [] }); const branchId = branch.document.branches[0]!.id;
    await repository.testPremise('project-a', 3, { branchId, answers: {}, purpose: null });
    const archived = await repository.archiveBranch('project-a', 4, branchId);
    expect(archived.document.premiseTests).toHaveLength(1);
    const restored = await repository.restoreBranch('project-a', 5, branchId);
    expect(restored.document.premiseTests).toHaveLength(1);
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'ready', document: { revision: 6 } });
  });

  it('rejects protected promotion before persistence and rejects duplicate generated IDs', async () => {
    const root = await project(); const repository = store(root); const protectedSeed = await repository.captureSeed('project-a', 0, { title: 'Protected', body: 'Do not promote.', kind: 'fragment', tags: [], protected: true }); const branch = await repository.createBranch('project-a', 1, { name: 'Protected branch', seedIds: [protectedSeed.document.seeds[0]!.id], premise: 'Protected premise.', unknowns: [] }); const before = await readFile(join(root, IDEATION_FILENAME), 'utf8');
    await expect(repository.preparePromotion('project-a', 2, { branchId: branch.document.branches[0]!.id, destination: 'outline', seedIds: [protectedSeed.document.seeds[0]!.id], selectedText: 'Do not persist.' })).rejects.toMatchObject({ code: 'INVALID_LINEAGE' } satisfies Partial<IdeationRepositoryError>);
    await expect(readFile(join(root, IDEATION_FILENAME), 'utf8')).resolves.toBe(before);

    const duplicateRoot = await project(); const duplicateRepository = new IdeationRepository(duplicateRoot, () => new Date('2026-09-09T12:00:00.000Z'), () => 'fixed-id'); await duplicateRepository.captureSeed('project-a', 0, { title: 'First', body: 'First.', kind: 'fragment', tags: [], protected: false }); const duplicateBefore = await readFile(join(duplicateRoot, IDEATION_FILENAME), 'utf8');
    await expect(duplicateRepository.captureSeed('project-a', 1, { title: 'Second', body: 'Second.', kind: 'fragment', tags: [], protected: false })).rejects.toMatchObject({ code: 'INVALID' } satisfies Partial<IdeationRepositoryError>);
    await expect(readFile(join(duplicateRoot, IDEATION_FILENAME), 'utf8')).resolves.toBe(duplicateBefore);
  });

  it('rejects promotion records whose durable source evidence is tampered', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository); const branch = await repository.createBranch('project-a', 2, { name: 'Promotion evidence', seedIds: [firstId], premise: 'The house listens.', unknowns: [] });
    await repository.preparePromotion('project-a', 3, { branchId: branch.document.branches[0]!.id, destination: 'outline', seedIds: [firstId], selectedText: 'The house listens.' });
    const filePath = join(root, IDEATION_FILENAME); const parsed = JSON.parse(await readFile(filePath, 'utf8')) as any; parsed.promotionPackages[0].selectedTextSha256 = '0'.repeat(64); const tampered = JSON.stringify(parsed, null, 2) + '\n'; await writeFile(filePath, tampered, 'utf8');
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { revision: 0, seeds: [] } });
  });

  it('rejects malformed bytes without overwriting them', async () => {
    const root = await project(); const filePath = join(root, IDEATION_FILENAME); await writeFile(filePath, '{not valid JSON'); const repository = store(root);
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { revision: 0, seeds: [] } });
    await expect(repository.captureSeed('project-a', 0, { title: 'No overwrite', body: 'x', kind: 'line', tags: [], protected: false })).rejects.toMatchObject({ code: 'UNAVAILABLE' } satisfies Partial<IdeationRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe('{not valid JSON');
  });

  it('only persists provider alternatives after an explicit author request and never accepts them', async () => {
    const root = await project(); const repository = store(root, async (request) => trustedAlternativeResponse(request)); const { firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'AI optional', seedIds: [firstId], premise: 'The house listens.', unknowns: [] }); const branchId = branch.document.branches[0]!.id;
    const result = await repository.requestAiAlternatives('project-a', 3, { branchId, authorRequested: true, purpose: 'compare pressure' });
    expect(result.document.aiAlternatives).toHaveLength(1); expect(result.document.aiAlternatives[0]).toMatchObject({ accepted: false, model: 'qwen3:4b', request: { operation: 'premise_alternative', source: { unitId: `ideation-branch:${branchId}` } }, receipt: { actualModel: 'qwen3:4b', requestedModel: 'qwen3:4b' } });
    const unavailable = new IdeationRepository(root); await expect(unavailable.requestAiAlternatives('project-a', result.document.revision, { branchId, authorRequested: true, purpose: 'retry' })).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' } satisfies Partial<IdeationRepositoryError>);
  });

  it('revalidates the durable local-AI request binding against the persisted receipt', async () => {
    const root = await project(); const repository = store(root, async (request) => trustedAlternativeResponse(request)); const { firstId } = await seedPair(repository); const branch = await repository.createBranch('project-a', 2, { name: 'Receipt binding', seedIds: [firstId], premise: 'The house listens.', unknowns: [] });
    await repository.requestAiAlternatives('project-a', 3, { branchId: branch.document.branches[0]!.id, authorRequested: true, purpose: 'compare pressure' });
    const filePath = join(root, IDEATION_FILENAME); const parsed = JSON.parse(await readFile(filePath, 'utf8')) as any; parsed.aiAlternatives[0].request.purpose = 'tampered purpose'; const tampered = JSON.stringify(parsed, null, 2) + '\n'; await writeFile(filePath, tampered, 'utf8');
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { revision: 0, seeds: [] } });
  });

  it('rejects persisted successful alternatives with incomplete model identity', async () => {
    const root = await project(); const repository = store(root, async (request) => trustedAlternativeResponse(request)); const { firstId } = await seedPair(repository); const branch = await repository.createBranch('project-a', 2, { name: 'Receipt identity', seedIds: [firstId], premise: 'The house listens.', unknowns: [] });
    await repository.requestAiAlternatives('project-a', 3, { branchId: branch.document.branches[0]!.id, authorRequested: true, purpose: 'compare pressure' });
    const filePath = join(root, IDEATION_FILENAME); const original = await readFile(filePath, 'utf8');
    for (const field of ['actualModel', 'modelDigest', 'ollamaVersion'] as const) {
      const parsed = JSON.parse(original) as any; parsed.aiAlternatives[0].receipt[field] = null; await writeFile(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
      await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { revision: 0, seeds: [] } });
    }
  });

  it('rejects malformed nested premise-test bytes and preserves the saved bytes', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'Nested validation', seedIds: [firstId], premise: 'The house listens.', unknowns: [] });
    const tested = await repository.testPremise('project-a', 3, { branchId: branch.document.branches[0]!.id, answers: {}, purpose: null });
    const filePath = join(root, IDEATION_FILENAME); const parsed = JSON.parse(await readFile(filePath, 'utf8')) as any; parsed.premiseTests[0].answers = []; const malformed = JSON.stringify(parsed, null, 2) + '\n'; await writeFile(filePath, malformed, 'utf8');
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'degraded', document: { revision: 0, seeds: [] } });
    await expect(readFile(filePath, 'utf8')).resolves.toBe(malformed);
    expect(tested.document.premiseTests[0]!.answers).toEqual({});
  });

  it('rejects unknown premise-test answer keys without changing the saved document', async () => {
    const root = await project(); const repository = store(root); const { firstId } = await seedPair(repository);
    const branch = await repository.createBranch('project-a', 2, { name: 'Answer validation', seedIds: [firstId], premise: 'The house listens.', unknowns: [] });
    const filePath = join(root, IDEATION_FILENAME); const before = await readFile(filePath, 'utf8');
    await expect(repository.testPremise('project-a', 3, { branchId: branch.document.branches[0]!.id, answers: { bogus: 'must not persist' }, purpose: null })).rejects.toMatchObject({ code: 'INVALID' } satisfies Partial<IdeationRepositoryError>);
    await expect(readFile(filePath, 'utf8')).resolves.toBe(before);
    await expect(repository.read('project-a')).resolves.toMatchObject({ availability: 'ready', document: { revision: 3, premiseTests: [] } });
  });

  it('rejects protected branch sources before invoking the Program 7 local-inference seam', async () => {
    const root = await project(); const provider = vi.fn(async () => trustedAlternativeResponse({ requestId: 'unused', source: { text: 'x' } })); const repository = store(root, provider); const protectedSeed = await repository.captureSeed('project-a', 0, { title: 'Protected', body: 'Do not send.', kind: 'fragment', tags: [], protected: true });
    const branch = await repository.createBranch('project-a', 1, { name: 'Protected branch', seedIds: [protectedSeed.document.seeds[0]!.id], premise: 'A protected premise.', unknowns: [] });
    await expect(repository.requestAiAlternatives('project-a', 2, { branchId: branch.document.branches[0]!.id, authorRequested: true, purpose: 'compare' })).rejects.toMatchObject({ code: 'INVALID_LINEAGE' } satisfies Partial<IdeationRepositoryError>); expect(provider).not.toHaveBeenCalled();
  });

  it('requires nonempty promotion text and a branch-owned seed', async () => {
    const root = await project(); const repository = store(root); const { firstId, secondId } = await seedPair(repository); const branch = await repository.createBranch('project-a', 2, { name: 'Promotion branch', seedIds: [firstId], premise: 'A premise.', unknowns: [] }); const branchId = branch.document.branches[0]!.id;
    await expect(repository.preparePromotion('project-a', 3, { branchId, destination: 'outline', seedIds: [firstId], selectedText: '   ' })).rejects.toMatchObject({ code: 'INVALID' } satisfies Partial<IdeationRepositoryError>);
    await expect(repository.preparePromotion('project-a', 3, { branchId, destination: 'outline', seedIds: [secondId], selectedText: 'Not from branch.' })).rejects.toMatchObject({ code: 'INVALID_LINEAGE' } satisfies Partial<IdeationRepositoryError>);
  });
});
