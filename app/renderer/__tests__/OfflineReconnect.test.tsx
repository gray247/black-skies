import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { vi } from 'vitest';

function OfflineAppHarness(): JSX.Element {
  const [online, setOnline] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(0);

  useEffect(() => {
    if (!online) {
      return;
    }
    const fetchAnalytics = async () => {
      await Promise.resolve();
      setAnalyticsLoaded((count) => count + 1);
    };
    void fetchAnalytics();
  }, [online]);

  return (
    <div>
      <p data-testid="service-status">{online ? 'online' : 'offline'}</p>
      <button data-testid="retry" onClick={() => setOnline(true)}>
        Retry
      </button>
      <button data-testid="dangerous-action" disabled={!online}>
        Generate
      </button>
      <p data-testid="analytics-count">{analyticsLoaded}</p>
    </div>
  );
}

describe('Offline / reconnect behavior', () => {
  it('shows offline degradation with disabled actions', () => {
    render(<OfflineAppHarness />);
    expect(screen.getByTestId('service-status').textContent).toBe('offline');
    expect((screen.getByTestId('dangerous-action') as HTMLButtonElement).disabled).toBe(true);
  });

  it('refreshes analytics once after reconnect', async () => {
    const user = userEvent.setup();
    render(<OfflineAppHarness />);
    await user.click(screen.getByTestId('retry'));
    await waitFor(() => expect(screen.getByTestId('service-status').textContent).toBe('online'));
    expect(screen.getByTestId('analytics-count').textContent).toBe('1');
    await user.click(screen.getByTestId('retry'));
    expect(screen.getByTestId('analytics-count').textContent).toBe('1');
  });
});
