import { useEffect, useState } from "react";

import type { SceneMetric } from "../../shared/ipc/services";
import OfflineBanner from "./OfflineBanner";
import { useServiceHealthContext } from "../contexts/serviceHealthContext";
import { useLocalAnalyticsCache } from "../hooks/useLocalAnalyticsCache";

export const CORKBOARD_HEADING_ID = "corkboard-heading";

interface CorkboardProps {
  projectId?: string | null;
  projectPath?: string | null;
}

interface CorkboardState {
  scenes: SceneMetric[];
  loading: boolean;
  error: string | null;
}

const formatRatio = (value: number): string =>
  Number.isFinite(value) ? `${(value * 100).toFixed(0)}%` : "-";

function Corkboard({ projectId, projectPath }: CorkboardProps): JSX.Element {
  const { serviceUnavailable, onRetry } = useServiceHealthContext();
  const [state, setState] = useState<CorkboardState>({
    scenes: [],
    loading: false,
    error: null,
  });
  const safeProjectPath = projectPath ?? "";
  const cachedState = useLocalAnalyticsCache(safeProjectPath, projectId ?? null, serviceUnavailable);
  const sceneRows = serviceUnavailable ? cachedState.scenes?.scenes ?? [] : state.scenes;
  const isLoading = serviceUnavailable ? cachedState.loading : state.loading;
  const errorMessage = serviceUnavailable ? cachedState.error : state.error;
  const noProject = !safeProjectPath && !serviceUnavailable;

  useEffect(() => {
    if (noProject) {
      setState({ scenes: [], loading: false, error: null });
      return;
    }
    if (serviceUnavailable) {
      setState({ scenes: [], loading: false, error: null });
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
  }, [noProject, projectId, serviceUnavailable]);

  if (noProject) {
    return (
      <div className="corkboard corkboard--no-project">
        <header>
          <h2 id={CORKBOARD_HEADING_ID}>Corkboard</h2>
        </header>
        <p className="corkboard__placeholder">No project selected. Open a project to view scene cards.</p>
      </div>
    );
  }

  return (
    <div className="corkboard">
      <header>
        <h2 id={CORKBOARD_HEADING_ID}>Corkboard</h2>
        <p>Scene cards ordered by the outline.</p>
      </header>
      {serviceUnavailable && (
        <OfflineBanner
          message="Analytics service offline — using cached metrics."
          onRetry={onRetry}
        />
      )}
      {errorMessage && <p className="corkboard__error">{errorMessage}</p>}
      {isLoading && (
        <p className="corkboard__loading">
          {serviceUnavailable ? "Loading cached analytics…" : "Loading scenes…"}
        </p>
      )}
      <div className="corkboard__grid">
        {sceneRows.map((scene) => (
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
      {!isLoading && sceneRows.length === 0 && !errorMessage && (
        <p>No scene cards yet. Load a project to view the corkboard.</p>
      )}
    </div>
  );
}

export default Corkboard;
