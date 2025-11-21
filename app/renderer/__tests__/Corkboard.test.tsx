import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import Corkboard from '../components/Corkboard';

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
        density: {
          dialogueRatio: 0.3,
          narrationRatio: 0.7,
        },
      },
      {
        sceneId: 'sc_002',
        index: 1,
        title: 'Scene Two',
        wordCount: 120,
        readability: 12,
        density: {
          dialogueRatio: 0.5,
          narrationRatio: 0.5,
        },
      },
    ],
  },
};

describe('Corkboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { services?: unknown }).services = {
      getAnalyticsScenes: vi.fn().mockResolvedValue(scenesPayload),
    };
  });

  afterEach(() => {
    delete (window as typeof window & { services?: unknown }).services;
  });

  it('renders a card per scene', async () => {
    render(<Corkboard projectId="proj" />);
    await waitFor(() => {
      expect(screen.getAllByTestId('corkboard-card').length).toBe(2);
    });
    expect(screen.getByText('Scene One')).toBeInTheDocument();
    expect(screen.getByText('Scene Two')).toBeInTheDocument();
    expect(screen.getAllByText(/Dialogue/i).length).toBeGreaterThan(0);
  });
});
