import type { RevisionItem } from '../../shared/ipc/feedbackNotes';
import { buildProgram7SourceEnvelope } from '../../shared/program7SourceBinding';
import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DraftEditor from '../DraftEditor';
import type { DraftEditorSelectionEvidence } from '../DraftEditor';
import { useWritingPage } from '../useWritingPage';
import {
  WritingPageProvider,
  WritingPageToolbar,
  WritingPageOutline,
  WritingSourcePreview,
  getWritingMarks,
  useWritingContext,
} from '../components/WritingPage';
import type {
  Stage19WritingSpineViewActions,
  Stage19WritingSpineViewModel,
} from '../Stage19WritingSpineView';
import type { LivingOutlineBridge, LivingOutlineSnapshotV1 } from '../../shared/ipc/livingOutline';
import type { ProjectSpineSessionSnapshot } from '../../shared/ipc/projectSpine';
import { planWritingMove, relocateWritingRange, type WritingEdit } from '../../shared/writingRanges';

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.getSelection()?.removeAllRanges();
});

function Editor({
  body,
  changed,
  selected,
}: {
  body: string;
  changed: (body: string, edits?: readonly WritingEdit[], history?: 'undo' | 'redo') => void;
  selected: (value: DraftEditorSelectionEvidence) => void;
}) {
  const context = useWritingContext()!;
  return (
    <section data-manuscript-unit-id="a">
      <DraftEditor
        value={body}
        writingTools
        historyChange={context.editorHistoryChanges.a}
        toolbarVisible={false}
        onCommands={context.registerCommands}
        onChange={(body, edits, kind, change) => { const linksBefore = context.model.writingPage!.captureLinks(); changed(body, edits, kind); context.editorEdited(kind, change ? { unitId: 'a', before: change.before, after: body, edits: edits ?? [], group: change.group, linksBefore } : undefined); }}
        onSelectionChange={selected}
        writingMarks={getWritingMarks(context, 'a')}
        onWritingNote={(id) => context.openNote(id, [])}
        onWritingMove={offset => context.moveTo({ unitId: 'a', offset })}
        selectionRestore={context.returnRequest?.unitId === 'a' ? context.returnRequest : null}
        onSelectionRestoreResult={(id) => context.acknowledgeReturn(id)}
      />
    </section>
  );
}

function Harness({ initialBodies = { a: 'moon glass winter shirt', b: 'A second shirt. Forest.' }, gapFault, projectId = 'test', initialConcerns = [], compactOutline = false }: { compactOutline?: boolean; initialBodies?: Record<string, string>; gapFault?: 'recovery' | 'source' | 'metadata'; projectId?: string; initialConcerns?: readonly RevisionItem[] }) {
  const gapFaultUsed = useRef(false);
  const [bodies, setBodies] = useState<Record<string, string>>(initialBodies);
  const [outline, setOutline] = useState<LivingOutlineSnapshotV1>({
    availability: 'ready',
    message: null,
    document: {
      schemaVersion: 'BlackSkiesLivingOutline v1',
      projectId,
      revision: 0,
      items: [],
    },
  });
  const [selection, setSelection] = useState<DraftEditorSelectionEvidence | null>(null);
  const snapshot = {
    saveState: { status: 'saved' },
    generation: 1,
    project: {
      projectId,
      path: 'C:/disposable',
      units: [{ id: 'a' }, { id: 'b' }],
      drafts: Object.fromEntries(Object.entries(bodies).map(([id, body]) => [id, body])),
      unitMetrics: {},
    },
  } as unknown as ProjectSpineSessionSnapshot;
  const latest = useRef({ bodies, snapshot, outline });
  latest.current = { bodies, snapshot, outline };
  const bridge = useRef({
    deleteItem: vi.fn(async (request: Parameters<LivingOutlineBridge['deleteItem']>[0]) => ({ ok: true as const, data: {
      ...latest.current.outline, document: { ...latest.current.outline.document, revision: latest.current.outline.document.revision + 1,
        items: latest.current.outline.document.items.filter(item => item.id !== request.itemId) } } })),
    restoreItem: vi.fn(async (request: Parameters<NonNullable<LivingOutlineBridge['restoreItem']>>[0]) => {
      const items = [...latest.current.outline.document.items];
      const at = request.beforeId ? items.findIndex(item => item.id === request.beforeId) : -1;
      items.splice(at < 0 ? items.length : at, 0, request.item);
      return { ok: true as const, data: { ...latest.current.outline, document: { ...latest.current.outline.document,
        revision: latest.current.outline.document.revision + 1, items } } };
    }),
    get: vi.fn(async () => ({ ok: true as const, data: latest.current.outline })),
    prepareGap: vi.fn(async (request: Parameters<NonNullable<LivingOutlineBridge['prepareGap']>>[0]) => ({ ok: true as const,
      data: { ...latest.current.outline, document: { ...latest.current.outline.document,
        revision: latest.current.outline.document.revision + 1, pendingGap: request.pending } } })),
    finishGap: vi.fn(async () => {
      if (gapFault === 'metadata' && !gapFaultUsed.current) { gapFaultUsed.current = true; return { ok: false as const, error: { code: 'LIVING_OUTLINE_WRITE_FAILED' as const, message: 'Injected final metadata failure; pending gap retained.' } }; }
      const outline = latest.current.outline, pending = outline.document.pendingGap!;
      return { ok: true as const, data: { ...outline, document: { ...outline.document, revision: outline.document.revision + 1,
        pendingGap: null, writingGroups: pending.groups, items: outline.document.items.map(item => {
          const update = pending.noteAnchors.find(note => note.itemId === item.id);
          const next = update ? { ...item, manuscriptUnitId: update.anchor.unitId, sourceAnchor: update.anchor, sourceAnchors: update.anchors } : item;
          return item.id === pending.gapId ? { ...next, kind: pending.target.kind, state: pending.target.state,
            sourceAnchor: pending.target.anchor, sourceAnchors: [pending.target.anchor] } : next;
        }) } } };
    }),
    replaceWritingState: vi.fn(
      async (request: Parameters<NonNullable<LivingOutlineBridge['replaceWritingState']>>[0]) => ({
        ok: true as const,
        data: {
          ...latest.current.outline,
          document: {
            ...latest.current.outline.document,
            revision: latest.current.outline.document.revision + 1,
            writingGroups: request.groups,
            items: latest.current.outline.document.items.map((item) => {
              const note = request.noteAnchors.find((entry) => entry.itemId === item.id);
              return note
                ? {
                    ...item,
                    sourceAnchor: note.anchor,
                    sourceAnchors: note.anchors,
                    manuscriptUnitId: note.reconnect ? note.anchor.unitId : item.manuscriptUnitId,
                  }
                : item;
            }),
          },
        },
      }),
    ),
    createItem: vi.fn(async (request: Parameters<LivingOutlineBridge['createItem']>[0]) => ({
      ok: true as const,
      data: {
        ...latest.current.outline,
        document: {
          ...latest.current.outline.document,
          revision: latest.current.outline.document.revision + 1,
          items: [
            ...latest.current.outline.document.items,
            {
              ...request,
              id: `note-${crypto.randomUUID()}`,
              createdAt: '',
              updatedAt: '',
            },
          ],
        },
      },
    })),
    updateItem: vi.fn(async (request: Parameters<LivingOutlineBridge['updateItem']>[0]) => ({
      ok: true as const,
      data: {
        ...latest.current.outline,
        document: {
          ...latest.current.outline.document,
          revision: latest.current.outline.document.revision + 1,
          items: latest.current.outline.document.items.map((item) =>
            item.id === request.itemId ? { ...item, body: request.body, label: request.label } : item,
          ),
        },
      },
    })),
  } as unknown as LivingOutlineBridge).current;
  const page = useWritingPage({
    snapshot,
    outline,
    bridge,
    getBodies: () => latest.current.bodies,
    getSnapshot: () => latest.current.snapshot,
    saveSource: async () => { if (gapFault === 'source' && !gapFaultUsed.current) { gapFaultUsed.current = true; throw new Error('Injected prose persistence failure; recovery retained.'); } },
    captureSourceRecovery: async () => gapFault !== 'recovery',
    onOutline: setOutline,
    reportDirty: () => {},
  });
  const changed = (
    id: string,
    body: string,
    edits?: readonly WritingEdit[],
    history?: 'undo' | 'redo',
  ) => {
    page.edited(id, latest.current.bodies[id]!, body, edits, history);
    latest.current.bodies = { ...latest.current.bodies, [id]: body };
    setBodies((current) => ({ ...current, [id]: body }));
  };
  const model = {
    snapshot,
    buffers: bodies,
    activeUnit: { id: 'a' },
    aiSelection: selection,
    writingPage: page,
    dirtyUnitIds: new Set<string>(),
    program7RevisionItems: { activeItems: initialConcerns },
    recoveryBlocksEditing: false,
    openWritingRail: 'left',
    lockedWritingRails: [],
  } as unknown as Stage19WritingSpineViewModel;
  const actions = {
    saveUnit: () => page.save(),
    changeBuffer: changed,
    selectUnit: async () => true,
    rememberWork: () => {},
  } as unknown as Stage19WritingSpineViewActions;
  return (
    <WritingPageProvider model={model} actions={actions}>
      <div data-stage19-role="writing">
        <WritingPageToolbar />
        <WritingPageOutline compact={compactOutline} />
        <div data-manuscript-scroll-owner="true">
          <Editor
            body={bodies.a!}
            changed={(body, edits, history) => changed('a', body, edits, history)}
            selected={setSelection}
          />
          <section data-manuscript-unit-id="b">
            <WritingSourcePreview unitId="b" text={bodies.b!} />
          </section>
        </div>
        <output aria-label="Bodies">{JSON.stringify(bodies)}</output>
        <output aria-label="Stored metadata">{JSON.stringify(outline.document)}</output>
      </div>
    </WritingPageProvider>
  );
}

