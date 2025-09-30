import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DraftAcceptBridgeResponse,
  RecoveryStatusBridgeResponse,
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
  const response: DraftAcceptBridgeResponse = {
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
  };

  return {
    checkHealth: vi.fn().mockResolvedValue({
      ok: true,
      data: { status: 'ok', version: '0.1.0' },
      traceId: 'trace-health-ok',
    }),
    buildOutline: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'out_001',
        acts: [],
        chapters: [],
        scenes: [],
      },
      traceId: 'trace-outline',
    }),
    generateDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: { draft_id: 'dr_001', schema_version: 'DraftUnitSchema v1', units: [] },
      traceId: 'trace-generate',
    }),
    critiqueDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        schema_version: 'CritiqueOutputSchema v1',
        summary: 'Stub critique',
      },
      traceId: 'trace-critique',
    }),
    preflightDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'demo_project',
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
      traceId: 'trace-preflight',
    }),
    acceptDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: response,
      traceId: 'trace-accept',
    }),
    getRecoveryStatus: vi.fn(),
    restoreSnapshot: vi.fn(),
  };
}

async function loadAppWithServices(services: ServicesBridge): Promise<AppComponent> {
  vi.resetModules();
  Object.defineProperty(window, 'services', {
    configurable: true,
    value: services,
  });
  Object.defineProperty(window, 'projectLoader', {
    configurable: true,
    value: undefined,
  });
  const module = await import('../App');
  return module.default;
}

describe('App recovery banner', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces crash recovery and restores the latest snapshot', async () => {
    const status: RecoveryStatusBridgeResponse = {
      project_id: 'demo_project',
      status: 'needs-recovery',
      needs_recovery: true,
      pending_unit_id: 'sc_0001',
      draft_id: 'dr_001',
      started_at: '2025-09-29T01:01:59Z',
      last_snapshot: {
        snapshot_id: '20250929T010203Z',
        label: 'accept',
        created_at: '2025-09-29T01:02:03Z',
        path: 'history/snapshots/20250929T010203Z_accept',
        includes: ['drafts'],
      },
      message: null,
      failure_reason: null,
    };

    services.getRecoveryStatus = vi.fn().mockResolvedValue({
      ok: true,
      data: status,
      traceId: 'trace-recovery-status',
    });
    services.restoreSnapshot = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        ...status,
        status: 'idle',
        needs_recovery: false,
      },
      traceId: 'trace-restore-success',
    });

    const App = await loadAppWithServices(services);
    render(<App />);

    await screen.findByText(/Crash recovery available/i);
    const restoreButton = screen.getByRole('button', { name: /restore snapshot/i });
    expect(restoreButton).toBeEnabled();

    fireEvent.click(restoreButton);
    await waitFor(() => expect(services.restoreSnapshot).toHaveBeenCalledTimes(1));
    const messages = await screen.findAllByText(/Snapshot restored/i);
    expect(messages.length).toBeGreaterThan(0);
  });

  it('clears the banner when recovery status is clean', async () => {
    services.getRecoveryStatus = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        data: {
          project_id: 'demo_project',
          status: 'idle',
          needs_recovery: false,
          last_snapshot: null,
        },
        traceId: 'trace-recovery-clean',
      });

    const App = await loadAppWithServices(services);
    render(<App />);

    await waitFor(() => expect(services.getRecoveryStatus).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Crash recovery available/i)).toBeNull();
  });
});
