import { findLiteralWritingMatches, type WritingEdit } from '../shared/writingRanges';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Extension } from '@codemirror/state';
import { Compartment, EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView,
  Decoration,
  WidgetType,
  type DecorationSet,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxTree } from '@codemirror/language';

export interface DraftEditorWritingMark {
  readonly from: number;
  readonly to: number;
  readonly kind: 'pinned' | 'unpinned' | 'concern' | 'pin' | 'note';
  readonly id?: string;
  readonly label?: string;
}

class WritingMarker extends WidgetType {
  constructor(readonly kind: 'pin' | 'note', readonly label: string, readonly activate: () => void, readonly slot = 0, readonly markerId = '') { super(); }
  eq(other: WritingMarker): boolean { return this.kind === other.kind && this.label === other.label && this.slot === other.slot && this.markerId === other.markerId; }
  toDOM(view: EditorView): HTMLElement {
    const element = view.dom.ownerDocument.createElement(this.kind === 'note' ? 'button' : 'span');
    element.className = `stage19-writing-${this.kind}-marker`;
    element.dataset.writingDecoration = this.kind;
    element.style.marginInlineStart = `${this.slot * 20}px`;
    element.title = this.label;
    element.setAttribute('contenteditable', 'false');
    element.setAttribute('aria-label', this.kind === 'note' ? `Open Note: ${this.label}` : this.label);
    // Decorative glyphs use CSS so native selected text contains source words only.
    element.textContent = '';
    if (element instanceof HTMLButtonElement) { element.type = 'button'; element.onmousedown = (event) => event.preventDefault(); element.onclick = (event) => { event.preventDefault(); event.stopPropagation(); this.activate(); }; }
    return element;
  }
  ignoreEvent(): boolean { return true; }
}
const replaceWritingMarks = StateEffect.define<DecorationSet>();
const writingMarkField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (value, transaction) => {
    let next = value.map(transaction.changes);
    for (const effect of transaction.effects) if (effect.is(replaceWritingMarks)) next = effect.value;
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

// Presentation over the existing Markdown source, never a second prose store.
// Use the Markdown parser so literal stars, escapes and code remain untouched.
export function getDraftEmphasis(source: string, tree = markdownLanguage.parser.parse(source)) {
  const spans: { from: number; to: number; contentFrom: number; contentTo: number; style: 'bold' | 'italic' }[] = [];
  tree.iterate({ enter: ({ node, name, from, to }) => {
    if (name !== 'StrongEmphasis' && name !== 'Emphasis') return;
    const opening = node.firstChild;
    const closing = node.lastChild;
    if (opening?.name !== 'EmphasisMark' || closing?.name !== 'EmphasisMark' || opening === closing) return;
    spans.push({ from, to, contentFrom: opening.to, contentTo: closing.from, style: name === 'StrongEmphasis' ? 'bold' : 'italic' });
  } });
  return spans;
}

function buildEmphasisPresentation(state: EditorState) {
  const spans = getDraftEmphasis(state.doc.toString(), syntaxTree(state));
  const markers = spans.flatMap(span => [
    Decoration.replace({}).range(span.from, span.contentFrom),
    Decoration.replace({}).range(span.contentTo, span.to),
  ]);
  const decorations = spans.map(span => Decoration.mark({
    tagName: span.style === 'bold' ? 'strong' : 'em',
    class: `draft-editor__${span.style}`,
  }).range(span.contentFrom, span.contentTo));
  return { decorations: Decoration.set([...decorations, ...markers], true), atomic: Decoration.set(markers, true) };
}

const emphasisPresentation = StateField.define<ReturnType<typeof buildEmphasisPresentation>>({
  create: buildEmphasisPresentation,
  update: (current, transaction) => transaction.docChanged || syntaxTree(transaction.startState) !== syntaxTree(transaction.state)
    ? buildEmphasisPresentation(transaction.state) : current,
  provide: field => [
    EditorView.decorations.from(field, value => value.decorations),
    EditorView.atomicRanges.of(view => view.state.field(field).atomic),
  ],
});

function paragraphDecorations(state: EditorState): DecorationSet {
  const marks = [];
  for (let number = 1; number <= state.doc.lines; number += 1) {
    const line = state.doc.line(number);
    if (line.text.trim() && (number === 1 || !state.doc.line(number - 1).text.trim())) {
      marks.push(Decoration.line({ class: number === 1 ? 'writing-paragraph-first' : 'writing-paragraph-start' }).range(line.from));
    }
  }
  return Decoration.set(marks);
}
const paragraphPresentation = StateField.define<DecorationSet>({
  create: paragraphDecorations,
  update: (value, transaction) => transaction.docChanged ? paragraphDecorations(transaction.state) : value,
  provide: field => EditorView.decorations.from(field),
});

export interface DraftEditorDiffConfig {
  /**
   * Placeholder configuration for upcoming diff/merge support.
   * Actual merge view wiring will be implemented in a future task.
   */
  mode: 'merge' | 'readonly';
  base?: string;
  current?: string;
}

export interface DraftEditorCommands {
  beginDocumentSelection?(): () => void;
  replaceExactRange?(expected: string, from: number, to: number, text: string): boolean;
  format(style: 'bold' | 'italic'): void;
  undo(): void;
  redo(): void;
  focus(): void;
  historyMatches?(kind: 'undo' | 'redo', expected: string): boolean;
  hasHistory?(kind: 'undo' | 'redo'): boolean;
}

export interface DraftEditorHistoryChange {
  readonly requestId: string;
  readonly before: string;
  readonly after: string;
  readonly changes: readonly WritingEdit[];
  readonly kind: 'edit' | 'undo' | 'redo';
}

export interface DraftEditorChange {
  readonly before: string;
  readonly group: string;
}

export interface DraftEditorProps {
  value: string;
  writingTools?: boolean;
  spellcheck?: boolean;
  historyChange?: DraftEditorHistoryChange;
  toolbarVisible?: boolean;
  onCommands?: (commands: DraftEditorCommands | null) => void;
  writingMarks?: readonly DraftEditorWritingMark[];
  onWritingNote?: (id: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  extensions?: Extension[];
  onChange?: (nextValue: string, changes?: readonly WritingEdit[], historyAction?: 'undo' | 'redo', change?: DraftEditorChange) => void;
  onSave?: (currentValue: string) => void;
  onSelectionChange?: (selection: DraftEditorSelectionEvidence) => void;
  selectionRestore?: DraftEditorSelectionRestore | null;
  onSelectionRestoreResult?: (requestId: string, restored: boolean) => void;
  diffConfig?: DraftEditorDiffConfig | null;
  ariaLabel?: string | null;
  ariaLabelledBy?: string | null;
  ariaDescribedBy?: string | null;
}

export interface DraftEditorSelectionRestore {
  readonly requestId: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectionFingerprint: string;
}

export interface DraftEditorSelectionEvidence {
  readonly selectionStart: number;
  readonly selectionEnd: number;
  readonly selectedText: string;
  readonly editorRevision: number;
  readonly sourceFingerprint: string;
  readonly selectionFingerprint: string;
}

async function fingerprintText(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildDraftEditorSelectionEvidence(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  editorRevision: number,
): Promise<DraftEditorSelectionEvidence> {
  const selectedText = source.slice(selectionStart, selectionEnd);
  const [sourceFingerprint, selectionFingerprint] = await Promise.all([
    fingerprintText(source),
    fingerprintText(selectedText),
  ]);
  return {
    selectionStart,
    selectionEnd,
    selectedText,
    editorRevision,
    sourceFingerprint,
    selectionFingerprint,
  };
}

const editorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: 'inherit',
      fontFamily: 'var(--writing-font, "Ibarra Real Nova", "Times New Roman", serif)',
      height: '100%',
    },
    '.cm-scroller': {
      overflow: 'auto',
      padding: '1.5rem 1.75rem',
      fontSize: 'var(--writing-size, 1.05rem)',
      lineHeight: 'var(--writing-line-height, 1.75)',
    },
    '.cm-content': {
      caretColor: 'var(--bs-editor-caret, #cbd5f5)',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--bs-editor-gutter, rgba(148, 163, 184, 0.78))',
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--bs-editor-active-line, rgba(148, 163, 184, 0.08))',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--bs-editor-active-gutter, rgba(148, 163, 184, 0.14))',
    },
    '.draft-editor__bold': { fontWeight: '700' },
    '.draft-editor__italic': { fontStyle: 'italic' },
    '.cm-placeholder': {
      color: 'var(--bs-editor-placeholder, rgba(148, 163, 184, 0.7))',
      fontStyle: 'italic',
    },
  },
  { dark: true },
);

