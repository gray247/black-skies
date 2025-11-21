import { useEffect, useMemo, useState } from "react";

import type { AnalyticsScenes, SceneMetric } from "../../shared/ipc/services";
import OfflineBanner from "./OfflineBanner";

interface CorkboardProps {
  projectId?: string | null;
  serviceUnavailable?: boolean;
  onRetry?: () => void;
}

interface CorkboardState {
  scenes: SceneMetric[];
  loading: boolean;
  error: string | null;
}

const formatRatio = (value: number): string =>
  Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "-";

function Corkboard({ projectId, serviceUnavailable = false, onRetry }: CorkboardProps): JSX.Element {
  const [state, setState] = useState<CorkboardState>({
    scenes: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (serviceUnavailable) {
      setState({ scenes: [], loading: false, error: "Story Insights is offline." });
      return;
    }
    if (!projectId) {
      setState({ scenes: [], loading: false, error: null });
      return;
    }
    const services = window.services;
    if (!services?.getAnalyticsScenes) {
      setState({
        scenes: [],
        loading: false,
        error: "Story Insights bridge unavailable.",
      });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    services
      .getAnalyticsScenes({ projectId })
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          throw new Error(response.error?.message ?? "Unable to load scenes.");
        }
        setState({ scenes: response.data.scenes, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          scenes: [],
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, serviceUnavailable]);

  const columns = useMemo(
    () => [
      { label: "Index", accessor: (scene: SceneMetric) => scene.index + 1 },
      { label: "Title", accessor: (scene: SceneMetric) => scene.title ?? scene.sceneId },
      { label: "Words", accessor: (scene: SceneMetric) => scene.wordCount },
      { label: "Readability", accessor: (scene: SceneMetric) =>
          scene.readability !== null ? scene.readability.toFixed(1) : "-" },
      { label: "Dialogue", accessor: (scene: SceneMetric) =>
          formatRatio(scene.density.dialogueRatio) },
    ],
    [],
  );

  return (
    <div className="corkboard">
      <header>
        <h2>Corkboard</h2>
        <p>Scene cards ordered by the outline.</p>
      </header>
      {serviceUnavailable && (
        <OfflineBanner
          message="Corkboard content is unavailable while writing tools are offline."
          onRetry={onRetry}
        />
      )}
      {state.error && <p className="corkboard__error">{state.error}</p>}
      {state.loading && <p className="corkboard__loading">Loading scenes…</p>}
      <div className="corkboard__grid">
        {state.scenes.map((scene) => (
          <article
            key={scene.sceneId}
            className="corkboard-card"
            data-testid="corkboard-card"
            aria-label={`Scene card for ${scene.title ?? scene.sceneId}`}
          >
            <header>
              <span className="corkboard-card__index">#{scene.index + 1}</span>
              <h3>{scene.title ?? scene.sceneId}</h3>
            </header>
            <div className="corkboard-card__meta">
              <div>
                <strong>ID</strong>
                <span>{scene.sceneId}</span>
              </div>
              <div>
                <strong>Words</strong>
                <span>{scene.wordCount}</span>
              </div>
              <div>
                <strong>Readability</strong>
                <span>{scene.readability !== null ? scene.readability.toFixed(1) : "-"}</span>
              </div>
              <div>
                <strong>Dialogue</strong>
                <span>{formatRatio(scene.density.dialogueRatio)}</span>
              </div>
              <div>
                <strong>Narration</strong>
                <span>{formatRatio(scene.density.narrationRatio)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!state.loading && state.scenes.length === 0 && !state.error && (
        <p>No scene cards yet. Load a project to view the corkboard.</p>
      )}
    </div>
  );
}

export default Corkboard;
