import { fireEvent, render, screen } from '@testing-library/react';
import { act, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EditorView } from '@codemirror/view';

import DraftEditor, { buildDraftEditorSelectionEvidence } from '../DraftEditor';

const sampleSceneMarkdown = `---
id: sc_0001
slug: basement-pulse
title: Basement Pulse
pov: Mara Ibarra
---
Mara Ibarra enters Basement Pulse and maps the sealed corridor.`;

describe('DraftEditor', () => {
  it('builds exact UTF-16 selection evidence with deterministic source and selection fingerprints', async () => {
    const astralCharacter = String.fromCodePoint(0x1f30c);
    const source = `Before ${astralCharacter} after`;
    const selectionStart = 'Before '.length;
    const selectionEnd = selectionStart + astralCharacter.length;
    const evidence = await buildDraftEditorSelectionEvidence(
      source,
      selectionStart,
      selectionEnd,
      12,
    );

    expect(evidence).toEqual({
      selectionStart,
      selectionEnd,
      selectedText: astralCharacter,
      editorRevision: 12,
      sourceFingerprint: '786dea71246fb66bbf29152592c8261da652e06ffc53ae1a3ac596bdc90ea3da',
      selectionFingerprint: 'fe436484db81102e533cc2197fdc65b4c3d7e5322c7080d77c81df15b4f2c894',
    });
  });
  it('renders the sample scene title and body', async () => {
    render(
      <DraftEditor
        value={sampleSceneMarkdown}
        readOnly
        placeholder="Draft body placeholder"
      />,
    );

    const title = await screen.findByText(/title:\s*Basement Pulse/i);
    expect(title).toBeTruthy();

    const bodyLine = await screen.findByText(
      /Mara Ibarra enters Basement Pulse/i,
    );
    expect(bodyLine).toBeTruthy();
  });

  it('keeps line numbers as unit-local presentation references, never saved prose', async () => {
    const onSave = vi.fn();
    const source = 'First line\n\nThird line\n';
    const { container, rerender } = render(<DraftEditor value={source} onSave={onSave} />);
    const textbox = await screen.findByRole('textbox', { name: 'Draft editor' });
    const gutterLines = () => [...container.querySelectorAll('.cm-lineNumbers .cm-gutterElement')]
      .filter((node) => (node as HTMLElement).style.visibility !== 'hidden')
      .map((node) => node.textContent);

    await waitFor(() => expect(gutterLines()).toEqual(['1', '2', '3', '']));
    expect(container.querySelector('.cm-content')).toHaveTextContent('First line');
    fireEvent.keyDown(textbox, { key: 's', ctrlKey: true });
    expect(onSave).toHaveBeenCalledWith(source);

    rerender(<DraftEditor value="Second unit only" onSave={onSave} />);
    await waitFor(() => expect(gutterLines()).toEqual(['1']));
    expect(onSave.mock.calls[0]?.[0]).not.toContain('1First line');
  });

  it('keeps the editor shell full-height so the preview can occupy a visible viewport', () => {
    const { container } = render(
      <DraftEditor
        value={sampleSceneMarkdown}
        readOnly
        placeholder="Draft body placeholder"
      />,
    );

    expect(container.querySelector('.draft-editor')).toHaveStyle({ minHeight: '100%' });
  });

  it('applies fallback accessibility metadata when no labels are provided', async () => {
    const { container } = render(
      <DraftEditor
        value=""
        placeholder="Draft body placeholder"
      />,
    );

    const textbox = await screen.findByRole('textbox', { name: 'Draft editor' });
    expect(textbox).toHaveAttribute('aria-label', 'Draft editor');

    const scroller = container.querySelector<HTMLDivElement>('.cm-scroller');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveAttribute('role', 'region');
    expect(scroller).toHaveAttribute('aria-label', 'Draft editor');
    expect(scroller).toHaveAttribute('tabindex', '0');

    scroller?.focus();
    fireEvent.focus(scroller as Element);

    expect(document.activeElement).toBe(textbox);
  });

  it('honors labelled-by and described-by attributes', async () => {
    const { container } = render(
      <div>
        <h3 id="scene-title">Scene: Basement Pulse</h3>
        <p id="scene-meta">Scene metadata for accessibility.</p>
        <DraftEditor
          value=""
          placeholder="Draft body placeholder"
          ariaLabel={null}
          ariaLabelledBy="scene-title"
          ariaDescribedBy="scene-meta"
        />
      </div>,
    );

    const textbox = await screen.findByRole('textbox', { name: 'Scene: Basement Pulse' });
    expect(textbox).not.toHaveAttribute('aria-label', 'Draft editor');
    expect(textbox).toHaveAttribute('aria-labelledby', 'scene-title');
    expect(textbox).toHaveAttribute('aria-describedby', 'scene-meta');

    const scroller = container.querySelector<HTMLDivElement>('.cm-scroller');
    expect(scroller).not.toBeNull();
    expect(scroller).toHaveAttribute('aria-labelledby', 'scene-title');
    expect(scroller).toHaveAttribute('aria-describedby', 'scene-meta');
  });

  it('routes Ctrl+S with the editor document read synchronously from CodeMirror', async () => {
    const onSave = vi.fn();
    render(<DraftEditor value="Settled editor prose" onSave={onSave} />);
    const textbox = await screen.findByRole('textbox', { name: 'Draft editor' });

    fireEvent.keyDown(textbox, { key: 's', ctrlKey: true });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('Settled editor prose');
  });

  it('restores and focuses an exact fingerprint-bound source selection', async () => {
    const source = 'Before the signal, Mara waited. After the signal, she ran.';
    const selectionStart = source.indexOf('Mara');
    const selectionEnd = selectionStart + 'Mara waited'.length;
    const evidence = await buildDraftEditorSelectionEvidence(
      source,
      selectionStart,
      selectionEnd,
      0,
    );
    const onSelectionRestoreResult = vi.fn();
    render(
      <DraftEditor
        value={source}
        selectionRestore={{
          requestId: 'review-1',
          selectionStart,
          selectionEnd,
          selectionFingerprint: evidence.selectionFingerprint,
        }}
        onSelectionRestoreResult={onSelectionRestoreResult}
      />,
    );

    const textbox = await screen.findByRole('textbox', { name: 'Draft editor' });
    await waitFor(() => expect(onSelectionRestoreResult).toHaveBeenCalledWith('review-1', true));
    expect(textbox).toHaveFocus();
  });

  it('restores an exact cursor-position anchor', async () => {
    const source = 'A cursor belongs here.';
    const evidence = await buildDraftEditorSelectionEvidence(source, 9, 9, 2);
    const onSelectionRestoreResult = vi.fn();
    render(
      <DraftEditor
        value={source}
        selectionRestore={{
          requestId: 'cursor-return',
          selectionStart: 9,
          selectionEnd: 9,
          selectionFingerprint: evidence.selectionFingerprint,
        }}
        onSelectionRestoreResult={onSelectionRestoreResult}
      />,
    );
    await waitFor(() => expect(onSelectionRestoreResult).toHaveBeenCalledWith('cursor-return', true));
  });

  it('refuses a stale source-return selection without moving editor focus', async () => {
    const onSelectionRestoreResult = vi.fn();
    render(
      <DraftEditor
        value="The source passage changed."
        selectionRestore={{
          requestId: 'review-stale',
          selectionStart: 0,
          selectionEnd: 10,
          selectionFingerprint: 'f'.repeat(64),
        }}
        onSelectionRestoreResult={onSelectionRestoreResult}
      />,
    );

    const textbox = await screen.findByRole('textbox', { name: 'Draft editor' });
    await waitFor(() => expect(onSelectionRestoreResult).toHaveBeenCalledWith('review-stale', false));
    expect(textbox).not.toHaveFocus();
  });
});

