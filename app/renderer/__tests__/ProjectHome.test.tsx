import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProjectHome from '../components/ProjectHome';
import type {
  LoadedProject,
  OutlineFile,
  ProjectIssue,
  ProjectLoaderApi,
} from '../../shared/ipc/projectLoader';
import { createRuntimeSessionTruthContract } from '../../shared/runtimeSessionTruth';
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
    projectId: 'proj_sample_project',
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

function createMultiSceneProject(path: string): LoadedProject {
  const outline: OutlineFile = {
    schema_version: 'OutlineSchema v1',
    outline_id: 'outline-004',
    acts: ['Act I'],
    chapters: [{ id: 'ch_0001', order: 1, title: 'Opening' }],
    scenes: [
      { id: 'sc_0001', order: 1, title: 'Scene One', chapter_id: 'ch_0001' },
      { id: 'sc_0002', order: 2, title: 'Scene Two', chapter_id: 'ch_0001' },
      { id: 'sc_0003', order: 3, title: 'Scene Three', chapter_id: 'ch_0001' },
      { id: 'sc_0004', order: 4, title: 'Scene Four', chapter_id: 'ch_0001' },
    ],
  };

  return {
    path,
    name: 'Sample Project',
    outline,
    scenes: outline.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      order: scene.order,
      chapter_id: scene.chapter_id,
      purpose:
        scene.id === 'sc_0001'
          ? 'setup'
          : scene.id === 'sc_0002'
            ? 'escalation'
            : scene.id === 'sc_0003'
              ? 'payoff'
              : 'breath',
      emotion_tag:
        scene.id === 'sc_0001'
          ? 'tension'
          : scene.id === 'sc_0002'
            ? 'dread'
            : scene.id === 'sc_0003'
              ? 'revelation'
              : 'respite',
      word_target: scene.id === 'sc_0004' ? 210 : 260,
    })),
    drafts: {
      sc_0001: '# Scene One',
      sc_0002: '# Scene Two',
      sc_0003: '# Scene Three',
      sc_0004: '# Scene Four',
    },
  };
}

function createBootstrapStateProject(
  path: string,
  bootstrapState: 'empty' | 'scaffold_initialized' | 'partial',
  bootstrapTemplate?: string,
): LoadedProject {
  const outline: OutlineFile =
    bootstrapState === 'scaffold_initialized'
      ? {
          schema_version: 'OutlineSchema v1',
          outline_id: 'outline-002',
          acts: ['Act I'],
          chapters: [{ id: 'ch_0001', order: 1, title: 'Opening' }],
          scenes: [{ id: 'sc_0001', order: 1, title: 'Scene One', chapter_id: 'ch_0001' }],
        }
      : {
          schema_version: 'OutlineSchema v1',
          outline_id: 'outline-001',
          acts: [],
          chapters: [],
          scenes: [],
        };
  return {
    ...createSampleProject(path),
    bootstrapState,
    bootstrapTemplate,
    outline,
    scenes:
      bootstrapState === 'scaffold_initialized'
        ? [
            {
              id: 'sc_0001',
              title: 'Scene One',
              order: 1,
              chapter_id: 'ch_0001',
            },
          ]
        : [],
    drafts:
      bootstrapState === 'scaffold_initialized'
        ? {
            sc_0001: '---\n' +
              'id: sc_0001\n' +
              'title: Scene One\n' +
              'order: 1\n' +
              'chapter_id: ch_0001\n' +
              '---\n' +
              'Starter scaffold scene.\n',
          }
        : {},
  };
}

