import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ServiceStatusPill from '../components/ServiceStatusPill';

describe('ServiceStatusPill', () => {
  it.each([
    { status: 'checking', label: /Checking writing tools/i },
    { status: 'online', label: /Ready/i },
    { status: 'offline', label: /Writing tools offline/i },
  ] as const)('renders label and data attributes for $status', ({ status, label }) => {
    render(<ServiceStatusPill status={status} />);

    const button = screen.getByRole('button', { name: label });
    expect(button).toHaveAttribute('data-status', status);
    if (status === 'offline') {
      expect(button).toHaveAttribute('title', 'Connection lost — retrying.');
    } else {
      expect(button).not.toHaveAttribute('title');
    }
  });

  it('invokes retry handler while offline', () => {
    const onRetry = vi.fn();
    render(<ServiceStatusPill status="offline" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /Writing tools offline/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('prevents retry while checking status', () => {
    const onRetry = vi.fn();
    render(<ServiceStatusPill status="checking" onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: /Checking writing tools/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(onRetry).not.toHaveBeenCalled();
  });
});
