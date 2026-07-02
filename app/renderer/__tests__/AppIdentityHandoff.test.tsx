import { cleanup, render, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

import type { LoadedProject } from '../../shared/ipc/projectLoader';
import type { ServicesBridge } from '../../shared/ipc/services';

declare global {
  interface Window {
    services?: ServicesBridge;
    projectLoader?: unknown;
    __testProjectState?: {
      loaded: boolean;
      path: string | null;
      projectId: string | null;
      activeSceneId: string | null;
      activeSceneTitle: string | null;
      sceneIds?: string[];
      label: string;
    };
    __blackskiesDebugProjectState?: unknown;
    __serviceHealthRetry?: () => Promise<void>;
    __runtimeConfigOverride?: unknown;
  }
}

let mockLoadedProject: LoadedProject;

function buildLoadedProject(overrides: Partial<LoadedProject>): LoadedProject {
  return {
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
        purpose: 'setup',
        emotion_tag: 'tension',
        word_target: 700,
      },
    ],
    drafts: {
      sc_0001: 'A single witness scene draft.',
    },
    bootstrapState: 'empty',
    ...overrides,
  };
}

function ProjectHomeMock({
  onProjectLoaded,
}: {
  onProjectLoaded?: (payload: LoadedProject | null) => void;
}): JSX.Element {
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;
    onProjectLoaded?.(mockLoadedProject);
  }, [onProjectLoaded]);

  return <div data-testid="project-home-mock" data-project-path={mockLoadedProject.path} />;
}

vi.mock('../components/ProjectHome', () => ({
  __esModule: true,
  default: ProjectHomeMock,
}));

vi.mock('../components/WizardPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="wizard-panel-mock" />,
}));

function createServicesMock(): ServicesBridge {
  return {
    checkHealth: vi.fn().mockResolvedValue({
      ok: true,
      data: { status: 'online', version: 'test' },
      traceId: 'trace-health',
    }),
    buildOutline: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'out_test',
        acts: [],
        chapters: [],
        scenes: [],
      },
      traceId: 'trace-outline',
    }),
    generateDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        draft_id: 'dr_test',
        schema_version: 'DraftUnitSchema v1',
        units: [],
      },
      traceId: 'trace-generate',
    }),
    critiqueDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        schema_version: 'CritiqueOutputSchema v1',
        summary: 'No-op critique',
      },
      traceId: 'trace-critique',
    }),
    rewriteDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        revised_text: 'No-op rewrite',
      },
      traceId: 'trace-rewrite',
    }),
    phase4Critique: vi.fn().mockResolvedValue({
      ok: true,
      data: { summary: '', issues: [], suggestions: [] },
      traceId: 'trace-phase4-critique',
    }),
    phase4Rewrite: vi.fn().mockResolvedValue({
      ok: true,
      data: { revisedText: '' },
      traceId: 'trace-phase4-rewrite',
    }),
    preflightDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'proj_placeholder',
        unitScope: 'scene',
        unitIds: ['sc_0001'],
        model: { name: 'draft-synthesizer-v1', provider: 'black-skies-local' },
        scenes: [{ id: 'sc_0001', title: 'Arrival', order: 1 }],
        budget: { estimated_usd: 0.5, status: 'ok' },
      },
      traceId: 'trace-preflight',
    }),
    acceptDraft: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        unit_id: 'sc_0001',
        checksum: 'checksum',
        snapshot: {
          snapshot_id: 'snap-test',
          label: 'accept',
          created_at: '2025-01-01T00:00:00Z',
          path: 'history/snapshots/snap-test',
        },
        schema_version: 'DraftAcceptResult v1',
      },
      traceId: 'trace-accept',
    }),
    createSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        snapshot_id: 'snap-created',
        label: 'manual',
        created_at: '2025-01-01T00:00:00Z',
        path: 'history/snapshots/snap-created',
      },
      traceId: 'trace-snapshot',
    }),
    createProjectSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        snapshot_id: 'snap-project',
        created_at: '2025-01-01T00:00:00Z',
        path: '.snapshots/snap-project',
        files_included: [],
      },
      traceId: 'trace-project-snapshot',
    }),
    listProjectSnapshots: vi.fn().mockResolvedValue({
      ok: true,
      data: [],
      traceId: 'trace-list-snapshots',
    }),
    getRecoveryStatus: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
      traceId: 'trace-recovery-status',
    }),
    restoreSnapshot: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        status: 'idle',
        needs_recovery: false,
        last_snapshot: null,
      },
      traceId: 'trace-restore',
    }),
    restoreFromZip: vi.fn().mockResolvedValue({
      ok: true,
      data: { status: 'ok' },
      traceId: 'trace-restore-zip',
    }),
    exportProject: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        path: 'exports/project.md',
        format: 'md',
        chapters: 0,
        scenes: 1,
        meta_header: false,
        exported_at: '2025-01-01T00:00:00Z',
        schema_version: 'ProjectExportResult v1',
      },
      traceId: 'trace-export',
    }),
    createBackup: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        filename: 'backup.zip',
        path: 'backups/backup.zip',
        created_at: '2025-01-01T00:00:00Z',
        checksum: 'checksum',
      },
      traceId: 'trace-backup-create',
    }),
    listBackups: vi.fn().mockResolvedValue({ ok: true, data: [], traceId: 'trace-backup-list' }),
    restoreBackup: vi.fn().mockResolvedValue({
      ok: true,
      data: { status: 'ok' },
      traceId: 'trace-backup-restore',
    }),
    runBackupVerification: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        snapshots: [],
      },
      traceId: 'trace-backup-verify',
    }),
    analyticsBudget: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        budget: {
          soft_limit_usd: 10,
          hard_limit_usd: 20,
          spent_usd: 0,
          remaining_usd: 20,
        },
        hint: 'ample',
      },
      traceId: 'trace-analytics-budget',
    }),
    getLastVerification: vi.fn().mockResolvedValue({
      ok: true,
      data: null,
      traceId: 'trace-last-verification',
    }),
    getBackupVerificationReport: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        project_id: 'proj_placeholder',
        snapshots: [],
      },
      traceId: 'trace-backup-report',
    }),
    revealPath: vi.fn().mockResolvedValue({ ok: true, path: '/tmp' }),
    getAnalyticsSummary: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'proj_placeholder',
        projectPath: '/projects/demo',
        scenes: 1,
        wordCount: 10,
        avgReadability: null,
      },
      traceId: 'trace-analytics-summary',
    }),
    getAnalyticsScenes: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'proj_placeholder',
        projectPath: '/projects/demo',
        scenes: [],
      },
      traceId: 'trace-analytics-scenes',
    }),
    getAnalyticsRelationships: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        projectId: 'proj_placeholder',
        nodes: [],
        edges: [],
      },
      traceId: 'trace-analytics-relationships',
    }),
  };
}

