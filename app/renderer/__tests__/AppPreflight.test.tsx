import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
});
