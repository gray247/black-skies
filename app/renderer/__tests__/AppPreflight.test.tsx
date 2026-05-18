import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useMemo, useRef } from 'react';
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
import { DEFAULT_RUNTIME_CONFIG } from '../../shared/config/runtime';
import {
  getDraftPreviewSyncKey,
  type DraftPreviewSyncState,
} from '../utils/draftPreviewSync';
import {
  SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
  SPLIT_COMMAND_SHELL_STORAGE_KEY,
} from '../utils/splitCommandShellState';

let mockLoadedProjectId: string | undefined;
let mockLoadedProjectPath: string | undefined;
let mockLoadedProjectName: string | undefined;
let mockLoadedProjectScenes: Array<{ id: string; title: string; order: number }> | undefined;
let mockActiveSceneId: string | undefined;

beforeEach(() => {
  if (!(global as typeof globalThis & { window?: Window }).window) {
    (global as typeof globalThis & { window?: Window }).window = window;
  }
  const bridge = ((window as typeof window & { bridge?: Record<string, unknown> }).bridge ??=
    {}) as Record<string, unknown>;

  bridge.listSnapshots = vi.fn().mockResolvedValue([
    { snapshot_id: 's1', created_at: '2025-11-15T12:00:00Z', path: '.snapshots/s1' },
    { snapshot_id: 's2', created_at: '2025-11-14T12:00:00Z', path: '.snapshots/s2' },
  ]);
  bridge.revealPath = vi.fn().mockResolvedValue({ ok: true, path: '/tmp' });
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
  default: ({
    onOutlineReady,
  }: {
    onOutlineReady?: (projectId: string, sceneIds: string[]) => void;
  }) => (
    <button
      type="button"
      data-testid="wizard-panel-mock"
      onClick={() => onOutlineReady?.('demo_project', ['sc_0001', 'sc_0002', 'sc_0003'])}
    >
      Build Outline
    </button>
  ),
}));

function ProjectHomeMock({
  onProjectLoaded,
  onActiveSceneChange,
  onDraftChange,
  draftOverrides,
  requestedActiveSceneId,
}: {
  onProjectLoaded?: (project: LoadedProject | null) => void;
  onActiveSceneChange?: (payload: {
    sceneId: string;
    sceneTitle: string | null;
    draft: string;
  }) => void;
  onDraftChange?: (sceneId: string, draft: string) => void;
  draftOverrides?: Record<string, string>;
  requestedActiveSceneId?: string | null;
}): JSX.Element {
  const lastLoadedProjectPathRef = useRef<string | null>(null);
  const lastDraftRef = useRef<string | null>(null);
  const scenes = useMemo(
    () => mockLoadedProjectScenes ?? [{ id: 'sc_0001', title: 'Arrival', order: 1 }],
    [],
  );
  const projectPath = mockLoadedProjectPath ?? '/projects/demo';
  const projectName = mockLoadedProjectName ?? 'Demo Project';
  const bodyActiveSceneId =
    typeof document !== 'undefined' ? document.body?.dataset.activeSceneId ?? null : null;
  const activeSceneId = requestedActiveSceneId ?? bodyActiveSceneId ?? mockActiveSceneId ?? null;
  const activeScene =
    scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0] ?? null;
  const currentDraft = activeScene ? draftOverrides?.[activeScene.id] ?? '' : '';

  useEffect(() => {
    if (lastLoadedProjectPathRef.current !== projectPath) {
      lastLoadedProjectPathRef.current = projectPath;
      onProjectLoaded?.({
        path: projectPath,
        projectId: mockLoadedProjectId,
        name: projectName,
        outline: {
          schema_version: 'OutlineSchema v1',
          outline_id: 'out_demo',
          acts: [],
          chapters: [],
          scenes: scenes.map((scene) => ({
            id: scene.id,
            order: scene.order,
            title: scene.title,
            chapter_id: 'ch_0001',
            beat_refs: [],
          })),
        },
        scenes: scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          order: scene.order,
        })),
        drafts: {},
      } satisfies LoadedProject);
    }

    if (!activeScene) {
      return;
    }

    const activeDraftKey = `${activeScene.id}:${currentDraft}`;
    if (lastDraftRef.current === activeDraftKey) {
      return;
    }
    lastDraftRef.current = activeDraftKey;
    onActiveSceneChange?.({
      sceneId: activeScene.id,
      sceneTitle: activeScene.title,
      draft: currentDraft,
    });
    if (currentDraft) {
      onDraftChange?.(activeScene.id, currentDraft);
    }
  }, [
    activeScene,
    currentDraft,
    draftOverrides,
    onActiveSceneChange,
    onDraftChange,
    onProjectLoaded,
    projectName,
    projectPath,
    requestedActiveSceneId,
    scenes,
  ]);

  return (
    <div
      data-testid="project-home-mock"
      data-active-scene-id={activeScene?.id ?? ''}
    >
      {currentDraft}
    </div>
  );
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
    revealPath: vi.fn().mockResolvedValue({ ok: true, path: '/tmp' }),
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

function writeDraftPreviewSyncState(projectPath: string, state: DraftPreviewSyncState): void {
  const key = getDraftPreviewSyncKey(projectPath);
  if (!key) {
    throw new Error('Missing draft preview sync key.');
  }
  window.localStorage.setItem(key, JSON.stringify(state));
}

