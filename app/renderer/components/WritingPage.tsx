import { extractProjectSpineDraftBody } from '../../shared/projectSpineDraft';
import { DEFAULT_WRITING_PREFERENCES, type WritingPreferencesValues } from '../../shared/ipc/projectSpine';
import type { FeedbackSourceEvidence } from '../../shared/ipc/feedbackNotes';
import RevisionDesk, { RevisionEvidence } from './program7/RevisionDesk';
import { revisionItemSources, captureProgram7SourceEvidence } from '../../shared/program7SourceBinding';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { EditorView } from '@codemirror/view';
import { ChangeSet, Text } from '@codemirror/state';
import type {
  Stage19WritingSpineViewActions,
  Stage19WritingSpineViewModel,
} from '../Stage19WritingSpineView';
import {
  buildLivingOutlineSourceAnchor,
  resolveLivingOutlineAnchor,
} from '../../shared/livingOutlineAnchors';
import {
  writingCoverage,
  writingGroupLabel,
  joinedWritingName,
  writingMoveBoundaries,
  noteSourceAnchors,
  findLiteralWritingMatches,
  mapWritingOffset,
  planWritingMove,
  relocateWritingRange,
  writingLinksKey,
  planGapInsertion,
  rebaseWritingAnchor,
  subtractWritingSelection,
  type WritingMovePlan,
  type WritingEdit,
  type WritingRange,
} from '../../shared/writingRanges';
import { getDraftEmphasis } from '../DraftEditor';
import type {
  DraftEditorSelectionRestore,
  DraftEditorWritingMark,
  DraftEditorCommands,
  DraftEditorHistoryChange,
} from '../DraftEditor';
import type { WritingLinksSnapshot } from '../useWritingPage';
import type { GapWritingOperationV1, LivingOutlineSourceAnchorV1, LivingOutlineItemState } from '../../shared/ipc/livingOutline';

type Point = { unitId: string; offset: number };
type PreparedMove = { groupId: string; plan: WritingMovePlan; projectKey: string; beforeLinks: WritingLinksSnapshot; afterLinks: WritingLinksSnapshot };
type MoveSource = { groupId: string; projectKey: string; bodies: Record<string, string>; linksKey: string };
type UnitControls = { x: number; y: number; ranges: readonly WritingRange[]; point: Point; bodies: Record<string, string>; linksKey: string; keyboard: boolean };
function splitWord(body: string, offset: number) {
  return [...body.matchAll(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’–-]*/gu)]
    .find(word => word.index! + word[0].length > offset);
}
const wordCount = (text: string) => text.trim().split(/\s+/u).filter(Boolean).length;
type ReturnRequest = DraftEditorSelectionRestore & { unitId: string };
type HighlightKey = 'pinned' | 'unpinned' | 'concerns';
export interface WritingOutlineView {
  readonly order: 'writing' | 'plan';
  readonly selected: readonly string[];
  readonly comparing: boolean;
}
export interface WritingSearchState {
  open: boolean;
  query: string;
  replacement: string;
  matchCase: boolean;
  scope: 'manuscript' | 'current' | 'selection';
  ranges: readonly WritingRange[];
  frozenBodies: Readonly<Record<string, string>>;
}
export interface WritingContext {
  model: Stage19WritingSpineViewModel;
  actions: Stage19WritingSpineViewActions;
  selection: readonly WritingRange[];
  armed: 'beginning' | Point | null;
  pin: () => void;
  pinMessage: string;
  cancelPin: () => void;
  highlights: Record<HighlightKey, boolean>;
  toggle: (key: HighlightKey) => void;
  openNote: (id: string | null, ranges?: readonly WritingRange[]) => void;
  note: {
    session: string;
    id: string | null;
    body: string;
    ranges: readonly WritingRange[];
    sourceReady: boolean;
    sourceQuotes?: readonly string[];
    message?: string;
  } | null;
  setNoteBody: (body: string) => void;
  closeNote: () => void;
  saveNote: () => Promise<void>;
  navigate: (range: WritingRange) => Promise<void>;
  selectSources: (ranges: readonly WritingRange[]) => Promise<void>;
  returnRequest: ReturnRequest | null;
  acknowledgeReturn: (id: string) => void;
  follow: (point: Point) => void;
  registerCommands: (commands: DraftEditorCommands | null) => void;
  commands: DraftEditorCommands | null;
  editorHistoryChanges: Readonly<Record<string, DraftEditorHistoryChange>>;
  editorEdited: (kind?: 'undo' | 'redo', change?: { unitId: string; before: string; after: string; edits: readonly WritingEdit[]; group: string; linksBefore: WritingLinksSnapshot }) => void;
  undo: () => void;
  redo: () => void;
  outlineView: WritingOutlineView;
  setOutlineView: (patch: Partial<WritingOutlineView>) => void;
  search: WritingSearchState;
  setSearch: (patch: Partial<WritingSearchState>) => void;
  openFind: () => void;
  searchMatches: readonly WritingRange[];
  findNext: () => Promise<void>;
  replaceWriting: (all: boolean) => void;
  undoReplacement: () => void;
  canUndoReplacement: boolean;
  searchNotice: string;
  searchMoving: boolean;
  contextMenu: UnitControls | null;
  controlsCurrent: () => boolean;
  pinRanges: (ranges: readonly WritingRange[], extendId?: string, name?: string) => void;
  splitAt: (id: string, point: Point) => void;
  movingGroupId: string | null;
  startMove: (id: string) => void;
  moveTo: (point: Point, groupId?: string) => void;
  joinName: { ranges: readonly WritingRange[]; name: string } | null;
  setJoinName: (name: string) => void;
  applyJoinName: () => void;
  cancelJoinName: () => void;
  contextNote: () => void;
  closeContextMenu: () => void;
  useCurrentNoteSelection: () => void;
  cancelMove: () => void;
  undoMove: () => void;
  canUndoMove: boolean;
  arrangementNotice: string;
  dismissArrangementNotice: () => void;
  split: (groupId: string) => void;
  joinSelected: () => void;
  createGap: (label: string, body: string) => Promise<void>;
  previewGap: (id: string, text: string) => Promise<void>;
  gapPreview: { id: string; before: string; after: string } | null;
  applyGap: () => void;
  cancelGap: () => void;
  undoGap: () => void;
  canUndoGap: boolean;
  canUndoRevision: boolean;
  undoRevision: () => void;
  concernRanges?: readonly (WritingRange & { concernId: string })[];
  concernSources?: readonly (FeedbackSourceEvidence & { concernId: string })[];
}
const Context = createContext<WritingContext | null>(null);
export const useWritingContext = () => useContext(Context);

function readPoint(node: Node | null, offset: number): Point | null {
  if (!node?.isConnected) return null;
  const element = node instanceof Element ? node : node.parentElement;
  const section = element?.closest<HTMLElement>('[data-manuscript-unit-id]');
  const source = element?.closest<HTMLElement>('.cm-content, [data-writing-source]');
  const unitId = section?.dataset.manuscriptUnitId;
  if (!source || !unitId) return null;
  if (source.classList.contains('cm-content')) {
    const view = EditorView.findFromDOM(source);
    if (!view) return null;
    try {
      return { unitId, offset: view.posAtDOM(node, offset) };
    } catch {
      return null;
    }
  }
  const range = document.createRange();
  try {
    range.selectNodeContents(source);
    range.setEnd(node, offset);
    const prefix = range.cloneContents();
    prefix.querySelectorAll('[data-writing-decoration]').forEach((marker) => marker.remove());
    return { unitId, offset: prefix.textContent?.length ?? 0 };
  } catch {
    return null;
  }
}

function touchedPins(model: Stage19WritingSpineViewModel, ranges: readonly WritingRange[]) {
  return model.writingPage?.groups.filter(group => group.spans.some(span => ranges.some(range =>
    range.unitId === span.unitId && range.from < span.selectionEnd && span.selectionStart < range.to,
  ))) ?? [];
}

function selectedRanges(model: Stage19WritingSpineViewModel, a: Point, b: Point): WritingRange[] {
  const units = model.snapshot.project?.units ?? [];
  let first = units.findIndex((unit) => unit.id === a.unitId);
  let last = units.findIndex((unit) => unit.id === b.unitId);
  if (first < 0 || last < 0) return [];
  if (first > last || (first === last && a.offset > b.offset)) {
    [a, b] = [b, a];
    [first, last] = [last, first];
  }
  return units
    .slice(first, last + 1)
    .map((unit, index) => ({
      unitId: unit.id,
      from: index === 0 ? a.offset : 0,
      to: first + index === last ? b.offset : (model.buffers[unit.id]?.length ?? 0),
    }))
    .filter((range) => range.to > range.from);
}

interface ReplacementBatch {
  projectKey: string;
  kind: 'replacement' | 'move' | 'gap' | 'revision' | 'writing' | 'membership';
  group?: string;
  label?: string;
  gap?: { id: string; state: LivingOutlineItemState; beforeAnchor: LivingOutlineSourceAnchorV1; afterAnchor: LivingOutlineSourceAnchorV1; groupId: string; from: number; insertedLength: number };
  linksBefore?: WritingLinksSnapshot;
  linksAfter?: WritingLinksSnapshot;
  guardBefore: Record<string, string>;
  guardAfter: Record<string, string>;
  before: Record<string, string>;
  after: Record<string, string>;
  forward: Record<string, WritingEdit[]>;
  inverse: Record<string, WritingEdit[]>;
  search: WritingSearchState;
  afterSearch: WritingSearchState;
}

