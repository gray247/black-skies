import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  AI_CRITIQUE_MAX_SELECTION_LENGTH,
  AI_CRITIQUE_MIN_SELECTION_LENGTH,
} from '../../shared/ipc/aiCritique';
import { AiCritiqueGateway } from '../aiCritiqueGateway';
import {
  AI_CRITIQUE_INSTRUCTIONS,
  AI_CRITIQUE_RESPONSE_SCHEMA,
  buildAiCritiqueProviderBody,
  serializeAiCritiqueProviderBody,
  sha256,
} from '../aiCritiqueCoordinator';
import { QualificationArtifactRun } from '../aiCritiqueQualificationArtifacts';
import { AI_CRITIQUE_QUALIFICATION_FIXTURES_V1 } from './fixtures/aiCritiqueQualification.v1';

const expectedHashes = [
  'cccdf4637df94f518b826c5884ffc797d4293eef9e15d790e758e91ec8f76957',
  '9660f2b8c3af445bf956a3dafb1331afebbb89494cfa27f4db89c4f56eaa3f74',
  'f46674bc3c5df890222168b204c3057d7218bb2779a24fd629e539512ae94c57',
  '3506d13c02a358ed0c01b65ff2a62001c7ae49dd6f7bab546372608896bcde84',
  '5d14559bd7655c95214ff1e63d7e3dfccc33828403dfb0685af5632509b23f5a',
  '1de03c6afcd2436630838b5fe3debaeccfb888674cdd379b01a517eb3f603aee',
  '75774e4667684041e7ca38ae8df33817f0e0484e0ffa00baef1ebd57345f6d32',
  '4b2b86896d69ed28b105cf32505e9a841e415141b6c7bbc75e579aef9fc14a3a',
  '4920555155c507cef2db43e2e8207c2636e16d869e4995cd043b0b09a9d3af74',
  '56550d98fd5eb422f2abc948832c766905abd658ccb9c30b844e9b183246647b',
  'fa16ef1d31aff5ca69f49e289f91afc4ce67f853b707f7675f1500c4987b6566',
  'f8338dba1532db7be1b7da78c1da8ebfcd1bd81444fdb5e88c04f2fa2a219ab9',
] as const;

const qualificationEnabled = process.env.BLACK_SKIES_RUN_AI_QUALIFICATION === '1';
const qualificationCredential = process.env.BLACK_SKIES_AI_QUALIFICATION_API_KEY;
const qualificationOutputRoot = process.env.BLACK_SKIES_AI_QUALIFICATION_OUTPUT_DIR;

describe('AI critique qualification v1', () => {
  it('freezes twelve synthetic, cleared, bounded fixtures and their content hashes', () => {
    expect(AI_CRITIQUE_QUALIFICATION_FIXTURES_V1).toHaveLength(12);
    expect(AI_CRITIQUE_QUALIFICATION_FIXTURES_V1.map((fixture) => fixture.contentHash)).toEqual(
      expectedHashes,
    );
    expect(new Set(AI_CRITIQUE_QUALIFICATION_FIXTURES_V1.map((fixture) => fixture.id)).size).toBe(12);
    for (const fixture of AI_CRITIQUE_QUALIFICATION_FIXTURES_V1) {
      const boundedLength = fixture.prose.replace(/\s/g, '').length;
      expect(boundedLength).toBeGreaterThanOrEqual(AI_CRITIQUE_MIN_SELECTION_LENGTH);
      expect(boundedLength).toBeLessThanOrEqual(AI_CRITIQUE_MAX_SELECTION_LENGTH);
      expect(fixture.clearanceClassification).toBe('SYNTHETIC_CLEARED_FOR_REMOTE_QUALIFICATION');
      expect(fixture.expectedEvidence.length).toBeGreaterThan(0);
      expect(fixture.prohibitedClaims.length).toBeGreaterThan(0);
      for (const evidence of fixture.expectedEvidence) expect(fixture.prose).toContain(evidence);
    }
  });

  it.skipIf(!qualificationEnabled || !qualificationCredential || !qualificationOutputRoot)(
    'runs two independent schema-and-evidence-valid requests for every frozen fixture',
    async () => {
      let capture: ((evidence: Parameters<NonNullable<ConstructorParameters<typeof AiCritiqueGateway>[0]['evidenceSink']>>[0]) => Promise<void>) | null = null;
      const run = await QualificationArtifactRun.create({
        outputRoot: qualificationOutputRoot!, repositoryRoot: resolve(process.cwd(), '..'),
        repositoryHead: process.env.GIT_COMMIT ?? 'unrecorded-head',
      });
      const gateway = new AiCritiqueGateway({ evidenceSink: async (evidence) => {
        if (!capture) throw new Error('Qualification evidence arrived without an active attempt.');
        await capture(evidence);
      } });
      const completedHashes: string[] = [];
      for (const fixture of AI_CRITIQUE_QUALIFICATION_FIXTURES_V1) {
        for (let run = 1; run <= 2; run += 1) {
          const providerBodyJson = serializeAiCritiqueProviderBody(
            buildAiCritiqueProviderBody(fixture.prose),
          );
          const attemptId = `qualification:${fixture.id}:${run}:${randomUUID()}`;
          capture = run.evidenceSink({
            attemptId, fixtureId: fixture.id, fixtureHash: fixture.contentHash, execution: run as 1 | 2,
            prose: fixture.prose, critique: null, provider: 'openai', model: 'gpt-5.4-2026-03-05',
            instructionHash: sha256(AI_CRITIQUE_INSTRUCTIONS), schemaHash: sha256(JSON.stringify(AI_CRITIQUE_RESPONSE_SCHEMA)),
            parameterHash: sha256(providerBodyJson.replace(fixture.prose, '')), requestHash: sha256(providerBodyJson),
            normalizedHash: '', structuralValid: false, usage: null,
          });
          const result = await gateway.execute({
            requestId: attemptId, evidenceAttemptId: attemptId,
            credential: qualificationCredential!,
            providerBodyJson,
            payloadHash: sha256(providerBodyJson),
            selectedText: fixture.prose,
            sourceFingerprint: fixture.contentHash,
            selectionFingerprint: fixture.contentHash,
            editorRevision: 0,
          });
          run.completeAttempt(attemptId, { critique: result.content, normalizedHash: sha256(JSON.stringify(result.content)), structuralValid: true, usage: { calculatedUsd: result.usage.calculatedUsd } });
          expect(result.sourceFingerprint).toBe(fixture.contentHash);
          completedHashes.push(sha256(JSON.stringify({
            fixtureHash: fixture.contentHash,
            run,
            usage: result.usage,
            contentHash: sha256(JSON.stringify(result.content)),
          })));
        }
      }
      expect(completedHashes).toHaveLength(24);
      expect(new Set(completedHashes).size).toBe(24);
      expect(await run.writeIdentityMap()).toHaveLength(24);
    },
    40 * 60 * 1000,
  );
});
