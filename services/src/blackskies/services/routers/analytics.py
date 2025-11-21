"""Minimal Analytics endpoints used until Phase 6 metrics arrive."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field

from ..analytics_stub import get_project_summary, get_relationship_graph, get_scene_metrics
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..feature_flags import analytics_enabled
from ..http import raise_service_error
from ..operations.budget_service import BudgetService
from .dependencies import get_diagnostics, get_settings

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
) -> dict[str, object]:
    """Return a lightweight summary for the requested project."""

    _assert_analytics_enabled()
    return get_project_summary(settings, project_id)


@router.get("/scenes")
def get_analytics_scenes(
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
) -> dict[str, object]:
    """Return stubbed scene metrics for the requested project."""

    _assert_analytics_enabled()
    return get_scene_metrics(settings, project_id)


class AnalyticsRelationshipNode(BaseModel):
    id: str
    label: str
    type: str


class AnalyticsRelationshipEdge(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    from_: str = Field(..., alias="from")
    to: str
    kind: str


class AnalyticsRelationshipGraph(BaseModel):
    projectId: str
    nodes: list[AnalyticsRelationshipNode]
    edges: list[AnalyticsRelationshipEdge]


@router.get("/relationships")
def get_analytics_relationships(
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
) -> AnalyticsRelationshipGraph:
    """Return relationship graph data for the requested project."""

    _assert_analytics_enabled()
    graph = get_relationship_graph(settings, project_id)
    return AnalyticsRelationshipGraph.model_validate(graph)


@router.get("/budget")
def get_analytics_budget(
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, object]:
    """Return the current budget summary for the requested project."""

    _assert_analytics_enabled()
    project_root = settings.project_base_dir / project_id
    try:
        budget_service = BudgetService(settings=settings, diagnostics=diagnostics)
        state = budget_service.load_state(project_root)
    except Exception as exc:
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to load budget information.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    hint = "stable"
    if state.spent_usd >= state.hard_limit:
        hint = "over_budget"
    elif state.spent_usd >= state.soft_limit:
        hint = "near_cap"
    elif state.spent_usd <= state.soft_limit * 0.25:
        hint = "ample"

    return {
        "project_id": project_id,
        "budget": {
            "soft_limit_usd": round(state.soft_limit, 2),
            "hard_limit_usd": round(state.hard_limit, 2),
            "spent_usd": round(state.spent_usd, 2),
            "remaining_usd": round(max(state.hard_limit - state.spent_usd, 0.0), 2),
        },
        "hint": hint,
    }


def _assert_analytics_enabled() -> None:
    if not analytics_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)


__all__ = ["router"]
