import {
  MANUSCRIPT_STRUCTURE_ANCHOR_SCHEMA_VERSION,
  MANUSCRIPT_STRUCTURE_MAX_LABEL_LENGTH,
  MANUSCRIPT_STRUCTURE_SCHEMA_VERSION,
  type ManuscriptStructureAnchorV1,
  type ManuscriptStructureBlockKind,
  type ManuscriptStructureBlockV1,
  type ManuscriptStructureDocumentV1,
  type ManuscriptStructureProposalProvenance,
  type ManuscriptStructureProposalV1,
} from './ipc/manuscriptStructure';

const CONTEXT_LENGTH = 32;
const ROLLING_BASE = 257;
type FingerprintProvider = (value: string) => Promise<string>;
let fingerprintProvider: FingerprintProvider | null = null;

export function setManuscriptStructureFingerprintProvider(provider: FingerprintProvider | null): void {
  fingerprintProvider = provider;
}

export type ManuscriptStructureAnchorResolution =
  | { readonly status: 'exact' | 'relocated'; readonly selectionStart: number; readonly selectionEnd: number }
  | { readonly status: 'ambiguous' | 'unresolved' | 'stale' };

export interface ManuscriptStructureDiscoveryOptions {
  readonly now?: () => Date;
  readonly prior?: ManuscriptStructureDocumentV1;
}

