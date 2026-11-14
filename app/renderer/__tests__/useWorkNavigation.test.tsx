import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWorkNavigation, type WorkPlace } from '../useWorkNavigation';
import { buildLivingOutlineSourceAnchor } from '../../shared/livingOutlineAnchors';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-test-scroll]').forEach((node) => node.remove());
});
async function setup() {
  const anchor = await buildLivingOutlineSourceAnchor('a', 'moon glass winter', 5, 10);
  let body = 'moon glass winter';
  let place: WorkPlace = {
    surface: 'writing',
    workspace: 'review',
    unitId: 'a',
    selection: anchor,
    writingView: {
      outlineView: { order: 'plan', selected: ['forest', 'return'], comparing: true },
      note: {
        session: 'draft',
        id: null,
        body: 'Keep this unfinished thought',
        ranges: [{ unitId: 'a', from: 5, to: 10 }],
        sourceReady: true,
      },
      selection: [{ unitId: 'a', from: 5, to: 10 }],
      pin: { unitId: 'a', offset: 5 },
      search: {
        open: true,
        query: 'glass',
        replacement: 'cup',
        matchCase: false,
        scope: 'selection',
        ranges: [{ unitId: 'a', from: 5, to: 10 }],
        frozenBodies: { a: body },
      },
    },
  };
  const scroll = document.createElement('div');
  scroll.setAttribute('data-manuscript-scroll-owner', 'true');
  scroll.setAttribute('data-test-scroll', 'true');
  scroll.scrollTop = 411;
  document.body.append(scroll);
  const activate = vi.fn(async (surface: 'writing' | 'command') => {
    place = { ...place, surface };
    return true;
  });
  const selectUnit = vi.fn(async (unitId: string) => {
    place = { ...place, unitId };
    return true;
  });
  const setWorkspace = vi.fn((workspace: WorkPlace['workspace']) => {
    place = { ...place, workspace };
  });
  const hook = renderHook(
    ({ key }) =>
      useWorkNavigation({
        projectKey: key,
        getPlace: () => place,
        getBody: () => body,
        activate,
        selectUnit,
        setWorkspace,
      }),
    { initialProps: { key: 'project:1' } },
  );
  return {
    ...hook,
    scroll,
    activate,
    selectUnit,
    setWorkspace,
    setPlace: (next: Partial<WorkPlace>) => {
      place = { ...place, ...next };
    },
    setBody: (next: string) => {
      body = next;
    },
  };
}
describe('Back preserves work without guessing stale sources', () => {
  it('edge: a failed delayed surface return cannot repopulate another project history', async () => {
    const h = await setup();
    act(h.result.current.prepare());
    h.setPlace({ surface: 'command' });
    let complete!: (value: boolean) => void;
    h.activate.mockImplementationOnce(() => new Promise<boolean>(resolve => { complete = resolve; }));
    let pending!: Promise<void>;
    act(() => { pending = h.result.current.back(); });
    h.rerender({ key: 'other:1' });
    await act(async () => { complete(false); await pending; });
    expect(h.result.current.canBack).toBe(false);
    expect(h.result.current.notice).toBe('');
    expect(h.result.current.selectionRestore).toBeNull();
  });

  it('edge: a failed delayed source return cannot report old-project failure in a new project', async () => {
    const h = await setup();
    act(h.result.current.prepare());
    h.setPlace({ unitId: 'b' });
    let complete!: (value: boolean) => void;
    h.selectUnit.mockImplementationOnce(() => new Promise<boolean>(resolve => { complete = resolve; }));
    let pending!: Promise<void>;
    act(() => { pending = h.result.current.back(); });
    h.rerender({ key: 'other:1' });
    await act(async () => { complete(false); await pending; });
    expect(h.result.current.canBack).toBe(false);
    expect(h.result.current.notice).toBe('');
    expect(h.result.current.writingViewRestore).toBeNull();
  });

  it('commits history only after navigation succeeds and does not record duplicate snapshots', async () => {
    const h = await setup();
    const commit = h.result.current.prepare();
    expect(h.result.current.canBack).toBe(false);
    act(commit);
    act(h.result.current.prepare());
    expect(h.result.current.canBack).toBe(true);
    h.setPlace({ surface: 'command' });
    await act(async () => {
      await h.result.current.back();
    });
    expect(h.result.current.canBack).toBe(false);
    expect(h.activate).toHaveBeenCalledTimes(1);
  });
  it('restores source, selection, unfinished Note, search and reading position', async () => {
    const h = await setup();
    act(h.result.current.prepare());
    h.setPlace({ surface: 'command', unitId: 'b', workspace: 'story-knowledge' });
    h.scroll.scrollTop = 0;
    await act(async () => {
      await h.result.current.back();
    });
    expect(h.selectUnit).toHaveBeenCalledWith('a');
    expect(h.setWorkspace).toHaveBeenCalledWith('review');
    expect(h.result.current.selectionRestore).toMatchObject({
      unitId: 'a',
      selectionStart: 5,
      selectionEnd: 10,
    });
    expect(h.result.current.writingViewRestore?.state.note?.body).toBe(
      'Keep this unfinished thought',
    );
    expect(h.result.current.writingViewRestore?.state.search?.query).toBe('glass');
    expect(h.result.current.writingViewRestore?.state.pin).toBeNull();
    expect(h.result.current.writingViewRestore?.state.outlineView).toEqual({ order: 'plan', selected: ['forest', 'return'], comparing: true });
    act(() =>
      h.result.current.acknowledgeSelection(h.result.current.selectionRestore!.requestId, true),
    );
    await waitFor(() => expect(h.scroll.scrollTop).toBe(411));
  });
  it('retains a Note draft but invalidates its attachment when source words changed', async () => {
    const h = await setup();
    act(h.result.current.prepare());
    h.setPlace({ surface: 'command' });
    h.setBody('moon cup winter');
    await act(async () => {
      await h.result.current.back();
    });
    expect(h.result.current.selectionRestore).toBeNull();
    expect(h.result.current.writingViewRestore?.state.note).toMatchObject({
      body: 'Keep this unfinished thought',
      ranges: [],
      sourceReady: false,
    });
    expect(h.result.current.notice).toMatch(/not guessed/);
  });
  it('retains the history entry after failed activation for a later retry', async () => {
    const h = await setup();
    act(h.result.current.prepare());
    h.setPlace({ surface: 'command' });
    h.activate.mockResolvedValueOnce(false);
    await act(async () => {
      await h.result.current.back();
    });
    expect(h.result.current.canBack).toBe(true);
    await act(async () => {
      await h.result.current.back();
    });
    expect(h.result.current.canBack).toBe(false);
  });
  it('can return within Writing Studio without a surface bridge and clears history on project change', async () => {
    const h = await setup();
    act(h.result.current.prepare());
    h.setPlace({ unitId: 'b' });
    await act(async () => {
      await h.result.current.back();
    });
    expect(h.activate).not.toHaveBeenCalled();
    expect(h.selectUnit).toHaveBeenCalledWith('a');
    act(h.result.current.prepare());
    h.rerender({ key: 'other:1' });
    expect(h.result.current.canBack).toBe(false);
    expect(h.result.current.selectionRestore).toBeNull();
  });
});
