import { render } from '@testing-library/react';
import { vi } from 'vitest';

import AnalyticsDashboard from '../components/AnalyticsDashboard';
import * as analyticsUtils from '../utils/analytics';
import type { SceneMetric } from '../../shared/ipc/services';

function buildScenes(count: number): SceneMetric[] {
  return Array.from({ length: count }, (_, index) => ({
    sceneId: `sc_${index + 1}`,
    index,
    title: `Scene ${index + 1}`,
    wordCount: 800 + (index % 5) * 25,
    readability: 12 + (index % 3),
    density: { dialogueRatio: 0.4 + (index % 2) * 0.1, narrationRatio: 0.6 - (index % 2) * 0.1 },
  }));
}

describe('Performance regressions for analytics surfaces', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { services?: unknown }).services = undefined;
  });

  it('renders large scene set within budget', () => {
    const scenes = buildScenes(120);
    (window as typeof window & { services?: any }).services = {
      getAnalyticsSummary: vi.fn().mockResolvedValue({
        ok: true,
        data: { projectId: 'proj', projectPath: '/proj', scenes: scenes.length, wordCount: 100000, avgReadability: 12 },
      }),
      getAnalyticsScenes: vi.fn().mockResolvedValue({
        ok: true,
        data: { projectId: 'proj', projectPath: '/proj', scenes },
      }),
    };

    const start = performance.now();
    render(<AnalyticsDashboard projectId="proj" />);
    const elapsed = performance.now() - start;

    // Ensure synthetic render stays under a generous local threshold.
    expect(elapsed).toBeLessThan(300);
  });

  it('avoids repeated heavy calculations on identical props', async () => {
    const scenes = buildScenes(10);
    const computeSpy = vi.spyOn(analyticsUtils, 'computeEmotionArc');
    (window as typeof window & { services?: any }).services = {
      getAnalyticsSummary: vi.fn().mockResolvedValue({
        ok: true,
        data: { projectId: 'proj', projectPath: '/proj', scenes: scenes.length, wordCount: 5000, avgReadability: 10 },
      }),
      getAnalyticsScenes: vi.fn().mockResolvedValue({
        ok: true,
        data: { projectId: 'proj', projectPath: '/proj', scenes },
      }),
    };

    const { rerender } = render(<AnalyticsDashboard projectId="proj" />);
    rerender(<AnalyticsDashboard projectId="proj" />);
    rerender(<AnalyticsDashboard projectId="proj" />);

    const calls = computeSpy.mock.calls.length;
    expect(calls).toBeLessThanOrEqual(1);
  });
});
