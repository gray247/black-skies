import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  LivingOutlineBridge,
  LivingOutlineItemV1,
  LivingOutlineSnapshotV1,
  WritingGroupV1,
  GapWritingOperationV1,
} from '../shared/ipc/livingOutline';
import type { ProjectSpineSessionSnapshot } from '../shared/ipc/projectSpine';
import {
  buildLivingOutlineSourceAnchor,
  resolveLivingOutlineAnchor,
} from '../shared/livingOutlineAnchors';
import { extractProjectSpineDraftBody } from '../shared/projectSpineDraft';
import {
  isWritingGroups,
  writingGroupLabel,
  joinedWritingName,
  rebaseWritingAnchor,
  subtractWritingSelection,
  noteSourceAnchors,
  type WritingEdit,
  type WritingRange,
  writingLinksKey,
} from '../shared/writingRanges';

interface Options {
  snapshot: ProjectSpineSessionSnapshot;
  outline: LivingOutlineSnapshotV1 | null;
  bridge?: LivingOutlineBridge;
  getSnapshot: () => ProjectSpineSessionSnapshot;
  getBodies: () => Readonly<Record<string, string>>;
  saveSource: (unitId: string, body?: string) => Promise<void>;
  onOutline: (outline: LivingOutlineSnapshotV1) => void;
  reportDirty: (unitId: string, dirty: boolean) => void;
  captureSourceRecovery?: (unitId: string, body: string) => Promise<boolean>;
}

export interface WritingLinksSnapshot {
  readonly groups: readonly WritingGroupV1[];
  readonly notes: readonly { readonly id: string; readonly anchors: readonly NonNullable<LivingOutlineItemV1['sourceAnchor']>[] }[];
  readonly key: string;
  readonly pinHistory?: readonly WritingGroupV1[][];
  readonly planHistory?: readonly { before: string[]; after: string[] }[];
}

export interface WritingMembershipChange {
  readonly label: string;
  readonly before: WritingLinksSnapshot;
  readonly after: WritingLinksSnapshot;
  readonly bodies: Record<string, string>;
}

export type ManualConcernDraft = { projectKey: string; body: string; sources: (WritingRange & { body: string })[] };

export type NotebookDraft = { projectKey: string; id: string | null; label: string; body: string; originalLabel: string; originalBody: string; scope: 'whole-story' | 'unattached' };

