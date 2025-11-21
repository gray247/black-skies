import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  Phase4CritiqueBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';

declare global {
  interface Window {
    services?: ServicesBridge;
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

    const draftText = draftOverrides?.sc_0001 ?? loadedProject.drafts.sc_0001;
    lastDraftRef.current = draftText;
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: draftText });
    onDraftChange?.('sc_0001', draftText);
  }, [draftOverrides, onActiveSceneChange, onDraftChange, onProjectLoaded]);

  useEffect(() => {
    if (!bootstrappedRef.current) {
      return;
    }
    const draftText = draftOverrides?.sc_0001 ?? loadedProject.drafts.sc_0001;
    if (lastDraftRef.current === draftText) {
      return;
    }
    lastDraftRef.current = draftText;
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: draftText });
    onDraftChange?.('sc_0001', draftText);
  }, [draftOverrides, onActiveSceneChange, onDraftChange]);

  return <div data-testid="project-home-mock" />;
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

describe('App critique + rewrite loop', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServices();
    window.services = services;
  });

  afterEach(() => {
    delete window.services;
    vi.resetAllMocks();
  });

  it('runs critique, rewrites, and applies the mock revision', async () => {
    const critiqueResponse: Phase4CritiqueBridgeResponse = {
      summary: 'Mock summary for testing.',
      issues: [
        { type: 'pacing', message: 'Sample issue.', line: 1 },
      ],
      suggestions: ['Add tension in the middle beat.'],
    };
    (services.phase4Critique as vi.Mock).mockResolvedValue({
      ok: true,
      data: critiqueResponse,
      traceId: 'trace-critique',
    });
    (services.phase4Rewrite as vi.Mock).mockResolvedValue({
      ok: true,
      data: { revisedText: '[REWRITE MOCK] Revised scene text' },
      traceId: 'trace-rewrite',
    });

    render(<App />);

    const critiqueButton = await screen.findByTestId('workspace-action-critique');
    fireEvent.click(critiqueButton);

    await screen.findByText(critiqueResponse.summary);
    expect(services.phase4Critique).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        sceneId: 'sc_0001',
        text: loadedProject.drafts.sc_0001,
        mode: 'pacing',
      }),
    );

    const instructions = screen.getByPlaceholderText(
      'Summarize what you want to improve, or describe the feeling to amplify.',
    );
    fireEvent.change(instructions, { target: { value: 'Add more tension' } });

    const rewriteButton = screen.getByRole('button', { name: /Generate rewrite/i });
    fireEvent.click(rewriteButton);

    await waitFor(() =>
      expect(services.phase4Rewrite).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'demo',
          sceneId: 'sc_0001',
          instructions: 'Add more tension',
        }),
      ),
    );

    await screen.findByText('Rewrite preview');

    const applyButton = screen.getByRole('button', { name: 'Apply rewrite' });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
