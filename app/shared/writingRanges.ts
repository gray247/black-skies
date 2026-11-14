import type {
  LivingOutlineItemV1,
  LivingOutlineSourceAnchorV1,
  WritingGroupV1,
  GapWritingOperationV1,
} from './ipc/livingOutline.js';

export function validGapWritingOperation(value: unknown, validAnchor: (value: LivingOutlineSourceAnchorV1) => boolean): value is GapWritingOperationV1 {
  if (!value || typeof value !== 'object') return false;
  const op = value as GapWritingOperationV1;
  const id = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 240;
  return id(op.id) && id(op.gapId) && id(op.unitId) && id(op.groupId) &&
    ['fill', 'undo'].includes(op.direction) && /^[a-f0-9]{64}$/u.test(op.beforeFingerprint) && /^[a-f0-9]{64}$/u.test(op.afterFingerprint) &&
    Number.isInteger(op.from) && Number.isInteger(op.to) && op.from >= 0 && op.to >= op.from &&
    Number.isInteger(op.insertedLength) && op.insertedLength >= 0 &&
    isWritingGroups(op.groups, validAnchor) && Array.isArray(op.noteAnchors) &&
    new Set(op.noteAnchors.map(note => note?.itemId)).size === op.noteAnchors.length &&
    op.noteAnchors.every(note => note && id(note.itemId) && note.anchor && validAnchor(note.anchor) &&
      (!note.anchors || (Array.isArray(note.anchors) && note.anchors.length > 0 && note.anchors.every(validAnchor) && sameWritingAnchor(note.anchor, note.anchors[0])))) &&
    Boolean(op.target && (op.target.kind === 'gap' || op.target.kind === 'fragment') &&
      ['authored', 'planned', 'inferred', 'proposed'].includes(op.target.state) && op.target.anchor && validAnchor(op.target.anchor) && op.target.anchor.unitId === op.unitId);
}

export interface WritingEdit {
  readonly from: number;
  readonly to: number;
  readonly insert: string;
}
export interface WritingRange {
  readonly unitId: string;
  readonly from: number;
  readonly to: number;
  readonly sourceFingerprint?: string;
}

export function planGapInsertion(source: string, at: number, text: string) {
  if (!Number.isInteger(at) || at < 0 || at > source.length || !text.trim()) throw new Error('Choose a current gap and write its missing passage.');
  const before = source.charCodeAt(at - 1), after = source.charCodeAt(at);
  if (before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff) throw new Error('Choose a gap outside the middle of a Unicode character.');
  const prefix = at > 0 && !source.slice(0, at).endsWith('\n\n') ? '\n\n' : '';
  const suffix = at < source.length && !source.slice(at).startsWith('\n\n') ? '\n\n' : '';
  const insert = prefix + text + suffix;
  const result = source.slice(0, at) + insert + source.slice(at);
  if (result.startsWith('\n')) throw new Error('The current writing format cannot retain leading blank lines. Begin the missing passage with its writing.');
  return { before: source, after: result, edit: { from: at, to: at, insert }, from: at + prefix.length, to: at + prefix.length + text.length };
}

export interface WritingMovePlan {
  readonly before: Readonly<Record<string, string>>;
  readonly after: Readonly<Record<string, string>>;
  readonly changedUnitIds: readonly string[];
  readonly moved: WritingRange;
  readonly pieces: readonly {
    readonly source: WritingRange;
    readonly destination: WritingRange;
  }[];
}

export function writingLinksKey(
  groups: readonly WritingGroupV1[],
  notes: readonly { readonly id: string; readonly anchors: readonly LivingOutlineSourceAnchorV1[] }[],
): string {
  const key = (anchors: readonly LivingOutlineSourceAnchorV1[]) =>
    anchors.map(anchor => [anchor.unitId, anchor.selectionStart, anchor.selectionEnd]);
  return JSON.stringify([groups.map(group => [group.id, key(group.spans)]), notes.map(note => [note.id, key(note.anchors)])]);
}

