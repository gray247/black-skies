import type { WritingSearchState, WritingOutlineView } from './components/WritingPage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CommandWorkspaceV1 } from '../shared/ipc/contextualProductShell';
import type { SplitCommandLogicalSurface } from '../shared/ipc/splitCommand';
import type { DraftEditorSelectionRestore } from './DraftEditor';
import { buildLivingOutlineSourceAnchor } from '../shared/livingOutlineAnchors';
import type { WritingRange } from '../shared/writingRanges';
import type { CompanionOrientationResultV1 } from '../shared/companionOrientation';

export interface WritingViewSnapshot {
  readonly note: {
    session: string;
    id: string | null;
    body: string;
    ranges: readonly WritingRange[];
    sourceReady?: boolean;
    message?: string;
  } | null;
  readonly selection: readonly WritingRange[];
  readonly selectionSource?: { readonly projectId: string; readonly generation: number; readonly bodies: Readonly<Record<string, string>> };
  readonly pin: 'beginning' | { unitId: string; offset: number } | null;
  readonly search?: WritingSearchState;
  readonly outlineView?: WritingOutlineView;
}

export interface WorkPlace {
  readonly surface: SplitCommandLogicalSurface;
  readonly workspace: CommandWorkspaceV1;
  readonly unitId: string | null;
  readonly selection: {
    selectionStart: number;
    selectionEnd: number;
    selectionFingerprint: string;
    sourceFingerprint: string;
  } | null;
  readonly writingView?: WritingViewSnapshot | null;
  readonly companion?: { result: CompanionOrientationResultV1 | null; prompt: string };
}
interface Entry extends WorkPlace {
  readonly projectKey: string;
  readonly readingPosition: number;
}
interface Options {
  projectKey: string;
  getPlace: () => WorkPlace;
  getBody: (unitId: string) => string | undefined;
  activate: (surface: SplitCommandLogicalSurface) => Promise<boolean>;
  selectUnit: (unitId: string) => Promise<boolean>;
  setWorkspace: (workspace: CommandWorkspaceV1) => void;
  restoreCompanion?: (state: WorkPlace['companion']) => void;
}

