import type {
  ConfidenceBandV1,
  EmotionGraphIntensityV1,
  StoryPositionRefV1,
} from './ipc/storyIntelligence.js';

export const LOCAL_EMOTION_ANALYSIS_SCHEMA_VERSION =
  'BlackSkiesLocalEmotionAnalysis v1' as const;
export const LOCAL_EMOTION_ANALYSIS_BOUNDS = {
  maxEmotionLength: 120,
  maxSubjectLength: 160,
  maxSummaryLength: 700,
  maxEvidenceLength: 240,
} as const;

export interface LocalEmotionAnalysisModelOutputV1 {
  readonly emotion: string;
  readonly intensity: EmotionGraphIntensityV1;
  readonly confidence: ConfidenceBandV1;
  readonly subject: string;
  readonly summary: string;
  readonly evidence: string;
}

export interface LocalEmotionEvidenceAnchorV1 {
  readonly text: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectionFingerprint: string;
}

export interface LocalEmotionAnalysisParsedV1 {
  readonly output: LocalEmotionAnalysisModelOutputV1;
  readonly anchor: LocalEmotionEvidenceAnchorV1 | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).sort().join('|') === [...keys].sort().join('|');
}

function bounded(value: unknown, maxLength: number, allowEmpty = false): value is string {
  return typeof value === 'string' && (allowEmpty || value.length > 0) && value.length <= maxLength;
}

function intensity(value: unknown): value is EmotionGraphIntensityV1 {
  return value === 'very-low' || value === 'low' || value === 'medium' || value === 'high' ||
    value === 'very-high' || value === 'unknown';
}

function findUniqueEvidence(
  body: string,
  evidence: string,
  sha256: (value: string) => string,
): LocalEmotionEvidenceAnchorV1 | null {
  if (evidence.length === 0) return null;
  const first = body.indexOf(evidence);
  if (first < 0) return null;
  const second = body.indexOf(evidence, first + 1);
  if (second >= 0) return null;
  return {
    text: evidence,
    selectionStart: first,
    selectionEnd: first + evidence.length,
    selectionFingerprint: sha256(evidence),
  };
}

export function parseLocalEmotionAnalysisModelText(
  value: unknown,
  body: string,
  sha256: (value: string) => string,
): LocalEmotionAnalysisParsedV1 | null {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!isRecord(parsed) || !exactKeys(parsed, ['emotion', 'intensity', 'confidence', 'subject', 'summary', 'evidence'])) {
    return null;
  }
  if (
    !bounded(parsed.emotion, LOCAL_EMOTION_ANALYSIS_BOUNDS.maxEmotionLength) ||
    !intensity(parsed.intensity) ||
    !['low', 'medium', 'high'].includes(String(parsed.confidence)) ||
    !bounded(parsed.subject, LOCAL_EMOTION_ANALYSIS_BOUNDS.maxSubjectLength, true) ||
    !bounded(parsed.summary, LOCAL_EMOTION_ANALYSIS_BOUNDS.maxSummaryLength) ||
    !bounded(parsed.evidence, LOCAL_EMOTION_ANALYSIS_BOUNDS.maxEvidenceLength, true)
  ) return null;
  const output: LocalEmotionAnalysisModelOutputV1 = {
    emotion: parsed.emotion.trim(),
    intensity: parsed.intensity,
    confidence: parsed.confidence as ConfidenceBandV1,
    subject: parsed.subject.trim(),
    summary: parsed.summary.trim(),
    evidence: parsed.evidence,
  };
  if (!output.emotion || !output.summary) return null;
  const anchor = findUniqueEvidence(body, output.evidence, sha256);
  if (anchor === null) return null;
  return { output, anchor };
}

export function sourceRefWithLocalEmotionAnchor(
  sourceRef: StoryPositionRefV1,
  anchor: LocalEmotionEvidenceAnchorV1 | null,
): StoryPositionRefV1 {
  if (anchor === null) return sourceRef;
  return {
    ...sourceRef,
    selectionStart: anchor.selectionStart,
    selectionEnd: anchor.selectionEnd,
    selectionFingerprint: anchor.selectionFingerprint,
  };
}