export function useWritingPage(options: Options) {
  const manualConcernDrafts = useRef(new Map<string, ManualConcernDraft | null>());
  const notebookDrafts = useRef(new Map<string, NotebookDraft | null>());
  const latest = useRef(options);
  latest.current = options;
  const identity = `${options.snapshot.project?.projectId ?? ''}:${options.snapshot.project?.path ?? ''}:${options.snapshot.generation}`;
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const [groups, setGroups] = useState<readonly WritingGroupV1[]>([]);
  const groupRef = useRef(groups);
  const noteOverrides = useRef(
    new Map<string, readonly NonNullable<LivingOutlineItemV1['sourceAnchor']>[]>(),
  );
  const relocatedNotes = useRef(new Set<string>());
  const outlineRef = useRef(options.outline);
  outlineRef.current = options.outline;
  const loadedIdentity = useRef('');
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [unsaved, setUnsaved] = useState(false);
  const dirty = useRef(false);
  const dirtySourceIds = useRef(new Set<string>());
  const epoch = useRef(0);
  const [unresolved, setUnresolved] = useState<readonly string[]>([]);
  const [unresolvedNotes, setUnresolvedNotes] = useState<readonly string[]>([]);
  const unresolvedRef = useRef<readonly string[]>([]);
  const history = useRef<readonly WritingGroupV1[][]>([]);
  const membershipListeners = useRef(new Set<(event: WritingMembershipChange) => void>());
  const subscribeMembership = useCallback((listener: (event: WritingMembershipChange) => void) => {
    membershipListeners.current.add(listener);
    return () => { membershipListeners.current.delete(listener); };
  }, []);
  const publishMembership = (before: WritingLinksSnapshot, label: string) => {
    const after = captureLinks();
    if (before.key === after.key) return;
    const event = { before, after, label, bodies: { ...latest.current.getBodies() } };
    for (const listener of membershipListeners.current) listener(event);
  };
  const deletedNotes = useRef<{ item: LivingOutlineItemV1; beforeId: string | null }[]>([]);
  const planHistory = useRef<{ before: string[]; after: string[] }[]>([]);
  const editMemory = useRef(
    new Map<
      string,
      Map<
        string,
        {
          groups: readonly WritingGroupV1[];
          notes: Map<string, readonly NonNullable<LivingOutlineItemV1['sourceAnchor']>[]>;
        }
      >
    >(),
  );
  const [, redraw] = useState(0);
  const setCurrentGroups = useCallback((next: readonly WritingGroupV1[]) => {
    groupRef.current = next;
    setGroups(next);
  }, []);

  useEffect(() => {
    epoch.current += 1;
    dirty.current = false;
    dirtySourceIds.current.clear();
    setUnsaved(false);
    setCurrentGroups([]);
    noteOverrides.current.clear();
    relocatedNotes.current.clear();
    history.current = [];
    deletedNotes.current = [];
    planHistory.current = [];
    editMemory.current.clear();
    unresolvedRef.current = [];
    setUnresolved([]);
    setUnresolvedNotes([]);
    setNotice('');
    loadedIdentity.current = '';
    setLoaded(false);
  }, [identity, setCurrentGroups]);

  useEffect(() => {
    if (!options.outline || options.outline.document.projectId !== options.snapshot.project?.projectId || options.outline.availability !== 'ready' || dirty.current) return;
    const stored = options.outline.document.writingGroups ?? [];
    const atEpoch = epoch.current;
    let cancelled = false;
    void Promise.all(
      stored.map(async (group) => {
        let missing = false;
        const spans = await Promise.all(
          group.spans.map(async (span) => {
            const source = latest.current.getBodies()[span.unitId];
            if (source === undefined) {
              missing = true;
              return span;
            }
            const resolved = await resolveLivingOutlineAnchor(span, source);
            if (!('selectionStart' in resolved)) {
              missing = true;
              return span;
            }
            return {
              ...span,
              selectionStart: resolved.selectionStart,
              selectionEnd: resolved.selectionEnd,
            };
          }),
        );
        return { group: { ...group, spans }, missing };
      }),
    )
      .then(async (loaded) => {
        const resolvedNotes = await Promise.all(
          (options.outline?.document.items ?? [])
            .filter((item) => noteSourceAnchors(item).length)
            .map(async (item) => {
              const anchors = await Promise.all(
                noteSourceAnchors(item).map(async (anchor) => {
                  const body = latest.current.getBodies()[anchor.unitId];
                  if (body === undefined) return null;
                  const resolved = await resolveLivingOutlineAnchor(anchor, body);
                  return 'selectionStart' in resolved
                    ? {
                        ...anchor,
                        selectionStart: resolved.selectionStart,
                        selectionEnd: resolved.selectionEnd,
                      }
                    : null;
                }),
              );
              return {
                id: item.id,
                anchor: anchors.every((anchor) => anchor !== null)
                  ? (anchors as readonly NonNullable<LivingOutlineItemV1['sourceAnchor']>[])
                  : null,
              };
            }),
        );
        if (
          cancelled ||
          identityRef.current !== identity ||
          epoch.current !== atEpoch ||
          dirty.current
        )
          return;
        noteOverrides.current = new Map(
          resolvedNotes.flatMap((item) => (item.anchor ? [[item.id, item.anchor] as const] : [])),
        );
        setUnresolvedNotes(resolvedNotes.filter((item) => !item.anchor).map((item) => item.id));
        if (
          !isWritingGroups(
            loaded.filter((item) => !item.missing).map((item) => item.group),
            () => true,
          )
        )
          for (const item of loaded) item.missing = true;
        setCurrentGroups(loaded.map((item) => item.group));
        unresolvedRef.current = loaded.filter((item) => item.missing).map((item) => item.group.id);
        setUnresolved(unresolvedRef.current);
        loadedIdentity.current = identity;
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled || identityRef.current !== identity || dirty.current) return;
        setCurrentGroups(stored);
        unresolvedRef.current = stored.map((group) => group.id);
        setUnresolved(unresolvedRef.current);
        setUnresolvedNotes(
          (options.outline?.document.items ?? [])
            .filter((item) => noteSourceAnchors(item).length)
            .map((item) => item.id),
        );
        loadedIdentity.current = identity;
        setLoaded(true);
        setNotice('Some saved links could not be checked. Their records are retained for review.');
      });
    return () => {
      cancelled = true;
    };
  }, [identity, options.outline, options.snapshot.project?.projectId, setCurrentGroups]);

  const edited = (
    unitId: string,
    before: string,
    after: string,
    changes?: readonly WritingEdit[],
    historyAction?: 'undo' | 'redo',
  ) => {
    if (before === after) return;
    dirtySourceIds.current.add(unitId);
    const canMapNotes = loadedIdentity.current === identity;
    if (!canMapNotes) {
      const stored = outlineRef.current?.document.writingGroups ?? [];
      setCurrentGroups(stored);
      unresolvedRef.current = stored.map((group) => group.id);
      setUnresolved(unresolvedRef.current);
      setUnresolvedNotes(
        (outlineRef.current?.document.items ?? [])
          .filter((item) => noteSourceAnchors(item).length)
          .map((item) => item.id),
      );
      loadedIdentity.current = identity;
      setLoaded(true);
      if (stored.length)
        setNotice(
          'Writing changed before its saved links were checked. Review their sources before saving unit changes.',
        );
    }
    const memory =
      editMemory.current.get(unitId) ??
      new Map<
        string,
        {
          groups: readonly WritingGroupV1[];
          notes: Map<string, readonly NonNullable<LivingOutlineItemV1['sourceAnchor']>[]>;
        }
      >();
    const currentNotes = new Map(
      (outlineRef.current?.document.items ?? []).flatMap((item) => {
        const anchors = noteOverrides.current.get(item.id) ?? noteSourceAnchors(item);
        return anchors.some((anchor) => anchor.unitId === unitId)
          ? [[item.id, anchors] as const]
          : [];
      }),
    );
    memory.set(before, { groups: groupRef.current, notes: currentNotes });
    while (memory.size > 200) memory.delete(memory.keys().next().value!);
    editMemory.current.set(unitId, memory);
    const restore = historyAction ? memory.get(after) : undefined;
    let edits = changes;
    if (!edits) {
      let start = 0;
      while (start < before.length && start < after.length && before[start] === after[start])
        start += 1;
      let tail = 0;
      while (
        tail < before.length - start &&
        tail < after.length - start &&
        before[before.length - 1 - tail] === after[after.length - 1 - tail]
      )
        tail += 1;
      edits = [
        { from: start, to: before.length - tail, insert: after.slice(start, after.length - tail) },
      ];
    }
    const transaction = edits;
    const rebase = (items: readonly WritingGroupV1[]) =>
      items.map((group) => {
        const remembered = restore?.groups
          .find((prior) => prior.id === group.id)
          ?.spans.filter((span) => span.unitId === unitId);
        let restored = false;
        return {
          ...group,
          spans: group.spans.flatMap((span) => {
            if (span.unitId !== unitId) return [span];
            if (!remembered?.length) return [rebaseWritingAnchor(span, transaction)];
            if (restored) return [];
            restored = true;
            return remembered;
          }),
        };
      });
    setCurrentGroups(rebase(groupRef.current));
    history.current = history.current.map((items) => [...rebase(items)]);
    for (const item of outlineRef.current?.document.items ?? []) {
      const anchors = noteOverrides.current.get(item.id) ?? noteSourceAnchors(item);
      if (
        anchors.some((anchor) => anchor.unitId === unitId) &&
        canMapNotes &&
        !unresolvedNotes.includes(item.id)
      ) {
        const remembered = restore?.notes.get(item.id);
        let restored = false;
        noteOverrides.current.set(
          item.id,
          anchors.flatMap((anchor) => {
            if (anchor.unitId !== unitId) return [anchor];
            const sameUnit = remembered?.filter((span) => span.unitId === unitId);
            if (!sameUnit?.length) return [rebaseWritingAnchor(anchor, transaction)];
            if (restored) return [];
            restored = true;
            return sameUnit;
          }),
        );
      }
    }
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
  };

  const save = async (): Promise<boolean> => {
    const entryIdentity = identityRef.current;
    const bridge = latest.current.bridge;
    const pending = latest.current.getSnapshot();
    const pendingBodies = latest.current.getBodies();
    // Accepted recovery can supply unsaved prose without a local editor or
    // membership edit. The shared Save must still flush every such section.
    const pendingSources = dirtySourceIds.current.size > 0 || (pending.dirtyUnitIds?.length ?? 0) > 0 ||
      Object.entries(pendingBodies).some(([id, body]) => typeof pending.project?.drafts?.[id] === 'string' &&
        extractProjectSpineDraftBody(pending.project.drafts[id]!) !== body);
    if (!dirty.current && !pendingSources) return true;
    if (busyRef.current || !bridge?.replaceWritingState || !outlineRef.current) return false;
    if (unresolvedRef.current.length) {
      setNotice(
        'Some writing units have unresolved sources. Reconnect or unpin those units before saving their ranges.',
      );
      return false;
    }
    busyRef.current = true;
    setBusy(true);
    setNotice('Saving writing and its linked units and Notes…');
    try {
      const startEpoch = epoch.current;
      const bodies = { ...latest.current.getBodies() };
      const current = latest.current.getSnapshot();
      if (!current.project) return false;
      const sourceIds = new Set(
        groupRef.current
          .flatMap((group) => group.spans.map((span) => span.unitId))
          .concat(
            [...noteOverrides.current.values()].flatMap((anchors) =>
              anchors.map((anchor) => anchor.unitId),
            ),
          ),
      );
      // A move followed by Undo can restore exact saved prose in a former
      // source section. Flush its save/recovery owner as well as its dirty
      // receipt, even when Undo restored the exact durable prose.
      for (const unitId of dirtySourceIds.current) sourceIds.add(unitId);
      for (const unitId of current.dirtyUnitIds ?? []) if (typeof bodies[unitId] === 'string') sourceIds.add(unitId);
      for (const [unitId, body] of Object.entries(bodies))
        if (
          typeof current.project.drafts?.[unitId] === 'string' &&
          extractProjectSpineDraftBody(current.project.drafts[unitId]!) !== body
        )
          sourceIds.add(unitId);
      for (const unitId of sourceIds) {
        const raw = latest.current.getSnapshot().project?.drafts?.[unitId];
        if (typeof raw !== 'string' || bodies[unitId] === undefined)
          throw new Error(
            'A linked writing section is unavailable. Its unit and Notes were retained.',
          );
        if (extractProjectSpineDraftBody(raw) !== bodies[unitId] || dirtySourceIds.current.has(unitId) || current.dirtyUnitIds?.includes(unitId))
          await latest.current.saveSource(unitId, bodies[unitId]);
        if (identityRef.current !== entryIdentity || epoch.current !== startEpoch)
          throw new Error('Writing changed during Save. Save again to keep the latest ranges.');
        if (
          extractProjectSpineDraftBody(
            latest.current.getSnapshot().project?.drafts?.[unitId] ?? '',
          ) !== bodies[unitId]
        )
          throw new Error(
            'A writing section could not be saved. Unit and Note changes remain unsaved.',
          );
      }
      const rebuilt = await Promise.all(
        groupRef.current.map(async (group) => ({
          ...group,
          label: writingGroupLabel(group, bodies),
          spans: await Promise.all(
            group.spans.map((span) =>
              buildLivingOutlineSourceAnchor(
                span.unitId,
                bodies[span.unitId] ?? '',
                span.selectionStart,
                span.selectionEnd,
              ),
            ),
          ),
        })),
      );
      const noteAnchors = await Promise.all(
        [...noteOverrides.current.entries()].map(async ([itemId, spans]) => {
          const anchors = await Promise.all(
            spans.map((span) =>
              buildLivingOutlineSourceAnchor(
                span.unitId,
                bodies[span.unitId] ?? '',
                span.selectionStart,
                span.selectionEnd,
              ),
            ),
          );
          return { itemId, anchor: anchors[0]!, anchors,
            ...(relocatedNotes.current.has(itemId) ? { reconnect: true } : {}) };
        }),
      );
      if (epoch.current !== startEpoch || identityRef.current !== entryIdentity)
        throw new Error('Writing changed before ranges could be saved. Try Save again.');
      const snapshot = latest.current.getSnapshot();
      const project = snapshot.project;
      const outline = outlineRef.current;
      if (!project || !outline || outline.document.projectId !== project.projectId)
        throw new Error('The active project changed. No range commit was started.');
      const result = await bridge.replaceWritingState({
        operationId: `writing-state-${crypto.randomUUID()}`,
        projectId: project.projectId,
        projectPath: project.path,
        generation: snapshot.generation,
        expectedRevision: outline.document.revision,
        groups: rebuilt,
        // Rearranging a plan must not turn unchanged Notes into apparent edits.
        // The legacy single-anchor shape is equivalent to a one-entry array.
        noteAnchors: noteAnchors.filter(update => {
          const note = outline.document.items.find(item => item.id === update.itemId);
          return !note || JSON.stringify(noteSourceAnchors(note)) !== JSON.stringify(update.anchors);
        }),
      });
      if (identityRef.current !== entryIdentity) return false;
      if (!result.ok) throw new Error(result.error.message);
      outlineRef.current = result.data;
      latest.current.onOutline(result.data);
      if (epoch.current === startEpoch) {
        setCurrentGroups(rebuilt);
        noteOverrides.current.clear();
        relocatedNotes.current.clear();
        dirty.current = false;
        dirtySourceIds.current.clear();
        setUnsaved(false);
        for (const unitId of sourceIds) latest.current.reportDirty(unitId, false);
      }
      setNotice(
        epoch.current === startEpoch
          ? 'Writing units and Notes saved.'
          : 'Saved the earlier state. Newer edits still need Save.',
      );
      return epoch.current === startEpoch;
    } catch (error) {
      if (identityRef.current === entryIdentity) {
        setNotice(
          error instanceof Error
            ? error.message
            : 'Ranges could not be saved. Writing remains available.',
        );
        dirty.current = true;
        setUnsaved(true);
        for (const group of groupRef.current)
          for (const span of group.spans) latest.current.reportDirty(span.unitId, true);
      }
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const pin = async (selection: readonly WritingRange[], options?: { extendId?: string; name?: string }) => {
    if (
      busyRef.current ||
      !loaded ||
      !selection.length ||
      selection.every((range) => range.from === range.to)
    )
      return;
    if (unresolvedRef.current.length) {
      setNotice(
        'Review or unpin unresolved units before defining another unit. Their records are retained.',
      );
      return;
    }
    const bodies = latest.current.getBodies();
    if (
      selection.some(
        (range) =>
          bodies[range.unitId] === undefined ||
          range.from < 0 ||
          range.to <= range.from ||
          range.to > bodies[range.unitId]!.length,
      )
    ) {
      setNotice('Select a valid beginning and end in the writing.');
      return;
    }
    const before = groupRef.current;
    const extended = options?.extendId ? before.find(group => group.id === options.extendId) : undefined;
    if (options?.extendId && (!extended || extended.spans.some(span => !selection.some(range =>
      range.unitId === span.unitId && range.from <= span.selectionStart && range.to >= span.selectionEnd)))) {
      setNotice('Extend must retain the complete original unit. Choose its current range again.');
      return;
    }
    const included = before.filter(group => group.spans.every(span => selection.some(range =>
      range.unitId === span.unitId && range.from <= span.selectionStart && range.to >= span.selectionEnd)));
    const customName = extended ? writingGroupLabel(extended, bodies) : options?.name?.trim()
      || (included.length > 1 ? joinedWritingName(included, latest.current.getSnapshot().project?.units.map(unit => unit.id) ?? []) : '');
    if (customName.length > 240 || (options?.name !== undefined && !options.name.trim())) {
      setNotice('Edit the combined unit name to 1–240 characters before joining. No units changed.');
      return;
    }
    const startEpoch = epoch.current;
    const startIdentity = identityRef.current;
    busyRef.current = true;
    setBusy(true);
    let spans: Awaited<ReturnType<typeof buildLivingOutlineSourceAnchor>>[];
    try {
      spans = await Promise.all(
        selection.map((range) =>
          buildLivingOutlineSourceAnchor(range.unitId, bodies[range.unitId]!, range.from, range.to),
        ),
      );
    } catch {
      if (identityRef.current === startIdentity)
        setNotice('Pin could not be prepared. The writing and existing units are retained.');
      return;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    if (identityRef.current !== startIdentity || epoch.current !== startEpoch) {
      setNotice('Writing changed while Pin was being prepared. Choose the range again.');
      return;
    }
    const label =
      selection
        .map((range) => bodies[range.unitId]!.slice(range.from, range.to))
        .join(' ')
        .trim()
        .split(/\s+/u)
        .slice(0, 10)
        .join(' ')
        .slice(0, 240) || 'Writing unit';
    const membershipBefore = captureLinks();
    history.current = [...history.current.slice(-49), [...before]];
    setCurrentGroups([
      ...subtractWritingSelection(before, selection),
      { ...(extended ?? {}), id: extended?.id ?? `writing-${crypto.randomUUID()}`, label: customName || label, customLabel: Boolean(customName), spans },
    ]);
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    publishMembership(membershipBefore, extended ? 'Extend unit' : 'Pin / merge');
    await save();
  };

  const undoPin = async () => {
    if (busyRef.current || !history.current.length) return;
    const previous = history.current[history.current.length - 1]!;
    history.current = history.current.slice(0, -1);
    setCurrentGroups(previous);
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    await save();
  };

  const keepNote = async (
    itemId: string | null,
    body: string,
    selection: readonly WritingRange[],
  ) => {
    const bridge = latest.current.bridge;
    const snapshot = latest.current.getSnapshot();
    const outline = outlineRef.current;
    if (!bridge || !snapshot.project || !outline || busyRef.current || !body.trim()) return;
    if (!itemId && !selection.length) {
      setNotice('Choose writing for this Note. Its draft remains open.');
      return;
    }
    const binding = {
      operationId: `writing-note-${crypto.randomUUID()}`,
      projectId: snapshot.project.projectId,
      projectPath: snapshot.project.path,
      generation: snapshot.generation,
      expectedRevision: outline.document.revision,
    };
    const item = itemId ? outline.document.items.find((note) => note.id === itemId) : null;
    if (itemId && !item) {
      setNotice('That Note is no longer available.');
      return;
    }
    const range = selection[0];
    busyRef.current = true;
    setBusy(true);
    try {
      if (!item)
        for (const range of selection) {
          const body = latest.current.getBodies()[range.unitId];
          if (body === undefined) {
            setNotice('This writing section is unavailable. The Note draft is retained.');
            return;
          }
          if (
            extractProjectSpineDraftBody(
              latest.current.getSnapshot().project?.drafts?.[range.unitId] ?? '',
            ) !== body
          )
            await latest.current.saveSource(range.unitId, body);
          if (
            identityRef.current !== identity ||
            latest.current.getBodies()[range.unitId] !== body ||
            extractProjectSpineDraftBody(
              latest.current.getSnapshot().project?.drafts?.[range.unitId] ?? '',
            ) !== body
          ) {
            setNotice('Save the current writing before keeping this Note. Its draft is retained.');
            return;
          }
        }
      const sourceAnchors = !item
        ? await Promise.all(
            selection.map(async (range) => {
              const anchor = await buildLivingOutlineSourceAnchor(
                range.unitId,
                latest.current.getBodies()[range.unitId] ?? '',
                range.from,
                range.to,
              );
              if (range.sourceFingerprint && anchor.sourceFingerprint !== range.sourceFingerprint)
                throw new Error(
                  'The selected writing changed. Choose its current range before keeping the Note.',
                );
              return anchor;
            }),
          )
        : [];
      const result = item
        ? await bridge.updateItem({
            ...binding,
            itemId: item.id,
            label: item.label,
            body,
            kind: item.kind,
            state: item.state,
          })
        : await bridge.createItem({
            ...binding,
            label: body.trim().split(/\s+/u).slice(0, 7).join(' ').slice(0, 240),
            body,
            kind: 'fragment',
            state: 'authored',
            noteScope: 'passage',
            sourceWasSpan: selection.some(range => range.to > range.from),
            manuscriptUnitId: range!.unitId,
            sourceAnchor: sourceAnchors[0]!,
            sourceAnchors,
          });
      if (identityRef.current !== identity) return;
      if (result.ok) {
        outlineRef.current = result.data;
        latest.current.onOutline(result.data);
        setNotice('Note saved.');
        redraw((value) => value + 1);
        return (
          item?.id ??
          result.data.document.items.find(
            (candidate) => !outline.document.items.some((old) => old.id === candidate.id),
          )?.id
        );
      } else setNotice(result.error.message);
    } catch (error) {
      if (identityRef.current === identity)
        setNotice(
          error instanceof Error
            ? error.message
            : 'The Note could not be saved. Its draft remains open.',
        );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const reconnectNote = async (itemId: string, selection: readonly WritingRange[]) => {
    const bridge = latest.current.bridge;
    const outline = outlineRef.current;
    const entryIdentity = identityRef.current;
    if (!bridge?.replaceWritingState || !outline || busyRef.current || !selection.length) {
      setNotice('Select the writing to reconnect this Note.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const atEpoch = epoch.current;
    try {
      const bodies = { ...latest.current.getBodies() };
      for (const range of selection) {
        if (
          bodies[range.unitId] === undefined ||
          range.from < 0 ||
          range.to < range.from ||
          range.to > bodies[range.unitId]!.length
        )
          throw new Error('Choose a current writing passage for this Note.');
        if (
          extractProjectSpineDraftBody(
            latest.current.getSnapshot().project?.drafts?.[range.unitId] ?? '',
          ) !== bodies[range.unitId]
        )
          await latest.current.saveSource(range.unitId, bodies[range.unitId]);
        if (
          identityRef.current !== entryIdentity ||
          epoch.current !== atEpoch ||
          latest.current.getBodies()[range.unitId] !== bodies[range.unitId] ||
          extractProjectSpineDraftBody(
            latest.current.getSnapshot().project?.drafts?.[range.unitId] ?? '',
          ) !== bodies[range.unitId]
        )
          throw new Error('Writing changed before the Note could reconnect. Select it again.');
      }
      const anchors = await Promise.all(
        selection.map((range) =>
          buildLivingOutlineSourceAnchor(range.unitId, bodies[range.unitId]!, range.from, range.to),
        ),
      );
      if (identityRef.current !== entryIdentity || epoch.current !== atEpoch) return;
      const current = latest.current.getSnapshot();
      if (!current.project) return;
      const latestOutline = outlineRef.current!;
      const result = await bridge.replaceWritingState({
        operationId: `note-reconnect-${crypto.randomUUID()}`,
        projectId: current.project.projectId,
        projectPath: current.project.path,
        generation: current.generation,
        expectedRevision: latestOutline.document.revision,
        groups: latestOutline.document.writingGroups ?? [],
        noteAnchors: [{ itemId, anchor: anchors[0]!, anchors, reconnect: true }],
      });
      if (identityRef.current !== entryIdentity) return;
      if (!result.ok) {
        setNotice(result.error.message);
        return;
      }
      outlineRef.current = result.data;
      latest.current.onOutline(result.data);
      if (epoch.current === atEpoch) {
        noteOverrides.current.set(itemId, anchors);
        setUnresolvedNotes((current) => current.filter((id) => id !== itemId));
        setNotice('Note reconnected to the selected writing.');
      } else {
        noteOverrides.current.delete(itemId);
        setUnresolvedNotes((current) => [...new Set([...current, itemId])]);
        setNotice('Note reconnected to the saved version. Writing changed again; review its link.');
      }
      redraw((value) => value + 1);
    } catch (error) {
      if (identityRef.current === entryIdentity)
        setNotice(
          error instanceof Error
            ? error.message
            : 'The Note could not reconnect. Its content is retained.',
        );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const renameGroup = async (id: string, label: string): Promise<boolean> => {
    if (busyRef.current || !loaded || !groupRef.current.some((group) => group.id === id))
      return false;
    const name = label.trim();
    if (!name || name.length > 240) {
      setNotice('Give this unit a name of 1 to 240 characters.');
      return false;
    }
    if (groupRef.current.find((group) => group.id === id)?.label === name) return true;
    // Pin history restores membership. A later deliberate name belongs to the
    // surviving identity, including when an earlier membership is restored.
    history.current = history.current.map((items) =>
      items.map((group) =>
        group.id === id ? { ...group, label: name, customLabel: true } : group,
      ),
    );
    setCurrentGroups(
      groupRef.current.map((group) =>
        group.id === id ? { ...group, label: name, customLabel: true } : group,
      ),
    );
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    return save();
  };

  const moveGroup = async (id: string, beforeId: string | null): Promise<boolean> => {
    if (busyRef.current || !loaded || unresolvedRef.current.length) return false;
    const current = groupRef.current;
    if (id === beforeId || !current.some(group => group.id === id) ||
        (beforeId !== null && !current.some(group => group.id === beforeId))) return false;
    const moved = current.find(group => group.id === id)!;
    const next = current.filter(group => group.id !== id);
    const at = beforeId === null ? next.length : next.findIndex(group => group.id === beforeId);
    next.splice(at, 0, moved);
    if (next.every((group, index) => group.id === current[index]?.id)) return false;
    planHistory.current = [...planHistory.current.slice(-49), {
      before: current.map(group => group.id), after: next.map(group => group.id),
    }];
    setCurrentGroups(next);
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    return save();
  };

  const undoPlan = async (): Promise<boolean> => {
    if (busyRef.current || !loaded || unresolvedRef.current.length) return false;
    const previous = planHistory.current[planHistory.current.length - 1];
    if (!previous) return false;
    if (previous.after.length !== groupRef.current.length ||
        previous.after.some((id, index) => groupRef.current[index]?.id !== id)) {
      setNotice('The plan changed after that move. Its newer order has been kept.');
      return false;
    }
    planHistory.current = planHistory.current.slice(0, -1);
    const groups = new Map(groupRef.current.map(group => [group.id, group]));
    setCurrentGroups(previous.before.map(id => groups.get(id)!));
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    return save();
  };

  const unpin = async (id: string) => {
    if (busyRef.current) return;
    const membershipBefore = captureLinks();
    history.current = [...history.current.slice(-49), [...groupRef.current]];
    setCurrentGroups(groupRef.current.filter((group) => group.id !== id));
    unresolvedRef.current = unresolvedRef.current.filter((value) => value !== id);
    setUnresolved(unresolvedRef.current);
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    publishMembership(membershipBefore, 'Unpin');
    await save();
  };

  const captureLinks = (): WritingLinksSnapshot => {
    const groups = groupRef.current;
    const notes = (outlineRef.current?.document.items ?? []).map(item => ({
      id: item.id, anchors: noteOverrides.current.get(item.id) ?? noteSourceAnchors(item),
    }));
    return { groups, notes, key: writingLinksKey(groups, notes),
      pinHistory: history.current, planHistory: planHistory.current };
  };

  const canInstallLinks = (state: WritingLinksSnapshot, bodies = latest.current.getBodies()): boolean => {
    if (busyRef.current || !loaded || unresolvedRef.current.length || unresolvedNotes.length) return false;
    const valid = (anchor: NonNullable<LivingOutlineItemV1['sourceAnchor']>) =>
      typeof bodies[anchor.unitId] === 'string' && Number.isInteger(anchor.selectionStart) && Number.isInteger(anchor.selectionEnd) && anchor.selectionStart >= 0 &&
      anchor.selectionEnd >= anchor.selectionStart && anchor.selectionEnd <= bodies[anchor.unitId]!.length;
    if (!isWritingGroups(state.groups, valid) || state.notes.some(note => note.anchors.some(anchor => !valid(anchor)))) return false;
    const ids = (outlineRef.current?.document.items ?? []).map(item => item.id);
    return state.notes.length === ids.length && state.notes.every(note => ids.includes(note.id));
  };

  /** Used only with an explicit, source-guarded prose arrangement batch. */
  const installLinks = (state: WritingLinksSnapshot, from?: WritingLinksSnapshot): boolean => {
    if (!canInstallLinks(state)) return false;
    const current = new Map(groupRef.current.map(group => [group.id, group]));
    setCurrentGroups(state.groups.map(group => {
      const present = current.get(group.id);
      const expected = from?.groups.find(item => item.id === group.id);
      // Restore names changed by this operation; retain a later independent rename.
      const independentlyNamed = present && (!expected || present.label !== expected.label || Boolean(present.customLabel) !== Boolean(expected.customLabel));
      return independentlyNamed ? { ...group, label: present.label, customLabel: present.customLabel } : group;
    }));
    noteOverrides.current = new Map(state.notes.filter(note => note.anchors.length).map(note => [note.id, note.anchors]));
    relocatedNotes.current = new Set(state.notes.filter(note => note.anchors.length &&
      outlineRef.current?.document.items.find(item => item.id === note.id)?.manuscriptUnitId !== note.anchors[0]!.unitId).map(note => note.id));
    // Membership snapshots were taken in another writing arrangement. Ordinary
    // batch Undo restores the complete arrangement, not an obsolete Pin range.
    history.current = state.pinHistory ?? [];
    planHistory.current = [...(state.planHistory ?? [])];
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    setNotice('Writing moved with its linked units and Notes. Save writing to keep it.');
    return true;
  };

  const splitGroup = async (id: string, point: { unitId: string; offset: number }): Promise<boolean> => {
    if (busyRef.current || !loaded || unresolvedRef.current.length) return false;
    const group = groupRef.current.find(group => group.id === id);
    const index = group?.spans.findIndex(span => span.unitId === point.unitId &&
      point.offset >= span.selectionStart && point.offset <= span.selectionEnd) ?? -1;
    if (!group || index < 0 || !Number.isInteger(point.offset)) {
      setNotice('Place the writing cursor inside this unit before splitting it.');
      return false;
    }
    const span = group.spans[index]!;
    const body = latest.current.getBodies()[point.unitId];
    if (body === undefined || point.offset > body.length) return false;
    const beforeCode = body.charCodeAt(point.offset - 1), afterCode = body.charCodeAt(point.offset);
    if (beforeCode >= 0xd800 && beforeCode <= 0xdbff && afterCode >= 0xdc00 && afterCode <= 0xdfff) {
      setNotice('Place the cursor outside the middle of a Unicode character.');
      return false;
    }
    const left = [...group.spans.slice(0, index), ...(point.offset > span.selectionStart ? [{ ...span, selectionEnd: point.offset }] : [])];
    const right = [...(point.offset < span.selectionEnd ? [{ ...span, selectionStart: point.offset }] : []), ...group.spans.slice(index + 1)];
    if (!left.length || !right.length) {
      setNotice('Choose a cursor position inside the unit, away from its outer ends.');
      return false;
    }
    const membershipBefore = captureLinks();
    history.current = [...history.current.slice(-49), [...groupRef.current]];
    const second = { ...group, id: `writing-${crypto.randomUUID()}`, customLabel: false, spans: right };
    second.label = writingGroupLabel(second, latest.current.getBodies());
    setCurrentGroups(groupRef.current.flatMap(current => current.id === id ? [{ ...group, spans: left }, second] : [current]));
    epoch.current += 1;
    dirty.current = true;
    setUnsaved(true);
    publishMembership(membershipBefore, 'Split unit');
    return save();
  };

  const publishGapState = (snapshot: LivingOutlineSnapshotV1) => {
    outlineRef.current = snapshot;
    latest.current.onOutline(snapshot);
    setCurrentGroups(snapshot.document.writingGroups ?? []);
    noteOverrides.current.clear(); relocatedNotes.current.clear();
    history.current = []; planHistory.current = [];
    dirty.current = false; dirtySourceIds.current.clear(); setUnsaved(false); redraw(value => value + 1);
  };

  const createPlanningItem = async (label: string, body: string, kind: 'gap' | 'fragment', scope: 'passage' | 'whole-story' | 'unattached', range?: WritingRange) => {
    if (busyRef.current || !loaded || !label.trim() || (kind === 'gap' && !range) || !(await save())) return;
    const entry = identityRef.current, atEpoch = epoch.current;
    const current = latest.current.getSnapshot(), bridge = latest.current.bridge;
    if (!current.project || !bridge) return;
    busyRef.current = true; setBusy(true);
    try {
      const source = range ? latest.current.getBodies()[range.unitId] : undefined;
      const anchor = range && source !== undefined ? await buildLivingOutlineSourceAnchor(range.unitId, source, range.from, range.to) : null;
      if (entry !== identityRef.current || atEpoch !== epoch.current) return;
      const result = await bridge.createItem({ operationId: `planning-${crypto.randomUUID()}`, projectId: current.project.projectId,
        projectPath: current.project.path, generation: current.generation, expectedRevision: outlineRef.current!.document.revision,
        label, body, kind, state: kind === 'gap' ? 'planned' : 'authored', noteScope: scope, sourceWasSpan: Boolean(range && range.to > range.from),
        manuscriptUnitId: range?.unitId ?? null, sourceAnchor: anchor, ...(anchor ? { sourceAnchors: [anchor] } : {}) });
      if (entry !== identityRef.current) return;
      if (!result.ok) { setNotice(result.error.message); return; }
      const previousIds = new Set(outlineRef.current?.document.items.map(item => item.id));
      outlineRef.current = result.data; latest.current.onOutline(result.data);
      setNotice(kind === 'gap' ? 'Gap kept at the writing cursor.' : 'Note kept.');
      return result.data.document.items.find(item => !previousIds.has(item.id))?.id;
    } catch (error) { if (entry === identityRef.current) setNotice(error instanceof Error ? error.message : 'The planning item was not saved.'); }
    finally { if (entry === identityRef.current) { busyRef.current = false; setBusy(false); } }
  };

  const mutateNotebook = async (operation: 'edit' | 'delete' | 'restore', id?: string, label?: string, body?: string): Promise<boolean> => {
    const entry = identityRef.current;
    if (busyRef.current || outlineRef.current?.document.pendingGap || !(await save())) return false;
    const current = latest.current.getSnapshot(), outline = outlineRef.current, bridge = latest.current.bridge;
    if (!current.project || !outline || !bridge || entry !== identityRef.current) return false;
    const item = id ? outline.document.items.find(item => item.id === id && item.kind === 'fragment') : undefined;
    const deleted = deletedNotes.current[deletedNotes.current.length - 1];
    if (operation !== 'restore' && !item) { setNotice('This Note no longer exists in this project. Its open draft is retained.'); return false; }
    if (operation === 'restore' && (!deleted || !bridge.restoreItem)) return false;
    const beforeId = item ? outline.document.items[outline.document.items.indexOf(item) + 1]?.id ?? null : null;
    const binding = { projectId: current.project.projectId, projectPath: current.project.path, generation: current.generation,
      operationId: `notebook-${crypto.randomUUID()}`, expectedRevision: outline.document.revision };
    busyRef.current = true; setBusy(true);
    try {
      const result = operation === 'edit'
        ? await bridge.updateItem({ ...binding, itemId: item!.id, label: label!, body: body!, kind: item!.kind, state: item!.state })
        : operation === 'delete'
          ? await bridge.deleteItem({ ...binding, itemId: item!.id })
          : await bridge.restoreItem!({ ...binding, item: deleted!.item, beforeId: deleted!.beforeId });
      if (entry !== identityRef.current) return false;
      if (!result.ok) throw new Error(result.error.message);
      if (operation === 'delete') {
        deletedNotes.current = [...deletedNotes.current.slice(-49), { item: structuredClone(item!), beforeId }];
        noteOverrides.current.delete(item!.id);
        setUnresolvedNotes(ids => ids.filter(id => id !== item!.id));
      } else if (operation === 'restore') deletedNotes.current = deletedNotes.current.slice(0, -1);
      outlineRef.current = result.data; latest.current.onOutline(result.data);
      setNotice(operation === 'delete' ? 'Note deleted. Undo Note deletion restores only this Note during this session.' : operation === 'restore' ? 'Deleted Note restored. Changed or missing source links remain explicit.' : 'Notebook Note saved.');
      redraw(value => value + 1); return true;
    } catch (error) { if (entry === identityRef.current) setNotice(error instanceof Error ? error.message : 'The Notebook change was not saved.'); return false; }
    finally { if (entry === identityRef.current) { busyRef.current = false; setBusy(false); } }
  };

  const resumeGap = async (): Promise<boolean> => {
    const current = latest.current.getSnapshot(), bridge = latest.current.bridge, entry = identityRef.current;
    if (!current.project || !bridge?.finishGap || busyRef.current) return false;
    busyRef.current = true; setBusy(true);
    try {
      const binding = { projectId: current.project.projectId, projectPath: current.project.path, generation: current.generation, operationId: `gap-refresh-${crypto.randomUUID()}` };
      const fresh = await bridge.get(binding);
      if (!fresh.ok) throw new Error(fresh.error.message);
      if (entry !== identityRef.current) return false;
      outlineRef.current = fresh.data; latest.current.onOutline(fresh.data);
      const pending = fresh.data.document.pendingGap;
      if (!pending) { publishGapState(fresh.data); setNotice('The gap operation is already saved.'); return true; }
      const body = latest.current.getBodies()[pending.unitId];
      if (body === undefined || (await buildLivingOutlineSourceAnchor(pending.unitId, body, 0, 0)).sourceFingerprint !== pending.afterFingerprint)
        throw new Error('The gap save is pending. Recover its proposed writing first; the original gap and planning Note are retained. No insertion was repeated.');
      if (extractProjectSpineDraftBody(latest.current.getSnapshot().project?.drafts?.[pending.unitId] ?? '') !== body)
        await latest.current.saveSource(pending.unitId, body);
      if (entry !== identityRef.current || latest.current.getBodies()[pending.unitId] !== body) return false;
      const result = await bridge.finishGap({ ...binding, operationId: pending.id, expectedRevision: fresh.data.document.revision });
      if (entry !== identityRef.current) return false;
      if (!result.ok) throw new Error(result.error.message);
      publishGapState(result.data); setNotice('Gap writing and its planning Note saved.'); return true;
    } catch (error) { if (entry === identityRef.current) setNotice(error instanceof Error ? error.message : 'The pending gap is retained for recovery.'); return false; }
    finally { if (entry === identityRef.current) { busyRef.current = false; setBusy(false); } }
  };

  const performGap = async (pending: GapWritingOperationV1, proposedProse: string, apply: () => boolean): Promise<boolean> => {
    const entry = identityRef.current;
    const bridge = latest.current.bridge;
    if (!bridge?.prepareGap || !bridge.finishGap || !latest.current.captureSourceRecovery || busyRef.current || !(await save())) return false;
    const current = latest.current.getSnapshot();
    if (!current.project || entry !== identityRef.current) return false;
    const bodies = { ...latest.current.getBodies() };
    if ((await buildLivingOutlineSourceAnchor(pending.unitId, bodies[pending.unitId]!, 0, 0)).sourceFingerprint !== pending.beforeFingerprint) return false;
    busyRef.current = true; setBusy(true);
    try {
      if (!(await latest.current.captureSourceRecovery(pending.unitId, proposedProse))) throw new Error('Recovery protection could not retain the proposed gap writing. Nothing was applied.');
      if (entry !== identityRef.current || Object.entries(bodies).some(([id, body]) => latest.current.getBodies()[id] !== body)) throw new Error('Writing changed while the gap was prepared. Preview it again.');
      const binding = { projectId: current.project.projectId, projectPath: current.project.path, generation: current.generation, operationId: pending.id };
      const prepared = await bridge.prepareGap({ ...binding, expectedRevision: outlineRef.current!.document.revision, pending, proposedProse });
      if (entry !== identityRef.current) return false;
      if (!prepared.ok) throw new Error(prepared.error.message);
      outlineRef.current = prepared.data; latest.current.onOutline(prepared.data);
      if (Object.entries(bodies).some(([id, body]) => latest.current.getBodies()[id] !== body) || !apply()) throw new Error('The gap operation is retained. Writing changed before application.');
      await latest.current.saveSource(pending.unitId, proposedProse);
      if (entry !== identityRef.current || Object.entries(bodies).some(([id, body]) => latest.current.getBodies()[id] !== (id === pending.unitId ? proposedProse : body))) throw new Error('Writing changed during the gap save. The pending operation is retained.');
      const result = await bridge.finishGap({ ...binding, expectedRevision: prepared.data.document.revision });
      if (entry !== identityRef.current) return false;
      if (!result.ok) throw new Error(result.error.message);
      publishGapState(result.data); setNotice(pending.direction === 'undo' ? 'Gap fill undone; original planning Note and gap restored.' : 'Gap filled; its planning Note is attached to the new writing.');
      return true;
    } catch (error) { if (entry === identityRef.current) setNotice(error instanceof Error ? error.message : 'Gap save incomplete. Its pending record and recovery writing are retained.'); return false; }
    finally { if (entry === identityRef.current) { busyRef.current = false; setBusy(false); } }
  };

  return {
    enabled: Boolean(options.bridge?.replaceWritingState),
    ready: loaded && options.outline?.availability === 'ready' && options.outline.document.projectId === options.snapshot.project?.projectId && Boolean(options.snapshot.project),
    groups: options.outline?.document.projectId === options.snapshot.project?.projectId ? groups : [],
    unresolved,
    unresolvedNotes,
    busy,
    unsaved,
    notice,
    edited,
    pin,
    unpin,
    undoPin,
    canUndoPin: history.current.length > 0,
    subscribeMembership,
    save,
    keepNote,
    reconnectNote,
    renameGroup,
    moveGroup,
    splitGroup,
    captureLinks,
    canInstallLinks,
    installLinks,
    createPlanningItem,
    performGap,
    resumeGap,
    pendingGap: options.outline && options.outline.document.projectId === options.snapshot.project?.projectId ? options.outline.document.pendingGap ?? null : null,
    updateNotebookNote: (id: string, label: string, body: string) => mutateNotebook('edit', id, label, body),
    deleteNotebookNote: (id: string) => mutateNotebook('delete', id),
    undoNoteDeletion: () => mutateNotebook('restore'),
    canUndoNoteDeletion: deletedNotes.current.length > 0,
    notebookDrafts,
    manualConcernDrafts,
    undoPlan,
    canUndoPlan: planHistory.current.length > 0,
    notes: (options.outline && options.outline.document.projectId === options.snapshot.project?.projectId ? options.outline.document.items : []).map((item) => ({
      ...item,
      sourceMapped: noteOverrides.current.has(item.id),
      sourceAnchor: noteOverrides.current.get(item.id)?.[0] ?? item.sourceAnchor,
      sourceAnchors: noteOverrides.current.get(item.id) ?? item.sourceAnchors,
    })),
  };
}

export type WritingPageState = ReturnType<typeof useWritingPage>;
