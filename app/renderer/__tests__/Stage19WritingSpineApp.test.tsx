import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ProjectSpineBridge,
  ProjectSpineResult,
  ProjectSpineSessionSnapshot,
  ProjectSpineWindowRole,
} from '../../shared/ipc/projectSpine';
import Stage19WritingSpineApp from '../Stage19WritingSpineApp';

vi.mock('../DraftEditor', () => ({
  default: ({
    value,
    onChange,
    ariaLabel,
    placeholder,
  }: {
    value: string;
    onChange?: (value: string) => void;
    ariaLabel?: string | null;
    placeholder?: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? 'Draft editor'}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

function markdown(id: string, title: string, order: number, body: string): string {
  return `---\nid: ${id}\ntitle: ${JSON.stringify(title)}\norder: ${order}\n---\n${body}\n`;
}

function snapshot(
  role: ProjectSpineWindowRole,
  options: {
    projectId?: string;
    path?: string;
    title?: string;
    activeUnitId?: string | null;
    units?: Array<{ id: string; title: string; order: number; body: string }>;
    generation?: number;
  } = {},
): ProjectSpineSessionSnapshot {
  const units = options.units ?? [
    { id: 'unit_a', title: 'First Unit', order: 1, body: 'Alpha body' },
    { id: 'unit_b', title: '', order: 2, body: 'Beta body' },
  ];
  return {
    schemaVersion: 1,
    role,
    generation: options.generation ?? 1,
    revision: 1,
    project: {
      projectId: options.projectId ?? 'proj_a',
      path: options.path ?? 'C:\\projects\\a',
      title: options.title ?? 'Project A',
      schemaVersion: 'ProjectMetadataSchema v1',
      units: units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        displayTitle: unit.title || 'Untitled',
        order: unit.order,
      })),
      ...(role === 'writing'
        ? {
            drafts: Object.fromEntries(
              units.map((unit) => [unit.id, markdown(unit.id, unit.title, unit.order, unit.body)]),
            ),
          }
        : {}),
    },
    activeUnitId: options.activeUnitId === undefined ? units[0]?.id ?? null : options.activeUnitId,
    recentProjects: [],
    dirtyUnitIds: [],
    saveState: { status: 'clean', unitId: null, message: null },
    lastError: null,
  };
}

function createBridge(initial: ProjectSpineSessionSnapshot) {
  let current = initial;
  const listeners = new Set<(next: ProjectSpineSessionSnapshot) => void>();
  const emit = (next: ProjectSpineSessionSnapshot) => {
    current = next;
    for (const listener of listeners) listener(next);
  };
  const ok = <T,>(data: T, next = current): ProjectSpineResult<T> => ({
    ok: true,
    data,
    snapshot: next,
  });

  const bridge = {
    windowRole: initial.role,
    chooseDirectory: vi.fn().mockResolvedValue({ canceled: true }),
    openProject: vi.fn(async () => ok({ activation: 'activated' as const })),
    createProject: vi.fn(async () => ok({ activation: 'activated' as const })),
    getSession: vi.fn(async () => current),
    removeRecent: vi.fn(async () => ok({})),
    subscribeSession: vi.fn((listener: (next: ProjectSpineSessionSnapshot) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    selectUnit: vi.fn(async (request: { unitId: string | null }) => {
      const next = { ...current, activeUnitId: request.unitId };
      current = next;
      return ok({}, next);
    }),
    ...(initial.role === 'writing'
      ? {
          setUnitDirty: vi.fn(async (request: { unitId: string; dirty: boolean }) => {
            const dirtyUnitIds = request.dirty
              ? [...new Set([...current.dirtyUnitIds, request.unitId])]
              : current.dirtyUnitIds.filter((id) => id !== request.unitId);
            current = {
              ...current,
              revision: current.revision + 1,
              dirtyUnitIds,
              saveState: request.dirty
                ? { status: 'dirty' as const, unitId: request.unitId, message: null }
                : { status: 'clean' as const, unitId: null, message: null },
            };
            return ok({}, current);
          }),
          saveUnit: vi.fn(async (request: { unitId: string; markdown: string }) => {
            current = {
              ...current,
              revision: current.revision + 1,
              project: current.project
                ? {
                    ...current.project,
                    drafts: { ...current.project.drafts, [request.unitId]: request.markdown },
                  }
                : null,
              dirtyUnitIds: current.dirtyUnitIds.filter((id) => id !== request.unitId),
              saveState: { status: 'saved' as const, unitId: request.unitId, message: null },
            };
            return ok({}, current);
          }),
          createUnit: vi.fn(async () => ok({ unitId: 'unit_new' })),
          renameUnit: vi.fn(async () => ok({})),
          reorderUnits: vi.fn(async () => ok({})),
          deleteUnit: vi.fn(async () => ok({})),
        }
      : {}),
  } as unknown as ProjectSpineBridge;

  return { bridge, emit, get current() { return current; } };
}

afterEach(() => {
  delete window.projectSpine;
  delete document.body.dataset.stage19Spine;
});

beforeEach(() => {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value: vi.fn(() => ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* iterator() {},
    })),
  });
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: vi.fn(() => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })),
  });
});

