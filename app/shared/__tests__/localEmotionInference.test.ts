import { describe, expect, it } from 'vitest';

import {
  parseLocalEmotionAnalysisModelText,
  sourceRefWithLocalEmotionAnchor,
} from '../localEmotionInference';

const sha256 = (value: string): string => `hash:${value}`;

describe('local emotion inference contract', () => {
  it('accepts a bounded structured observation and resolves a unique quote', () => {
    const parsed = parseLocalEmotionAnalysisModelText(JSON.stringify({
      emotion: 'dread',
      intensity: 'high',
      confidence: 'medium',
      subject: 'Mara',
      summary: 'The passage conveys growing dread.',
      evidence: 'Mara felt fear',
    }), 'Mara felt fear in the dark.', sha256);
    expect(parsed).toMatchObject({
      output: { emotion: 'dread', intensity: 'high', confidence: 'medium' },
      anchor: { selectionStart: 0, selectionEnd: 14, selectionFingerprint: 'hash:Mara felt fear' },
    });
  });

  it('rejects unknown keys and invalid intensity values', () => {
    expect(parseLocalEmotionAnalysisModelText({
      emotion: 'dread', intensity: 'high', confidence: 'medium', subject: '', summary: 'x', evidence: '', extra: true,
    }, 'text', sha256)).toBeNull();
    expect(parseLocalEmotionAnalysisModelText({
      emotion: 'dread', intensity: 'certain', confidence: 'medium', subject: '', summary: 'x', evidence: '',
    }, 'text', sha256)).toBeNull();
  });

  it('rejects ambiguous or fabricated evidence instead of inventing coordinates', () => {
    const output = { emotion: 'fear', intensity: 'medium', confidence: 'low', subject: '', summary: 'A cue.', evidence: 'fear' };
    expect(parseLocalEmotionAnalysisModelText(output, 'fear and fear', sha256)).toBeNull();
    expect(parseLocalEmotionAnalysisModelText(output, 'joy', sha256)).toBeNull();
    expect(parseLocalEmotionAnalysisModelText({ ...output, evidence: '' }, 'joy', sha256)).toBeNull();
  });

  it('preserves the unit source and adds only a verified exact anchor', () => {
    const parsed = parseLocalEmotionAnalysisModelText({
      emotion: 'hope', intensity: 'low', confidence: 'high', subject: '', summary: 'A small hope.', evidence: 'hope',
    }, 'A small hope.', sha256);
    const source = {
      projectId: 'project-a', sourceKind: 'manuscript' as const, sourceId: 'unit-a', sourceRevision: 7,
      sourceFingerprint: 'body', unitId: 'unit-a', orderIndex: 1, orderBasis: 'manuscript' as const,
    };
    expect(sourceRefWithLocalEmotionAnchor(source, parsed?.anchor ?? null)).toMatchObject({
      unitId: 'unit-a', selectionStart: 8, selectionEnd: 12, selectionFingerprint: 'hash:hope',
    });
  });
});
