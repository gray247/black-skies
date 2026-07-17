import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  AI_CRITIQUE_MAX_SELECTION_LENGTH,
  AI_CRITIQUE_MIN_SELECTION_LENGTH,
  AI_CRITIQUE_TASK_CONTRACT_VERSION,
} from '../../shared/ipc/aiCritique';
import { AiCritiqueGateway } from '../aiCritiqueGateway';
import {
  AI_CRITIQUE_INSTRUCTIONS,
  AI_CRITIQUE_RESPONSE_SCHEMA,
  buildAiCritiqueProviderBody,
  serializeAiCritiqueProviderBody,
  sha256,
} from '../aiCritiqueCoordinator';
import {
  QualificationArtifactRun,
  QUALIFICATION_ARTIFACT_VERSION,
} from '../aiCritiqueQualificationArtifacts';
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

interface LiveQualificationConfiguration {
  readonly credential: string;
  readonly outputRoot: string;
}

function liveQualificationConfiguration(
  env: NodeJS.ProcessEnv,
): LiveQualificationConfiguration | null {
  if (
    env.BLACK_SKIES_RUN_AI_QUALIFICATION !== '1' ||
    !env.BLACK_SKIES_AI_QUALIFICATION_API_KEY ||
    !env.BLACK_SKIES_AI_QUALIFICATION_OUTPUT_DIR
  ) return null;
  return {
    credential: env.BLACK_SKIES_AI_QUALIFICATION_API_KEY,
    outputRoot: env.BLACK_SKIES_AI_QUALIFICATION_OUTPUT_DIR,
  };
}

function resolveRepositoryHead(repositoryRoot: string, env: NodeJS.ProcessEnv): string {
  const supplied = env.GIT_COMMIT?.trim();
  const head = supplied || execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
  if (!/^[a-f0-9]{40,64}$/.test(head)) {
    throw new Error('Live qualification requires an exact repository HEAD.');
  }
  return head;
}

type QualificationFixture = typeof AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[number];

interface QualificationAttemptContext {
  readonly attemptId: string;
  readonly execution: 1 | 2;
  readonly fixture: QualificationFixture;
  readonly providerBodyJson: string;
  readonly captureEvidence: ReturnType<QualificationArtifactRun['evidenceSink']>;
}

interface QualificationAttemptResult {
  readonly critique: unknown;
  readonly normalizedHash: string;
  readonly structuralValid: true;
  readonly usage: { readonly calculatedUsd: number };
}

