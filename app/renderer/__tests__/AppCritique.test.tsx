import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

import { DEFAULT_RUNTIME_CONFIG } from '../../shared/config/runtime';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  DraftCritiqueBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';

declare global {
  interface Window {
    services?: ServicesBridge;
    __TEST_PROJECT_HOME_EDITED_DRAFT?: string;
  }
}

const loadedProject: LoadedProject = {
  path: '/projects/demo',
  name: 'Demo Project',
  outline: {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_demo',
    acts: [],
    chapters: [],
    scenes: [
      {
        id: 'sc_0001',
        order: 1,
        title: 'Arrival',
        chapter_id: 'ch_0001',
        beat_refs: ['inciting'],
        purpose: 'escalation',
        emotion_tag: 'respite',
      },
    ],
  },
  scenes: [
    {
      id: 'sc_0001',
      title: 'Arrival',
      order: 1,
      purpose: 'escalation',
      emotion_tag: 'respite',
      word_target: 900,
    },
  ],
  drafts: {
    sc_0001:
      'The cellar hums with static and distant thunder.\n\nShe braces for the next surge.',
  },
};

type ProjectHomeMockProps = {
  onProjectLoaded?: (event: {
    status: 'init' | 'loaded';
    project: LoadedProject | null;
    targetPath: string | null;
    lastOpenedPath: string | null;
  }) => void;
  onActiveSceneChange?: (payload: { sceneId: string; sceneTitle: string | null; draft: string }) => void;
  onDraftChange?: (sceneId: string, draft: string) => void;
  draftOverrides?: Record<string, string>;
};

function ProjectHomeMock({
  onProjectLoaded,
  onActiveSceneChange,
  onDraftChange,
  draftOverrides,
}: ProjectHomeMockProps): JSX.Element {
  const bootstrappedRef = useRef(false);
  const lastDraftRef = useRef<string | null>(null);
  const [visibleDraft, setVisibleDraft] = useState(loadedProject.drafts.sc_0001);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;
    onProjectLoaded?.({
      status: 'init',
      project: null,
      targetPath: null,
      lastOpenedPath: loadedProject.path,
    });
    onProjectLoaded?.({
      status: 'loaded',
      project: loadedProject,
      targetPath: loadedProject.path,
      lastOpenedPath: loadedProject.path,
    });

    const draftText = draftOverrides?.sc_0001 ?? visibleDraft;
    const editedDraft =
      typeof window.__TEST_PROJECT_HOME_EDITED_DRAFT === 'string'
        ? window.__TEST_PROJECT_HOME_EDITED_DRAFT
        : draftText;
    lastDraftRef.current = draftText;
    setVisibleDraft(editedDraft);
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: draftText });
    onDraftChange?.('sc_0001', editedDraft);
  }, [draftOverrides, onActiveSceneChange, onDraftChange, onProjectLoaded, visibleDraft]);

  useEffect(() => {
    if (!bootstrappedRef.current) {
      return;
    }
    const draftText = draftOverrides?.sc_0001 ?? visibleDraft;
    if (lastDraftRef.current === draftText) {
      return;
    }
    lastDraftRef.current = draftText;
    setVisibleDraft(draftText);
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: draftText });
    onDraftChange?.('sc_0001', draftText);
  }, [draftOverrides, onActiveSceneChange, onDraftChange, visibleDraft]);

  return (
    <div
      data-testid="project-home-mock"
      data-draft={draftOverrides?.sc_0001 ?? visibleDraft}
    />
  );
}

vi.mock('../components/ProjectHome', () => ({
  __esModule: true,
  default: ProjectHomeMock,
}));

vi.mock('../components/WizardPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="wizard-panel-mock" />,
}));

function createServices(): ServicesBridge {
  return {
    checkHealth: vi.fn().mockResolvedValue({ ok: true, data: { status: 'online' } }),
    buildOutline: vi
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          schema_version: 'OutlineSchema v1',
          outline_id: 'outline',
          acts: [],
          chapters: [],
          scenes: [],
        },
      }),
    generateDraft: vi
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          draft_id: 'dr_generated',
          schema_version: 'DraftUnitSchema v1',
          units: [],
        },
      }),
    critiqueDraft: vi.fn().mockResolvedValue({ ok: true, data: { summary: 'ok' } }),
    rewriteDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: { unit_id: 'sc_0001', revised_text: '' },
    }),
    phase4Critique: vi.fn().mockResolvedValue({
      ok: true,
      data: { summary: '', issues: [], suggestions: [] },
    }),
    phase4Rewrite: vi.fn().mockResolvedValue({
      ok: true,
      data: { revisedText: '' },
    }),
    preflightDraft: vi
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          projectId: 'demo',
          unitScope: 'scene',
          unitIds: ['sc_0001'],
          model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
          scenes: [{ id: 'sc_0001', title: 'Arrival', order: 1 }],
          budget: { estimated_usd: 1.5, status: 'ok' },
        },
      }),
    acceptDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        checksum: 'abcd',
        snapshot: {
          snapshot_id: 'modern',
          label: 'accept',
          created_at: '2024-01-01T00:00:00Z',
          path: '',
        },
        schema_version: 'DraftAcceptResult v1',
      },
    }),
    exportProject: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo',
        path: 'exports/demo.md',
        format: 'md',
        chapters: 1,
        scenes: 1,
        meta_header: false,
        exported_at: '2050-01-01T00:00:00Z',
        schema_version: 'ProjectExportResult v1',
      },
    }),
    createSnapshot: vi.fn().mockResolvedValue({ ok: true, data: {} }),
    getRecoveryStatus: vi.fn().mockResolvedValue({
      ok: true,
      data: { project_id: 'demo', status: 'idle', needs_recovery: false },
    }),
    restoreSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: { project_id: 'demo', status: 'idle', needs_recovery: false },
    }),
  };
}

