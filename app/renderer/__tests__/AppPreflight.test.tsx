import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DraftGenerateBridgeResponse,
  DraftPreflightEstimate,
  ServicesBridge,
} from '../../shared/ipc/services';
import type { LoadedProject } from '../../shared/ipc/projectLoader';

vi.mock('../components/WizardPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="wizard-panel-mock" />,
}));

vi.mock('../components/ProjectHome', () => {
  const React = require('react') as typeof import('react');
  const { useEffect } = React;
  return {
    __esModule: true,
    default: ({
      onProjectLoaded,
    }: {
      onProjectLoaded?: (project: LoadedProject | null) => void;
    }) => {
      useEffect(() => {
        onProjectLoaded?.({
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
                beat_refs: [],
              },
            ],
          },
          scenes: [
            {
              id: 'sc_0001',
              title: 'Arrival',
              order: 1,
            },
          ],
          drafts: {},
        } satisfies LoadedProject);
      }, [onProjectLoaded]);

      return <div data-testid="project-home-mock" />;
    },
  };
});

type AppComponent = (props: Record<string, never>) => JSX.Element;

function createServicesMock(): ServicesBridge {
  const draftResponse: DraftGenerateBridgeResponse = {
    draft_id: 'dr_001',
    schema_version: 'DraftUnitSchema v1',
    units: [],
    budget: undefined,
  };

  return {
    checkHealth: vi.fn().mockResolvedValue({ ok: true, data: { status: 'ok', version: '0.1.0' } }),
    buildOutline: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'out_001',
        acts: [],
        chapters: [],
        scenes: [],
      },
    }),
    generateDraft: vi.fn().mockResolvedValue({ ok: true, data: draftResponse }),
    critiqueDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        schema_version: 'CritiqueOutputSchema v1',
        summary: 'Stub critique',
      },
    }),
    preflightDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'placeholder',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
        model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
        scenes: [{ id: 'sc_0001', title: 'Stub scene', order: 1 }],
        budget: {
          estimated_usd: 0.5,
          status: 'ok',
          soft_limit_usd: 5,
          hard_limit_usd: 10,
          spent_usd: 0,
          total_after_usd: 0.5,
        },
      },
    }),
    acceptDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        checksum: 'abc123',
        schema_version: 'DraftAcceptResult v1',
        snapshot: {
          snapshot_id: '20250929T010203Z',
          label: 'accept',
          created_at: '2025-09-29T01:02:03Z',
          path: 'history/snapshots/20250929T010203Z_accept',
          includes: ['drafts'],
        },
      },
    }),
    getRecoveryStatus: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
    }),
    restoreSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
    }),
  };
}

async function loadAppWithServices(services: ServicesBridge): Promise<AppComponent> {
  vi.resetModules();
  Object.defineProperty(window, 'services', {
    configurable: true,
    value: services,
  });
  // Provide a benign projectLoader to satisfy type expectations.
  Object.defineProperty(window, 'projectLoader', {
    configurable: true,
    value: undefined,
  });
  const module = await import('../App');
  return module.default;
}

describe('App preflight integration', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays service-provided estimate in the modal', async () => {
    const estimate: DraftPreflightEstimate = {
      projectId: 'demo_project',
      unitScope: 'scene',
      unitIds: ['sc_0001'],
      model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
      scenes: [
        { id: 'sc_0001', title: 'Arrival', order: 1, chapter_id: 'ch_0001' },
      ],
      budget: {
        estimated_usd: 1.25,
        status: 'ok',
        message: 'Estimate within budget.',
        soft_limit_usd: 5,
        hard_limit_usd: 10,
        spent_usd: 3.75,
        total_after_usd: 5.0,
      },
    };

    services.preflightDraft = vi.fn().mockResolvedValue({ ok: true, data: estimate });
    const App = await loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText('Scenes in this run');
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText(/draft-synthesizer-v1/i)).toBeInTheDocument();
  });

  it('keeps proceed enabled for soft-limit warnings', async () => {
    const estimate: DraftPreflightEstimate = {
      projectId: 'demo_project',
      unitScope: 'scene',
      unitIds: ['sc_0001', 'sc_0002'],
      model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
      scenes: [
        { id: 'sc_0001', title: 'Arrival', order: 1, chapter_id: 'ch_0001' },
        { id: 'sc_0002', title: 'Surface Impact', order: 2, chapter_id: 'ch_0001' },
      ],
      budget: {
        estimated_usd: 5.42,
        status: 'soft-limit',
        message: 'Estimated total $5.42 exceeds soft limit $5.00.',
        soft_limit_usd: 5,
        hard_limit_usd: 10,
        spent_usd: 0,
        total_after_usd: 5.42,
      },
    };

    services.preflightDraft = vi.fn().mockResolvedValue({ ok: true, data: estimate });
    const App = await loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/exceeds soft limit/i);

    const proceedButton = screen.getByRole('button', { name: /proceed/i });
    expect(proceedButton).toBeEnabled();
    expect(screen.getByText(/Soft limit exceeded/i)).toBeInTheDocument();
  });

  it('disables proceed when the hard limit blocks the run', async () => {
    const estimate: DraftPreflightEstimate = {
      projectId: 'demo_project',
      unitScope: 'scene',
      unitIds: ['sc_0003'],
      model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
      scenes: [
        { id: 'sc_0003', title: 'Basement Pulse', order: 3, chapter_id: 'ch_0001' },
      ],
      budget: {
        estimated_usd: 11.38,
        status: 'blocked',
        message: 'Projected total $11.38 exceeds hard limit $10.00.',
        soft_limit_usd: 5,
        hard_limit_usd: 10,
        spent_usd: 0,
        total_after_usd: 11.38,
      },
    };

    services.preflightDraft = vi.fn().mockResolvedValue({ ok: true, data: estimate });
    const App = await loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/exceeds hard limit/i);

    const blockedButton = screen.getByRole('button', { name: /blocked/i });
    expect(blockedButton).toBeDisabled();
  });

  it('surfaces validation errors from the service', async () => {
    services.preflightDraft = vi
      .fn()
      .mockResolvedValue({ ok: false, error: { message: 'Missing outline artifact.' } });

    const App = await loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/Unable to complete preflight/i);
    expect(screen.getByText(/Missing outline artifact/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceed/i })).toBeDisabled();
  });

  it('renders a validation summary when the service provides details', async () => {
    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        message: 'One or more scene IDs are not present in the outline.',
        details: { missing_scene_ids: ['sc_0002', 'sc_0003'] },
      },
    });

    const App = await loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByRole('heading', { name: /validation summary/i });
    const summaryList = screen.getByRole('list', { name: /missing scene ids/i });
    expect(summaryList).toBeInTheDocument();
    const listItems = within(summaryList).getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('sc_0002');
    expect(listItems[1]).toHaveTextContent('sc_0003');
  });

  it('keeps proceed disabled when the service port is unavailable', async () => {
    services.preflightDraft = vi
      .fn()
      .mockResolvedValue({ ok: false, error: { message: 'Service port is unavailable.' } });

    const App = await loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/Unable to complete preflight/i);
    expect(screen.getByText(/Service port is unavailable\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceed/i })).toBeDisabled();
  });
});
