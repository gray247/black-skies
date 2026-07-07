import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ProjectHome from '../components/ProjectHome';
import type {
  LoadedProject,
  OutlineFile,
  ProjectLoaderApi,
} from '../../shared/ipc/projectLoader';
import type { ToastPayload } from '../types/toast';

function createMissingIdProject(): LoadedProject {
  const outline: OutlineFile = {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_missing_id_story',
    acts: [],
    chapters: [],
    scenes: [
      {
        id: 'sc_missing',
        order: 1,
        title: 'Missing Identity Scene',
        chapter_id: 'ch_missing',
        beat_refs: [],
      },
    ],
  };

  return {
    path: '/projects/missing-id-story',
    name: 'Missing Identity Story',
    projectId: undefined,
    outline,
    scenes: [
      {
        id: 'sc_missing',
        title: 'Missing Identity Scene',
        order: 1,
        chapter_id: 'ch_missing',
      },
    ],
    drafts: {
      sc_missing: '# Missing Identity Scene',
    },
    bootstrapState: 'empty',
  };
}

function createValidIdProject(): LoadedProject {
  const outline: OutlineFile = {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_valid_id_story',
    acts: [],
    chapters: [],
    scenes: [
      {
        id: 'sc_valid',
        order: 1,
        title: 'Valid Identity Scene',
        chapter_id: 'ch_valid',
        beat_refs: [],
      },
    ],
  };

  return {
    path: '/projects/valid-id-story',
    name: 'Valid Identity Story',
    projectId: 'proj_valid_id_story',
    outline,
    scenes: [
      {
        id: 'sc_valid',
        title: 'Valid Identity Scene',
        order: 1,
        chapter_id: 'ch_valid',
      },
    ],
    drafts: {
      sc_valid: '# Valid Identity Scene',
    },
    bootstrapState: 'empty',
  };
}

