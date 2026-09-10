import type { ManuscriptStructureAnchorV1 } from './ipc/manuscriptStructure';
import type { StoryIntelligenceSourceClassV1, StoryPositionRefV1 } from './ipc/storyIntelligence';
import {
  buildManuscriptStructureAnchor,
  normalizeManuscriptSource,
  resolveManuscriptStructureAnchor,
} from './manuscriptStructure';

export const PROGRAM7_SOURCE_BINDING_SCHEMA_VERSION = 'BlackSkiesProgram7SourceBinding v1' as const;

export type Program7SourceBindingResolutionStatus =
  | 'current'
  | 'exact'
  | 'relocated'
  | 'potentially-outdated'
  | 'ambiguous'
  | 'stale'
  | 'unavailable'
  | 'protected';

export interface Program7SourceProtectionV1 {
  readonly sourceClass: StoryIntelligenceSourceClassV1;
  readonly metadataOnly: boolean;
}

export interface Program7SourceEnvelopeV1 {
  readonly schemaVersion: typeof PROGRAM7_SOURCE_BINDING_SCHEMA_VERSION;
  readonly projectId: string;
  readonly generation: number;
  readonly sourceRef: StoryPositionRefV1;
  readonly unitId: string;
  readonly bodySha256?: string;
  readonly protection: Program7SourceProtectionV1;
  readonly anchor?: ManuscriptStructureAnchorV1;
  readonly selectionStart?: number;
  readonly selectionEnd?: number;
  /** Present only for ordinary, author-shareable source. Never present for protected data. */
  readonly text?: string;
  readonly findingId?: string;
  readonly signalId?: string;
  readonly lens?: string;
  readonly evidenceSummary?: string;
}

export interface Program7SourceBindingResolutionV1 {
  readonly status: Program7SourceBindingResolutionStatus;
  readonly envelope: Program7SourceEnvelopeV1;
  readonly selectionStart?: number;
  readonly selectionEnd?: number;
  readonly message: string;
}

export interface BuildProgram7SourceEnvelopeInput {
  readonly projectId: string;
  readonly generation: number;
  readonly unitId: string;
  readonly sourceId?: string;
  readonly sourceKind?: StoryPositionRefV1['sourceKind'];
  readonly sourceRevision?: number;
  readonly sourceFingerprint?: string;
  readonly sourceClass?: StoryIntelligenceSourceClassV1;
  readonly sourceText?: string;
  readonly bodySha256?: string;
  readonly selectionFingerprint?: string;
  readonly selectionStart?: number;
  readonly selectionEnd?: number;
  readonly findingId?: string;
  readonly signalId?: string;
  readonly lens?: string;
  readonly evidenceSummary?: string;
}

const PROTECTED_CLASSES = new Set<StoryIntelligenceSourceClassV1>([
  'hidden',
  'masked',
  'deleted',
  'forgotten',
  'discarded',
  'protected',
  'ai-excluded',
]);