/** An explicit prose move, independent of the outline's planning order. */
export function planWritingMove(
  unitOrder: readonly string[],
  bodies: Readonly<Record<string, string>>,
  selection: readonly WritingRange[],
  destination: { readonly unitId: string; readonly offset: number },
): WritingMovePlan {
  type Piece = { text: string; source?: WritingRange };
  const order = new Map(unitOrder.map((id, index) => [id, index]));
  const ranges = [...selection].sort((a, b) =>
    (order.get(a.unitId) ?? -1) - (order.get(b.unitId) ?? -1) || a.from - b.from,
  );
  if (!ranges.length || !order.has(destination.unitId) ||
      !Number.isInteger(destination.offset) || destination.offset < 0 ||
      destination.offset > (bodies[destination.unitId]?.length ?? -1))
    throw new Error('Choose a current passage and a destination outside it.');
  for (const [index, range] of ranges.entries()) {
    const body = bodies[range.unitId];
    const previous = ranges[index - 1];
    if (!order.has(range.unitId) || body === undefined ||
        !Number.isInteger(range.from) || !Number.isInteger(range.to) ||
        range.from < 0 || range.to <= range.from || range.to > body.length ||
        (previous?.unitId === range.unitId && previous.to > range.from))
      throw new Error('The passage ranges are unavailable or overlap.');
    for (const offset of [range.from, range.to]) {
      const before = body.charCodeAt(offset - 1), after = body.charCodeAt(offset);
      if (before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff)
        throw new Error('Choose a boundary outside the middle of a Unicode character.');
    }
    if (range.unitId === destination.unitId && destination.offset >= range.from && destination.offset <= range.to)
      throw new Error('The destination is inside or immediately beside this passage.');
  }
  const destinationBody = bodies[destination.unitId]!;
  const beforeCode = destinationBody.charCodeAt(destination.offset - 1);
  const afterCode = destinationBody.charCodeAt(destination.offset);
  if (beforeCode >= 0xd800 && beforeCode <= 0xdbff && afterCode >= 0xdc00 && afterCode <= 0xdfff)
    throw new Error('Choose a destination outside the middle of a Unicode character.');
  const retained = new Map<string, Piece[]>();
  for (const unitId of unitOrder) {
    const body = bodies[unitId];
    if (body === undefined) throw new Error('A writing section is unavailable.');
    const pieces: Piece[] = [];
    let from = 0;
    for (const range of ranges.filter(range => range.unitId === unitId)) {
      if (from < range.from) pieces.push({ text: body.slice(from, range.from), source: { unitId, from, to: range.from } });
      from = range.to;
    }
    if (from < body.length) pieces.push({ text: body.slice(from), source: { unitId, from, to: body.length } });
    retained.set(unitId, pieces);
  }
  const movedPieces: Piece[] = [];
  for (const [index, range] of ranges.entries()) {
    if (index) movedPieces.push({ text: '\n\n' });
    movedPieces.push({ text: bodies[range.unitId]!.slice(range.from, range.to), source: range });
  }
  const movedText = movedPieces.map(piece => piece.text).join('');
  const removedBefore = ranges.filter(range => range.unitId === destination.unitId && range.to <= destination.offset)
    .reduce((length, range) => length + range.to - range.from, 0);
  const at = destination.offset - removedBefore;
  const target = retained.get(destination.unitId)!;
  const targetText = target.map(piece => piece.text).join('');
  const prefix = at > 0 && !/\s/u.test(targetText[at - 1]!) && !/^\s/u.test(movedText) ? '\n\n' : '';
  const suffix = at < targetText.length && !/\s/u.test(targetText[at]!) && !/\s$/u.test(movedText) ? '\n\n' : '';
  const insertion = [{ text: prefix }, ...movedPieces, { text: suffix }];
  const assembled: Piece[] = [];
  let offset = 0, inserted = false;
  for (const piece of target) {
    if (!inserted && at >= offset && at <= offset + piece.text.length) {
      const within = at - offset;
      if (within) assembled.push({ text: piece.text.slice(0, within), source: { ...piece.source!, to: piece.source!.from + within } });
      assembled.push(...insertion);
      if (within < piece.text.length) assembled.push({ text: piece.text.slice(within), source: { ...piece.source!, from: piece.source!.from + within } });
      inserted = true;
    } else assembled.push(piece);
    offset += piece.text.length;
  }
  if (!inserted) assembled.push(...insertion);
  retained.set(destination.unitId, assembled);
  const after: Record<string, string> = {};
  const pieces: { source: WritingRange; destination: WritingRange }[] = [];
  for (const unitId of unitOrder) {
    let at = 0;
    after[unitId] = retained.get(unitId)!.map(piece => {
      if (piece.source) pieces.push({ source: piece.source, destination: { unitId, from: at, to: at + piece.text.length } });
      at += piece.text.length;
      return piece.text;
    }).join('');
  }
  return {
    before: { ...bodies }, after, pieces,
    changedUnitIds: unitOrder.filter(id => bodies[id] !== after[id]),
    moved: { unitId: destination.unitId, from: at + prefix.length, to: at + prefix.length + movedText.length },
  };
}

