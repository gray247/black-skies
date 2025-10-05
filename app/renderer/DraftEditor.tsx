import { useEffect, useMemo, useRef } from 'react';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
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
  diffConfig?: DraftEditorDiffConfig | null;
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
      caretColor: '#cbd5f5',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'rgba(148, 163, 184, 0.58)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(148, 163, 184, 0.08)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(148, 163, 184, 0.14)',
    },
    '.cm-placeholder': {
      color: 'rgba(148, 163, 184, 0.45)',
      fontStyle: 'italic',
    },
  },
  { dark: true },
);

const hostClassName = 'draft-editor__mount';

export default function DraftEditor({
  value,
  placeholder,
  readOnly = false,
  className,
  extensions,
  onChange,
  diffConfig,
}: DraftEditorProps): JSX.Element {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const docRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const skipNextChangeRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const diffExtensions = useMemo<Extension[]>(() => {
    if (!diffConfig) {
      return [];
    }
    // TODO: integrate merge/diff view once diff pipelines are available.
    return [];
  }, [diffConfig]);

  const changeListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) {
          return;
        }
        if (skipNextChangeRef.current) {
          skipNextChangeRef.current = false;
          return;
        }
        const handler = onChangeRef.current;
        if (handler) {
          handler(update.state.doc.toString());
        }
      }),
    [],
  );

  const resolvedPlaceholder = placeholder ?? 'Start drafting this scene…';

  const baseExtensions = useMemo(() => {
    const configuration: Extension[] = [
      lineNumbers(),
      EditorView.lineWrapping,
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

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [baseExtensions]);

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
    skipNextChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  return (
    <div className={`draft-editor ${className ?? ''}`}>
      <div ref={mountRef} className={hostClassName} />
    </div>
  );
}