function isProtected(sourceClass: StoryIntelligenceSourceClassV1): boolean {
  return PROTECTED_CLASSES.has(sourceClass);
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

/**
 * Build the source-only handoff emitted by Work on this. It intentionally has
 * no persistence operation and no revision-item lifecycle field.
 */
export async function buildProgram7SourceEnvelope(
  input: BuildProgram7SourceEnvelopeInput,
): Promise<Program7SourceEnvelopeV1> {
  const sourceClass = input.sourceClass ?? 'included';
  const protectedSource = isProtected(sourceClass);
  const normalized =
    input.sourceText === undefined ? undefined : normalizeManuscriptSource(input.sourceText);
  const derivedBodySha256 = normalized === undefined ? undefined : await sha256(normalized);
  if (
    derivedBodySha256 !== undefined &&
    isSha256(input.bodySha256) &&
    input.bodySha256 !== derivedBodySha256
  ) {
    throw new Error('Supplied bodySha256 does not match the normalized source text.');
  }
  const bodySha256 = derivedBodySha256 ?? (isSha256(input.bodySha256) ? input.bodySha256 : undefined);
  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  let exactStart: number | undefined;
  let exactEnd: number | undefined;
  if (selectionStart !== undefined || selectionEnd !== undefined) {
    if (
      normalized === undefined ||
      typeof selectionStart !== 'number' ||
      !Number.isInteger(selectionStart) ||
      typeof selectionEnd !== 'number' ||
      !Number.isInteger(selectionEnd) ||
      selectionStart < 0 ||
      selectionEnd < selectionStart ||
      selectionEnd > normalized.length
    ) {
      throw new Error(
        'Exact source coordinates require sourceText and a complete in-bounds UTF-16 range.',
      );
    }
    exactStart = selectionStart;
    exactEnd = selectionEnd;
  }
  const anchor = exactStart !== undefined
    ? await buildManuscriptStructureAnchor(
        normalized!,
        exactStart,
        exactEnd!,
        bodySha256,
      )
    : undefined;
  if (
    anchor &&
    input.selectionFingerprint !== undefined &&
    input.selectionFingerprint !== anchor.selectionFingerprint
  ) {
    throw new Error('Supplied selectionFingerprint does not match the selected source text.');
  }
  const sourceRef: StoryPositionRefV1 = {
    projectId: input.projectId,
    sourceKind: input.sourceKind ?? 'manuscript',
    sourceId: input.sourceId ?? input.unitId,
    sourceRevision: input.sourceRevision ?? input.generation,
    sourceFingerprint: input.sourceFingerprint ?? `${input.projectId}:${input.unitId}`,
    unitId: input.unitId,
    ...(bodySha256 ? { bodySha256 } : {}),
    ...(anchor
      ? {
          selectionFingerprint: anchor.selectionFingerprint,
          selectionStart: anchor.selectionStart,
          selectionEnd: anchor.selectionEnd,
        }
      : {}),
  };
  return {
    schemaVersion: PROGRAM7_SOURCE_BINDING_SCHEMA_VERSION,
    projectId: input.projectId,
    generation: input.generation,
    sourceRef,
    unitId: input.unitId,
    bodySha256,
    protection: { sourceClass, metadataOnly: protectedSource },
    ...(anchor
      ? { anchor, selectionStart: anchor.selectionStart, selectionEnd: anchor.selectionEnd }
      : {}),
    ...(!protectedSource && normalized !== undefined ? { text: normalized } : {}),
    ...(input.findingId ? { findingId: input.findingId } : {}),
    ...(input.signalId ? { signalId: input.signalId } : {}),
    ...(input.lens ? { lens: input.lens } : {}),
    ...(input.evidenceSummary ? { evidenceSummary: input.evidenceSummary } : {}),
  };
}

export const createProgram7SourceEnvelope = buildProgram7SourceEnvelope;
export const createWorkOnThisRequest = buildProgram7SourceEnvelope;

export async function resolveProgram7SourceBinding(
  envelope: Program7SourceEnvelopeV1,
  currentSourceText?: string,
): Promise<Program7SourceBindingResolutionV1> {
  if (envelope.protection.metadataOnly || isProtected(envelope.protection.sourceClass)) {
    return {
      status: 'protected',
      envelope,
      message: 'This source is protected; only metadata is available.',
    };
  }
  if (currentSourceText === undefined) {
    return {
      status: 'unavailable',
      envelope,
      message: 'The source unit is not available for recheck.',
    };
  }
  const normalized = normalizeManuscriptSource(currentSourceText);
  const currentBodySha256 = await sha256(normalized);
  if (envelope.anchor) {
    if (
      envelope.sourceRef.selectionFingerprint !== undefined &&
      envelope.sourceRef.selectionFingerprint !== envelope.anchor.selectionFingerprint
    ) {
      return {
        status: 'stale',
        envelope,
        message: 'The stored source selection fingerprint is inconsistent.',
      };
    }
    const resolution = await resolveManuscriptStructureAnchor(envelope.anchor, normalized);
    if (resolution.status === 'exact')
      return {
        status: 'exact',
        envelope,
        selectionStart: resolution.selectionStart,
        selectionEnd: resolution.selectionEnd,
        message: 'The exact source passage is current.',
      };
    if (resolution.status === 'relocated')
      return {
        status: 'relocated',
        envelope,
        selectionStart: resolution.selectionStart,
        selectionEnd: resolution.selectionEnd,
        message: 'The source passage was uniquely relocated after the source changed.',
      };
    if (resolution.status === 'ambiguous')
      return {
        status: 'ambiguous',
        envelope,
        message: 'The source passage has multiple possible matches.',
      };
    return {
      status: 'stale',
      envelope,
      message: 'The source passage changed and could not be safely reattached.',
    };
  }
  if (envelope.bodySha256 === undefined) {
    return {
      status: 'unavailable',
      envelope,
      message: 'The source unit has no verified body fingerprint for recheck.',
    };
  }
  if (currentBodySha256 === envelope.bodySha256)
    return { status: 'current', envelope, message: 'The source unit is current.' };
  return {
    status: 'potentially-outdated',
    envelope,
    message: 'The source unit changed; review the stable unit before continuing.',
  };
}

export const resolveProgram7Source = resolveProgram7SourceBinding;
