"""Project export API surface for Phase 5."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ValidationError, field_validator

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..export_service import ExportFormat, ProjectExportService
from ..http import raise_filesystem_error, raise_validation_error
from ..models._project_id import validate_project_id
from ..scene_docs import DraftRequestError
from .dependencies import get_diagnostics, get_settings

router = APIRouter(prefix="/export", tags=["export"])


class ProjectExportRequest(BaseModel):
    """Request body for project exports."""

    project_id: str
    format: ExportFormat = ExportFormat.MD
    include_meta_header: bool = False

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)


class ProjectExportResponse(BaseModel):
    """Response contract for successful exports."""

    project_id: str
    path: str
    format: ExportFormat
    chapters: int
    scenes: int
    meta_header: bool
    exported_at: str
    schema_version: Literal["ProjectExportResult v1"]


@router.post("", response_model=ProjectExportResponse, status_code=status.HTTP_200_OK)
async def export_project(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> ProjectExportResponse:
    """Export the active project to the requested format."""

    try:
        request_model = ProjectExportRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid export request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    export_service = ProjectExportService(
        settings=settings,
        diagnostics=diagnostics,
    )

    try:
        result = await export_service.export(
            project_id=request_model.project_id,
            format=request_model.format,
            include_meta_header=request_model.include_meta_header,
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details or {},
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
            message="Failed to write export artifact.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    return ProjectExportResponse.model_validate(result.payload)


__all__ = ["export_project", "ProjectExportRequest", "ProjectExportResponse"]