export function WritingPageProvider({
  model,
  actions,
  children,
}: {
  model: Stage19WritingSpineViewModel;
  actions: Stage19WritingSpineViewActions;
  children: ReactNode;
}) {
  const latest = useRef({ model, actions });
  latest.current = { model, actions };
  const projectKey = `${model.snapshot.project?.projectId ?? ''}:${model.snapshot.project?.path ?? ''}:${model.snapshot.generation}`;
  const [concernProjection, setConcernProjection] = useState<{
    bodies: typeof model.buffers; items: typeof model.program7RevisionItems.activeItems; dirty: typeof model.dirtyUnitIds;
    sources: (FeedbackSourceEvidence & { concernId: string })[];
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const items = model.program7RevisionItems.activeItems, bodies = model.buffers, dirty = model.dirtyUnitIds;
    void Promise.all(items.flatMap(item => revisionItemSources(item).map(async source => {
      if (item.protection?.protected || source.projectId !== model.snapshot.project?.projectId) return [];
      const evidence = await captureProgram7SourceEvidence(source, bodies[source.unitId]);
      return evidence.status === 'protected' ? [] : [{ ...evidence, concernId: item.id }];
    }))).then(parts => { if (!cancelled) setConcernProjection({ bodies, items, dirty, sources: parts.flat() }); })
      .catch(() => { if (!cancelled) setConcernProjection(null); });
    return () => { cancelled = true; };
  }, [model.program7RevisionItems.activeItems, model.buffers, model.dirtyUnitIds, model.snapshot.project?.projectId]);
  const concernSources = concernProjection?.bodies === model.buffers && concernProjection.items === model.program7RevisionItems.activeItems && concernProjection.dirty === model.dirtyUnitIds ? concernProjection.sources : [];
  // An edited/unsaved source retains its marker, but never a verified prose wash.
  const concernRanges = concernSources.flatMap(source => ['current', 'exact', 'relocated'].includes(source.status) && !model.dirtyUnitIds.has(source.unitId) && source.selectionStart !== undefined && source.selectionEnd !== undefined
    ? [{ concernId: source.concernId, unitId: source.unitId, from: source.selectionStart, to: source.selectionEnd }] : []);
  const [gapPreview, setGapPreview] = useState<{ id: string; before: string; after: string; batch: ReplacementBatch } | null>(null);
  const gapInFlight = useRef(false);
  useEffect(() => { setGapPreview(null); gapInFlight.current = false; }, [projectKey]);
  const [selection, setSelection] = useState<readonly WritingRange[]>([]);
  const selectionSource = useRef<{ ranges: readonly WritingRange[]; projectId: string; generation: number; bodies: Readonly<Record<string, string>> } | null>(null);
  const [armed, setArmed] = useState<'beginning' | Point | null>(null);
  const [pinMessage, setPinMessage] = useState('');
  const armedBodies = useRef<Readonly<Record<string, string>> | null>(null);
  const armedRef = useRef(armed);
  armedRef.current = armed;
  const suppressClick = useRef<Element | null>(null);
  const crossSelection = useRef<{ a: Point; b: Point } | null>(null);
  const restoreDocumentSelection = useRef<(() => void) | null>(null);
  const [note, setNote] = useState<WritingContext['note']>(null);
  const [contextMenu, setContextMenu] = useState<WritingContext['contextMenu']>(null);
  const contextMenuRef = useRef(contextMenu);
  contextMenuRef.current = contextMenu;
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [sourceSelection, setSourceSelection] = useState<{ projectKey: string; ranges: readonly WritingRange[]; bodies: Readonly<Record<string, string>> } | null>(null);
  const commandsRef = useRef<DraftEditorCommands | null>(null);
  const [hasEditor, setHasEditor] = useState(false);
  const registerCommands = useCallback((commands: DraftEditorCommands | null) => {
    commandsRef.current = commands;
    setHasEditor(Boolean(commands));
  }, []);
  const [outlineView, setOutlineView] = useState<WritingOutlineView>({ order: 'writing', selected: [], comparing: false });
  const [search, setSearch] = useState<WritingSearchState>({
    open: false,
    query: '',
    replacement: '',
    matchCase: false,
    scope: 'manuscript',
    ranges: [],
    frozenBodies: {},
  });
  const searchRef = useRef(search);
  searchRef.current = search;
  const [searchNotice, setSearchNotice] = useState('');
  const [replaceReturn, setReplaceReturn] = useState<{ range: WritingRange; body: string } | null>(
    null,
  );
  // Bounded replacement batches extend the current editor's history only for
  // authored changes. The existing manuscript buffers remain the prose owner.
  const replacementHistory = useRef<{ entries: ReplacementBatch[]; cursor: number }>({ entries: [], cursor: 0 });
  const [, redrawHistory] = useState(0);
  const [editorHistoryChanges, setEditorHistoryChanges] = useState<Record<string, DraftEditorHistoryChange>>({});
  const routeHistory = useRef<(kind: 'undo' | 'redo') => boolean>(() => false);
  const [moveSource, setMoveSource] = useState<MoveSource | null>(null);
  const moveSourceRef = useRef(moveSource);
  moveSourceRef.current = moveSource;
  const [joinName, setJoinName] = useState<{ ranges: readonly WritingRange[]; name: string; bodies: Record<string, string>; linksKey: string } | null>(null);
  const [arrangementNotice, setArrangementNotice] = useState('');
  useEffect(() => {
    if (!arrangementNotice) return;
    const timer = window.setTimeout(() => setArrangementNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [arrangementNotice, projectKey]);
  useEffect(() => {
    replacementHistory.current = { entries: [], cursor: 0 };
    restoreDocumentSelection.current?.();
    crossSelection.current = null;
    setEditorHistoryChanges({});
    setMoveSource(null); moveSourceRef.current = null;
    setContextMenu(null); setJoinName(null);
    setArrangementNotice('');
  }, [projectKey]);

  useEffect(() => model.writingPage?.subscribeMembership(event => {
    const history = replacementHistory.current;
    history.entries.splice(history.cursor);
    history.entries.push({ projectKey, kind: 'membership', label: event.label,
      before: {}, after: {}, forward: {}, inverse: {},
      guardBefore: event.bodies, guardAfter: event.bodies,
      linksBefore: event.before, linksAfter: event.after,
      search: searchRef.current, afterSearch: searchRef.current });
    if (history.entries.length > 200) history.entries.shift();
    history.cursor = history.entries.length;
    redrawHistory(value => value + 1);
  }), [projectKey, model.writingPage?.subscribeMembership]);

  const acceptedRevisionSeen = useRef<string | null>(null);
  useEffect(() => {
    const event = model.acceptedRevision;
    if (!event || event.id === acceptedRevisionSeen.current) return;
    const current = latest.current.model, page = current.writingPage;
    if (!page || event.projectId !== current.snapshot.project?.projectId || event.generation !== current.snapshot.generation ||
      current.buffers[event.unitId] !== event.after || page.captureLinks().key !== event.linksBefore.key) return;
    acceptedRevisionSeen.current = event.id;
    // The main owner has already persisted this authored revision. Reuse the
    // ordinary link mapper and source-batch history; acceptance stays historical.
    page.edited(event.unitId, event.before, event.after);
    const linksAfter = page.captureLinks();
    const beforeBodies = { ...current.buffers, [event.unitId]: event.before };
    const batch: ReplacementBatch = { projectKey, kind: 'revision', before: { [event.unitId]: event.before }, after: { [event.unitId]: event.after },
      forward: { [event.unitId]: [{ from: 0, to: event.before.length, insert: event.after }] },
      inverse: { [event.unitId]: [{ from: 0, to: event.after.length, insert: event.before }] },
      guardBefore: beforeBodies, guardAfter: { ...current.buffers }, linksBefore: event.linksBefore, linksAfter, search: searchRef.current, afterSearch: searchRef.current };
    const history = replacementHistory.current;
    history.entries.splice(history.cursor); history.entries.push(batch);
    if (history.entries.length > 200) history.entries.shift(); history.cursor = history.entries.length;
    redrawHistory(value => value + 1);
    setArrangementNotice('Revision applied. Undo applied revision restores its prose during this session; Save keeps that choice. Its acceptance remains in History.');
    // Apply has already saved the prose. Complete its mapped links through the
    // existing Save owner so normal exit cannot strand them as unsaved metadata.
    // A refused save retains that owner's pending state and actionable notice.
    void page.save();
  }, [model.acceptedRevision, model.buffers, projectKey]);

  const [highlights, setHighlights] = useState<Record<HighlightKey, boolean>>(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('black-skies:writing-highlights:v1') ?? '{}',
      ) as Record<string, unknown>;
      return {
        pinned: typeof stored.pinned === 'boolean' ? stored.pinned : true,
        unpinned: typeof stored.unpinned === 'boolean' ? stored.unpinned : true,
        concerns: typeof stored.concerns === 'boolean' ? stored.concerns : true,
      };
    } catch {
      return { pinned: true, unpinned: true, concerns: true };
    }
  });
  const lastSelection = useRef('');
  const lastReadingPoint = useRef<Point | null>(null);

  const follow = (point: Point) => {
    lastReadingPoint.current = point;
    const list = document.querySelector<HTMLElement>('[data-writing-outline-list]');
    if (!list) return;
    const rows = [...list.querySelectorAll<HTMLElement>('[data-writing-outline-spans]')];
    const row = rows.find((candidate) => {
      const spans = JSON.parse(candidate.dataset.writingOutlineSpans ?? '[]') as WritingRange[];
      return spans.some(
        (span) =>
          span.unitId === point.unitId &&
          span.from <= point.offset &&
          (point.offset < span.to ||
            (point.offset === span.to &&
              span.to === latest.current.model.buffers[point.unitId]?.length)),
      );
    });
    for (const candidate of rows) {
      if (candidate === row) candidate.setAttribute('aria-current', 'location');
      else candidate.removeAttribute('aria-current');
    }
    if (!row) return;
    const frame = list.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    const shift =
      rect.top < frame.top
        ? rect.top - frame.top
        : rect.bottom > frame.bottom
          ? rect.bottom - frame.bottom
          : 0;
    if (shift)
      list.scrollTop = Math.max(
        0,
        Math.min(list.scrollHeight - list.clientHeight, list.scrollTop + shift),
      );

  };
  const followReading = () => {
    const current = latest.current.model;
    const canvas = document.querySelector<HTMLElement>(
      '[data-stage19-role="writing"] [data-manuscript-scroll-owner]',
    );
    const units = current.snapshot.project?.units ?? [];
    if (!canvas || !units.length) return;
    if (canvas.scrollTop <= 1) {
      follow({ unitId: units[0]!.id, offset: 0 });
      return;
    }
    if (canvas.scrollHeight - canvas.clientHeight - canvas.scrollTop <= 2) {
      const last = units[units.length - 1]!;
      follow({ unitId: last.id, offset: current.buffers[last.id]?.length ?? 0 });
      return;
    }
    const frame = canvas.getBoundingClientRect();
    const x = (frame.left + frame.right) / 2;
    const y = (frame.top + frame.bottom) / 2;
    const caret = document.caretRangeFromPoint(x, y);
    const point = caret && canvas.contains(caret.startContainer)
      ? readPoint(caret.startContainer, caret.startOffset)
      : null;
    if (point) {
      follow(point);
      return;
    }
    const sections = [...canvas.querySelectorAll<HTMLElement>('[data-manuscript-unit-id]')];
    const section = sections.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= y && rect.bottom >= y;
    });
    if (!section?.dataset.manuscriptUnitId) return;
    const view = section.querySelector<HTMLElement>('.cm-content');
    const editor = view ? EditorView.findFromDOM(view) : null;
    const pos = editor?.posAtCoords({ x, y });
    const span = [...section.querySelectorAll<HTMLElement>('[data-writing-span]')].find((element) =>
      [...element.getClientRects()].some((line) => line.top <= y && line.bottom >= y),
    );
    follow({
      unitId: section.dataset.manuscriptUnitId,
      offset: pos ?? Number(span?.dataset.writingFrom ?? 0),
    });
  };
  const readSelection = () => {
    const native = window.getSelection();
    const current = latest.current.model;
    const cross = crossSelection.current;
    if (cross) return { ...cross, ranges: selectedRanges(current, cross.a, cross.b) };
    const a = readPoint(native?.anchorNode ?? null, native?.anchorOffset ?? 0);
    const b = readPoint(native?.focusNode ?? null, native?.focusOffset ?? 0);
    if (a && b) return { a, b, ranges: selectedRanges(current, a, b) };
    const evidence = current.aiSelection;
    return evidence && current.activeUnit
      ? {
          a: { unitId: current.activeUnit.id, offset: evidence.selectionStart },
          b: { unitId: current.activeUnit.id, offset: evidence.selectionEnd },
          ranges: [
            {
              unitId: current.activeUnit.id,
              from: evidence.selectionStart,
              to: evidence.selectionEnd,
            },
          ].filter((range) => range.to > range.from),
        }
      : null;
  };

  useEffect(() => {
    if (!model.writingPage) return;
    let selecting = false;
    let nativeDrag: { editor: HTMLElement; restore: () => void } | null = null;
    const restoreEditor = () => {
      const drag = nativeDrag;
      nativeDrag = null;
      restoreDocumentSelection.current = null;
      drag?.restore();
      return drag;
    };
    const startNativeSelection = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey ||
          !(event.target instanceof Element) || event.target.closest('[data-writing-decoration]')) return;
      const source = event.target.closest('.cm-content, [data-writing-source]');
      const canvas = source?.closest('[data-stage19-role="writing"] [data-manuscript-scroll-owner]');
      if (!canvas) return;
      restoreDocumentSelection.current?.();
      restoreEditor();
      selecting = true;
      crossSelection.current = null;
      const editor = canvas.querySelector<HTMLElement>('.cm-content[contenteditable="true"]');
      if (editor) {
        const restore = commandsRef.current?.beginDocumentSelection?.();
        if (restore) {
          nativeDrag = { editor, restore };
          restoreDocumentSelection.current = restoreEditor;
        }
      }
      // A new drag inside an old document selection must start a new range,
      // rather than initiating Chromium's native selected-text drag.
      if (!event.shiftKey) window.getSelection()?.removeAllRanges();
      // Let the browser select across the whole manuscript instead of allowing
      // the active section's editor to clamp the drag to its own document.
      event.stopPropagation();
    };
    const finishNativeSelection = () => {
      if (!selecting) return;
      selecting = false;
      const native = window.getSelection();
      const a = readPoint(native?.anchorNode ?? null, native?.anchorOffset ?? 0);
      const b = readPoint(native?.focusNode ?? null, native?.focusOffset ?? 0);
      if (!a || !b) { restoreEditor(); return; }
      crossSelection.current = a.unitId === b.unitId ? null : { a, b };
      // Restoring contenteditable while a document selection crosses the editor
      // makes Chromium clamp it back to that editor. Keep it in reading mode
      // until the next source gesture or explicit navigation.
      if (crossSelection.current) return;
      const drag = restoreEditor();
      if (a.unitId === b.unitId && drag?.editor.closest<HTMLElement>('[data-manuscript-unit-id]')?.dataset.manuscriptUnitId === a.unitId) {
        const editor = EditorView.findFromDOM(drag.editor);
        editor?.dispatch({ selection: { anchor: a.offset, head: b.offset }, userEvent: 'select.pointer' });
        editor?.focus();
      }
    };
    const copy = (event: ClipboardEvent) => {
      const selected = readSelection();
      const focused = document.activeElement;
      if (!selected || selected.a.unitId === selected.b.unitId || !event.clipboardData || window.getSelection()?.isCollapsed ||
          focused?.matches('input, textarea, select') ||
          (focused?.matches('[contenteditable="true"]') && !focused.matches('.cm-content'))) return;
      const current = latest.current.model;
      event.clipboardData.setData('text/plain', selectedRanges(current, selected.a, selected.b)
        .map(range => current.buffers[range.unitId]?.slice(range.from, range.to) ?? '').join('\n\n'));
      event.preventDefault();
    };
    const pointerUp = (event: PointerEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('[data-stage19-role="writing"] [data-manuscript-unit-id]') ||
        event.target.closest('[data-writing-decoration]')
      )
        return;
      const current = readSelection();
      if (!current) return;
      const mode = armedRef.current;
      if (mode) {
        suppressClick.current = event.target.closest('[data-manuscript-unit-id]');
        if (mode === 'beginning') {
          armedRef.current = current.a;
          setArmed(current.a);
        } else {
          armedRef.current = null;
          setArmed(null);
          const ranges = selectedRanges(latest.current.model, mode, current.b);
          setSelection(ranges);
          void latest.current.model.writingPage?.pin(ranges);
        }
      } else {
        if (current.ranges.length && event.target.closest('[data-writing-source]'))
          suppressClick.current = event.target.closest('[data-manuscript-unit-id]');
        setSelection(current.ranges);
        if (current.ranges.length && !moveSourceRef.current) {
          const state = latest.current.model;
          setContextMenu({ x: Math.max(4, Math.min(event.clientX, window.innerWidth - 300)),
            y: Math.max(4, Math.min(event.clientY + 12, window.innerHeight - 300)),
            ranges: current.ranges, point: current.a, bodies: { ...state.buffers },
            linksKey: state.writingPage!.captureLinks().key, keyboard: false });
        }
        follow(current.a);
        if (!current.ranges.length && current.a.unitId !== latest.current.model.activeUnit?.id)
          void navigate({ unitId: current.a.unitId, from: current.a.offset, to: current.a.offset });
      }
    };
    const click = (event: MouseEvent) => {
      const source = suppressClick.current;
      suppressClick.current = null;
      // Selection can end without a click (drag, canceled gesture or a changed
      // source view). It must never consume the next unrelated author action.
      if (!source || !(event.target instanceof Node) || !source.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const escape = (event: KeyboardEvent) => {
      suppressClick.current = null;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && !event.altKey &&
          event.target instanceof Element && event.target.closest('.cm-content') &&
          (key === 'z' || key === 'y')) {
        if (routeHistory.current(key === 'y' || event.shiftKey ? 'redo' : 'undo')) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
      }
      if ((event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) &&
          event.target instanceof Element && event.target.closest('[data-manuscript-unit-id]')) {
        const selected = readSelection(), state = latest.current.model;
        if (selected) {
          const rect = event.target.getBoundingClientRect();
          setContextMenu({ x: Math.max(4, Math.min(rect.left, window.innerWidth - 300)),
            y: Math.max(4, Math.min(rect.top + 24, window.innerHeight - 300)),
            ranges: selected.ranges, point: selected.a, bodies: { ...state.buffers },
            linksKey: state.writingPage!.captureLinks().key, keyboard: true });
          event.preventDefault(); event.stopPropagation();
        }
      } else if (event.key === 'Escape' && moveSourceRef.current) {
        moveSourceRef.current = null; setMoveSource(null);
        setArrangementNotice('Move canceled. Writing was unchanged.');
        event.preventDefault(); event.stopPropagation();
      } else if (event.key === 'Escape' && contextMenuRef.current) {
        setContextMenu(null);
        commandsRef.current?.focus();
        event.preventDefault();
      } else if (event.key === 'Escape' && crossSelection.current) {
        crossSelection.current = null;
        restoreDocumentSelection.current?.();
        restoreEditor();
        setSelection([]);
        commandsRef.current?.focus();
        event.preventDefault();
      } else if (event.key === 'Escape' && armedRef.current) {
        armedRef.current = null;
        setArmed(null);
        event.preventDefault();
      } else if (
        event.key === 'Escape' &&
        event.target instanceof Element &&
        event.target.closest('[data-writing-search]')
      ) {
        setSearch((current) => ({ ...current, open: false }));
        commandsRef.current?.focus();
        event.preventDefault();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'f' &&
        event.target instanceof Element &&
        event.target.closest('[data-stage19-role="writing"]')
      ) {
        const selected = readSelection()?.ranges ?? [];
        setSearch((current) => ({
          ...current,
          open: true,
          ranges: selected,
          frozenBodies: { ...latest.current.model.buffers },
        }));
        window.requestAnimationFrame(() =>
          document.querySelector<HTMLInputElement>('[data-writing-find-input]')?.focus(),
        );
        event.preventDefault();
      }
    };
    const scroll = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-writing-context-menu]')) setContextMenu(null);
      if (event.target instanceof Element && event.target.matches('[data-manuscript-scroll-owner]'))
        followReading();
    };
    const menu = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('[data-stage19-role="writing"] [data-manuscript-unit-id]') ||
        event.target.closest('[data-writing-decoration]')
      )
        return;
      event.preventDefault();
      const selected = readSelection();
      let ranges = selected?.ranges ?? [];
      if (!ranges.length && selected)
        ranges = [{ unitId: selected.a.unitId, from: selected.a.offset, to: selected.a.offset }];
      armedRef.current = null;
      setArmed(null);
      setContextMenu({
        x: Math.max(4, Math.min(event.clientX, window.innerWidth - 300)),
        y: Math.max(4, Math.min(event.clientY, window.innerHeight - 300)),
        ranges, point: selected?.a ?? { unitId: latest.current.model.activeUnit?.id ?? '', offset: 0 },
        bodies: { ...latest.current.model.buffers }, linksKey: latest.current.model.writingPage!.captureLinks().key, keyboard: true,
      });
    };
    const outsideMenu = (event: PointerEvent) => {
      suppressClick.current = null;
      if (
        contextMenuRef.current &&
        event.target instanceof Element &&
        !event.target.closest('[data-writing-context-menu]')
      )
        setContextMenu(null);
    };
    document.addEventListener('mousedown', startNativeSelection, true);
    document.addEventListener('pointerup', finishNativeSelection, true);
    document.addEventListener('pointercancel', restoreEditor, true);
    window.addEventListener('blur', restoreEditor);
    document.addEventListener('copy', copy);
    document.addEventListener('contextmenu', menu);
    document.addEventListener('pointerdown', outsideMenu, true);
    document.addEventListener('pointerup', pointerUp);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', escape, true);
    document.addEventListener('scroll', scroll, true);
    return () => {
      restoreEditor();
      document.removeEventListener('mousedown', startNativeSelection, true);
      document.removeEventListener('pointerup', finishNativeSelection, true);
      document.removeEventListener('pointercancel', restoreEditor, true);
      window.removeEventListener('blur', restoreEditor);
      document.removeEventListener('copy', copy);
      document.removeEventListener('contextmenu', menu);
      document.removeEventListener('pointerdown', outsideMenu, true);
      document.removeEventListener('pointerup', pointerUp);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', escape, true);
      document.removeEventListener('scroll', scroll, true);
    };
    // Native handlers use the current model through a ref and retain local UI.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(model.writingPage)]);

  useEffect(() => {
    const source = model.aiSelection;
    if (!source || !model.activeUnit || armedRef.current || crossSelection.current) return;
    const signature = `${model.activeUnit.id}:${source.selectionStart}:${source.selectionEnd}:${source.sourceFingerprint}`;
    if (signature === lastSelection.current) return;
    lastSelection.current = signature;
    setSelection(
      source.selectionEnd > source.selectionStart
        ? [{ unitId: model.activeUnit.id, from: source.selectionStart, to: source.selectionEnd }]
        : [],
    );
    follow({ unitId: model.activeUnit.id, offset: source.selectionStart });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.aiSelection, model.activeUnit?.id]);
  useEffect(() => {
    if (model.openWritingRail === 'left' || model.lockedWritingRails?.includes('left'))
      followReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.openWritingRail, model.lockedWritingRails]);

  useEffect(() => {
    if (
      armedRef.current &&
      armedBodies.current &&
      Object.entries(armedBodies.current).some(([id, body]) => model.buffers[id] !== body)
    ) {
      armedRef.current = null;
      setArmed(null);
      setPinMessage('Writing changed. Choose a new beginning and end for this unit.');
    }
  }, [model.buffers]);
  useEffect(() => {
    if (contextMenu?.keyboard)
      document
        .querySelector<HTMLButtonElement>('[data-writing-context-menu] button:not(:disabled)')
        ?.focus();
  }, [contextMenu]);
  useEffect(() => {
    if (!model.writingPage) return;
    // Freeze source proof when the selected ranges change, not on later edits
    // or surface/form renders. Preview selections have their own unit IDs.
    if (selectionSource.current?.ranges !== selection) selectionSource.current = {
      ranges: selection, projectId: model.snapshot.project?.projectId ?? '', generation: model.snapshot.generation,
      bodies: Object.fromEntries(selection.map(range => [range.unitId, model.buffers[range.unitId] ?? ''])),
    };
    actions.setWritingViewContext?.({ note, selection, selectionSource: selectionSource.current, pin: armed, search, outlineView });
  }, [note, selection, armed, search, outlineView, actions, model.writingPage, model.buffers, model.snapshot.generation, model.snapshot.project?.projectId]);
  const restoredView = model.workNavigation?.writingViewRestore;
  useEffect(() => {
    if (!restoredView) return;
    setNote(
      restoredView.state.note
        ? {
            ...restoredView.state.note,
            sourceReady: restoredView.state.note.sourceReady ?? Boolean(restoredView.state.note.id),
          }
        : null,
    );
    if (restoredView.state.search) setSearch(restoredView.state.search);
    if (restoredView.state.outlineView) setOutlineView(restoredView.state.outlineView);
    // Back restores the original source proof too; a later body must not
    // silently certify old offsets as a fresh revision selection.
    selectionSource.current = { ranges: restoredView.state.selection,
      projectId: restoredView.state.selectionSource?.projectId ?? '',
      generation: restoredView.state.selectionSource?.generation ?? -1,
      bodies: restoredView.state.selectionSource?.bodies ?? {} };
    setSelection(restoredView.state.selection);
    armedRef.current = restoredView.state.pin;
    setArmed(restoredView.state.pin);
  }, [restoredView]);

  const navigate = async (range: WritingRange, record = true) => {
    setSourceSelection(null);
    restoreDocumentSelection.current?.();
    crossSelection.current = null;
    if (record) latest.current.actions.rememberWork?.();
    const identity = latest.current.model.snapshot.project?.projectId;
    const body = latest.current.model.buffers[range.unitId];
    if (body === undefined || range.to > body.length) return;
    const anchor = await buildLivingOutlineSourceAnchor(range.unitId, body, range.from, range.to);
    if (
      latest.current.model.snapshot.project?.projectId !== identity ||
      latest.current.model.buffers[range.unitId] !== body
    )
      return;
    setReturnRequest({
      requestId: `writing-return-${crypto.randomUUID()}`,
      unitId: range.unitId,
      selectionStart: range.from,
      selectionEnd: range.to,
      selectionFingerprint: anchor.selectionFingerprint,
    });
    setSelection([range]);
    await latest.current.actions.selectUnit(range.unitId);
    follow({ unitId: range.unitId, offset: range.from });
  };
  const selectSources = async (ranges: readonly WritingRange[]) => {
    if (!ranges.length) return;
    const current = latest.current.model;
    const order = current.snapshot.project?.units.map(unit => unit.id) ?? [];
    const sorted = [...ranges].sort((a, b) => order.indexOf(a.unitId) - order.indexOf(b.unitId) || a.from - b.from);
    if (sorted.some(range => !order.includes(range.unitId) || range.from < 0 || range.to < range.from || range.to > (current.buffers[range.unitId]?.length ?? -1))) return;
    if (sorted.every(range => range.unitId === sorted[0]!.unitId)) {
      await navigate({ ...sorted[0]!, to: sorted.at(-1)!.to });
      return;
    }
    const bodies = { ...current.buffers };
    await navigate(sorted[0]!);
    if (sorted.some(range => latest.current.model.buffers[range.unitId] !== bodies[range.unitId])) return;
    setSourceSelection({ projectKey, ranges: sorted, bodies });
  };
  useEffect(() => {
    if (!sourceSelection || returnRequest || !hasEditor) return;
    const request = sourceSelection;
    const first = request.ranges[0]!, last = request.ranges.at(-1)!;
    if (request.projectKey !== projectKey || request.ranges.some(range => model.buffers[range.unitId] !== request.bodies[range.unitId])) {
      setSourceSelection(null); return;
    }
    if (model.activeUnit?.id !== first.unitId) return;
    const point = (range: WritingRange, offset: number) => {
      const section = [...document.querySelectorAll<HTMLElement>('[data-manuscript-unit-id]')].find(node => node.dataset.manuscriptUnitId === range.unitId);
      const source = section?.querySelector<HTMLElement>('.cm-content, [data-writing-source]');
      if (!source) return null;
      if (source.classList.contains('cm-content')) return EditorView.findFromDOM(source)?.domAtPos(offset) ?? null;
      const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
      let node: Node | null, remaining = offset;
      while ((node = walker.nextNode())) {
        if (node.parentElement?.closest('[data-writing-decoration]')) continue;
        const length = node.textContent?.length ?? 0;
        if (remaining <= length) return { node, offset: remaining };
        remaining -= length;
      }
      return null;
    };
    const a = point(first, first.from), b = point(last, last.to);
    if (!a || !b) { setSourceSelection(null); return; }
    restoreDocumentSelection.current?.();
    const restore = commandsRef.current?.beginDocumentSelection?.();
    restoreDocumentSelection.current = () => { restore?.(); restoreDocumentSelection.current = null; };
    crossSelection.current = { a: { unitId: first.unitId, offset: first.from }, b: { unitId: last.unitId, offset: last.to } };
    window.getSelection()?.setBaseAndExtent(a.node, a.offset, b.node, b.offset);
    setSelection(request.ranges);
    setSourceSelection(null);
    follow({ unitId: first.unitId, offset: first.from });
    // The request is source-guarded and must wait for the editor's exact return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceSelection, returnRequest, hasEditor, model.activeUnit?.id, model.buffers, projectKey]);

  useEffect(() => {
    if (!replaceReturn) return;
    const { range, body } = replaceReturn;
    if (model.buffers[range.unitId] !== body) {
      setReplaceReturn(null);
      return;
    }
    let cancelled = false;
    void navigate(range, false).finally(() => {
      if (!cancelled) setReplaceReturn(null);
    });
    return () => {
      cancelled = true;
    };
    // The existing navigation reads current bindings through latest. Its inline
    // function identity must not restart this pending replacement return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replaceReturn, model.buffers]);

  const bindNoteDraft = (session: string, ranges: readonly WritingRange[]) => {
    const bodies = { ...latest.current.model.buffers };
    void Promise.all(
      ranges.map(async (range) => {
        const body = bodies[range.unitId];
        if (body === undefined) throw new Error('The source passage is unavailable.');
        const anchor = await buildLivingOutlineSourceAnchor(
          range.unitId,
          body,
          range.from,
          range.to,
        );
        return { ...range, sourceFingerprint: anchor.sourceFingerprint };
      }),
    )
      .then((bound) => {
        const changed = ranges.some(
          (range) => latest.current.model.buffers[range.unitId] !== bodies[range.unitId],
        );
        setNote((current) =>
          current?.session === session
            ? {
                ...current,
                ranges: changed ? [] : bound,
                sourceReady: !changed && bound.length > 0,
                sourceQuotes: changed ? [] : ranges.map(range => (bodies[range.unitId] ?? '').slice(range.from, range.to)),
                message: changed
                  ? 'The writing changed. Select its current words and use the current selection.'
                  : undefined,
              }
            : current,
        );
      })
      .catch(() =>
        setNote((current) =>
          current?.session === session
            ? {
                ...current,
                sourceReady: false,
                message: 'Choose an available writing passage for this Note.',
              }
            : current,
        ),
      );
  };
  const openNote = (id: string | null, ranges = selection) => {
    actions.rememberWork?.();
    const item = model.writingPage?.notes.find((candidate) => candidate.id === id);
    const session = crypto.randomUUID();
    setNote({ session, id, body: item?.body ?? '', ranges, sourceReady: Boolean(id) });
    if (!id) bindNoteDraft(session, ranges);
    if (item?.sourceAnchor && ranges.length) {
      const span = item.sourceAnchor;
      const source = model.buffers[span.unitId];
      if (source !== undefined && item.sourceMapped) {
        void navigate(
          { unitId: span.unitId, from: span.selectionStart, to: span.selectionEnd },
          false,
        );
        return;
      }
      if (source !== undefined)
        void resolveLivingOutlineAnchor(span, source).then((resolved) => {
          if (resolved.status === 'exact' || resolved.status === 'relocated')
            void navigate(
              { unitId: span.unitId, from: resolved.selectionStart, to: resolved.selectionEnd },
              false,
            );
        });
    }
  };
  const searchRanges =
    search.scope === 'selection'
      ? search.ranges
      : (model.snapshot.project?.units ?? [])
          .filter((unit) => search.scope === 'manuscript' || unit.id === model.activeUnit?.id)
          .map((unit) => ({ unitId: unit.id, from: 0, to: model.buffers[unit.id]?.length ?? 0 }));
  const sourceChanged =
    search.scope === 'selection' &&
    searchRanges.some((range) => search.frozenBodies[range.unitId] !== model.buffers[range.unitId]);
  const searchMatches = sourceChanged
    ? []
    : searchRanges.flatMap((range) =>
        findLiteralWritingMatches(
          model.buffers[range.unitId] ?? '',
          search.query,
          search.matchCase,
          range.from,
          range.to,
        ).map((match) => ({ ...match, unitId: range.unitId })),
      );
  const nextSearchMatch = (afterSelection: boolean) => {
    const units = model.snapshot.project?.units ?? [];
    const active = units.findIndex((unit) => unit.id === model.activeUnit?.id);
    const offset = afterSelection
      ? (model.aiSelection?.selectionEnd ?? 0)
      : (model.aiSelection?.selectionStart ?? 0);
    return (
      searchMatches.find((match) => {
        const index = units.findIndex((unit) => unit.id === match.unitId);
        return index > active || (index === active && match.from >= offset);
      }) ?? searchMatches[0]
    );
  };
  const matchesBodies = (bodies: Record<string, string>) => Object.entries(bodies)
    .every(([id, body]) => latest.current.model.buffers[id] === body);
  const applyReplacement = (batch: ReplacementBatch, kind: 'edit' | 'undo' | 'redo'): boolean => {
    const before = kind === 'undo' ? batch.after : batch.before;
    const after = kind === 'undo' ? batch.before : batch.after;
    const changes = kind === 'undo' ? batch.inverse : batch.forward;
    const links = kind === 'undo' ? batch.linksBefore : batch.linksAfter;
    const page = latest.current.model.writingPage;
    if (batch.projectKey !== projectKey || (links && !page?.canInstallLinks(links, { ...latest.current.model.buffers, ...after }))) return false;
    setEditorHistoryChanges(Object.fromEntries(Object.keys(after).map(id => [id, {
      requestId: crypto.randomUUID(), before: before[id]!, after: after[id]!, changes: changes[id]!, kind,
    }])));
    for (const [id, body] of Object.entries(after))
      latest.current.actions.changeBuffer(id, body, changes[id], kind === 'edit' ? undefined : kind);
    if (links && !page?.installLinks(links, kind === 'undo' ? batch.linksAfter : batch.linksBefore)) throw new Error('The writing arrangement could not install its validated links. Save has not been committed.');
    return true;
  };

  const runGapBatch = async (batch: ReplacementBatch, kind: 'edit' | 'undo' | 'redo', applied: () => void) => {
    if (gapInFlight.current || !batch.gap || model.recoveryBlocksEditing) return;
    const page = model.writingPage;
    if (!page?.performGap || page.pendingGap || page.busy) return;
    gapInFlight.current = true;
    try {
      const gap = batch.gap, backwards = kind === 'undo';
      const links = backwards ? batch.linksBefore! : batch.linksAfter!;
      const before = (backwards ? batch.after : batch.before)[gap.beforeAnchor.unitId]!;
      const after = (backwards ? batch.before : batch.after)[gap.beforeAnchor.unitId]!;
      const source = await buildLivingOutlineSourceAnchor(gap.beforeAnchor.unitId, before, 0, 0);
      const destination = await buildLivingOutlineSourceAnchor(gap.beforeAnchor.unitId, after, 0, 0);
      if (batch.projectKey !== projectKey || !matchesBodies(backwards ? batch.guardAfter : batch.guardBefore)) { setArrangementNotice('Writing changed. Preview the gap again.'); return; }
      const pending: GapWritingOperationV1 = { id: `gap-${crypto.randomUUID()}`, gapId: gap.id, unitId: gap.beforeAnchor.unitId,
        direction: backwards ? 'undo' : 'fill', beforeFingerprint: source.sourceFingerprint, afterFingerprint: destination.sourceFingerprint,
        from: gap.from, to: backwards ? gap.from + gap.insertedLength : gap.from, insertedLength: backwards ? 0 : gap.insertedLength,
        groupId: gap.groupId, groups: links.groups.map(group => {
          const current = page.groups.find(present => present.id === group.id);
          return current ? { ...group, label: current.label, customLabel: current.customLabel } : group;
        }), noteAnchors: links.notes.filter(note => note.anchors.length && (note.id === gap.id || note.anchors.some(anchor => anchor.unitId === gap.beforeAnchor.unitId))).map(note => ({ itemId: note.id, anchor: note.anchors[0]!, anchors: note.anchors, reconnect: true })),
        target: { kind: backwards ? 'gap' : 'fragment', state: backwards ? gap.state : 'authored', anchor: backwards ? gap.beforeAnchor : gap.afterAnchor } };
      await page.performGap(pending, after, () => {
        const changed = applyReplacement({ ...batch, linksBefore: undefined, linksAfter: undefined }, kind);
        if (changed) applied();
        return changed;
      });
    } finally { gapInFlight.current = false; }
  };

  const previewGap = async (id: string, text: string) => {
    setGapPreview(null);
    const page = model.writingPage;
    if (!page?.ready || page.busy || page.pendingGap || model.recoveryBlocksEditing) return;
    try {
      if (page.unresolved.length || page.unresolvedNotes.length) throw new Error('Reconnect unresolved sources before filling a gap.');
      const gap = page.notes.find(note => note.id === id && note.kind === 'gap');
      const anchor = gap?.sourceAnchor;
      if (!gap || !anchor) throw new Error('Place this gap at a current writing cursor first.');
      const bodies = { ...model.buffers }, unitId = anchor.unitId;
      const source = bodies[unitId];
      if (source === undefined) throw new Error('The gap source is unavailable.');
      if (getDraftEmphasis(source).some(span => anchor.selectionStart > span.from && anchor.selectionStart < span.to)) throw new Error('Place the gap outside existing formatted words.');
      const plan = planGapInsertion(source, anchor.selectionStart, text);
      const captured = page.captureLinks();
      const afterBodies = { ...bodies, [unitId]: plan.after };
      const rebuild = async (links: WritingLinksSnapshot, texts: Readonly<Record<string, string>>) => {
        const rebuildAnchor = (a: LivingOutlineSourceAnchorV1) => buildLivingOutlineSourceAnchor(a.unitId, texts[a.unitId]!, a.selectionStart, a.selectionEnd);
        const groups = await Promise.all(links.groups.map(async group => ({ ...group, spans: await Promise.all(group.spans.map(rebuildAnchor)) })));
        const notes = await Promise.all(links.notes.map(async note => ({ ...note, anchors: await Promise.all(note.anchors.map(rebuildAnchor)) })));
        return { groups, notes, key: writingLinksKey(groups, notes), pinHistory: [], planHistory: [] } satisfies WritingLinksSnapshot;
      };
      const beforeLinks = await rebuild(captured, bodies);
      const shift = (a: LivingOutlineSourceAnchorV1) => a.unitId === unitId ? rebaseWritingAnchor(a, [plan.edit]) : a;
      const groupId = `writing-${crypto.randomUUID()}`;
      const afterAnchor = await buildLivingOutlineSourceAnchor(unitId, plan.after, plan.from, plan.to);
      const beforeAnchor = await buildLivingOutlineSourceAnchor(unitId, source, anchor.selectionStart, anchor.selectionStart);
      const groups = [...subtractWritingSelection(captured.groups.map(group => ({ ...group, spans: group.spans.map(shift) })), [{ unitId, from: plan.edit.from, to: plan.edit.from + plan.edit.insert.length }]),
        { id: groupId, label: text.trim().split(/\s+/u).slice(0, 10).join(' ').slice(0, 240), spans: [afterAnchor] }];
      const notes = captured.notes.map(note => ({ ...note, anchors: note.id === id ? [afterAnchor] : note.anchors.flatMap(a => {
        if (a.unitId !== unitId || a.selectionEnd <= plan.edit.from) return [a];
        if (a.selectionStart >= plan.edit.from) return [{ ...a, selectionStart: a.selectionStart + plan.edit.insert.length, selectionEnd: a.selectionEnd + plan.edit.insert.length }];
        return [{ ...a, selectionEnd: plan.edit.from }, { ...a, selectionStart: plan.edit.from + plan.edit.insert.length, selectionEnd: a.selectionEnd + plan.edit.insert.length }];
      }) }));
      const afterLinks = await rebuild({ groups, notes, key: '' }, afterBodies);
      if (!page.canInstallLinks(afterLinks, afterBodies) || !matchesBodies(bodies) || page.captureLinks().key !== captured.key) throw new Error('Writing or links changed while preparing the gap. Preview again.');
      const batch: ReplacementBatch = { projectKey, kind: 'gap', before: { [unitId]: source }, after: { [unitId]: plan.after },
        forward: { [unitId]: [plan.edit] }, inverse: { [unitId]: [{ from: plan.edit.from, to: plan.edit.from + plan.edit.insert.length, insert: '' }] },
        guardBefore: bodies, guardAfter: afterBodies, search, afterSearch: search, linksBefore: beforeLinks, linksAfter: afterLinks,
        gap: { id, state: gap.state, beforeAnchor, afterAnchor, groupId, from: plan.edit.from, insertedLength: plan.edit.insert.length } };
      setGapPreview({ id, before: source, after: plan.after, batch }); setArrangementNotice('Gap preview only. Its planning information will remain as an attached Note.');
    } catch (error) { setArrangementNotice(error instanceof Error ? error.message : 'The gap could not be prepared.'); }
  };

  const prepareMove = (groupId: string, destination: Point): PreparedMove | null => {
    const page = model.writingPage;
    if (!page?.ready || page.busy || page.pendingGap || model.recoveryBlocksEditing) return null;
    try {
      if (page.unresolved.length || page.unresolvedNotes.length) throw new Error('Reconnect unresolved writing and Note sources before moving a passage.');
      const source = page.groups.find(group => group.id === groupId);
      if (!source) throw new Error('This unit is no longer available.');
      const destinationBody = model.buffers[destination.unitId];
      if (destinationBody === undefined || !writingMoveBoundaries(destination.unitId, destinationBody, page.groups).includes(destination.offset))
        throw new Error('Choose a unit or paragraph insertion marker.');
      let cuts = source.spans.map(span => ({ unitId: span.unitId, from: span.selectionStart, to: span.selectionEnd }));
      for (const cut of cuts) {
        const emphasis = getDraftEmphasis(model.buffers[cut.unitId]!);
        for (let pass = 0; pass <= emphasis.length; pass += 1) {
          let expanded = false;
          for (const span of emphasis) {
            if (cut.from >= span.to || cut.to <= span.from) continue;
            if (cut.from <= span.contentFrom && cut.to >= span.contentTo) {
              if (cut.from > span.from || cut.to < span.to) expanded = true;
              cut.from = Math.min(cut.from, span.from); cut.to = Math.max(cut.to, span.to);
            } else if (!(cut.from <= span.from && cut.to >= span.to)) {
              throw new Error('This move would split visible formatting. Include the whole formatted passage before moving it.');
            }
          }
          if (!expanded) break;
        }
      }
      // A first paragraph owns its following blank-line separator when moved.
      // Carry those exact characters instead of leaving a leading separator
      // that the existing Markdown envelope would discard on Save/reopen.
      // Do this before link/overlap validation so spacing attachments retain
      // the same protections as the rest of the moved source.
      for (const cut of cuts) {
        if (cut.from !== 0) continue;
        const separator = /^\n(?:[ \t]*\n)+/u.exec(model.buffers[cut.unitId]!.slice(cut.to));
        if (separator) cut.to += separator[0].length;
      }
      const merged: typeof cuts = [];
      for (const cut of cuts.sort((a, b) => a.unitId.localeCompare(b.unitId) || a.from - b.from)) {
        const previous = merged.at(-1);
        if (previous?.unitId === cut.unitId && previous.to >= cut.from) previous.to = Math.max(previous.to, cut.to);
        else merged.push(cut);
      }
      cuts = merged;
      for (const cut of cuts) {
        const body = model.buffers[cut.unitId]!;
        for (const edge of [cut.from, cut.to]) if (/[\p{L}\p{N}\p{M}]/u.test(body[edge - 1] ?? '') && /[\p{L}\p{N}\p{M}]/u.test(body[edge] ?? ''))
          throw new Error('This move would split a word. Adjust the unit boundary first.');
      }
      let offset = destination.offset;
      const targetUnit = destination.unitId;
      for (const item of model.program7RevisionItems.activeItems) for (const evidence of revisionItemSources(item)) {
        if ((evidence.protection.metadataOnly || !['included', 'local-only'].includes(evidence.protection.sourceClass)) &&
            (evidence.unitId === targetUnit || cuts.some(cut => cut.unitId === evidence.unitId)))
          throw new Error('Protected source information prevents this move. No writing was changed.');
      }
      for (const span of getDraftEmphasis(model.buffers[targetUnit]!)) {
        if (offset === span.contentFrom) offset = span.from;
        else if (offset > span.from && offset < span.to) throw new Error('Choose a destination outside an existing formatted passage.');
      }
      if (/[\p{L}\p{N}\p{M}]/u.test(destinationBody[offset - 1] ?? '') && /[\p{L}\p{N}\p{M}]/u.test(destinationBody[offset] ?? ''))
        throw new Error('Choose an insertion marker outside the middle of a word.');
      for (const other of page.groups.filter(group => group.id !== groupId)) {
        if (other.spans.some(span => cuts.some(cut => cut.unitId === span.unitId && cut.from < span.selectionEnd && cut.to > span.selectionStart)))
          throw new Error('The move would include another unit. Adjust its boundaries first.');
      }
      const beforeLinks = page.captureLinks();
      for (const note of beforeLinks.notes) for (const anchor of note.anchors) {
        const overlap = cuts.filter(cut => cut.unitId === anchor.unitId).reduce((total, cut) => total + Math.max(0, Math.min(cut.to, anchor.selectionEnd) - Math.max(cut.from, anchor.selectionStart)), 0);
        if ((overlap > 0 && overlap < anchor.selectionEnd - anchor.selectionStart) ||
            (anchor.unitId === targetUnit && offset > anchor.selectionStart && offset < anchor.selectionEnd))
          throw new Error('This move would split a linked Note passage. Adjust the boundaries first.');
      }
      const plan = planWritingMove(model.snapshot.project!.units.map(unit => unit.id), model.buffers, cuts, { unitId: targetUnit, offset });
      if (!plan.changedUnitIds.length) throw new Error('The passage is already at this position.');
      if (plan.changedUnitIds.some(id => plan.after[id]!.startsWith('\n')))
        throw new Error('This move would change an unsupported line-break boundary. No writing was changed.');
      const mapAnchor = (anchor: typeof source.spans[number]) => relocateWritingRange({ unitId: anchor.unitId, from: anchor.selectionStart, to: anchor.selectionEnd }, plan)
        .map(range => ({ ...anchor, unitId: range.unitId, selectionStart: range.from, selectionEnd: range.to,
          anchorKind: range.from === range.to ? 'position' as const : 'span' as const }));
      const groups = beforeLinks.groups.map(group => {
        let spans = group.spans.flatMap(mapAnchor);
        if (group.id === groupId && spans.length > 1 && spans.every(span => span.unitId === spans[0]!.unitId))
          spans = [{ ...spans[0]!, selectionStart: Math.min(...spans.map(span => span.selectionStart)), selectionEnd: Math.max(...spans.map(span => span.selectionEnd)) }];
        return { ...group, spans };
      });
      const notes = beforeLinks.notes.map(note => ({ ...note, anchors: note.anchors.flatMap(mapAnchor) }));
      const afterLinks: WritingLinksSnapshot = { groups, notes, key: writingLinksKey(groups, notes), pinHistory: [], planHistory: [] };
      if (!page.canInstallLinks(afterLinks, plan.after)) throw new Error('The proposed move cannot retain the current links. No writing was changed.');
      return { groupId, plan, projectKey, beforeLinks, afterLinks };
    } catch (error) {
      setArrangementNotice(error instanceof Error ? error.message : 'The move could not be prepared.');
      return null;
    }
  };
  const applyMove = (preview: PreparedMove) => {
    const page = model.writingPage;
    if (!page || page.busy || page.pendingGap || model.recoveryBlocksEditing) return;
    if (preview.projectKey !== projectKey || !matchesBodies({ ...preview.plan.before }) || page.captureLinks().key !== preview.beforeLinks.key) {
      setArrangementNotice('Writing or its links changed. Choose the move again.'); return;
    }
    const before: Record<string, string> = {}, after: Record<string, string> = {};
    const forward: Record<string, WritingEdit[]> = {}, inverse: Record<string, WritingEdit[]> = {};
    for (const id of preview.plan.changedUnitIds) {
      before[id] = preview.plan.before[id]!; after[id] = preview.plan.after[id]!;
      forward[id] = [{ from: 0, to: before[id]!.length, insert: after[id]! }];
      inverse[id] = [{ from: 0, to: after[id]!.length, insert: before[id]! }];
    }
    const batch: ReplacementBatch = { projectKey, kind: 'move', before, after, forward, inverse,
      guardBefore: { ...preview.plan.before }, guardAfter: { ...preview.plan.after }, search, afterSearch: search,
      linksBefore: preview.beforeLinks, linksAfter: preview.afterLinks };
    if (!applyReplacement(batch, 'edit')) { setArrangementNotice('The move is no longer available. Choose it again.'); return; }
    const history = replacementHistory.current;
    history.entries.splice(history.cursor); history.entries.push(batch);
    if (history.entries.length > 200) history.entries.shift();
    history.cursor = history.entries.length;
    setMoveSource(null); moveSourceRef.current = null; setSelection([]); redrawHistory(value => value + 1);
    setArrangementNotice('Passage moved with its Notes. Save writing keeps it; Undo restores it.');
  };
  const controlsCurrent = () => {
    const controls = contextMenuRef.current;
    if (!controls || !matchesBodies(controls.bodies) || model.writingPage?.captureLinks().key !== controls.linksKey) {
      setArrangementNotice('Writing or its links changed. Select the current words again.'); return false;
    }
    return !model.recoveryBlocksEditing && Boolean(model.writingPage?.ready) && !model.writingPage?.busy;
  };
  const requestPin = (ranges: readonly WritingRange[], extendId?: string, name?: string) => {
    const page = model.writingPage;
    if (!page || model.recoveryBlocksEditing || page.busy || page.pendingGap) return;
    const included = page.groups.filter(group => group.spans.every(span => ranges.some(range =>
      range.unitId === span.unitId && range.from <= span.selectionStart && range.to >= span.selectionEnd)));
    const proposed = joinedWritingName(included, model.snapshot.project!.units.map(unit => unit.id));
    if (!extendId && name === undefined && proposed.length > 240) {
      setJoinName({ ranges, name: proposed, bodies: { ...model.buffers }, linksKey: page.captureLinks().key });
      setContextMenu(null); return;
    }
    void page.pin(ranges, { extendId, name }); setContextMenu(null);
  };
  const startMove = (id: string) => {
    const page = latest.current.model.writingPage;
    if (!page?.ready || page.busy || page.pendingGap || latest.current.model.recoveryBlocksEditing || !page.groups.some(group => group.id === id)) return;
    const source = { groupId: id, projectKey, bodies: { ...latest.current.model.buffers }, linksKey: page.captureLinks().key };
    moveSourceRef.current = source; setMoveSource(source); setContextMenu(null);
    setArrangementNotice('Choose an insertion marker in the writing or Outline. Escape cancels.');
  };
  const moveTo = (point: Point, groupId?: string) => {
    const source = moveSourceRef.current;
    if (!source || (groupId !== undefined && source.groupId !== groupId)) return;
    if (source.projectKey !== projectKey || !matchesBodies(source.bodies) || model.writingPage?.captureLinks().key !== source.linksKey) {
      setArrangementNotice('Writing or its links changed. Choose the move again.'); return;
    }
    const prepared = prepareMove(source.groupId, point);
    if (prepared) applyMove(prepared);
  };
  const replaceWriting = (all: boolean) => {
    if (replaceReturn || returnRequest || model.recoveryBlocksEditing || model.writingPage?.busy)
      return;
    const next = nextSearchMatch(false);
    const chosen = all ? searchMatches : next ? [next] : [];
    const before: Record<string, string> = {};
    const after: Record<string, string> = {};
    const inverse: Record<string, WritingEdit[]> = {};
    const changes: Record<string, WritingEdit[]> = {};
    for (const match of chosen)
      (changes[match.unitId] ??= []).push({
        from: match.from,
        to: match.to,
        insert: search.replacement,
      });
    for (const [unitId, edits] of Object.entries(changes)) {
      const source = latest.current.model.buffers[unitId];
      if (source === undefined) return;
      before[unitId] = source;
      let previous = 0;
      let delta = 0;
      let changed = '';
      inverse[unitId] = [];
      for (const edit of edits) {
        changed += source.slice(previous, edit.from) + edit.insert;
        inverse[unitId]!.push({
          from: edit.from + delta,
          to: edit.from + delta + edit.insert.length,
          insert: source.slice(edit.from, edit.to),
        });
        delta += edit.insert.length - (edit.to - edit.from);
        previous = edit.to;
      }
      after[unitId] = changed + source.slice(previous);
    }
    if (!chosen.length) {
      setSearchNotice('No matching words in this scope.');
      return;
    }
    const afterSearch = search.scope === 'selection' ? {
      ...search,
      frozenBodies: { ...search.frozenBodies, ...after },
      ranges: search.ranges.map(range => ({ ...range,
        from: mapWritingOffset(range.from, changes[range.unitId] ?? []),
        to: mapWritingOffset(range.to, changes[range.unitId] ?? []),
      })),
    } : search;
    const guardBefore = { ...latest.current.model.buffers };
    const batch: ReplacementBatch = { projectKey, kind: 'replacement', before, after, forward: changes, inverse, search, afterSearch, guardBefore, guardAfter: { ...guardBefore, ...after } };
    const history = replacementHistory.current;
    history.entries.splice(history.cursor);
    history.entries.push(batch);
    if (history.entries.length > 200) history.entries.shift();
    history.cursor = history.entries.length;
    applyReplacement(batch, 'edit');
    if (search.scope === 'selection') setSearch(afterSearch);
    redrawHistory(value => value + 1);
    if (!all && next) {
      const end = next.from + search.replacement.length;
      setReplaceReturn({
        range: { unitId: next.unitId, from: end, to: end },
        body: after[next.unitId]!,
      });
    }
    setSearchNotice(
      `${chosen.length} replacement${chosen.length === 1 ? '' : 's'} made in ${Object.keys(after).length} writing section${Object.keys(after).length === 1 ? '' : 's'}. Save keeps the changes; Undo replacement restores this batch.`,
    );
  };
  const undoReplacement = (requiredKind?: ReplacementBatch['kind']) => {
    const history = replacementHistory.current;
    const batch = history.entries[history.cursor - 1];
    if (!batch || batch.projectKey !== projectKey || model.recoveryBlocksEditing || model.writingPage?.busy) return;
    if (requiredKind && batch.kind !== requiredKind) {
      const message = 'The earlier batch was not restored over newer edits. Use Undo to reverse the latest action first.';
      if (requiredKind === 'replacement') setSearchNotice(message); else setArrangementNotice(message); return;
    }
    if (batch.kind === 'revision' && commandsRef.current?.hasHistory?.('undo') && !commandsRef.current.historyMatches?.('undo', batch.before[latest.current.model.activeUnit?.id ?? ''] ?? '')) { setArrangementNotice('A newer source action must be undone first.'); return; }
    if (!matchesBodies(batch.after)) {
      const message = 'Writing changed after this action. The earlier batch was not restored over newer edits.';
      if (batch.kind === 'move') setArrangementNotice(message);
      else setSearchNotice('Writing changed after the replacement. The earlier batch was not restored over newer edits.');
      return;
    }
    if (batch.linksAfter && model.writingPage?.captureLinks().key !== batch.linksAfter.key) {
      setArrangementNotice('Writing units or Note links changed after the move. Undo those changes before undoing this move.'); return;
    }
    if (batch.kind === 'gap') {
      void runGapBatch(batch, 'undo', () => { history.cursor -= 1; redrawHistory(value => value + 1); }); return;
    }
    if (!applyReplacement(batch, 'undo')) return;
    history.cursor -= 1;
    setSearch(batch.search);
    redrawHistory(value => value + 1);
    if (batch.kind === 'membership') { void model.writingPage?.save(); setArrangementNotice((batch.label ?? 'Unit change') + ' undone.'); }
    else if (batch.kind === 'writing') setArrangementNotice('Writing undone.');
    else if (batch.kind === 'move') setArrangementNotice('Passage move undone. Save writing keeps this restored order.');
    else setSearchNotice('Replacement batch undone.');
  };
  routeHistory.current = kind => {
    if (model.writingPage?.pendingGap) { setArrangementNotice('Finish the pending gap save before changing its source history.'); return true; }
    const history = replacementHistory.current;
    const batch = history.entries[kind === 'undo' ? history.cursor - 1 : history.cursor];
    if (!batch || batch.projectKey !== projectKey || !matchesBodies(kind === 'undo' ? batch.guardAfter : batch.guardBefore)) return false;
    const active = model.activeUnit?.id;
    const expected = active ? (kind === 'undo' ? batch.before[active] : batch.after[active]) : undefined;
    // Equal prose alone does not prove this was the last action: a later
    // formatting toggle can return to exactly the same words. Respect the
    // current editor's next history step before routing a whole batch.
    if (batch.kind !== 'writing' && batch.kind !== 'membership' && expected !== undefined && commandsRef.current?.historyMatches &&
        !commandsRef.current.historyMatches(kind, expected) && !(batch.kind === 'revision' && !commandsRef.current.hasHistory?.(kind))) return false;
    if (model.recoveryBlocksEditing || model.writingPage?.busy || replaceReturn || returnRequest) return true;
    const expectedLinks = kind === 'undo' ? batch.linksAfter : batch.linksBefore;
    if (expectedLinks && model.writingPage?.captureLinks().key !== expectedLinks.key) {
      setArrangementNotice('Writing units or Note links changed. The passage move history was not applied over them.'); return true;
    }
    if (kind === 'undo') undoReplacement();
    else {
      if (batch.kind === 'gap') { void runGapBatch(batch, 'redo', () => { history.cursor += 1; redrawHistory(value => value + 1); }); return true; }
      if (!applyReplacement(batch, 'redo')) return true;
      history.cursor += 1;
      setSearch(batch.afterSearch);
      redrawHistory(value => value + 1);
      if (batch.kind === 'membership') { void model.writingPage?.save(); setArrangementNotice((batch.label ?? 'Unit change') + ' redone.'); }
      else if (batch.kind === 'writing') setArrangementNotice('Writing redone.');
      else if (batch.kind === 'move') setArrangementNotice('Passage move redone. Save writing keeps it.');
      else setSearchNotice('Replacement batch redone.');
    }
    return true;
  };
  const context: WritingContext = {
    model,
    actions,
    createGap: async (label, body) => {
      const unitId = model.activeUnit?.id;
      if (!unitId) return;
      const at = model.aiSelection?.selectionStart ?? 0;
      await model.writingPage?.createPlanningItem(label, body, 'gap', 'passage', { unitId, from: at, to: at });
    },
    previewGap, gapPreview,
    applyGap: () => {
      if (!gapPreview) return;
      const batch = gapPreview.batch;
      if (model.writingPage?.captureLinks().key !== batch.linksBefore?.key) { setArrangementNotice('Gap links changed. Preview again.'); return; }
      void runGapBatch(batch, 'edit', () => {
        const history = replacementHistory.current; history.entries.splice(history.cursor); history.entries.push(batch);
        if (history.entries.length > 200) history.entries.shift(); history.cursor = history.entries.length;
        setGapPreview(null); redrawHistory(value => value + 1);
      });
    },
    cancelGap: () => { setGapPreview(null); setArrangementNotice('Gap preview canceled. Nothing was inserted.'); },
    undoGap: () => undoReplacement('gap'),
    undoRevision: () => undoReplacement('revision'),
    canUndoRevision: replacementHistory.current.entries[replacementHistory.current.cursor - 1]?.kind === 'revision',
    canUndoGap: !model.writingPage?.pendingGap && replacementHistory.current.entries[replacementHistory.current.cursor - 1]?.kind === 'gap',
    selection,
    armed,
    pinMessage,
    contextMenu,
    closeContextMenu: () => setContextMenu(null),
    contextNote: () => {
      if (contextMenu) openNote(null, contextMenu.ranges);
      setContextMenu(null);
    },
    useCurrentNoteSelection: () => {
      if (note) bindNoteDraft(note.session, readSelection()?.ranges ?? selection);
    },
    commands: hasEditor ? commandsRef.current : null,
    registerCommands,
    outlineView,
    setOutlineView: patch => setOutlineView(current => ({ ...current, ...patch })),
    concernRanges, concernSources,
    editorHistoryChanges,
    editorEdited: (kind, change) => {
      if (kind) return;
      const history = replacementHistory.current;
      history.entries.splice(history.cursor);
      if (change && change.before !== change.after) {
        const { unitId, before, after, group } = change;
        const last = history.entries[history.cursor - 1];
        const coalesce = last?.kind === 'writing' && last.group === group && last.after[unitId] === before;
        const original = coalesce ? last.before[unitId]! : before;
        let changes = ChangeSet.of(change.edits, before.length);
        if (coalesce) changes = ChangeSet.of(last.forward[unitId]!, original.length).compose(changes);
        const edits = (set: ChangeSet) => {
          const result: WritingEdit[] = [];
          set.iterChanges((from, to, _a, _b, text) => result.push({ from, to, insert: text.toString() }));
          return result;
        };
        const bodies = { ...latest.current.model.buffers };
        const batch: ReplacementBatch = { projectKey, kind: 'writing', group, label: 'Writing',
          before: { [unitId]: original }, after: { [unitId]: after },
          forward: { [unitId]: edits(changes) }, inverse: { [unitId]: edits(changes.invert(Text.of(original.split('\n')))) },
          linksBefore: coalesce ? last.linksBefore : change.linksBefore,
          linksAfter: latest.current.model.writingPage?.captureLinks(),
          guardBefore: coalesce ? last.guardBefore : { ...bodies, [unitId]: before }, guardAfter: { ...bodies, [unitId]: after },
          search: searchRef.current, afterSearch: searchRef.current };
        if (coalesce) history.entries[history.cursor - 1] = batch;
        else history.entries.push(batch);
        if (history.entries.length > 200) history.entries.shift();
      }
      history.cursor = history.entries.length;
      redrawHistory(value => value + 1);
    },
    undo: () => { if (!routeHistory.current('undo')) commandsRef.current?.undo(); },
    redo: () => { if (!routeHistory.current('redo')) commandsRef.current?.redo(); },
    search,
    setSearch: (patch) => setSearch((current) => ({ ...current, ...patch })),
    searchMatches,
    openFind: () => {
      const ranges = readSelection()?.ranges ?? selection;
      setSearch((current) => ({
        ...current,
        open: !current.open,
        ranges,
        frozenBodies: { ...model.buffers },
      }));
      window.requestAnimationFrame(() =>
        document.querySelector<HTMLInputElement>('[data-writing-find-input]')?.focus(),
      );
    },
    findNext: async () => {
      const match = nextSearchMatch(true);
      if (match) await navigate(match);
    },
    replaceWriting,
    undoReplacement: () => undoReplacement('replacement'),
    canUndoReplacement: replacementHistory.current.cursor > 0 && replacementHistory.current.entries[replacementHistory.current.cursor - 1]?.kind === 'replacement',
    controlsCurrent,
    pinRanges: requestPin,
    splitAt: (id, point) => { if (controlsCurrent()) { void model.writingPage?.splitGroup(id, point); setContextMenu(null); } },
    movingGroupId: moveSource?.groupId ?? null, startMove, moveTo,
    joinName, setJoinName: name => setJoinName(current => current ? { ...current, name } : null),
    cancelJoinName: () => setJoinName(null),
    applyJoinName: () => {
      if (!joinName || !joinName.name.trim() || joinName.name.trim().length > 240) return;
      if (!matchesBodies(joinName.bodies) || model.writingPage?.captureLinks().key !== joinName.linksKey) {
        setArrangementNotice('Writing or its links changed. Choose the join again.'); return;
      }
      requestPin(joinName.ranges, undefined, joinName.name); setJoinName(null);
    },
    cancelMove: () => { if (!moveSourceRef.current) return; setMoveSource(null); moveSourceRef.current = null; setArrangementNotice('Move canceled. Writing was unchanged.'); },
    undoMove: () => undoReplacement('move'),
    canUndoMove: replacementHistory.current.cursor > 0 && replacementHistory.current.entries[replacementHistory.current.cursor - 1]?.kind === 'move',
    arrangementNotice,
    dismissArrangementNotice: () => setArrangementNotice(''),
    split: id => {
      const range = selection[0];
      const point = range ? { unitId: range.unitId, offset: range.from } : model.activeUnit
        ? { unitId: model.activeUnit.id, offset: model.aiSelection?.selectionStart ?? 0 } : null;
      if (point) void model.writingPage?.splitGroup(id, point);
    },
    joinSelected: () => {
      const selected = model.writingPage?.groups.filter(group => outlineView.selected.includes(group.id)) ?? [];
      if (selected.length < 2) return;
      const units = model.snapshot.project!.units.map(unit => unit.id);
      const spans = selected.flatMap(group => group.spans).sort((a, b) => units.indexOf(a.unitId) - units.indexOf(b.unitId) || a.selectionStart - b.selectionStart);
      const first = spans[0]!, last = spans[spans.length - 1]!;
      requestPin(selectedRanges(model, { unitId: first.unitId, offset: first.selectionStart }, { unitId: last.unitId, offset: last.selectionEnd }));
    },
    searchMoving: Boolean(replaceReturn || returnRequest),
    searchNotice: sourceChanged
      ? 'Selected writing changed. Reopen Find to choose its current range.'
      : searchNotice,
    pin: () => {
      const current = readSelection();
      if (current?.ranges.length) {
        const pins = touchedPins(model, current.ranges);
        const units = model.snapshot.project?.units.map(unit => unit.id) ?? [];
        const edges = [
          ...current.ranges,
          ...pins.flatMap(group => group.spans.map(span => ({
            unitId: span.unitId, from: span.selectionStart, to: span.selectionEnd,
          }))),
        ].filter(range => units.includes(range.unitId));
        const first = edges.reduce((a, b) => units.indexOf(a.unitId) < units.indexOf(b.unitId)
          || (a.unitId === b.unitId && a.from < b.from) ? a : b);
        const last = edges.reduce((a, b) => units.indexOf(a.unitId) > units.indexOf(b.unitId)
          || (a.unitId === b.unitId && a.to > b.to) ? a : b);
        requestPin(pins.length > 1
          ? selectedRanges(model, { unitId: first.unitId, offset: first.from }, { unitId: last.unitId, offset: last.to })
          : current.ranges);
      }
      else {
        armedBodies.current = { ...model.buffers };
        setPinMessage('');
        armedRef.current = 'beginning';
        setArmed('beginning');
      }
    },
    cancelPin: () => {
      armedRef.current = null;
      setArmed(null);
    },
    highlights,
    toggle: (key) =>
      setHighlights((current) => {
        const next = { ...current, [key]: !current[key] };
        try {
          localStorage.setItem('black-skies:writing-highlights:v1', JSON.stringify(next));
        } catch {
          /* Writing is independent of preference storage. */
        }
        return next;
      }),
    note,
    openNote,
    setNoteBody: (body) => setNote((current) => (current ? { ...current, body } : current)),
    closeNote: () => setNote(null),
    saveNote: async () => {
      if (!note) return;
      const id = await model.writingPage?.keepNote(note.id, note.body, note.ranges);
      if (id)
        setNote((current) => (current?.session === note.session ? { ...current, id } : current));
    },
    navigate,
    selectSources,
    returnRequest,
    acknowledgeReturn: (id) =>
      setReturnRequest((current) => (current?.requestId === id ? null : current)),
    follow,
  };
  return <Context.Provider value={context}>{children}</Context.Provider>;
}

function WritingGapTools() {
  const context = useWritingContext();
  const [label, setLabel] = useState('');
  const [planning, setPlanning] = useState('');
  const [text, setText] = useState('');
  const [selected, setSelected] = useState('');
  const page = context?.model.writingPage;
  if (!context || !page) return null;
  const gaps = page.notes.filter(note => note.kind === 'gap');
  const gap = gaps.find(note => note.id === selected) ?? gaps[0];
  const anchor = context.model.activeUnit ? { unitId: context.model.activeUnit.id,
    from: context.model.aiSelection?.selectionStart ?? 0, to: context.model.aiSelection?.selectionStart ?? 0 } : null;
  return <details className="stage19-writing-gap-tools"><summary>Gaps · {gaps.length}</summary>
    <section aria-label="Story gaps">
    <p>A gap marks missing writing. Filling it preserves its planning information as an attached Note.</p>
    <label>Gap name<input aria-label="Gap name" maxLength={240} value={label} onChange={event => setLabel(event.target.value)} /></label>
    <label>Gap planning information<textarea aria-label="Gap planning information" maxLength={4000} value={planning} onChange={event => setPlanning(event.target.value)} /></label>
    <button type="button" disabled={!label.trim() || page.busy || !anchor || Boolean(page.pendingGap)} onClick={() => void context.createGap(label, planning)}>Keep gap at writing cursor</button>
    {gap ? <>
      <label>Missing passage<select aria-label="Missing passage" value={gap.id} onChange={event => { setSelected(event.target.value); context.cancelGap(); }}>
        {gaps.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select></label>
      <p>{gap.body}</p>
      <button type="button" disabled={!anchor || page.busy || Boolean(page.pendingGap)} onClick={() => anchor && void page.reconnectNote(gap.id, [anchor])}>Place gap at writing cursor</button>
      <label>Write missing passage<textarea aria-label="Write missing passage" value={text} onChange={event => { setText(event.target.value); if (context.gapPreview) context.cancelGap(); }} /></label>
      <button type="button" disabled={!text.trim() || page.busy || Boolean(page.pendingGap)} onClick={() => void context.previewGap(gap.id, text)}>Preview gap fill</button>
    </> : null}
    {context.gapPreview ? <section aria-label="Gap fill preview" className="stage19-writing-move-preview">
      <h3>Fill missing writing</h3><h4>Before</h4><pre>{context.gapPreview.before}</pre><h4>After</h4><pre>{context.gapPreview.after}</pre>
      <button type="button" disabled={page.busy || Boolean(page.pendingGap)} onClick={context.applyGap}>Fill this gap</button>
      <button type="button" disabled={page.busy} onClick={context.cancelGap}>Cancel gap fill</button>
    </section> : null}
    {context.canUndoGap ? <button type="button" disabled={page.busy} onClick={context.undoGap}>Undo gap fill</button> : null}
    </section>
  </details>;
}

function WritingSpelling() {
  const context = useWritingContext();
  const [message, setMessage] = useState('');
  const [words, setWords] = useState<readonly string[]>([]);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState<{ unitId: string; body: string; from: number; to: number; suggestions: readonly string[] } | null>(null);
  if (!context?.model.snapshot.project) return null;
  const { model, commands } = context;
  const project = model.snapshot.project!;
  const dictionary = async (action: 'inspect' | 'accept' | 'remove', selected = word) => {
    if (!window.projectSpine?.spellingDictionary || busy) return;
    setBusy(true);
    try {
      const result = await window.projectSpine.spellingDictionary({ projectId: project.projectId, projectPath: project.path, generation: model.snapshot.generation,
        operationId: crypto.randomUUID(), action, word: selected });
      if (result.ok) { setWords(result.data.words); setMessage(action === 'inspect' ? 'Native dictionary entries loaded. This does not establish that spelling checks are working.' : 'Native dictionary updated.'); }
      else setMessage(result.error.message);
    } catch { setMessage('The native dictionary is unavailable. Writing remains available.'); }
    finally { setBusy(false); }
  };
  return <details><summary>Spelling and accepted words</summary><section aria-label="Spelling and accepted words">
    <p>US English. Spelling checks use a dictionary included with Black Skies and work offline.</p>
    <button type="button" onMouseDown={event => event.preventDefault()} disabled={busy} onClick={async () => {
      const range = context.selection.length === 1 ? context.selection[0] : null;
      const body = range ? model.buffers[range.unitId] : undefined;
      const selected = range && body ? body.slice(range.from, range.to) : '';
      setChecked(null);
      if (!range || !body || !/^[\p{L}\p{M}'’-]{1,80}$/u.test(selected)) { setMessage('Select one word in the active manuscript editor.'); return; }
      setBusy(true);
      let result;
      try { result = await window.projectSpine?.checkSpelling?.(selected); }
      catch { setMessage('Spelling is unavailable. Your writing is unchanged.'); return; }
      finally { setBusy(false); }
      if (!result?.available) { setMessage('Spelling is unavailable. The included US-English dictionary could not be loaded. Your writing is unchanged.'); return; }
      setMessage(result.misspelled ? 'This word may be misspelled. Choose a correction deliberately, or keep your spelling.' : 'This word is in the dictionary.');
      setWord(selected);
      setChecked({ ...range, body, suggestions: result.suggestions });
    }}>Check selected word</button>
    {checked?.suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => {
      const current = context.model;
      if (current.activeUnit?.id !== checked.unitId || !commands?.replaceExactRange?.(checked.body, checked.from, checked.to, suggestion)) { setMessage('Writing changed. Select the current word and check again.'); setChecked(null); return; }
      setMessage('Correction applied. Ordinary Undo and Save are available.'); setChecked(null);
    }}>Use {suggestion}</button>)}
    <p>Accepted words belong to the native Electron session dictionary, across its projects. Electron can also update the Windows system dictionary; these are not project-only words.</p>
    <fieldset disabled={busy}><label>Accepted word<input aria-label="Accepted word" value={word} maxLength={80} onChange={event => setWord(event.target.value)} /></label>
      <button type="button" onClick={() => void dictionary('accept')}>Accept word in native dictionary</button>
      <button type="button" onClick={() => void dictionary('inspect')}>Show accepted words</button>
      <ul>{words.map(value => <li key={value}>{value}<button type="button" aria-label={`Remove accepted word ${value}`} onClick={() => void dictionary('remove', value)}>Remove</button></li>)}</ul>
    </fieldset>
    {message ? <p role="status">{message}</p> : null}
  </section></details>;
}

export function WritingPreferences() {
  const context = useWritingContext();
  const saved = context?.model.snapshot.project?.writingPreferences;
  const [values, setValues] = useState<WritingPreferencesValues>(saved?.values ?? DEFAULT_WRITING_PREFERENCES);
  const [baseRevision, setBaseRevision] = useState(saved?.revision ?? 0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [resetInvalid, setResetInvalid] = useState(false);
  // Opening/navigation can render repeatedly with unchanged prose. Reuse the
  // existing session metric for exact saved bodies; only edited sections need
  // a new scan. This cache is display-only and retains one entry per section.
  const counts = useRef(new Map<string, { text: string; raw: string | undefined; count: number }>());
  const count = useMemo(() => {
    const next = new Map<string, { text: string; raw: string | undefined; count: number }>();
    let total = 0;
    for (const [id, text] of Object.entries(context?.model.buffers ?? {})) {
      const raw = context?.model.snapshot.project?.drafts?.[id];
      const cached = counts.current.get(id);
      let entry = cached;
      if (!entry || entry.text !== text || entry.raw !== raw) {
        const savedCount = context?.model.snapshot.project?.unitMetrics?.[id]?.wordCount;
        const value = typeof raw === 'string' && Number.isInteger(savedCount) && savedCount! >= 0 && extractProjectSpineDraftBody(raw) === text
          ? savedCount! : text.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’–-]*/gu)?.length ?? 0;
        entry = { text, raw, count: value };
      }
      next.set(id, entry); total += entry.count;
    }
    counts.current = next;
    return total;
  }, [context?.model.buffers, context?.model.snapshot.project?.drafts, context?.model.snapshot.project?.unitMetrics]);
  if (!context?.model.snapshot.project) return null;
  const { model } = context;
  const project = model.snapshot.project!;
  const goal = saved?.values.wordGoal;
  const number = (key: 'fontSize' | 'lineHeight' | 'paragraphSpacing' | 'firstLineIndent' | 'wordGoal', label: string, min: number, max: number, step: number, nullable = false) => (
    <label>{label}<input aria-label={label} type="number" min={min} max={max} step={step} value={values[key] ?? ''}
      placeholder={nullable ? 'Default / off' : undefined} onChange={event => setValues({ ...values, [key]: nullable && event.target.value === '' ? null : Number(event.target.value) })} /></label>
  );
  return <div className="stage19-writing-preferences">
    <span role="status" aria-label="Story word count">{count.toLocaleString()} words{goal ? ` / ${goal.toLocaleString()} goal${count >= goal ? ' · reached' : ''}` : ''}</span>
    <details open={open} onToggle={event => {
      const next = event.currentTarget.open;
      if (next && !open) { setValues(saved?.values ?? DEFAULT_WRITING_PREFERENCES); setBaseRevision(saved?.revision ?? 0); setMessage(''); setResetInvalid(false); }
      setOpen(next);
    }}><summary>Writing preferences</summary>
      <form aria-label="Writing preferences" onSubmit={event => {
        event.preventDefault();
        const bridge = window.projectSpine;
        if (!bridge?.setWritingPreferences || busy) return;
        setBusy(true);
        void bridge.setWritingPreferences({ projectId: project.projectId, projectPath: project.path, generation: model.snapshot.generation,
          operationId: crypto.randomUUID(), expectedRevision: baseRevision, values, resetInvalid }).then(result => {
          setMessage(result.ok ? 'Writing preferences saved. Manuscript source is unchanged.' : result.error.message);
          if (result.ok) setBaseRevision(result.snapshot.project?.writingPreferences?.revision ?? baseRevision);
        }).catch(() => setMessage('Preferences were not saved. Your writing remains available.')).finally(() => setBusy(false));
      }}>
        <fieldset disabled={busy || model.recoveryBlocksEditing || Boolean(model.writingPage?.pendingGap)}>
          <label>Typeface<select aria-label="Typeface" value={values.font} onChange={event => setValues({ ...values, font: event.target.value as WritingPreferencesValues['font'] })}>
            <option value="default">Current default</option><option value="serif">Serif</option><option value="sans">Sans serif</option><option value="mono">Monospace</option>
          </select></label>
          {number('fontSize', 'Text size (px)', 12, 36, 1, true)}
          {number('lineHeight', 'Line height', 1, 3, 0.05, true)}
          {number('paragraphSpacing', 'Extra paragraph spacing (px)', 0, 40, 1)}
          {number('firstLineIndent', 'First-line indentation (em)', 0, 4, 0.25)}
          {number('wordGoal', 'Optional story word goal', 1, 10000000, 1, true)}
          <label><input type="checkbox" checked={values.spellcheck} onChange={event => setValues({ ...values, spellcheck: event.target.checked })} />US English spelling</label>
          {saved?.invalid ? <label><input type="checkbox" checked={resetInvalid} onChange={event => setResetInvalid(event.target.checked)} />Replace unreadable saved preferences with these choices</label> : null}
          <button type="submit" disabled={saved?.invalid && !resetInvalid}>Save preferences</button>
          <button type="button" onClick={() => { setValues(saved?.values ?? DEFAULT_WRITING_PREFERENCES); setOpen(false); }}>Cancel preferences</button>
        </fieldset>
        <p>These choices apply to the whole manuscript display. Markdown export carries source formatting, not these layout preferences. A blank goal turns it off; goals never prevent writing.</p>
        {saved?.invalid ? <p role="alert">Saved preferences could not be read. Default presentation is in use; manuscript writing remains available.</p> : null}
        {message ? <p role="status">{message}</p> : null}
      </form>
    </details>
  </div>;
}

export function WritingPageToolbar() {
  const context = useWritingContext();
  const page = context?.model.writingPage;
  if (!context || !page) return null;
  return (
    <>
    <div className="stage19-writing-page-tools" hidden={context.model.focusMode}>
      <div className="stage19-writing-page-options">
        <WritingPreferences />
        <WritingSpelling />
        <WritingGapTools />
      </div>
      {context.canUndoRevision ? <button type="button" disabled={page.busy} onClick={context.undoRevision}>Undo applied revision</button> : null}

      {page.pendingGap ? <section aria-label="Pending gap save"><p>The gap save is incomplete. Its original planning Note and recovery writing are retained. Finish saves its links without inserting again.</p>
        <button type="button" disabled={page.busy || context.model.recoveryBlocksEditing} onClick={() => void page.resumeGap()}>Finish gap save</button></section> : null}
      <div role="group" aria-label="Writing organization">
        <button
          type="button"
          disabled={
            page.busy ||
            context.model.snapshot.saveState.status === 'saving' ||
            context.model.recoveryBlocksEditing ||
            (!context.model.dirtyUnitIds.size && !page.unsaved)
          }
          onClick={() => {
            if (context.model.activeUnit) void context.actions.saveUnit(context.model.activeUnit.id);
            else void page.save();
          }}
        >
          Save writing
        </button>
        <button
          type="button"
          disabled={!context.commands || context.selection.length > 1 || context.model.recoveryBlocksEditing}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => context.commands?.format('bold')}
        >
          Bold
        </button>
        <button
          type="button"
          disabled={!context.commands || context.selection.length > 1 || context.model.recoveryBlocksEditing}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => context.commands?.format('italic')}
        >
          Italic
        </button>
        <button
          type="button"
          disabled={!context.commands || context.model.recoveryBlocksEditing || page.busy || context.searchMoving}
          onClick={context.undo}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={!context.commands || context.model.recoveryBlocksEditing || page.busy || context.searchMoving}
          onClick={context.redo}
        >
          Redo
        </button>
        <button
          type="button"
          aria-expanded={context.search.open}
          onMouseDown={(event) => event.preventDefault()}
          onClick={context.openFind}
        >
          Find &amp; replace
        </button>
        <button
          type="button"
          disabled={page.busy || !page.ready}
          onMouseDown={(event) => event.preventDefault()}
          onClick={context.pin}
        >
          {touchedPins(context.model, context.selection).length > 1 ? 'Merge pins' : 'Pin'}
        </button>
        {context.pinMessage ? <span role="status">{context.pinMessage}</span> : null}
        {context.armed ? (
          <>
            <span role="status">
              {context.armed === 'beginning'
                ? 'Click the beginning of the unit.'
                : 'First pin placed. Click its end.'}
            </span>
            <button type="button" onClick={context.cancelPin}>
              Cancel Pin
            </button>
          </>
        ) : null}
        <details className="stage19-writing-legacy-history"><summary>Advanced unit history</summary><button
          type="button"
          disabled={page.busy || !page.canUndoPin}
          onClick={() => void page.undoPin()}
        >
          Undo Pin
        </button></details>
        {context.canUndoMove ? <button type="button" disabled={page.busy || context.model.recoveryBlocksEditing}
          onClick={context.undoMove}>Undo passage move</button> : null}
        <button
          type="button"
          disabled={(!context.selection.length && !context.model.activeUnit) || page.busy}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() =>
            context.openNote(
              null,
              context.selection.length
                ? context.selection
                : context.model.activeUnit
                  ? [
                      {
                        unitId: context.model.activeUnit.id,
                        from: context.model.aiSelection?.selectionStart ?? 0,
                        to: context.model.aiSelection?.selectionStart ?? 0,
                      },
                    ]
                  : [],
            )
          }
        >
          Notes
        </button>
        {page.unsaved ? (
          <button type="button" disabled={page.busy} onClick={() => void page.save()}>
            Save linked units and Notes
          </button>
        ) : null}
      </div>
      <WritingArrangementControls />
      {context.search.open ? (
        <section role="search" aria-label="Find and replace writing" data-writing-search="true">
          <label>
            Find
            <input
              data-writing-find-input="true"
              value={context.search.query}
              onChange={(event) => context.setSearch({ query: event.target.value })}
            />
          </label>
          <label>
            Replace with
            <input
              value={context.search.replacement}
              onChange={(event) => context.setSearch({ replacement: event.target.value })}
            />
          </label>
          <label>
            Search scope
            <select
              aria-label="Search scope"
              value={context.search.scope}
              onChange={(event) =>
                context.setSearch({ scope: event.target.value as WritingSearchState['scope'] })
              }
            >
              <option value="manuscript">Whole manuscript</option>
              <option value="current">Current writing section</option>
              <option value="selection" disabled={!context.search.ranges.length}>
                Selected words
              </option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={context.search.matchCase}
              onChange={(event) => context.setSearch({ matchCase: event.target.checked })}
            />
            Match case
          </label>
          <span role="status">{context.searchMatches.length} matches</span>
          <button
            type="button"
            disabled={!context.searchMatches.length || context.searchMoving}
            onClick={() => void context.findNext()}
          >
            Find next
          </button>
          <button
            type="button"
            disabled={
              !context.searchMatches.length ||
              context.searchMoving ||
              context.model.recoveryBlocksEditing ||
              page.busy
            }
            onClick={() => context.replaceWriting(false)}
          >
            Replace next
          </button>
          <button
            type="button"
            disabled={
              !context.searchMatches.length ||
              context.searchMoving ||
              context.model.recoveryBlocksEditing ||
              page.busy
            }
            onClick={() => context.replaceWriting(true)}
          >
            Replace all {context.searchMatches.length} matches
          </button>
          <button
            type="button"
            disabled={!context.canUndoReplacement || context.searchMoving || page.busy}
            onClick={context.undoReplacement}
          >
            Undo replacement
          </button>
          <details>
            <summary>
              Preview replacements · first {Math.min(10, context.searchMatches.length)} of{' '}
              {context.searchMatches.length}
            </summary>
            <ul>
              {context.searchMatches.slice(0, 10).map((match) => {
                const body = context.model.buffers[match.unitId] ?? '';
                return (
                  <li key={`${match.unitId}-${match.from}`}>
                    {body.slice(Math.max(0, match.from - 28), match.from)}
                    <del>{body.slice(match.from, match.to)}</del>
                    <ins>{context.search.replacement}</ins>
                    {body.slice(match.to, match.to + 28)}
                  </li>
                );
              })}
            </ul>
          </details>
          {context.searchNotice ? <p role="status">{context.searchNotice}</p> : null}
          <button type="button" onClick={() => context.setSearch({ open: false })}>
            Close search
          </button>
        </section>
      ) : null}
      <div role="group" aria-label="Writing highlights">
        {(['pinned', 'unpinned', 'concerns'] as HighlightKey[]).map((key) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={context.highlights[key]}
              onChange={() => context.toggle(key)}
            />
            {key === 'pinned' ? 'Pinned' : key === 'unpinned' ? 'Unpinned' : 'Open concern'}
          </label>
        ))}
      </div>
      {page.notice ? <p role="status">{page.notice}</p> : null}
      {context.note ? (
        <section aria-label="Passage Note" className="stage19-writing-page-note">
          <h3>{context.note.id ? 'Edit Note' : 'Add Note'}</h3>
          {context.note.message ? <p role="status">{context.note.message}</p> : null}
          {!context.note.id ? (
            <button type="button" onClick={context.useCurrentNoteSelection}>
              Use current selection
            </button>
          ) : null}
          {context.note.id ? (
            <div aria-label="Note source passages">
              {page.unresolvedNotes.includes(context.note.id) ? (
                <p>Its source changed. Select the current passage to reconnect it.</p>
              ) : (
                noteSourceAnchors(
                  page.notes.find((item) => item.id === context.note!.id) ?? {},
                ).map((anchor, index) => (
                  <button
                    key={`${anchor.unitId}-${index}`}
                    type="button"
                    onClick={() =>
                      void context.navigate({
                        unitId: anchor.unitId,
                        from: anchor.selectionStart,
                        to: anchor.selectionEnd,
                      })
                    }
                  >
                    Read passage {index + 1}
                  </button>
                ))
              )}
              <button
                type="button"
                disabled={!context.selection.length || page.busy}
                onClick={() => void page.reconnectNote(context.note!.id!, context.selection)}
              >
                Reconnect Note to selected writing
              </button>
            </div>
          ) : null}
          {!context.note.id && context.note.sourceReady ? <section aria-label="Selected Note sources" className="stage19-note-selected-sources">
            <p>{context.note.ranges.length} selected passage{context.note.ranges.length === 1 ? '' : 's'}</p>
            {context.note.sourceQuotes?.map((quote, index) => <blockquote key={index}>{quote || 'Writing cursor position'}</blockquote>)}
          </section> : null}
          {context.note.id ? <p role="status" aria-label="Note save status">{page.busy ? 'Saving Note…'
            : context.note.body === page.notes.find(item => item.id === context.note!.id)?.body ? 'Saved Note' : 'Unsaved Note changes'}</p> : null}
          <label>
            Note text
            <textarea
              aria-label="Note text"
              maxLength={4000}
              value={context.note.body}
              onChange={(event) => context.setNoteBody(event.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={
              !context.note.body.trim() ||
              (!context.note.id && !context.note.sourceReady) ||
              page.busy
            }
            onClick={() => void context.saveNote()}
          >
            Keep Note
          </button>
          <button type="button" onClick={context.closeNote}>
            Close Note
          </button>
        </section>
      ) : null}
    </div>
    {context.model.focusMode ? <WritingArrangementControls /> : null}
    <WritingUnitControls />
    </>
  );
}

function WritingArrangementControls() {
  const context = useWritingContext();
  const page = context?.model.writingPage;
  if (!context || !page) return null;
  if (!context.arrangementNotice && !context.movingGroupId && !context.joinName) return null;
  return <div className="stage19-writing-arrangement-controls">
      {context.arrangementNotice ? <div className="stage19-writing-arrangement-notice">
        <p role="status">{context.arrangementNotice}</p>
        <button type="button" aria-label="Dismiss writing message" title="Dismiss message" onClick={context.dismissArrangementNotice}><span aria-hidden="true">×</span></button>
      </div> : null}
      {context.movingGroupId ? <div role="group" aria-label="Move writing">
        <p>Choose an insertion marker. The whole unit and its supported attachments move together.</p>
        <button type="button" onClick={context.cancelMove}>Cancel move</button>
      </div> : null}
      {context.joinName ? <form aria-label="Combined unit name" onSubmit={event => { event.preventDefault(); context.applyJoinName(); }}>
        <p>The combined name exceeds 240 characters. Edit it before joining; the original units are unchanged.</p>
        <label>Combined unit name<input value={context.joinName.name} onChange={event => context.setJoinName(event.target.value)} /></label>
        <span>{context.joinName.name.trim().length} / 240 characters</span>
        <button type="submit" disabled={page.busy || !context.joinName.name.trim() || context.joinName.name.trim().length > 240}>Join with this name</button>
        <button type="button" onClick={context.cancelJoinName}>Cancel join</button>
      </form> : null}
  </div>;
}

function WritingUnitControls() {
  const context = useWritingContext();
  const menu = context?.contextMenu;
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  useEffect(() => { setNaming(false); }, [menu]);
  if (!context || !menu || !context.model.writingPage) return null;
  const { model } = context, page = model.writingPage!;
  const selected = menu.ranges.filter(range => range.to > range.from);
  const touched = selected.length ? touchedPins(model, selected) : page.groups.filter(group =>
    !page.unresolved.includes(group.id) && group.spans.some(span => span.unitId === menu.point.unitId &&
      menu.point.offset >= span.selectionStart && menu.point.offset < span.selectionEnd));
  const group = touched.length === 1 ? touched[0] : undefined;
  const units = model.snapshot.project?.units.map(unit => unit.id) ?? [];
  const edges = [...selected, ...touched.flatMap(item => item.spans.map(span => ({ unitId: span.unitId, from: span.selectionStart, to: span.selectionEnd })))];
  const sorted = [...edges].sort((a, b) => units.indexOf(a.unitId) - units.indexOf(b.unitId) || a.from - b.from);
  const last = [...edges].sort((a, b) => units.indexOf(b.unitId) - units.indexOf(a.unitId) || b.to - a.to)[0];
  const expanded = sorted.length && last ? selectedRanges(model, { unitId: sorted[0]!.unitId, offset: sorted[0]!.from }, { unitId: last.unitId, offset: last.to }) : [];
  const extendsUnit = Boolean(group && selected.some(range => !group.spans.some(span => span.unitId === range.unitId && span.selectionStart <= range.from && span.selectionEnd >= range.to)));
  const word = group ? splitWord(model.buffers[menu.point.unitId] ?? '', menu.point.offset) : undefined;
  const at = word?.index ?? -1;
  const spanIndex = group?.spans.findIndex(span => span.unitId === menu.point.unitId && at >= span.selectionStart && at < span.selectionEnd) ?? -1;
  const left = group?.spans.map((span, index) => index < spanIndex ? (model.buffers[span.unitId] ?? '').slice(span.selectionStart, span.selectionEnd)
    : index === spanIndex ? (model.buffers[span.unitId] ?? '').slice(span.selectionStart, at) : '').join(' ') ?? '';
  const right = group?.spans.map((span, index) => index > spanIndex ? (model.buffers[span.unitId] ?? '').slice(span.selectionStart, span.selectionEnd)
    : index === spanIndex ? (model.buffers[span.unitId] ?? '').slice(at, span.selectionEnd) : '').join(' ') ?? '';
  const disabled = page.busy || !page.ready || model.recoveryBlocksEditing || Boolean(page.pendingGap);
  return <div role="dialog" aria-label="Writing passage actions" data-writing-context-menu="true"
    className="stage19-writing-context-menu" style={{ left: menu.x, top: menu.y }}>
    {selected.length ? <>
      {extendsUnit ? <p>Extend keeps the complete original unit and its name. Result: {wordCount(expanded.map(range => model.buffers[range.unitId]!.slice(range.from, range.to)).join(' '))} words.</p> : null}
      <button type="button" disabled={disabled} onClick={() => {
        if (context.controlsCurrent()) context.pinRanges(touched.length ? expanded : selected, extendsUnit ? group!.id : undefined);
      }}>{extendsUnit ? 'Extend unit' : touched.length > 1 ? 'Join units' : 'Pin selection'}</button>
    </> : null}
    {group ? <>
      <button type="button" disabled={disabled || spanIndex < 0 || !wordCount(left) || !wordCount(right)}
        onClick={() => context.splitAt(group.id, { unitId: menu.point.unitId, offset: at })}>
        {word ? `Split before “${word[0]}”` : 'Split unit'}</button>
      {spanIndex >= 0 && wordCount(left) && wordCount(right) ? <p>Split: {wordCount(left)} + {wordCount(right)} words. Writing stays unchanged.</p> : null}
      <button type="button" disabled={disabled} onClick={() => { setNaming(true); setName(writingGroupLabel(group, model.buffers)); }}>Name unit</button>
      {naming ? <form onSubmit={event => { event.preventDefault(); if (context.controlsCurrent()) void page.renameGroup(group.id, name).then(saved => { if (saved) context.closeContextMenu(); }); }}>
        <label>Unit name<input autoFocus maxLength={240} value={name} onChange={event => setName(event.target.value)} /></label>
        <button type="submit" disabled={disabled || !name.trim()}>Save unit name</button>
      </form> : null}
      <button type="button" disabled={disabled} onClick={() => { if (context.controlsCurrent()) context.startMove(group.id); }}>Move</button>
    </> : null}
    <button type="button" aria-label="Add Note here" disabled={disabled} onClick={context.contextNote}>Notes</button>
    <button type="button" onClick={context.closeContextMenu}>Close menu</button>
  </div>;
}

function WritingManualConcerns() {
  const context = useWritingContext();
  const projectKey = `${context?.model.snapshot.project?.projectId ?? ''}:${context?.model.snapshot.project?.path ?? ''}`;
  const drafts = context?.model.writingPage?.manualConcernDrafts;
  const [draft, setDraft] = useState<import('../useWritingPage').ManualConcernDraft | null>(() => drafts?.current.get(projectKey) ?? null);
  useEffect(() => { if (!draft || draft.projectKey === projectKey) drafts?.current.set(projectKey, draft); }, [draft, drafts, projectKey]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  if (!context || !context.actions.createManualConcern) return null;
  const { model, actions } = context, page = model.writingPage;
  const active = draft?.projectKey === projectKey ? draft : { projectKey, body: '', sources: [] };
  const capture = (index: number) => {
    const range = context.selection[0];
    if (!range || range.to <= range.from || context.selection.length !== 1) { setMessage('Select one exact passage for each evidence slot.'); return; }
    const sources = [...active.sources];
    if (index === 1 && !sources[0]) { setMessage('Attach the primary evidence first.'); return; }
    sources[index] = { ...range, body: model.buffers[range.unitId]! };
    setDraft({ ...active, sources }); setMessage('Evidence attached to this draft. Keep saves the concern.');
  };
  const keep = async () => {
    if (saving || !active.body.trim() || !active.sources.length) return;
    setSaving(true);
    try {
      if (!(await page?.save())) return;
      if (await actions.createManualConcern?.(active.body, active.sources)) { setDraft(null); setMessage('Concern kept in Outline, Review and Revision Desk.'); }
      else setMessage('Concern not saved. Its draft is retained; review the source notice.');
    } finally { setSaving(false); }
  };
  return <details><summary>Manual concerns · {model.program7RevisionItems.activeItems.length}</summary>
    <section aria-label="Manual concern capture">
      <p>Describe your concern, then attach primary and optional related evidence. Keeping it does not change your prose or make an AI judgment. Unfinished drafts stay with this project in this window; reloading closes unsaved drafts. Draft evidence is rechecked before keeping.</p>
      <label>Manual concern<textarea aria-label="Manual concern" maxLength={4000} value={active.body} onChange={event => setDraft({ ...active, body: event.target.value })} /></label>
      <button type="button" disabled={saving || !page?.ready} onClick={() => capture(0)}>Attach selected primary evidence</button>
      <button type="button" disabled={saving || !page?.ready} onClick={() => capture(1)}>Attach selected related evidence</button>
      {active.sources.map((source, index) => <div key={index}><h4>{index === 0 ? 'Primary evidence draft' : 'Related evidence draft'}{model.buffers[source.unitId] !== source.body ? ' · writing changed; attach current evidence' : ''}</h4><blockquote>{source.body.slice(source.from, source.to)}</blockquote></div>)}
      <button type="button" disabled={saving || !page?.ready || !active.body.trim() || !active.sources.length} onClick={() => void keep()}>Keep manual concern</button>
      <button type="button" disabled={saving} onClick={() => setDraft(null)}>Discard concern draft</button>
      {message ? <p role="status">{message}</p> : null}
    </section>
    <RevisionDesk pending={model.program7RevisionPending} activeItems={model.program7RevisionItems.activeItems} historyItems={model.program7RevisionItems.historyItems ?? []}
      localAiAvailable={false} canResolve={model.windowRole === 'writing'}
      renderEvidence={item => <RevisionEvidence item={item} bodies={model.buffers} dirtyUnitIds={model.dirtyUnitIds} onRead={source => void actions.returnToStorySource(source)} />}
      onConsiderRevision={actions.considerProgram7Concern ? item => void actions.considerProgram7Concern?.(item) : undefined}
      onLifecycle={(item, lifecycle) => void actions.setProgram7RevisionItemLifecycle(item, lifecycle)}
      onRecheck={(item, method) => void actions.recheckProgram7RevisionItem(item, method)}
      onReturnToSource={item => void actions.returnProgram7RevisionItemToSource(item)} />
  </details>;
}

function WritingNotebook() {
  const context = useWritingContext();
  const projectKey = `${context?.model.snapshot.project?.projectId ?? ''}:${context?.model.snapshot.project?.path ?? ''}`;
  type Draft = import('../useWritingPage').NotebookDraft;
  const drafts = context?.model.writingPage?.notebookDrafts;
  const [draft, setDraft] = useState<Draft | null>(() => drafts?.current.get(projectKey) ?? null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const previousProject = useRef(projectKey);
  const latestDraft = useRef(draft); latestDraft.current = draft;
  useEffect(() => {
    if (previousProject.current === projectKey) return;
    drafts?.current.set(previousProject.current, latestDraft.current);
    previousProject.current = projectKey;
    setDraft(drafts?.current.get(projectKey) ?? null); setQuery(''); setMessage('');
  }, [projectKey, drafts]);
  useEffect(() => {
    if (!draft || draft.projectKey === projectKey) drafts?.current.set(projectKey, draft);
  }, [draft, projectKey, drafts]);
  const page = context?.model.writingPage;
  if (!context || !page) return null;
  const notes = page.notes.filter(note => note.kind === 'fragment');
  const active = draft?.projectKey === projectKey ? draft : null;
  const dirty = Boolean(active && (active.label !== active.originalLabel || active.body !== active.originalBody));
  const modalDirty = (id: string) => context.note?.id === id && context.note.body !== notes.find(note => note.id === id)?.body;
  const blocked = !page.ready || page.busy || Boolean(page.pendingGap);
  const sourceStatus = (note: typeof notes[number]) => {
    if (note.noteScope === 'whole-story') return 'Whole-story Note';
    if (note.noteScope === 'unattached') return 'Deliberately unattached Note';
    const sources = noteSourceAnchors(note);
    if (note.noteScope === 'passage' || sources.length || note.manuscriptUnitId) {
      if (page.unresolvedNotes.includes(note.id) || !sources.length) return 'Original passage uncertain or unavailable';
      if (sources.every(anchor => anchor.anchorKind === 'position')) return note.sourceWasSpan ? 'Original source writing removed' : 'Attached at a writing position; legacy source may need review';
      return 'Passage-linked Note';
    }
    return 'Unattached legacy Note; original scope unspecified';
  };
  const select = (id: string | null) => {
    if (dirty) { setMessage('Keep or discard the current Note draft before opening another Note.'); return; }
    const note = notes.find(note => note.id === id);
    setDraft({ projectKey, id: note?.id ?? null, label: note?.label ?? '', body: note?.body ?? '',
      originalLabel: note?.label ?? '', originalBody: note?.body ?? '', scope: note?.noteScope === 'unattached' ? 'unattached' : 'whole-story' });
    setMessage('');
  };
  const keep = async () => {
    if (!active || blocked) return;
    const label = active.label.trim() || active.body.trim().split(/\s+/u).slice(0, 7).join(' ').slice(0, 240);
    const saved = active.id ? await page.updateNotebookNote(active.id, label, active.body)
      : await page.createPlanningItem(label, active.body, 'fragment', active.scope);
    if (saved) { setDraft(null); setMessage('Note saved in this project.'); }
  };
  const remove = async () => {
    if (!active?.id) return;
    if (dirty || modalDirty(active.id)) { setMessage('Keep or discard this Note’s unsaved edits before deleting it.'); return; }
    if (await page.deleteNotebookNote(active.id)) { if (context.note?.id === active.id) context.closeNote(); setDraft(null); setMessage('Note deleted. Undo Note deletion is available during this project session.'); }
  };
  const visible = notes.filter(note => `${note.label}\n${note.body ?? ''}`.toLocaleLowerCase('en-US').includes(query.toLocaleLowerCase('en-US')));
  const selected = active?.id ? notes.find(note => note.id === active.id) : undefined;
  return <details className="stage19-writing-notebook"><summary>Notebook · {notes.length}</summary>
    <section aria-label="All-story Notebook">
      <p>All Notes in this project. Whole-story, unattached and unavailable passage sources keep their distinct meanings.</p>
      <label>Search Notes<input aria-label="Search Notes" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <button type="button" disabled={blocked} onClick={() => select(null)}>New Notebook Note</button>
      <button type="button" disabled={blocked || !page.canUndoNoteDeletion || dirty} onClick={() => void page.undoNoteDeletion()}>Undo Note deletion</button>
      {!visible.length ? <p role="status">{query ? 'No matching Notes.' : 'No Notes yet. Add a whole-story Note or annotate selected writing.'}</p> : null}
      <ul aria-label="Notebook Notes">{visible.map(note => <li key={note.id} data-notebook-note-id={note.id}>
        <button type="button" disabled={blocked} onClick={() => select(note.id)}>{note.label}</button><p>{sourceStatus(note)}</p>
      </li>)}</ul>
      {active ? <div role="group" aria-label="Notebook Note editor">
        <label>Notebook Note name<input aria-label="Notebook Note name" maxLength={240} value={active.label} onChange={event => setDraft(current => current ? { ...current, label: event.target.value } : current)} /></label>
        <label>Notebook Note text<textarea aria-label="Notebook Note text" maxLength={4000} value={active.body} onChange={event => setDraft(current => current ? { ...current, body: event.target.value } : current)} /></label>
        {!active.id ? <label>New Note scope<select aria-label="New Note scope" value={active.scope} onChange={event => setDraft(current => current ? { ...current, scope: event.target.value as Draft['scope'] } : current)}>
          <option value="whole-story">Whole story</option><option value="unattached">Deliberately unattached</option>
        </select></label> : null}
        {selected ? <>
          <p>{sourceStatus(selected)}</p>
          {noteSourceAnchors(selected).map((anchor, index) => {
            const unavailable = page.unresolvedNotes.includes(selected.id) || context.model.buffers[anchor.unitId] === undefined || (selected.sourceWasSpan && anchor.anchorKind === 'position');
            return <div key={`${anchor.unitId}-${index}`}>
              {!unavailable && context.model.buffers[anchor.unitId] !== undefined ? <blockquote>{context.model.buffers[anchor.unitId]!.slice(anchor.selectionStart, anchor.selectionEnd)}</blockquote> : <p>Source excerpt withheld until its link is verified.</p>}
              <button type="button" disabled={blocked || Boolean(unavailable)} onClick={() => void context.navigate({ unitId: anchor.unitId, from: anchor.selectionStart, to: anchor.selectionEnd })}>Read Note source {index + 1}</button>
            </div>;
          })}
          <button type="button" disabled={blocked || !context.selection.length || dirty} onClick={() => void page.reconnectNote(selected.id, context.selection)}>Attach Note to selected writing</button>
        </> : null}
        <button type="button" disabled={blocked || !(active.label.trim() || active.body.trim())} onClick={() => void keep()}>Keep Notebook Note</button>
        {active.id ? <button type="button" disabled={blocked} onClick={() => void remove()}>Delete Notebook Note</button> : null}
        <button type="button" disabled={blocked} onClick={() => { setDraft(null); setMessage('Draft discarded. Saved Note unchanged.'); }}>Discard Notebook draft</button>
      </div> : null}
      {message ? <p role="status">{message}</p> : null}
    </section>
  </details>;
}

const OUTLINE_CONCERN_MARKERS: Record<string, { symbol: string; label: string }> = {
  continuity: { symbol: '!', label: 'Continuity concern' },
  timeline: { symbol: '◷', label: 'Timing concern' },
  emotion: { symbol: '◇', label: 'Emotion concern' },
  pressure: { symbol: '△', label: 'Story pressure concern' },
  pacing: { symbol: '≋', label: 'Pacing concern' },
};

export function WritingPageOutline({ compact = false }: { compact?: boolean } = {}) {
  const context = useWritingContext();
  const [renaming, setRenaming] = useState<{ id: string; label: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dropAttempted = useRef(false);
  const [openConcern, setOpenConcern] = useState<{ row: string; id: string } | null>(null);
  const page = context?.model.writingPage;
  if (!context || !page) return null;
  const { model, outlineView } = context;
  const valid = page.groups.filter((group) => !page.unresolved.includes(group.id));
  const seen = new Set<string>();
  const rows: { key: string; label: string; ranges: WritingRange[]; groupId: string | null; gapId?: string }[] = [];
  for (const unit of model.snapshot.project?.units ?? []) {
    const body = model.buffers[unit.id] ?? '';
    let coverage;
    try {
      coverage = writingCoverage(unit.id, body.length, valid);
    } catch {
      coverage = [{ from: 0, to: body.length, groupId: null }];
    }
    for (const part of coverage) {
      if (!part.groupId && !body.slice(part.from, part.to).trim()) continue;
      if (part.groupId && seen.has(part.groupId)) continue;
      const group = valid.find((item) => item.id === part.groupId);
      if (group) seen.add(group.id);
      rows.push({
        key: part.groupId ?? `unpinned-${unit.id}-${part.from}`,
        label:
          (group ? writingGroupLabel(group, model.buffers) : undefined) ??
          (body.slice(part.from, part.to).trim().split(/\s+/u).slice(0, 10).join(' ') ||
            'Unpinned writing'),
        ranges: group
          ? group.spans.map((span) => ({
              unitId: span.unitId,
              from: span.selectionStart,
              to: span.selectionEnd,
            }))
          : [{ unitId: unit.id, from: part.from, to: part.to }],
        groupId: part.groupId,
      });
    }
  }
  for (const group of valid.filter((item) => !seen.has(item.id)))
    rows.push({
      key: group.id,
      label: `${group.label} · writing removed`,
      groupId: group.id,
      ranges: group.spans.map((span) => ({
        unitId: span.unitId,
        from: span.selectionStart,
        to: span.selectionEnd,
      })),
    });
  const sourceOrder = model.snapshot.project?.units.map(unit => unit.id) ?? [];
  for (const gap of page.notes.filter(note => note.kind === 'gap' && note.sourceAnchor && !page.unresolvedNotes.includes(note.id))) {
    const anchor = gap.sourceAnchor!;
    rows.push({ key: `gap-${gap.id}`, label: gap.label, groupId: null, gapId: gap.id, ranges: [{ unitId: anchor.unitId, from: anchor.selectionStart, to: anchor.selectionStart }] });
  }
  rows.sort((a, b) => sourceOrder.indexOf(a.ranges[0]!.unitId) - sourceOrder.indexOf(b.ranges[0]!.unitId) || a.ranges[0]!.from - b.ranges[0]!.from || (a.gapId ? -1 : 1));
  const orderedRows = rows;
  let nextUnitNumber = 0;
  const numberedRows = orderedRows.map(row => ({ ...row, number: row.groupId ? ++nextUnitNumber : null }));
  const selected = outlineView.selected.map(id => rows.find(row => row.groupId === id));
  const available = selected.filter((row): row is typeof rows[number] => Boolean(row));
  const endUnit = model.snapshot.project?.units.at(-1);
  const endPoint = endUnit ? { unitId: endUnit.id, offset: (model.buffers[endUnit.id] ?? '').length } : null;
  const drop = (event: React.DragEvent, point: Point) => {
    event.preventDefault(); event.stopPropagation(); setDropTarget(null);
    try {
      const source = JSON.parse(event.dataTransfer.getData('application/x-black-skies-writing-unit')) as { id: string; projectId: string; generation: number };
      if (source.projectId !== model.snapshot.project?.projectId || source.generation !== model.snapshot.generation || typeof source.id !== 'string') return;
      dropAttempted.current = true;
      context.moveTo(point, source.id);
    } catch { /* Unrelated/incomplete drags cannot change writing. */ }
  };
  return (
    <section className={`stage19-writing-page-outline${compact ? ' is-compact' : ''}${context.movingGroupId ? ' is-moving' : ''}`} aria-label="Writing outline">
      {!compact ? <h3>Outline</h3> : null}
      <WritingNotebook />
      <WritingManualConcerns />
      {!compact ? <p>Pinned and unpinned writing in manuscript order. Drag a pinned row to an insertion marker.</p> : null}
      <div className="stage19-outline-actions">
        <button type="button" disabled={available.length < 2} onClick={() => context.setOutlineView({ comparing: true })}>Compare selected · {available.length}</button>
        <button type="button" disabled={available.length < 2 || page.busy} onClick={context.joinSelected}>Join selected units</button>
        <button type="button" disabled={!outlineView.selected.length} onClick={() => context.setOutlineView({ selected: [], comparing: false })}>Clear selection</button>
        {model.logicalSurface !== 'command' ? <button type="button" onClick={() => {
          context.actions.selectCommandWorkspace('structure');
          void context.actions.showCommandSurface();
        }} aria-label="Expand outline in Command Center" title="Expand outline in Command Center">Expand outline</button> : null}
      </div>
      {available.length > 1 ? <p>Join includes the writing between the selected units. Undo restores their previous boundaries.</p> : null}
      <ol data-writing-outline-list="true" aria-label="Writing units and unpinned passages"
        onDragOver={event => { if (event.target === event.currentTarget) event.preventDefault(); }}
        onDrop={event => { if (event.target === event.currentTarget) if (endPoint) drop(event, endPoint); }}>
        {numberedRows.map((row) => {
          const notes = page.notes.filter((item) =>
            noteSourceAnchors(item).some((anchor) =>
              row.ranges.some(
                (range) =>
                  range.unitId === anchor.unitId &&
                  (anchor.selectionStart === anchor.selectionEnd
                    ? range.from <= anchor.selectionStart && anchor.selectionStart <= range.to
                    : range.from < anchor.selectionEnd && range.to > anchor.selectionStart),
              ),
            ),
          );
          const concerns = model.program7RevisionItems.activeItems.filter(item => context.concernSources?.some(source => source.concernId === item.id &&
            row.ranges.some(range => range.unitId === source.unitId && source.selectionStart !== undefined && source.selectionEnd !== undefined && range.from < source.selectionEnd && range.to > source.selectionStart)));
          return (
            <li
              key={row.key}
              data-writing-outline-spans={JSON.stringify(row.ranges)}
              data-writing-group-id={row.groupId ?? undefined}
              draggable={Boolean(row.groupId && page.ready && !page.busy)}
              onDragStart={event => {
                if (!row.groupId || page.busy || !page.ready) { event.preventDefault(); return; }
                dropAttempted.current = false;
                event.dataTransfer.setData('application/x-black-skies-writing-unit', JSON.stringify({ id: row.groupId, projectId: model.snapshot.project?.projectId, generation: model.snapshot.generation }));
                event.dataTransfer.effectAllowed = 'move'; context.startMove(row.groupId);
              }}
              onDragEnd={() => { setDropTarget(null); if (!dropAttempted.current) context.cancelMove(); dropAttempted.current = false; }}
              className={`${row.groupId ? 'is-pinned' : 'is-unpinned'}${dropTarget === row.key ? ' is-move-drop' : ''}`}
              onDragOver={event => { if (event.dataTransfer.types.includes('application/x-black-skies-writing-unit') && !page.busy) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTarget(row.key); } }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={event => drop(event, { unitId: row.ranges[0]!.unitId, offset: row.ranges[0]!.from })}
            >
              {context.movingGroupId ? <button type="button" className="stage19-outline-insertion"
                aria-label={`Insert before ${row.label}`} onClick={() => context.moveTo({ unitId: row.ranges[0]!.unitId, offset: row.ranges[0]!.from })}>Move here</button> : null}
              <span className="stage19-outline-unit-heading" data-writing-unit-number={row.number ?? undefined}>
                <span>{row.number ? `Unit ${row.number}` : row.gapId ? 'Missing passage' : 'Unpinned'}</span>
                <span>{row.ranges.map(range => model.buffers[range.unitId]?.slice(range.from, range.to) ?? '').join(' ').trim().split(/\s+/u).filter(Boolean).length} words · {row.ranges.length} passage{row.ranges.length === 1 ? '' : 's'}</span>
              </span>
              {row.groupId ? <button type="button" draggable={!page.busy && page.ready}
                aria-label={`Drag ${row.label} in the manuscript`} title="Drag writing to an insertion marker, or activate to choose a destination"
                className="stage19-outline-drag" onClick={() => context.startMove(row.groupId!)}>⠿</button> : null}
              <button type="button" className="stage19-outline-source" title={row.label} onClick={() => void context.selectSources(row.ranges)}>
                {row.label}
              </button>
              {row.groupId ? <span className="stage19-outline-kind">Pinned</span> : null}
              {concerns.map((concern, index) => {
                const expanded = openConcern?.row === row.key && openConcern.id === concern.id;
                const sources = context.concernSources?.filter(source => source.concernId === concern.id) ?? [];
                const changed = sources.some(source => !['current', 'exact', 'relocated'].includes(source.status));
                const unsaved = sources.some(source => model.dirtyUnitIds.has(source.unitId));
                const lens = concern.lens ?? concern.provenance?.lens;
                const marker = lens && Object.prototype.hasOwnProperty.call(OUTLINE_CONCERN_MARKERS, lens)
                  ? OUTLINE_CONCERN_MARKERS[lens]!
                  : { symbol: '!', label: 'Open concern' };
                const authority = concern.provenance?.source === 'manual' ? 'Author note'
                  : concern.provenance?.origin === 'local-ai' ? 'Local advisory review' : 'Story Knowledge';
                return <div className="writing-outline-concern" key={concern.id}>
                  <button type="button" data-outline-concern-id={concern.id}
                    aria-expanded={expanded} aria-label={`Open concern ${index + 1} for ${row.label}: ${concern.body}`}
                    data-concern-symbol={marker.symbol}
                    data-concern-source-state={changed ? 'changed' : unsaved ? 'unsaved' : 'current'}
                    title={marker.label + ': ' + concern.body + '\nRaised by: ' + authority + (changed ? '\nSource changed — review the original and current evidence.' : unsaved ? '\nUnsaved source changes.' : '')}
                    onClick={() => setOpenConcern(expanded ? null : { row: row.key, id: concern.id })}>{marker.symbol}</button>
                  {expanded ? <div className="writing-outline-concern__sources" onKeyDown={event => {
                    if (event.key === 'Escape') { event.stopPropagation(); setOpenConcern(null); }
                  }}>
                    <div className="writing-outline-concern__header">
                      <button type="button" className="writing-outline-concern__close" aria-label="Close concern" title="Close concern" onClick={() => setOpenConcern(null)}><span aria-hidden="true">×</span></button>
                    </div>
                    <p>{concern.body}</p>
                    <p>Raised by: {authority}</p>
                    {changed ? <p role="status">Source changed. Editing does not automatically address this concern.</p> : null}
                    {model.program7RevisionPending ? <p role="status">Saving concern decision…</p> : model.program7Notice ? <p role="status">{model.program7Notice}</p> : null}
                    <button type="button" disabled={model.windowRole === 'command' || model.program7RevisionPending || page.busy || !page.ready} onClick={() => {
                      void context.actions.setProgram7RevisionItemLifecycle(concern, 'resolved');
                    }}>Mark addressed</button>
                    <button type="button" disabled={model.windowRole === 'command' || model.program7RevisionPending || page.busy || !page.ready} onClick={() => {
                      void context.actions.setProgram7RevisionItemLifecycle(concern, 'intentional');
                    }}>Mark intentional</button>
                    <button type="button" onClick={() => {
                      setOpenConcern(null);
                      context.actions.selectCommandWorkspace('review');
                      void Promise.resolve(context.actions.showCommandSurface()).then(() => requestAnimationFrame(() => {
                        const card = [...document.querySelectorAll<HTMLElement>('[data-concern-id]')]
                          .find(node => node.dataset.concernId === concern.id && node.getClientRects().length > 0);
                        card?.focus();
                        card?.scrollIntoView({ block: 'nearest' });
                      }));
                    }}>Open in Review</button>
                    <RevisionEvidence item={concern} bodies={model.buffers} dirtyUnitIds={model.dirtyUnitIds}
                      onRead={source => { setOpenConcern(null); if (source.unitId && source.selectionStart !== undefined && source.selectionEnd !== undefined) void context.navigate({ unitId: source.unitId, from: source.selectionStart, to: source.selectionEnd }); }} />
                  </div> : null}
                </div>;
              })}
              {(() => {
                const actions = <>              {row.groupId ? <>
                <label><input type="checkbox" aria-label={`Compare ${row.label}`} checked={outlineView.selected.includes(row.groupId)}
                  onChange={event => context.setOutlineView({ selected: event.target.checked
                    ? [...outlineView.selected, row.groupId!] : outlineView.selected.filter(id => id !== row.groupId) })} /> Compare</label>
              </> : null}
              {row.groupId ? (
                renaming?.id === row.groupId ? (
                  <form
                    className="stage19-writing-unit-name"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const draft = renaming;
                      void page.renameGroup(draft.id, draft.label).then((saved) => {
                        if (saved)
                          setRenaming((current) => (current?.id === draft.id ? null : current));
                      });
                    }}
                  >
                    <label>
                      Unit name
                      <input
                        aria-label="Unit name"
                        maxLength={240}
                        value={renaming.label}
                        onChange={(event) =>
                          setRenaming({ id: row.groupId!, label: event.target.value })
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            event.stopPropagation();
                            setRenaming(null);
                          }
                        }}
                      />
                    </label>
                    <button type="submit" disabled={!renaming.label.trim() || page.busy}>
                      Save unit name
                    </button>
                    <button type="button" onClick={() => setRenaming(null)}>
                      Cancel name edit
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    aria-label={`Rename ${row.label}`}
                    disabled={page.busy}
                    onClick={() =>
                      setRenaming({
                        id: row.groupId!,
                        label: page.groups.find((group) => group.id === row.groupId)!.label,
                      })
                    }
                  >
                    Rename
                  </button>
                )
              ) : null}

              {row.groupId ? (
                <button type="button" onClick={() => void page.unpin(row.groupId!)}>
                  Unpin
                </button>
              ) : null}
              {row.groupId ? <details className="stage19-writing-unit-organization">
                <summary>Organize this writing</summary>
                <button type="button" disabled={page.busy} onClick={() => context.split(row.groupId!)}>Split at writing cursor</button>
                <p>Split changes the pins only. Place the cursor inside this unit first.</p>
                <button type="button" disabled={page.busy} onClick={() => context.startMove(row.groupId!)}>Move</button>
              </details> : null}
              <button type="button" onClick={() => context.openNote(null, row.ranges)}>
                Add Note
              </button>
                </>;
                return compact ? <details className="stage19-outline-row-actions">
                  <summary aria-label={`Actions for ${row.label}`}>⋯</summary>
                  <div>{actions}</div>
                </details> : actions;
              })()}
              {notes.length ? <details className="stage19-outline-notes">
                <summary>{notes.length} Notes<span aria-hidden="true"> ✎</span></summary>
                {notes.map(item => <button type="button" key={item.id} onClick={() => context.openNote(item.id)}><span aria-hidden="true">✎ </span>{item.label}</button>)}
              </details> : null}
            </li>
          );
        })}
        {context.movingGroupId && endPoint ? <li className="stage19-outline-end-insertion"
          onDragOver={event => { event.preventDefault(); }} onDrop={event => drop(event, endPoint)}>
          <button type="button" className="stage19-outline-insertion" onClick={() => context.moveTo(endPoint)}>Insert at manuscript end</button>
        </li> : null}
      </ol>
      {outlineView.comparing ? <section className="stage19-outline-comparison" aria-label="Selected passage comparison">
        <h3>Compare selected passages</h3>
        <p>Read the writing and its Notes together. Choose Read passage to return to its source.</p>
        <button type="button" onClick={() => context.setOutlineView({ comparing: false })}>Close comparison</button>
        {selected.some(row => !row) ? <p role="status">Some selected units changed or need their sources checked. Choose their current outline entries.</p> : null}
        <div className="stage19-outline-comparison__passages">
          {available.map(row => <article key={row.key} aria-label={`Compared unit: ${row.label}`}>
            <h4>{row.label}</h4>
            {row.ranges.map((range, index) => <div key={`${range.unitId}-${index}`}>
              <p>{model.snapshot.project?.units.find(unit => unit.id === range.unitId)?.displayTitle ?? 'Writing section'}</p>
              <div className="stage19-outline-comparison__prose">
                <WritingSourcePreview unitId={range.unitId} text={model.buffers[range.unitId] ?? ''} from={range.from} to={range.to} interactive={false} />
              </div>
              <button type="button" disabled={context.searchMoving} onClick={() => void context.navigate(range).then(() =>
                model.logicalSurface === 'command' ? context.actions.showWritingSurface() : undefined)}>Read passage {index + 1}</button>
            </div>)}
            <ul aria-label={`Notes for ${row.label}`}>
              {page.notes.filter(note => !page.unresolvedNotes.includes(note.id) && noteSourceAnchors(note).some(anchor => row.ranges.some(range => range.unitId === anchor.unitId && range.from < anchor.selectionEnd && range.to > anchor.selectionStart)))
                .map(note => <li key={note.id}><button type="button" onClick={() => { context.openNote(note.id); if (model.logicalSurface === 'command') void context.actions.showWritingSurface(); }}>{note.body ?? note.label}</button></li>)}
            </ul>
          </article>)}
        </div>
      </section> : null}
      {page.unresolved.length ? (
        <div role="status">
          <p>Some unit sources changed and need reconnection. Their records are retained.</p>
          {page.groups
            .filter((group) => page.unresolved.includes(group.id))
            .map((group) => (
              <p key={group.id}>
                {group.label}
                <button type="button" onClick={() => void page.unpin(group.id)}>
                  Unpin unresolved unit
                </button>
              </p>
            ))}
        </div>
      ) : null}
      {page.notes.length ? (
        <details>
          <summary>All Notes · {page.notes.length}</summary>
          {page.notes.map((note) => (
            <button type="button" key={note.id} onClick={() => context.openNote(note.id)}>
              {note.label}
            </button>
          ))}
        </details>
      ) : null}
    </section>
  );
}

