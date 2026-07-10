import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ProjectHome from '../components/ProjectHome';
import type { LoadedProject, ProjectLoaderApi } from '../../shared/ipc/projectLoader';

const PROJECT: LoadedProject = {
  path: '/projects/save-controls',
  projectId: 'proj_save_controls',
  name: 'Save Controls',
  outline: {
    schema_version: 'OutlineSchema v1',
    outline_id: 'out_save_controls',
    acts: [],
    chapters: [],
    scenes: [{ id: 'sc_0001', order: 1, title: 'Arrival' }],
  },
  scenes: [{ id: 'sc_0001', order: 1, title: 'Arrival' }],
  drafts: {
    sc_0001: '---\nid: sc_0001\ntitle: Arrival\norder: 1\n---\nOriginal.\n',
  },
};

afterEach(() => {
  delete window.projectLoader;
  window.localStorage.clear();
});

describe('ProjectHome manual save controls', () => {
  it('enables one-scene save only for a dirty draft and exposes saving state', async () => {
    const onDraftSave = vi.fn().mockResolvedValue(undefined);
    window.projectLoader = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: PROJECT.path }),
      loadProject: vi.fn().mockResolvedValue({ ok: true, project: PROJECT, issues: [] }),
    } as ProjectLoaderApi;

    const { rerender } = render(
      <ProjectHome
        onToast={vi.fn()}
        onDraftSave={onDraftSave}
        draftOverrides={{ sc_0001: PROJECT.drafts.sc_0001.replace('Original.', 'Edited.') }}
        draftSaveState={{ sceneId: 'sc_0001', status: 'idle', message: null }}
        suppressBootstrap
      />,
    );

    fireEvent.click(screen.getByTestId('open-project'));
    const saveButton = await screen.findByTestId('scene-save-btn');
    expect(saveButton).toBeEnabled();
    expect(screen.getByTestId('scene-save-status')).toHaveTextContent('Unsaved changes');

    fireEvent.click(saveButton);
    await waitFor(() => expect(onDraftSave).toHaveBeenCalledWith('sc_0001'));

    rerender(
      <ProjectHome
        onToast={vi.fn()}
        onDraftSave={onDraftSave}
        draftOverrides={{ sc_0001: PROJECT.drafts.sc_0001.replace('Original.', 'Edited.') }}
        draftSaveState={{ sceneId: 'sc_0001', status: 'saving', message: null }}
        suppressBootstrap
      />,
    );
    expect(screen.getByTestId('scene-save-btn')).toBeDisabled();
    expect(screen.getByTestId('scene-save-status')).toHaveTextContent('Saving scene');
  });

  it('keeps the save control disabled for the loaded durable baseline', async () => {
    window.projectLoader = {
      openProjectDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: PROJECT.path }),
      loadProject: vi.fn().mockResolvedValue({ ok: true, project: PROJECT, issues: [] }),
    } as ProjectLoaderApi;

    render(
      <ProjectHome
        onToast={vi.fn()}
        onDraftSave={vi.fn()}
        draftOverrides={{}}
        draftSaveState={{ sceneId: 'sc_0001', status: 'idle', message: null }}
        suppressBootstrap
      />,
    );

    fireEvent.click(screen.getByTestId('open-project'));
    expect(await screen.findByTestId('scene-save-btn')).toBeDisabled();
    expect(screen.getByTestId('scene-save-status')).toHaveTextContent('Loaded from disk');
  });
});
