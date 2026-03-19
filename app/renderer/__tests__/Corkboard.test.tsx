import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    render(<Corkboard projectId="proj" projectPath="/path/proj" />);
    await waitFor(() => {
      expect(screen.getAllByTestId('corkboard-card').length).toBe(2);
    });
    expect(screen.getByText('Scene One')).toBeInTheDocument();
    expect(screen.getByText('Scene Two')).toBeInTheDocument();
    expect(screen.getAllByText(/Dialogue/i).length).toBeGreaterThan(0);
  });

  it('invokes scene selection and exposes selected state', async () => {
    const onSelectScene = vi.fn();
    render(
      <Corkboard
        projectId="proj"
        projectPath="/path/proj"
        activeSceneId="sc_002"
        onSelectScene={onSelectScene}
      />,
    );

    const sceneTwoButton = await screen.findByRole('button', { name: /scene two/i });
    expect(sceneTwoButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Selected/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Active corkboard scene/i)).toHaveTextContent(/Scene Two/i);
    expect(screen.getByText(/120 words/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', { name: /scene one/i }));

    expect(onSelectScene).toHaveBeenCalledWith('sc_001');
  });
});
