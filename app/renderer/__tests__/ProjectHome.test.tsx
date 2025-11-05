import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProjectHome from '../components/ProjectHome';
import type {
  LoadedProject,
  OutlineFile,
  ProjectIssue,
  ProjectLoaderApi,
} from '../../shared/ipc/projectLoader';
import type { ToastPayload } from '../types/toast';

function createSampleProject(path: string): LoadedProject {
  const outline: OutlineFile = {
    schema_version: 'OutlineSchema v1',
    outline_id: 'outline-001',
    acts: ['Act I'],
    chapters: [{ id: 'ch_0001', order: 1, title: 'Opening' }],
    scenes: [{ id: 'sc_0001', order: 1, title: 'Scene One', chapter_id: 'ch_0001' }],
  };

  return {
    path,
    name: 'Sample Project',
    outline,
    scenes: [
      {
        id: 'sc_0001',
        title: 'Scene One',
        order: 1,
        chapter_id: 'ch_0001',
      },
    ],
    drafts: {
      sc_0001: '# Scene One',
    },
  };
}

describe('ProjectHome recent project recovery', () => {
  const flushPromises = () => act(async () => { await Promise.resolve(); });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete (window as Partial<Record<string, unknown>>).projectLoader;
  });

  it('removes stale recent entries and falls back to the sample project', async () => {
    const stalePath = 'C:\\missing\\project';
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    window.localStorage.setItem(
      'blackskies.recent-projects',
      JSON.stringify([{ path: stalePath, name: 'Missing Project', lastOpened: Date.now() }]),
    );
    window.localStorage.setItem('blackskies.last-project', stalePath);

    const failureIssues: ProjectIssue[] = [
      {
        level: 'error',
        message: 'outline.json could not be read.',
        detail: 'ENOENT',
        path: `${stalePath}\\outline.json`,
      },
    ];

    const loadProjectMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        project: createSampleProject(samplePath),
        issues: [],
      })
      .mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project directory missing.',
          issues: failureIssues,
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        project: createSampleProject(samplePath),
        issues: [],
      });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;
    const toaster: ToastPayload[] = [];

    render(
      <ProjectHome
        onToast={(toast) => toaster.push(toast)}
        onProjectLoaded={vi.fn()}
      />,
    );

    const recentButton = await screen.findByRole('button', { name: /Missing Project/i });
    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(projectLoader.loadProject.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const callPaths = projectLoader.loadProject.mock.calls.map(([request]) => request.path);
    expect(callPaths).toContain(stalePath);
    expect(callPaths.filter((path) => path === samplePath).length).toBeGreaterThanOrEqual(1);

    await waitFor(() => {
      const storedRecents = JSON.parse(
        window.localStorage.getItem('blackskies.recent-projects') ?? '[]',
      ) as Array<{ path: string }>;
      expect(storedRecents.some((entry) => entry.path === stalePath)).toBe(false);
      expect(storedRecents.some((entry) => entry.path === samplePath)).toBe(true);
    });

    const errorToast = toaster.find((toast) => toast.title === 'Could not open project');
    expect(errorToast?.description).toContain('ENOENT');
  });

  it('removes stale recents when loadProject rejects and still falls back to the sample project', async () => {
    const stalePath = 'C:\\archived\\missing-project';
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    window.localStorage.setItem(
      'blackskies.recent-projects',
      JSON.stringify([{ path: stalePath, name: 'Archived Draft', lastOpened: Date.now() }]),
    );

    const loadProjectMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        project: createSampleProject(samplePath),
        issues: [],
      })
      .mockRejectedValueOnce(new Error('EACCES: permission denied'))
      .mockResolvedValueOnce({
        ok: true,
        project: createSampleProject(samplePath),
        issues: [],
      });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;
    const toasts: ToastPayload[] = [];

    render(<ProjectHome onToast={(toast) => toasts.push(toast)} onProjectLoaded={vi.fn()} />);

    const recentButton = await screen.findByRole('button', { name: /Archived Draft/i });
    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: stalePath });
    });

    await waitFor(() => {
      const storedRecents = JSON.parse(
        window.localStorage.getItem('blackskies.recent-projects') ?? '[]',
      ) as Array<{ path: string }>;
      expect(storedRecents.some((entry) => entry.path === stalePath)).toBe(false);
      expect(storedRecents.some((entry) => entry.path === samplePath)).toBe(true);
    });

    const failureToast = toasts.find((toast) => toast.title === 'Project load failed');
    expect(failureToast?.description).toContain('permission denied');
  });

  it('bootstraps the sample project when no recents are available', async () => {
    window.localStorage.clear();

    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createSampleProject(samplePath),
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    const storedRecents = JSON.parse(
      window.localStorage.getItem('blackskies.recent-projects') ?? '[]',
    ) as Array<{ path: string }>;
    expect(storedRecents[0]?.path).toBe(samplePath);
  });

  it('surfaces project metadata after a successful load', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createSampleProject(samplePath);

    const loadProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project,
      issues: [],
    });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    await flushPromises();

    expect(screen.getByRole('heading', { level: 4, name: /Sample Project/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: /Scene One/ })).toBeInTheDocument();
    expect(screen.getByText(/Scenes/)).toBeInTheDocument();
  });
});
