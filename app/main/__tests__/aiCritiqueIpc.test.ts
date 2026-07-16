import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AI_CRITIQUE_CHANNELS, AI_CRITIQUE_MODEL } from '../../shared/ipc/aiCritique';
import { sha256 } from '../aiCritiqueCoordinator';
import { AiCritiqueGateway } from '../aiCritiqueGateway';

const electronMocks = vi.hoisted(() => {
  const handlers = new Map<string, (event: any, request?: any) => Promise<any> | any>();
  return {
    handlers,
    handle: vi.fn((channel: string, handler: (event: any, request?: any) => Promise<any> | any) => {
      handlers.set(channel, handler);
    }),
    removeHandler: vi.fn((channel: string) => handlers.delete(channel)),
  };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: electronMocks.handle,
    removeHandler: electronMocks.removeHandler,
  },
}));

import {
  invalidateAllAiCritiqueArtifacts,
  registerAiCritiqueIpc,
  resetAiCritiqueIpcForTests,
} from '../aiCritiqueIpc';

const passage =
  'Rain worried the station roof while Mara counted the dark panes between each lamp. ' +
  'The timetable promised a train at midnight, but the clock had stopped at eleven forty-three. ' +
  'She kept her ticket folded in her glove and listened for wheels that never came, refusing to name the person who had asked her to wait. ' +
  'Across the tracks, a red signal blinked with the patience of an unanswered question.';

let generation = 3;
let revision = 9;
const sent: unknown[] = [];

function snapshot() {
  return {
    schemaVersion: 1 as const,
    role: 'writing' as const,
    generation,
    revision,
    project: {
      projectId: 'project-a',
      path: 'C:/projects/a',
      title: 'A',
      schemaVersion: 'ProjectMetadataSchema v1' as const,
      units: [{ id: 'unit-a', title: 'Unit A', displayTitle: 'Unit A', order: 0 }],
      drafts: { 'unit-a': passage },
    },
    activeUnitId: 'unit-a',
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean' as const, unitId: null, message: null },
    lastError: null,
    recovery: { status: 'none' as const, candidates: [] as const },
  };
}

function event(senderId: number) {
  return {
    sender: {
      id: senderId,
      isDestroyed: () => false,
      send: (_channel: string, state: unknown) => sent.push(state),
    },
  };
}

function invoke(channel: string, senderId: number, request?: unknown): Promise<any> {
  const handler = electronMocks.handlers.get(channel);
  if (!handler) throw new Error(`Missing IPC handler ${channel}`);
  return Promise.resolve(handler(event(senderId), request));
}

function selection() {
  return {
    projectId: 'project-a',
    unitId: 'unit-a',
    generation,
    projectRevision: revision,
    selectionStart: 0,
    selectionEnd: passage.length,
    selectedText: passage,
    editorRevision: 4,
    sourceFingerprint: sha256(passage),
    selectionFingerprint: sha256(passage),
  };
}