/** Project only the original source characters; generated spacing is not evidence. */
export function relocateWritingRange(range: WritingRange, plan: WritingMovePlan): WritingRange[] {
  const relevant = plan.pieces.filter(piece => piece.source.unitId === range.unitId);
  if (range.from === range.to) {
    const piece = relevant.find(piece => piece.source.from <= range.from && range.from < piece.source.to)
      ?? relevant.find(piece => piece.source.to === range.from);
    if (!piece) return [{ ...range }];
    const offset = piece.destination.from + range.from - piece.source.from;
    return [{ unitId: piece.destination.unitId, from: offset, to: offset }];
  }
  const mapped = relevant.flatMap(piece => {
    const from = Math.max(range.from, piece.source.from), to = Math.min(range.to, piece.source.to);
    return to > from ? [{ unitId: piece.destination.unitId,
      from: piece.destination.from + from - piece.source.from,
      to: piece.destination.from + to - piece.source.from }] : [];
  });
  if (mapped.reduce((length, span) => length + span.to - span.from, 0) !== range.to - range.from)
    throw new Error('The move cannot preserve a linked source range.');
  return mapped;
}

/** Positions are UTF-16 half-open offsets local to an existing saved section. */
export function mapWritingOffset(position: number, edits: readonly WritingEdit[]): number {
  let delta = 0;
  for (const edit of edits) {
    if (position < edit.from) break;
    if (position === edit.from && edit.to > edit.from) return edit.from + delta;
    if (position <= edit.to) return edit.from + delta + edit.insert.length;
    delta += edit.insert.length - (edit.to - edit.from);
  }
  return position + delta;
}

export function rebaseWritingAnchor(
  anchor: LivingOutlineSourceAnchorV1,
  edits: readonly WritingEdit[],
): LivingOutlineSourceAnchorV1 {
  const selectionStart = mapWritingOffset(anchor.selectionStart, edits);
  const selectionEnd = Math.max(selectionStart, mapWritingOffset(anchor.selectionEnd, edits));
  return {
    ...anchor,
    selectionStart,
    selectionEnd,
    anchorKind: selectionStart === selectionEnd ? 'position' : 'span',
  };
}

export function isWritingGroups(
  value: unknown,
  validAnchor: (value: LivingOutlineSourceAnchorV1) => boolean,
): value is readonly WritingGroupV1[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  const spans = new Map<string, { from: number; to: number }[]>();
  for (const group of value) {
    if (
      !group ||
      typeof group !== 'object' ||
      typeof group.id !== 'string' ||
      !group.id.trim() ||
      ids.has(group.id) ||
      (group.customLabel !== undefined && typeof group.customLabel !== 'boolean') ||
      typeof group.label !== 'string' ||
      !group.label.trim() ||
      group.label.length > 240 ||
      !Array.isArray(group.spans) ||
      !group.spans.length
    )
      return false;
    ids.add(group.id);
    for (const anchor of group.spans) {
      if (!anchor || !validAnchor(anchor)) return false;
      const ranges = spans.get(anchor.unitId) ?? [];
      if (anchor.selectionEnd > anchor.selectionStart)
        ranges.push({ from: anchor.selectionStart, to: anchor.selectionEnd });
      spans.set(anchor.unitId, ranges);
    }
  }
  for (const ranges of spans.values()) {
    ranges.sort((a, b) => a.from - b.from);
    for (let index = 1; index < ranges.length; index += 1)
      if (ranges[index]!.from < ranges[index - 1]!.to) return false;
  }
  return true;
}