async function runQualificationCapture(options: {
  readonly outputRoot: string;
  readonly repositoryRoot: string;
  readonly repositoryHead: string;
  readonly allowTemporaryRoot?: boolean;
  readonly runId?: string;
  readonly executeAttempt: (
    context: QualificationAttemptContext,
  ) => Promise<QualificationAttemptResult>;
}): Promise<QualificationArtifactRun> {
  const artifactRun = await QualificationArtifactRun.create({
    outputRoot: options.outputRoot,
    repositoryRoot: options.repositoryRoot,
    repositoryHead: options.repositoryHead,
    allowTemporaryRoot: options.allowTemporaryRoot,
    runId: options.runId,
  });
  for (const fixture of AI_CRITIQUE_QUALIFICATION_FIXTURES_V1) {
    for (let execution = 1; execution <= 2; execution += 1) {
      const typedExecution = execution as 1 | 2;
      const providerBodyJson = serializeAiCritiqueProviderBody(
        buildAiCritiqueProviderBody(fixture.prose),
      );
      const attemptId =
        `qualification:${fixture.id}:${typedExecution}:${randomUUID()}`;
      const captureEvidence = artifactRun.evidenceSink({
        attemptId,
        fixtureId: fixture.id,
        fixtureHash: fixture.contentHash,
        execution: typedExecution,
        prose: fixture.prose,
        critique: null,
        provider: 'openai',
        model: 'gpt-5.4-2026-03-05',
        contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
        instructionHash: sha256(AI_CRITIQUE_INSTRUCTIONS),
        schemaHash: sha256(JSON.stringify(AI_CRITIQUE_RESPONSE_SCHEMA)),
        parameterHash: sha256(providerBodyJson.replace(fixture.prose, '')),
        requestHash: sha256(providerBodyJson),
        normalizedHash: '',
        structuralValid: false,
        usage: null,
      });
      try {
        const result = await options.executeAttempt({
          attemptId,
          execution: typedExecution,
          fixture,
          providerBodyJson,
          captureEvidence,
        });
        await artifactRun.completeAttempt(attemptId, result);
      } catch (error) {
        await artifactRun.recordCaptureFailure({
          attemptId,
          fixtureId: fixture.id,
          execution: typedExecution,
        });
        console.error('[qualification:capture-failed]', {
          runId: artifactRun.runId,
          code: 'CAPTURE_ATTEMPT_FAILED',
          attemptId,
          fixtureId: fixture.id,
          execution: typedExecution,
        });
        throw error;
      }
    }
  }
  await artifactRun.completeCapture();
  await artifactRun.finalizePackets(randomUUID(), randomUUID());
  console.log('[qualification:capture-complete]', {
    runId: artifactRun.runId,
    runRoot: artifactRun.root,
    lifecycle: 'PACKETS_FINALIZED',
    attemptCount: 24,
  });
  return artifactRun;
}

const liveConfiguration = liveQualificationConfiguration(process.env);

