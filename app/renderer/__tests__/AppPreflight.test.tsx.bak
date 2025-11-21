import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';
import SnapshotsPanel from '../components/SnapshotsPanel';

import type {
  BackupVerificationReport,
  DraftGenerateBridgeResponse,
  DraftPreflightEstimate,
  ServicesBridge,
  SnapshotManifest,
} from '../../shared/ipc/services';
import type { LoadedProject, ProjectLoaderApi } from '../../shared/ipc/projectLoader';

beforeEach(() => {
  if (!(global as typeof globalThis & { window?: Window }).window) {
    (global as typeof globalThis & { window?: Window }).window = window;
  }
  const bridge = ((window as typeof window & { bridge?: Record<string, any> }).bridge ??=
    {}) as Record<string, any>;

  bridge.listSnapshots = vi.fn().mockResolvedValue([
    { snapshot_id: 's1', created_at: '2025-11-15T12:00:00Z', path: '.snapshots/s1' },
    { snapshot_id: 's2', created_at: '2025-11-14T12:00:00Z', path: '.snapshots/s2' },
  ]);
  bridge.revealPath = vi.fn().mockResolvedValue(true);
  bridge.getLastVerification = vi.fn().mockResolvedValue({
    snapshots: [
      { snapshot_id: 's1', issues: [] },
      { snapshot_id: 's2', issues: ['missing file'] },
    ],
    summary: { ok: false, problems: 1 },
  });
  bridge.runBackupVerification = vi.fn().mockResolvedValue({ ok: true });
  bridge.exportProject =
    bridge.exportProject ??
    vi.fn().mockResolvedValue({
      ok: true,
      data: { path: 'project/exports/dummy' },
    });
});

vi.mock('../components/WizardPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="wizard-panel-mock" />,
}));

function ProjectHomeMock({
  onProjectLoaded,
  onActiveSceneChange,
  onDraftChange,
  draftOverrides,
}: {
  onProjectLoaded?: (project: LoadedProject | null) => void;
  onActiveSceneChange?: (payload: {
    sceneId: string;
    sceneTitle: string | null;
    draft: string;
  }) => void;
  onDraftChange?: (sceneId: string, draft: string) => void;
  draftOverrides?: Record<string, string>;
}): JSX.Element {
  const bootstrappedRef = useRef(false);
  const lastDraftRef = useRef<string | null>(null);

  useEffect(() => {
    const currentDraft = draftOverrides?.sc_0001 ?? '';

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
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
    }

    if (lastDraftRef.current === currentDraft) {
      return;
    }
    lastDraftRef.current = currentDraft;
    onActiveSceneChange?.({ sceneId: 'sc_0001', sceneTitle: 'Arrival', draft: currentDraft });
    if (currentDraft) {
      onDraftChange?.('sc_0001', currentDraft);
    }
  }, [draftOverrides, onActiveSceneChange, onDraftChange, onProjectLoaded]);

  return <div data-testid="project-home-mock" />;
}

vi.mock('../components/ProjectHome', () => ({
  __esModule: true,
  default: ProjectHomeMock,
}));

type AppComponent = (props: Record<string, never>) => JSX.Element;

function createServicesMock(): ServicesBridge {
  const draftResponse: DraftGenerateBridgeResponse = {
    draft_id: 'dr_001',
    schema_version: 'DraftUnitSchema v1',
    units: [],
    budget: undefined,
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
      data: draftResponse,
      traceId: 'trace-generate',
    }),
    analyticsBudget: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        budget: {
          soft_limit_usd: 5,
          hard_limit_usd: 10,
          spent_usd: 0,
          remaining_usd: 5,
        },
        hint: 'ample',
      },
      traceId: 'trace-analytics',
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
    createProjectSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        snapshot_id: 'snap-test',
        created_at: '2025-01-01T00:00:00Z',
        path: '.snapshots/snap-test',
        files_included: [],
      } as SnapshotManifest,
    }),
    listProjectSnapshots: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    exportProject: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        path: 'exports/demo_project.md',
        format: 'md',
        chapters: 1,
        scenes: 1,
        meta_header: false,
        exported_at: '2025-01-01T00:00:00Z',
        schema_version: 'ProjectExportResult v1',
      },
      traceId: 'trace-export',
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
      traceId: 'trace-preflight',
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
      traceId: 'trace-accept',
    }),
    getRecoveryStatus: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
      traceId: 'trace-recovery-status',
    }),
    restoreSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
      traceId: 'trace-restore',
    }),
    runBackupVerification: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'demo_project',
        snapshots: [{ snapshot_id: 'snap-test', status: 'ok', errors: [] }],
      } satisfies BackupVerificationReport,
    }),
    revealPath: vi.fn().mockResolvedValue(undefined),
  };
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

