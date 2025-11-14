"""Analytics summary API endpoints."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, Query, status

from ..analytics.service import AnalyticsSummaryService
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_service_error, raise_validation_error
from ..operations.budget_service import BudgetService
from ..resilience import CircuitOpenError, ServiceResilienceExecutor
from ..scene_docs import DraftRequestError
from .dependencies import (
    get_analytics_resilience,
    get_diagnostics,
    get_settings,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def get_analytics_summary(
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    analytics_resilience: ServiceResilienceExecutor = Depends(get_analytics_resilience),
):
    """Return the cached analytics summary for a project."""

    service = AnalyticsSummaryService(settings=settings, diagnostics=diagnostics)
    try:
        return await analytics_resilience.run(
            label="analytics",
            operation=lambda: service.build_summary(project_id),
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=settings.project_base_dir / project_id,
        )
    except CircuitOpenError as exc:
        raise_service_error(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="SERVICE_UNAVAILABLE",
            message="Analytics service is temporarily unavailable.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=settings.project_base_dir / project_id,
        )
    except asyncio.TimeoutError as exc:
        raise_service_error(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="TIMEOUT",
            message="Analytics computation timed out.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=settings.project_base_dir / project_id,
        )
    except Exception as exc:  # pragma: no cover - defensive guard
        diagnostics.log(
            settings.project_base_dir / project_id,
            code="INTERNAL",
            message="Analytics summary generation failed.",
            details={"error": str(exc)},
        )
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to generate analytics summary.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=settings.project_base_dir / project_id,
        )


@router.get("/budget")
async def get_analytics_budget(
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Return the current budget state and simple hints."""

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

    spent = state.spent_usd
    hint = "stable"
    if spent >= state.hard_limit:
        hint = "over_budget"
    elif spent >= state.soft_limit:
        hint = "near_cap"
    elif spent <= state.soft_limit * 0.25:
        hint = "ample"

    return {
        "project_id": project_id,
        "budget": {
            "soft_limit_usd": round(state.soft_limit, 2),
            "hard_limit_usd": round(state.hard_limit, 2),
            "spent_usd": round(spent, 2),
            "remaining_usd": round(max(state.hard_limit - spent, 0.0), 2),
        },
        "hint": hint,
    }


__all__ = ["router"]
