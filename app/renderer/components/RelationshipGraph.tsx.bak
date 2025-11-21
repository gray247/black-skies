import { useEffect, useMemo, useState } from "react";

import type {
  AnalyticsRelationshipGraph,
  AnalyticsRelationshipNode,
} from "../../shared/ipc/services";
import OfflineBanner from "./OfflineBanner";

interface RelationshipGraphProps {
  projectId?: string | null;
  serviceUnavailable?: boolean;
  onRetry?: () => void;
}

interface GraphState {
  graph: AnalyticsRelationshipGraph | null;
  loading: boolean;
  error: string | null;
}

const initialState: GraphState = {
  graph: null,
  loading: false,
  error: null,
};

function formatEdgeLabel(kind: string): string {
  return kind === "appearsIn" ? "Appears In" : kind;
}

function RelationshipGraph({
  projectId,
  serviceUnavailable = false,
  onRetry,
}: RelationshipGraphProps): JSX.Element {
  const [state, setState] = useState<GraphState>(initialState);

  useEffect(() => {
    if (serviceUnavailable) {
      setState({
        graph: null,
        loading: false,
        error: "Writing tools are offline. Relationship data cannot be loaded.",
      });
      return;
    }
    if (!projectId) {
      setState({ ...initialState });
      return;
    }
    const services = window.services;
    if (!services?.getAnalyticsRelationships) {
      setState({
        graph: null,
        loading: false,
        error: "Story Insights relationships bridge unavailable.",
      });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    services
      .getAnalyticsRelationships({ projectId })
      .then((response) => {
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          throw new Error(response.error?.message ?? "Unable to load relationships.");
        }
        setState({ graph: response.data, loading: false, error: null });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          graph: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, serviceUnavailable]);

  const nodesById = useMemo(() => {
    const map = new Map<string, AnalyticsRelationshipNode>();
    state.graph?.nodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [state.graph?.nodes]);

  const characterNodes = useMemo(() => {
    return (state.graph?.nodes ?? []).filter((node) => node.type === "character");
  }, [state.graph?.nodes]);

  const sceneNodes = useMemo(() => {
    return (state.graph?.nodes ?? []).filter((node) => node.type === "scene");
  }, [state.graph?.nodes]);

  const edgeList = useMemo(() => state.graph?.edges ?? [], [state.graph?.edges]);

  return (
    <div className="relationship-graph" data-testid="relationship-graph">
      <header>
        <h2>Relationship Graph</h2>
        <p>See how characters connect with scenes in the current project.</p>
      </header>
      {serviceUnavailable && (
        <OfflineBanner
          message="Relationship data requires an online connection."
          onRetry={onRetry}
        />
      )}
      {state.error && <p className="relationship-graph__error">{state.error}</p>}
      {state.loading && <p className="relationship-graph__loading">Loading relationships…</p>}
      {state.graph && (
        <>
          <section className="relationship-graph__summary">
            <div>
              <strong>Nodes</strong>
              <span>{state.graph.nodes.length}</span>
            </div>
            <div>
              <strong>Edges</strong>
              <span>{state.graph.edges.length}</span>
            </div>
          </section>
          {state.graph.nodes.length === 0 && (
            <p
              className="relationship-graph__empty"
              data-testid="relationship-empty"
            >
              No relationship data has been gathered yet.
            </p>
          )}
          <div className="relationship-graph__grid">
            <section className="relationship-graph__column">
              <h3>Characters</h3>
              {characterNodes.length === 0 && <p>No characters detected.</p>}
              {characterNodes.map((node) => (
                <div
                  key={node.id}
                  className="relationship-graph__node"
                  data-testid="relationship-node"
                >
                  <strong>{node.label}</strong>
                  <span>{node.id}</span>
                </div>
              ))}
            </section>
            <section className="relationship-graph__column">
              <h3>Scenes</h3>
              {sceneNodes.length === 0 && <p>No scenes found.</p>}
              {sceneNodes.map((node) => (
                <div
                  key={node.id}
                  className="relationship-graph__node"
                  data-testid="relationship-node"
                >
                  <strong>{node.label}</strong>
                  <span>{node.id}</span>
                </div>
              ))}
            </section>
          </div>
          {edgeList.length > 0 && (
            <section className="relationship-graph__edges">
              <h3>Connections</h3>
              <ul>
                {edgeList.map((edge) => (
                  <li
                    key={`${edge.from}-${edge.to}-${edge.kind}`}
                    className="relationship-graph__edge"
                    data-testid="relationship-edge"
                  >
                    <span className="relationship-graph__edge-node">
                      {nodesById.get(edge.from)?.label ?? edge.from}
                    </span>
                    <span className="relationship-graph__edge-kind">
                      {formatEdgeLabel(edge.kind)}
                    </span>
                    <span className="relationship-graph__edge-node">
                      {nodesById.get(edge.to)?.label ?? edge.to}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {!state.loading && !state.graph && !state.error && (
        <p>Select a project to visualize relationship data.</p>
      )}
    </div>
  );
}

export default RelationshipGraph;