/** Partition every source character exactly once into a pin or unpinned span. */
export function writingCoverage(unitId: string, length: number, groups: readonly WritingGroupV1[]) {
  const pinned = groups
    .flatMap((group) =>
      group.spans
        .filter((span) => span.unitId === unitId && span.selectionEnd > span.selectionStart)
        .map((span) => ({ from: span.selectionStart, to: span.selectionEnd, groupId: group.id })),
    )
    .sort((a, b) => a.from - b.from);
  const result: { from: number; to: number; groupId: string | null }[] = [];
  let end = 0;
  for (const span of pinned) {
    if (span.from < end || span.from < 0 || span.to > length)
      throw new Error('Writing range coverage is stale or overlapping.');
    if (span.from > end) result.push({ from: end, to: span.from, groupId: null });
    result.push(span);
    end = span.to;
  }
  if (end < length) result.push({ from: end, to: length, groupId: null });
  return result;
}

/** A new selection replaces intersecting memberships, retaining outside pieces. */
export function subtractWritingSelection(
  groups: readonly WritingGroupV1[],
  selection: readonly WritingRange[],
  newId = () => globalThis.crypto.randomUUID(),
): readonly WritingGroupV1[] {
  return groups.flatMap((group) => {
    const fragments: LivingOutlineSourceAnchorV1[][] = [];
    let current: LivingOutlineSourceAnchorV1[] = [];
    const finish = () => {
      if (current.length) fragments.push(current);
      current = [];
    };
    for (const span of group.spans) {
      const cuts = selection
        .filter(
          (range) =>
            range.unitId === span.unitId &&
            range.from < span.selectionEnd &&
            range.to > span.selectionStart,
        )
        .sort((a, b) => a.from - b.from);
      if (!cuts.length) {
        current.push(span);
        continue;
      }
      let start = span.selectionStart;
      for (const cut of cuts) {
        if (cut.from > start)
          current.push({ ...span, selectionStart: start, selectionEnd: cut.from });
        finish();
        start = Math.max(start, cut.to);
      }
      if (start < span.selectionEnd) current.push({ ...span, selectionStart: start });
    }
    finish();
    return fragments.map((spans, index) => ({
      ...group,
      id: index === 0 ? group.id : newId(),
      spans,
    }));
  });
}

/** Escaped literal matching returns offsets in the original Unicode source. */
export function findLiteralWritingMatches(
  source: string,
  query: string,
  matchCase = false,
  from = 0,
  to = source.length,
): { from: number; to: number }[] {
  if (!query || from < 0 || to < from || to > source.length) return [];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(escaped, matchCase ? 'gu' : 'giu');
  const matches = [];
  const scope = source.slice(from, to);
  for (let match = pattern.exec(scope); match; match = pattern.exec(scope))
    matches.push({ from: from + match.index, to: from + match.index + match[0].length });
  return matches;
}

export function sameWritingAnchor(
  a: LivingOutlineSourceAnchorV1 | null | undefined,
  b: LivingOutlineSourceAnchorV1 | null | undefined,
): boolean {
  if (!a || !b) return a === b;
  const fields: (keyof LivingOutlineSourceAnchorV1)[] = [
    'schemaVersion',
    'unitId',
    'anchorKind',
    'selectionStart',
    'selectionEnd',
    'selectionSearchFingerprint',
    'sourceFingerprint',
    'selectionFingerprint',
    'prefixLength',
    'prefixSearchFingerprint',
    'prefixFingerprint',
    'suffixLength',
    'suffixSearchFingerprint',
    'suffixFingerprint',
  ];
  return fields.every((key) => a[key] === b[key]);
}

export function noteSourceAnchors(
  item: Pick<LivingOutlineItemV1, 'sourceAnchor' | 'sourceAnchors'>,
): readonly LivingOutlineSourceAnchorV1[] {
  return item.sourceAnchors?.length
    ? item.sourceAnchors
    : item.sourceAnchor
      ? [item.sourceAnchor]
      : [];
}

/** Generated names follow their own words; a deliberate name stays independent. */
export function writingGroupLabel(
  group: WritingGroupV1,
  bodies: Readonly<Record<string, string>>,
): string {
  if (group.customLabel) return group.label;
  const opening = group.spans
    .map((span) => (bodies[span.unitId] ?? '').slice(span.selectionStart, span.selectionEnd))
    .join(' ')
    .trim();
  return opening ? opening.split(/\s+/u).slice(0, 10).join(' ').slice(0, 240) : group.label;
}