const hostClassName = 'draft-editor__mount';
const MAX_UNDO_ENTRIES = 200;
const TYPING_GROUP_WINDOW_MS = 1_000;

function supportsSelectionScrollMeasurement(): boolean {
  if (typeof document === 'undefined') return false;
  return typeof document.createRange().getClientRects === 'function';
}

interface DraftHistoryState {
  readonly undo: string[];
  readonly redo: string[];
  lastEditKind: 'typing' | 'other' | null;
  lastEditAt: number;
}

function formatDraftLineNumber(lineNumber: number, state: EditorState): string {
  if (lineNumber > state.doc.lines) return String(lineNumber);
  const line = state.doc.line(lineNumber);
  // A final empty line is the trailing newline delimiter, not a prose line.
  // Keep the source byte-for-byte intact while avoiding an orphan gutter mark
  // at the Unit boundary.
  return lineNumber === state.doc.lines && line.from === line.to && state.doc.length > 0
    ? ''
    : String(lineNumber);
}

export default function DraftEditor({
  value,
  writingTools = false,
  spellcheck = true,
  historyChange,
  toolbarVisible = true,
  onCommands,
  writingMarks,
  onWritingNote,
  placeholder,
  readOnly = false,
  className,
  extensions,
  onChange,
  onSave,
  onSelectionChange,
  selectionRestore,
  onSelectionRestoreResult,
  diffConfig,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}: DraftEditorProps): JSX.Element {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [searchSelection, setSearchSelection] = useState<{ from: number; to: number } | null>(null);
  const [selectionOnly, setSelectionOnly] = useState(false);
  const [toolNotice, setToolNotice] = useState('');
  const [, redrawTools] = useState(0);
  const historyCommands = useRef<{ undo: (view: EditorView) => boolean; redo: (view: EditorView) => boolean; format: (view: EditorView, mark: string) => boolean } | null>(null);
  const writingNoteRef = useRef(onWritingNote);
  writingNoteRef.current = onWritingNote;
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const documentSelection = useRef(new Compartment());
  const docRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onSelectionChangeRef = useRef(onSelectionChange);
  // Inline parent callbacks must not restart a pending, bounded source return.
  const onSelectionRestoreResultRef = useRef(onSelectionRestoreResult);
  onSelectionRestoreResultRef.current = onSelectionRestoreResult;
  const skipNextChangeRef = useRef(false);
  const appliedHistoryChange = useRef<string | null>(null);
  const historyOperationRef = useRef<'undo' | 'redo' | null>(null);
  const historyRef = useRef<DraftHistoryState>({
    undo: [],
    redo: [],
    lastEditKind: null,
    lastEditAt: 0,
  });
  const historyGroupRef = useRef(crypto.randomUUID());
  const editorRevisionRef = useRef(0);
  const selectionSequenceRef = useRef(0);
  const restoreRequestId = selectionRestore?.requestId;
  const restoreStart = selectionRestore?.selectionStart;
  const restoreEnd = selectionRestore?.selectionEnd;
  const restoreFingerprint = selectionRestore?.selectionFingerprint;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  const diffExtensions = useMemo<Extension[]>(() => {
    if (!diffConfig) {
      return [];
    }
    // Deferred as UNSCHEDULED_NON_V1 in docs/deferred/smart_merge_tool.md.
    return [];
  }, [diffConfig]);

  const accessibilityAttributes = useMemo(() => {
    const trimmedLabel = ariaLabel?.trim();
    const trimmedLabelledBy = ariaLabelledBy?.trim() ?? null;
    const trimmedDescribedBy = ariaDescribedBy?.trim() ?? null;
    // Provide a fallback label when neither aria-label nor aria-labelledby is supplied.
    const effectiveLabel =
      trimmedLabel && trimmedLabel.length > 0
        ? trimmedLabel
        : trimmedLabelledBy
          ? null
          : 'Draft editor';

    return {
      label: effectiveLabel,
      labelledBy: trimmedLabelledBy,
      describedBy: trimmedDescribedBy,
    };
  }, [ariaLabel, ariaLabelledBy, ariaDescribedBy]);

  const applyAccessibilityAttributes = useCallback(
    (view: EditorView) => {
      const { contentDOM, scrollDOM } = view;
      const { label, labelledBy, describedBy } = accessibilityAttributes;

      if (label) {
        contentDOM.setAttribute('aria-label', label);
      } else {
        contentDOM.removeAttribute('aria-label');
      }

      if (labelledBy) {
        contentDOM.setAttribute('aria-labelledby', labelledBy);
      } else {
        contentDOM.removeAttribute('aria-labelledby');
      }

      if (describedBy) {
        contentDOM.setAttribute('aria-describedby', describedBy);
      } else {
        contentDOM.removeAttribute('aria-describedby');
      }

      scrollDOM.setAttribute('role', 'region');

      if (label) {
        scrollDOM.setAttribute('aria-label', label);
      } else {
        scrollDOM.removeAttribute('aria-label');
      }

      if (labelledBy) {
        scrollDOM.setAttribute('aria-labelledby', labelledBy);
      } else {
        scrollDOM.removeAttribute('aria-labelledby');
      }

      if (describedBy) {
        scrollDOM.setAttribute('aria-describedby', describedBy);
      } else {
        scrollDOM.removeAttribute('aria-describedby');
      }

      scrollDOM.setAttribute('tabindex', '0');
    },
    [accessibilityAttributes],
  );

  const changeListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const historyAction = historyOperationRef.current;
          setSearchSelection((current) => current && !historyAction
            ? { from: update.changes.mapPos(current.from, -1), to: update.changes.mapPos(current.to, 1) }
            : null);
          editorRevisionRef.current += 1;
          if (skipNextChangeRef.current) {
            skipNextChangeRef.current = false;
          } else {
            const historyOperation = historyOperationRef.current;
            historyOperationRef.current = null;
            if (!historyOperation) {
              const history = historyRef.current;
              const now = Date.now();
              const isTyping = update.transactions.some((transaction) =>
                transaction.isUserEvent('input.type'),
              );
              const groupsWithPreviousTyping =
                isTyping &&
                history.lastEditKind === 'typing' &&
                now - history.lastEditAt <= TYPING_GROUP_WINDOW_MS;
              if (!groupsWithPreviousTyping) {
                historyGroupRef.current = crypto.randomUUID();
                history.undo.push(update.startState.doc.toString());
                if (history.undo.length > MAX_UNDO_ENTRIES) {
                  history.undo.shift();
                }
              }
              history.redo.length = 0;
              history.lastEditKind = isTyping ? 'typing' : 'other';
              history.lastEditAt = now;
            }
            const edits: WritingEdit[] = [];
            update.changes.iterChanges((from, to, _fromB, _toB, inserted) => edits.push({ from, to, insert: inserted.toString() }));
            onChangeRef.current?.(update.state.doc.toString(), edits, historyAction ?? undefined, { before: update.startState.doc.toString(), group: historyGroupRef.current });
          }
        }
        if (update.docChanged || update.selectionSet) redrawTools((value) => value + 1);
        if (!update.docChanged && !update.selectionSet) return;
        const sequence = ++selectionSequenceRef.current;
        const range = update.state.selection.main;
        const source = update.state.doc.toString();
        void buildDraftEditorSelectionEvidence(
          source,
          range.from,
          range.to,
          editorRevisionRef.current,
        ).then((evidence) => {
          if (sequence === selectionSequenceRef.current) {
            onSelectionChangeRef.current?.(evidence);
          }
        });
      }),
    [],
  );

  const resolvedPlaceholder = placeholder ?? 'Start drafting this scene…';

  const baseExtensions = useMemo(() => {
    const replaceDocument = (
      view: EditorView,
      nextValue: string,
      operation: 'undo' | 'redo',
    ): boolean => {
      historyOperationRef.current = operation;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: nextValue,
        },
        selection: {
          anchor: Math.min(nextValue.length, view.state.selection.main.head),
        },
      });
      historyRef.current.lastEditKind = null;
      return true;
    };
    const undo = (view: EditorView): boolean => {
      if (readOnly) return false;
      const previous = historyRef.current.undo.pop();
      if (previous === undefined) return false;
      historyRef.current.redo.push(view.state.doc.toString());
      return replaceDocument(view, previous, 'undo');
    };
    const redo = (view: EditorView): boolean => {
      if (readOnly) return false;
      const next = historyRef.current.redo.pop();
      if (next === undefined) return false;
      historyRef.current.undo.push(view.state.doc.toString());
      return replaceDocument(view, next, 'redo');
    };
    const emphasis = (view: EditorView, mark: string): boolean => {
      if (readOnly) return false;
      const { from, to } = view.state.selection.main;
      if (from === to) { setToolNotice('Select words to format.'); return true; }
      const source = view.state.doc.toString();
      const selected = source.slice(from, to);
      if (!selected.trim()) { setToolNotice('Select words to format.'); return true; }
      const parsedEmphasis = getDraftEmphasis(source, syntaxTree(view.state));
      const parts: { from: number; to: number; content: string; marked: boolean }[] = [];
      // Keep spaces and paragraph breaks outside emphasis. A drag selection often
      // includes the following newline, which cannot close a Markdown delimiter.
      let offset = from;
      for (const line of selected.split('\n')) {
        let content = line.trim();
        if (content) {
          let begin = offset + line.length - line.trimStart().length;
          let end = begin + content.length;
          // Native drag/keyboard selection may include one hidden delimiter.
          // Resolve those boundaries against parsed emphasis, not visible text
          // lengths, so source anchors keep their original UTF-16 coordinates.
          for (const span of parsedEmphasis) {
            if (begin >= span.from && begin < span.contentFrom && end >= span.contentFrom) begin = span.contentFrom;
            if (end > span.contentTo && end <= span.to && begin <= span.contentTo) end = span.contentTo;
          }
          content = source.slice(begin, end);
          const includesMarks = content.startsWith(mark) && content.endsWith(mark) && content.length > mark.length * 2 && (mark === '**' || !content.startsWith('**') || content.startsWith('***'));
          const leftRun = source.slice(0, begin).match(/\*+$/)?.[0].length ?? 0;
          const rightRun = source.slice(end).match(/^\*+/)?.[0].length ?? 0;
          const surroundsMarks = mark === '**' ? leftRun >= 2 && rightRun >= 2 : leftRun % 2 === 1 && rightRun % 2 === 1;
          parts.push({
            from: surroundsMarks ? begin - mark.length : begin,
            to: surroundsMarks ? end + mark.length : end,
            content: includesMarks ? content.slice(mark.length, -mark.length) : content,
            marked: includesMarks || surroundsMarks,
          });
        }
        offset += line.length + 1;
      }
      const removing = parts.every(part => part.marked);
      const edits = parts.map(part => ({
        from: part.from, to: part.to,
        insert: removing ? part.content : part.marked ? source.slice(part.from, part.to) : mark + part.content + mark,
      }));
      const changes = view.state.changes(edits);
      const first = parts[0]!;
      const last = parts[parts.length - 1]!;
      view.dispatch({ changes, selection: {
        anchor: changes.mapPos(first.from, -1) + (removing ? 0 : mark.length),
        head: changes.mapPos(last.to, 1) - (removing ? 0 : mark.length),
      }, userEvent: 'input.format' });
      setToolNotice(removing ? 'Formatting removed from selected words.' : 'Formatting applied to selected words.');
      return true;
    };
    historyCommands.current = { undo, redo, format: emphasis };
    const configuration: Extension[] = [
      lineNumbers({ formatNumber: formatDraftLineNumber }),
      EditorView.lineWrapping,
      keymap.of([
        {
          key: 'Mod-s',
          run: (view) => {
            onSaveRef.current?.(view.state.doc.toString());
            return true;
          },
        },
        ...(['Home', 'End'] as const).flatMap((edge) => [false, true].map((extend) => ({
          key: `Mod-${extend ? 'Shift-' : ''}${edge}`,
          run: (view: EditorView) => {
            if (!writingTools) return false;
            const head = edge === 'Home' ? 0 : view.state.doc.length;
            view.dispatch({ selection: { anchor: extend ? view.state.selection.main.anchor : head, head }, scrollIntoView: true });
            return true;
          },
        }))),
        { key: 'Mod-b', run: (view) => writingTools ? emphasis(view, '**') : false },
        { key: 'Mod-i', run: (view) => writingTools ? emphasis(view, '*') : false },
        { key: 'Mod-z', run: undo },
        { key: 'Mod-Shift-z', run: redo },
        { key: 'Mod-y', run: redo },
      ]),
      markdown(),
      ...(writingTools ? [emphasisPresentation, paragraphPresentation] : []),
      writingMarkField,
      documentSelection.current.of([]),
      editorTheme,
      placeholderExtension(resolvedPlaceholder),
      changeListener,
      ...diffExtensions,
    ];

    if (readOnly) {
      configuration.push(EditorState.readOnly.of(true));
      configuration.push(EditorView.editable.of(false));
    }

    if (extensions?.length) {
      configuration.push(...extensions);
    }

    return configuration;
  }, [changeListener, diffExtensions, extensions, readOnly, resolvedPlaceholder, writingTools]);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const state = EditorState.create({
      doc: docRef.current,
      extensions: baseExtensions,
    });

    const view = new EditorView({ state, parent: mountRef.current });
    viewRef.current = view;
    applyAccessibilityAttributes(view);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [applyAccessibilityAttributes, baseExtensions]);

  useEffect(() => {
    const content = viewRef.current?.contentDOM;
    if (content && writingTools) {
      content.setAttribute('spellcheck', String(spellcheck));
      content.setAttribute('lang', 'en-US');
    }
  }, [spellcheck, writingTools, applyAccessibilityAttributes, baseExtensions]);

  useEffect(() => {
    docRef.current = value;
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const currentValue = view.state.doc.toString();
    if (value === currentValue) {
      return;
    }
    const history = historyRef.current;
    // Only an exact, explicitly authored replacement extends local history.
    // Unrelated controlled values still reset it, so Undo cannot resurrect a
    // different source version or project. Parent changes already updated prose
    // and anchors; this dispatch must not notify the parent a second time.
    let changes = view.state.changes({ from: 0, to: currentValue.length, insert: value });
    let matched = false;
    if (historyChange && historyChange.requestId !== appliedHistoryChange.current &&
        historyChange.before === currentValue && historyChange.after === value) {
      try {
        const candidate = view.state.changes(historyChange.changes);
        matched = candidate.apply(view.state.doc).toString() === value;
        if (matched) changes = candidate;
      } catch { /* Invalid or stale provenance follows the ordinary reset path. */ }
    }
    if (matched && historyChange) {
      if (historyChange.kind === 'undo') {
        if (history.undo[history.undo.length - 1] === value) history.undo.pop();
        else history.undo.length = 0;
        history.redo.push(currentValue);
      } else {
        if (historyChange.kind === 'redo' && history.redo[history.redo.length - 1] === value) history.redo.pop();
        else history.redo.length = 0;
        history.undo.push(currentValue);
      }
      while (history.undo.length > MAX_UNDO_ENTRIES) history.undo.shift();
      while (history.redo.length > MAX_UNDO_ENTRIES) history.redo.shift();
      appliedHistoryChange.current = historyChange.requestId;
    } else {
      history.undo.length = 0;
      history.redo.length = 0;
    }
    history.lastEditKind = null;
    historyOperationRef.current = null;
    skipNextChangeRef.current = true;
    view.dispatch({ changes });
  }, [value, historyChange]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || restoreRequestId === undefined || restoreStart === undefined ||
        restoreEnd === undefined || restoreFingerprint === undefined) return;
    const source = view.state.doc.toString();
    const requestId = restoreRequestId;
    const selectionStart = restoreStart;
    const selectionEnd = restoreEnd;
    const selectionFingerprint = restoreFingerprint;
    if (
      selectionStart < 0 ||
      selectionEnd < selectionStart ||
      selectionEnd > source.length
    ) {
      onSelectionRestoreResultRef.current?.(requestId, false);
      return;
    }
    let cancelled = false;
    let frame: number | undefined;
    void buildDraftEditorSelectionEvidence(
      source,
      selectionStart,
      selectionEnd,
      editorRevisionRef.current,
    ).then((evidence) => {
      if (cancelled) return;
      if (view.state.doc.toString() !== source || evidence.selectionFingerprint !== selectionFingerprint) {
        onSelectionRestoreResultRef.current?.(requestId, false);
        return;
      }
      const scrollEffect = supportsSelectionScrollMeasurement()
        ? EditorView.scrollIntoView(selectionStart, { y: 'center' })
        : null;
      view.dispatch({
        selection: { anchor: selectionStart, head: selectionEnd },
        ...(scrollEffect ? { effects: scrollEffect } : {}),
      });
      view.focus();
      // An incremental replacement may already have mapped this exact caret.
      // Publish the verified evidence even when no selection-change event fires,
      // and supersede older asynchronous evidence before acknowledging return.
      selectionSequenceRef.current += 1;
      onSelectionChangeRef.current?.(evidence);
      if (!scrollEffect) {
        onSelectionRestoreResultRef.current?.(requestId, true);
        return;
      }
      // In the continuous manuscript the canvas, rather than CodeMirror's
      // scroller, owns scrolling. Newly mounted wrapped prose can change height
      // after the first reveal. Keep the exact anchor through bounded layout
      // measurements before acknowledging the selection restoration.
      let remaining = 6;
      let previous: { top: number | undefined; height: number } | undefined;
      const stillCurrent = () => viewRef.current === view && view.state.doc.toString() === source &&
        view.state.selection.main.from === selectionStart &&
        view.state.selection.main.to === selectionEnd;
      const measureRestore = () => view.requestMeasure({
        read: () => !cancelled && stillCurrent()
          ? { top: view.coordsAtPos(selectionStart)?.top, height: view.contentHeight }
          : null,
        write: (geometry) => {
          if (cancelled) return;
          if (!geometry || !stillCurrent()) {
            onSelectionRestoreResultRef.current?.(requestId, false);
            return;
          }
          const stable = previous?.top !== undefined && geometry.top !== undefined &&
            Math.abs(previous.top - geometry.top) < 1 &&
            Math.abs(previous.height - geometry.height) < 1;
          if (stable || --remaining === 0) {
            onSelectionRestoreResultRef.current?.(requestId, true);
            return;
          }
          previous = geometry;
          frame = window.requestAnimationFrame(() => {
            if (cancelled) return;
            if (!stillCurrent()) {
              onSelectionRestoreResultRef.current?.(requestId, false);
              return;
            }
            view.dispatch({ effects: scrollEffect });
            measureRestore();
          });
        },
      });
      measureRestore();
    });
    return () => {
      cancelled = true;
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [applyAccessibilityAttributes, baseExtensions,
    restoreRequestId, restoreStart, restoreEnd, restoreFingerprint]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    applyAccessibilityAttributes(view);
  }, [applyAccessibilityAttributes]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const { scrollDOM, contentDOM } = view;
    const handleFocus = () => {
      if (document.activeElement === scrollDOM) {
        contentDOM.focus({ preventScroll: true });
      }
    };

    scrollDOM.addEventListener('focus', handleFocus);
    return () => {
      scrollDOM.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const length = view.state.doc.length;
    const slots = new Map<number, number>();
    const ranges = (writingMarks ?? []).filter((mark) => Number.isInteger(mark.from) && Number.isInteger(mark.to) && mark.from >= 0 && mark.to >= mark.from && mark.to <= length).map((mark) => {
      if (mark.kind === 'pin' || mark.kind === 'note') { const slot = slots.get(mark.from) ?? 0; slots.set(mark.from, slot + 1); return Decoration.widget({ widget: new WritingMarker(mark.kind, mark.label ?? '', () => { if (mark.id) writingNoteRef.current?.(mark.id); }, slot, mark.id ?? ''), side: mark.kind === 'pin' ? -1 : 1 }).range(mark.from); }
      return mark.to > mark.from ? Decoration.mark({ class: `stage19-writing-${mark.kind}` }).range(mark.from, mark.to) : null;
    }).filter((range): range is NonNullable<typeof range> => range !== null);
    view.dispatch({ effects: replaceWritingMarks.of(Decoration.set(ranges, true)) });
  }, [writingMarks, baseExtensions]);

  const formatSelection = useCallback((key: string) => {
    const view = viewRef.current;
    if (!view || readOnly) return;
    historyCommands.current?.format(view, key === 'b' ? '**' : '*');
    view.focus();
  }, [readOnly]);
  useEffect(() => {
    if (!onCommands) return;
    onCommands({
      beginDocumentSelection: () => {
        const view = viewRef.current;
        if (!view) return () => {};
        view.dispatch({ effects: documentSelection.current.reconfigure(EditorView.contentAttributes.of({ contenteditable: 'false', 'data-document-selection': 'true' })) });
        view.contentDOM.blur();
        return () => {
          if (viewRef.current === view) view.dispatch({ effects: documentSelection.current.reconfigure([]) });
        };
      },
      format: (style) => formatSelection(style === 'bold' ? 'b' : 'i'),
      undo: () => { const view = viewRef.current; if (view) historyCommands.current?.undo(view); },
      redo: () => { const view = viewRef.current; if (view) historyCommands.current?.redo(view); },
      replaceExactRange: (expected, from, to, text) => {
        const view = viewRef.current;
        if (!view || view.state.readOnly || view.state.doc.toString() !== expected || from < 0 || to < from || to > expected.length) return false;
        view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length }, scrollIntoView: true });
        view.focus();
        return true;
      },
      focus: () => viewRef.current?.focus(),
      historyMatches: (kind, expected) => {
        const entries = historyRef.current[kind];
        return entries[entries.length - 1] === expected;
      },
      hasHistory: (kind) => historyRef.current[kind].length > 0,
    });
    return () => onCommands(null);
  }, [onCommands, formatSelection]);
  const matches = () => {
    const view = viewRef.current;
    if (!view || !query) return [];
    const source = view.state.doc.toString();
    const from = selectionOnly ? searchSelection?.from ?? 0 : 0;
    const to = selectionOnly ? searchSelection?.to ?? 0 : source.length;
    return findLiteralWritingMatches(source, query, matchCase, from, to);
  };
  const replaceMatches = (all: boolean) => {
    const view = viewRef.current;
    if (!view || readOnly) return;
    const found = matches();
    const next = found.find((match) => match.from >= view.state.selection.main.from) ?? found[0];
    const chosen = all ? found : next ? [next] : [];
    if (!chosen.length) { setToolNotice('No matching words in this scope.'); return; }
    view.dispatch({ changes: chosen.map((match) => ({ ...match, insert: replacement })), userEvent: 'input.replace' });
    setToolNotice(`${chosen.length} replacement${chosen.length === 1 ? '' : 's'} made. Undo restores this action.`);
  };
  const nextMatch = () => {
    const view = viewRef.current;
    if (!view) return;
    const found = matches();
    const match = found.find((candidate) => candidate.from >= view.state.selection.main.to) ?? found[0];
    if (!match) { setToolNotice('No matching words in this scope.'); return; }
    view.dispatch({ selection: { anchor: match.from, head: match.to }, ...(supportsSelectionScrollMeasurement() ? { effects: EditorView.scrollIntoView(match.from) } : {}) });
    view.focus();
  };
  const beginSearch = () => {
    const selection = viewRef.current?.state.selection.main;
    setSearchSelection(selection && selection.from !== selection.to ? { from: selection.from, to: selection.to } : null);
    setSelectionOnly(false);
    setSearchOpen(!searchOpen);
    setToolNotice('Searches this saved writing section; other sections are not included.');
  };
  const foundMatches = matches();

  return (
    <div className={`draft-editor ${className ?? ''}`} style={{ minHeight: '100%' }}>
      {writingTools && toolbarVisible && !readOnly ? <div className="stage19-editor-tools" aria-label="Writing tools">
        <div className="stage19-editor-tools__actions">
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection('b')} aria-label="Bold selected words">Bold</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => formatSelection('i')} aria-label="Italic selected words">Italic</button>
          <button type="button" onClick={() => { const view = viewRef.current; if (view) historyCommands.current?.undo(view); }}>Undo</button>
          <button type="button" onClick={() => { const view = viewRef.current; if (view) historyCommands.current?.redo(view); }}>Redo</button>
          <button type="button" aria-expanded={searchOpen} onClick={beginSearch}>Find &amp; replace</button>
        </div>
        {searchOpen ? <div className="stage19-editor-tools__search" role="search" aria-label="Find and replace in current writing section">
          <label>Find<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <label>Replace with<input value={replacement} onChange={(event) => setReplacement(event.target.value)} /></label>
          <label>Scope<select value={selectionOnly ? 'selection' : 'section'} onChange={(event) => setSelectionOnly(event.target.value === 'selection')}><option value="section">Current writing section</option><option value="selection" disabled={!searchSelection}>Selected words</option></select></label>
          <label><input type="checkbox" checked={matchCase} onChange={(event) => setMatchCase(event.target.checked)} />Match case</label>
          <span role="status">{foundMatches.length} matches</span>
          <button type="button" disabled={!foundMatches.length} onClick={nextMatch}>Find next</button>
          <button type="button" disabled={!foundMatches.length} onClick={() => replaceMatches(false)}>Replace next</button>
          <button type="button" disabled={!foundMatches.length} onClick={() => replaceMatches(true)}>Replace all {foundMatches.length} matches</button>
          <button type="button" onClick={() => setSearchOpen(false)}>Close search</button>
        </div> : null}
        {toolNotice ? <p role="status">{toolNotice}</p> : null}
      </div> : null}
      <div ref={mountRef} className={hostClassName} />
    </div>
  );
}
