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

const modalDefaults = {
  generationScope: 'active-scene' as const,
  generationScopeCount: 1,
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
        {...modalDefaults}
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
        {...modalDefaults}
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
        generationScope="all-scenes"
        generationScopeCount={2}
        onClose={() => undefined}
        onProceed={() => undefined}
      />,
    );

    expect(screen.getByText(/every loaded scene/i)).toBeInTheDocument();
    expect(screen.getByText(/2 scenes are affected/i)).toBeInTheDocument();
    expect(screen.getByText('Scenes in this run')).toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
    expect(screen.getByText(/sc_0002/)).toBeInTheDocument();
    expect(screen.getByText(/draft-synthesizer-v1/i)).toBeInTheDocument();
  });

  it('renders stable preflight contract markers for scope, count, warning, and budget', () => {
    render(
      <PreflightModal
        isOpen
        loading={false}
        error={null}
        estimate={baseEstimate}
        {...modalDefaults}
        onClose={() => undefined}
        onProceed={() => undefined}
      />,
    );

    expect(screen.getByTestId('preflight-contract-scope')).toHaveTextContent(
      /Generation scope:\s*Active scene/i,
    );
    expect(screen.getByTestId('preflight-contract-count')).toHaveTextContent('1 scene is affected.');
    expect(screen.getByTestId('preflight-contract-warning')).toHaveTextContent(
      /Draft text may be replaced/i,
    );
    expect(screen.getByTestId('preflight-contract-budget')).toHaveTextContent(/Within budget/i);
  });

  it('shows error state and disables proceed', () => {
    const onClose = vi.fn();
    render(
      <PreflightModal
        isOpen
        loading={false}
        error="Unable to reach the service"
        estimate={undefined}
        {...modalDefaults}
        onClose={onClose}
        onProceed={() => undefined}
      />,
    );

    expect(screen.getByText(/Unable to complete preflight/i)).toBeInTheDocument();
    const proceed = screen.getByRole('button', { name: /proceed/i });
    expect(proceed).toHaveProperty('disabled', true);
  });

  it('shows a generation-specific error heading when the phase is generation', () => {
    render(
      <PreflightModal
        isOpen
        loading={false}
        error="Draft generation timed out."
        errorPhase="generation"
        estimate={undefined}
        {...modalDefaults}
        onClose={() => undefined}
        onProceed={() => undefined}
      />,
    );

    expect(screen.getByText(/Unable to complete draft generation/i)).toBeInTheDocument();
  });
});