describe('ProjectHome missing-ID remembered-path witness', () => {
  let projectLoader: ProjectLoaderApi;
  let onToast: ReturnType<typeof vi.fn>;
  let onProjectLoaded: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onToast = vi.fn<(toast: ToastPayload) => void>();
    onProjectLoaded = vi.fn();
    window.localStorage.clear();
    window.sessionStorage.clear();
    projectLoader = {
      openProjectDialog: vi.fn(),
      loadProject: vi.fn(),
    };
    window.projectLoader = projectLoader;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    delete window.projectLoader;
  });

  it('does not persist remembered-path state for a missing-ID loader success before any App validation', async () => {
    const project = createMissingIdProject();
    projectLoader.openProjectDialog = vi
      .fn()
      .mockResolvedValue({ canceled: false, filePath: project.path });
    projectLoader.loadProject = vi.fn().mockResolvedValue({
      ok: true,
      project,
      issues: [],
    });

    render(
      <ProjectHome
        suppressBootstrap
        onToast={onToast}
        onProjectLoaded={onProjectLoaded}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /open project/i }));

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: project.path });
    });

    await waitFor(() => {
      expect(onProjectLoaded).toHaveBeenCalledWith({
        status: 'loaded',
        project,
        targetPath: project.path,
        lastOpenedPath: project.path,
      });
    });

    expect(window.localStorage.getItem('blackskies.recent-projects')).toBeNull();
    expect(window.localStorage.getItem('blackskies.last-project')).toBeNull();
    expect(screen.queryByRole('button', { name: /Missing Identity Story/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /show diagnostics/i }));
    const diagnostics = await screen.findByLabelText(/Story snapshot details/i);
    const diagnosticsValue = (diagnostics as HTMLTextAreaElement).value;
    expect(diagnosticsValue).toContain('"storedLastProjectPath": null');
    expect(diagnosticsValue).toContain(`"activeProjectPath": "${project.path}"`);
  });

  it('accepts the same missing-ID path through reopenRequest without storing remembered-path state', async () => {
    const project = createMissingIdProject();
    const onReopenConsumed = vi.fn();
    projectLoader.loadProject = vi.fn().mockResolvedValue({
      ok: true,
      project,
      issues: [],
    });

    render(
      <ProjectHome
        suppressBootstrap
        onToast={onToast}
        onProjectLoaded={onProjectLoaded}
        reopenRequest={{ path: project.path, requestId: 7 }}
        onReopenConsumed={onReopenConsumed}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: project.path });
    });

    await waitFor(() => {
      expect(onReopenConsumed).toHaveBeenCalledWith({ requestId: 7, status: 'success' });
    });

    expect(onProjectLoaded).toHaveBeenCalledWith({
      status: 'loaded',
      project,
      targetPath: project.path,
      lastOpenedPath: project.path,
    });
    expect(window.localStorage.getItem('blackskies.recent-projects')).toBeNull();
    expect(window.localStorage.getItem('blackskies.last-project')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /show diagnostics/i }));
    const diagnostics = await screen.findByLabelText(/Story snapshot details/i);
    const diagnosticsValue = (diagnostics as HTMLTextAreaElement).value;
    expect(diagnosticsValue).toContain('"storedLastProjectPath": null');
    expect(diagnosticsValue).toContain(`"activeProjectPath": "${project.path}"`);
  });

  it('preserves remembered-path persistence and reopen behavior for a valid explicit-ID project', async () => {
    const project = createValidIdProject();
    const onReopenConsumed = vi.fn();
    projectLoader.openProjectDialog = vi
      .fn()
      .mockResolvedValue({ canceled: false, filePath: project.path });
    projectLoader.loadProject = vi.fn().mockResolvedValue({
      ok: true,
      project,
      issues: [],
    });

    const { rerender } = render(
      <ProjectHome
        suppressBootstrap
        onToast={onToast}
        onProjectLoaded={onProjectLoaded}
        onReopenConsumed={onReopenConsumed}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: /open project/i }));

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledWith({ path: project.path });
    });

    await waitFor(() => {
      expect(onProjectLoaded).toHaveBeenCalledWith({
        status: 'loaded',
        project,
        targetPath: project.path,
        lastOpenedPath: project.path,
      });
    });

    const storedRecents = JSON.parse(
      window.localStorage.getItem('blackskies.recent-projects') ?? '[]',
    ) as Array<Record<string, unknown>>;
    expect(storedRecents).toHaveLength(1);
    expect(storedRecents[0]).toMatchObject({
      path: project.path,
      name: project.name,
    });
    expect(storedRecents[0]).not.toHaveProperty('projectId');

    expect(window.localStorage.getItem('blackskies.last-project')).toBe(project.path);
    const recentProjectButton = await screen.findByRole('button', {
      name: new RegExp(project.name, 'i'),
    });
    expect(recentProjectButton).toHaveTextContent(`Project ID: ${project.projectId}`);

    fireEvent.click(screen.getByRole('button', { name: /show diagnostics/i }));
    let diagnostics = await screen.findByLabelText(/Story snapshot details/i);
    let diagnosticsValue = (diagnostics as HTMLTextAreaElement).value;
    expect(diagnosticsValue).toContain(`"storedLastProjectPath": "${project.path}"`);
    expect(diagnosticsValue).toContain(`"activeProjectPath": "${project.path}"`);

    rerender(
      <ProjectHome
        suppressBootstrap
        onToast={onToast}
        onProjectLoaded={onProjectLoaded}
        onReopenConsumed={onReopenConsumed}
        reopenRequest={{ path: project.path, requestId: 9 }}
      />,
    );

    await waitFor(() => {
      expect(projectLoader.loadProject).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(onReopenConsumed).toHaveBeenCalledWith({ requestId: 9, status: 'success' });
    });

    const latestOnProjectLoadedCall = onProjectLoaded.mock.calls.at(-1);
    expect(latestOnProjectLoadedCall?.[0]).toEqual({
      status: 'loaded',
      project,
      targetPath: project.path,
      lastOpenedPath: project.path,
    });

    const recentsAfterReopen = JSON.parse(
      window.localStorage.getItem('blackskies.recent-projects') ?? '[]',
    ) as Array<Record<string, unknown>>;
    expect(recentsAfterReopen[0]).toMatchObject({
      path: project.path,
      name: project.name,
    });
    expect(recentsAfterReopen[0]).not.toHaveProperty('projectId');
    expect(window.localStorage.getItem('blackskies.last-project')).toBe(project.path);
    expect(
      await screen.findByRole('button', { name: new RegExp(project.name, 'i') }),
    ).toHaveTextContent(`Project ID: ${project.projectId}`);

    diagnostics = await screen.findByLabelText(/Story snapshot details/i);
    diagnosticsValue = (diagnostics as HTMLTextAreaElement).value;
    expect(diagnosticsValue).toContain(`"storedLastProjectPath": "${project.path}"`);
  });
});