describe('Stage19WritingSpineApp', () => {
  it('renders a role-projected Command Center with no prose or structural mutation controls', async () => {
    const harness = createBridge(snapshot('command'));
    render(<Stage19WritingSpineApp windowRole="command" bridge={harness.bridge} />);

    expect(await screen.findByRole('heading', { name: 'Project A' })).toBeVisible();
    expect(screen.getByText('proj_a')).toBeVisible();
    expect(screen.getByRole('button', { name: /First Unit/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /Untitled/i })).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Save$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Create unit/i })).not.toBeInTheDocument();
    expect(document.querySelector('[data-stage19-role="command"]')).toHaveAttribute(
      'data-primary-scroll-container',
      'true',
    );
  });

  it('renders Writing Studio as the only prose-editing and structural authority', async () => {
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' })).toHaveValue('Alpha body\n');
    expect(screen.queryByText(/id: unit_a/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create unit' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Update title' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete unit…' })).toBeVisible();
    expect(document.querySelector('[data-stage19-role="writing"]')).toHaveAttribute(
      'data-primary-scroll-container',
      'true',
    );
  });

  it('routes create, title, reorder, and delete actions through Writing-only bindings', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Create unit' }));
    });
    expect(harness.bridge.createUnit).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_a',
        generation: 1,
        title: '',
      }),
    );

    const titleInput = screen.getByLabelText('Selected unit title');
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Renamed Unit');
      await user.click(screen.getByRole('button', { name: 'Update title' }));
    });
    expect(harness.bridge.renameUnit).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'unit_a', title: 'Renamed Unit' }),
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Move down' }));
    });
    expect(harness.bridge.reorderUnits).toHaveBeenCalledWith(
      expect.objectContaining({ orderedUnitIds: ['unit_b', 'unit_a'] }),
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Delete unit…' }));
    });
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(harness.bridge.deleteUnit).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'unit_a', confirmNonEmpty: true }),
    );
    confirm.mockRestore();
  });

  it('keeps unsaved prose isolated by unit while navigating', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const firstEditor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(firstEditor);
      await user.type(firstEditor, ' changed');
    });
    await waitFor(() => expect(harness.bridge.setUnitDirty).toHaveBeenCalled());

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /02\s+Untitled/i }));
    });
    expect(await screen.findByRole('textbox', { name: 'Manuscript editor: Untitled' })).toHaveValue('Beta body\n');
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /01\s+First Unit/i }));
    });
    await waitFor(() => {
      const value = (screen.getByRole('textbox', {
        name: 'Manuscript editor: First Unit',
      }) as HTMLTextAreaElement).value;
      expect(value).toMatch(/changed.*Alpha body|Alpha body.*changed/s);
    });
  });

  it('routes Ctrl+S through the generation-bound durable save contract', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' saved text');
      fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    });

    await waitFor(() => expect(harness.bridge.saveUnit).toHaveBeenCalledTimes(1));
    expect(vi.mocked(harness.bridge.saveUnit!)).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_a',
        projectPath: 'C:\\projects\\a',
        generation: 1,
        unitId: 'unit_a',
        expectedMarkdown: expect.stringContaining('Alpha body'),
        markdown: expect.stringMatching(/saved text.*Alpha body|Alpha body.*saved text/s),
      }),
    );
    expect(await screen.findByText('Saved durably')).toBeVisible();
  });

  it('applies the authoritative dirty and saved result immediately in Writing Studio', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await user.type(editor, ' immediate state');
    expect(await screen.findByText('1 unsaved unit')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved durably')).toBeVisible();
    expect(harness.current.dirtyUnitIds).toEqual([]);
  });

  it('retains editor content and dirty truth when durable save fails', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.saveUnit!).mockImplementation(async () => ({
      ok: false,
      error: { code: 'SAVE_FAILED', message: 'Disk is read-only.' },
      snapshot: {
        ...harness.current,
        dirtyUnitIds: ['unit_a'],
        saveState: { status: 'save-failed', unitId: 'unit_a', message: 'Disk is read-only.' },
      },
    }));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });

    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' retained after failure');
      await user.click(screen.getByRole('button', { name: /^Save$/ }));
    });

    expect(await screen.findByText(/Save failed: Disk is read-only/)).toBeVisible();
    expect((screen.getByRole('textbox', {
      name: 'Manuscript editor: First Unit',
    }) as HTMLTextAreaElement).value).toContain('retained after failure');
  });

  it('requires explicit discard confirmation before a dirty project switch', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    vi.mocked(harness.bridge.chooseDirectory).mockResolvedValue({
      canceled: false,
      path: 'C:\\projects\\b',
    });
    const projectB = snapshot('writing', {
      projectId: 'proj_b',
      path: 'C:\\projects\\b',
      title: 'Project B',
      generation: 2,
      units: [],
    });
    vi.mocked(harness.bridge.openProject).mockImplementation(async (request) =>
      request.discardUnsaved
        ? { ok: true, data: { activation: 'activated' }, snapshot: projectB }
        : {
            ok: false,
            error: { code: 'UNSAVED_CHANGES', message: 'Unsaved manuscript changes.' },
            snapshot: harness.current,
          },
    );
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);

    const openButton = await screen.findByRole('button', { name: 'Open project…' });

    await act(async () => {
      await user.click(openButton);
    });

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(harness.bridge.openProject).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: 'C:\\projects\\b', discardUnsaved: false }),
    );
    expect(harness.bridge.openProject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: 'C:\\projects\\b', discardUnsaved: true }),
    );
    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    confirm.mockRestore();
  });

  it('clears project-bound buffers when a new project generation arrives', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' Project A only');
    });

    await act(async () => {
      harness.emit(
        snapshot('writing', {
          projectId: 'proj_b',
          path: 'C:\\projects\\b',
          title: 'Project B',
          generation: 2,
          units: [{ id: 'unit_b1', title: 'B Unit', order: 1, body: 'Project B prose' }],
        }),
      );
    });

    expect(await screen.findByRole('heading', { name: 'Project B' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: B Unit' })).toHaveValue('Project B prose\n');
    expect(screen.getByRole('textbox', { name: 'Manuscript editor: B Unit' })).not.toHaveValue(
      expect.stringContaining('Project A only'),
    );
  });

  it('prevents unload while local edits remain unsaved', async () => {
    const user = userEvent.setup();
    const harness = createBridge(snapshot('writing'));
    render(<Stage19WritingSpineApp windowRole="writing" bridge={harness.bridge} />);
    const editor = await screen.findByRole('textbox', { name: 'Manuscript editor: First Unit' });
    await act(async () => {
      await user.click(editor);
      await user.type(editor, ' unsaved');
    });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