describe('App identity handoff witnesses', () => {
  let services: ServicesBridge;

  beforeEach(() => {
    services = createServicesMock();
    window.services = services;
    window.localStorage.clear();
    window.sessionStorage.clear();
    const existingModalRoot = document.getElementById('modal-root');
    if (!existingModalRoot) {
      const modalRoot = document.createElement('div');
      modalRoot.setAttribute('id', 'modal-root');
      document.body.appendChild(modalRoot);
    }
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    delete window.services;
    delete window.projectLoader;
    delete window.__testProjectState;
    delete window.__blackskiesDebugProjectState;
    delete window.__serviceHealthRetry;
    delete window.__runtimeConfigOverride;
    delete document.body.dataset.projectLoaded;
    delete document.documentElement.dataset.projectLoaded;
    delete document.body.dataset.projectPath;
    delete document.documentElement.dataset.projectPath;
    delete document.body.dataset.projectId;
    delete document.documentElement.dataset.projectId;
    delete document.body.dataset.activeSceneId;
    delete document.documentElement.dataset.activeSceneId;
  });

  it('adopts a basename-derived fallback when the supplied loaded project has no projectId', async () => {
    mockLoadedProject = buildLoadedProject({
      path: '/projects/missing-id-story',
      name: 'Missing Identity Story',
      projectId: undefined,
    });

    render(<App />);

    await waitFor(() =>
      expect((services.getRecoveryStatus as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
        projectId: 'missing-id-story',
      }),
    );

    await waitFor(() =>
      expect(window.__testProjectState).toMatchObject({
        loaded: true,
        path: '/projects/missing-id-story',
        projectId: 'missing-id-story',
      }),
    );

    expect(document.documentElement.dataset.projectLoaded).toBe('1');
    expect(document.body.dataset.projectLoaded).toBe('1');
    expect(document.documentElement.dataset.projectPath).toBe('/projects/missing-id-story');
    expect(document.body.dataset.projectPath).toBe('/projects/missing-id-story');
    expect(document.documentElement.dataset.projectId).toBe('missing-id-story');
    expect(document.body.dataset.projectId).toBe('missing-id-story');
    expect(services.restoreSnapshot).not.toHaveBeenCalled();
  });

  it('preserves an explicit metadata projectId when the supplied path basename differs', async () => {
    mockLoadedProject = buildLoadedProject({
      path: '/projects/path-beta',
      name: 'Alpha Divergence Story',
      projectId: 'proj_alpha',
    });

    render(<App />);

    await waitFor(() =>
      expect((services.getRecoveryStatus as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
        projectId: 'proj_alpha',
      }),
    );

    await waitFor(() =>
      expect(window.__testProjectState).toMatchObject({
        loaded: true,
        path: '/projects/path-beta',
        projectId: 'proj_alpha',
      }),
    );

    expect(document.documentElement.dataset.projectLoaded).toBe('1');
    expect(document.body.dataset.projectLoaded).toBe('1');
    expect(document.documentElement.dataset.projectPath).toBe('/projects/path-beta');
    expect(document.body.dataset.projectPath).toBe('/projects/path-beta');
    expect(document.documentElement.dataset.projectId).toBe('proj_alpha');
    expect(document.body.dataset.projectId).toBe('proj_alpha');
    expect(document.documentElement.dataset.projectId).not.toBe('path-beta');
    expect(document.body.dataset.projectId).not.toBe('path-beta');
    expect(services.restoreSnapshot).not.toHaveBeenCalled();
  });
});
