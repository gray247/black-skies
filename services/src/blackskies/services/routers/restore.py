"""Router for project ZIP restoration."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_validation_error
from ..integrity import validate_project
from ..get_logger import get_logger
from ..restore_service import (
    find_latest_zip,
    restore_from_zip,
    resolve_project_root,
)
from .dependencies import get_diagnostics, get_settings

logger = get_logger(__name__)

router = APIRouter(prefix="/restore", tags=["restore"])


class RestoreRequest(BaseModel):
    """Payload to restore a project from a ZIP archive."""

    projectId: str = Field(..., description="Project identifier")
    zipName: Optional[str] = Field(None, description="Specific ZIP file inside exports/")
    restoreAsNew: Optional[bool] = Field(True, description="Always create a new project folder")


@router.post("", status_code=status.HTTP_200_OK)
async def restore_project(
    payload: RestoreRequest,
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    try:
        project_root = resolve_project_root(
            payload.projectId, str(settings.project_base_dir),
        )
    except ValueError as exc:
        logger.error("Could not resolve project root: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if payload.zipName:
        zip_name = payload.zipName
    else:
        zip_name = find_latest_zip(project_root)
        if zip_name is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No ZIP archives found for this project",
            )

    result = restore_from_zip(project_root, zip_name)
    if result.get("status") != "ok":
        logger.error("Restore failed for %s: %s", zip_name, result.get("message"))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message") or "Restore failed",
        )

    restored_path_value = result.get("restored_path")
    if restored_path_value:
        restored_path = Path(restored_path_value)
        integrity = validate_project(settings, project_root=restored_path)
        if not integrity.is_ok:
            diagnostics.log(
                restored_path,
                code="INTEGRITY_POST_RESTORE",
                message="Restored project failed integrity validation.",
                details={"errors": integrity.errors, "warnings": integrity.warnings},
            )
            raise_validation_error(
                message="Restored project failed integrity validation.",
                details={"errors": integrity.errors, "warnings": integrity.warnings},
                diagnostics=diagnostics,
                project_root=restored_path,
            )

    return result