async function setup(initialBodies?: Record<string, string>, compactOutline = false, initialConcerns: readonly RevisionItem[] = []) {
  render(<Harness initialBodies={initialBodies} compactOutline={compactOutline} initialConcerns={initialConcerns} />);
  const input = await screen.findByRole('textbox', { name: 'Draft editor' });
  const editor = EditorView.findFromDOM(input)!;
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled());
  return {
    input,
    editor,
    select: async (from: number, to: number) => {
      act(() => editor.dispatch({ selection: { anchor: from, head: to } }));
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });
    },
    text: () => editor.state.doc.toString(),
  };
}

const storedWriting = () => JSON.parse(screen.getByLabelText('Stored metadata').textContent!);
async function pinEdgeRange(e: Awaited<ReturnType<typeof setup>>, from: number, to: number) {
  await e.select(from, to);
  fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled());
}
async function renameEdgeGroup(label: string, name: string) {
  fireEvent.click(screen.getByRole('button', { name: `Rename ${label}` }));
  fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Save unit name' }));
  await waitFor(() => expect(storedWriting().writingGroups.some((group: { label: string }) => group.label === name)).toBe(true));
}

describe('Outstanding writer edge cases after completed Batch A', () => {
  it.each(['pointer', 'keyboard'] as const)('does not consume the next unrelated %s action after a preview selection without a click', async method => {
    await setup();
    const source = document.querySelector('[data-writing-source]')!;
    const range = document.createRange(); range.selectNodeContents(source);
    window.getSelection()!.removeAllRanges(); window.getSelection()!.addRange(range);
    fireEvent.pointerUp(source);
    const action = document.createElement('button'), invoked = vi.fn();
    action.textContent = 'Another author action'; action.addEventListener('click', invoked); document.body.append(action);
    try {
      if (method === 'pointer') fireEvent.pointerDown(action);
      else fireEvent.keyDown(action, { key: 'Enter' });
      fireEvent.click(action);
      expect(invoked).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText('Bodies')).toHaveTextContent('moon glass winter shirt');
    } finally { action.remove(); }
  });
  it('edge: dirty concern evidence cannot mask independent writing highlights', () => {
    const model = {
      buffers: { a: 'moon glass' },
      snapshot: { project: { unitMetrics: { a: { bodySha256: 'saved-source' } } } },
      writingPage: { ready: true, groups: [], unresolved: [], notes: [], unresolvedNotes: [] },
      dirtyUnitIds: new Set(['a']),
      program7RevisionItems: { activeItems: [{ unitId: 'a', sourceBodyFingerprint: 'saved-source', anchor: { selectionStart: 0, selectionEnd: 4 } }] },
    };
    const context = { model, highlights: { pinned: true, unpinned: true, concerns: true }, armed: null } as unknown as NonNullable<Parameters<typeof getWritingMarks>[0]>;
    expect(getWritingMarks(context, 'a')).toEqual([{ from: 0, to: 10, kind: 'unpinned' }]);
    model.dirtyUnitIds.clear();
    expect(getWritingMarks(context, 'a').map(mark => mark.kind)).toEqual(['unpinned', 'concern']);
    context.highlights.concerns = false;
    expect(getWritingMarks(context, 'a')).toEqual([{ from: 0, to: 10, kind: 'unpinned' }]);
  });

  it('edge: stale and out-of-range concern sources never color current writing', () => {
    const context = {
      model: {
        buffers: { a: 'moon glass' },
        snapshot: { project: { unitMetrics: { a: { bodySha256: 'current-source' } } } },
        writingPage: { ready: true, groups: [], unresolved: [], notes: [], unresolvedNotes: [] },
        dirtyUnitIds: new Set(),
        program7RevisionItems: { activeItems: [
          { unitId: 'a', sourceBodyFingerprint: 'old-source', anchor: { selectionStart: 0, selectionEnd: 4 } },
          { unitId: 'a', sourceBodyFingerprint: 'current-source', anchor: { selectionStart: 0, selectionEnd: 99 } },
        ] },
      }, highlights: { pinned: false, unpinned: true, concerns: true }, armed: null,
    } as unknown as NonNullable<Parameters<typeof getWritingMarks>[0]>;
    expect(getWritingMarks(context, 'a')).toEqual([{ from: 0, to: 10, kind: 'unpinned' }]);
  });

  it('edge: Undo Pin preserves a later independent name on a surviving unit', async () => {
    const e = await setup();
    await pinEdgeRange(e, 0, 4);
    const firstId = storedWriting().writingGroups[0].id;
    await pinEdgeRange(e, 5, 10);
    await renameEdgeGroup('moon', 'Opening image');
    fireEvent.click(screen.getByRole('button', { name: 'Undo Pin' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(storedWriting().writingGroups[0]).toMatchObject({ id: firstId, label: 'Opening image', customLabel: true });
    expect(e.text()).toBe('moon glass winter shirt');
  });

  it('edge: Undo Unpin preserves another unit name and rebased Unicode source positions', async () => {
    const e = await setup();
    await pinEdgeRange(e, 0, 4);
    await pinEdgeRange(e, 11, 17);
    const ids = storedWriting().writingGroups.map((group: { id: string }) => group.id);
    const first = document.querySelector(`[data-writing-group-id="${ids[0]}"]`)!;
    fireEvent.click(within(first as HTMLElement).getByRole('button', { name: 'Unpin' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    await renameEdgeGroup('winter', 'Ending image');
    const prefix = '🌧️ ';
    act(() => e.editor.dispatch({ changes: { from: 0, insert: prefix } }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo Pin' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(2));
    expect(storedWriting().writingGroups.find((group: { id: string }) => group.id === ids[1]))
      .toMatchObject({ label: 'Ending image', customLabel: true });
    expect(storedWriting().writingGroups[0].spans[0]).toMatchObject({ selectionEnd: 4 + prefix.length });
    expect(e.text()).toBe(prefix + 'moon glass winter shirt');
  });

  it('edge: identical Note labels retain separate identities when the middle Note is edited', async () => {
    const e = await setup();
    await pinEdgeRange(e, 0, 4);
    for (let index = 0; index < 3; index += 1) {
      await e.select(0, 4);
      fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
      fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Shared idea' } });
      await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
      await screen.findByRole('heading', { name: 'Edit Note' });
      fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    }
    const ids = storedWriting().items.map((item: { id: string }) => item.id);
    fireEvent.click(screen.getByText('3 Notes', { selector: 'summary' }));
    const row = document.querySelector('[data-writing-group-id]') as HTMLElement;
    fireEvent.click(within(row).getAllByRole('button', { name: 'Shared idea' })[1]!);
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Only the middle thought' } });
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await waitFor(() => expect(storedWriting().items[1].body).toBe('Only the middle thought'));
    expect(storedWriting().items.map((item: { id: string }) => item.id)).toEqual(ids);
    expect(storedWriting().items.map((item: { body: string }) => item.body)).toEqual(['Shared idea', 'Only the middle thought', 'Shared idea']);
    expect(e.text()).toBe('moon glass winter shirt');
  });

  it('edge: a Note beside surrogate pairs retains exact identity through insertion and source Undo', async () => {
    const original = '🌲 moon 🌙 winter';
    const e = await setup({ a: original, b: 'Ending' });
    const from = original.indexOf('moon');
    await e.select(from, from + 4);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Keep the moon' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    const id = storedWriting().items[0].id;
    const prefix = '🌧️ ';
    act(() => e.editor.dispatch({ changes: { from: 0, insert: prefix } }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().items[0].sourceAnchor.selectionStart).toBe(from + prefix.length));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().items[0].sourceAnchor.selectionStart).toBe(from));
    expect(storedWriting().items[0]).toMatchObject({ id, body: 'Keep the moon' });
    expect(storedWriting().items).toHaveLength(1);
    expect(e.text()).toBe(original);
  });

  it('edge: direct move Undo keeps a later independent unit rename and its exact source', async () => {
    const e = await setup();
    await pinEdgeRange(e, 0, 4); await pinEdgeRange(e, 11, 17);
    const before = storedWriting().writingGroups;
    directEdgeMove(before[1].id, 'winter', before[0].id);
    expect(e.text()).toBe('winter\n\nmoon glass  shirt');
    await renameEdgeGroup('winter', 'Ending image');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups.find((group: { id: string }) => group.id === before[1].id))
      .toMatchObject({ label: 'Ending image', customLabel: true, spans: before[1].spans }));
  });

  it('edge: cancel and Escape create no history entry and a direct move creates only one', async () => {
    const e = await setup();
    await pinEdgeRange(e, 0, 4); await pinEdgeRange(e, 11, 17);
    const before = storedWriting().writingGroups;
    beginEdgeMove(before[1].id);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Move writing' })).toBeNull();
    expect(e.text()).toBe('moon glass winter shirt');
    directEdgeMove(before[1].id, 'winter', before[0].id);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(storedWriting().writingGroups[0].id).toBe(before[0].id);
  });

  it('edge: comparison preserves literal markup, Unicode and paragraph whitespace without rendering HTML', async () => {
    const first = '🌲 <b>moon</b>\n\n  glass';
    const source = first + '\n\nwinter';
    const e = await setup({ a: source, b: 'Ending' });
    await pinEdgeRange(e, 0, first.length);
    await pinEdgeRange(e, source.indexOf('winter'), source.length);
    for (const row of document.querySelectorAll('[data-writing-group-id]')) {
      fireEvent.click(within(row as HTMLElement).getByRole('checkbox'));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Compare selected · 2' }));
    const comparison = screen.getByRole('region', { name: 'Selected passage comparison' });
    expect([...comparison.querySelectorAll('.stage19-outline-comparison__prose')].map(node => node.textContent)).toEqual([first, 'winter']);
    expect(comparison.querySelector('b')).toBeNull();
    expect(e.text()).toBe(source);
  });

  it('edge: removing both compared passages withholds all stale source excerpts', async () => {
    const e = await setup();
    await pinEdgeRange(e, 0, 4);
    await pinEdgeRange(e, 11, 17);
    for (const row of document.querySelectorAll('[data-writing-group-id]')) {
      fireEvent.click(within(row as HTMLElement).getByRole('checkbox'));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Compare selected · 2' }));
    act(() => e.editor.dispatch({ changes: { from: 0, to: e.text().length, insert: '' } }));
    const comparison = screen.getByRole('region', { name: 'Selected passage comparison' });
    expect([...comparison.querySelectorAll('.stage19-outline-comparison__prose')].every(node => !node.textContent)).toBe(true);
    expect(comparison).toHaveTextContent(/changed|removed|unavailable/i);
    expect(e.text()).toBe('');
  });
});

async function pinInactiveSection() {
  const source = document.querySelector('[data-writing-source]')!;
  const range = document.createRange();
  range.selectNodeContents(source);
  window.getSelection()!.removeAllRanges(); window.getSelection()!.addRange(range);
  fireEvent.pointerUp(source);
  fireEvent.click(source);
  fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled());
  window.getSelection()?.removeAllRanges();
}
function organizationRow(id: string) {
  const row = document.querySelector(`[data-writing-group-id="${id}"]`) as HTMLElement;
  const summary = within(row).getByText('Organize this writing', { selector: 'summary' });
  if (!(summary.parentElement as HTMLDetailsElement).open) fireEvent.click(summary);
  return within(row);
}
function beginEdgeMove(id: string) {
  fireEvent.click(organizationRow(id).getByRole('button', { name: 'Move' }));
}
function finishEdgeMove(targetId: string) {
  const row = document.querySelector(`[data-writing-group-id="${targetId}"]`) as HTMLElement;
  fireEvent.click(within(row).getByRole('button', { name: /^Insert before/ }));
}
function directEdgeMove(id: string, _label: string, targetId: string) {
  beginEdgeMove(id); finishEdgeMove(targetId);
}
function localUnitMenu(input: HTMLElement) {
  fireEvent.keyDown(input, { key: 'F10', shiftKey: true });
  return within(screen.getByRole('dialog', { name: 'Writing passage actions' }));
}

async function openNotebook() {
  const summary = screen.getByText(/^Notebook ·/u, { selector: 'summary' });
  if (!(summary.parentElement as HTMLDetailsElement).open) fireEvent.click(summary);
  await waitFor(() => expect(screen.getByRole('button', { name: 'New Notebook Note' })).toBeEnabled());
  return within(screen.getByRole('region', { name: 'All-story Notebook' }));
}
async function addNotebookNote(scope: 'whole-story' | 'unattached', name: string, body: string) {
  fireEvent.click(screen.getByRole('button', { name: 'New Notebook Note' }));
  fireEvent.change(screen.getByLabelText('Notebook Note name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Notebook Note text'), { target: { value: body } });
  fireEvent.change(screen.getByLabelText('New Note scope'), { target: { value: scope } });
  fireEvent.click(screen.getByRole('button', { name: 'Keep Notebook Note' }));
  await waitFor(() => expect(screen.queryByRole('group', { name: 'Notebook Note editor' })).not.toBeInTheDocument());
  return storedWriting().items.find((item: { body: string }) => item.body === body).id as string;
}
const openNotebookNote = (id: string) => fireEvent.click(within(document.querySelector(`[data-notebook-note-id="${id}"]`) as HTMLElement).getByRole('button'));

describe('Catalog verified concern projection', () => {
  it('shows independent shared-range concerns without trusting framed-file metrics and removes only a resolved or protected concern', async () => {
    const source = await buildProgram7SourceEnvelope({ projectId: 'test', generation: 1, unitId: 'a', sourceText: 'moon glass winter shirt', selectionStart: 0, selectionEnd: 4 });
    const concern: RevisionItem = { id: 'concern-a', projectId: 'test', unitId: 'a', body: 'First concern', createdAt: '2026-10-26T00:00:00.000Z',
      kind: 'revision_item', advisory: false, lifecycle: 'active', anchor: source.anchor, sourceBodyFingerprint: source.bodySha256, sourceClass: 'included' };
    const second = { ...concern, id: 'concern-b', body: 'Second concern', lens: 'timeline' };
    const view = render(<Harness initialConcerns={[concern, second]} />);
    await waitFor(() => expect(document.querySelectorAll('[data-outline-concern-id]')).toHaveLength(2));
    expect(document.querySelector('[data-outline-concern-id="concern-a"]')).toHaveTextContent('!');
    const timing = document.querySelector('[data-outline-concern-id="concern-b"]')!;
    expect(timing).toHaveTextContent('◷');
    expect(timing).toHaveAttribute('title', 'Timing concern: Second concern\nRaised by: Story Knowledge');
    fireEvent.click(timing);
    expect(screen.getByText('Second concern', { exact: true })).toBeVisible();
    expect(screen.getByText('Raised by: Story Knowledge')).toBeVisible();
    const close = screen.getByRole('button', { name: 'Close concern' });
    expect(close).toHaveTextContent('×');
    fireEvent.click(close);
    expect(screen.queryByText('Second concern', { exact: true })).toBeNull();
    expect(document.querySelectorAll('[data-outline-concern-id]')).toHaveLength(2);
    fireEvent.click(timing);
    expect(screen.getByText('Second concern', { exact: true })).toBeVisible();

    view.rerender(<Harness initialConcerns={[second]} />);
    await waitFor(() => expect(document.querySelectorAll('[data-outline-concern-id]')).toHaveLength(1));
    expect(document.querySelector('[data-outline-concern-id]')).toHaveAttribute('data-outline-concern-id', second.id);
    view.rerender(<Harness initialConcerns={[{ ...second, protection: { protected: true }, sourceClass: 'protected' }]} />);
    await waitFor(() => expect(document.querySelectorAll('[data-outline-concern-id]')).toHaveLength(0));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!).a).toBe('moon glass winter shirt');
  });
});

describe('Catalog all-story Notebook', () => {
  it('separates whole-story/unattached duplicate labels, searches bodies and restores only a deleted identity after intervening creation', async () => {
    const e = await setup();
    const notebook = await openNotebook();
    const first = await addNotebookNote('whole-story', 'Same title', 'First thought');
    const second = await addNotebookNote('unattached', 'Same title', 'Second thought');
    expect(notebook.getByText('Whole-story Note')).toBeVisible();
    expect(notebook.getByText('Deliberately unattached Note')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Search Notes'), { target: { value: 'second thought' } });
    expect(notebook.getAllByRole('button', { name: 'Same title' })).toHaveLength(1);
    openNotebookNote(second);
    fireEvent.change(screen.getByLabelText('Notebook Note text'), { target: { value: 'Edited second thought' } });
    fireEvent.click(screen.getByRole('button', { name: 'Keep Notebook Note' }));
    await waitFor(() => expect(storedWriting().items.find((item: { id: string }) => item.id === second).body).toBe('Edited second thought'));
    expect(storedWriting().items.find((item: { id: string }) => item.id === first).body).toBe('First thought');
    fireEvent.change(screen.getByLabelText('Search Notes'), { target: { value: '' } });
    openNotebookNote(second);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Notebook Note' }));
    await waitFor(() => expect(storedWriting().items).toHaveLength(1));
    const third = await addNotebookNote('whole-story', 'Later Note', 'Intervening thought');
    fireEvent.click(screen.getByRole('button', { name: 'Undo Note deletion' }));
    await waitFor(() => expect(storedWriting().items).toHaveLength(3));
    expect(new Set(storedWriting().items.map((item: { id: string }) => item.id))).toEqual(new Set([first, second, third]));
    expect(storedWriting().items.find((item: { id: string }) => item.id === second)).toMatchObject({ noteScope: 'unattached', body: 'Edited second thought' });
    expect(e.text()).toBe('moon glass winter shirt');
  });

  it('protects a dirty draft from deletion and switching and permits explicit discard', async () => {
    await setup(); await openNotebook();
    const first = await addNotebookNote('whole-story', 'First', 'Keep original');
    const second = await addNotebookNote('unattached', 'Second', 'Keep second');
    openNotebookNote(first);
    fireEvent.change(screen.getByLabelText('Notebook Note text'), { target: { value: 'Unsent edits' } });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Notebook Note' }));
    expect(screen.getByText(/unsaved edits before deleting/)).toBeVisible();
    openNotebookNote(second);
    expect(screen.getByText(/before opening another Note/)).toBeVisible();
    expect(screen.getByLabelText('Notebook Note text')).toHaveValue('Unsent edits');
    expect(storedWriting().items).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Discard Notebook draft' }));
    openNotebookNote(first);
    expect(screen.getByLabelText('Notebook Note text')).toHaveValue('Keep original');
  });

  it('retains a removed passage identity and withholds its excerpt instead of reclassifying it as a whole-story Note', async () => {
    const e = await setup({ a: 'forest moon', b: 'river' });
    await e.select(0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Forest reminder' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    const id = storedWriting().items[0].id;
    await openNotebook(); openNotebookNote(id);
    expect(screen.getByRole('button', { name: 'Read Note source 1' })).toBeEnabled();
    act(() => e.editor.dispatch({ changes: { from: 0, to: 6, insert: '' } }));
    expect(screen.getAllByText('Original source writing removed')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Read Note source 1' })).toBeDisabled();
    expect(screen.getByText(/Source excerpt withheld/)).toBeVisible();
    expect(storedWriting().items[0]).toMatchObject({ id, noteScope: 'passage', sourceWasSpan: true });
  });

  it('retains unsaved Notebook drafts by project without displaying the previous project draft', async () => {
    const view = render(<Harness projectId="project-a" />);
    await openNotebook();
    fireEvent.click(screen.getByRole('button', { name: 'New Notebook Note' }));
    fireEvent.change(screen.getByLabelText('Notebook Note text'), { target: { value: 'Only project A' } });
    view.rerender(<Harness projectId="project-b" />);
    await waitFor(() => expect(screen.queryByLabelText('Notebook Note text')).not.toBeInTheDocument());
    expect(screen.queryByDisplayValue('Only project A')).not.toBeInTheDocument();
    view.rerender(<Harness projectId="project-a" />);
    await waitFor(() => expect(screen.getByLabelText('Notebook Note text')).toHaveValue('Only project A'));
  });
});

describe('Catalog gap lifecycle', () => {
  for (const fault of ['recovery', 'source', 'metadata'] as const) {
    it(`preserves original gap and writing recovery across an injected ${fault} failure`, async () => {
      render(<Harness initialBodies={{ a: 'forest', b: 'river' }} gapFault={fault} />);
      await screen.findByRole('textbox', { name: 'Draft editor' });
      await waitFor(() => expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled());
      fireEvent.click(screen.getByText('Gaps · 0', { selector: 'summary' }));
      fireEvent.change(screen.getByLabelText('Gap name'), { target: { value: 'Bridge plan' } });
      fireEvent.change(screen.getByLabelText('Gap planning information'), { target: { value: 'Retain this intention' } });
      fireEvent.click(screen.getByRole('button', { name: 'Keep gap at writing cursor' }));
      await screen.findByRole('button', { name: 'Preview gap fill' });
      const id = storedWriting().items[0].id;
      fireEvent.change(screen.getByLabelText('Write missing passage'), { target: { value: 'bridge' } });
      fireEvent.click(screen.getByRole('button', { name: 'Preview gap fill' }));
      await screen.findByRole('region', { name: 'Gap fill preview' });
      fireEvent.click(screen.getByRole('button', { name: 'Fill this gap' }));
      await screen.findByText(fault === 'recovery' ? /Recovery protection could not retain/ : fault === 'source' ? /Injected prose persistence failure/ : /Injected final metadata failure/);
      expect(storedWriting().items[0]).toMatchObject({ id, kind: 'gap', body: 'Retain this intention' });
      if (fault === 'recovery') {
        expect(storedWriting().pendingGap).toBeUndefined();
        expect(JSON.parse(screen.getByLabelText('Bodies').textContent!).a).toBe('forest');
      } else {
        expect(storedWriting().pendingGap.gapId).toBe(id);
        expect(JSON.parse(screen.getByLabelText('Bodies').textContent!).a).toBe('bridge\n\nforest');
        fireEvent.click(screen.getByRole('button', { name: 'Finish gap save' }));
        await waitFor(() => expect(storedWriting().pendingGap).toBeNull());
        expect(storedWriting().items[0]).toMatchObject({ id, kind: 'fragment', body: 'Retain this intention' });
        expect(JSON.parse(screen.getByLabelText('Bodies').textContent!).a).toBe('bridge\n\nforest');
        expect(storedWriting().writingGroups).toHaveLength(1);
      }
    });
  }

  it('previews/cancels, fills and preserves planning identity through Save and guarded source Undo/Redo', async () => {
    const e = await setup({ a: 'forest moon', b: 'river' });
    await e.select(7, 7);
    fireEvent.click(screen.getByText('Gaps · 0', { selector: 'summary' }));
    fireEvent.change(screen.getByLabelText('Gap name'), { target: { value: 'A bridge' } });
    fireEvent.change(screen.getByLabelText('Gap planning information'), { target: { value: 'Keep this original plan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Keep gap at writing cursor' }));
    await screen.findByRole('button', { name: 'Preview gap fill' });
    const id = storedWriting().items[0].id;
    fireEvent.change(screen.getByLabelText('Write missing passage'), { target: { value: 'A new bridge.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview gap fill' }));
    await screen.findByRole('region', { name: 'Gap fill preview' });
    expect(e.text()).toBe('forest moon');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel gap fill' }));
    expect(e.text()).toBe('forest moon');
    fireEvent.click(screen.getByRole('button', { name: 'Preview gap fill' }));
    await screen.findByRole('region', { name: 'Gap fill preview' });
    fireEvent.click(screen.getByRole('button', { name: 'Fill this gap' }));
    await waitFor(() => expect(storedWriting().items[0]).toMatchObject({ id, kind: 'fragment', state: 'authored', body: 'Keep this original plan' }));
    expect(e.text()).toBe('forest \n\nA new bridge.\n\nmoon');
    expect(storedWriting().writingGroups).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Undo gap fill' }));
    await waitFor(() => expect(storedWriting().items[0]).toMatchObject({ id, kind: 'gap', body: 'Keep this original plan' }));
    expect(e.text()).toBe('forest moon');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await waitFor(() => expect(storedWriting().items[0].kind).toBe('fragment'));
    expect(e.text()).toBe('forest \n\nA new bridge.\n\nmoon');
  });

  it('refuses empty and stale previews while preserving the positioned gap and exact writing', async () => {
    const e = await setup({ a: 'forest moon', b: 'river' });
    await e.select(0, 0);
    fireEvent.click(screen.getByText('Gaps · 0', { selector: 'summary' }));
    fireEvent.change(screen.getByLabelText('Gap name'), { target: { value: 'Beginning' } });
    fireEvent.click(screen.getByRole('button', { name: 'Keep gap at writing cursor' }));
    await screen.findByRole('button', { name: 'Preview gap fill' });
    expect(screen.getByRole('button', { name: 'Preview gap fill' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Write missing passage'), { target: { value: 'New opening' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview gap fill' }));
    await screen.findByRole('region', { name: 'Gap fill preview' });
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' changed' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Fill this gap' }));
    await screen.findByText(/Writing changed. Preview the gap again/);
    expect(e.text()).toBe('forest moon changed');
    expect(storedWriting().items[0].kind).toBe('gap');
  });
});

describe('Writing organization milestone', () => {
  it('cancels source-addressed moves, then directly saves cross-section moves and Notes through Undo/Redo', async () => {
    const original = { a: 'forest moon', b: 'river' };
    const e = await setup(original);
    await pinEdgeRange(e, 0, 6);
    const sourceId = storedWriting().writingGroups[0].id;
    await e.select(0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Keep the forest' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    const noteId = storedWriting().items[0].id;
    await pinInactiveSection();
    const targetId = storedWriting().writingGroups.find((group: { id: string }) => group.id !== sourceId).id;
    beginEdgeMove(sourceId);
    expect(screen.getByRole('group', { name: 'Move writing' })).toBeVisible();
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel move' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    directEdgeMove(sourceId, 'forest', targetId);
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: ' moon', b: 'forest\n\nriver' });
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().items[0]).toMatchObject({ id: noteId, manuscriptUnitId: 'b' }));
    expect(storedWriting().writingGroups.find((group: { id: string }) => group.id === sourceId).spans[0]).toMatchObject({ unitId: 'b', selectionStart: 0, selectionEnd: 6 });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().items[0]).toMatchObject({ id: noteId, manuscriptUnitId: 'a' }));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: ' moon', b: 'forest\n\nriver' });
    expect(e.text()).toBe(' moon');
  });

  it('rejects stale destinations and refuses explicit move Undo over later writing', async () => {
    const e = await setup({ a: 'forest moon', b: 'river' });
    await pinEdgeRange(e, 0, 6);
    const id = storedWriting().writingGroups[0].id;
    await pinInactiveSection();
    const targetId = storedWriting().writingGroups[1].id;
    beginEdgeMove(id);
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' later' } }));
    finishEdgeMove(targetId);
    expect(screen.getByText(/links changed/)).toBeVisible();
    expect(e.text()).toBe('forest moon later');
    directEdgeMove(id, 'forest', targetId);
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' newest' } }));
    expect(screen.queryByRole('button', { name: 'Undo passage move' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe(' moon later');
    fireEvent.click(screen.getByRole('button', { name: 'Undo passage move' }));
    expect(e.text()).toBe('forest moon later');
  });

  it('moves complete visible emphasis with its markers and refuses partial emphasis', async () => {
    const e = await setup({ a: '**forest** moon', b: 'river' });
    await pinEdgeRange(e, 2, 8);
    const id = storedWriting().writingGroups[0].id;
    await pinInactiveSection();
    directEdgeMove(id, 'forest', storedWriting().writingGroups[1].id);
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: ' moon', b: '**forest**\n\nriver' });
    expect([...document.querySelectorAll('[data-writing-source] [data-writing-span]')].find(node => node.textContent === 'forest')).toHaveStyle({ fontWeight: 700 });
    fireEvent.click(screen.getByRole('button', { name: 'Undo passage move' }));
    await pinEdgeRange(e, 2, 5);
    const partial = storedWriting().writingGroups.find((group: { spans: { selectionStart: number; selectionEnd: number }[] }) => group.spans[0].selectionStart === 2 && group.spans[0].selectionEnd === 5);
    directEdgeMove(partial.id, 'for', storedWriting().writingGroups.find((group: { spans: { unitId: string }[] }) => group.spans[0].unitId === 'b').id);
    expect(screen.getByText(/split visible formatting/)).toBeVisible();
    expect(e.text()).toBe('**forest** moon');
  });

  it('refuses to split a linked Note passage while moving a smaller pinned unit', async () => {
    const e = await setup({ a: 'forest moon', b: 'river' });
    await e.select(0, 11);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Both words belong together' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    await pinEdgeRange(e, 0, 6);
    await pinInactiveSection();
    const groups = storedWriting().writingGroups;
    directEdgeMove(groups[0].id, 'forest', groups[1].id);
    expect(screen.getByText(/split a linked Note passage/)).toBeVisible();
    expect(e.text()).toBe('forest moon');
    expect(storedWriting().items).toHaveLength(1);
  });

  it('splits at an interior cursor, preserves exact text and rejoins nonadjacent pins in writing order', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 17);
    const id = storedWriting().writingGroups[0].id;
    await e.select(5, 5);
    fireEvent.click(organizationRow(id).getByRole('button', { name: 'Split at writing cursor' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(2));
    expect(storedWriting().writingGroups.map((group: { spans: { selectionStart: number; selectionEnd: number }[] }) => group.spans.map(span => [span.selectionStart, span.selectionEnd]))).toEqual([[[0, 5]], [[5, 17]]]);
    expect(e.text()).toBe('moon glass winter');
    fireEvent.click(screen.getByRole('button', { name: 'Undo Pin' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    await pinEdgeRange(e, 0, 4);
    await pinEdgeRange(e, 11, 17);
    const parts = storedWriting().writingGroups.filter((group: { spans: { selectionStart: number; selectionEnd: number }[] }) => group.spans.some(span => span.selectionEnd === 4 || span.selectionStart === 11));
    for (const group of [...parts].reverse()) fireEvent.click(within(document.querySelector(`[data-writing-group-id="${group.id}"]`) as HTMLElement).getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join selected units' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(storedWriting().writingGroups[0].spans[0]).toMatchObject({ selectionStart: 0, selectionEnd: 17 });
    expect(e.text()).toBe('moon glass winter');
  });

  it('refuses outer-end and half-surrogate splits without changing membership or prose', async () => {
    const e = await setup({ a: '🌲 forest', b: 'river' });
    await pinEdgeRange(e, 0, 9);
    const before = storedWriting();
    const id = before.writingGroups[0].id;
    for (const offset of [0, 9, 1]) {
      await e.select(offset, offset);
      fireEvent.click(organizationRow(id).getByRole('button', { name: 'Split at writing cursor' }));
      expect(storedWriting()).toEqual(before);
    }
    expect(e.text()).toBe('🌲 forest');
  });

  it('keeps a later independent name and earlier typing across move Undo, then discards its redo after new prose', async () => {
    const e = await setup({ a: 'forest moon', b: '**river**' });
    await pinEdgeRange(e, 0, 6);
    const id = storedWriting().writingGroups[0].id;
    await pinInactiveSection();
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' earlier' } }));
    directEdgeMove(id, 'forest', storedWriting().writingGroups[1].id);
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: ' moon earlier', b: 'forest\n\n**river**' });
    await renameEdgeGroup('forest', 'New forest name');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('forest moon earlier');
    expect(storedWriting().writingGroups.find((group: { id: string }) => group.id === id).label).toBe('New forest name');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('forest moon');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(e.text()).toBe('forest moon earlier');
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' branch' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'forest moon earlier branch', b: '**river**' });
  });

  it('undoes a newer Pin before a passage move and redoes both in chronological order', async () => {
    const e = await setup({ a: 'forest moon', b: 'river' });
    await pinEdgeRange(e, 0, 6);
    const id = storedWriting().writingGroups[0].id;
    await pinInactiveSection();
    directEdgeMove(id, 'forest', storedWriting().writingGroups[1].id);
    await pinEdgeRange(e, 1, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(2));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: ' moon', b: 'forest\n\nriver' });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'forest moon', b: 'river' });
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: ' moon', b: 'forest\n\nriver' });
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(3));
  });

  it('carries first-paragraph spacing through Outline and local moves while retaining formatting, both Notes and exact Undo', async () => {
    const original = { a: '**forest**\n\nmoon', b: 'river' };
    const e = await setup(original);
    await pinEdgeRange(e, 2, 8);
    await renameEdgeGroup('forest', 'Forest scene');
    const id = storedWriting().writingGroups[0].id;
    for (const [from, to, body] of [[2, 8, 'Moved thought'], [12, 16, 'Following thought']] as const) {
      await e.select(from, to);
      fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
      fireEvent.change(screen.getByLabelText('Note text'), { target: { value: body } });
      await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
      fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
      await screen.findByRole('heading', { name: 'Edit Note' });
      fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    }
    const noteIds = storedWriting().items.map((note: { id: string }) => note.id);
    await pinInactiveSection();
    directEdgeMove(id, 'forest', storedWriting().writingGroups[1].id);
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'moon', b: '**forest**\n\nriver' });
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups[0]).toMatchObject({ id, label: 'Forest scene', spans: [{ unitId: 'b', selectionStart: 2, selectionEnd: 8 }] }));
    expect(storedWriting().items.map((note: { id: string }) => note.id)).toEqual(noteIds);
    expect(storedWriting().items[0].sourceAnchor).toMatchObject({ unitId: 'b', selectionStart: 2, selectionEnd: 8 });
    expect(storedWriting().items[1].sourceAnchor).toMatchObject({ unitId: 'a', selectionStart: 0, selectionEnd: 4 });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    beginEdgeMove(id);
    fireEvent.click(screen.getByRole('button', { name: 'Insert at manuscript end' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'moon', b: 'river\n\n**forest**\n\n' });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'moon', b: 'river\n\n**forest**\n\n' });
  });

  it('retains carried paragraph characters between multiple moved pieces without inserting a second separator', () => {
    const plan = planWritingMove(['a', 'b'], { a: 'Mother\n\nloose\n\nend', b: 'river' },
      [{ unitId: 'a', from: 0, to: 8 }, { unitId: 'a', from: 15, to: 18 }], { unitId: 'b', offset: 0 });
    expect(plan.after).toEqual({ a: 'loose\n\n', b: 'Mother\n\nend\n\nriver' });
    expect(relocateWritingRange({ unitId: 'a', from: 8, to: 13 }, plan)).toEqual([{ unitId: 'a', from: 0, to: 5 }]);
    expect(relocateWritingRange({ unitId: 'a', from: 0, to: 6 }, plan)).toEqual([{ unitId: 'b', from: 0, to: 6 }]);
  });

  it('keeps a refused drop reason through drag-end and reserves canceled for a canceled gesture', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 4);
    const original = storedWriting().writingGroups;
    const source = screen.getByRole('button', { name: 'Drag moon in the manuscript' });
    const target = document.querySelector('[data-writing-group-id]')!;
    let data = '';
    const transfer = { setData: (_type: string, value: string) => { data = value; }, getData: () => data,
      types: ['application/x-black-skies-writing-unit'], effectAllowed: '', dropEffect: '' };
    const send = (element: Element, type: string) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'dataTransfer', { value: transfer }); element.dispatchEvent(event);
    };
    act(() => { send(source, 'dragstart'); send(target, 'drop'); send(source, 'dragend'); });
    expect(screen.getByText('The destination is inside or immediately beside this passage.')).toBeVisible();
    expect(screen.queryByText('Move canceled. Writing was unchanged.')).toBeNull();
    expect(e.text()).toBe('moon glass winter');
    expect(storedWriting().writingGroups).toEqual(original);
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => { send(source, 'dragstart'); send(source, 'dragend'); });
    expect(screen.getByText('Move canceled. Writing was unchanged.')).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Move writing' })).toBeNull();
    expect(e.text()).toBe('moon glass winter');
  });

  it('splits and joins a cross-section unit with one linked Note while retaining exact source and membership Undo', async () => {
    const original = { a: 'forest moon', b: 'river ending' };
    const e = await setup(original);
    await e.select(0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'One thought' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    const note = storedWriting().items[0];
    const target = document.querySelector('[data-writing-source] [data-writing-span]')!;
    const range = document.createRange();
    range.setStart(e.input.querySelector('.cm-line')!.firstChild!, 0);
    range.setEnd(target.firstChild!, 5);
    window.getSelection()!.removeAllRanges(); window.getSelection()!.addRange(range);
    fireEvent.pointerUp(target); fireEvent.click(target);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    window.getSelection()?.removeAllRanges();
    const group = storedWriting().writingGroups[0];
    expect(group.spans).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Join selected units' })).toBeDisabled();
    await e.select(7, 7);
    fireEvent.click(organizationRow(group.id).getByRole('button', { name: 'Split at writing cursor' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(2));
    const parts = storedWriting().writingGroups;
    expect(parts[1].spans).toHaveLength(2);
    const boxes = screen.getAllByRole('checkbox').filter(box => box.getAttribute('aria-label')?.startsWith('Compare '));
    fireEvent.click(boxes[0]!);
    expect(screen.getByRole('button', { name: 'Join selected units' })).toBeDisabled();
    fireEvent.click(boxes[1]!);
    fireEvent.click(screen.getByRole('button', { name: 'Join selected units' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(storedWriting().writingGroups[0].spans).toMatchObject([{ unitId: 'a', selectionStart: 0, selectionEnd: 11 }, { unitId: 'b', selectionStart: 0, selectionEnd: 5 }]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo Pin' }));
    await waitFor(() => expect(storedWriting().writingGroups).toEqual(parts));
    expect(storedWriting().items[0]).toEqual(note);
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
  });
});


describe('Approved local unit workflow', () => {
  it.each([false, true])('saves externally recovered sections without local membership edits and keeps failed sources unsaved (failure: %s)', async (failSecond) => {
    const bodies = { a: 'Recovered alpha', b: 'Recovered beta' };
    const snapshot = { generation: 1, dirtyUnitIds: ['a', 'b'], saveState: { status: 'dirty' },
      project: { projectId: 'test', path: 'C:/disposable', units: [{ id: 'a' }, { id: 'b' }],
        drafts: { a: 'Durable alpha', b: 'Durable beta' }, unitMetrics: {} },
    } as unknown as ProjectSpineSessionSnapshot;
    const outline: LivingOutlineSnapshotV1 = { availability: 'ready', message: null,
      document: { schemaVersion: 'BlackSkiesLivingOutline v1', projectId: 'test', revision: 0, items: [], writingGroups: [] } };
    const replaceWritingState = vi.fn(async () => ({ ok: true as const, data: outline }));
    const saveSource = vi.fn(async (id: string, body?: string) => {
      if (id === 'b' && failSecond) throw new Error('Recovered beta could not be saved');
      Object.assign(snapshot.project!.drafts!, { [id]: body });
      Object.assign(snapshot, { dirtyUnitIds: snapshot.dirtyUnitIds.filter(value => value !== id) });
    });
    const hook = renderHook(() => useWritingPage({ snapshot, outline,
      bridge: { replaceWritingState } as unknown as LivingOutlineBridge,
      getSnapshot: () => snapshot, getBodies: () => bodies, saveSource, onOutline: () => {}, reportDirty: () => {} }));
    await waitFor(() => expect(hook.result.current.ready).toBe(true));
    expect(hook.result.current.unsaved).toBe(false);
    let saved = false;
    await act(async () => { saved = await hook.result.current.save(); });
    expect(saveSource.mock.calls).toEqual([['a', bodies.a], ['b', bodies.b]]);
    expect(saved).toBe(!failSecond);
    expect(snapshot.project!.drafts!.a).toBe(bodies.a);
    expect(snapshot.project!.drafts!.b).toBe(failSecond ? 'Durable beta' : bodies.b);
    expect(snapshot.dirtyUnitIds).toEqual(failSecond ? ['b'] : []);
    expect(replaceWritingState).toHaveBeenCalledTimes(failSecond ? 0 : 1);
    if (failSecond) expect(hook.result.current.notice).toContain('Recovered beta could not be saved');
  });
  it('expires or dismisses writing notices without canceling a pending move or changing writing', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 4);
    const original = storedWriting().writingGroups;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const start = () => fireEvent.click(screen.getByRole('button', { name: 'Drag moon in the manuscript' }));
      start();
      expect(screen.getByText('Choose an insertion marker in the writing or Outline. Escape cancels.')).toBeVisible();
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.queryByText('Choose an insertion marker in the writing or Outline. Escape cancels.')).toBeNull();
      expect(screen.getByRole('group', { name: 'Move writing' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel move' }));
      expect(screen.getByText('Move canceled. Writing was unchanged.')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss writing message' }));
      expect(screen.queryByText('Move canceled. Writing was unchanged.')).toBeNull();
      start();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel move' }));
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.queryByText('Move canceled. Writing was unchanged.')).toBeNull();
      expect(screen.queryByRole('group', { name: 'Move writing' })).toBeNull();
      expect(e.text()).toBe('moon glass winter');
      expect(storedWriting().writingGroups).toEqual(original);
    } finally {
      vi.useRealTimers();
    }
  });
  it('previews whole-unit Extend and preserves identity, name, exclusive membership and chronological Undo/Redo', async () => {
    const body = 'Mother knew about the poison. Loose words.';
    const e = await setup({ a: body, b: 'river' });
    await pinEdgeRange(e, 0, 29);
    await renameEdgeGroup('Mother knew about the poison.', 'Mother knows');
    const original = storedWriting().writingGroups[0];
    await e.select(12, body.length);
    const menu = localUnitMenu(e.input);
    expect(menu.getByText(/Result: 7 words/)).toBeVisible();
    expect(storedWriting().writingGroups).toEqual([original]);
    fireEvent.click(menu.getByRole('button', { name: 'Extend unit' }));
    await waitFor(() => expect(storedWriting().writingGroups[0].spans[0].selectionEnd).toBe(body.length));
    expect(storedWriting().writingGroups).toHaveLength(1);
    expect(storedWriting().writingGroups[0]).toMatchObject({ id: original.id, label: original.label, customLabel: true });
    expect(e.text()).toBe(body);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups).toEqual([original]));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups[0].spans[0].selectionEnd).toBe(body.length));
    expect(storedWriting().writingGroups[0].id).toBe(original.id);
  });

  it('retains an automatic opening-word name when Extend adds earlier loose writing and restores its original naming on Undo', async () => {
    const e = await setup({ a: 'loose words moon glass winter', b: 'river' });
    await pinEdgeRange(e, 12, 22);
    const original = storedWriting().writingGroups[0];
    await e.select(0, 16);
    fireEvent.click(localUnitMenu(e.input).getByRole('button', { name: 'Extend unit' }));
    await waitFor(() => expect(storedWriting().writingGroups[0].spans[0].selectionStart).toBe(0));
    expect(storedWriting().writingGroups[0]).toMatchObject({ id: original.id, label: 'moon glass', customLabel: true });
    expect(screen.getByRole('button', { name: 'moon glass' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups).toEqual([original]));
  });

  it('splits before the named whole word from keyboard and retains the original custom name on the first part', async () => {
    const e = await setup({ a: 'Mother knew about the poison.', b: 'river' });
    await pinEdgeRange(e, 0, e.text().length);
    await renameEdgeGroup('Mother knew about the poison.', 'Mother knows');
    const original = storedWriting().writingGroups[0];
    await e.select(14, 14); // inside about: resolve its beginning, not a half word.
    const menu = localUnitMenu(e.input);
    expect(menu.getByText('Split: 2 + 3 words. Writing stays unchanged.')).toBeVisible();
    fireEvent.click(menu.getByRole('button', { name: 'Split before “about”' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(2));
    const parts = storedWriting().writingGroups;
    expect(parts[0]).toMatchObject({ id: original.id, label: 'Mother knows', customLabel: true });
    expect(parts[1]).toMatchObject({ label: 'about the poison.', customLabel: false, spans: [{ selectionStart: 12 }] });
    expect(parts[1].id).not.toBe(original.id);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups).toEqual([original]));
  });

  it('joins distinct custom names in manuscript order and restores both identities/names on Undo', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 11, 17); await renameEdgeGroup('winter', 'Ending');
    await pinEdgeRange(e, 0, 4); await renameEdgeGroup('moon', 'Opening');
    const original = storedWriting().writingGroups;
    await e.select(1, 15);
    fireEvent.click(localUnitMenu(e.input).getByRole('button', { name: 'Join units' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(storedWriting().writingGroups[0]).toMatchObject({ label: 'Opening / Ending', customLabel: true, spans: [{ selectionStart: 0, selectionEnd: 17 }] });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups).toEqual(original));
    expect(e.text()).toBe('moon glass winter');
  });

  it('requires an edited overlong name before joining and never truncates it silently', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 4); await renameEdgeGroup('moon', 'A'.repeat(240));
    await pinEdgeRange(e, 11, 17); await renameEdgeGroup('winter', 'B'.repeat(240));
    const original = storedWriting().writingGroups;
    await e.select(0, 17);
    fireEvent.click(localUnitMenu(e.input).getByRole('button', { name: 'Join units' }));
    expect(screen.getByLabelText('Combined unit name', { selector: 'input' })).toHaveValue('A'.repeat(240) + ' / ' + 'B'.repeat(240));
    expect(screen.getByRole('button', { name: 'Join with this name' })).toBeDisabled();
    expect(storedWriting().writingGroups).toEqual(original);
    fireEvent.change(screen.getByLabelText('Combined unit name', { selector: 'input' }), { target: { value: 'Opening / Ending' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join with this name' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(storedWriting().writingGroups[0].label).toBe('Opening / Ending');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(storedWriting().writingGroups).toEqual(original));
  });

  it('applies a fast drag/drop before another render and does not label a completed drop canceled', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 4); await pinEdgeRange(e, 11, 17);
    const source = screen.getByRole('button', { name: 'Drag winter in the manuscript' });
    const target = document.querySelector('[data-writing-group-id]')!;
    let data = '';
    const transfer = { setData: (_type: string, value: string) => { data = value; }, getData: () => data, types: ['application/x-black-skies-writing-unit'], effectAllowed: '', dropEffect: '' };
    act(() => {
      for (const [element, type] of [[source, 'dragstart'], [target, 'dragover'], [target, 'drop'], [source, 'dragend']] as const) {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, 'dataTransfer', { value: transfer });
        element.dispatchEvent(event);
      }
    });
    expect(e.text()).toBe('winter\n\nmoon glass ');
    expect(screen.getByText(/Passage moved with its Notes/)).toBeVisible();
    expect(screen.queryByText('Move canceled. Writing was unchanged.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter');
  });

  it('refuses a move that touches protected source information without mutating writing or concern evidence', async () => {
    const envelope = await buildProgram7SourceEnvelope({ projectId: 'test', generation: 1, unitId: 'a', sourceText: 'forest moon', selectionStart: 0, selectionEnd: 6, sourceClass: 'protected' });
    const concern: RevisionItem = { id: 'protected-source', projectId: 'test', unitId: 'a', body: 'Protected record', createdAt: '2026-11-14T00:00:00.000Z',
      kind: 'revision_item', advisory: false, lifecycle: 'active', sourceClass: 'protected', protection: { protected: true }, anchor: envelope.anchor, sourceBodyFingerprint: envelope.bodySha256 };
    const original = JSON.stringify(concern);
    const e = await setup({ a: 'forest moon', b: 'river' }, false, [concern]);
    await pinEdgeRange(e, 0, 6); await pinInactiveSection();
    const groups = storedWriting().writingGroups;
    directEdgeMove(groups[0].id, 'forest', groups[1].id);
    expect(screen.getByText(/Protected source information prevents this move/)).toBeVisible();
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'forest moon', b: 'river' });
    expect(JSON.stringify(concern)).toBe(original);
  });

  it('moves from the local controls to a real editor insertion marker at manuscript beginning and end', async () => {
    const original = { a: 'moon glass winter', b: 'river' };
    const e = await setup(original);
    await pinEdgeRange(e, 11, 17);
    const id = storedWriting().writingGroups[0].id;
    await e.select(13, 13);
    fireEvent.click(localUnitMenu(e.input).getByRole('button', { name: 'Move' }));
    fireEvent.click(within(e.input).getByRole('button', { name: 'Insert writing here, position 0' }));
    expect(e.text()).toBe('winter\n\nmoon glass ');
    expect(screen.queryByRole('region', { name: 'Passage move preview' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe(original.a);
    beginEdgeMove(id);
    fireEvent.click(screen.getByRole('button', { name: 'Insert at manuscript end' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'moon glass ', b: 'river\n\nwinter' });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
  });

  it('refuses a stale local action, a self destination and a word-splitting move without mutation', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 4);
    const id = storedWriting().writingGroups[0].id;
    await e.select(2, 2);
    localUnitMenu(e.input);
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' later' } }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Writing passage actions' })).getByRole('button', { name: 'Move' }));
    expect(screen.getByText(/Select the current words again/)).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Move writing' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    beginEdgeMove(id); finishEdgeMove(id);
    expect(screen.getByText(/inside or immediately beside/)).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    await pinEdgeRange(e, 1, 3);
    const partial = storedWriting().writingGroups.find((group: { spans: { selectionStart: number }[] }) => group.spans[0].selectionStart === 1);
    beginEdgeMove(partial.id);
    fireEvent.click(screen.getByRole('button', { name: 'Insert at manuscript end' }));
    expect(screen.getByText(/split a word/)).toBeVisible();
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'moon glass winter later', b: 'river' });
  });
});