describe('AI critique IPC authority', () => {
  beforeEach(() => {
    resetAiCritiqueIpcForTests();
    electronMocks.handlers.clear();
    sent.length = 0;
    generation = 3;
    revision = 9;
  });

  it('registers only bounded channels and rejects command or unknown senders', async () => {
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : id === 2 ? 'command' : null),
      getWritingSnapshot: snapshot,
    });

    expect([...electronMocks.handlers.keys()].sort()).toEqual(
      Object.values(AI_CRITIQUE_CHANNELS).filter((channel) => channel !== AI_CRITIQUE_CHANNELS.stateChanged).sort(),
    );
    await expect(invoke(AI_CRITIQUE_CHANNELS.prepare, 2, {
      operationId: 'command-attempt',
      selection: selection(),
    })).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
    await expect(invoke(AI_CRITIQUE_CHANNELS.prepare, 99, {
      operationId: 'unknown-attempt',
      selection: selection(),
    })).resolves.toMatchObject({ ok: false, error: { code: 'NOT_WRITING_STUDIO' } });
  });

  it('keeps credentials session-only with status but no readback', async () => {
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : null),
      getWritingSnapshot: snapshot,
    });
    expect(await invoke(AI_CRITIQUE_CHANNELS.credentialStatus, 1)).toEqual({ configured: false });
    expect(await invoke(AI_CRITIQUE_CHANNELS.setCredential, 1, 'synthetic-session-credential-123456')).toEqual({
      ok: true,
      data: { configured: true },
    });
    expect(await invoke(AI_CRITIQUE_CHANNELS.credentialStatus, 1)).toEqual({ configured: true });
    expect(JSON.stringify(sent)).not.toContain('synthetic-session-credential');
    expect(await invoke(AI_CRITIQUE_CHANNELS.clearCredential, 1)).toEqual({ configured: false });
  });

  it('binds approval to the same sender, artifact, operation, and current main snapshot', async () => {
    const execute = vi.fn();
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : null),
      getWritingSnapshot: snapshot,
      execute,
    });
    await invoke(AI_CRITIQUE_CHANNELS.setCredential, 1, 'synthetic-session-credential-123456');
    const prepared = await invoke(AI_CRITIQUE_CHANNELS.prepare, 1, {
      operationId: 'critique-1',
      selection: selection(),
    });
    const approved = await invoke(AI_CRITIQUE_CHANNELS.approveAndExecute, 1, {
      operationId: 'critique-1',
      requestId: prepared.data.requestId,
      payloadHash: prepared.data.payloadHash,
      editorRevision: 4,
      sourceFingerprint: sha256(passage),
      selectionFingerprint: sha256(passage),
      transmissionConfirmed: true,
      authorizationCeilingUsd: 0.1,
    });
    expect(approved).toEqual({
      ok: true,
      data: { requestId: prepared.data.requestId, operationId: 'critique-1' },
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][0].credential).toBe('synthetic-session-credential-123456');

    const replay = await invoke(AI_CRITIQUE_CHANNELS.approveAndExecute, 1, {
      operationId: 'critique-1',
      requestId: prepared.data.requestId,
      payloadHash: prepared.data.payloadHash,
      editorRevision: 4,
      sourceFingerprint: sha256(passage),
      selectionFingerprint: sha256(passage),
      transmissionConfirmed: true,
      authorizationCeilingUsd: 0.1,
    });
    expect(replay).toMatchObject({ ok: false, error: { code: 'REQUEST_TERMINAL' } });
  });

  it('invalidates active artifacts on Project Spine lifecycle publication', async () => {
    const cancelExecution = vi.fn();
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : null),
      getWritingSnapshot: snapshot,
      cancelExecution,
    });
    const prepared = await invoke(AI_CRITIQUE_CHANNELS.prepare, 1, {
      operationId: 'critique-1',
      selection: selection(),
    });
    invalidateAllAiCritiqueArtifacts();
    expect(sent).toContainEqual({ requestId: prepared.data.requestId, status: 'invalidated' });
    expect(cancelExecution).toHaveBeenCalledWith(prepared.data.requestId);
  });

  it('does not accept a renderer snapshot after main generation changes', async () => {
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : null),
      getWritingSnapshot: snapshot,
    });
    const stale = selection();
    generation += 1;
    await expect(invoke(AI_CRITIQUE_CHANNELS.prepare, 1, {
      operationId: 'critique-stale',
      selection: stale,
    })).resolves.toMatchObject({ ok: false, error: { code: 'STALE_SESSION' } });
  });

  it('executes the production coordinator-to-gateway path and publishes terminal output', async () => {
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(async () => new Response(JSON.stringify({
        model: AI_CRITIQUE_MODEL,
        status: 'completed',
        output: [{
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify({
            overview: 'The passage sustains anticipation.',
            strengths: [],
            priorities: [{
              evidence: 'the clock had stopped at eleven forty-three',
              observation: 'The stopped clock sharpens the temporal pressure.',
              impact: 'It reinforces the delayed-arrival tension.',
              revisionQuestion: 'Should its cause remain ambiguous?',
            }],
            uncertainties: [],
            limitations: ['Selected passage only.'],
          }) }],
        }],
        usage: {
          input_tokens: 300,
          input_tokens_details: { cached_tokens: 0 },
          output_tokens: 120,
        },
      }), { status: 200 })),
      now: () => Date.parse('2026-07-14T12:00:00Z'),
    });
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : null),
      getWritingSnapshot: snapshot,
      gateway,
    });
    await invoke(AI_CRITIQUE_CHANNELS.setCredential, 1, 'session-credential-value-123456');
    const prepared = await invoke(AI_CRITIQUE_CHANNELS.prepare, 1, {
      operationId: 'critique-live',
      selection: selection(),
    });
    const approved = await invoke(AI_CRITIQUE_CHANNELS.approveAndExecute, 1, {
      operationId: 'critique-live',
      requestId: prepared.data.requestId,
      payloadHash: prepared.data.payloadHash,
      editorRevision: 4,
      sourceFingerprint: sha256(passage),
      selectionFingerprint: sha256(passage),
      transmissionConfirmed: true,
      authorizationCeilingUsd: 0.1,
    });
    expect(approved.ok).toBe(true);
    await vi.waitFor(() => {
      expect(sent).toContainEqual(expect.objectContaining({
        requestId: prepared.data.requestId,
        status: 'completed',
        result: expect.objectContaining({ model: AI_CRITIQUE_MODEL }),
      }));
    });
    expect(sent.map((state: any) => state.status)).toEqual(['approved', 'executing', 'completed']);
    expect(JSON.stringify(sent)).not.toContain('session-credential-value');
  });

  it('cancels the production gateway path and discards a late provider response', async () => {
    let resolveFetch!: (response: Response) => void;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const gateway = new AiCritiqueGateway({
      fetch: vi.fn(() => pendingFetch),
      now: () => Date.parse('2026-07-14T12:00:00Z'),
    });
    registerAiCritiqueIpc({
      processSessionId: 'session-a',
      resolveWindowRole: (id) => (id === 1 ? 'writing' : null),
      getWritingSnapshot: snapshot,
      gateway,
    });
    await invoke(AI_CRITIQUE_CHANNELS.setCredential, 1, 'session-credential-value-123456');
    const prepared = await invoke(AI_CRITIQUE_CHANNELS.prepare, 1, {
      operationId: 'critique-cancelled',
      selection: selection(),
    });
    await invoke(AI_CRITIQUE_CHANNELS.approveAndExecute, 1, {
      operationId: 'critique-cancelled',
      requestId: prepared.data.requestId,
      payloadHash: prepared.data.payloadHash,
      editorRevision: 4,
      sourceFingerprint: sha256(passage),
      selectionFingerprint: sha256(passage),
      transmissionConfirmed: true,
      authorizationCeilingUsd: 0.1,
    });
    const cancelled = await invoke(AI_CRITIQUE_CHANNELS.cancel, 1, {
      operationId: 'critique-cancelled',
      requestId: prepared.data.requestId,
    });
    expect(cancelled).toMatchObject({
      ok: true,
      data: { requestId: prepared.data.requestId, status: 'cancelled' },
    });

    resolveFetch(new Response(JSON.stringify({
      model: AI_CRITIQUE_MODEL,
      status: 'completed',
      output: [{
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify({
          overview: 'This late result must be discarded.',
          strengths: [],
          priorities: [],
          uncertainties: [],
          limitations: ['Selected passage only.'],
        }) }],
      }],
      usage: {
        input_tokens: 300,
        input_tokens_details: { cached_tokens: 0 },
        output_tokens: 120,
      },
    }), { status: 200 }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sent.map((state: any) => state.status)).toEqual([
      'approved',
      'executing',
      'cancelled',
    ]);
    expect(JSON.stringify(sent)).not.toContain('This late result must be discarded.');
  });
});
