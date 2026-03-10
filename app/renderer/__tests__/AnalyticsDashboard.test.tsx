import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import AnalyticsDashboard from '../components/AnalyticsDashboard';

const summaryPayload = {
  ok: true,
  data: {
    projectId: 'proj',
    projectPath: '/path/proj',
    scenes: 2,
    wordCount: 150,
    avgReadability: 12.5,
    readability: {
      avg_sentence_len: 12.5,
      pct_long_sentences: 0.08,
      ttr: 0.67,
      bucket: 'Moderate',
    },
    dialogue_ratio: 0.4,
    narration_ratio: 0.6,
  },
};

const scenesPayload = {
  ok: true,
  data: {
    projectId: 'proj',
    projectPath: '/path/proj',
    scenes: [
      {
        sceneId: 'sc_0001',
        index: 0,
        title: 'Scene One',
        wordCount: 80,
        readability: 10,
        readabilityMetrics: {
          avg_sentence_len: 10,
          pct_long_sentences: 0.05,
          ttr: 0.78,
          bucket: 'Easy',
        },
        density: { dialogueRatio: 0.4, narrationRatio: 0.6 },
        pacing: { structuralScore: 1200, bucket: 'Neutral' },
      },
    ],
  },
};

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { services?: unknown }).services = {
      getAnalyticsSummary: vi.fn().mockResolvedValue(summaryPayload),
      getAnalyticsScenes: vi.fn().mockResolvedValue(scenesPayload),
    };
  });

  afterEach(() => {
    delete (window as typeof window & { services?: unknown }).services;
  });

  it('renders summary and scene rows', async () => {
    render(<AnalyticsDashboard projectId="proj" projectPath="/path/proj" />);
    await waitFor(() => {
      expect(
        screen.getByRole('columnheader', { name: 'Scenes' }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Word count/i)).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Scene One')).toBeInTheDocument();
    });
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-emotion-graph')).toBeInTheDocument();
    const pacing = screen.getByTestId('analytics-pacing-strip');
    expect(pacing).toBeInTheDocument();
    expect(pacing.querySelectorAll('span').length).toBe(1);
  });
});