export function WritingSourcePreview({ unitId, text, from: start = 0, to: end = text.length, interactive = true }: {
  unitId: string; text: string; from?: number; to?: number; interactive?: boolean;
}) {
  const context = useWritingContext();
  const marks = interactive ? getWritingMarks(context, unitId) : [];
  const emphasis = useMemo(() => getDraftEmphasis(text), [text]);
  const paragraphs = [0, ...[...text.matchAll(/\n\s*\n(?=\S)/gu)].map(match => match.index! + match[0].length)];
  const preference = context?.model.snapshot.project?.writingPreferences?.values;
  const layout = Boolean(interactive && (preference?.paragraphSpacing || preference?.firstLineIndent));
  const points = [...new Set([start, end, ...marks.flatMap((mark) => [mark.from, mark.to]), ...(layout ? paragraphs : []),
    ...emphasis.flatMap(span => [span.from, span.contentFrom, span.contentTo, span.to]),
    ...marks.filter(mark => mark.kind === 'move').map(mark => mark.from)])]
    .filter((point) => point >= start && point <= end && point >= 0 && point <= text.length)
    .sort((a, b) => a - b);
  const widgets = (point: number) =>
    marks
      .filter((mark) => (mark.kind === 'pin' || mark.kind === 'note' || mark.kind === 'move') && mark.from === point)
      .map((mark, index) =>
        mark.kind === 'move' ? (
          <button type="button" key={`${point}-move`} data-writing-decoration="move" className="stage19-writing-move-marker"
            aria-label={mark.label} onMouseDown={event => event.preventDefault()} onClick={event => {
              event.stopPropagation(); context?.moveTo({ unitId, offset: point });
            }} />
        ) : mark.kind === 'note' ? (
          <button
            type="button"
            key={`${point}-note-${mark.id}`}
            data-writing-decoration="note"
            className="stage19-writing-note-marker"
            style={{ marginInlineStart: `${index * 20}px` }}
            aria-label={`Open Note: ${mark.label}`}
            onClick={() => {
              if (mark.id) context?.openNote(mark.id, []);
            }}
          >
          </button>
        ) : (
          <span
            key={`${point}-pin-${index}`}
            data-writing-decoration="pin"
            className="stage19-writing-pin-marker"
            style={{ marginInlineStart: `${index * 20}px` }}
            aria-label={mark.label}
          >
          </span>
        ),
      );
  return (
    <span data-writing-source={interactive ? "true" : undefined}>
      {widgets(start)}
      {points.slice(0, -1).map((from, index) => {
        const to = points[index + 1]!;
        const classes = marks
          .filter((mark) => mark.to > mark.from && mark.from <= from && mark.to >= to)
          .map((mark) => `stage19-writing-${mark.kind}`)
          .join(' ');
        const hidden = emphasis.some(span => (from >= span.from && to <= span.contentFrom) || (from >= span.contentTo && to <= span.to));
        const styles = emphasis.filter(span => span.contentFrom <= from && span.contentTo >= to);
        return (
          <span key={from}>
            {layout && paragraphs.includes(from) ? <>
              {from > 0 ? <span data-writing-decoration="paragraph" aria-hidden="true" style={{ display: 'block', height: 'var(--writing-paragraph-spacing)' }} /> : null}
              <span data-writing-decoration="paragraph" aria-hidden="true" style={{ display: 'inline-block', width: 'var(--writing-indent)' }} />
            </> : null}
            {/* Retain hidden source text in the DOM for exact native-selection
                offsets across sections; it is never visible manuscript prose. */}
            <span data-writing-span="true" data-writing-from={from} className={classes}
              hidden={hidden} aria-hidden={hidden || undefined}
              style={{ fontWeight: styles.some(span => span.style === 'bold') ? 700 : undefined,
                fontStyle: styles.some(span => span.style === 'italic') ? 'italic' : undefined }}>
              {text.slice(from, to)}
            </span>
            {widgets(to)}
          </span>
        );
      })}
    </span>
  );
}