export function useWorkNavigation(options: Options) {
  const latest = useRef(options);
  latest.current = options;
  const history = useRef<Entry[]>([]);
  const restoring = useRef(false);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [selectionRestore, setSelectionRestore] = useState<
    (DraftEditorSelectionRestore & { unitId: string }) | null
  >(null);
  const [writingViewRestore, setWritingViewRestore] = useState<{
    id: string;
    state: WritingViewSnapshot;
  } | null>(null);
  const pendingScroll = useRef<Entry | null>(null);
  const frame = useRef<number | null>(null);
  const scrollNode = (surface: SplitCommandLogicalSurface) =>
    document.querySelector<HTMLElement>(
      surface === 'writing' ? '[data-manuscript-scroll-owner]' : '.stage19-command__task-canvas',
    );
  const restoreScroll = useCallback(() => {
    const entry = pendingScroll.current;
    if (!entry || entry.projectKey !== latest.current.projectKey) return;
    const apply = () => {
      if (pendingScroll.current !== entry || entry.projectKey !== latest.current.projectKey) return;
      const node = scrollNode(entry.surface);
      if (node) node.scrollTop = entry.readingPosition;
      pendingScroll.current = null;
    };
    frame.current = window.requestAnimationFrame(() => {
      frame.current = window.requestAnimationFrame(apply);
    });
  }, []);
  useEffect(() => {
    history.current = [];
    pendingScroll.current = null;
    setCount(0);
    setNotice('');
    setSelectionRestore(null);
    setWritingViewRestore(null);
    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    };
  }, [options.projectKey]);

  /** Capture before navigation, commit only after the owning action succeeds. */
  const prepare = useCallback(() => {
    const place = latest.current.getPlace();
    const entry: Entry = {
      ...place,
      projectKey: latest.current.projectKey,
      readingPosition: scrollNode(place.surface)?.scrollTop ?? 0,
    };
    return () => {
      if (restoring.current || entry.projectKey !== latest.current.projectKey) return;
      const previous = history.current[history.current.length - 1];
      if (previous && JSON.stringify(previous) === JSON.stringify(entry)) return;
      history.current = [...history.current.slice(-99), entry];
      setCount(history.current.length);
      setNotice('');
    };
  }, []);

  const back = useCallback(async () => {
    if (restoring.current) return;
    const entry = history.current.pop();
    setCount(history.current.length);
    if (!entry || entry.projectKey !== latest.current.projectKey) return;
    restoring.current = true;
    setSelectionRestore(null);
    try {
      if (latest.current.getPlace().surface !== entry.surface) {
        const activated = await latest.current.activate(entry.surface);
        if (entry.projectKey !== latest.current.projectKey) return;
        if (!activated) {
          history.current.push(entry);
          setCount(history.current.length);
          setNotice('The previous surface could not be opened. Your current work is retained.');
          return;
        }
      }
      if (entry.projectKey !== latest.current.projectKey) return;
      latest.current.setWorkspace(entry.workspace);
      latest.current.restoreCompanion?.(entry.companion);
      if (entry.writingView)
        setWritingViewRestore({
          id: crypto.randomUUID(),
          state: { ...entry.writingView, pin: null },
        });
      const current = latest.current.getPlace();
      if (entry.unitId && current.unitId !== entry.unitId) {
        const selected = await latest.current.selectUnit(entry.unitId);
        if (entry.projectKey !== latest.current.projectKey) return;
        if (!selected) {
          setNotice('Returned to the previous tool; its writing section is no longer available.');
          return;
        }
      }
      if (entry.projectKey !== latest.current.projectKey) return;
      pendingScroll.current = entry;
      if (entry.surface === 'writing' && entry.unitId && entry.selection) {
        const body = latest.current.getBody(entry.unitId);
        if (body !== undefined && entry.selection.selectionEnd <= body.length) {
          const anchor = await buildLivingOutlineSourceAnchor(
            entry.unitId,
            body,
            entry.selection.selectionStart,
            entry.selection.selectionEnd,
          );
          if (entry.projectKey !== latest.current.projectKey) return;
          if (
            anchor.sourceFingerprint === entry.selection.sourceFingerprint &&
            anchor.selectionFingerprint === entry.selection.selectionFingerprint &&
            latest.current.getBody(entry.unitId) === body
          ) {
            setSelectionRestore({
              requestId: `back-${crypto.randomUUID()}`,
              unitId: entry.unitId,
              ...entry.selection,
            });
            setNotice('Returned to your previous work.');
            return;
          }
        }
        if (entry.writingView)
          setWritingViewRestore({
            id: crypto.randomUUID(),
            state: {
              ...entry.writingView,
              selection: [],
              pin: null,
              note: entry.writingView.note?.id
                ? entry.writingView.note
                : entry.writingView.note
                  ? {
                      ...entry.writingView.note,
                      ranges: [],
                      sourceReady: false,
                      message:
                        'The writing changed. Select its current words before attaching this Note.',
                    }
                  : null,
            },
          });
        setNotice(
          'Returned to the previous writing section. Its words changed, so the old selection was not guessed.',
        );
      } else setNotice('Returned to your previous work.');
      restoreScroll();
    } finally {
      restoring.current = false;
    }
  }, [restoreScroll]);

  const acknowledgeSelection = useCallback(
    (requestId: string, restored: boolean) => {
      setSelectionRestore((current) => (current?.requestId === requestId ? null : current));
      if (!restored) setNotice('The previous selection changed. Returned to its writing section.');
      restoreScroll();
    },
    [restoreScroll],
  );
  return {
    canBack: count > 0,
    prepare,
    back,
    notice,
    selectionRestore,
    writingViewRestore,
    acknowledgeSelection,
  };
}
