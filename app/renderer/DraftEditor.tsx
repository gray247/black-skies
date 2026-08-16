import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';

export interface DraftEditorDiffConfig {
  /**
   * Placeholder configuration for upcoming diff/merge support.
   * Actual merge view wiring will be implemented in a future task.
   */
  mode: 'merge' | 'readonly';
  base?: string;
  current?: string;
}

export interface DraftEditorProps {
  value: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  extensions?: Extension[];
  onChange?: (nextValue: string) => void;
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
      fontFamily: '"Ibarra Real Nova", "Times New Roman", serif',
      height: '100%',
    },
    '.cm-scroller': {
      overflow: 'auto',
      padding: '1.5rem 1.75rem',
      fontSize: '1.05rem',
      lineHeight: '1.75',
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

export default function DraftEditor({
  value,
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
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const docRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const skipNextChangeRef = useRef(false);
  const historyOperationRef = useRef<'undo' | 'redo' | null>(null);
  const historyRef = useRef<DraftHistoryState>({
    undo: [],
    redo: [],
    lastEditKind: null,
    lastEditAt: 0,
  });
  const editorRevisionRef = useRef(0);
  const selectionSequenceRef = useRef(0);

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
                history.undo.push(update.startState.doc.toString());
                if (history.undo.length > MAX_UNDO_ENTRIES) {
                  history.undo.shift();
                }
              }
              history.redo.length = 0;
              history.lastEditKind = isTyping ? 'typing' : 'other';
              history.lastEditAt = now;
            }
            onChangeRef.current?.(update.state.doc.toString());
          }
        }
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
    const configuration: Extension[] = [
      lineNumbers(),
      EditorView.lineWrapping,
      keymap.of([
        {
          key: 'Mod-s',
          run: (view) => {
            onSaveRef.current?.(view.state.doc.toString());
            return true;
          },
        },
        { key: 'Mod-z', run: undo },
        { key: 'Mod-Shift-z', run: redo },
        { key: 'Mod-y', run: redo },
      ]),
      markdown(),
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
  }, [changeListener, diffExtensions, extensions, readOnly, resolvedPlaceholder]);

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
    docRef.current = value;
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const currentValue = view.state.doc.toString();
    if (value === currentValue) {
      return;
    }
    historyRef.current.undo.length = 0;
    historyRef.current.redo.length = 0;
    historyRef.current.lastEditKind = null;
    historyOperationRef.current = null;
    skipNextChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !selectionRestore) return;
    const source = view.state.doc.toString();
    const { requestId, selectionStart, selectionEnd, selectionFingerprint } = selectionRestore;
    if (
      selectionStart < 0 ||
      selectionEnd < selectionStart ||
      selectionEnd > source.length
    ) {
      onSelectionRestoreResult?.(requestId, false);
      return;
    }
    let cancelled = false;
    void buildDraftEditorSelectionEvidence(
      source,
      selectionStart,
      selectionEnd,
      editorRevisionRef.current,
    ).then((evidence) => {
      if (cancelled) return;
      if (evidence.selectionFingerprint !== selectionFingerprint) {
        onSelectionRestoreResult?.(requestId, false);
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
      onSelectionRestoreResult?.(requestId, true);
    });
    return () => {
      cancelled = true;
    };
  }, [onSelectionRestoreResult, selectionRestore]);

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

  return (
    <div className={`draft-editor ${className ?? ''}`} style={{ minHeight: '100%' }}>
      <div ref={mountRef} className={hostClassName} />
    </div>
  );
}
