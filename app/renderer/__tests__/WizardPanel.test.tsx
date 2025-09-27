import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WizardPanel from '../components/WizardPanel';
import type { ServicesBridge } from '../../shared/ipc/services';

const STORAGE_KEY = 'blackskies.wizard-locks.v1';

describe('WizardPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const createServices = () => {
    const services: ServicesBridge = {
      checkHealth: vi.fn(),
      buildOutline: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          schema_version: 'OutlineSchema v1',
          outline_id: 'out_001',
          acts: ['Act I'],
          chapters: [],
          scenes: [],
        },
      }),
      generateDraft: vi.fn(),
      critiqueDraft: vi.fn(),
      preflightDraft: vi.fn(),
    };
    return services;
  };

  it('submits wizard locks to the services bridge', async () => {
    const services = createServices();
    const onToast = vi.fn();

    render(<WizardPanel services={services} onToast={onToast} />);

    const projectInput = screen.getByLabelText(/Project ID/i);
    fireEvent.change(projectInput, { target: { value: 'Test Project' } });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    const buildButton = screen.getByRole('button', { name: /Build Outline/i });
    fireEvent.click(buildButton);

    await waitFor(() => expect(services.buildOutline).toHaveBeenCalled());

    const request = services.buildOutline.mock.calls[0][0];
    expect(request.projectId).toBe('test_project');
    expect(request.wizardLocks.acts.length).toBeGreaterThan(0);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
  });
});
