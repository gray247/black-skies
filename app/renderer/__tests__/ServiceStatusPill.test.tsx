import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ServiceStatusPill from '../components/ServiceStatusPill';

describe('ServiceStatusPill', () => {
  it.each([
    { status: 'checking', label: /Checking backend services/i },
    { status: 'online', label: /Backend services ready/i },
    { status: 'offline', label: /Backend services offline/i },
  ] as const)('renders label and data attributes for $status', ({ status, label }) => {
    render(<ServiceStatusPill status={status} serviceOffline={status === 'offline'} />);

    const button = screen.getByRole('button', { name: label });
    expect(button).toHaveAttribute('data-status', status);
    if (status === 'offline') {
      expect(button).toHaveAttribute('title', 'Backend services are unreachable; retrying.');
    } else {
      expect(button).not.toHaveAttribute('title');
    }
  });

  it('invokes retry handler while offline', () => {
    const onRetry = vi.fn();
    render(<ServiceStatusPill status="offline" onRetry={onRetry} serviceOffline />);

    fireEvent.click(screen.getByRole('button', { name: /Backend services offline/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('prevents retry while checking status', () => {
    const onRetry = vi.fn();
    render(<ServiceStatusPill status="checking" onRetry={onRetry} serviceOffline={false} />);

    const button = screen.getByRole('button', { name: /Checking backend services/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(onRetry).not.toHaveBeenCalled();
  });
});
