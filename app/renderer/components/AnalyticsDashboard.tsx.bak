import { useEffect, useMemo, useState } from "react";

import type { AnalyticsScenes, AnalyticsSummary, SceneMetric } from "../../shared/ipc/services";
import { LABEL_AVG_READABILITY } from "./storyInsightsLabels";
import OfflineBanner from "./OfflineBanner";

interface AnalyticsDashboardProps {
  projectId?: string | null;
  serviceUnavailable?: boolean;
  onRetry?: () => void;
}

interface FetchState {
  summary: AnalyticsSummary | null;
  scenes: AnalyticsScenes | null;
  loading: boolean;
  error: string | null;
}

const sceneColumns = [
  { label: "Scene", key: "title" },
  { label: "Words", key: "wordCount" },
  { label: "Readability", key: "readability" },
  { label: "Dialogue %", key: "density.dialogueRatio" },
  { label: "Narration %", key: "density.narrationRatio" },
];

function safeRatio(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${(value * 100).toFixed(0)}%`;
}

function clampToUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function computeEmotion(scene: SceneMetric): number {
  const base = (scene.density.dialogueRatio ?? 0.5) * 0.6;
  const readability = scene.readability ?? 12;
  const normalizedReadability = clampToUnit(readability / 30);
  return clampToUnit(base + normalizedReadability * 0.4);
}

function computePacing(scene: SceneMetric, maxWords: number): number {
  const relative = maxWords > 0 ? scene.wordCount / maxWords : 0;
  return clampToUnit(1 - relative);
}

function AnalyticsDashboard({
  projectId,
  serviceUnavailable = false,
  onRetry,
}: AnalyticsDashboardProps): JSX.Element {
  const [state, setState] = useState<FetchState>({
    summary: null,
    scenes: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (serviceUnavailable) {
      setState({
        summary: null,
        scenes: null,
        loading: false,
        error: "Writing tools are offline. Analytics data is unavailable.",
      });
      return;
    }
    if (!projectId) {
      setState((prev) => ({ ...prev, summary: null, scenes: null, loading: false }));
      return;
    }
    const services = window.services;
    if (!services?.getAnalyticsSummary || !services?.getAnalyticsScenes) {
      setState((prev) => ({
        ...prev,
        error: "Story Insights bridge unavailable.",
        loading: false,
      }));
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    (async () => {
      try {
        const [summaryResp, scenesResp] = await Promise.all([
          services.getAnalyticsSummary({ projectId }),
          services.getAnalyticsScenes({ projectId }),
        ]);
        if (cancelled) {
          return;
        }
        if (!summaryResp.ok) {
          throw new Error(summaryResp.error?.message ?? "Unable to load summary.");
        }
        if (!scenesResp.ok) {
          throw new Error(scenesResp.error?.message ?? "Unable to load scene metrics.");
        }
        setState({
          summary: summaryResp.data,
          scenes: scenesResp.data,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, serviceUnavailable]);

  const summaryRows = useMemo(() => {
    if (!state.summary) {
      return [];
    }
    return [
      ["Project ID", state.summary.projectId],
      ["Project path", state.summary.projectPath],
      ["Scenes", state.summary.scenes],
      ["Word count", state.summary.wordCount],
      [
        LABEL_AVG_READABILITY,
        state.summary.avgReadability !== null ? state.summary.avgReadability.toFixed(2) : "-",
      ],
    ];
  }, [state.summary]);

  const scenesList = useMemo(() => state.scenes?.scenes ?? [], [state.scenes]);

  const emotionPoints = useMemo(() => {
    if (!scenesList.length) {
      return [];
    }
    return scenesList.map((scene, index) => ({
      index,
      value: computeEmotion(scene),
    }));
  }, [scenesList]);

  const pacingScores = useMemo(() => {
    if (!scenesList.length) {
      return [];
    }
    const maxWords = Math.max(...scenesList.map((scene) => scene.wordCount));
    return scenesList.map((scene) => computePacing(scene, maxWords));
  }, [scenesList]);

  const emotionPath = useMemo(() => {
    if (emotionPoints.length === 0) {
      return "";
    }
    const width = 100;
    const height = 50;
    const step = emotionPoints.length > 1 ? width / (emotionPoints.length - 1) : width;
    return emotionPoints
      .map((point, idx) => {
        const x = idx * step;
        const y = height - point.value * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [emotionPoints]);

  return (
    <div className="analytics-dashboard">
        <header>
          <h2>Story Insights</h2>
          <p>Live story insights for the current project.</p>
        </header>
        {serviceUnavailable && (
        <OfflineBanner
          message="Story Insights data requires an online connection."
          onRetry={onRetry}
        />
        )}
      {state.error && <p className="analytics-dashboard__error">{state.error}</p>}
      {state.loading && <p className="analytics-dashboard__loading">Loading metrics…</p>}
      {emotionPoints.length > 0 && (
        <section
          className="analytics-dashboard__chart"
          data-testid="analytics-emotion-graph"
          aria-label="Emotion intensity trend across scenes"
        >
          <h3>Emotion / Intensity</h3>
          <svg viewBox="0 0 100 50" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#6ee7b7"
              strokeWidth="2"
              points={emotionPath}
            />
          </svg>
        </section>
      )}
      {pacingScores.length > 0 && (
        <section
          className="analytics-dashboard__pacing"
          data-testid="analytics-pacing-strip"
          aria-label="Pacing strip indicating how scene length varies"
        >
          <h3>Pacing strip</h3>
          <div className="analytics-dashboard__pacing-strip">
            {pacingScores.map((score, idx) => (
              <span
                key={`pac-${idx}`}
                style={{ opacity: 0.3 + score * 0.7 }}
                aria-label={`Scene ${idx + 1} pacing ${score.toFixed(2)}`}
              />
            ))}
          </div>
        </section>
      )}
      {!state.loading && state.summary && (
        <section className="analytics-dashboard__summary">
          <table>
            <tbody>
              {summaryRows.map(([label, value]) => (
                <tr key={label}>
                  <th>{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {!state.loading && state.scenes && scenesList.length > 0 && (
        <section className="analytics-dashboard__scenes">
          <h3>Scenes</h3>
          <div className="analytics-dashboard__scenes-grid">
            <div className="analytics-dashboard__row analytics-dashboard__row--header">
              {sceneColumns.map((column) => (
                <span key={column.label}>{column.label}</span>
              ))}
            </div>
            {scenesList.map((scene) => (
              <div key={scene.sceneId} className="analytics-dashboard__row">
                <span>{scene.title}</span>
                <span>{scene.wordCount}</span>
                <span>
                  {scene.readability !== null ? scene.readability.toFixed(2) : "-"}
                </span>
                <span>{safeRatio(scene.density.dialogueRatio)}</span>
                <span>{safeRatio(scene.density.narrationRatio)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {!state.loading && state.scenes && scenesList.length === 0 && (
        <p>No scene metrics yet. Generate drafts to populate story insights.</p>
      )}
      {!state.loading && !state.summary && !state.error && (
        <p>Select a project to load story insights data.</p>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
