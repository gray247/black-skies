import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreflightModal } from '../components/PreflightModal';
import type { DraftPreflightEstimate } from '../../shared/ipc/services';

const baseEstimate: DraftPreflightEstimate = {
  projectId: 'proj_123',
  unitScope: 'scene',
  unitIds: ['sc_0001'],
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
});
