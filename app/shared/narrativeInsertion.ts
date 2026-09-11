import type { RevisionCandidateSourceAnchorV1 } from './ipc/revisionCandidates.js';

export const NARRATIVE_INSERTION_SCHEMA_VERSION = 'BlackSkiesNarrativeInsertion v1' as const;
export const NARRATIVE_INSERTION_MAX_TEXT_LENGTH = 6_000;

export type NarrativeInsertionModeV1 =
  | 'accept-all'
  | 'accept-selected-text'
  | 'accept-edited-before-acceptance';

export type NarrativeInsertionRiskV1 =
  | 'canon'
  | 'continuity'
  | 'protected-content'
  | 'source-staleness';

export interface NarrativeInsertionCandidateV1 {
  readonly projectId: string;
  readonly unitId: string;
  readonly sourceSnapshot: {
    readonly unitId: string;
    readonly bodySha256: string;
    readonly text: string;
  };
  readonly sourceAnchor: RevisionCandidateSourceAnchorV1 | null;
  readonly candidateText: string;
  readonly editedCandidateText: string | null;
  readonly protection?: {
    readonly excluded: boolean;
    readonly class: 'ordinary' | 'protected' | 'metadata-only' | 'ai-excluded';
  };
}

export interface NarrativeInsertionCandidateSelectionV1 {
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

export interface NarrativeInsertionCalculationRequestV1 {
  readonly candidate: NarrativeInsertionCandidateV1;
  readonly currentBody: string;
  readonly mode: NarrativeInsertionModeV1;
  readonly candidateSelection?: NarrativeInsertionCandidateSelectionV1;
  readonly triggeredRisks?: readonly NarrativeInsertionRiskV1[];
  readonly acknowledgedRisks?: readonly NarrativeInsertionRiskV1[];
}

export interface NarrativeInsertionReplacementV1 {
  readonly sourceStart: number;
  readonly sourceEnd: number;
  readonly candidateStart: number;
  readonly candidateEnd: number;
  readonly text: string;
}

export interface NarrativeInsertionCalculationV1 {
  readonly schemaVersion: typeof NARRATIVE_INSERTION_SCHEMA_VERSION;
  readonly status: 'ready' | 'blocked';
  readonly projectId: string;
  readonly unitId: string;
  readonly mode: NarrativeInsertionModeV1;
  readonly sourceBodySha256: string;
  readonly currentBodySha256: string;
  readonly candidateTextSha256: string;
  readonly acceptedResultSha256: string | null;
  readonly sourceCurrent: boolean;
  readonly replacement: NarrativeInsertionReplacementV1 | null;
  readonly risks: readonly NarrativeInsertionRiskV1[];
  readonly acknowledgedRisks: readonly NarrativeInsertionRiskV1[];
  readonly blockingRisks: readonly NarrativeInsertionRiskV1[];
  readonly message: string;
}

export class NarrativeInsertionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NarrativeInsertionValidationError';
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value.replace(/\r\n?/gu, '\n')),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalized(value: string): string {
  return value.replace(/\r\n?/gu, '\n');
}

function boundedSelection(
  selection: NarrativeInsertionCandidateSelectionV1 | null | undefined,
  length: number,
): selection is NarrativeInsertionCandidateSelectionV1 {
  if (selection === null || selection === undefined) return false;
  const { selectionStart, selectionEnd } = selection;
  return Number.isInteger(selectionStart) && Number.isInteger(selectionEnd) &&
    selectionStart >= 0 && selectionEnd >= selectionStart && selectionEnd <= length;
}

function uniqueRisks(values: readonly NarrativeInsertionRiskV1[] | undefined): NarrativeInsertionRiskV1[] {
  return [...new Set(values ?? [])];
}

function riskMessage(risks: readonly NarrativeInsertionRiskV1[]): string {
  return risks.length === 0 ? '' : ` Acknowledgement required for: ${risks.join(', ')}.`;
}

function blocked(
  request: NarrativeInsertionCalculationRequestV1,
  sourceBodySha256: string,
  currentBodySha256: string,
  candidateTextSha256: string,
  risks: readonly NarrativeInsertionRiskV1[],
  acknowledgedRisks: readonly NarrativeInsertionRiskV1[],
  blockingRisks: readonly NarrativeInsertionRiskV1[],
  message: string,
): NarrativeInsertionCalculationV1 {
  return {
    schemaVersion: NARRATIVE_INSERTION_SCHEMA_VERSION,
    status: 'blocked',
    projectId: request.candidate.projectId,
    unitId: request.candidate.unitId,
    mode: request.mode,
    sourceBodySha256,
    currentBodySha256,
    candidateTextSha256,
    acceptedResultSha256: null,
    sourceCurrent: sourceBodySha256 === currentBodySha256,
    replacement: null,
    risks,
    acknowledgedRisks,
    blockingRisks,
    message: `${message}${riskMessage(blockingRisks)}`,
  };
}