function dispatchDraftPreviewStorageEvent(projectPath: string): void {
  const key = getDraftPreviewSyncKey(projectPath);
  if (!key) {
    throw new Error('Missing draft preview sync key.');
  }
  window.dispatchEvent(
    new StorageEvent('storage', {
      key,
      storageArea: window.localStorage,
      newValue: window.localStorage.getItem(key),
    }),
  );
}

function enableSplitCommandWorkspace(): void {
  (window as typeof window & { __runtimeConfigOverride?: typeof DEFAULT_RUNTIME_CONFIG }).__runtimeConfigOverride = {
    ...DEFAULT_RUNTIME_CONFIG,
    ui: {
      ...DEFAULT_RUNTIME_CONFIG.ui,
      experimentalSplitCommandWorkspace: true,
    },
  };
}

function setViewportWidth(width: number): void {
  act(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  });
}

describe('App preflight integration', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
    setViewportWidth(1440);
    mockLoadedProjectId = undefined;
    mockLoadedProjectPath = undefined;
    mockLoadedProjectName = undefined;
    mockLoadedProjectScenes = undefined;
    mockActiveSceneId = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    Reflect.deleteProperty(window as typeof window & { services?: ServicesBridge }, 'services');
    Reflect.deleteProperty(window as typeof window & { projectLoader?: ProjectLoaderApi }, 'projectLoader');
    Reflect.deleteProperty(window as typeof window & { __testEnv?: unknown }, '__testEnv');
    Reflect.deleteProperty(window as typeof window & { __testEnvFlatMode?: boolean }, '__testEnvFlatMode');
    Reflect.deleteProperty(window as typeof window & { __testEnvRecoveryMode?: boolean }, '__testEnvRecoveryMode');
    Reflect.deleteProperty(window as typeof window & { __testEnvFullMode?: boolean }, '__testEnvFullMode');
    Reflect.deleteProperty(
      window as typeof window & { __testEnvSnapshotRestoreFlow?: boolean },
      '__testEnvSnapshotRestoreFlow',
    );
    Reflect.deleteProperty(
      window as typeof window & { __testEnvDefaultProjectId?: string },
      '__testEnvDefaultProjectId',
    );
    Reflect.deleteProperty(
      window as typeof window & { __testEnvDefaultProjectPath?: string },
      '__testEnvDefaultProjectPath',
    );
    Reflect.deleteProperty(
      window as typeof window & { __testEnvAutoSeedProjectSummary?: boolean },
      '__testEnvAutoSeedProjectSummary',
    );
    Reflect.deleteProperty(
      window as typeof window & { __serviceHealthRetry?: () => Promise<void> },
      '__serviceHealthRetry',
    );
    Reflect.deleteProperty(
      window as typeof window & { __runtimeConfigOverride?: unknown },
      '__runtimeConfigOverride',
    );
    Reflect.deleteProperty(window as typeof window & { __dockReady?: boolean }, '__dockReady');
    Reflect.deleteProperty(window as typeof window & { __appBootReady?: boolean }, '__appBootReady');
    Reflect.deleteProperty(window as typeof window & { timeline?: History }, 'timeline');
    Reflect.deleteProperty(
      window as typeof window & { __stableDockHandleReady?: boolean },
      '__stableDockHandleReady',
    );
    Reflect.deleteProperty(
      window as typeof window & { __snapshotRestoreDone?: boolean },
      '__snapshotRestoreDone',
    );
    Reflect.deleteProperty(window as typeof window & { __layoutCallLog?: unknown }, '__layoutCallLog');
    Reflect.deleteProperty(window as typeof window & { __layoutState?: unknown }, '__layoutState');
    delete document.body.dataset.testStableDock;
    delete document.documentElement.dataset.testStableDock;
    delete document.body.dataset.testStablehome;
    delete document.documentElement.dataset.testStablehome;
    delete document.body.dataset.testVisualStable;
    delete document.documentElement.dataset.testVisualStable;
    delete document.body.dataset.projectLoaded;
    delete document.documentElement.dataset.projectLoaded;
    delete document.body.dataset.projectPath;
    delete document.documentElement.dataset.projectPath;
    delete document.body.dataset.projectId;
    delete document.documentElement.dataset.projectId;
    delete document.body.dataset.activeSceneId;
    delete document.documentElement.dataset.activeSceneId;
    delete document.body.dataset.testEnv;
    delete document.documentElement.dataset.testEnv;
    delete document.body.dataset.testForceOffline;
    delete document.documentElement.dataset.testForceOffline;
    delete document.body.dataset.testEnvForceOfflineReason;
    delete document.documentElement.dataset.testEnvForceOfflineReason;
    delete document.body.dataset.testNeedsRecovery;
    delete document.documentElement.dataset.testNeedsRecovery;
    delete document.body.dataset.testModeFreezeServiceHealth;
    delete document.documentElement.dataset.testModeFreezeServiceHealth;
    Reflect.deleteProperty(window as typeof window & { __testProjectState?: unknown }, '__testProjectState');
    Reflect.deleteProperty(
      window as typeof window & { __blackskiesDebugProjectState?: unknown },
      '__blackskiesDebugProjectState',
    );
    document.body.replaceChildren();
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);

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

    const generateButton = await screen.findByRole('button', { name: /generate active scene/i });
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

  it('keeps manual generation scoped to the active scene after outline rebuild', async () => {
    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'demo_project',
        unitScope: 'scene',
        unitIds: ['sc_0001', 'sc_0002', 'sc_0003'],
        model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
        scenes: [
          { id: 'sc_0001', title: 'Arrival', order: 1, chapter_id: 'ch_0001' },
          { id: 'sc_0002', title: 'Surface Impact', order: 2, chapter_id: 'ch_0001' },
          { id: 'sc_0003', title: 'Basement Pulse', order: 3, chapter_id: 'ch_0001' },
        ],
        budget: {
          estimated_usd: 3.25,
          status: 'ok',
          soft_limit_usd: 5,
          hard_limit_usd: 10,
          spent_usd: 0,
          total_after_usd: 3.25,
        },
      },
      traceId: 'trace-preflight-refresh',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    fireEvent.click(await screen.findByTestId('wizard-panel-mock'));

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    expect(services.preflightDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo_project',
        unitIds: ['sc_0001'],
        traceId: expect.any(String),
      }),
    );
  });

  it('scopes manual Generate and Proceed to the active scene when a project has multiple scenes', async () => {
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Surface Impact', order: 2 },
      { id: 'sc_0003', title: 'Basement Pulse', order: 3 },
      { id: 'sc_0004', title: 'Signal Drift', order: 4 },
    ];
    mockActiveSceneId = 'sc_0004';
    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'demo_project',
        unitScope: 'scene',
        unitIds: ['sc_0004'],
        model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
        scenes: [
          { id: 'sc_0004', title: 'Signal Drift', order: 4, chapter_id: 'ch_0001' },
        ],
        budget: {
          estimated_usd: 1.25,
          status: 'ok',
          soft_limit_usd: 5,
          hard_limit_usd: 10,
          spent_usd: 0,
          total_after_usd: 1.25,
        },
      },
      traceId: 'trace-active-scene-preflight',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    expect(services.preflightDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitScope: 'scene',
        unitIds: ['sc_0004'],
      }),
    );
    const modal = await screen.findByRole('dialog', { name: /draft preflight/i });
    expect(within(modal).getByText(/1 scene is affected/i)).toBeInTheDocument();
    expect(within(modal).getByText('Signal Drift')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /proceed/i }));

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    expect(services.generateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitScope: 'scene',
        unitIds: ['sc_0004'],
      }),
      expect.any(String),
    );
  });

  it('switches manual Generate to all scenes only after an explicit scope change', async () => {
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Surface Impact', order: 2 },
      { id: 'sc_0003', title: 'Basement Pulse', order: 3 },
    ];
    mockActiveSceneId = 'sc_0002';
    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'demo_project',
        unitScope: 'scene',
        unitIds: ['sc_0001', 'sc_0002', 'sc_0003'],
        model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
        scenes: [
          { id: 'sc_0001', title: 'Arrival', order: 1, chapter_id: 'ch_0001' },
          { id: 'sc_0002', title: 'Surface Impact', order: 2, chapter_id: 'ch_0001' },
          { id: 'sc_0003', title: 'Basement Pulse', order: 3, chapter_id: 'ch_0001' },
        ],
        budget: {
          estimated_usd: 3.75,
          status: 'ok',
          soft_limit_usd: 5,
          hard_limit_usd: 10,
          spent_usd: 0,
          total_after_usd: 3.75,
        },
      },
      traceId: 'trace-all-scenes-preflight',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    fireEvent.click(await screen.findByTestId('generation-scope-all-scenes'));

    const generateButton = await screen.findByRole('button', { name: /generate all scenes/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    expect(services.preflightDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitScope: 'scene',
        unitIds: ['sc_0001', 'sc_0002', 'sc_0003'],
        traceId: expect.any(String),
      }),
    );

    fireEvent.click(await screen.findByRole('button', { name: /proceed/i }));

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    expect(services.generateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitScope: 'scene',
        unitIds: ['sc_0001', 'sc_0002', 'sc_0003'],
      }),
      expect.any(String),
    );
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

  it('shows a backend-unreachable message when preflight cannot connect to the services', async () => {
    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Service request to http://127.0.0.1:8000/api/v1/draft/preflight failed: fetch failed',
        details: {
          url: 'http://127.0.0.1:8000/api/v1/draft/preflight',
          message: 'fetch failed',
        },
        traceId: 'trace-preflight-network-error',
      },
      traceId: 'trace-preflight-network-error',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/Unable to complete preflight/i);
    expect(screen.getByText(/backend unreachable/i)).toBeInTheDocument();
    expect(screen.getByText(/uvicorn blackskies\.services\.app:app/i)).toBeInTheDocument();
  });

  it('shows a distinct timeout message when preflight exceeds the bridge timeout', async () => {
    services.preflightDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request timed out after 45000ms.',
        details: { timeout_ms: 45_000 },
        traceId: 'trace-preflight-timeout',
      },
      traceId: 'trace-preflight-timeout',
    });

    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    await screen.findByText(/Unable to complete preflight/i);
    expect(screen.getByText(/timed out/i)).toBeInTheDocument();
    expect(screen.queryByText(/backend unreachable/i)).toBeNull();
  });

  it('propagates the same trace id from preflight into draft generation', async () => {
    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const preflightRequest = vi.mocked(services.preflightDraft).mock.calls[0][0];
    expect(preflightRequest.traceId).toEqual(expect.any(String));

    const proceedButton = await screen.findByRole('button', { name: /proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    expect(services.generateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'demo',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
      }),
      preflightRequest.traceId,
    );
  });

  it('clears Working state and closes the modal after a successful Proceed response', async () => {
    let resolveGenerate:
      | ((value: { ok: true; data: DraftGenerateBridgeResponse; traceId: string }) => void)
      | undefined;
    services.generateDraft = vi.fn().mockImplementation(
      () =>
        new Promise<{ ok: true; data: DraftGenerateBridgeResponse; traceId: string }>((resolve) => {
          resolveGenerate = resolve;
        }),
    );

    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    const proceedButton = await screen.findByRole('button', { name: /proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    expect(within(await screen.findByRole('dialog', { name: /draft preflight/i })).getByRole('button', { name: /working/i })).toBeInTheDocument();

    resolveGenerate?.({
      ok: true,
      data: {
        draft_id: 'dr_001',
        schema_version: 'DraftUnitSchema v1',
        units: [],
        budget: undefined,
      },
      traceId: 'trace-generate-success',
    });

    await waitFor(() => expect(screen.queryByRole('dialog', { name: /draft preflight/i })).toBeNull());
    expect(screen.queryByText(/Working/i)).toBeNull();
  });

  it('surfaces generated unit text in the draft preview state after Proceed succeeds even after disk reload', async () => {
    const generatedText = 'Mara steadied her breath as the corridor held still.';
    const staleProject: LoadedProject = {
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
      drafts: {
        sc_0001: 'stale disk draft',
      },
    };
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn(),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: staleProject,
        issues: [],
      }),
    };
    services.generateDraft = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        draft_id: 'dr_generated_preview',
        schema_version: 'DraftUnitSchema v1',
        units: [
          {
            id: 'sc_0001',
            text: generatedText,
            meta: { title: 'Arrival' },
          },
        ],
        budget: undefined,
      },
      traceId: 'trace-generated-preview',
    });

    const App = loadAppWithServices(services, { projectLoader });

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    fireEvent.click(await screen.findByRole('button', { name: /proceed/i }));

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: '/projects/demo' }));
    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toHaveTextContent(generatedText));
    expect(screen.getByTestId('project-home-mock')).not.toHaveTextContent('stale disk draft');
  });

  it('hydrates floated draft preview from the shared live state instead of stale disk text', async () => {
    const generatedText = 'Mara steadied her breath as the corridor held still.';
    const projectPath = '/projects/demo';
    const staleProject: LoadedProject = {
      path: projectPath,
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
      drafts: {
        sc_0001: 'stale disk draft',
      },
    };
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn(),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: staleProject,
        issues: [],
      }),
    };
    const sharedState: DraftPreviewSyncState = {
      sourceId: 'dock-window',
      projectPath,
      activeSceneId: 'sc_0001',
      projectDrafts: {
        sc_0001: 'stale disk draft',
      },
      draftEdits: {
        sc_0001: generatedText,
      },
      updatedAt: Date.now(),
    };

    writeDraftPreviewSyncState(projectPath, sharedState);
    window.history.pushState(null, '', `/?floatingPane=draftPreview&projectPath=${encodeURIComponent(projectPath)}`);

    const App = loadAppWithServices(services, { projectLoader });

    render(<App />);

    await waitFor(() => expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: projectPath }));
    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toHaveTextContent(generatedText));
    expect(screen.getByTestId('project-home-mock')).not.toHaveTextContent('stale disk draft');
    expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0001');
  });

  it('keeps the floated draft preview synced when another window publishes a new active scene', async () => {
    const firstGeneratedText = 'Mara steadied her breath as the corridor held still.';
    const secondGeneratedText = 'Surface impact draft text from the synced dock window.';
    const projectPath = '/projects/demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Surface Impact', order: 2 },
    ];

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn(),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: {
          path: projectPath,
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
              {
                id: 'sc_0002',
                order: 2,
                title: 'Surface Impact',
                chapter_id: 'ch_0001',
                beat_refs: [],
              },
            ],
          },
          scenes: [
            { id: 'sc_0001', title: 'Arrival', order: 1 },
            { id: 'sc_0002', title: 'Surface Impact', order: 2 },
          ],
          drafts: {
            sc_0001: 'stale disk draft',
            sc_0002: 'stale disk draft two',
          },
        } satisfies LoadedProject,
        issues: [],
      }),
    };
    const initialState: DraftPreviewSyncState = {
      sourceId: 'dock-window',
      projectPath,
      activeSceneId: 'sc_0001',
      projectDrafts: {
        sc_0001: 'stale disk draft',
        sc_0002: 'stale disk draft two',
      },
      draftEdits: {
        sc_0001: firstGeneratedText,
      },
      updatedAt: Date.now(),
    };

    writeDraftPreviewSyncState(projectPath, initialState);
    window.history.pushState(null, '', `/?floatingPane=draftPreview&projectPath=${encodeURIComponent(projectPath)}`);

    const App = loadAppWithServices(services, { projectLoader });

    render(<App />);

    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toHaveTextContent(firstGeneratedText));
    expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0001');

    const nextState: DraftPreviewSyncState = {
      sourceId: 'dock-window-2',
      projectPath,
      activeSceneId: 'sc_0002',
      projectDrafts: {
        sc_0001: 'stale disk draft',
        sc_0002: 'stale disk draft two',
      },
      draftEdits: {
        sc_0002: secondGeneratedText,
      },
      updatedAt: Date.now() + 1,
    };

    writeDraftPreviewSyncState(projectPath, nextState);
    dispatchDraftPreviewStorageEvent(projectPath);

    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toHaveTextContent(secondGeneratedText));
    expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0002');
    expect(screen.getByTestId('project-home-mock')).not.toHaveTextContent('stale disk draft');
  });

  it('rebinds a floated draft preview to the next project path instead of leaving stale project state behind', async () => {
    const projectPathA = '/projects/alpha';
    const projectPathB = '/projects/beta';
    const generatedTextA = 'Alpha floating preview text.';
    const generatedTextB = 'Beta floating preview text.';

    mockLoadedProjectPath = projectPathA;
    mockLoadedProjectId = 'proj_alpha';
    mockLoadedProjectName = 'Alpha Project';
    mockLoadedProjectScenes = [{ id: 'sc_0001', title: 'Arrival', order: 1 }];

    const alphaProject: LoadedProject = {
      path: projectPathA,
      name: 'Alpha Project',
      outline: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'out_alpha',
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
      scenes: [{ id: 'sc_0001', title: 'Arrival', order: 1 }],
      drafts: { sc_0001: 'stale alpha disk draft' },
    };
    const betaProject: LoadedProject = {
      path: projectPathB,
      name: 'Beta Project',
      outline: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'out_beta',
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
      scenes: [{ id: 'sc_0001', title: 'Arrival', order: 1 }],
      drafts: { sc_0001: 'stale beta disk draft' },
    };

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn(),
      loadProject: vi.fn().mockImplementation(async ({ path }) => ({
        ok: true,
        project: path === projectPathB ? betaProject : alphaProject,
        issues: [],
      })),
    };

    writeDraftPreviewSyncState(projectPathA, {
      sourceId: 'dock-window-a',
      projectPath: projectPathA,
      activeSceneId: 'sc_0001',
      projectDrafts: { sc_0001: 'stale alpha disk draft' },
      draftEdits: { sc_0001: generatedTextA },
      updatedAt: Date.now(),
    });
    window.history.pushState(
      null,
      '',
      `/?floatingPane=draftPreview&projectPath=${encodeURIComponent(projectPathA)}`,
    );

    const App = loadAppWithServices(services, { projectLoader });
    const { unmount } = render(<App />);

    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toHaveTextContent(generatedTextA));
    expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0001');

    mockLoadedProjectPath = projectPathB;
    mockLoadedProjectId = 'proj_beta';
    mockLoadedProjectName = 'Beta Project';
    writeDraftPreviewSyncState(projectPathB, {
      sourceId: 'dock-window-b',
      projectPath: projectPathB,
      activeSceneId: 'sc_0001',
      projectDrafts: { sc_0001: 'stale beta disk draft' },
      draftEdits: { sc_0001: generatedTextB },
      updatedAt: Date.now() + 1,
    });
    dispatchDraftPreviewStorageEvent(projectPathB);
    window.history.pushState(
      null,
      '',
      `/?floatingPane=draftPreview&projectPath=${encodeURIComponent(projectPathB)}`,
    );

    unmount();
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toHaveTextContent(generatedTextB));
    expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0001');
    expect(screen.getByTestId('project-home-mock')).not.toHaveTextContent(generatedTextA);
  });

  it('uses project.json projectId from the loaded project for preflight and generation requests', async () => {
    mockLoadedProjectId = 'proj_demo_canonical';
    const App = loadAppWithServices(services);

    render(<App />);

    const generateButton = await screen.findByRole('button', { name: /generate/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());

    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    expect(services.preflightDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_demo_canonical',
      }),
    );

    fireEvent.click(await screen.findByRole('button', { name: /proceed/i }));

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    expect(services.generateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_demo_canonical',
      }),
      expect.any(String),
    );
  });

  it('shows a draft-generation timeout message after proceed instead of preflight timeout text', async () => {
    services.generateDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request timed out after 45000ms.',
        details: { timeout_ms: 45_000 },
        traceId: 'trace-generate-timeout',
      },
      traceId: 'trace-generate-timeout',
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
    const modal = await screen.findByRole('dialog', { name: /draft preflight/i });
    expect(within(modal).getByText(/Unable to complete draft generation/i)).toBeInTheDocument();
    expect(within(modal).getByText(/Draft generation timed out/i)).toBeInTheDocument();
    expect(within(modal).queryByText(/Unable to complete preflight/i)).toBeNull();
  });

  it('shows a provider timeout message after proceed when the backend reports provider timeout', async () => {
    services.generateDraft = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'PROVIDER_TIMEOUT',
        message: 'Provider/model timed out.',
        details: { provider: 'openai', model: 'gpt-4o-mini' },
        traceId: 'trace-provider-timeout',
      },
      traceId: 'trace-provider-timeout',
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
    const modal = await screen.findByRole('dialog', { name: /draft preflight/i });
    expect(within(modal).getByText(/Unable to complete draft generation/i)).toBeInTheDocument();
    expect(within(modal).getByText(/Provider\/model timed out/i)).toBeInTheDocument();
    expect(within(modal).queryByText(/Draft generation timed out/i)).toBeNull();
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
    await screen.findByRole('button', { name: /backend services offline/i });
  });

  it('triggers snapshot and verification from the header', async () => {
    const App = loadAppWithServices(services);
    render(<App />);

    const snapshotButton = await screen.findByTestId('workspace-action-snapshot');
    fireEvent.click(snapshotButton);
    await waitFor(() => {
      expect(services.createProjectSnapshot).toBeDefined();
      expect(services.createProjectSnapshot).toHaveBeenCalled();
    });

    const verifyButton = await screen.findByTestId('workspace-action-verify');
    fireEvent.click(verifyButton);
    await waitFor(() => {
      expect(services.runBackupVerification).toBeDefined();
      expect(services.runBackupVerification).toHaveBeenCalledWith({
        projectId: 'demo',
        latestOnly: true,
      });
    });
  });

  it('refreshes the mounted snapshots panel after creating a snapshot', async () => {
    const oldSnapshot = {
      snapshot_id: 'snap-old',
      created_at: '2025-11-15T12:00:00Z',
      path: '.snapshots/snap-old',
      files_included: [],
    } satisfies SnapshotManifest;
    const newSnapshot = {
      snapshot_id: 'snap-new',
      created_at: '2025-11-16T12:00:00Z',
      path: '.snapshots/snap-new',
      files_included: [],
    } satisfies SnapshotManifest;

    services.listProjectSnapshots = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: [oldSnapshot] })
      .mockResolvedValueOnce({ ok: true, data: [newSnapshot, oldSnapshot] });

    const App = loadAppWithServices(services);
    render(<App />);

    await screen.findByText(/Your Story/i);
    await screen.findByText(/Demo Project/i);
    expect(screen.queryByText(/Project ID:/i)).toBeNull();

    await userEvent.click(await screen.findByTestId('snapshots-open-button'));
    const snapshotsPanel = await screen.findByTestId('snapshots-panel');
    expect(snapshotsPanel).toBeInTheDocument();
    await waitFor(() => expect(services.listProjectSnapshots).toHaveBeenCalledTimes(1));
    expect(screen.getByText('snap-old')).toBeInTheDocument();

    const snapshotButton = await screen.findByLabelText(/create snapshot/i);
    snapshotButton.removeAttribute('disabled');
    await userEvent.click(snapshotButton);

    await waitFor(() =>
      expect(services.createProjectSnapshot).toHaveBeenCalledWith({
        projectId: 'demo',
      }),
    );
    await waitFor(() => expect(services.listProjectSnapshots).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('snap-new')).toBeInTheDocument();
  });

  it('opens snapshots panel without revealing a snapshot path from the create toast', async () => {
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
    await screen.findByText(/Demo Project/i);
    expect(screen.queryByText(/Project ID:/i)).toBeNull();
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

    const openPanelToastAction = await waitFor(() => {
      const button = document.querySelector('.toast__action-button');
      expect(button).toHaveTextContent(/open snapshots panel/i);
      return button as HTMLButtonElement;
    });
    const revealCallsBeforeCreateToast = vi.mocked(services.revealPath).mock.calls.length;
    await userEvent.click(openPanelToastAction);

    const reopenedSnapshotsPanel = await screen.findByTestId('snapshots-panel');
    expect(reopenedSnapshotsPanel).toBeInTheDocument();
    expect(vi.mocked(services.revealPath).mock.calls.length).toBe(revealCallsBeforeCreateToast);
  });

  it('refreshes the snapshot list when the create toast reopens the panel', async () => {
    const oldSnapshot = {
      snapshot_id: 'snap-old',
      created_at: '2025-11-15T12:00:00Z',
      path: '.snapshots/snap-old',
      files_included: [],
    } satisfies SnapshotManifest;
    const newSnapshot = {
      snapshot_id: 'snap-new',
      created_at: '2025-11-16T12:00:00Z',
      path: '.snapshots/snap-new',
      files_included: [],
    } satisfies SnapshotManifest;

    services.listProjectSnapshots = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: [oldSnapshot] })
      .mockResolvedValueOnce({ ok: true, data: [newSnapshot, oldSnapshot] });

    const App = loadAppWithServices(services);
    render(<App />);

    await screen.findByText(/Your Story/i);
    await screen.findByText(/Demo Project/i);
    expect(screen.queryByText(/Project ID:/i)).toBeNull();

    await userEvent.click(await screen.findByTestId('snapshots-open-button'));
    const snapshotsPanel = await screen.findByTestId('snapshots-panel');
    expect(snapshotsPanel).toBeInTheDocument();
    await waitFor(() => expect(services.listProjectSnapshots).toHaveBeenCalledTimes(1));
    expect(screen.getByText('snap-old')).toBeInTheDocument();

    const snapshotButton = await screen.findByLabelText(/create snapshot/i);
    snapshotButton.removeAttribute('disabled');
    await userEvent.click(snapshotButton);

    await waitFor(() => expect(services.listProjectSnapshots).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('snap-new')).toBeInTheDocument();
  });

  it('keeps the Phase 11A shell as the default when Split Command is not enabled', async () => {
    expect(DEFAULT_RUNTIME_CONFIG.ui.experimentalSplitCommandWorkspace).toBe(false);
    const App = loadAppWithServices(services);

    render(<App />);

    expect(await screen.findByTestId('project-home-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('split-command-workspace')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Wizard dock')).toBeInTheDocument();
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-app-mode', 'stable-gui');
  });

  it('ignores shell-local persistence entirely when Split Command is flag-off', async () => {
    const corruptedShellState = '{not-json';
    window.localStorage.setItem(SPLIT_COMMAND_SHELL_STORAGE_KEY, corruptedShellState);

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('project-home-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('split-command-workspace')).not.toBeInTheDocument();
    expect(screen.queryByTestId('split-command-shell-status')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-app-mode', 'stable-gui');
    expect(window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY)).toBe(corruptedShellState);
  });

  it('renders the experimental Split Command shell only when the runtime flag is enabled', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectName = 'Split Command Demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];

    const App = loadAppWithServices(services);

    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(screen.getByLabelText('Command Center')).toBeInTheDocument();
    expect(screen.getByLabelText('Writing Studio')).toBeInTheDocument();
    expect(screen.getByTestId('project-home-mock')).toBeInTheDocument();
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-app-mode', 'split-command');
    expect(
      within(screen.getByLabelText('Story Navigation')).getByRole('button', {
        name: 'Select Arrival',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Wizard dock')).not.toBeInTheDocument();
  });

  it('restores valid same-project split-command shell state on reopen', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectPath = '/projects/split-command';
    mockLoadedProjectName = 'Split Command Demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
        projectPath: '/projects/split-command',
        selectedSceneId: 'sc_0002',
        commandCenterCollapsed: false,
        diagnosticsOpen: true,
      }),
    );

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0002');
    });
    expect(screen.queryByTestId('split-command-shell-status')).toBeNull();
  });

  it('resets corrupted split-command shell persistence without polluting the stable GUI path', async () => {
    enableSplitCommandWorkspace();
    window.localStorage.setItem(SPLIT_COMMAND_SHELL_STORAGE_KEY, '{not-json');

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('split-command-shell-status')).toHaveTextContent(
      /corrupted persistence/i,
    );
    expect(window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY)).not.toBe('{not-json');
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-app-mode', 'split-command');
  });

  it('resets unsupported split-command shell persistence without leaving stale shell state active', async () => {
    enableSplitCommandWorkspace();
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 999,
        projectPath: '/projects/demo',
        selectedSceneId: 'sc_0002',
        diagnosticsOpen: true,
      }),
    );

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('split-command-shell-status')).toHaveTextContent(
      /unsupported shell schema/i,
    );
    expect(window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY)).toBeTruthy();
    const persistedState = JSON.parse(
      window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY) ?? 'null',
    ) as { schemaVersion: number; selectedSceneId: string | null; diagnosticsOpen: boolean };
    expect(persistedState.schemaVersion).toBe(SPLIT_COMMAND_SHELL_SCHEMA_VERSION);
    expect(persistedState.selectedSceneId).toBe('sc_0001');
    expect(persistedState.diagnosticsOpen).toBe(false);
  });

  it('invalidates stale shell-local state when the project path changes', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_beta';
    mockLoadedProjectPath = '/projects/beta';
    mockLoadedProjectName = 'Beta Project';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
        projectPath: '/projects/alpha',
        selectedSceneId: 'sc_0002',
        commandCenterCollapsed: false,
        diagnosticsOpen: true,
      }),
    );

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('split-command-shell-status')).toHaveTextContent(
      /project identity change/i,
    );
    await waitFor(() => {
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0001');
    });
    await waitFor(() => {
      const persistedState = JSON.parse(
        window.localStorage.getItem(SPLIT_COMMAND_SHELL_STORAGE_KEY) ?? 'null',
      ) as { projectPath: string | null; selectedSceneId: string | null; diagnosticsOpen: boolean };
      expect(persistedState.projectPath).toBe('/projects/beta');
      expect(persistedState.selectedSceneId).toBe('sc_0001');
      expect(persistedState.diagnosticsOpen).toBe(false);
    });
  });

  it('returns to stable GUI mode cleanly when the split-command flag is turned off', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectPath = '/projects/split-command';
    mockLoadedProjectName = 'Split Command Demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
        projectPath: '/projects/split-command',
        selectedSceneId: 'sc_0002',
        commandCenterCollapsed: false,
        diagnosticsOpen: false,
      }),
    );

    const App = loadAppWithServices(services);
    const firstRender = render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0002');
    });

    firstRender.unmount();
    Reflect.deleteProperty(
      window as typeof window & { __runtimeConfigOverride?: typeof DEFAULT_RUNTIME_CONFIG },
      '__runtimeConfigOverride',
    );

    render(<App />);

    expect(await screen.findByTestId('project-home-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('split-command-workspace')).not.toBeInTheDocument();
    expect(screen.queryByTestId('split-command-shell-status')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Wizard dock')).toBeInTheDocument();
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-app-mode', 'stable-gui');
  });

  it('keeps shell reset notices local to Split Command after a recoverable shell reset', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_beta';
    mockLoadedProjectPath = '/projects/beta';
    mockLoadedProjectName = 'Beta Project';
    mockLoadedProjectScenes = [{ id: 'sc_0001', title: 'Arrival', order: 1 }];
    window.localStorage.setItem(
      SPLIT_COMMAND_SHELL_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: SPLIT_COMMAND_SHELL_SCHEMA_VERSION,
        projectPath: '/projects/alpha',
        selectedSceneId: 'sc_0009',
        commandCenterCollapsed: false,
        diagnosticsOpen: true,
      }),
    );

    const App = loadAppWithServices(services);
    const splitRender = render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('split-command-shell-status')).toHaveTextContent(
      /project identity change/i,
    );

    splitRender.unmount();
    Reflect.deleteProperty(
      window as typeof window & { __runtimeConfigOverride?: typeof DEFAULT_RUNTIME_CONFIG },
      '__runtimeConfigOverride',
    );

    render(<App />);

    expect(await screen.findByTestId('project-home-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('split-command-workspace')).not.toBeInTheDocument();
    expect(screen.queryByTestId('split-command-shell-status')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-root')).toHaveAttribute('data-app-mode', 'stable-gui');
  });

  it('condenses the command center first when the split-command viewport is constrained', async () => {
    enableSplitCommandWorkspace();
    setViewportWidth(1100);

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('app-root')).toHaveAttribute(
        'data-split-command-layout',
        'condensed',
      );
    });
    expect(screen.getByTestId('split-command-layout-note')).toHaveTextContent(
      /supporting command surfaces stay collapsed/i,
    );
    expect(screen.getByLabelText('Story Navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Future command surfaces')).not.toBeVisible();
    expect(screen.getByTestId('project-home-mock')).toBeInTheDocument();
  });

  it('cleans up the shell resize listener on unmount and does not bind it for the stable GUI path', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const StableApp = loadAppWithServices(services);
    const stableRender = render(<StableApp />);
    await screen.findByTestId('project-home-mock');
    expect(addSpy.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
    stableRender.unmount();

    enableSplitCommandWorkspace();
    const SplitApp = loadAppWithServices(services);
    const splitRender = render(<SplitApp />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(addSpy.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);

    splitRender.unmount();

    expect(removeSpy.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
  });

  it('does not re-emit layout diagnostics when repeated resize events stay within the same shell mode', async () => {
    enableSplitCommandWorkspace();
    setViewportWidth(1100);
    const consoleSpy = vi.spyOn(console, 'log');

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();

    const condensedLogs = () =>
      consoleSpy.mock.calls.filter(
        ([message]) => message === '[dbg:split-command.layout.mode]',
      ).length;

    expect(condensedLogs()).toBe(1);

    setViewportWidth(1120);
    setViewportWidth(1110);
    expect(condensedLogs()).toBe(1);

    setViewportWidth(1400);
    await waitFor(() => {
      expect(screen.getByTestId('app-root')).toHaveAttribute('data-split-command-layout', 'full');
    });
    expect(condensedLogs()).toBe(2);

    setViewportWidth(1420);
    expect(condensedLogs()).toBe(2);
  });

  it('does not re-emit scene commit diagnostics when the active scene identity is unchanged', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectName = 'Split Command Demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];
    const consoleSpy = vi.spyOn(console, 'log');

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();

    const commitLogs = () =>
      consoleSpy.mock.calls.filter(([message]) => message === '[dbg:scene.select.commit]').length;

    expect(commitLogs()).toBe(2);

    const storyNavigation = screen.getByLabelText('Story Navigation');
    fireEvent.click(within(storyNavigation).getByRole('button', { name: 'Select Arrival' }));
    expect(commitLogs()).toBe(2);

    fireEvent.click(within(storyNavigation).getByRole('button', { name: 'Select Signal' }));
    await waitFor(() => {
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0002');
    });
    expect(commitLogs()).toBe(3);
  });

  it('keeps generation and preflight wired when ProjectHome is wrapped by Split Command', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectName = 'Split Command Demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];

    const App = loadAppWithServices(services);

    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('project-home-mock')).toBeInTheDocument();

    const storyNavigation = screen.getByLabelText('Story Navigation');
    fireEvent.click(within(storyNavigation).getByRole('button', { name: 'Select Signal' }));
    await waitFor(() =>
      expect(screen.getByTestId('project-home-mock')).toHaveAttribute('data-active-scene-id', 'sc_0002'),
    );

    const generateButton = await screen.findByRole('button', { name: /generate active scene/i });
    await waitFor(() => expect(generateButton).not.toBeDisabled());
    fireEvent.click(generateButton);

    await waitFor(() => expect(services.preflightDraft).toHaveBeenCalledTimes(1));
    expect(services.preflightDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_split_command',
        unitIds: ['sc_0002'],
      }),
    );

    const proceedButton = await screen.findByRole('button', { name: /proceed/i });
    fireEvent.click(proceedButton);

    await waitFor(() => expect(services.generateDraft).toHaveBeenCalledTimes(1));
    expect(services.generateDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj_split_command',
        unitIds: ['sc_0002'],
      }),
      expect.any(String),
    );
  });

  it('keeps snapshot and export actions wired when ProjectHome is wrapped by Split Command', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectName = 'Split Command Demo';
    mockLoadedProjectScenes = [
      { id: 'sc_0001', title: 'Arrival', order: 1 },
      { id: 'sc_0002', title: 'Signal', order: 2 },
    ];

    const App = loadAppWithServices(services);
    render(<App />);

    expect(await screen.findByTestId('split-command-workspace')).toBeInTheDocument();

    const snapshotButton = await screen.findByTestId('workspace-action-snapshot');
    fireEvent.click(snapshotButton);
    await waitFor(() => {
      expect(services.createProjectSnapshot).toHaveBeenCalledWith({
        projectId: 'proj_split_command',
      });
    });

    const exportButton = await screen.findByTestId('workspace-action-export');
    fireEvent.click(exportButton);
    await waitFor(() => {
      expect(services.exportProject).toHaveBeenCalledWith({
        format: 'md',
        projectId: 'proj_split_command',
      });
    });
  });

  it('keeps floating-pane hosts on the floating path even when Split Command is enabled', async () => {
    enableSplitCommandWorkspace();
    mockLoadedProjectId = 'proj_split_command';
    mockLoadedProjectPath = '/projects/floating-demo';
    mockLoadedProjectName = 'Split Command Floating Demo';

    window.history.pushState(
      null,
      '',
      `/?floatingPane=draftPreview&projectPath=${encodeURIComponent(mockLoadedProjectPath)}`,
    );

    const App = loadAppWithServices(services);
    render(<App />);

    await waitFor(() => expect(screen.getByTestId('project-home-mock')).toBeInTheDocument());
    expect(screen.queryByTestId('split-command-workspace')).not.toBeInTheDocument();
    expect(document.querySelector('.floating-pane-shell')).not.toBeNull();
    expect(screen.queryByLabelText('Command Center')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Writing Studio')).not.toBeInTheDocument();
  });

});
