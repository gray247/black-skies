import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildLivingOutlineSourceAnchor } from '../../shared/livingOutlineAnchors';
import {
  isWritingGroups,
  mapWritingOffset,
  rebaseWritingAnchor,
  subtractWritingSelection,
  writingCoverage,
  writingGroupLabel,
  planWritingMove,
  relocateWritingRange,
} from '../../shared/writingRanges';
import { LivingOutlineRepository } from '../livingOutlineRepository';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
const anchor = (unitId: string, text: string, from: number, to: number) =>
  buildLivingOutlineSourceAnchor(unitId, text, from, to);

describe('Actual prose move source mapping', () => {
  it('moves a word between saved sections and maps both its Note and destination exactly', () => {
    const bodies = { a: 'forest moon', b: 'river winter' };
    const plan = planWritingMove(['a', 'b'], bodies, [{ unitId: 'a', from: 0, to: 6 }], { unitId: 'b', offset: 0 });
    expect(plan.after).toEqual({ a: ' moon', b: 'forest\n\nriver winter' });
    expect(relocateWritingRange({ unitId: 'a', from: 1, to: 5 }, plan)).toEqual([{ unitId: 'b', from: 1, to: 5 }]);
    expect(relocateWritingRange({ unitId: 'b', from: 0, to: 5 }, plan)).toEqual([{ unitId: 'b', from: 8, to: 13 }]);
    expect(bodies).toEqual({ a: 'forest moon', b: 'river winter' });
  });

  it('preserves every original character once when one passage spans several sections', () => {
    const bodies = { a: 'A forest', b: 'moon B', c: 'river' };
    const plan = planWritingMove(['a', 'b', 'c'], bodies, [{ unitId: 'a', from: 2, to: 8 }, { unitId: 'b', from: 0, to: 4 }], { unitId: 'c', offset: 0 });
    expect(plan.after).toEqual({ a: 'A ', b: ' B', c: 'forest\n\nmoon\n\nriver' });
    expect(plan.moved).toEqual({ unitId: 'c', from: 0, to: 12 });
    for (const [id, source] of Object.entries(bodies)) {
      const pieces = plan.pieces.filter(piece => piece.source.unitId === id).sort((a, b) => a.source.from - b.source.from);
      expect(pieces.map(piece => source.slice(piece.source.from, piece.source.to)).join('')).toBe(source);
      for (const piece of pieces)
        expect(plan.after[piece.destination.unitId]!.slice(piece.destination.from, piece.destination.to)).toBe(source.slice(piece.source.from, piece.source.to));
    }
  });

  it('refuses overlapping selections, self destinations and half-surrogate boundaries', () => {
    expect(() => planWritingMove(['a'], { a: 'abcdef' }, [{ unitId: 'a', from: 0, to: 3 }, { unitId: 'a', from: 2, to: 4 }], { unitId: 'a', offset: 6 })).toThrow(/overlap/);
    expect(() => planWritingMove(['a'], { a: 'abcdef' }, [{ unitId: 'a', from: 0, to: 3 }], { unitId: 'a', offset: 2 })).toThrow(/inside/);
    expect(() => planWritingMove(['a', 'b'], { a: '🌲forest', b: 'moon' }, [{ unitId: 'a', from: 1, to: 3 }], { unitId: 'b', offset: 0 })).toThrow(/Unicode/);
    expect(() => planWritingMove(['a', 'b'], { a: 'forest', b: '🌙moon' }, [{ unitId: 'a', from: 0, to: 6 }], { unitId: 'b', offset: 1 })).toThrow(/Unicode/);
  });

  it('maps an intact surrogate pair and a position-only Note without changing their identity', () => {
    const plan = planWritingMove(['a', 'b'], { a: '🌲 forest', b: 'moon' }, [{ unitId: 'a', from: 0, to: 2 }], { unitId: 'b', offset: 0 });
    expect(plan.after.b).toBe('🌲\n\nmoon');
    expect(relocateWritingRange({ unitId: 'a', from: 1, to: 1 }, plan)).toEqual([{ unitId: 'b', from: 1, to: 1 }]);
    expect(relocateWritingRange({ unitId: 'a', from: 0, to: 2 }, plan)).toEqual([{ unitId: 'b', from: 0, to: 2 }]);
  });
});

