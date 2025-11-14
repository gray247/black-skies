"""Draft export endpoint and schema."""

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import Depends, status
from pydantic import BaseModel, ValidationError, field_validator

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...http import raise_filesystem_error, raise_service_error, raise_validation_error
from ...models._project_id import validate_project_id
from ...scene_docs import DraftRequestError
from ...resilience import CircuitOpenError, ServiceResilienceExecutor
from ...feature_flags import analytics_enabled
from ..dependencies import (
    get_diagnostics,
    get_optional_analytics_resilience,
    get_settings,
)
from . import router
from ...operations.draft_export import DraftExportService


class DraftExportRequest(BaseModel):
    project_id: str
    include_meta_header: bool = False

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        """Ensure export requests use a safe single-segment project identifier."""

        return validate_project_id(value)


@router.post("/export")
async def export_manuscript(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    analytics_resilience: ServiceResilienceExecutor | None = Depends(get_optional_analytics_resilience),
) -> dict[str, Any]:
    """Compile the manuscript to disk with optional metadata headers."""

    try:
        request_model = DraftExportRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid export request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    analytics_timeout = getattr(settings, "analytics_task_timeout_seconds", 60)
    analytics_flag = analytics_enabled()

    export_service = DraftExportService(
        settings=settings,
        diagnostics=diagnostics,
        analytics_resilience=analytics_resilience,
        analytics_enabled=analytics_flag,
    )

    try:
        result = await export_service.export(
            project_id=request_model.project_id,
            include_meta_header=request_model.include_meta_header,
        )
    except CircuitOpenError as exc:
        raise_service_error(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="SERVICE_UNAVAILABLE",
            message="Analytics service is temporarily unavailable.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except asyncio.TimeoutError as exc:
        raise_service_error(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="TIMEOUT",
            message="Analytics export timed out.",
            details={"error": str(exc), "timeout_seconds": analytics_timeout},
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except FileNotFoundError:
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )
    except OSError as exc:
        raise_filesystem_error(
            exc,
            message="Failed to write export artifacts.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    return result.payload


__all__ = ["export_manuscript", "DraftExportRequest"]
