import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WizardPanel from '../components/WizardPanel';
import type { ServicesBridge } from '../../shared/ipc/services';

const STORAGE_KEY = 'blackskies.wizard-locks.v2';

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
        traceId: 'trace-outline',
      }),
      createSnapshot: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          snapshot_id: 'snap-001',
          label: 'wizard-structure',
          created_at: '2025-01-01T00:00:00Z',
          path: 'history/snapshots/snap-001',
        },
        traceId: 'trace-snapshot',
      }),
      generateDraft: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          draft_id: 'dr_001',
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
          summary: 'Stub critique',
        },
        traceId: 'trace-critique',
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
            estimated_usd: 0.25,
            status: 'ok',
            soft_limit_usd: 5,
            hard_limit_usd: 10,
            spent_usd: 0,
            total_after_usd: 0.25,
          },
        },
        traceId: 'trace-preflight',
      }),
    };
    return services;
  };

  it('requires locks before building the outline', async () => {
    const services = createServices();
    const onToast = vi.fn();

    render(<WizardPanel services={services} onToast={onToast} />);

    const projectInput = screen.getByLabelText(/Project ID/i);
    fireEvent.change(projectInput, { target: { value: 'Test Project' } });

    const nextButton = screen.getByRole('button', { name: /Next/i });
    const lockSequence = [
      'Input & Scope',
      'Framing',
      'Structure',
      'Scenes',
      'Characters',
      'Conflict',
      'Beats',
      'Pacing',
      'Chapters',
      'Themes',
      'Finalize',
    ];

    for (let index = 0; index < lockSequence.length; index += 1) {
      const lockButton = screen.getByRole('button', { name: /lock/i });
      fireEvent.click(lockButton);
      await waitFor(() => expect(services.createSnapshot).toHaveBeenCalledTimes(index + 1));
      if (index < lockSequence.length - 1) {
        fireEvent.click(nextButton);
      }
    }

    expect(services.createSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'input_scope' }),
    );

    const buildButton = await screen.findByRole('button', { name: /Build Outline/i });
    fireEvent.click(buildButton);

    await waitFor(() => expect(services.buildOutline).toHaveBeenCalled());

    const request = services.buildOutline.mock.calls[0][0];
    expect(request.projectId).toBe('test_project');
    expect(request.wizardLocks.acts.length).toBeGreaterThan(0);

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();

    await waitFor(() =>
      expect(onToast).toHaveBeenCalledWith(
        expect.objectContaining({ traceId: 'trace-outline' }),
      ),
    );
  });
});
