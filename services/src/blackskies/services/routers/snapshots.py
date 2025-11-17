"""Snapshot API router for Phase 5."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ValidationError, field_validator

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_filesystem_error, raise_validation_error
from ..models._project_id import validate_project_id
from ..snapshots import create_snapshot, list_snapshots
from .dependencies import get_diagnostics, get_settings

router = APIRouter(prefix="/snapshots", tags=["snapshots"])


class SnapshotRequest(BaseModel):
    """Request body for snapshot creation."""

    project_id: str

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)


@router.post("", status_code=status.HTTP_200_OK)
async def create_snapshot_endpoint(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Create a snapshot for the provided project."""

    try:
        request_model = SnapshotRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid snapshot request.",
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

    try:
        return create_snapshot(project_root)
    except OSError as exc:
        raise_filesystem_error(
            exc,
            message="Failed to create snapshot.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )


@router.get("", status_code=status.HTTP_200_OK)
async def list_snapshots_endpoint(
    project_id: str = Query(..., alias="projectId"),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> list[dict[str, Any]]:
    """List snapshots for the provided project."""

    try:
        validated_id = validate_project_id(project_id)
    except ValueError as exc:
        raise_validation_error(
            message="Invalid project identifier.",
            details={"errors": str(exc)},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = settings.project_base_dir / validated_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": validated_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    return list_snapshots(project_root)
