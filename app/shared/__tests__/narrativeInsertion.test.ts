import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  calculateNarrativeInsertion,
  type NarrativeInsertionCandidateV1,
} from '../narrativeInsertion';

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function candidate(
  sourceText: string,
  start: number,
  end: number,
  candidateText = 'Replacement',
): NarrativeInsertionCandidateV1 {
  return {
    projectId: 'project-a',
    unitId: 'unit-a',
    sourceSnapshot: { unitId: 'unit-a', bodySha256: hash(sourceText), text: sourceText },
    sourceAnchor: {
      unitId: 'unit-a',
      selectionStart: start,
      selectionEnd: end,
      selectionFingerprint: hash(sourceText.slice(start, end)),
    },
    candidateText,
    editedCandidateText: null,
  };
}

describe('Narrative Insertion calculation', () => {
  it('calculates accept-all replacement and an exact accepted-result fingerprint', async () => {
    const source = 'Before selected passage after.';
    const result = await calculateNarrativeInsertion({
      candidate: candidate(source, 7, 23, 'A new passage.'),
      currentBody: source,
      mode: 'accept-all',
    });
    expect(result).toMatchObject({
      status: 'ready',
      sourceCurrent: true,
      replacement: {
        sourceStart: 7,
        sourceEnd: 23,
        text: 'A new passage.',
      },
      acceptedResultSha256: hash('Before A new passage. after.'),
    });
  });

  it('calculates candidate-selected-text replacement without changing outside text', async () => {
    const source = 'Before selected passage after.';
    const result = await calculateNarrativeInsertion({
      candidate: candidate(source, 7, 23, 'Keep NEW words.'),
      currentBody: source,
      mode: 'accept-selected-text',
      candidateSelection: { selectionStart: 5, selectionEnd: 8 },
    });
    expect(result).toMatchObject({
      status: 'ready',
      replacement: { sourceStart: 7, sourceEnd: 23, candidateStart: 5, candidateEnd: 8, text: 'NEW' },
      acceptedResultSha256: hash('Before NEW after.'),
    });
  });

  it('uses the edited candidate only for the explicit edited-before-acceptance mode', async () => {
    const source = 'Before selected passage after.';
    const item = candidate(source, 7, 23, 'Generated text.');
    const result = await calculateNarrativeInsertion({
      candidate: { ...item, editedCandidateText: 'Author edited text.' },
      currentBody: source,
      mode: 'accept-edited-before-acceptance',
    });
    expect(result).toMatchObject({
      status: 'ready',
      replacement: { text: 'Author edited text.' },
      candidateTextSha256: hash('Author edited text.'),
    });
  });

  it('blocks source drift until explicitly acknowledged and never silently relocates', async () => {
    const source = 'Before selected passage after.';
    const current = 'New prefix. Before selected passage after.';
    const item = candidate(source, 7, 23, 'Replacement.');
    const blocked = await calculateNarrativeInsertion({
      candidate: item,
      currentBody: current,
      mode: 'accept-all',
    });
    expect(blocked).toMatchObject({ status: 'blocked', blockingRisks: ['source-staleness'] });

    const acknowledged = await calculateNarrativeInsertion({
      candidate: item,
      currentBody: current,
      mode: 'accept-all',
      acknowledgedRisks: ['source-staleness'],
    });
    expect(acknowledged.status).toBe('blocked');
    expect(acknowledged.message).toMatch(/outside the current manuscript|safely anchored/);
  });

  it('blocks invalid source anchors and candidate selections', async () => {
    const source = 'Before selected passage after.';
    const invalidAnchor = await calculateNarrativeInsertion({
      candidate: {
        ...candidate(source, 7, 23),
        sourceAnchor: { ...candidate(source, 7, 23).sourceAnchor!, selectionFingerprint: hash('wrong') },
      },
      currentBody: source,
      mode: 'accept-all',
    });
    expect(invalidAnchor).toMatchObject({ status: 'blocked' });
    expect(invalidAnchor.message).toContain('anchor fingerprint');

    const invalidSelection = await calculateNarrativeInsertion({
      candidate: candidate(source, 7, 23, 'Candidate.'),
      currentBody: source,
      mode: 'accept-selected-text',
      candidateSelection: { selectionStart: 0, selectionEnd: 99 },
    });
    expect(invalidSelection).toMatchObject({ status: 'blocked' });
    expect(invalidSelection.message).toContain('selected candidate range');
  });

  it('requires acknowledgement for canon, continuity, and protected-content risks', async () => {
    const source = 'Before selected passage after.';
    const item = candidate(source, 7, 23, 'Replacement.');
    const blocked = await calculateNarrativeInsertion({
      candidate: { ...item, protection: { excluded: false, class: 'protected' } },
      currentBody: source,
      mode: 'accept-all',
      triggeredRisks: ['canon', 'continuity'],
    });
    expect(blocked).toMatchObject({
      status: 'blocked',
      blockingRisks: ['canon', 'continuity', 'protected-content'],
    });
    const acknowledged = await calculateNarrativeInsertion({
      candidate: { ...item, protection: { excluded: false, class: 'protected' } },
      currentBody: source,
      mode: 'accept-all',
      triggeredRisks: ['canon', 'continuity'],
      acknowledgedRisks: ['canon', 'continuity', 'protected-content'],
    });
    expect(acknowledged.status).toBe('ready');
  });
});