describe('Writer-defined units preserve existing manuscript storage', () => {
  it('edge: a 30000-word draft retains one-word endpoints and exact saved source', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-writing-long-'));
    roots.push(root);
    const source = [...Array<string>(29_999).fill('forest'), '🌲'].join(' ');
    await writeFile(join(root, 'draft.md'), source);
    const groups = [
      { id: 'first', label: 'First word', spans: [await anchor('a', source, 0, 6)] },
      { id: 'last', label: 'Last word', spans: [await anchor('a', source, source.length - 2, source.length)] },
    ];
    await new LivingOutlineRepository(root).replaceWritingState('project', 0, { groups, noteAnchors: [] });
    const reopened = await new LivingOutlineRepository(root).read('project');
    expect(reopened.document.writingGroups).toEqual(groups);
    const coverage = writingCoverage('a', source.length, groups);
    expect(coverage.map(range => source.slice(range.from, range.to)).join('')).toBe(source);
    expect(source.slice(groups[1]!.spans[0]!.selectionStart)).toBe('🌲');
    expect(await readFile(join(root, 'draft.md'), 'utf8')).toBe(source);
  });

  it('edge: 1000 tiny units retain exclusive coverage through plan reversal and reopen', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-writing-tiny-'));
    roots.push(root);
    const source = Array.from({ length: 1000 }, (_, index) => `w${index}`).join(' ');
    await writeFile(join(root, 'draft.md'), source);
    const groups = await Promise.all([...source.matchAll(/\S+/gu)].map(async (match, index) => ({
      id: `tiny-${index}`, label: match[0], spans: [await anchor('a', source, match.index, match.index + match[0].length)],
    })));
    const repo = new LivingOutlineRepository(root);
    await repo.replaceWritingState('project', 0, { groups, noteAnchors: [] });
    const reversed = [...groups].reverse();
    await repo.replaceWritingState('project', 1, { groups: reversed, noteAnchors: [] });
    const reopened = await new LivingOutlineRepository(root).read('project');
    expect(reopened.document.writingGroups).toEqual(reversed);
    const coverage = writingCoverage('a', source.length, reversed);
    expect(coverage.filter(range => range.groupId)).toHaveLength(1000);
    expect(coverage.map(range => source.slice(range.from, range.to)).join('')).toBe(source);
    expect(await readFile(join(root, 'draft.md'), 'utf8')).toBe(source);
  });

  it('saves and reopens one group spanning sections without changing their files or unrelated Notes', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-writing-groups-'));
    roots.push(root);
    await writeFile(join(root, 'first.md'), 'moon glass');
    await writeFile(join(root, 'second.md'), 'winter');
    const repo = new LivingOutlineRepository(root);
    const note = await repo.create('project', 0, {
      label: 'Check the winter image',
      body: 'Keep this thought.',
      kind: 'fragment',
      state: 'authored',
      manuscriptUnitId: 'a',
      sourceAnchor: await anchor('a', 'moon glass', 0, 4),
    });
    const groups = [
      {
        id: 'one',
        label: 'moon glass winter',
        spans: [await anchor('a', 'moon glass', 0, 10), await anchor('b', 'winter', 0, 6)],
      },
    ];
    const saved = await repo.replaceWritingState('project', 1, { groups, noteAnchors: [] });
    expect(await new LivingOutlineRepository(root).read('project')).toEqual(saved);
    expect(saved.document.items).toEqual(note.document.items);
    expect(await readFile(join(root, 'first.md'), 'utf8')).toBe('moon glass');
    expect(await readFile(join(root, 'second.md'), 'utf8')).toBe('winter');
  });


  it('reopens a rearranged plan with unchanged source and Note identity', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-writing-plan-'));
    roots.push(root);
    const prose = 'forest moon winter';
    await writeFile(join(root, 'first.md'), prose);
    const repo = new LivingOutlineRepository(root);
    const noted = await repo.create('project', 0, {
      label: 'Moon', body: 'Remember the moon.', kind: 'fragment', state: 'authored',
      manuscriptUnitId: 'a', sourceAnchor: await anchor('a', prose, 7, 11),
    });
    const groups = await Promise.all([[0, 6], [7, 11], [12, 18]].map(async ([from, to], index) => ({
      id: `group-${index}`, label: prose.slice(from, to), spans: [await anchor('a', prose, from!, to!)],
    })));
    await repo.replaceWritingState('project', 1, { groups, noteAnchors: [] });
    await repo.replaceWritingState('project', 2, { groups: [groups[2]!, groups[0]!, groups[1]!], noteAnchors: [] });
    const reopened = await new LivingOutlineRepository(root).read('project');
    expect(reopened.document.writingGroups).toEqual([groups[2], groups[0], groups[1]]);
    expect(reopened.document.items).toEqual(noted.document.items);
    expect(await readFile(join(root, 'first.md'), 'utf8')).toBe(prose);
  });

  it('refuses overlapping memberships and stale revisions without replacing the stored metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-writing-groups-'));
    roots.push(root);
    const repo = new LivingOutlineRepository(root);
    const span = await anchor('a', 'forest', 0, 6);
    const saved = await repo.replaceWritingState('project', 0, {
      groups: [{ id: 'one', label: 'forest', spans: [span] }],
      noteAnchors: [],
    });
    await expect(
      repo.replaceWritingState('project', 1, {
        groups: [
          { id: 'one', label: 'forest', spans: [span] },
          { id: 'two', label: 'duplicate', spans: [span] },
        ],
        noteAnchors: [],
      }),
    ).rejects.toThrow(/overlap/);
    await expect(
      repo.replaceWritingState('project', 0, { groups: [], noteAnchors: [] }),
    ).rejects.toThrow(/changed/);
    expect(await repo.read('project')).toEqual(saved);
  });

  it('preserves a cross-section group when an unrelated selection is pinned', async () => {
    const group = {
      id: 'one',
      label: 'moon glass winter',
      spans: [await anchor('a', 'moon glass', 0, 10), await anchor('b', 'winter', 0, 6)],
    };
    expect(subtractWritingSelection([group], [{ unitId: 'c', from: 0, to: 1 }])).toEqual([group]);
  });

  it('retains both outside fragments when a selection cuts through existing units', async () => {
    const source = 'Before middle after';
    const old = { id: 'one', label: source, spans: [await anchor('a', source, 0, source.length)] };
    const range = { unitId: 'a', from: 7, to: 13 };
    const outside = subtractWritingSelection([old], [range], () => 'after');
    const replacement = {
      id: 'middle',
      label: 'middle',
      spans: [await anchor('a', source, 7, 13)],
    };
    const result = [...outside, replacement];
    expect(isWritingGroups(result, () => true)).toBe(true);
    const coverage = writingCoverage('a', source.length, result);
    expect(coverage.map((span) => source.slice(span.from, span.to)).join('')).toBe(source);
    expect(new Set(result.map((group) => group.id)).size).toBe(3);
    expect(outside.map((group) => writingGroupLabel(group, { a: source }))).toEqual([
      'Before',
      'after',
    ]);
    expect(
      writingGroupLabel(
        { ...old, customLabel: true, label: 'Opening image' },
        { a: 'Changed prose' },
      ),
    ).toBe('Opening image');
  });

  it('partitions unpinned writing together with pins in exact page order', async () => {
    const text = 'one forest ending';
    const groups = [{ id: 'forest', label: 'forest', spans: [await anchor('a', text, 4, 10)] }];
    expect(writingCoverage('a', text.length, groups)).toEqual([
      { from: 0, to: 4, groupId: null },
      { from: 4, to: 10, groupId: 'forest' },
      { from: 10, to: 17, groupId: null },
    ]);
  });

  it('maps replacement and UTF-16 edits without assigning one character to two units', async () => {
    const first = await anchor('a', 'moon winter', 0, 4);
    const second = await anchor('a', 'moon winter', 4, 11);
    const edits = [{ from: 4, to: 4, insert: '🌲' }];
    const a = rebaseWritingAnchor(first, edits);
    const b = rebaseWritingAnchor(second, edits);
    expect(a.selectionEnd).toBe(6);
    expect(b.selectionStart).toBe(6);
    expect(mapWritingOffset(0, [{ from: 0, to: 4, insert: 'forest' }])).toBe(0);
    expect(mapWritingOffset(4, [{ from: 0, to: 4, insert: 'forest' }])).toBe(6);
  });

  it('retains a source position for a completely deleted unit rather than losing its identity', async () => {
    const original = await anchor('a', 'forest', 0, 6);
    const removed = rebaseWritingAnchor(original, [{ from: 0, to: 6, insert: '' }]);
    expect(removed).toMatchObject({ anchorKind: 'position', selectionStart: 0, selectionEnd: 0 });
    expect(writingCoverage('a', 0, [{ id: 'one', label: 'forest', spans: [removed] }])).toEqual([]);
  });
});

