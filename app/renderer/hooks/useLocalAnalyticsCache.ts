import { useEffect, useState } from 'react';

import type { AnalyticsScenes, AnalyticsSummary } from '../../shared/ipc/services';
import { loadLocalAnalytics } from '../utils/localAnalyticsCache';

type LocalAnalyticsState = {
  summary: AnalyticsSummary | null;
  scenes: AnalyticsScenes | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: LocalAnalyticsState = {
  summary: null,
  scenes: null,
  loading: false,
  error: null,
};

export function useLocalAnalyticsCache(
  projectPath?: string | null,
  projectId?: string | null,
  enabled = false,
): LocalAnalyticsState {
  const [state, setState] = useState<LocalAnalyticsState>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled || !projectPath) {
      setState(INITIAL_STATE);
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    void loadLocalAnalytics(projectPath, projectId ?? undefined)
      .then((data) => {
        if (cancelled) {
          return;
        }
        if (!data) {
          setState({
            summary: null,
            scenes: null,
            loading: false,
            error: 'Cached analytics unavailable.',
          });
          return;
        }
        setState({ summary: data.summary, scenes: data.scenes, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          summary: null,
          scenes: null,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load cached analytics data locally.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, projectId, projectPath]);

  return state;
}
