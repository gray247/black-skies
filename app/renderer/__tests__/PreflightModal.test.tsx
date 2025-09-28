import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreflightModal } from '../components/PreflightModal';
import type { DraftPreflightEstimate } from '../../shared/ipc/services';

const baseEstimate: DraftPreflightEstimate = {
  projectId: 'proj_123',
  unitScope: 'scene',
  unitIds: ['sc_0001'],
  model: {
    name: 'draft-synthesizer-v1',
    provider: 'black-skies-local',
  },
  scenes: [
    {
      id: 'sc_0001',
      title: 'Scene 1',
      order: 1,
    },
  ],
  budget: {
    estimated_usd: 1.2,
    status: 'ok',
    message: 'Within budget',
    soft_limit_usd: 5,
    hard_limit_usd: 10,
  },
};

describe('PreflightModal', () => {
  it('disables proceed when blocked', () => {
    render(
      <PreflightModal
        isOpen
        loading={false}
        error={null}
        estimate={{
          ...baseEstimate,
          budget: { ...baseEstimate.budget, status: 'blocked' },
        }}
        onClose={() => undefined}
        onProceed={() => undefined}
      />,
    );

    const proceed = screen.getByRole('button', { name: /blocked/i });
    expect(proceed).to.have.property('disabled', true);
  });

  it('invokes proceed handler when allowed', () => {
    const onProceed = vi.fn();
    render(
      <PreflightModal
        isOpen
        loading={false}
        error={null}
        estimate={baseEstimate}
        onClose={() => undefined}
        onProceed={onProceed}
      />,
    );

    const proceed = screen.getByRole('button', { name: /Proceed/i });
    fireEvent.click(proceed);
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it('renders scenes and model metadata', () => {
    render(
      <PreflightModal
        isOpen
        loading={false}
        error={null}
        estimate={{
          ...baseEstimate,
          scenes: [
            { id: 'sc_0001', title: 'Arrival', order: 1 },
            { id: 'sc_0002', title: 'Storm Cellar', order: 2 },
          ],
        }}
        onClose={() => undefined}
        onProceed={() => undefined}
      />,
    );

    expect(screen.getByText('Scenes in this run')).toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText(/sc_0002/)).toBeInTheDocument();
    expect(screen.getByText(/draft-synthesizer-v1/i)).toBeInTheDocument();
  });

  it('shows error state and disables proceed', () => {
    const onClose = vi.fn();
    render(
      <PreflightModal
        isOpen
        loading={false}
        error="Unable to reach the service"
        estimate={undefined}
        onClose={onClose}
        onProceed={() => undefined}
      />,
    );

    expect(screen.getByText(/Unable to complete preflight/i)).toBeInTheDocument();
    const proceed = screen.getByRole('button', { name: /proceed/i });
    expect(proceed).toHaveProperty('disabled', true);
  });
});