describe('Multi-passage Notes retain one identity', () => {
  it('saves and reopens all Note passages and preserves them on a body-only edit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-note-sources-'));
    roots.push(root);
    const repo = new LivingOutlineRepository(root);
    const sources = [await anchor('a', 'moon glass', 0, 10), await anchor('b', 'winter', 0, 6)];
    const saved = await repo.create('project', 0, {
      label: 'One thought',
      body: 'Read both passages',
      kind: 'fragment',
      state: 'authored',
      manuscriptUnitId: 'a',
      sourceAnchor: sources[0],
      sourceAnchors: sources,
    });
    const reopened = await new LivingOutlineRepository(root).read('project');
    expect(reopened.document.items[0]?.sourceAnchors).toEqual(sources);
    const note = saved.document.items[0]!;
    const edited = await repo.update('project', 1, note.id, {
      label: note.label,
      body: 'Changed thought',
      kind: note.kind,
      state: note.state,
    });
    expect(edited.document.items[0]).toMatchObject({
      id: note.id,
      body: 'Changed thought',
      sourceAnchors: sources,
    });
  });
  it('requires an explicit reconnect to move a Note and preserves its identity and body', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-note-reconnect-'));
    roots.push(root);
    const repo = new LivingOutlineRepository(root);
    const saved = await repo.create('project', 0, {
      label: 'Thought',
      body: 'Keep me',
      kind: 'fragment',
      state: 'authored',
      manuscriptUnitId: 'a',
      sourceAnchor: await anchor('a', 'moon', 0, 4),
    });
    const itemId = saved.document.items[0]!.id;
    const target = await anchor('b', 'forest', 0, 6);
    await expect(
      repo.replaceWritingState('project', 1, {
        groups: [],
        noteAnchors: [{ itemId, anchor: target, anchors: [target] }],
      }),
    ).rejects.toThrow(/changed/);
    const moved = await repo.replaceWritingState('project', 1, {
      groups: [],
      noteAnchors: [{ itemId, anchor: target, anchors: [target], reconnect: true }],
    });
    expect(moved.document.items).toHaveLength(1);
    expect(moved.document.items[0]).toMatchObject({
      id: itemId,
      body: 'Keep me',
      manuscriptUnitId: 'b',
      sourceAnchors: [target],
    });
  });
  it('refuses incomplete or mismatched sources and null updates without replacing stored metadata', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bs-note-invalid-'));
    roots.push(root);
    const repo = new LivingOutlineRepository(root);
    const a = await anchor('a', 'moon', 0, 4);
    const b = await anchor('b', 'forest', 0, 6);
    await expect(
      repo.create('project', 0, {
        label: 'Thought',
        kind: 'fragment',
        state: 'authored',
        manuscriptUnitId: 'a',
        sourceAnchor: a,
        sourceAnchors: [b],
      }),
    ).rejects.toThrow(/incomplete/);
    await expect(
      repo.replaceWritingState('project', 0, { groups: [], noteAnchors: [null] } as never),
    ).rejects.toThrow(/invalid/);
    expect((await repo.read('project')).document.revision).toBe(0);
  });
});
