import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { InsightsAnalytics } from '../components/CompanionOverlay';

const summaryPayload = {
  ok: true,
  data: {
    projectId: 'proj',
    projectPath: '/path/proj',
    scenes: 3,
    wordCount: 200,
    avgReadability: 11.2,
  },
};

const scenesPayload = {
  ok: true,
  data: {
    projectId: 'proj',
    projectPath: '/path/proj',
    scenes: [
      {
        sceneId: 'sc_001',
        index: 0,
        title: 'Scene One',
        wordCount: 80,
        readability: 10,
        density: { dialogueRatio: 0.4, narrationRatio: 0.6 },
      },
    ],
  },
};

describe('InsightsAnalytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders summary and scene entries when online', async () => {
    (window as typeof window & { services?: unknown }).services = {
      getAnalyticsSummary: vi.fn().mockResolvedValue(summaryPayload),
      getAnalyticsScenes: vi.fn().mockResolvedValue(scenesPayload),
    };
    render(<InsightsAnalytics projectId="proj" serviceStatus="online" />);
    await waitFor(() => {
      expect(screen.getByTestId('insights-analytics-summary')).toBeInTheDocument();
    });
    expect(screen.getByText('Word count')).toBeInTheDocument();
    expect(screen.getByTestId('insights-analytics-scenes')).toBeInTheDocument();
    expect(screen.getByText('Scene One')).toBeInTheDocument();
  });

  it('shows offline message when services unavailable', async () => {
    (window as typeof window & { services?: unknown }).services = {
      getAnalyticsSummary: vi.fn().mockResolvedValue(summaryPayload),
      getAnalyticsScenes: vi.fn().mockResolvedValue(scenesPayload),
    };
    render(<InsightsAnalytics projectId="proj" serviceStatus="offline" />);
    await waitFor(() => {
      expect(screen.getByTestId('insights-analytics-offline')).toBeInTheDocument();
    });
  });
});
