import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { LoadedProject, OutlineFile } from '../../shared/ipc/projectLoader';
import ProjectHome from '../components/ProjectHome';
import type { ToastPayload } from '../types/toast';

function createDivergentProject(): LoadedProject {
  const outline: OutlineFile = {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_proj_alpha',
    acts: [],
    chapters: [],
    scenes: [
      {
        id: 'sc_alpha',
        order: 1,
        title: 'Divergent Identity Scene',
        chapter_id: 'ch_alpha',
        beat_refs: [],
      },
    ],
  };

  return {
    path: '/projects/path-beta',
    name: 'Divergent Identity Story',
    projectId: 'proj_alpha',
    outline,
    scenes: [
      {
        id: 'sc_alpha',
        title: 'Divergent Identity Scene',
        order: 1,
        chapter_id: 'ch_alpha',
      },
    ],
    drafts: {
      sc_alpha: '# Divergent Identity Scene',
    },
    bootstrapState: 'empty',
  };
}

function createMatchingIdentityProject(): LoadedProject {
  const outline: OutlineFile = {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_proj_alpha_matching',
    acts: [],
    chapters: [],
    scenes: [
      {
        id: 'sc_match',
        order: 1,
        title: 'Matching Identity Scene',
        chapter_id: 'ch_match',
        beat_refs: [],
      },
    ],
  };

  return {
    path: '/projects/proj_alpha',
    name: 'Matching Identity Story',
    projectId: 'proj_alpha',
    outline,
    scenes: [
      {
        id: 'sc_match',
        title: 'Matching Identity Scene',
        order: 1,
        chapter_id: 'ch_match',
      },
    ],
    drafts: {
      sc_match: '# Matching Identity Scene',
    },
    bootstrapState: 'empty',
  };
}

describe('ProjectHome divergence visibility witness', () => {
  let onToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.useRealTimers();
    onToast = vi.fn<(toast: ToastPayload) => void>();
    window.projectLoader = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: '/projects/path-beta' }),
      loadProject: vi.fn(),
    };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
    window.sessionStorage.clear();
    delete window.projectLoader;
  });

  it('shows canonical id in ProjectHome details for a divergent valid-ID project while preserving path-based recents and handoff', async () => {
    const project = createDivergentProject();
    const onProjectLoaded = vi.fn();

    window.projectLoader.loadProject = vi.fn().mockResolvedValue({
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

    fireEvent.click(screen.getByRole('button', { name: /open project/i }));

    await waitFor(() => {
      expect(onProjectLoaded).toHaveBeenCalledWith({
        status: 'loaded',
        project,
        targetPath: project.path,
        lastOpenedPath: project.path,
      });
    });

    expect(screen.getAllByText(project.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(project.path).length).toBeGreaterThan(0);
    expect(screen.getByText('Project ID')).toBeInTheDocument();
    expect(screen.getByText(project.projectId ?? '')).toBeInTheDocument();
    expect(screen.queryByText(/mismatch/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/divergence/i)).not.toBeInTheDocument();

    const recentProjectButton = await screen.findByRole('button', {
      name: new RegExp(project.name, 'i'),
    });
    expect(recentProjectButton).toBeInTheDocument();
    expect(recentProjectButton).not.toHaveTextContent(project.projectId ?? '');

    const storedRecentsRaw = window.localStorage.getItem('blackskies.recent-projects');
    expect(storedRecentsRaw).not.toBeNull();
    const storedRecents = JSON.parse(storedRecentsRaw ?? '[]') as Array<Record<string, unknown>>;
    expect(storedRecents).toHaveLength(1);
    expect(storedRecents[0]).toMatchObject({
      path: project.path,
      name: project.name,
    });
    expect(storedRecents[0]).not.toHaveProperty('projectId');

    expect(window.localStorage.getItem('blackskies.last-project')).toBe(project.path);

    fireEvent.click(screen.getByRole('button', { name: /show diagnostics/i }));
    const diagnostics = await screen.findByLabelText(/story snapshot details/i);
    const diagnosticsValue = (diagnostics as HTMLTextAreaElement).value;
    expect(diagnosticsValue).toContain(`"activeProjectPath": "${project.path}"`);
    expect(diagnosticsValue).toContain(`"activeProjectName": "${project.name}"`);
    expect(diagnosticsValue).not.toContain(project.projectId ?? '');
    expect(diagnosticsValue).not.toContain('mismatch');
    expect(diagnosticsValue).not.toContain('divergence');
  });

  it('shows canonical id for a non-divergent valid-ID project without adding a false divergence warning', async () => {
    const project = createMatchingIdentityProject();
    const onProjectLoaded = vi.fn();

    window.projectLoader.openProjectDialog = vi
      .fn()
      .mockResolvedValue({ canceled: false, filePath: project.path });
    window.projectLoader.loadProject = vi.fn().mockResolvedValue({
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

    fireEvent.click(screen.getByRole('button', { name: /open project/i }));

    await waitFor(() => {
      expect(onProjectLoaded).toHaveBeenCalledWith({
        status: 'loaded',
        project,
        targetPath: project.path,
        lastOpenedPath: project.path,
      });
    });

    expect(screen.getAllByText(project.name).length).toBeGreaterThan(0);
    expect(screen.getAllByText(project.path).length).toBeGreaterThan(0);
    expect(screen.getByText('Project ID')).toBeInTheDocument();
    expect(screen.getByText(project.projectId ?? '')).toBeInTheDocument();
    expect(screen.queryByText(/mismatch/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/divergence/i)).not.toBeInTheDocument();

  });
});
