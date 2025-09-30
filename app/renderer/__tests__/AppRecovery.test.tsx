import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  DraftAcceptBridgeResponse,
  RecoveryStatusBridgeResponse,
  ServicesBridge,
} from '../../shared/ipc/services';
import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type { DiagnosticsBridge } from '../../shared/ipc/diagnostics';
import type { ProjectLoadEvent } from '../components/ProjectHome';

vi.mock('../components/WizardPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="wizard-panel-mock" />,
}));

const projectHomeMockState: {
  lastPath: string | null;
  reopenStatus: 'success' | 'error';
} = {
  lastPath: '/projects/demo',
  reopenStatus: 'success',
};

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
};

vi.mock('../components/ProjectHome', () => {
  const React = require('react') as typeof import('react');
  const { useEffect } = React;
  return {
    __esModule: true,
    default: ({
      onProjectLoaded,
      reopenRequest,
      onReopenConsumed,
    }: {
      onProjectLoaded?: (event: ProjectLoadEvent) => void;
      reopenRequest?: { path: string; requestId: number } | null;
      onReopenConsumed?: (result: { requestId: number; status: 'success' | 'error' }) => void;
    }) => {
      useEffect(() => {
        onProjectLoaded?.({
          status: 'init',
          project: null,
          targetPath: null,
          lastOpenedPath: projectHomeMockState.lastPath,
        });
        onProjectLoaded?.({
          status: 'loaded',
          project: loadedProject,
          targetPath: loadedProject.path,
          lastOpenedPath: loadedProject.path,
        });
      }, [onProjectLoaded]);

      useEffect(() => {
        if (!reopenRequest) {
          return;
        }

        const status = projectHomeMockState.reopenStatus;
        if (status === 'success') {
          onProjectLoaded?.({
            status: 'loaded',
            project: loadedProject,
            targetPath: reopenRequest.path,
            lastOpenedPath: loadedProject.path,
          });
        } else {
          onProjectLoaded?.({
            status: 'failed',
            project: null,
            targetPath: reopenRequest.path,
            lastOpenedPath: projectHomeMockState.lastPath,
          });
        }

        onReopenConsumed?.({ requestId: reopenRequest.requestId, status });
      }, [onProjectLoaded, onReopenConsumed, reopenRequest]);

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

function createDiagnosticsMock(): DiagnosticsBridge {
  return {
    openDiagnosticsFolder: vi
      .fn()
      .mockResolvedValue({ ok: true, path: '/history/diagnostics' }),
  };
}

async function loadAppWithServices(
  services: ServicesBridge,
  diagnostics: DiagnosticsBridge = createDiagnosticsMock(),
): Promise<AppComponent> {
  vi.resetModules();
  Object.defineProperty(window, 'services', {
    configurable: true,
    value: services,
  });
  Object.defineProperty(window, 'projectLoader', {
    configurable: true,
    value: undefined,
  });
  Object.defineProperty(window, 'diagnostics', {
    configurable: true,
    value: diagnostics,
  });
  const module = await import('../App');
  return module.default;
}

describe('App recovery banner', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
    projectHomeMockState.lastPath = '/projects/demo';
    projectHomeMockState.reopenStatus = 'success';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (window as typeof window & { diagnostics?: unknown }).diagnostics;
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
    const message = await screen.findByText('Snapshot restored');
    const toastCard = message.closest('.toast');
    expect(toastCard).not.toBeNull();
    if (toastCard) {
      expect(within(toastCard).getByText('trace-restore-success')).toBeInTheDocument();
    }
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

  it('allows reopening the last project from the recovery banner', async () => {
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

    const App = await loadAppWithServices(services);
    render(<App />);

    await screen.findByText(/Crash recovery available/i);
    const reopenButton = screen.getByRole('button', { name: /reopen last project/i });
    expect(reopenButton).toBeEnabled();

    fireEvent.click(reopenButton);
    expect(reopenButton).toBeDisabled();

    await waitFor(() => expect(reopenButton).toBeEnabled());
  });

  it('disables the reopen action when no last project is stored', async () => {
    projectHomeMockState.lastPath = null;
    const status: RecoveryStatusBridgeResponse = {
      project_id: 'demo_project',
      status: 'needs-recovery',
      needs_recovery: true,
      pending_unit_id: null,
      draft_id: null,
      started_at: null,
      last_snapshot: null,
      message: null,
      failure_reason: null,
    };

    services.getRecoveryStatus = vi.fn().mockResolvedValue({
      ok: true,
      data: status,
      traceId: 'trace-recovery-status',
    });

    const App = await loadAppWithServices(services);
    render(<App />);

    await screen.findByText(/Crash recovery available/i);
    const reopenButton = screen.getByRole('button', { name: /reopen last project/i });
    expect(reopenButton).toBeDisabled();
  });

  it('re-enables recovery controls when reopening fails', async () => {
    projectHomeMockState.reopenStatus = 'error';
    const status: RecoveryStatusBridgeResponse = {
      project_id: 'demo_project',
      status: 'needs-recovery',
      needs_recovery: true,
      pending_unit_id: null,
      draft_id: null,
      started_at: null,
      last_snapshot: null,
      message: null,
      failure_reason: null,
    };

    services.getRecoveryStatus = vi.fn().mockResolvedValue({
      ok: true,
      data: status,
      traceId: 'trace-recovery-status',
    });

    const App = await loadAppWithServices(services);
    render(<App />);

    await screen.findByText(/Crash recovery available/i);
    const reopenButton = screen.getByRole('button', { name: /reopen last project/i });
    fireEvent.click(reopenButton);
    await waitFor(() => expect(reopenButton).toBeEnabled());
  });

  it('surfaces diagnostics errors when opening the folder fails', async () => {
    const diagnostics: DiagnosticsBridge = {
      openDiagnosticsFolder: vi
        .fn()
        .mockResolvedValue({ ok: false, error: 'missing diagnostics directory' }),
    };

    const status: RecoveryStatusBridgeResponse = {
      project_id: 'demo_project',
      status: 'needs-recovery',
      needs_recovery: true,
      pending_unit_id: null,
      draft_id: null,
      started_at: null,
      last_snapshot: null,
      message: null,
      failure_reason: null,
    };

    services.getRecoveryStatus = vi.fn().mockResolvedValue({
      ok: true,
      data: status,
      traceId: 'trace-recovery-status',
    });

    const App = await loadAppWithServices(services, diagnostics);
    render(<App />);

    await screen.findByText(/Crash recovery available/i);
    const diagnosticsButton = screen.getByRole('button', { name: /view diagnostics/i });
    fireEvent.click(diagnosticsButton);

    await screen.findByText(/Diagnostics folder unavailable/i);
    await waitFor(() => expect(diagnosticsButton).toBeEnabled());
  });
});
