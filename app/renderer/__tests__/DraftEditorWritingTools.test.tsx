import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DraftEditor, { type DraftEditorCommands } from '../DraftEditor';

afterEach(cleanup);

async function setup(source: string) {
  const change = vi.fn();
  const save = vi.fn();
  render(<DraftEditor value={source} writingTools onChange={change} onSave={save} />);
  const input = await screen.findByRole('textbox', { name: 'Draft editor' });
  const view = EditorView.findFromDOM(input)!;
  return { change, save, input, view, text: () => view.state.doc.toString() };
}

describe('Writing essentials in the existing editor', () => {
  it('guards a deliberate spelling replacement by exact current source and preserves ordinary Undo', async () => {
    let commands: DraftEditorCommands | null = null;
    const source = 'A foorrrest waits.', change = vi.fn();
    render(<DraftEditor value={source} writingTools onChange={change} onCommands={value => { commands = value; }} />);
    const input = await screen.findByRole('textbox', { name: 'Draft editor' });
    const view = EditorView.findFromDOM(input)!;
    await waitFor(() => expect(commands).not.toBeNull());
    act(() => { expect(commands!.replaceExactRange!(source, 2, 11, 'forest')).toBe(true); });
    expect(view.state.doc.toString()).toBe('A forest waits.');
    expect(change).toHaveBeenLastCalledWith('A forest waits.', [{ from: 2, to: 11, insert: 'forest' }], undefined, { before: source, group: expect.any(String) });
    act(() => { expect(commands!.replaceExactRange!(source, 2, 10, 'tree')).toBe(false); });
    act(() => commands!.undo());
    expect(view.state.doc.toString()).toBe(source);
    act(() => { expect(commands!.replaceExactRange!(source, -1, 10, 'tree')).toBe(false); });
  });
  it('formats only selected words and saves exact Markdown; Undo and Redo preserve surrounding prose', async () => {
    const e = await setup('Before red shirt after.');
    act(() => e.view.dispatch({ selection: { anchor: 7, head: 10 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Bold selected words' }));
    expect(e.text()).toBe('Before **red** shirt after.');
    expect(e.input.querySelector('strong')).toHaveTextContent('red');
    expect(e.input.textContent).toBe('Before red shirt after.');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('Before red shirt after.');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    expect(e.text()).toBe('Before **red** shirt after.');
    fireEvent.keyDown(e.input, { key: 's', ctrlKey: true });
    expect(e.save).toHaveBeenLastCalledWith('Before **red** shirt after.');
  });

  it('adds and removes italic inside bold without removing the bold markers', async () => {
    const e = await setup('Before **red** after');
    act(() => e.view.dispatch({ selection: { anchor: 9, head: 12 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic selected words' }));
    expect(e.text()).toBe('Before ***red*** after');
    fireEvent.click(screen.getByRole('button', { name: 'Italic selected words' }));
    expect(e.text()).toBe('Before **red** after');
  });

  it('trims a selected line break and spaces before applying visible formatting', async () => {
    const e = await setup('forest\n\nA red shirt stays here.');
    act(() => e.view.dispatch({ selection: { anchor: 0, head: 7 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Bold selected words' }));
    expect(e.text()).toBe('**forest**\n\nA red shirt stays here.');
    expect(e.input.querySelector('strong')).toHaveTextContent('forest');
    expect(e.input.textContent).not.toContain('*');
    const from = e.text().indexOf('red shirt');
    act(() => e.view.dispatch({ selection: { anchor: from - 1, head: from + 10 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic selected words' }));
    expect(e.text()).toBe('**forest**\n\nA *red shirt* stays here.');
    expect(e.input.querySelector('em')).toHaveTextContent('red shirt');
    expect(e.input.textContent).toBe('forestA red shirt stays here.');
  });

  it('formats multiple paragraphs without moving their whitespace or exposing delimiters', async () => {
    const source = '  first line  \n\nsecond line\n';
    const e = await setup(source);
    act(() => e.view.dispatch({ selection: { anchor: 0, head: source.length } }));
    fireEvent.click(screen.getByRole('button', { name: 'Bold selected words' }));
    expect(e.text()).toBe('  **first line**  \n\n**second line**\n');
    expect([...e.input.querySelectorAll('strong')].map(node => node.textContent)).toEqual(['first line', 'second line']);
    expect(e.input.textContent).not.toContain('*');
    fireEvent.click(screen.getByRole('button', { name: 'Bold selected words' }));
    expect(e.text()).toBe(source);
    expect(e.input.querySelector('strong')).toBeNull();
  });

  it('renders nested emphasis but preserves literal stars, escaped stars and code', async () => {
    const e = await setup('***forest*** and *red shirt*. 2 * 3; \\*literal\\*; `**code**`.');
    expect(e.input.querySelector('strong em, em strong')).toHaveTextContent('forest');
    expect(e.input.querySelector('em:last-of-type')).toBeTruthy();
    expect(e.input.textContent).toContain('2 * 3');
    expect(e.input.textContent).toContain('`**code**`');
    expect(e.input.textContent).toContain('\\*literal\\*');
    expect(e.input.textContent).not.toContain('***forest***');
    expect(e.input.textContent).not.toContain('*red shirt*');
  });

  it('resolves a keyboard selection that includes only one hidden delimiter', async () => {
    const e = await setup('**forest** next');
    act(() => e.view.dispatch({ selection: { anchor: 0, head: 8 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Italic selected words' }));
    expect(e.text()).toBe('***forest*** next');
    expect(e.input.querySelector('strong em, em strong')).toHaveTextContent('forest');
    expect(e.input.textContent).toBe('forest next');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('**forest** next');
  });

  it('does not format the whole writing section for a collapsed selection', async () => {
    const e = await setup('Leave every word alone.');
    fireEvent.click(screen.getByRole('button', { name: 'Bold selected words' }));
    expect(e.text()).toBe('Leave every word alone.');
    expect(e.change).not.toHaveBeenCalled();
    expect(screen.getByText('Select words to format.')).toBeInTheDocument();
  });

  it('retains history only for exact authored replacements, never unrelated controlled source updates', async () => {
    const changed = vi.fn();
    const { rerender } = render(<DraftEditor value="shirt" writingTools onChange={changed} />);
    const input = await screen.findByRole('textbox', { name: 'Draft editor' });
    const view = EditorView.findFromDOM(input)!;
    act(() => view.dispatch({ changes: { from: 0, insert: 'Before ' }, userEvent: 'input.type' }));
    const provenance = { requestId: 'replacement-one', before: 'Before shirt', after: 'Before blouse',
      changes: [{ from: 7, to: 12, insert: 'blouse' }], kind: 'edit' as const };
    rerender(<DraftEditor value="Before blouse" writingTools onChange={changed} historyChange={provenance} />);
    expect(view.state.doc.toString()).toBe('Before blouse');
    expect(changed).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(view.state.doc.toString()).toBe('Before shirt');
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    expect(view.state.doc.toString()).toBe('shirt');
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(view.state.doc.toString()).toBe('Before shirt');
    const calls = changed.mock.calls.length;
    rerender(<DraftEditor value="Another source" writingTools onChange={changed} historyChange={provenance} />);
    fireEvent.click(screen.getByRole('button', { name: /^Undo$/u }));
    fireEvent.click(screen.getByRole('button', { name: /^Redo$/u }));
    expect(view.state.doc.toString()).toBe('Another source');
    expect(changed).toHaveBeenCalledTimes(calls);
  });

  it('uses literal search and an explicit Replace all action with one undo', async () => {
    const e = await setup('One. Two. Leave!');
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), { target: { value: '.' } });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: '?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 2 matches' }));
    expect(e.text()).toBe('One? Two? Leave!');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('One. Two. Leave!');
  });

  it('limits replacement to the selected words and remaps that scope after replacement', async () => {
    const e = await setup('shirt shirt shirt');
    act(() => e.view.dispatch({ selection: { anchor: 6, head: 11 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Scope'), { target: { value: 'selection' } });
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'shirt' },
    });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 1 matches' }));
    expect(e.text()).toBe('shirt blouse shirt');
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'blouse' },
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Replace all 1 matches' })).toBeEnabled(),
    );
  });

  it('never widens a selected-word search after Undo invalidates the scope', async () => {
    const e = await setup('shirt shirt shirt');
    act(() => e.view.dispatch({ selection: { anchor: 6, head: 11 } }));
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Scope'), { target: { value: 'selection' } });
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'shirt' },
    });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 1 matches' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(e.text()).toBe('shirt shirt shirt');
    expect(screen.getByLabelText('Scope')).toHaveValue('selection');
    expect(screen.getByRole('button', { name: 'Replace all 0 matches' })).toBeDisabled();
  });

  it('preserves exact offsets when unrelated Unicode has case mappings of a different length', async () => {
    const e = await setup('İ 🌲 shirt SHIRT');
    fireEvent.click(screen.getByRole('button', { name: 'Find & replace' }));
    fireEvent.change(screen.getByLabelText('Find', { exact: true }), {
      target: { value: 'shirt' },
    });
    fireEvent.change(screen.getByLabelText('Replace with'), { target: { value: 'blouse' } });
    fireEvent.click(screen.getByRole('button', { name: 'Replace all 2 matches' }));
    expect(e.text()).toBe('İ 🌲 blouse blouse');
  });

  it('keeps read-only writing and ordinary editor consumers free of mutation tools', () => {
    const { rerender } = render(<DraftEditor value="Read this" writingTools readOnly />);
    expect(screen.queryByRole('button', { name: 'Bold selected words' })).not.toBeInTheDocument();
    rerender(<DraftEditor value="Ordinary editor" />);
    expect(screen.queryByRole('button', { name: 'Bold selected words' })).not.toBeInTheDocument();
  });
  it('opens each inline pencil independently while Pin and Note glyphs never enter saved prose', async () => {
    const open = vi.fn();
    const save = vi.fn();
    const source = 'moon glass winter';
    render(
      <DraftEditor
        value={source}
        writingTools
        onSave={save}
        onWritingNote={open}
        writingMarks={[
          { from: 0, to: 0, kind: 'pin', label: 'Beginning of the unit' },
          { from: source.length, to: source.length, kind: 'pin', label: 'End of the unit' },
          { from: 4, to: 4, kind: 'note', id: 'one', label: 'First note' },
          { from: 10, to: 10, kind: 'note', id: 'two', label: 'Second note' },
          { from: 10, to: 10, kind: 'note', id: 'three', label: 'Third note' },
        ]}
      />,
    );
    const editor = await screen.findByRole('textbox', { name: 'Draft editor' });
    fireEvent.click(await screen.findByRole('button', { name: 'Open Note: Second note' }));
    expect(open).toHaveBeenLastCalledWith('two');
    fireEvent.click(screen.getByRole('button', { name: 'Open Note: First note' }));
    expect(open).toHaveBeenLastCalledWith('one');
    fireEvent.click(screen.getByRole('button', { name: 'Open Note: Third note' }));
    expect(open).toHaveBeenLastCalledWith('three');
    fireEvent.keyDown(editor, { key: 's', ctrlKey: true });
    expect(save).toHaveBeenLastCalledWith(source);
  });
  it('moves to the real document edges and extends selection beyond the rendered viewport', async () => {
    const source = 'forest\n' + 'A long draft paragraph.\n'.repeat(1000);
    const e = await setup(source);
    act(() => e.view.dispatch({ selection: { anchor: 4000 } }));
    fireEvent.keyDown(e.input, { key: 'Home', ctrlKey: true });
    expect(e.view.state.selection.main.head).toBe(0);
    fireEvent.keyDown(e.input, { key: 'End', ctrlKey: true, shiftKey: true });
    expect(e.view.state.selection.main.from).toBe(0);
    expect(e.view.state.selection.main.to).toBe(source.length);
    fireEvent.keyDown(e.input, { key: 'End', ctrlKey: true });
    expect(e.view.state.selection.main.empty).toBe(true);
    expect(e.view.state.selection.main.head).toBe(source.length);
  });
});