describe('Connected writer tools with the real editor', () => {
  it('uses one chronological Undo/Redo for typing and pins while preserving independent unit names', async () => {
    const e = await setup({ a: 'moon glass winter', b: 'river' });
    await pinEdgeRange(e, 0, 4);
    const firstId = storedWriting().writingGroups[0].id;
    act(() => e.editor.dispatch({ changes: { from: 4, insert: 'lit' }, userEvent: 'input.type' }));
    await pinEdgeRange(e, 14, 20);
    await renameEdgeGroup('moonlit', 'Opening image');
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'New ' }, userEvent: 'input.type' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moonlit glass winter');
    expect(storedWriting().writingGroups).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(1));
    expect(e.text()).toBe('moonlit glass winter');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter');
    expect(storedWriting().writingGroups[0]).toMatchObject({ id: firstId, label: 'Opening image', customLabel: true });
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(e.text()).toBe('moonlit glass winter');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await waitFor(() => expect(storedWriting().writingGroups).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(e.text()).toBe('New moonlit glass winter');
  });

  it('uses the permanent toolbar for selected formatting and one-step Undo/Redo', async () => {
    const e = await setup();
    await e.select(0, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(e.text()).toBe('**moon** glass winter shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(e.text()).toBe('**moon** glass winter shirt');
  });
  it('keeps Note source offsets exact through a formatted inactive writing section', async () => {
    render(<Harness initialBodies={{ a: '**moon** glass winter shirt', b: 'A *second shirt*. Forest.' }} />);
    const input = await screen.findByRole('textbox', { name: 'Draft editor' });
    expect(input.querySelector('strong')).toHaveTextContent('moon');
    const source = document.querySelector('[data-writing-source]')!;
    const passage = [...source.querySelectorAll('[data-writing-span]')].find(node => node.textContent === 'second shirt')!;
    expect(passage).toHaveStyle({ fontStyle: 'italic' });
    const range = document.createRange();
    range.selectNodeContents(passage);
    const selection = window.getSelection()!;
    selection.removeAllRanges(); selection.addRange(range);
    fireEvent.pointerUp(passage);
    fireEvent.click(passage);
    fireEvent.click(screen.getByRole('button', { name: /^Notes$/u }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'A formatted passage' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await waitFor(() => {
      const stored = JSON.parse(screen.getByLabelText('Stored metadata').textContent!);
      expect(stored.items[0]?.sourceAnchor).toMatchObject({ unitId: 'b', selectionStart: 3, selectionEnd: 15 });
    });
    expect(screen.getByLabelText('Bodies').textContent).toContain('A *second shirt*. Forest.');
  });

  it('previews whole-manuscript literal replacements and restores the batch without overwriting later edits', async () => {
    const e = await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'shirt' },
    });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    expect(screen.getByText('2 matches')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 2 matches' }));
    expect(screen.getByLabelText('Bodies')).toHaveTextContent('A second blouse. Forest.');
    expect(e.text()).toBe('moon glass winter blouse');
    fireEvent.click(screen.getByRole('button', { name: 'Undo replacement' }));
    expect(e.text()).toBe('moon glass winter shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 2 matches' }));
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'New ' } }));
    expect(screen.getByRole('button', { name: 'Undo replacement' })).toBeDisabled();
    expect(e.text()).toBe('New moon glass winter blouse');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter blouse');
    fireEvent.click(screen.getByRole('button', { name: 'Undo replacement' }));
    expect(e.text()).toBe('moon glass winter shirt');
    expect(screen.getByLabelText('Bodies')).toHaveTextContent('A second shirt. Forest.');
  });

  it('undoes and redoes a three-match manuscript replacement through the ordinary toolbar', async () => {
    const original = { a: 'shirt shirt', b: 'A shirt.' };
    const e = await setup(original);
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), { target: { value: 'shirt' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 3 matches' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'blouse blouse', b: 'A blouse.' });
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save writing' })).toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'blouse blouse', b: 'A blouse.' });
    fireEvent.click(screen.getByRole('button', { name: 'Undo replacement' }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'blouse blouse', b: 'A blouse.' });
    expect(e.text()).toBe('blouse blouse');
  });

  it('keeps earlier/later typing in order and discards the replacement redo branch after new writing', async () => {
    const e = await setup({ a: 'shirt shirt', b: 'A shirt.' });
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'Before ' }, userEvent: 'input.type' }));
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), { target: { value: 'shirt' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 3 matches' }));
    act(() => e.editor.dispatch({ changes: { from: e.text().length, insert: ' After' }, userEvent: 'input.type' }));
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(e.text()).toBe('Before blouse blouse');
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'Before shirt shirt', b: 'A shirt.' });
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(e.text()).toBe('shirt shirt');
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(e.text()).toBe('Before shirt shirt');
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(e.text()).toBe('Before blouse blouse');
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'New ' }, userEvent: 'input.type' }));
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'New Before shirt shirt', b: 'A shirt.' });
  });

  it('does not skip later formatting actions that return to the same replacement text', async () => {
    const e = await setup({ a: 'shirt shirt', b: 'A shirt.' });
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), { target: { value: 'shirt' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 3 matches' }));
    await e.select(0, 6);
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(e.text()).toBe('blouse blouse');
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: '*blouse* blouse', b: 'A blouse.' });
  });

  it('keeps consecutive replacement batches reversible through editor shortcuts', async () => {
    const e = await setup({ a: 'shirt shirt', b: 'A shirt.' });
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), { target: { value: 'shirt' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 3 matches' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), { target: { value: 'blouse' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'coat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 3 matches' }));
    e.input.focus();
    fireEvent.keyDown(e.input, { key: 'z', ctrlKey: true });
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'blouse blouse', b: 'A blouse.' });
    fireEvent.keyDown(e.input, { key: 'z', ctrlKey: true });
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'shirt shirt', b: 'A shirt.' });
    fireEvent.keyDown(e.input, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'blouse blouse', b: 'A blouse.' });
    fireEvent.keyDown(e.input, { key: 'y', ctrlKey: true });
    expect(JSON.parse(screen.getByLabelText('Bodies').textContent!)).toEqual({ a: 'coat coat', b: 'A coat.' });
    fireEvent.keyDown(screen.getByLabelText('Find', { exact: true }), { key: 'z', ctrlKey: true });
    expect(e.text()).toBe('coat coat');
  });

  it('advances Replace next past replacement text that contains the original word', async () => {
    const e = await setup();
    act(() =>
      e.editor.dispatch({
        changes: { from: 0, to: e.editor.state.doc.length, insert: 'shirt shirt shirt' },
        selection: { anchor: 0 },
      }),
    );
    await e.select(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Search scope'), { target: { value: 'current' } });
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'shirt' },
    });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'shirt sleeve' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace next' }));
    await waitFor(() => expect(e.text()).toBe('shirt sleeve shirt shirt'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Replace next' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Replace next' }));
    await waitFor(() => expect(e.text()).toBe('shirt sleeve shirt sleeve shirt'));
  });

  it('never widens a frozen selected-word scope after the writing changes', async () => {
    const e = await setup();
    await e.select(18, 23);
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Search scope'), { target: { value: 'selection' } });
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'shirt' },
    });
    expect(screen.getByText('1 matches')).toBeInTheDocument();
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'New ' } }));
    expect(screen.getByRole('button', { name: 'Replace all 0 matches' })).toBeDisabled();
    expect(screen.getByLabelText('Search scope')).toHaveValue('selection');
  });
  it('merges overlapping pins into exclusive membership and retains their outside text', async () => {
    const e = await setup();
    await e.select(0, 10);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    await screen.findByText('Writing units and Notes saved.');
    await e.select(5, 16);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled());
    const data = JSON.parse(screen.getByLabelText('Stored metadata').textContent!);
    expect(
      data.writingGroups.map(
        (group: { spans: { selectionStart: number; selectionEnd: number }[] }) =>
          group.spans.map((span) => [span.selectionStart, span.selectionEnd]),
      ),
    ).toEqual([[[0, 5]], [[5, 16]]]);
    expect(e.text()).toBe('moon glass winter shirt');
    const id = data.writingGroups[0].id;
    fireEvent.click(screen.getByRole('button', { name: `Rename ${data.writingGroups[0].label}` }));
    fireEvent.change(screen.getByLabelText('Unit name'), { target: { value: 'Opening image' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save unit name' }));
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByLabelText('Stored metadata').textContent!).writingGroups[0],
      ).toMatchObject({ id, label: 'Opening image' }),
    );
    expect(e.text()).toBe('moon glass winter shirt');
  });
  it('keeps Note drafts tied to their original words and permits explicit reselection', async () => {
    const e = await setup();
    await e.select(0, 4);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'Moon thought' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'New ' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Stored metadata')).not.toHaveTextContent('Moon thought'),
    );
    expect(screen.getByLabelText('Note text')).toHaveValue('Moon thought');
    await e.select(4, 8);
    fireEvent.click(screen.getByRole('button', { name: 'Use current selection' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    expect(screen.getByLabelText('Stored metadata')).toHaveTextContent('Moon thought');
  });
  it('offers a Note from the writing context menu and Escape dismisses just the menu', async () => {
    const e = await setup();
    await e.select(5, 10);
    fireEvent.contextMenu(e.input, { clientX: 200, clientY: 200 });
    const menu = await screen.findByRole('dialog', { name: 'Writing passage actions' });
    expect(menu).toBeVisible();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Writing passage actions' })).not.toBeInTheDocument();
    fireEvent.contextMenu(e.input);
    fireEvent.click(screen.getByRole('button', { name: 'Add Note here' }));
    expect(screen.getByRole('heading', { name: 'Add Note' })).toBeVisible();
  });
  it('changes all eight independent highlight combinations without touching source or membership', async () => {
    const e = await setup();
    const before = screen.getByLabelText('Bodies').textContent;
    for (let bits = 0; bits < 8; bits += 1) {
      for (const [index, label] of ['Pinned', 'Unpinned', 'Open concern'].entries()) {
        const box = screen.getByRole('checkbox', { name: label }) as HTMLInputElement;
        if (box.checked !== Boolean(bits & (1 << index))) fireEvent.click(box);
      }
      expect(screen.getByLabelText('Bodies').textContent).toBe(before);
      expect(e.text()).toBe('moon glass winter shirt');
      expect(document.querySelector('.cm-content .stage19-writing-unpinned') !== null).toBe(
        Boolean(bits & 2),
      );
    }
  });
  it('keeps compact Note access outside the closed tool menu and shows draft save state', async () => {
    const e = await setup(undefined, true);
    await e.select(5, 10);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    await screen.findByText('Writing units and Notes saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    expect(await screen.findByLabelText('Selected Note sources')).toHaveTextContent('1 selected passage');
    expect(screen.getByLabelText('Selected Note sources')).toHaveTextContent('glass');
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'A separate Note' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    expect(screen.getByRole('status', { name: 'Note save status' })).toHaveTextContent('Saved Note');
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'A separate Note Reviewed.' } });
    expect(screen.getByRole('status', { name: 'Note save status' })).toHaveTextContent('Unsaved Note changes');
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await waitFor(() => expect(screen.getByRole('status', { name: 'Note save status' })).toHaveTextContent('Saved Note'));
    expect(storedWriting().items).toHaveLength(1);
    expect(storedWriting().items[0].body).toBe('A separate Note Reviewed.');
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    const row = document.querySelector('[data-writing-group-id]')!;
    expect(row.querySelector('.stage19-outline-row-actions')).not.toHaveAttribute('open');
    expect(within(row as HTMLElement).getByText('1 Notes', { exact: true })).toBeVisible();
  });

  it('retains the pencil for a deliberately position-linked Note', async () => {
    const e = await setup();
    await e.select(5, 5);
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'A position Note' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    expect(screen.getByRole('button', { name: 'Open Note: A position Note' })).toBeVisible();
  });

  it('keeps a saved Note and Pin attached through editing, deletion, Save and source Undo', async () => {
    const e = await setup();
    await e.select(5, 10);
    fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
    await screen.findByText('Writing units and Notes saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), {
      target: { value: 'The glass matters' },
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    act(() => e.editor.dispatch({ changes: { from: 0, insert: 'New ' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByLabelText('Stored metadata').textContent!).items[0].sourceAnchor
          .selectionStart,
      ).toBe(9),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByLabelText('Stored metadata').textContent!).items[0].sourceAnchor
          .selectionStart,
      ).toBe(5),
    );
    act(() => e.editor.dispatch({ changes: { from: 5, to: 10, insert: '' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByLabelText('Stored metadata').textContent!).items[0].sourceAnchor
          .anchorKind,
      ).toBe('position'),
    );
    expect(screen.getAllByText(/writing removed/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Open Note: The glass matters' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save writing' }));
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByLabelText('Stored metadata').textContent!).items[0].sourceAnchor,
      ).toMatchObject({ selectionStart: 5, selectionEnd: 10, anchorKind: 'span' }),
    );
    expect(JSON.parse(screen.getByLabelText('Stored metadata').textContent!).items).toHaveLength(1);
  });

  it('uses one manuscript Outline and keeps loose writing outside a moved unit', async () => {
    const e = await setup({ a: 'forest loose moon more winter trailing', b: 'river' });
    for (const [from, to] of [[0, 6], [13, 17], [23, 29]]) await pinEdgeRange(e, from!, to!);
    const before = storedWriting().writingGroups;
    expect(screen.queryByLabelText('Outline order')).toBeNull();
    directEdgeMove(before[2].id, 'winter', before[0].id);
    expect(e.text()).toBe('winter\n\nforest loose moon more  trailing');
    const rows = [...document.querySelectorAll('[data-writing-group-id]')];
    expect(rows.map(row => row.getAttribute('data-writing-group-id'))).toEqual([before[2].id, before[0].id, before[1].id]);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('forest loose moon more winter trailing');
    expect([...document.querySelectorAll('[data-writing-group-id]')].map(row => row.getAttribute('data-writing-group-id')))
      .toEqual(before.map((group: { id: string }) => group.id));
  });

  it('drags writing to a visible insertion marker and ignores self, foreign and malformed drops', async () => {
    const e = await setup();
    for (const [from, to] of [[0, 4], [5, 10], [11, 17]]) await pinEdgeRange(e, from!, to!);
    const before = storedWriting().writingGroups;
    const sourceId = before[2].id, firstId = before[0].id;
    const source = screen.getByRole('button', { name: 'Drag winter in the manuscript' });
    const target = document.querySelector(`[data-writing-group-id="${firstId}"]`)!;
    let payload = '';
    const transfer = { setData: (_type: string, data: string) => { payload = data; }, getData: () => payload, effectAllowed: '', dropEffect: '' };
    fireEvent.dragStart(source, { dataTransfer: transfer });
    expect(within(target as HTMLElement).getByRole('button', { name: 'Insert before moon' })).toBeVisible();
    for (const data of ['broken', JSON.stringify({ id: sourceId, projectId: 'other', generation: 1 }),
      JSON.stringify({ id: firstId, projectId: 'test', generation: 1 }), JSON.stringify({ id: sourceId, projectId: 'test', generation: 2 })]) {
      fireEvent.drop(target, { dataTransfer: { ...transfer, getData: () => data } });
      expect(e.text()).toBe('moon glass winter shirt');
    }
    fireEvent.drop(target, { dataTransfer: transfer });
    expect(e.text()).toBe('winter\n\nmoon glass  shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('moon glass winter shirt');
    expect(storedWriting().writingGroups.map((group: { id: string }) => group.id)).toEqual(before.map((group: { id: string }) => group.id));
  });

  it('compares exact passages and linked Notes, then clears removed units without stale excerpts', async () => {
    const e = await setup();
    for (const [from, to] of [[0, 4], [11, 17]]) {
      await e.select(from!, to!);
      fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Pin' })).toBeEnabled());
    }
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));
    fireEvent.change(screen.getByLabelText('Note text'), { target: { value: 'The cold matters.' } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Keep Note' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Keep Note' }));
    await screen.findByRole('heading', { name: 'Edit Note' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Note' }));
    expect(screen.getByRole('button', { name: 'Compare selected · 0' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare moon' }));
    expect(screen.getByRole('button', { name: 'Compare selected · 1' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Compare winter' }));
    const before = screen.getByLabelText('Stored metadata').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Compare selected · 2' }));
    const comparison = screen.getByRole('region', { name: 'Selected passage comparison' });
    const moon = within(comparison).getByRole('article', { name: 'Compared unit: moon' });
    const winter = within(comparison).getByRole('article', { name: 'Compared unit: winter' });
    expect(moon.querySelector('.stage19-outline-comparison__prose')).toHaveTextContent(/^moon$/);
    expect(winter.querySelector('.stage19-outline-comparison__prose')).toHaveTextContent(/^winter$/);
    expect(within(winter).getByRole('button', { name: 'The cold matters.' })).toBeVisible();
    expect(within(moon).queryByText('The cold matters.')).not.toBeInTheDocument();
    fireEvent.click(within(moon).getByRole('button', { name: 'Read passage 1' }));
    await waitFor(() => expect(e.editor.state.selection.main).toMatchObject({ from: 0, to: 4 }));
    expect(screen.getByLabelText('Stored metadata').textContent).toBe(before);
    const row = document.querySelector('[data-writing-group-id]')!;
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Unpin' }));
    await waitFor(() => expect(within(comparison).queryByRole('article', { name: 'Compared unit: moon' })).not.toBeInTheDocument());
    expect(within(comparison).getByText(/Some selected units changed/)).toBeVisible();
    expect(e.text()).toBe('moon glass winter shirt');
    fireEvent.click(screen.getByRole('button', { name: 'Close comparison' }));
    expect(screen.queryByRole('region', { name: 'Selected passage comparison' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.getByRole('checkbox', { name: 'Compare winter' })).not.toBeChecked();
  });

});
