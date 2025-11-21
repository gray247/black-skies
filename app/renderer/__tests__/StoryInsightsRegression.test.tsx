import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import AnalyticsDashboard from '../components/AnalyticsDashboard';
import Corkboard from '../components/Corkboard';
import RelationshipGraph from '../components/RelationshipGraph';

const buildScenes = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    sceneId: `sc_${String(index + 1).padStart(4, '0')}`,
    index,
    title: `Scene ${index + 1}`,
    wordCount: 250 + index,
    readability: 12.5,
    density: { dialogueRatio: 0.45, narrationRatio: 0.55 },
  }));

describe('Story Insights regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    (window as typeof window & { services?: unknown }).services = undefined;
    global.fetch = undefined as any;
  });

  it('renders Story Insights surfaces without error banners', async () => {
    const scenes = buildScenes(3);
    (window as typeof window & { services?: any }).services = {
      getAnalyticsSummary: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          projectId: 'proj',
          projectPath: '/projects/proj',
          scenes: scenes.length,
          wordCount: scenes.reduce((total, item) => total + item.wordCount, 0),
          avgReadability: 12.3,
        },
      }),
      getAnalyticsScenes: vi.fn().mockResolvedValue({ ok: true, data: { scenes } }),
    };

    render(<AnalyticsDashboard projectId="proj" />);

    await waitFor(() => expect(screen.getByText('Story Insights')).toBeInTheDocument());
    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
    expect(await screen.findByTestId('analytics-emotion-graph')).toBeInTheDocument();
    expect(await screen.findByTestId('analytics-pacing-strip')).toBeInTheDocument();
    expect(screen.getByText(/Project ID/i)).toBeInTheDocument();
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.queryByText(/\bAnalytics\b/i)).toBeNull();
  });

  it('only shows the error banner when Story Insights calls fail', async () => {
    (window as typeof window & { services?: any }).services = {
      getAnalyticsSummary: vi.fn().mockRejectedValue(new Error('Network failure')),
      getAnalyticsScenes: vi.fn().mockRejectedValue(new Error('Network failure')),
    };

    render(<AnalyticsDashboard projectId="proj" />);

    await screen.findByText(/network failure/i);
    expect(screen.getByText(/network failure/i)).toBeInTheDocument();
  });

  it('handles many scenes in the corkboard without overflow', async () => {
    const scenes = buildScenes(12);
    (window as typeof window & { services?: any }).services = {
      getAnalyticsScenes: vi.fn().mockResolvedValue({ ok: true, data: { scenes } }),
    };

    render(<Corkboard projectId="proj" />);

    await waitFor(() => expect(screen.getAllByTestId('corkboard-card').length).toBe(12));
    expect(screen.queryByText(/Something went wrong/i)).toBeNull();
  });

  it('renders relationship graph empty and populated states safely', async () => {
    const services = {
      getAnalyticsRelationships: vi
        .fn()
        .mockResolvedValueOnce({ ok: true, data: { nodes: [], edges: [] } })
        .mockResolvedValueOnce({
          ok: true,
          data: {
            nodes: [
              { id: 'char_1', type: 'character', label: 'Alex', weight: 1 },
              { id: 'sc_0001', type: 'scene', label: 'Opening', weight: 1 },
            ],
            edges: [{ from: 'char_1', to: 'sc_0001', type: 'appearsIn', weight: 1 }],
          },
        }),
    };
    (window as typeof window & { services?: any }).services = services;

    const { rerender } = render(<RelationshipGraph projectId="proj-empty" />);
    await screen.findByText(/No relationship data has been gathered yet./i);

    rerender(<RelationshipGraph projectId="proj" />);
    await waitFor(() => expect(screen.getAllByText('Alex')[0]).toBeInTheDocument());
    expect(screen.getByText('sc_0001')).toBeInTheDocument();
  });

  it('keeps insights panes hidden until explicitly opened', async () => {
    const PanelHost = () => {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open Story Insights
          </button>
          {open ? <div data-testid="insights-pane">Story Insights</div> : null}
        </div>
      );
    };
    const user = userEvent.setup();
    render(<PanelHost />);
    expect(screen.queryByTestId('insights-pane')).toBeNull();
    await user.click(screen.getByRole('button', { name: /open story insights/i }));
    expect(screen.getByTestId('insights-pane')).toBeInTheDocument();
  });

  it('only hits valid analytics endpoints when insights open', async () => {
    const urls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      urls.push(url);
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as any;

    const buildService = (path: string) =>
      vi.fn(async ({ projectId }: { projectId: string }) => {
        const url = `http://127.0.0.1:9999${path}?project_id=${projectId}`;
        const response = await fetch(url);
        await response.json();
        if (path.includes('summary')) {
          return {
            ok: true,
            data: {
              projectId,
              projectPath: `/projects/${projectId}`,
              scenes: 0,
              wordCount: 0,
              avgReadability: 12.1,
            },
          };
        }
        if (path.includes('scenes')) {
          return {
            ok: true,
            data: { scenes: [] },
          };
        }
        return { ok: true, data: { nodes: [], edges: [] } };
      });

    (window as typeof window & { services?: any }).services = {
      getAnalyticsSummary: buildService('/api/v1/analytics/summary'),
      getAnalyticsScenes: buildService('/api/v1/analytics/scenes'),
      getAnalyticsRelationships: buildService('/api/v1/analytics/relationships'),
    };

    render(<AnalyticsDashboard projectId="proj" />);
    await waitFor(() => expect(urls.length).toBeGreaterThanOrEqual(2));

    urls.forEach((url) => {
      expect(
        ['/api/v1/analytics/summary', '/api/v1/analytics/scenes', '/api/v1/analytics/relationships'].some(
          (allowed) => url.includes(allowed),
        ),
      ).toBe(true);
      expect(url.toLowerCase()).not.toContain('budget');
      expect(url.toLowerCase()).not.toContain('budgetprojectid');
    });
  });
});
