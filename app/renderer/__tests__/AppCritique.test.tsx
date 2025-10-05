import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type {
  DraftAcceptBridgeResponse,
  DraftCritiqueBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';

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
  const draftText = draftOverrides?.sc_0001 ?? loadedProject.drafts['sc_0001'];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
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
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: draftText });
    onDraftChange?.('sc_0001', draftText);
  }, []);

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

const critiqueFixture: DraftCritiqueBridgeResponse = {
  unit_id: 'sc_0001',
  schema_version: 'CritiqueOutputSchema v1',
  summary: 'Consider clarifying the static motif before the midpoint.',
  priorities: ['clarity', 'pacing'],
  line_comments: [
    { line: 2, note: 'Add a sensory detail that ties to Mara’s arc.' },
  ],
  model: { name: 'critique-synthesizer-v1', provider: 'black-skies-local' },
};

type AppComponent = (props: Record<string, never>) => JSX.Element;

function createServicesMock(): ServicesBridge {
  const acceptResponse: DraftAcceptBridgeResponse = {
    unit_id: 'sc_0001',
    checksum: 'placeholder',
    schema_version: 'DraftAcceptResult v1',
    snapshot: {
      snapshot_id: '20251005T101112Z',
      label: 'accept',
      created_at: '2025-10-05T10:11:12Z',
      path: 'history/snapshots/20251005T101112Z_accept',
      includes: ['drafts'],
    },
  };

  return {
    checkHealth: vi.fn().mockResolvedValue({
      ok: true,
      data: { status: 'ok', version: '0.1.0' },
      traceId: 'trace-health',
    }),
    buildOutline: vi.fn(),
    generateDraft: vi.fn(),
    critiqueDraft: vi.fn().mockResolvedValue({ ok: true, data: critiqueFixture, traceId: 'trace-critique' }),
    preflightDraft: vi.fn(),
    acceptDraft: vi.fn().mockResolvedValue({ ok: true, data: acceptResponse, traceId: 'trace-accept' }),
    createSnapshot: vi.fn(),
    getRecoveryStatus: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
      traceId: 'trace-recovery',
    }),
    restoreSnapshot: vi.fn(),
  } as unknown as ServicesBridge;
}

function loadAppWithServices(services: ServicesBridge): AppComponent {
  Object.defineProperty(window, 'services', {
    configurable: true,
    value: services,
  });
  Object.defineProperty(window, 'projectLoader', {
    configurable: true,
    value: undefined,
  });
  return App;
}

describe('App critique flow', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('requests a critique and accepts the draft', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const critiqueButton = await screen.findByRole('button', { name: 'Critique' });
    await waitFor(() => expect(critiqueButton).not.toBeDisabled());

    fireEvent.click(critiqueButton);

    await screen.findByText(critiqueFixture.summary);

    const acceptButton = await screen.findByRole('button', { name: 'Accept draft' });
    fireEvent.click(acceptButton);

    await waitFor(() => expect(services.acceptDraft).toHaveBeenCalled());

    const expectedHash = createHash('sha256')
      .update(loadedProject.drafts['sc_0001'].replace(/\r\n/g, '\n'))
      .digest('hex');

    expect(services.critiqueDraft).toHaveBeenCalledWith({
      projectId: 'demo',
      draftId: expect.stringMatching(/^dr_/),
      unitId: 'sc_0001',
      rubric: ['continuity', 'pacing', 'voice'],
    });

    expect(services.acceptDraft).toHaveBeenCalledWith({
      projectId: 'demo',
      draftId: expect.stringMatching(/^dr_/),
      unitId: 'sc_0001',
      unit: {
        id: 'sc_0001',
        previous_sha256: expectedHash,
        text: loadedProject.drafts['sc_0001'],
      },
      message: expect.stringContaining('Accepted critique'),
      snapshotLabel: 'accept',
    });

    await waitFor(() =>
      expect(screen.queryByText(critiqueFixture.summary)).not.toBeInTheDocument(),
    );
  });

  it('surfaces critique bridge errors via toast feedback', async () => {
    services.critiqueDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: { message: 'Critique services offline', traceId: 'trace-critique-failure' },
      traceId: 'trace-critique-failure',
    });

    const App = loadAppWithServices(services);
    render(<App />);

    const critiqueButton = await screen.findByRole('button', { name: 'Critique' });
    await waitFor(() => expect(critiqueButton).not.toBeDisabled());

    fireEvent.click(critiqueButton);

    await waitFor(() => expect(services.critiqueDraft).toHaveBeenCalled());
    await screen.findByText(/Critique failed/i);
    const bridgeErrors = screen.getAllByText(/Critique services offline/i);
    expect(bridgeErrors.length).toBeGreaterThan(0);
  });
});