describe('DraftEditor measured source return', () => {
  let restoreRangeMeasurement: (() => void) | undefined;

  afterEach(() => {
    vi.restoreAllMocks();
    restoreRangeMeasurement?.();
    restoreRangeMeasurement = undefined;
  });

  async function renderMeasuredReturn() {
    const source = 'Before the signal, Mara waited. After the signal, she ran.';
    const selectionStart = source.indexOf('Mara');
    const selectionEnd = selectionStart + 'Mara waited'.length;
    const evidence = await buildDraftEditorSelectionEvidence(source, selectionStart, selectionEnd, 0);
    const rangeDescriptor = Object.getOwnPropertyDescriptor(Range.prototype, 'getClientRects');
    Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
    restoreRangeMeasurement = () => {
      if (rangeDescriptor) Object.defineProperty(Range.prototype, 'getClientRects', rangeDescriptor);
      else Reflect.deleteProperty(Range.prototype, 'getClientRects');
    };

    // Keep the real editor/document/selection, controlling only its layout clock.
    // Pixel visibility remains the responsibility of the unchanged Electron case.
    const measurements: Array<{
      view: EditorView;
      request: NonNullable<Parameters<EditorView['requestMeasure']>[0]>;
    }> = [];
    vi.spyOn(EditorView.prototype, 'requestMeasure').mockImplementation(function (this: EditorView, request) {
      if (request) measurements.push({ view: this, request });
    });
    let geometry: { top: number | undefined; height: number } = { top: 550, height: 8_965 };
    vi.spyOn(EditorView.prototype, 'coordsAtPos').mockImplementation(() => geometry.top === undefined
      ? null
      : { top: geometry.top, bottom: geometry.top + 20, left: 0, right: 100 });
    vi.spyOn(EditorView.prototype, 'contentHeight', 'get').mockImplementation(() => geometry.height);
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 1;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = nextFrame++;
      frames.set(id, callback);
      return id;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => { frames.delete(id); });
    const onSelectionRestoreResult = vi.fn();
    const onChange = vi.fn();
    const props = {
      value: source,
      selectionRestore: { requestId: 'measured-return', selectionStart, selectionEnd,
        selectionFingerprint: evidence.selectionFingerprint },
      onSelectionRestoreResult,
      onChange,
    };
    const rendered = render(<DraftEditor {...props} />);
    await waitFor(() => expect(measurements).toHaveLength(1));
    const view = measurements[0]!.view;
    const dispatch = vi.spyOn(view, 'dispatch');
    const measure = (nextGeometry = geometry) => {
      geometry = nextGeometry;
      const pending = measurements.shift();
      expect(pending).toBeDefined();
      act(() => {
        const measured = pending!.request.read(pending!.view);
        pending!.request.write?.(measured, pending!.view);
      });
    };
    const advanceFrame = () => {
      const pending = [...frames.entries()];
      frames.clear();
      act(() => { for (const [, callback] of pending) callback(16); });
    };
    return { ...rendered, props, view, dispatch, measurements, frames, measure, advanceFrame,
      source, onChange, onSelectionRestoreResult };
  }

  it('waits for changed wrapped geometry to settle without changing prose or selection', async () => {
    const h = await renderMeasuredReturn();
    h.measure({ top: 550, height: 8_965 });
    expect(h.onSelectionRestoreResult).not.toHaveBeenCalled();
    h.advanceFrame();
    h.measure({ top: 205, height: 5_548 });
    expect(h.onSelectionRestoreResult).not.toHaveBeenCalled();
    h.advanceFrame();
    h.measure({ top: 205, height: 5_548 });
    expect(h.onSelectionRestoreResult.mock.calls).toEqual([['measured-return', true]]);
    expect(h.frames.size).toBe(0);
    expect(h.measurements).toHaveLength(0);
    expect(h.view.state.doc.toString()).toBe(h.source);
    expect(h.view.state.selection.main.from).toBe(h.props.selectionRestore.selectionStart);
    expect(h.view.state.selection.main.to).toBe(h.props.selectionRestore.selectionEnd);
    expect(h.onChange).not.toHaveBeenCalled();
    h.unmount();
  });

  it.each(['unstable', 'unavailable'] as const)('bounds %s geometry without claiming measured viewport visibility', async (kind) => {
    const h = await renderMeasuredReturn();
    for (let index = 0; index < 6; index += 1) {
      if (index > 0) h.advanceFrame();
      h.measure({ top: kind === 'unavailable' ? undefined : index * 50, height: 5_000 + index * 100 });
      if (index < 5) expect(h.onSelectionRestoreResult).not.toHaveBeenCalled();
    }
    // true acknowledges the still-current restored selection, not viewport truth.
    expect(h.onSelectionRestoreResult.mock.calls).toEqual([['measured-return', true]]);
    expect(h.frames.size).toBe(0);
    expect(h.measurements).toHaveLength(0);
    expect(h.onChange).not.toHaveBeenCalled();
    h.unmount();
  });

  it('keeps an equivalent inline request rerender in the same pending operation', async () => {
    const h = await renderMeasuredReturn();
    h.measure();
    h.rerender(<DraftEditor {...h.props} selectionRestore={{ ...h.props.selectionRestore }} />);
    expect(h.frames.size).toBe(1);
    h.advanceFrame();
    h.measure();
    expect(h.onSelectionRestoreResult.mock.calls).toEqual([['measured-return', true]]);
    expect(h.measurements).toHaveLength(0);
    h.unmount();
  });

  it('cancels a pending frame on unmount without acknowledging the request', async () => {
    const h = await renderMeasuredReturn();
    h.measure();
    expect(h.frames.size).toBe(1);
    h.unmount();
    expect(h.frames.size).toBe(0);
    h.advanceFrame();
    expect(h.onSelectionRestoreResult).not.toHaveBeenCalled();
  });

  it('supersedes an earlier request without acknowledging its pending frame', async () => {
    const h = await renderMeasuredReturn();
    h.measure();
    h.rerender(<DraftEditor {...h.props} selectionRestore={{ ...h.props.selectionRestore, requestId: 'new-return' }} />);
    expect(h.frames.size).toBe(0);
    await waitFor(() => expect(h.measurements).toHaveLength(1));
    h.measure();
    h.advanceFrame();
    h.measure();
    expect(h.onSelectionRestoreResult.mock.calls).toEqual([['new-return', true]]);
    h.unmount();
  });

  it.each(['document', 'selection'] as const)('stops an obsolete frame after an intervening %s edit', async (kind) => {
    const h = await renderMeasuredReturn();
    h.measure();
    act(() => {
      h.view.dispatch(kind === 'document'
        ? { changes: { from: 0, to: h.view.state.doc.length, insert: 'Edited' } }
        : { selection: { anchor: 0 } });
    });
    const callsAfterEdit = h.dispatch.mock.calls.length;
    h.advanceFrame();
    expect(h.dispatch).toHaveBeenCalledTimes(callsAfterEdit);
    expect(h.onSelectionRestoreResult.mock.calls).toEqual([['measured-return', false]]);
    expect(h.frames.size).toBe(0);
    expect(h.measurements).toHaveLength(0);
    h.unmount();
  });

  it('rejects a changed document before reading its queued layout measurement', async () => {
    const h = await renderMeasuredReturn();
    act(() => { h.view.dispatch({ changes: { from: 0, to: h.view.state.doc.length, insert: 'Edited' } }); });
    h.measure();
    expect(h.onSelectionRestoreResult.mock.calls).toEqual([['measured-return', false]]);
    expect(h.frames.size).toBe(0);
    h.unmount();
  });
});