/**
 * Calculate an author-requested replacement without persisting anything.
 * The returned fingerprint is the exact complete body that a later truth-owner
 * save would be expected to produce.
 */
export async function calculateNarrativeInsertion(
  request: NarrativeInsertionCalculationRequestV1,
): Promise<NarrativeInsertionCalculationV1> {
  const candidate = request.candidate;
  const sourceText = normalized(candidate.sourceSnapshot.text);
  const currentBody = normalized(request.currentBody);
  const candidateText = normalized(
    request.mode === 'accept-edited-before-acceptance'
      ? candidate.editedCandidateText ?? ''
      : candidate.candidateText,
  );
  const sourceBodySha256 = await sha256(sourceText);
  const currentBodySha256 = await sha256(currentBody);
  const candidateTextSha256 = await sha256(candidateText);
  const risks = uniqueRisks([
    ...(request.triggeredRisks ?? []),
    ...(candidate.protection && (candidate.protection.excluded || candidate.protection.class !== 'ordinary')
      ? ['protected-content' as const]
      : []),
    ...(sourceBodySha256 !== currentBodySha256 ? ['source-staleness' as const] : []),
  ]);
  const acknowledgedRisks = uniqueRisks(request.acknowledgedRisks);
  const blockingRisks = risks.filter((risk) => !acknowledgedRisks.includes(risk));

  if (candidate.projectId.trim().length === 0 || candidate.unitId.trim().length === 0) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The candidate project or unit binding is incomplete.');
  }
  if (candidate.sourceSnapshot.unitId !== candidate.unitId || candidate.sourceAnchor?.unitId !== undefined && candidate.sourceAnchor.unitId !== candidate.unitId) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The candidate source binding does not match its unit.');
  }
  if (sourceBodySha256 !== candidate.sourceSnapshot.bodySha256) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The stored source body fingerprint does not match the stored source text.');
  }
  if (!candidateText || candidateText.length > NARRATIVE_INSERTION_MAX_TEXT_LENGTH) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The accepted candidate text is empty or exceeds the insertion limit.');
  }

  const anchor = candidate.sourceAnchor;
  let sourceStart = 0;
  let sourceEnd = sourceText.length;
  if (anchor) {
    if (anchor.selectionStart < 0 || anchor.selectionEnd < anchor.selectionStart || anchor.selectionEnd > sourceText.length) {
      return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The source anchor is outside the stored source body.');
    }
    const sourceSelectionSha256 = await sha256(sourceText.slice(anchor.selectionStart, anchor.selectionEnd));
    if (sourceSelectionSha256 !== anchor.selectionFingerprint) {
      return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The source anchor fingerprint does not match the stored source passage.');
    }
    sourceStart = anchor.selectionStart;
    sourceEnd = anchor.selectionEnd;
  }

  if (currentBodySha256 !== sourceBodySha256) {
    if (!anchor || currentBody.slice(sourceStart, sourceEnd) !== sourceText.slice(sourceStart, sourceEnd)) {
      return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, ['source-staleness'], 'The current manuscript no longer contains the safely anchored source passage.');
    }
  }

  if (blockingRisks.length > 0) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, blockingRisks, 'The insertion is waiting for explicit risk acknowledgement.');
  }

  let candidateStart = 0;
  let candidateEnd = candidateText.length;
  if (request.mode === 'accept-selected-text') {
    const candidateSelection = request.candidateSelection;
    if (!boundedSelection(candidateSelection, candidateText.length)) {
      return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The selected candidate range is invalid or outside the candidate text.');
    }
    candidateStart = candidateSelection.selectionStart;
    candidateEnd = candidateSelection.selectionEnd;
  }
  const replacementText = candidateText.slice(candidateStart, candidateEnd);
  if (!replacementText) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, [], 'The selected candidate range is empty.');
  }
  if (sourceEnd > currentBody.length) {
    return blocked(request, sourceBodySha256, currentBodySha256, candidateTextSha256, risks, acknowledgedRisks, ['source-staleness'], 'The source anchor is outside the current manuscript body.');
  }
  const acceptedBody = `${currentBody.slice(0, sourceStart)}${replacementText}${currentBody.slice(sourceEnd)}`;
  const acceptedResultSha256 = await sha256(acceptedBody);
  return {
    schemaVersion: NARRATIVE_INSERTION_SCHEMA_VERSION,
    status: 'ready',
    projectId: candidate.projectId,
    unitId: candidate.unitId,
    mode: request.mode,
    sourceBodySha256,
    currentBodySha256,
    candidateTextSha256,
    acceptedResultSha256,
    sourceCurrent: sourceBodySha256 === currentBodySha256,
    replacement: {
      sourceStart,
      sourceEnd,
      candidateStart,
      candidateEnd,
      text: replacementText,
    },
    risks,
    acknowledgedRisks,
    blockingRisks: [],
    message: 'The replacement is calculated and ready for explicit truth-owner acceptance.',
  };
}

export const calculateInsertion = calculateNarrativeInsertion;