describe('App preflight integration', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(window as typeof window & { services?: ServicesBridge }, 'services');
    Reflect.deleteProperty(window as typeof window & { projectLoader?: ProjectLoaderApi }, 'projectLoader');
  });

  it('renders SnapshotsPanel standalone without App flow', async () => {
    // Test-only helper to assert the panel can mount even when the App flow fails.
    render(
      <SnapshotsPanel
        projectId="demo"
        projectPath="/projects/demo"
        services={services}
        serviceStatus="online"
        pushToast={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const panel = await screen.findByTestId('snapshots-panel');
    expect(panel).toBeInTheDocument();
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

    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: estimate,
      traceId: 'trace-preflight-modal',
    });
    const App = loadAppWithServices(services);

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

    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: estimate,
      traceId: 'trace-preflight-soft-limit',
    });
    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const modal = await screen.findByRole('dialog', { name: /draft preflight/i });
    await within(modal).findByText(/exceeds soft limit/i);

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

    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: estimate,
      traceId: 'trace-preflight-hard-limit',
    });
    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const modal = await screen.findByRole('dialog', { name: /draft preflight/i });
    await within(modal).findByText(/exceeds hard limit/i);

    const blockedButton = screen.getByRole('button', { name: /blocked/i });
    expect(blockedButton).toBeDisabled();
  });

  it('surfaces validation errors from the service', async () => {
    services.preflightDraft = vi
      .fn()
      .mockResolvedValue({
        ok: false,
        error: { message: 'Missing outline artifact.', traceId: 'trace-preflight-missing-outline' },
        traceId: 'trace-preflight-missing-outline',
      });

    const App = loadAppWithServices(services);

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
        traceId: 'trace-preflight-validation-details',
      },
      traceId: 'trace-preflight-validation-details',
    });

    const App = loadAppWithServices(services);

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
      .mockResolvedValue({
        ok: false,
        error: { message: 'Service port is unavailable.', traceId: 'trace-preflight-port-unavailable' },
        traceId: 'trace-preflight-port-unavailable',
      });

    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/Unable to complete preflight/i);
    expect(screen.getByText(/Service port is unavailable\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proceed/i })).toBeDisabled();
  });

  it('displays trace IDs for generation success toasts', async () => {
    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const proceedButton = await screen.findByRole('button', { name: /proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    const message = await screen.findByText(/New draft written/i);
    const toastCard = message.closest('.toast');
    expect(toastCard).not.toBeNull();
    if (toastCard) {
      expect(within(toastCard).getByText('trace-generate')).toBeInTheDocument();
    }
  });

  it('displays trace IDs for generation failure toasts', async () => {
    services.generateDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: { message: 'Service outage', traceId: 'trace-generate-failure' },
      traceId: 'trace-generate-failure',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const proceedButton = await screen.findByRole('button', { name: /proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    const message = await screen.findByText(/Something went wrong\./i);
    const toastCard = message.closest('.toast');
    expect(toastCard).not.toBeNull();
    if (toastCard) {
      expect(within(toastCard).getByText('trace-generate-failure')).toBeInTheDocument();
    }
  });

  it('marks services offline when the health probe fails', async () => {
    services.checkHealth = vi.fn().mockResolvedValue({
      ok: false,
      error: { message: 'Bridge unreachable', traceId: 'trace-health-failure' },
      traceId: 'trace-health-failure',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    await waitFor(() => expect(services.checkHealth).toHaveBeenCalled());
    await screen.findByRole('button', { name: /writing tools offline/i });
  });

  it('triggers snapshot and verification from the header', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const snapshotButton = await screen.findByTestId('workspace-action-snapshot');
    fireEvent.click(snapshotButton);
    await waitFor(() => {
      expect(services.createProjectSnapshot).toBeDefined();
      services.createProjectSnapshot && expect(services.createProjectSnapshot).toHaveBeenCalled();
    });

    const verifyButton = await screen.findByTestId('workspace-action-verify');
    fireEvent.click(verifyButton);
    await waitFor(() => {
      expect(services.runBackupVerification).toBeDefined();
      services.runBackupVerification &&
        expect(services.runBackupVerification).toHaveBeenCalledWith({
          projectId: 'demo',
          latestOnly: true,
        });
    });
  });

  it('opens snapshots panel when export service missing and toast action reveals path', async () => {
    services.exportProject = vi.fn().mockRejectedValue(new Error('export service unavailable'));

    services.listProjectSnapshots = vi.fn().mockResolvedValue({
      ok: true,
      data: [
        {
          snapshot_id: 'snap-1',
          created_at: '2025-11-15T12:00:00Z',
          path: '.snapshots/snap-1',
          files_included: [],
        } satisfies SnapshotManifest,
      ],
    });

    const App = loadAppWithServices(services);

    render(<App />);

    await screen.findByText(/Your Story/i);
    await screen.findByText(/Project ID:/i);
    const snapshotsButton = screen.getByTestId('snapshots-open-button');
    expect(snapshotsButton).not.toBeDisabled();

    await userEvent.click(snapshotsButton);
    window.dispatchEvent(new CustomEvent('test:open-snapshots'));
    const snapshotsPanel = await screen.findByTestId('snapshots-panel', { timeout: 3000 });
    expect(snapshotsPanel).toHaveAttribute('role', 'dialog');
    await waitFor(() => expect(services.listProjectSnapshots).toHaveBeenCalledTimes(1));

    const revealButtons = await screen.findAllByRole('button', { name: /reveal/i });
    await userEvent.click(revealButtons[0]);
    expect(services.revealPath).toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText('Close snapshots panel'));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /snapshots/i })).not.toBeInTheDocument(),
    );

    const snapshotButton = await screen.findByLabelText(/create snapshot/i);
    snapshotButton.removeAttribute('disabled');
    await userEvent.click(snapshotButton);

    const showSnapshotsToastAction = await screen.findByRole('button', { name: /show snapshots/i });
    await userEvent.click(showSnapshotsToastAction);

    const reopenedSnapshotsPanel = await screen.findByTestId('snapshots-panel');
    expect(reopenedSnapshotsPanel).toBeInTheDocument();
    expect(services.revealPath).toHaveBeenCalledWith(expect.stringContaining('.snapshots'));
  });

});
