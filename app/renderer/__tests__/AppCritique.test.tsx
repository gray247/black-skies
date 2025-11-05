import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

import type { LoadedProject, ProjectLoaderApi } from '../../shared/ipc/projectLoader';
import type {
  DraftAcceptBridgeResponse,
  DraftCritiqueBridgeResponse,
  DraftGenerateBridgeResponse,
  DraftPreflightEstimate,
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

    const draftText = draftOverrides?.sc_0001 ?? loadedProject.drafts['sc_0001'];
    lastDraftRef.current = draftText;
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: draftText });
    onDraftChange?.('sc_0001', draftText);
  }, [draftOverrides, onActiveSceneChange, onDraftChange, onProjectLoaded]);

  useEffect(() => {
    if (!bootstrappedRef.current) {
      return;
    }
    const draftText = draftOverrides?.sc_0001 ?? loadedProject.drafts['sc_0001'];
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

const critiqueFixture: DraftCritiqueBridgeResponse = {
  unit_id: 'sc_0001',
  schema_version: 'CritiqueOutputSchema v1',
  summary: 'Consider clarifying the static motif before the midpoint.',
  priorities: ['clarity', 'pacing'],
  line_comments: [
    { line: 2, note: 'Add a sensory detail that ties to Mara’s arc.' },
  ],
  model: { name: 'critique-synthesizer-v1', provider: 'black-skies-local' },
  budget: {
    estimated_usd: 0.15,
    status: 'ok',
    message: 'Critique completed within budget.',
    soft_limit_usd: 5,
    hard_limit_usd: 10,
    spent_usd: 1.9,
    total_after_usd: 1.9,
  },
};

const preflightEstimate: DraftPreflightEstimate = {
  projectId: 'demo',
  unitScope: 'scene',
  unitIds: ['sc_0001'],
  model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
  scenes: [
    {
      id: 'sc_0001',
      title: 'Arrival',
      order: 1,
    },
  ],
  budget: {
    estimated_usd: 0.25,
    status: 'ok',
    message: 'Estimate within budget.',
    soft_limit_usd: 5,
    hard_limit_usd: 10,
    spent_usd: 1.5,
    total_after_usd: 1.75,
  },
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
    budget: {
      soft_limit_usd: 5,
      hard_limit_usd: 10,
      spent_usd: 1.9,
      status: 'ok',
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
    preflightDraft: vi.fn().mockResolvedValue({ ok: true, data: preflightEstimate, traceId: 'trace-preflight' }),
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

function loadAppWithServices(
  services: ServicesBridge,
  options: { projectLoader?: ProjectLoaderApi } = {},
): AppComponent {
  Object.defineProperty(window, 'services', {
    configurable: true,
    value: services,
  });
  Object.defineProperty(window, 'projectLoader', {
    configurable: true,
    value: options.projectLoader,
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
    Reflect.deleteProperty(window as typeof window & { services?: ServicesBridge }, 'services');
    Reflect.deleteProperty(
      window as typeof window & { projectLoader?: ProjectLoaderApi },
      'projectLoader',
    );
  });

  it('requests a critique and accepts the draft', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const critiqueButton = await screen.findByRole('button', { name: 'Critique' });
    await waitFor(() => expect(critiqueButton).not.toBeDisabled());

    fireEvent.click(critiqueButton);

    await screen.findByText(critiqueFixture.summary);
    await screen.findByText('Budget');
    await screen.findByText('$1.90 / $10.00');

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
      rubric: ['Continuity', 'Pacing', 'Voice'],
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

  it('allows configuring the critique rubric from the Companion overlay', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const companionButton = await screen.findByRole('button', { name: 'Companion' });
    fireEvent.click(companionButton);

    await screen.findByRole('heading', { name: 'Companion' });
    const rubricInput = screen.getByLabelText('Add category');
    fireEvent.change(rubricInput, { target: { value: 'Atmosphere' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await screen.findByText('Atmosphere');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Atmosphere' }));
    await waitFor(() =>
      expect(screen.queryByText('Atmosphere')).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Companion' })).not.toBeInTheDocument(),
    );
  });

  it('runs a batch critique for the selected scenes', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const companionButton = await screen.findByRole('button', { name: 'Companion' });
    fireEvent.click(companionButton);

    await screen.findByRole('heading', { name: 'Companion' });

    const runButton = await screen.findByRole('button', { name: 'Review selected scenes' });
    expect(runButton).toBeEnabled();

    fireEvent.click(runButton);

    await waitFor(() => expect(services.critiqueDraft).toHaveBeenCalledTimes(1));

    expect(services.critiqueDraft).toHaveBeenLastCalledWith({
      projectId: 'demo',
      draftId: expect.stringMatching(/^dr_/),
      unitId: 'sc_0001',
      rubric: ['Continuity', 'Pacing', 'Voice'],
    });

    await screen.findByText('Complete');
    await screen.findByText(critiqueFixture.summary);
  });

  it('surfaces the budget meter after running a preflight estimate', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const generateButton = await screen.findByRole('button', { name: 'Generate' });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));

    await screen.findByText('Budget');
    await screen.findByText('$1.75 / $10.00');
  });

  it('updates the budget meter after a critique response', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const generateButton = await screen.findByRole('button', { name: 'Generate' });
    await waitFor(() => expect(generateButton).not.toBeDisabled());
    fireEvent.click(generateButton);
    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText('$1.75 / $10.00');

    const critiqueButton = await screen.findByRole('button', { name: 'Critique' });
    await waitFor(() => expect(critiqueButton).not.toBeDisabled());
    fireEvent.click(critiqueButton);

    await screen.findByText(critiqueFixture.summary);
    await screen.findByText('$1.90 / $10.00');
  });

  it('refreshes project drafts after generation so accept uses the latest checksum', async () => {
    const newDraftBody = 'Generated scene body with heightened stakes.';
    const refreshedProject: LoadedProject = {
      ...loadedProject,
      drafts: { ...loadedProject.drafts, sc_0001: newDraftBody },
    };
    const estimate: DraftPreflightEstimate = {
      projectId: 'demo',
      unitScope: 'scene',
      unitIds: ['sc_0001'],
      model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
      scenes: [
        { id: 'sc_0001', title: 'Arrival', order: 1, chapter_id: 'ch_0001' },
      ],
      budget: { estimated_usd: 0.5, status: 'ok' },
    };
    const generateResponse: DraftGenerateBridgeResponse = {
      draft_id: 'dr_generated',
      schema_version: 'DraftUnitSchema v1',
      units: [
        { id: 'sc_0001', text: newDraftBody, meta: { order: 1, title: 'Arrival', chapter_id: 'ch_0001' } },
      ],
      budget: { status: 'ok' },
    };
    services.preflightDraft = vi
      .fn()
      .mockResolvedValue({ ok: true, data: estimate, traceId: 'trace-preflight' });
    services.generateDraft = vi
      .fn()
      .mockResolvedValue({ ok: true, data: generateResponse, traceId: 'trace-generate' });

    const projectLoaderMock: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: true }),
      loadProject: vi.fn().mockResolvedValue({ ok: true, project: refreshedProject, issues: [] }),
      getSampleProjectPath: vi.fn(),
    };

    const App = loadAppWithServices(services, { projectLoader: projectLoaderMock });
    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());
    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const proceedButton = await screen.findByRole('button', { name: /proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(projectLoaderMock.loadProject).toHaveBeenCalledTimes(1));
    expect(projectLoaderMock.loadProject).toHaveBeenCalledWith({ path: loadedProject.path });

    const critiqueButton = await screen.findByRole('button', { name: 'Critique' });
    await waitFor(() => expect(critiqueButton).not.toBeDisabled());
    fireEvent.click(critiqueButton);

    await screen.findByText(critiqueFixture.summary);

    const acceptButton = await screen.findByRole('button', { name: 'Accept draft' });
    fireEvent.click(acceptButton);

    await waitFor(() => expect(services.acceptDraft).toHaveBeenCalled());

    const expectedHash = createHash('sha256')
      .update(newDraftBody.replace(/\r\n/g, '\n'))
      .digest('hex');

    expect(services.acceptDraft).toHaveBeenLastCalledWith({
      projectId: 'demo',
      draftId: expect.stringMatching(/^dr_/),
      unitId: 'sc_0001',
      unit: {
        id: 'sc_0001',
        previous_sha256: expectedHash,
        text: newDraftBody,
      },
      message: expect.stringContaining('Accepted critique'),
      snapshotLabel: 'accept',
    });
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
    await screen.findByText(/Feedback unavailable/i);
    const bridgeErrors = screen.getAllByText(/Critique services offline/i);
    expect(bridgeErrors.length).toBeGreaterThan(0);
  });
});
