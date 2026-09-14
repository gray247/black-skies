import { describe, expect, it } from 'vitest';

import {
  buildProgram7SourceEnvelope,
  type Program7SourceEnvelopeV1,
  resolveProgram7SourceBinding,
} from '../program7SourceBinding';
import { normalizeManuscriptSource } from '../manuscriptStructure';

function selectedRange(source: string, selected: string): { start: number; end: number } {
  const start = source.indexOf(selected);
  if (start < 0) throw new Error(`Fixture selection is missing: ${selected}`);
  return { start, end: start + selected.length };
}

const UNICODE_MARKDOWN_FIXTURES = [
  { name: 'ASCII', source: 'The author returned to the house.', selected: 'returned' },
  { name: 'accented Latin', source: 'Café déjà vu — naïve façade.', selected: 'déjà vu' },
  { name: 'combining mark', source: 'Cafe\u0301 and e\u0301lan.', selected: 'Cafe\u0301' },
  { name: 'emoji surrogate pair', source: 'The signal was 😀, then 👩‍💻 replied.', selected: '😀' },
  { name: 'CJK', source: '夜の庭で猫が眠る。', selected: '猫が眠る' },
  { name: 'right-to-left', source: 'שלום עולם — مرحبا بالعالم', selected: 'مرحبا بالعالم' },
  {
    name: 'Markdown source constructs',
    source: '# Heading\n- **bold** [link](https://example.test)\n```md\ncode *literal*\n```',
    selected: '**bold** [link](https://example.test)',
  },
] as const;

type NewlineVariant = { name: string; apply: (value: string) => string };

const NEWLINE_VARIANTS: readonly NewlineVariant[] = [
  { name: 'LF', apply: (value) => value },
  { name: 'CRLF', apply: (value) => value.replace(/\n/g, '\r\n') },
  { name: 'mixed', apply: (value) => value.replace('\n', '\r\n').replace('\n', '\n') },
];

function envelopeFor(source: string, selected: string): Promise<Program7SourceEnvelopeV1> {
  const normalized = normalizeManuscriptSource(source);
  const range = selectedRange(normalized, selected);
  return buildProgram7SourceEnvelope({
    projectId: 'project-unicode',
    generation: 7,
    unitId: 'unit-unicode',
    sourceText: source,
    selectionStart: range.start,
    selectionEnd: range.end,
  });
}

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

  it.each(UNICODE_MARKDOWN_FIXTURES)(
    'round-trips $name using UTF-16 source coordinates',
    async ({ name, source, selected }) => {
      const normalized = normalizeManuscriptSource(source);
      const range = selectedRange(normalized, selected);
      const envelope = await envelopeFor(source, selected);

      expect(envelope.text).toBe(normalized);
      expect(envelope.anchor).toMatchObject({
        selectionStart: range.start,
        selectionEnd: range.end,
        sourceFingerprint: envelope.bodySha256,
      });
      expect(envelope.anchor!.selectionEnd - envelope.anchor!.selectionStart).toBe(selected.length);
      expect(normalized.slice(range.start, range.end)).toBe(selected);
      if (name === 'emoji surrogate pair') {
        expect(selected.length).toBe(2);
        expect([...selected]).toHaveLength(1);
        expect(range.start).toBe('The signal was '.length);
        expect(normalized.indexOf('then')).toBe(range.end + 2);
      }
      await expect(resolveProgram7SourceBinding(envelope, normalized)).resolves.toMatchObject({
        status: 'exact',
        selectionStart: range.start,
        selectionEnd: range.end,
      });
    },
  );

  it.each(NEWLINE_VARIANTS)(
    'treats $name and normalized LF as the same current source',
    async ({ apply }) => {
      const source = apply('First line\n\n**Café 😀**\n- آخر سطر');
      const normalized = normalizeManuscriptSource(source);
      const selected = '**Café 😀**';
      const range = selectedRange(normalized, selected);
      const envelope = await buildProgram7SourceEnvelope({
        projectId: 'project-newlines',
        generation: 2,
        unitId: 'unit-newlines',
        sourceText: source,
        selectionStart: range.start,
        selectionEnd: range.end,
      });

      expect(envelope.text).toBe(normalized);
      await expect(resolveProgram7SourceBinding(envelope, normalized)).resolves.toMatchObject({
        status: 'exact',
        selectionStart: range.start,
        selectionEnd: range.end,
      });
      await expect(resolveProgram7SourceBinding(envelope, source)).resolves.toMatchObject({
        status: 'exact',
        selectionStart: range.start,
        selectionEnd: range.end,
      });
    },
  );

  it('keeps final-newline and no-final-newline currentness distinct while preserving anchor relocation', async () => {
    const source = '# End\nA final line';
    const selected = 'A final line';
    const envelope = await envelopeFor(source, selected);
    const range = selectedRange(source, selected);

    await expect(resolveProgram7SourceBinding(envelope, `${source}\n`)).resolves.toMatchObject({
      status: 'relocated',
      selectionStart: range.start,
      selectionEnd: range.end,
    });

    const bodyOnly = await buildProgram7SourceEnvelope({
      projectId: 'project-newline',
      generation: 1,
      unitId: 'unit-newline',
      sourceText: source,
    });
    await expect(resolveProgram7SourceBinding(bodyOnly, `${source}\n`)).resolves.toMatchObject({
      status: 'potentially-outdated',
    });
  });

  it('refuses a changed source without silently reattaching a UTF-16 anchor', async () => {
    const source = 'prefix 😀 selected suffix';
    const selected = 'selected';
    const envelope = await envelopeFor(source, selected);

    await expect(
      resolveProgram7SourceBinding(envelope, 'prefix 😀 changed suffix'),
    ).resolves.toMatchObject({
      status: 'stale',
    });
    await expect(
      resolveProgram7SourceBinding(envelope, 'selected selected'),
    ).resolves.toMatchObject({
      status: 'ambiguous',
    });
  });
});
