import {
  LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION,
  type LivingOutlineSourceAnchorV1,
} from './ipc/livingOutline';

export type LivingOutlineAnchorResolution =
  | { readonly status: 'exact' | 'relocated'; readonly selectionStart: number; readonly selectionEnd: number }
  | { readonly status: 'ambiguous' | 'unresolved' };

const CONTEXT_LENGTH = 32;
const ROLLING_BASE = 257;

async function fingerprintText(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function searchFingerprint(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, ROLLING_BASE) + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function rollingSearchFingerprints(source: string, length: number): Uint32Array {
  const count = Math.max(0, source.length - length + 1);
  const fingerprints = new Uint32Array(count);
  if (count === 0 || length === 0) return fingerprints;
  let power = 1;
  let hash = 0;
  for (let index = 0; index < length; index += 1) {
    hash = (Math.imul(hash, ROLLING_BASE) + source.charCodeAt(index)) >>> 0;
    if (index < length - 1) power = Math.imul(power, ROLLING_BASE) >>> 0;
  }
  fingerprints[0] = hash;
  for (let start = 1; start < count; start += 1) {
    hash = (
      Math.imul((hash - Math.imul(source.charCodeAt(start - 1), power)) >>> 0, ROLLING_BASE) +
      source.charCodeAt(start + length - 1)
    ) >>> 0;
    fingerprints[start] = hash;
  }
  return fingerprints;
}

export async function buildLivingOutlineSourceAnchor(
  unitId: string,
  source: string,
  selectionStart: number,
  selectionEnd: number,
): Promise<LivingOutlineSourceAnchorV1> {
  const safeStart = Math.max(0, Math.min(selectionStart, source.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, source.length));
  const selection = source.slice(safeStart, safeEnd);
  const prefix = source.slice(Math.max(0, safeStart - CONTEXT_LENGTH), safeStart);
  const suffix = source.slice(safeEnd, Math.min(source.length, safeEnd + CONTEXT_LENGTH));
  const [sourceFingerprint, selectionFingerprint, prefixFingerprint, suffixFingerprint] = await Promise.all([
    fingerprintText(source), fingerprintText(selection), fingerprintText(prefix), fingerprintText(suffix),
  ]);
  return {
    schemaVersion: LIVING_OUTLINE_ANCHOR_SCHEMA_VERSION,
    unitId,
    anchorKind: safeStart === safeEnd ? 'position' : 'span',
    selectionStart: safeStart,
    selectionEnd: safeEnd,
    selectionSearchFingerprint: searchFingerprint(selection),
    sourceFingerprint,
    selectionFingerprint,
    prefixLength: prefix.length,
    prefixSearchFingerprint: searchFingerprint(prefix),
    prefixFingerprint,
    suffixLength: suffix.length,
    suffixSearchFingerprint: searchFingerprint(suffix),
    suffixFingerprint,
  };
}

async function verifiedContext(anchor: LivingOutlineSourceAnchorV1, source: string, start: number, end: number): Promise<boolean> {
  const prefix = source.slice(start - anchor.prefixLength, start);
  const suffix = source.slice(end, end + anchor.suffixLength);
  const [prefixFingerprint, suffixFingerprint] = await Promise.all([
    fingerprintText(prefix), fingerprintText(suffix),
  ]);
  return prefixFingerprint === anchor.prefixFingerprint && suffixFingerprint === anchor.suffixFingerprint;
}

/**
 * Resolve an author-created source anchor without persisting manuscript prose
 * or inventing a match. Compact rolling fingerprints find candidates; SHA-256
 * fingerprints verify them. Only one verified candidate may relocate.
 */
export async function resolveLivingOutlineAnchor(
  anchor: LivingOutlineSourceAnchorV1,
  currentProse: string,
): Promise<LivingOutlineAnchorResolution> {
  const spanLength = anchor.selectionEnd - anchor.selectionStart;
  if (
    anchor.selectionStart >= 0 &&
    anchor.selectionEnd >= anchor.selectionStart &&
    anchor.selectionEnd <= currentProse.length
  ) {
    const exactSelection = currentProse.slice(anchor.selectionStart, anchor.selectionEnd);
    const exactSelectionFingerprint = await fingerprintText(exactSelection);
    if (
      exactSelectionFingerprint === anchor.selectionFingerprint &&
      await verifiedContext(anchor, currentProse, anchor.selectionStart, anchor.selectionEnd)
    ) {
      return { status: 'exact', selectionStart: anchor.selectionStart, selectionEnd: anchor.selectionEnd };
    }
  }

  const candidates: Array<{ selectionStart: number; selectionEnd: number }> = [];
  const selectionFingerprints = rollingSearchFingerprints(currentProse, spanLength);
  const prefixFingerprints = rollingSearchFingerprints(currentProse, anchor.prefixLength);
  const suffixFingerprints = rollingSearchFingerprints(currentProse, anchor.suffixLength);
  const expectedSelectionSearch = Number.parseInt(anchor.selectionSearchFingerprint, 16) >>> 0;
  const expectedPrefixSearch = Number.parseInt(anchor.prefixSearchFingerprint, 16) >>> 0;
  const expectedSuffixSearch = Number.parseInt(anchor.suffixSearchFingerprint, 16) >>> 0;
  for (let start = anchor.prefixLength; start + spanLength + anchor.suffixLength <= currentProse.length; start += 1) {
    const end = start + spanLength;
    if (
      (spanLength > 0 && selectionFingerprints[start] !== expectedSelectionSearch) ||
      (anchor.prefixLength > 0 && prefixFingerprints[start - anchor.prefixLength] !== expectedPrefixSearch) ||
      (anchor.suffixLength > 0 && suffixFingerprints[end] !== expectedSuffixSearch)
    ) continue;
    const candidateSelectionFingerprint = await fingerprintText(currentProse.slice(start, end));
    if (
      candidateSelectionFingerprint === anchor.selectionFingerprint &&
      await verifiedContext(anchor, currentProse, start, end)
    ) {
      candidates.push({ selectionStart: start, selectionEnd: end });
      if (candidates.length > 1) return { status: 'ambiguous' };
    }
  }
  return candidates.length === 1 ? { status: 'relocated', ...candidates[0]! } : { status: 'unresolved' };
}