function enableSplitCommandWorkspace(): void {
  (
    window as typeof window & {
      __runtimeConfigOverride?: typeof DEFAULT_RUNTIME_CONFIG;
    }
  ).__runtimeConfigOverride = {
    ...DEFAULT_RUNTIME_CONFIG,
    ui: {
      ...DEFAULT_RUNTIME_CONFIG.ui,
      experimentalSplitCommandWorkspace: true,
    },
  };
}

describe('App critique + rewrite loop', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServices();
    window.services = services;
  });

  afterEach(() => {
    delete window.services;
    delete window.__TEST_PROJECT_HOME_EDITED_DRAFT;
    delete (window as typeof window & { __BLACKSKIES_PHASE4_MOCK?: boolean }).__BLACKSKIES_PHASE4_MOCK;
    delete (window as typeof window & { __runtimeConfigOverride?: unknown }).__runtimeConfigOverride;
    vi.resetAllMocks();
  });

  it('runs critique, rewrites, and applies the revision', async () => {
    const critiqueResponse: DraftCritiqueBridgeResponse = {
      unit_id: 'sc_0001',
      schema_version: 'CritiqueOutputSchema v1',
      summary: 'Summary for testing.',
      priorities: ['Add tension in the middle beat.'],
      line_comments: [{ line: 1, note: 'Sample issue.' }],
    };
    (services.critiqueDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: critiqueResponse,
      traceId: 'trace-critique',
    });
    (services.rewriteDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: { unit_id: 'sc_0001', revised_text: 'Revised scene text' },
      traceId: 'trace-rewrite',
    });

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute(
        'data-draft',
        loadedProject.drafts.sc_0001,
      ),
    );

    const critiqueButton = await screen.findByTestId('workspace-action-critique');
    fireEvent.click(critiqueButton);

    await screen.findByText(critiqueResponse.summary);
    await screen.findByText('Advisory summary');
    await screen.findByText(/route=draft\/critique/i);
    await screen.findByText(/Budget source: no budgeted action\./i);
    expect(services.critiqueDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitId: 'sc_0001',
      }),
    );
    expect(services.phase4Critique).not.toHaveBeenCalled();

    const instructions = screen.getByPlaceholderText(
      'Summarize what you want to improve, or describe the feeling to amplify.',
    );
    fireEvent.change(instructions, { target: { value: 'Add more tension' } });

    const rewriteButton = screen.getByRole('button', { name: /Generate saved rewrite/i });
    fireEvent.click(rewriteButton);

    await waitFor(() =>
      expect(services.rewriteDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'demo',
          unitId: 'sc_0001',
          instructions: 'Add more tension',
        }),
      ),
    );
    expect(services.phase4Rewrite).not.toHaveBeenCalled();

    await screen.findByText(/The rewrite has already been saved/i);
    expect(screen.getByRole('heading', { name: 'Submitted draft' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Saved rewrite' }).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole('button', { name: 'Close saved rewrite preview' }),
    ).toBeInTheDocument();
    await screen.findByText(/route=draft\/rewrite/i);

    const syncButton = screen.getByRole('button', { name: 'Sync draft view' });
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await waitFor(() =>
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute(
        'data-draft',
        'Revised scene text',
      ),
    );
    await screen.findByText('Rewrite synced');
    await screen.findByText('Local draft view updated from the saved rewrite.');
  });

  it('keeps critique advisory and non-mutative before rewrite', async () => {
    const critiqueResponse: DraftCritiqueBridgeResponse = {
      unit_id: 'sc_0001',
      schema_version: 'CritiqueOutputSchema v1',
      summary: 'Advisory-only critique result.',
      priorities: ['Clarify stakes without changing the draft.'],
      line_comments: [{ line: 1, note: 'Advisory note.' }],
    };
    (services.critiqueDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: critiqueResponse,
      traceId: 'trace-advisory',
    });

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute(
        'data-draft',
        loadedProject.drafts.sc_0001,
      ),
    );
    fireEvent.click(await screen.findByTestId('workspace-action-critique'));

    await screen.findByText(critiqueResponse.summary);
    await screen.findByText('Advisory summary');
    expect(services.rewriteDraft).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Saved rewrite' })).toBeNull();
    expect(screen.getByTestId('project-home-mock')).toHaveAttribute(
      'data-draft',
      loadedProject.drafts.sc_0001,
    );
  });

  it('surfaces backend rewrite conflicts without collapsing to generic fetch failure', async () => {
    const critiqueResponse: DraftCritiqueBridgeResponse = {
      unit_id: 'sc_0001',
      schema_version: 'CritiqueOutputSchema v1',
      summary: 'Summary for rewrite conflict testing.',
      priorities: ['Preserve continuity.'],
      line_comments: [{ line: 1, note: 'Keep stakes clear.' }],
    };
    (services.critiqueDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: critiqueResponse,
      traceId: 'trace-critique',
    });
    (services.rewriteDraft as vi.Mock).mockResolvedValue({
      ok: false,
      error: {
        code: 'CONFLICT',
        message: 'The scene on disk no longer matches the submitted draft unit.',
        details: {
          provenance: {
            route_name: 'draft/rewrite',
            provider_called: false,
            result_origin: 'fallback',
            budget_delta: null,
          },
        },
      },
      traceId: 'trace-rewrite-conflict',
    });

    render(<App />);

    const critiqueButton = await screen.findByTestId('workspace-action-critique');
    fireEvent.click(critiqueButton);
    await screen.findByText(critiqueResponse.summary);

    const rewriteButton = screen.getByRole('button', { name: /Generate saved rewrite/i });
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          'The scene changed on disk after critique. The rewrite request was not saved. Refresh the project or rerun critique, then request the rewrite again.',
        ).length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('Rewrite failed.').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Failed to fetch')).toBeNull();
    expect(screen.queryByText(/Rewrite provenance:/i)).toBeNull();
  });

  it('guards default path integrity by preferring draft routes over phase4 routes', async () => {
    const phase4Window = window as typeof window & { __BLACKSKIES_PHASE4_MOCK?: boolean };
    phase4Window.__BLACKSKIES_PHASE4_MOCK = false;

    (services.critiqueDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        schema_version: 'CritiqueOutputSchema v1',
        summary: 'Default route guard critique.',
        priorities: [],
        line_comments: [],
      } satisfies DraftCritiqueBridgeResponse,
    });
    (services.rewriteDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: { unit_id: 'sc_0001', revised_text: 'Default route guard rewrite.' },
    });

    render(<App />);

    fireEvent.click(await screen.findByTestId('workspace-action-critique'));
    await screen.findByText(/route=draft\/critique/i);
    expect(services.critiqueDraft).toHaveBeenCalledTimes(1);
    expect(services.phase4Critique).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Generate saved rewrite/i }));
    await screen.findByText(/route=draft\/rewrite/i);
    expect(services.rewriteDraft).toHaveBeenCalledTimes(1);
    expect(services.phase4Rewrite).not.toHaveBeenCalled();
  });

  it('sends rewrite payload text from active draft edits (draftEdits over projectDrafts)', async () => {
    const editedDraft = 'Edited draft text wins over project draft.';
    window.__TEST_PROJECT_HOME_EDITED_DRAFT = editedDraft;

    (services.critiqueDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        schema_version: 'CritiqueOutputSchema v1',
        summary: 'Payload-source verification critique.',
        priorities: [],
        line_comments: [],
      } satisfies DraftCritiqueBridgeResponse,
    });
    (services.rewriteDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: { unit_id: 'sc_0001', revised_text: 'Rewritten payload-source text.' },
    });

    render(<App />);

    fireEvent.click(await screen.findByTestId('workspace-action-critique'));
    await screen.findByText(/route=draft\/critique/i);
    expect(services.critiqueDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitId: 'sc_0001',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: /Generate saved rewrite/i }));
    await waitFor(() =>
      expect(services.rewriteDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          unitId: 'sc_0001',
          unit: expect.objectContaining({
            id: 'sc_0001',
            text: editedDraft,
          }),
        }),
      ),
    );
  });

  it('companion scene insights word count tracks active edited draft text', async () => {
    const editedDraft = 'one two three four five six seven';
    window.__TEST_PROJECT_HOME_EDITED_DRAFT = editedDraft;
    render(<App />);

    fireEvent.click(await screen.findByTestId('workspace-action-companion'));
    await screen.findByTestId('companion-overlay');

    const wordCountTerm = await screen.findByText('Word count');
    const statsEntry = wordCountTerm.closest('div');
    const wordCountValue = statsEntry?.querySelector('dd')?.textContent?.trim() ?? null;
    expect(wordCountValue).toBe('7');
  });

  it('opens critique through the wrapped Split Command shell', async () => {
    const critiqueResponse: DraftCritiqueBridgeResponse = {
      unit_id: 'sc_0001',
      schema_version: 'CritiqueOutputSchema v1',
      summary: 'Split Command critique smoke.',
      priorities: [],
      line_comments: [],
    };
    (services.critiqueDraft as vi.Mock).mockResolvedValue({
      ok: true,
      data: critiqueResponse,
      traceId: 'trace-critique-split-command',
    });

    enableSplitCommandWorkspace();
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    fireEvent.click(await screen.findByTestId('workspace-action-critique'));

    await screen.findByText(critiqueResponse.summary);
    expect(services.critiqueDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitId: 'sc_0001',
      }),
    );
  });
});