export function getWritingMarks(
  context: WritingContext | null,
  unitId: string,
): DraftEditorWritingMark[] {
  const page = context?.model.writingPage;
  if (!context || !page || !page.ready) return [];
  const body = context.model.buffers[unitId] ?? '';
  const groups = page.groups.filter((group) => !page.unresolved.includes(group.id));
  const marks: DraftEditorWritingMark[] = [];
  if (context.movingGroupId) for (const offset of writingMoveBoundaries(unitId, body, groups))
    marks.push({ kind: 'move', from: offset, to: offset, id: `${context.movingGroupId}:${offset}`, label: `Insert writing here, position ${offset}` });
  try {
    for (const span of writingCoverage(unitId, body.length, groups)) {
      if (span.groupId ? context.highlights.pinned : context.highlights.unpinned)
        marks.push({ from: span.from, to: span.to, kind: span.groupId ? 'pinned' : 'unpinned' });
    }
  } catch {
    /* Unresolved source is listed in the outline without guessing a mark. */
  }
  for (const group of groups) {
    const first = group.spans[0];
    const last = group.spans[group.spans.length - 1];
    if (first?.unitId === unitId)
      marks.push({
        from: first.selectionStart,
        to: first.selectionStart,
        kind: 'pin',
        label: `Beginning of ${group.label}`,
      });
    if (last?.unitId === unitId)
      marks.push({
        from: last.selectionEnd,
        to: last.selectionEnd,
        kind: 'pin',
        label: `End of ${group.label}`,
      });
  }
  if (context.armed && context.armed !== 'beginning' && context.armed.unitId === unitId)
    marks.push({
      from: context.armed.offset,
      to: context.armed.offset,
      kind: 'pin',
      label: 'First pin; choose the end',
    });
  for (const note of page.notes) {
    if (!page.unresolvedNotes.includes(note.id))
      for (const anchor of noteSourceAnchors(note).filter((span) => span.unitId === unitId && !(note.sourceWasSpan && span.anchorKind === 'position')))
        marks.push({
          from: anchor.selectionEnd,
          to: anchor.selectionEnd,
          kind: 'note',
          id: note.id,
          label: note.label,
        });
  }
  if (context.highlights.concerns && context.concernRanges !== undefined) {
    for (const source of context.concernRanges.filter(range => range.unitId === unitId)) marks.push({ from: source.from, to: source.to, kind: 'concern' });
    return marks;
  }
  if (context.highlights.concerns)
    for (const concern of context.model.program7RevisionItems.activeItems) {
      for (const evidence of revisionItemSources(concern)) {
        const anchor = evidence.anchor;
        if (evidence.unitId === unitId && anchor && !evidence.protection.metadataOnly &&
          ['included', 'local-only'].includes(evidence.protection.sourceClass) &&
          evidence.bodySha256 === context.model.snapshot.project?.unitMetrics?.[unitId]?.bodySha256 && Boolean(evidence.bodySha256) &&
          !context.model.dirtyUnitIds.has(unitId) && anchor.selectionStart >= 0 && anchor.selectionEnd <= body.length)
          marks.push({ from: anchor.selectionStart, to: anchor.selectionEnd, kind: 'concern' });
      }
    }
  return marks;
}
