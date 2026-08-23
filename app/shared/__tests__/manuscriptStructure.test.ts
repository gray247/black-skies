import { describe, expect, it } from 'vitest';

import {
  buildManuscriptStructureAnchor,
  discoverManuscriptStructure,
  normalizeManuscriptSource,
  resolveManuscriptStructureAnchor,
} from '../manuscriptStructure';

describe('deterministic manuscript structure discovery', () => {
  it('normalizes line endings without changing substantive content', () => {
    expect(normalizeManuscriptSource('one\r\ntwo\rthree')).toBe('one\ntwo\nthree');
  });

  it('prefers headings and thematic breaks over paragraph boundaries', async () => {
    const source = '# Opening\nFirst paragraph.\n\n---\nSecond paragraph.';
    const document = await discoverManuscriptStructure(source, { now: () => new Date('2026-08-22T00:00:00.000Z') });
    expect(document.proposals.map((proposal) => proposal.provenance)).toEqual(['heading', 'separator']);
    expect(document.proposals.map((proposal) => proposal.state)).toEqual(['proposed', 'proposed']);
    expect(document.proposals[0]?.id).toBe((await discoverManuscriptStructure(source)).proposals[0]?.id);
  });

  it('uses paragraph and whole-document fallback discovery', async () => {
    const paragraphs = await discoverManuscriptStructure('First paragraph.\n\nSecond paragraph.');
    expect(paragraphs.proposals.map((proposal) => proposal.provenance)).toEqual(['paragraph', 'paragraph']);
    const fallback = await discoverManuscriptStructure('single uninterrupted manuscript');
    expect(fallback.proposals[0]?.provenance).toBe('fallback');
  });

  it('preserves rejected proposal state on rediscovery', async () => {
    const source = '# One\nText\n\n# Two\nText';
    const first = await discoverManuscriptStructure(source);
    const prior = { ...first, proposals: first.proposals.map((proposal, index) => index === 0 ? { ...proposal, state: 'rejected' as const } : proposal) };
    const rediscovered = await discoverManuscriptStructure(source, { prior });
    expect(rediscovered.proposals[0]?.state).toBe('rejected');
  });
});

describe('manuscript structure anchors', () => {
  it('relocates exact selected spans and refuses ambiguous matches', async () => {
    const source = 'before selected passage after';
    const selectionStart = source.indexOf('selected passage');
    const anchor = await buildManuscriptStructureAnchor(source, selectionStart, selectionStart + 'selected passage'.length);
    await expect(resolveManuscriptStructureAnchor(anchor, 'new before selected passage after')).resolves.toMatchObject({
      status: 'relocated',
      selectionStart: 11,
    });
    await expect(resolveManuscriptStructureAnchor(anchor, 'selected passage selected passage')).resolves.toEqual({ status: 'ambiguous' });
  });

  it('marks cursor-only anchors stale after the source changes', async () => {
    const anchor = await buildManuscriptStructureAnchor('unique manuscript text', 3, 3);
    await expect(resolveManuscriptStructureAnchor(anchor, 'changed source')).resolves.toEqual({ status: 'stale' });
    expect(JSON.stringify(anchor)).not.toContain('unique manuscript');
  });
});
