"""Router for project ZIP restoration."""

from __future__ import annotations

from typing import Any, Optional

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..backup_service import BackupService
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_validation_error
from ..get_logger import get_logger
from ..restore_service import (
    find_latest_zip,
    restore_from_zip,
    resolve_project_root,
    validate_restored_copy,
)
from .dependencies import get_diagnostics, get_settings

logger = get_logger(__name__)

router = APIRouter(prefix="/restore", tags=["restore"])


def _restore_observation(*, claim_scope: str) -> dict[str, Any]:
    return {
        "claim_scope": claim_scope,
        "strongest_authority": "A2",
        "supporting_authorities": ["A1"],
        "historical_only": False,
        "does_not_imply": [
            "current-project-replaced",
            "continuity-correct",
            "recovery-complete",
            "restore-safe",
        ],
    }


def _restore_semantic_context(
    *,
    claim_scope: str,
    restored_copy_materialized: bool,
    browseable_path_available: bool,
    degraded_reasons: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "current_project_files_replaced": False,
        "restored_copy_materialized": restored_copy_materialized,
        "browseable_path_available": browseable_path_available,
        "degraded_reasons": degraded_reasons or [],
        "restore_observation": _restore_observation(claim_scope=claim_scope),
    }


class RestoreRequest(BaseModel):
    """Payload to restore a project from a ZIP archive."""

    projectId: str = Field(..., description="Project identifier")
    zipName: Optional[str] = Field(None, description="Specific ZIP file inside exports/")
    restoreAsNew: bool = Field(..., description="Always create a new project folder")


@router.post("", status_code=status.HTTP_200_OK)
async def restore_project(
    payload: RestoreRequest,
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    try:
        project_root = resolve_project_root(
            payload.projectId,
            str(settings.project_base_dir),
        )
    except ValueError as exc:
        logger.error("Could not resolve project root: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    claim_scope = "restored-copy-materialized-from-zip"
    restore_target_name = payload.zipName or "<latest>"
    if payload.zipName:
        result = await run_in_threadpool(
            restore_from_zip,
            project_root,
            payload.zipName,
            restore_as_new=payload.restoreAsNew,
            project_id=payload.projectId,
            selection_mode="named",
        )
    else:
        backup_service = BackupService(settings=settings, diagnostics=diagnostics)
        latest_backup_name = backup_service.latest_backup_name(project_id=payload.projectId)
        if latest_backup_name:
            claim_scope = "restored-copy-materialized-from-backup-archive"
            restore_target_name = latest_backup_name
            try:
                result = await run_in_threadpool(
                    backup_service.restore_backup,
                    project_id=payload.projectId,
                    backup_name=latest_backup_name,
                    restore_as_new=payload.restoreAsNew,
                    selection_mode="latest",
                )
            except FileNotFoundError as exc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Backup bundle not found for this project",
                ) from exc
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(exc),
                ) from exc
            except OSError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to restore backup bundle",
                ) from exc
        else:
            zip_name = find_latest_zip(project_root)
            if zip_name is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No ZIP archives found for this project",
                )
            restore_target_name = zip_name
            result = await run_in_threadpool(
                restore_from_zip,
                project_root,
                zip_name,
                restore_as_new=payload.restoreAsNew,
                project_id=payload.projectId,
                selection_mode="latest",
            )
    if result.get("status") != "ok":
        logger.error("Restore failed for %s: %s", restore_target_name, result.get("message"))
        raise_validation_error(
            message=result.get("message") or "Restore failed",
            details={
                "operation": result.get("operation"),
                "source": restore_target_name,
                "eligibility_decision": result.get("eligibility_decision"),
                "blocked_reasons": (result.get("eligibility_decision") or {}).get(
                    "blocked_reasons", []
                ),
            },
            diagnostics=diagnostics,
            project_root=None,
        )

    restored_path_value = result.get("restored_path")
    if restored_path_value:
        is_valid, validation_payload = await run_in_threadpool(
            validate_restored_copy,
            settings=settings,
            diagnostics=diagnostics,
            restored_path=restored_path_value,
            operation=dict(result.get("operation") or {}),
        )
        if not is_valid:
            raise_validation_error(
                message=validation_payload["message"],
                details=validation_payload["details"],
                diagnostics=diagnostics,
                project_root=None,
            )
        result["operation"] = validation_payload

    result["restore_observation"] = _restore_observation(claim_scope=claim_scope)
    result["restore_semantic_context"] = _restore_semantic_context(
        claim_scope=claim_scope,
        restored_copy_materialized=result.get("status") == "ok",
        browseable_path_available=bool(restored_path_value),
        degraded_reasons=(result.get("operation") or {}).get("degraded_reasons"),
    )

    return result