describe('AI critique qualification v2', () => {
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

  it('requires every live gate while allowing exact repository HEAD derivation', () => {
    expect(liveQualificationConfiguration({})).toBeNull();
    expect(liveQualificationConfiguration({
      BLACK_SKIES_RUN_AI_QUALIFICATION: '1',
    })).toBeNull();
    expect(liveQualificationConfiguration({
      BLACK_SKIES_RUN_AI_QUALIFICATION: '1',
      BLACK_SKIES_AI_QUALIFICATION_API_KEY: 'synthetic',
    })).toBeNull();
    expect(liveQualificationConfiguration({
      BLACK_SKIES_RUN_AI_QUALIFICATION: '1',
      BLACK_SKIES_AI_QUALIFICATION_API_KEY: 'synthetic',
      BLACK_SKIES_AI_QUALIFICATION_OUTPUT_DIR: 'C:\\external',
    })).toEqual({
      credential: 'synthetic',
      outputRoot: 'C:\\external',
    });
    expect(resolveRepositoryHead(resolve(process.cwd(), '..'), {
      GIT_COMMIT: 'a'.repeat(40),
    })).toBe('a'.repeat(40));
    expect(() => resolveRepositoryHead(resolve(process.cwd(), '..'), {
      GIT_COMMIT: 'unrecorded-head',
    })).toThrow('exact repository HEAD');
  });

  it('binds the deterministic V2 instruction and contract identity into provider request bytes', () => {
    const fixture = AI_CRITIQUE_QUALIFICATION_FIXTURES_V1[0];
    const body = buildAiCritiqueProviderBody(fixture.prose);
    const serialized = serializeAiCritiqueProviderBody(body);
    expect(body.instructions).toBe(AI_CRITIQUE_INSTRUCTIONS);
    expect(body.text.format.name).toBe(AI_CRITIQUE_TASK_CONTRACT_VERSION);
    expect(serialized).toContain(JSON.stringify(AI_CRITIQUE_INSTRUCTIONS));
    expect(sha256(AI_CRITIQUE_INSTRUCTIONS)).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256(AI_CRITIQUE_INSTRUCTIONS)).not.toBe(
      '31b927362d569a254cb20614f2004ff130f513d1928cfb32109c580d5daf71c1',
    );
    expect(AI_CRITIQUE_TASK_CONTRACT_VERSION).not.toBe('black_skies_critique_v1');
    expect(sha256(serialized)).toBe(
      sha256(serializeAiCritiqueProviderBody(buildAiCritiqueProviderBody(fixture.prose))),
    );
  });

  it('runs the complete Windows-safe capture lifecycle through a mocked gateway', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-live-runner-mock-'));
    let mockedRequestCount = 0;
    const run = await runQualificationCapture({
      outputRoot,
      repositoryRoot: 'C:\\Dev\\black-skies',
      repositoryHead: 'b'.repeat(40),
      allowTemporaryRoot: true,
      runId: 'mocked-windows-runner',
      executeAttempt: async ({
        attemptId,
        fixture,
        providerBodyJson,
        captureEvidence,
      }) => {
        const gateway = new AiCritiqueGateway({
          fetch: async () => {
            mockedRequestCount += 1;
            return new Response(JSON.stringify({
              model: 'gpt-5.4-2026-03-05',
              status: 'completed',
              output: [{
                type: 'message',
                content: [{
                  type: 'output_text',
                  text: JSON.stringify({
                    overview: 'The selected passage was reviewed.',
                    strengths: [],
                    priorities: [],
                    uncertainties: [],
                    limitations: ['Selected passage only.'],
                  }),
                }],
              }],
              usage: {
                input_tokens: 100,
                input_tokens_details: { cached_tokens: 20 },
                output_tokens: 40,
              },
            }), { status: 200 });
          },
          evidenceSink: captureEvidence,
        });
        const result = await gateway.execute({
          requestId: attemptId,
          evidenceAttemptId: attemptId,
          credential: 'synthetic-never-networked',
          providerBodyJson,
          payloadHash: sha256(providerBodyJson),
          selectedText: fixture.prose,
          sourceFingerprint: fixture.contentHash,
          selectionFingerprint: fixture.contentHash,
          editorRevision: 0,
        });
        return {
          critique: result.content,
          normalizedHash: sha256(JSON.stringify(result.content)),
          structuralValid: true,
          usage: { calculatedUsd: result.usage.calculatedUsd },
        };
      },
    });
    expect(mockedRequestCount).toBe(24);
    const manifest = JSON.parse(await readFile(join(run.privateRoot, 'run-manifest.json'), 'utf8'));
    expect(manifest).toMatchObject({
      schemaVersion: QUALIFICATION_ARTIFACT_VERSION,
      state: 'PACKETS_FINALIZED',
      attemptCount: 24,
      repositoryHead: 'b'.repeat(40),
      contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
    });
    expect(await readdir(join(run.privateRoot, 'raw-responses'))).toHaveLength(24);
    await expect(readFile(join(run.root, 'reviewer-a', 'packet.json'), 'utf8')).resolves.toContain('"reviewer":"reviewer-a"');
    await expect(readFile(join(run.root, 'reviewer-b', 'packet.json'), 'utf8')).resolves.toContain('"reviewer":"reviewer-b"');
    await expect(readFile(join(run.root, 'reviewer-a', 'score-template.json'), 'utf8')).resolves.toContain('"independentAttestation":false');
    await expect(readFile(join(run.root, 'reviewer-b', 'score-template.json'), 'utf8')).resolves.toContain('"independentAttestation":false');
    await expect(readFile(join(run.root, 'receipt', 'qualification-receipt.json'), 'utf8')).rejects.toThrow();
  });

  it('records a mocked runner failure without retrying or finalizing review artifacts', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'black-skies-live-runner-failure-'));
    let calls = 0;
    await expect(runQualificationCapture({
      outputRoot,
      repositoryRoot: 'C:\\Dev\\black-skies',
      repositoryHead: 'c'.repeat(40),
      allowTemporaryRoot: true,
      runId: 'mocked-partial-runner',
      executeAttempt: async ({
        attemptId,
        fixture,
        providerBodyJson,
        captureEvidence,
      }) => {
        calls += 1;
        if (calls === 3) throw new Error('mocked transport failure');
        const gateway = new AiCritiqueGateway({
          fetch: async () => new Response(JSON.stringify({
            model: 'gpt-5.4-2026-03-05',
            status: 'completed',
            output: [{
              type: 'message',
              content: [{
                type: 'output_text',
                text: JSON.stringify({
                  overview: 'Mocked result.',
                  strengths: [],
                  priorities: [],
                  uncertainties: [],
                  limitations: [],
                }),
              }],
            }],
            usage: {
              input_tokens: 100,
              input_tokens_details: { cached_tokens: 20 },
              output_tokens: 40,
            },
          }), { status: 200 }),
          evidenceSink: captureEvidence,
        });
        const result = await gateway.execute({
          requestId: attemptId,
          evidenceAttemptId: attemptId,
          credential: 'synthetic-never-networked',
          providerBodyJson,
          payloadHash: sha256(providerBodyJson),
          selectedText: fixture.prose,
          sourceFingerprint: fixture.contentHash,
          selectionFingerprint: fixture.contentHash,
          editorRevision: 0,
        });
        return {
          critique: result.content,
          normalizedHash: sha256(JSON.stringify(result.content)),
          structuralValid: true,
          usage: { calculatedUsd: result.usage.calculatedUsd },
        };
      },
    })).rejects.toThrow('mocked transport failure');
    expect(calls).toBe(3);
    const runRoot = join(outputRoot, 'mocked-partial-runner');
    const manifest = JSON.parse(await readFile(join(runRoot, 'private', 'run-manifest.json'), 'utf8'));
    expect(manifest).toMatchObject({
      state: 'CAPTURE_FAILED',
      attemptCount: 2,
      contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
      captureFailure: {
        code: 'CAPTURE_ATTEMPT_FAILED',
        execution: 1,
      },
    });
    await expect(readFile(join(runRoot, 'reviewer-a', 'packet.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(runRoot, 'reviewer-a', 'score-template.json'), 'utf8')).rejects.toThrow();
    await expect(readFile(join(runRoot, 'receipt', 'qualification-receipt.json'), 'utf8')).rejects.toThrow();
  });

  it.skipIf(!liveConfiguration)(
    'runs two independent schema-and-evidence-valid requests for every frozen fixture',
    async () => {
      const repositoryRoot = resolve(process.cwd(), '..');
      const run = await runQualificationCapture({
        outputRoot: liveConfiguration!.outputRoot,
        repositoryRoot,
        repositoryHead: resolveRepositoryHead(repositoryRoot, process.env),
        executeAttempt: async ({
          attemptId,
          fixture,
          providerBodyJson,
          captureEvidence,
        }) => {
          const gateway = new AiCritiqueGateway({ evidenceSink: captureEvidence });
          const result = await gateway.execute({
            requestId: attemptId,
            evidenceAttemptId: attemptId,
            credential: liveConfiguration!.credential,
            providerBodyJson,
            payloadHash: sha256(providerBodyJson),
            selectedText: fixture.prose,
            sourceFingerprint: fixture.contentHash,
            selectionFingerprint: fixture.contentHash,
            editorRevision: 0,
          });
          expect(result.sourceFingerprint).toBe(fixture.contentHash);
          return {
            critique: result.content,
            normalizedHash: sha256(JSON.stringify(result.content)),
            structuralValid: true,
            usage: { calculatedUsd: result.usage.calculatedUsd },
          };
        },
      });
      const manifest = JSON.parse(await readFile(join(run.privateRoot, 'run-manifest.json'), 'utf8'));
      expect(manifest).toMatchObject({
        state: 'PACKETS_FINALIZED',
        attemptCount: 24,
        contractVersion: AI_CRITIQUE_TASK_CONTRACT_VERSION,
        repositoryHead: resolveRepositoryHead(repositoryRoot, process.env),
      });
    },
    40 * 60 * 1000,
  );
});
