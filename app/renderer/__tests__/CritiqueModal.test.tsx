import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CritiqueModal } from '../components/CritiqueModal';

describe('CritiqueModal summary rendering', () => {
  it('preserves paragraph breaks and wrapping affordances for summaries', () => {
    render(
      <CritiqueModal
        isOpen
        loading={false}
        error={null}
        critique={{
          unit_id: 'sc_0001',
          schema_version: 'CritiqueOutputSchema v1',
          summary: 'First paragraph.\n\nSecond paragraph.',
        }}
        instructions=""
        rewrite={null}
        rewriteLoading={false}
        rewriteError={null}
        onClose={() => {}}
        onReject={() => {}}
        onRunRewrite={() => {}}
        onApplyRewrite={() => {}}
        onDiscardRewrite={() => {}}
        onChangeInstructions={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /Close/i })).toHaveTextContent('Close');
    const summary = screen.getByText(/First paragraph\.\s+Second paragraph\./);
    expect(summary).toHaveClass('critique-modal__summary-body');
    expect(summary.textContent).toContain('First paragraph.');
    expect(summary.textContent).toContain('Second paragraph.');
  });
});