async function fingerprintText(value: string): Promise<string> {
  if (fingerprintProvider) return fingerprintProvider(value);
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

function stableId(prefix: string, ...parts: string[]): string {
  let hash = 2166136261;
  for (const part of parts.join('\u001f')) {
    hash ^= part.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `${prefix}_${hash.toString(16).padStart(8, '0')}`;
}

export function normalizeManuscriptSource(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

export async function buildManuscriptStructureAnchor(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  sourceFingerprint = '',
): Promise<ManuscriptStructureAnchorV1> {
  const safeStart = Math.max(0, Math.min(selectionStart, source.length));
  const safeEnd = Math.max(safeStart, Math.min(selectionEnd, source.length));
  const selection = source.slice(safeStart, safeEnd);
  const prefix = source.slice(Math.max(0, safeStart - CONTEXT_LENGTH), safeStart);
  const suffix = source.slice(safeEnd, Math.min(source.length, safeEnd + CONTEXT_LENGTH));
  return {
    schemaVersion: MANUSCRIPT_STRUCTURE_ANCHOR_SCHEMA_VERSION,
    anchorKind: safeStart === safeEnd ? 'position' : 'span',
    selectionStart: safeStart,
    selectionEnd: safeEnd,
    selectionSearchFingerprint: searchFingerprint(selection),
    sourceFingerprint: sourceFingerprint || await fingerprintText(source),
    selectionFingerprint: await fingerprintText(selection),
    prefixLength: prefix.length,
    prefixSearchFingerprint: searchFingerprint(prefix),
    prefixFingerprint: await fingerprintText(prefix),
    suffixLength: suffix.length,
    suffixSearchFingerprint: searchFingerprint(suffix),
    suffixFingerprint: await fingerprintText(suffix),
  };
}

export async function resolveManuscriptStructureAnchor(
  anchor: ManuscriptStructureAnchorV1,
  source: string,
): Promise<ManuscriptStructureAnchorResolution> {
  const sourceFingerprint = await fingerprintText(source);
  if (sourceFingerprint === anchor.sourceFingerprint) {
    return { status: 'exact', selectionStart: anchor.selectionStart, selectionEnd: anchor.selectionEnd };
  }
  const length = anchor.selectionEnd - anchor.selectionStart;
  if (length === 0) return { status: 'stale' };
  const selectionFingerprint = anchor.selectionFingerprint;
  const candidates: number[] = [];
  const rolling = rollingSearchFingerprints(source, length);
  const target = Number.parseInt(anchor.selectionSearchFingerprint, 16) >>> 0;
  for (let index = 0; index < rolling.length; index += 1) {
    if (rolling[index] !== target) continue;
    const candidate = source.slice(index, index + length);
    if (await fingerprintText(candidate) !== selectionFingerprint) continue;
    candidates.push(index);
  }
  if (candidates.length === 1) {
    return { status: 'relocated', selectionStart: candidates[0]!, selectionEnd: candidates[0]! + length };
  }
  return { status: candidates.length > 1 ? 'ambiguous' : 'unresolved' };
}

interface Boundary {
  readonly start: number;
  readonly end: number;
  readonly label: string;
  readonly kind: ManuscriptStructureBlockKind;
  readonly provenance: ManuscriptStructureProposalProvenance;
}

function clampLabel(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return (normalized || fallback).slice(0, MANUSCRIPT_STRUCTURE_MAX_LABEL_LENGTH);
}

function discoverBoundaries(source: string): Boundary[] {
  const candidates: Array<{ start: number; label: string; kind: ManuscriptStructureBlockKind; provenance: ManuscriptStructureProposalProvenance }> = [];
  const linePattern = /^([^\n]*)(?:\n|$)/gm;
  let lineMatch: RegExpExecArray | null;
  while ((lineMatch = linePattern.exec(source))) {
    if (lineMatch[0] === '') break;
    const line = lineMatch[1] ?? '';
    const start = lineMatch.index;
    const heading = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      candidates.push({ start, label: clampLabel(heading[2] ?? '', `Section ${candidates.length + 1}`), kind: 'heading', provenance: 'heading' });
      continue;
    }
    if (/^\s{0,3}((\*\s*){3,}|(-\s*){3,}|(_\s*){3,})\s*$/.test(line)) {
      candidates.push({ start, label: `Section ${candidates.length + 1}`, kind: 'separator', provenance: 'separator' });
    }
  }
  if (candidates.length > 0) {
    return candidates.map((candidate, index) => ({
      ...candidate,
      end: candidates[index + 1]?.start ?? source.length,
    }));
  }

  if (!/\n\s*\n/.test(source)) {
    return source.length > 0
      ? [{ start: 0, end: source.length, label: 'Manuscript', kind: 'fallback', provenance: 'fallback' }]
      : [];
  }
  const paragraphs: Boundary[] = [];
  const paragraphPattern = /\S[\s\S]*?(?=\n\s*\n|$)/g;
  let paragraphMatch: RegExpExecArray | null;
  while ((paragraphMatch = paragraphPattern.exec(source))) {
    const value = paragraphMatch[0] ?? '';
    paragraphs.push({
      start: paragraphMatch.index,
      end: paragraphMatch.index + value.length,
      label: clampLabel(value.split(/\s+/).slice(0, 8).join(' '), `Section ${paragraphs.length + 1}`),
      kind: 'paragraph',
      provenance: 'paragraph',
    });
  }
  return paragraphs.length > 0
    ? paragraphs
    : source.length > 0
      ? [{ start: 0, end: source.length, label: 'Manuscript', kind: 'fallback', provenance: 'fallback' }]
      : [];
}

export async function discoverManuscriptStructure(
  rawSource: string,
  options: ManuscriptStructureDiscoveryOptions = {},
): Promise<ManuscriptStructureDocumentV1> {
  const source = normalizeManuscriptSource(rawSource);
  const sourceFingerprint = await fingerprintText(source);
  const now = options.now ?? (() => new Date());
  const boundaries = discoverBoundaries(source);
  const blocks: ManuscriptStructureBlockV1[] = [];
  const proposals: ManuscriptStructureProposalV1[] = [];
  const priorById = new Map((options.prior?.proposals ?? []).map((proposal) => [proposal.id, proposal]));
  for (const [index, boundary] of boundaries.entries()) {
    const anchor = await buildManuscriptStructureAnchor(source, boundary.start, boundary.end, sourceFingerprint);
    const blockId = stableId('block', sourceFingerprint, String(boundary.start), String(boundary.end), boundary.kind);
    const proposalId = stableId('proposal', sourceFingerprint, String(boundary.start), String(boundary.end), boundary.provenance);
    const prior = priorById.get(proposalId);
    const timestamp = now().toISOString();
    blocks.push({ id: blockId, kind: boundary.kind, label: boundary.label, order: index + 1, anchor });
    proposals.push({
      id: proposalId,
      label: prior?.label ?? boundary.label,
      state: prior?.state === 'rejected' || prior?.state === 'accepted' ? prior.state : 'proposed',
      provenance: prior?.provenance ?? boundary.provenance,
      blockIds: [blockId],
      anchor,
      appliedUnitId: prior?.appliedUnitId ?? null,
      createdAt: prior?.createdAt ?? timestamp,
      updatedAt: timestamp,
    });
  }
  return {
    schemaVersion: MANUSCRIPT_STRUCTURE_SCHEMA_VERSION,
    projectId: options.prior?.projectId ?? '',
    revision: (options.prior?.revision ?? 0) + 1,
    source: {
      fileName: options.prior?.source.fileName ?? 'manuscript.md',
      sourceFingerprint,
      normalizedLength: source.length,
      lineEnding: 'lf',
    },
    blocks,
    proposals,
  };
}

export { fingerprintText as fingerprintManuscriptSource };
