import { describe, expect, it } from 'vitest';

import {
  buildProgram7SourceEnvelope,
  resolveProgram7SourceBinding,
} from '../program7SourceBinding';

describe('Program 7 source binding', () => {
  it('normalizes CRLF and stores exact UTF-16 coordinates and body hash', async () => {
    const envelope = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 4,
      unitId: 'unit-a',
      sourceText: 'Before\r\nSelected 😀\r\nAfter',
      selectionStart: 7,
      selectionEnd: 18,
      findingId: 'finding-a',
    });

    expect(envelope.text).toBe('Before\nSelected 😀\nAfter');
    expect(envelope.bodySha256).toMatch(/^[a-f0-9]{64}$/);
    expect(envelope.anchor).toMatchObject({
      anchorKind: 'span',
      selectionStart: 7,
      selectionEnd: 18,
      sourceFingerprint: envelope.bodySha256,
    });
    expect(envelope.sourceRef).toMatchObject({
      bodySha256: envelope.bodySha256,
      selectionStart: 7,
      selectionEnd: 18,
    });
    expect((envelope as unknown as Record<string, unknown>).revision).toBeUndefined();
  });

  it('returns exact, uniquely relocated, ambiguous, and stale states without silent reattachment', async () => {
    const exact = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'Selected passage',
      selectionStart: 0,
      selectionEnd: 16,
    });
    await expect(resolveProgram7SourceBinding(exact, 'Selected passage')).resolves.toMatchObject({
      status: 'exact',
      selectionStart: 0,
      selectionEnd: 16,
    });

    const relocated = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'Selected passage',
      selectionStart: 0,
      selectionEnd: 16,
    });
    await expect(
      resolveProgram7SourceBinding(relocated, 'New Selected passage'),
    ).resolves.toMatchObject({ status: 'relocated', selectionStart: 4, selectionEnd: 20 });

    const ambiguous = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'Selected',
      selectionStart: 0,
      selectionEnd: 8,
    });
    await expect(
      resolveProgram7SourceBinding(ambiguous, 'Selected Selected'),
    ).resolves.toMatchObject({ status: 'ambiguous' });

    await expect(resolveProgram7SourceBinding(exact, 'Other text')).resolves.toMatchObject({
      status: 'stale',
    });
  });

  it('returns unavailable and protected metadata-only envelopes without source text', async () => {
    const protectedEnvelope = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'P7_PROTECTED_SENTINEL_7F3A',
      sourceClass: 'protected',
      findingId: 'finding-protected',
    });
    expect(protectedEnvelope.protection).toEqual({ sourceClass: 'protected', metadataOnly: true });
    expect(protectedEnvelope.text).toBeUndefined();
    expect(JSON.stringify(protectedEnvelope)).not.toContain('P7_PROTECTED_SENTINEL_7F3A');
    await expect(
      resolveProgram7SourceBinding(protectedEnvelope, 'P7_PROTECTED_SENTINEL_7F3A'),
    ).resolves.toMatchObject({ status: 'protected' });
    const ordinary = await buildProgram7SourceEnvelope({
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
    });
    expect(ordinary.bodySha256).toBeUndefined();
    await expect(resolveProgram7SourceBinding(ordinary)).resolves.toMatchObject({
      status: 'unavailable',
    });
  });

  it('derives and verifies the body hash when source text is supplied', async () => {
    await expect(
      buildProgram7SourceEnvelope({
        projectId: 'project-a',
        generation: 1,
        unitId: 'unit-a',
        sourceText: 'source text',
        bodySha256: 'b'.repeat(64),
      }),
    ).rejects.toThrow('does not match');
  });

  it('rejects incomplete, negative, and out-of-bounds exact coordinates', async () => {
    const base = {
      projectId: 'project-a',
      generation: 1,
      unitId: 'unit-a',
      sourceText: 'short source',
    };
    await expect(buildProgram7SourceEnvelope({ ...base, selectionStart: 1 })).rejects.toThrow(
      'complete in-bounds',
    );
    await expect(
      buildProgram7SourceEnvelope({ ...base, selectionStart: -1, selectionEnd: 1 }),
    ).rejects.toThrow('complete in-bounds');
    await expect(
      buildProgram7SourceEnvelope({ ...base, selectionStart: 1, selectionEnd: 99 }),
    ).rejects.toThrow('complete in-bounds');
    await expect(
      buildProgram7SourceEnvelope({
        projectId: 'project-a',
        generation: 1,
        unitId: 'unit-a',
        selectionStart: 0,
        selectionEnd: 1,
      }),
    ).rejects.toThrow('sourceText');
  });

  it('rejects a mismatched stored selection fingerprint for an exact range', async () => {
    await expect(
      buildProgram7SourceEnvelope({
        projectId: 'project-a',
        generation: 1,
        unitId: 'unit-a',
        sourceText: 'Selected passage',
        selectionStart: 0,
        selectionEnd: 8,
        selectionFingerprint: 'a'.repeat(64),
      }),
    ).rejects.toThrow('selectionFingerprint');
  });
});
