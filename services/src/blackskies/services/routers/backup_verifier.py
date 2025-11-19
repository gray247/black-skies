"""Backup verification router for Phase 5."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ValidationError, field_validator

from ..backup_verifier import run_verification
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..e2e_mode import e2e_backup_verification, is_e2e_mode
from ..http import raise_validation_error
from ..models._project_id import validate_project_id
from .dependencies import get_diagnostics, get_settings

router = APIRouter(prefix="/backup_verifier", tags=["backup_verifier"])


class VerificationRequest(BaseModel):
    """Payload describing a verification request."""

    project_id: str

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)


@router.post("/run", status_code=status.HTTP_200_OK)
async def run_backup_verifier(
    payload: dict[str, Any] | None = None,
    project_id: str | None = Query(None, alias="projectId"),
    latest_only: bool = Query(False),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Run snapshot verification for the specified project."""

    identifier = project_id
    if payload and isinstance(payload, dict) and "projectId" in payload:
        identifier = payload["projectId"]

    if not isinstance(identifier, str):
        raise_validation_error(
            message="Missing project identifier.",
            details={"project_id": identifier},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        validated_id = validate_project_id(identifier)
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

    if is_e2e_mode():
        return e2e_backup_verification(validated_id)
    return run_verification(project_root, latest_only=latest_only)