describe('ProjectHome recent project recovery', () => {
  const flushPromises = () => act(async () => { await Promise.resolve(); });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    delete (window as Partial<Record<string, unknown>>).projectLoader;
  });

  it('shows an explicit welcome card while bootstrap waits for the sample project', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    let resolveSamplePath!: (value: string | null) => void;
    const samplePathPromise = new Promise<string | null>((resolve) => {
      resolveSamplePath = resolve;
    });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockReturnValue(samplePathPromise),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createSampleProject(samplePath),
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    expect(
      await screen.findByRole('heading', {
        name: /Open an existing project or create a new bootstrap project/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Open existing project/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: /Quick start with sample project/i }),
    ).toBeEnabled();

    resolveSamplePath?.(samplePath);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });
  });

  it('hides the welcome card in visual-home mode while still allowing project loading', async () => {
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

    render(
      <ProjectHome
        suppressBootstrap
        suppressWelcome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('heading', {
        name: /Open an existing project or create a new bootstrap project/i,
      }),
    ).toBeNull();
    expect(screen.getByRole('button', { name: /Open project/i })).toBeEnabled();
  });

  it('loads the sample project when quick start is selected', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const loadProjectMock = vi.fn().mockResolvedValue({
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

    render(
      <ProjectHome
        suppressBootstrap
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /Quick start with sample project/i }),
    );

    await waitFor(() => {
      expect(loadProjectMock).toHaveBeenCalledWith({ path: samplePath });
    });
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

  it('creates a blank project through the loader-authoritative bootstrap path', async () => {
    const parentPath = 'C:\\Dev\\black-skies\\projects';
    const createdPath = 'C:\\Dev\\black-skies\\projects\\proj_blank_story_1234567890';
    const createProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: {
        path: createdPath,
        projectId: 'proj_blank_story_1234567890',
        name: 'Blank Story',
        outline: {
          schema_version: 'OutlineSchema v1',
          outline_id: 'outline_proj_blank_story_1234567890',
          acts: [],
          chapters: [],
          scenes: [],
        },
        scenes: [],
        drafts: {},
        bootstrapState: 'empty' as const,
      } satisfies LoadedProject,
      issues: [],
    });
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: parentPath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(null),
      createProject: createProjectMock,
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: {
          path: createdPath,
          projectId: 'proj_blank_story_1234567890',
          name: 'Blank Story',
          outline: {
            schema_version: 'OutlineSchema v1',
            outline_id: 'outline_proj_blank_story_1234567890',
            acts: [],
            chapters: [],
            scenes: [],
          },
          scenes: [],
          drafts: {},
          bootstrapState: 'empty' as const,
        } satisfies LoadedProject,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: /New project title/i }), {
      target: { value: 'Blank Story' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /^Create project$/i }),
    );

    await waitFor(() => {
      expect(projectLoader.openProjectDialog).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        parentPath,
        title: 'Blank Story',
        initialState: 'empty',
      });
    });
    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: createdPath });
    });
  });

  it('creates a scaffold-initialized project through the loader-authoritative bootstrap path', async () => {
    const parentPath = 'C:\\Dev\\black-skies\\projects';
    const createdPath = 'C:\\Dev\\black-skies\\projects\\proj_story_scaffold_1234567890';
    const createProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: {
        path: createdPath,
        projectId: 'proj_story_scaffold_1234567890',
        name: 'Story Scaffold',
        outline: {
          schema_version: 'OutlineSchema v1',
          outline_id: 'outline_proj_story_scaffold_1234567890',
          acts: ['Act I'],
          chapters: [{ id: 'ch_0001', order: 1, title: 'Chapter 1' }],
          scenes: [{ id: 'sc_0001', order: 1, title: 'Scene 1', chapter_id: 'ch_0001' }],
        },
        scenes: [{ id: 'sc_0001', title: 'Scene 1', order: 1, chapter_id: 'ch_0001' }],
        drafts: { sc_0001: 'starter' },
        bootstrapState: 'scaffold_initialized' as const,
        bootstrapTemplate: 'starter-scaffold-v1',
      } satisfies LoadedProject,
      issues: [],
    });
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: parentPath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(null),
      createProject: createProjectMock,
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: {
          path: createdPath,
          projectId: 'proj_story_scaffold_1234567890',
          name: 'Story Scaffold',
          outline: {
            schema_version: 'OutlineSchema v1',
            outline_id: 'outline_proj_story_scaffold_1234567890',
            acts: ['Act I'],
            chapters: [{ id: 'ch_0001', order: 1, title: 'Chapter 1' }],
            scenes: [{ id: 'sc_0001', order: 1, title: 'Scene 1', chapter_id: 'ch_0001' }],
          },
          scenes: [{ id: 'sc_0001', title: 'Scene 1', order: 1, chapter_id: 'ch_0001' }],
          drafts: { sc_0001: 'starter' },
          bootstrapState: 'scaffold_initialized' as const,
          bootstrapTemplate: 'starter-scaffold-v1',
        } satisfies LoadedProject,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: /New project title/i }), {
      target: { value: 'Story Scaffold' },
    });
    fireEvent.click(screen.getByText(/Advanced options/i));
    fireEvent.click(
      screen.getByRole('button', { name: /Create starter scaffold/i }),
    );

    await waitFor(() => {
      expect(projectLoader.openProjectDialog).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        parentPath,
        title: 'Story Scaffold',
        initialState: 'scaffold_initialized',
      });
    });
    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: createdPath });
    });
  });

  it('reopens a freshly created blank project through the normal loader path', async () => {
    const parentPath = 'C:\\Dev\\black-skies\\projects';
    const createdPath = 'C:\\Dev\\black-skies\\projects\\proj_blank_story_1234567890';
    const createdProject: LoadedProject = {
      path: createdPath,
      projectId: 'proj_blank_story_1234567890',
      name: 'Blank Story',
      outline: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'outline_proj_blank_story_1234567890',
        acts: [],
        chapters: [],
        scenes: [],
      },
      scenes: [],
      drafts: {},
      bootstrapState: 'empty',
    };
    const createProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: createdProject,
      issues: [],
    });
    const loadProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: createdProject,
      issues: [],
    });
    const onReopenConsumed = vi.fn();
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: parentPath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(null),
      createProject: createProjectMock,
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    const { rerender } = render(
      <ProjectHome
        suppressBootstrap
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onReopenConsumed={onReopenConsumed}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /New project title/i }), {
      target: { value: 'Blank Story' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /^Create project$/i }),
    );

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        parentPath,
        title: 'Blank Story',
        initialState: 'empty',
      });
    });
    await waitFor(() => {
      expect(loadProjectMock).toHaveBeenCalledWith({ path: createdPath });
    });

    rerender(
      <ProjectHome
        suppressBootstrap
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onReopenConsumed={onReopenConsumed}
        reopenRequest={{ path: createdPath, requestId: 42 }}
      />,
    );

    await waitFor(() => {
      expect(loadProjectMock).toHaveBeenCalledTimes(2);
    });
    expect(onReopenConsumed).toHaveBeenCalledWith({ requestId: 42, status: 'success' });
    expect(screen.getByText('Empty project')).toBeInTheDocument();
  });

  it('reopens a freshly created scaffold project through the normal loader path', async () => {
    const parentPath = 'C:\\Dev\\black-skies\\projects';
    const createdPath = 'C:\\Dev\\black-skies\\projects\\proj_story_scaffold_1234567890';
    const createdProject: LoadedProject = {
      path: createdPath,
      projectId: 'proj_story_scaffold_1234567890',
      name: 'Story Scaffold',
      outline: {
        schema_version: 'OutlineSchema v1',
        outline_id: 'outline_proj_story_scaffold_1234567890',
        acts: ['Act I'],
        chapters: [{ id: 'ch_0001', order: 1, title: 'Chapter 1' }],
        scenes: [{ id: 'sc_0001', order: 1, title: 'Scene 1', chapter_id: 'ch_0001' }],
      },
      scenes: [{ id: 'sc_0001', title: 'Scene 1', order: 1, chapter_id: 'ch_0001' }],
      drafts: { sc_0001: 'starter' },
      bootstrapState: 'scaffold_initialized',
      bootstrapTemplate: 'starter-scaffold-v1',
    };
    const createProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: createdProject,
      issues: [],
    });
    const loadProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: createdProject,
      issues: [],
    });
    const onReopenConsumed = vi.fn();
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: parentPath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(null),
      createProject: createProjectMock,
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    const { rerender } = render(
      <ProjectHome
        suppressBootstrap
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onReopenConsumed={onReopenConsumed}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /New project title/i }), {
      target: { value: 'Story Scaffold' },
    });
    fireEvent.click(screen.getByText(/Advanced options/i));
    fireEvent.click(screen.getByRole('button', { name: /Create starter scaffold/i }));

    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        parentPath,
        title: 'Story Scaffold',
        initialState: 'scaffold_initialized',
      });
    });
    await waitFor(() => {
      expect(loadProjectMock).toHaveBeenCalledWith({ path: createdPath });
    });

    rerender(
      <ProjectHome
        suppressBootstrap
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onReopenConsumed={onReopenConsumed}
        reopenRequest={{ path: createdPath, requestId: 43 }}
      />,
    );

    await waitFor(() => {
      expect(loadProjectMock).toHaveBeenCalledTimes(2);
    });
    expect(onReopenConsumed).toHaveBeenCalledWith({ requestId: 43, status: 'success' });
    expect(screen.getByText('Template-seeded starter scaffold')).toBeInTheDocument();
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

    const { container } = render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    await flushPromises();

    expect(screen.getByRole('heading', { level: 4, name: /Sample Project/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: /Scene One/ })).toBeInTheDocument();
    expect(screen.getByText(/Scenes/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Create a new project/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /New project title/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Create project$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Advanced options/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.project-home__bootstrap-create-actions > button')).toHaveLength(1);
  });

  it('surfaces a read-only session truth summary for the loaded project', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createSampleProject(samplePath);
    const draftOverrides = {
      sc_0001: '# Scene One\n\nUpdated draft text.',
    };
    const sessionTruthBaseline = createRuntimeSessionTruthContract({
      sessionLifecycleState: 'project-loaded',
      draftSessionStateClassifications: ['persisted', 'partial'],
    });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project,
        issues: [],
        sessionTruth: sessionTruthBaseline,
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        draftOverrides={draftOverrides}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    const sessionTruth = screen.getByRole('status', { name: /Session truth/i });
    expect(sessionTruth).toHaveTextContent('Runtime truth: runtime-only; Project truth: persisted');
    expect(sessionTruth).toHaveTextContent('Lifecycle state: editing');
    expect(sessionTruth).toHaveTextContent('Signal classification: clean');
    expect(sessionTruth).toHaveTextContent('Draft/session state: persisted, partial, dirty, unsaved');
  });

  it('keeps a loaded persisted-draft project clean until the user edits the draft editor', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createSampleProject(samplePath);
    let applyDraftEdit: ((draft: string) => void) | null = null;
    const DraftOverridesHarness = () => {
      const [draftOverrides, setDraftOverrides] = useState<Record<string, string>>({});
      applyDraftEdit = (draft: string) => {
        setDraftOverrides((previous) => ({ ...previous, sc_0001: draft }));
      };
      return (
        <ProjectHome
          onToast={vi.fn()}
          onProjectLoaded={vi.fn()}
          onDraftChange={(sceneId, draft) => {
            setDraftOverrides((previous) => ({ ...previous, [sceneId]: draft }));
          }}
          draftOverrides={draftOverrides}
        />
      );
    };

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<DraftOverridesHarness />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    const sessionTruth = screen.getByRole('status', { name: /Session truth/i });
    expect(sessionTruth).toHaveTextContent('Signal classification: clean');
    expect(sessionTruth).toHaveTextContent('Draft/session state: persisted');
    expect(sessionTruth).toHaveTextContent('Lifecycle state: draft-hydrated');

    expect(applyDraftEdit).not.toBeNull();
    act(() => {
      applyDraftEdit?.('# Scene One\n\nUpdated draft text.');
    });

    await waitFor(() => {
      expect(screen.getByRole('status', { name: /Session truth/i })).toHaveTextContent(
        'Draft/session state: persisted, dirty, unsaved',
      );
    });
  });

  it('keeps an empty loaded project clean and persisted', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createBootstrapStateProject(samplePath, 'empty'),
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    const sessionTruth = screen.getByRole('status', { name: /Session truth/i });
    expect(sessionTruth).toHaveTextContent('Signal classification: clean');
    expect(sessionTruth).toHaveTextContent('Draft/session state: persisted');
    expect(sessionTruth).not.toHaveTextContent('dirty');
    expect(sessionTruth).not.toHaveTextContent('unsaved');
  });

  it('keeps the main-process baseline classifications visible across a reopen boundary', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createSampleProject(samplePath);
    const draftOverrides = {
      sc_0001: '# Scene One\n\nUpdated draft text.',
    };
    const sessionTruthBaseline = createRuntimeSessionTruthContract({
      sessionLifecycleState: 'project-loaded',
      draftSessionStateClassifications: ['persisted', 'partial'],
    });
    const loadProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project,
      issues: [],
      sessionTruth: sessionTruthBaseline,
    });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    const { rerender } = render(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        draftOverrides={draftOverrides}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    expect(screen.getByRole('status', { name: /Session truth/i })).toHaveTextContent(
      'Draft/session state: persisted, partial, dirty, unsaved',
    );

    rerender(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        draftOverrides={draftOverrides}
        reopenRequest={{ path: samplePath, requestId: 42 }}
      />,
    );

    await waitFor(() => {
      expect(loadProjectMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole('status', { name: /Session truth/i })).toHaveTextContent(
      'Draft/session state: persisted, partial, dirty, unsaved',
    );
  });

  it('surfaces stale signal classification when the loader corrects a nested project path', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const nestedPath = `${samplePath}\\Esther_Estate`;
    const warningIssues: ProjectIssue[] = [
      {
        level: 'warning',
        message: 'Selected folder was nested inside a project root.',
        detail: `Using project root: ${samplePath}`,
        path: nestedPath,
      },
    ];

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: nestedPath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createSampleProject(samplePath),
        issues: warningIssues,
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome suppressBootstrap onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: /Open project/i }));

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: nestedPath });
    });

    const sessionTruth = screen.getByRole('status', { name: /Session truth/i });
    expect(sessionTruth).toHaveTextContent('Signal classification: stale');
    expect(sessionTruth).toHaveTextContent('Draft/session state: persisted, partial, stale');
    expect(projectLoader.getSampleProjectPath).not.toHaveBeenCalled();
  });

  it('surfaces recovery-required signal classification without attempting a silent repair', async () => {
    const stalePath = 'C:\\archived\\broken-project';
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: stalePath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          code: 'PROJECT_UNSUPPORTED_VERSION',
          message: 'project.json uses an unsupported schema version.',
          issues: [
            {
              level: 'error',
              message: 'project.json uses an unsupported schema version.',
              detail: 'Expected schema_version "ProjectMetadata v999".',
              path: `${stalePath}\\project.json`,
            },
          ],
        },
      }),
      createProject: vi.fn(),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;
    const toasts: ToastPayload[] = [];

    render(
      <ProjectHome
        suppressBootstrap
        onToast={(toast) => toasts.push(toast)}
        onProjectLoaded={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Open project/i }));

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: stalePath });
    });

    const sessionTruth = screen.getByRole('status', { name: /Session truth/i });
    expect(sessionTruth).toHaveTextContent('Signal classification: recovery-required');
    expect(sessionTruth).toHaveTextContent('Draft/session state: runtime-only, partial, recovery-required');
    expect(projectLoader.getSampleProjectPath).not.toHaveBeenCalled();
    expect(projectLoader.createProject).not.toHaveBeenCalled();
    expect(toasts.some((toast) => toast.title === 'Could not open project')).toBe(true);
  });

  it('labels empty bootstrap state explicitly', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createBootstrapStateProject(samplePath, 'empty'),
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    expect(screen.getByText('Empty project')).toBeInTheDocument();
    expect(screen.getByText('No scenes or drafts have been created yet.')).toBeInTheDocument();
  });

  it('labels scaffold-initialized projects as template-seeded starter scaffolds', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createBootstrapStateProject(samplePath, 'scaffold_initialized', 'starter-scaffold-v1'),
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    expect(screen.getByText('Template-seeded starter scaffold')).toBeInTheDocument();
    expect(
      screen.getByText('A deterministic starter scaffold is present and marked as template-seeded.'),
    ).toBeInTheDocument();
  });

  it('explains that Black Skies creates the project folder after the user chooses a save location', async () => {
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(null),
      loadProject: vi.fn(),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} suppressBootstrap />);

    expect(
      screen.getByText(
        'Name the project, choose where to save it, and Black Skies creates the folder automatically.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Create project$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Advanced options/i),
    ).toBeInTheDocument();
  });

  it('labels partial bootstrap state explicitly without implying repair', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createBootstrapStateProject(samplePath, 'partial'),
        issues: [
          {
            level: 'warning',
            message: 'Project bootstrap state does not match the persisted project structure.',
          },
        ],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    expect(screen.getByText('Partial project')).toBeInTheDocument();
    expect(
      screen.getByText('Persisted structure does not fully match the recorded bootstrap state.'),
    ).toBeInTheDocument();
  });

  it('labels restored copies in the project details panel', async () => {
    const restoredPath = 'C:\\Dev\\black-skies\\sample_project\\proj_esther_estate_restored_001';
    const loadProjectMock = vi.fn().mockResolvedValue({
      ok: true,
      project: createSampleProject(restoredPath),
      issues: [],
    });

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(restoredPath),
      loadProject: loadProjectMock,
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(<ProjectHome onToast={vi.fn()} onProjectLoaded={vi.fn()} />);

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: restoredPath });
    });

    expect(screen.getByText('Restored copy')).toBeInTheDocument();
    expect(screen.getAllByText(restoredPath)).toHaveLength(2);
  });

  it('renders generated draft overrides in the Draft Preview editor for the active scene', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const generatedMarker = 'PHASE10_VISIBLE_GENERATED_DRAFT_MARKER';
    const project = createSampleProject(samplePath);

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        draftOverrides={{ sc_0001: generatedMarker }}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    const draftPreview = document.querySelector<HTMLElement>('.project-home__draft');
    expect(draftPreview).toHaveStyle({ minHeight: '24rem' });
    expect(await screen.findByText(generatedMarker)).toBeInTheDocument();
    expect(screen.queryByText(/# Scene One/i)).not.toBeInTheDocument();
  });

  it('updates the active scene when a scene card is selected', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createMultiSceneProject(samplePath);
    const onActiveSceneChange = vi.fn();

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onActiveSceneChange={onActiveSceneChange}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    fireEvent.click(screen.getByRole('button', { name: /Scene Four/i }));

    await waitFor(() => {
      expect(onActiveSceneChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneId: 'sc_0004',
          sceneTitle: 'Scene Four',
          draft: '# Scene Four',
        }),
      );
    });

    expect(screen.getByRole('button', { name: /Scene Four/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { level: 3, name: /Scene Four/i })).toBeInTheDocument();
    expect(screen.getAllByText('respite').length).toBeGreaterThan(0);
    expect(screen.getAllByText('breath').length).toBeGreaterThan(0);
    expect(screen.getAllByText('210 words').length).toBeGreaterThan(0);
  });

  it('follows the shared requested active scene without bypassing the normal callback', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createMultiSceneProject(samplePath);
    const onActiveSceneChange = vi.fn();

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    const { rerender } = render(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onActiveSceneChange={onActiveSceneChange}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    rerender(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
        onActiveSceneChange={onActiveSceneChange}
        requestedActiveSceneId="sc_0004"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Scene Four/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
    expect(onActiveSceneChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sceneId: 'sc_0004',
        sceneTitle: 'Scene Four',
        draft: '# Scene Four',
      }),
    );
  });

  it('labels scene metadata as display-only while still surfacing generation-affecting cues', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const project = createMultiSceneProject(samplePath);
    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn(),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project,
        issues: [],
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(
      <ProjectHome
        onToast={vi.fn()}
        onProjectLoaded={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: samplePath });
    });

    expect(screen.getByText(/Display-only in this version/i)).toBeInTheDocument();
    expect(screen.getByText(/Purpose, emotion tag, and word target feed generation/i)).toBeInTheDocument();
    expect(screen.getAllByText('tension').length).toBeGreaterThan(0);
    expect(screen.getAllByText('setup').length).toBeGreaterThan(0);
    expect(screen.getAllByText('260 words').length).toBeGreaterThan(0);
  });

  it('surfaces loader warnings when a nested project folder is auto-corrected', async () => {
    const samplePath = 'C:\\Dev\\black-skies\\sample_project\\Esther_Estate';
    const nestedPath = `${samplePath}\\Esther_Estate`;
    const warningIssues: ProjectIssue[] = [
      {
        level: 'warning',
        message: 'Selected folder was nested inside a project root.',
        detail: `Using parent project root: ${samplePath}`,
        path: nestedPath,
      },
    ];
    const toasts: ToastPayload[] = [];

    const projectLoader: ProjectLoaderApi = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: nestedPath }),
      getSampleProjectPath: vi.fn().mockResolvedValue(samplePath),
      loadProject: vi.fn().mockResolvedValue({
        ok: true,
        project: createSampleProject(samplePath),
        issues: warningIssues,
      }),
    };

    (window as Partial<Record<string, unknown>>).projectLoader = projectLoader;

    render(
      <ProjectHome
        suppressBootstrap
        onToast={(toast) => toasts.push(toast)}
        onProjectLoaded={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Open project/i }));

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: nestedPath });
    });

    const warningToast = toasts.find((toast) => toast.title === warningIssues[0].message);
    expect(warningToast?.tone).toBe('warning');
    expect(warningToast?.description).toContain(samplePath);
  });
});
