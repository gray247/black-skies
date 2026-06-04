"""Backup API router for long-term project archives."""

from __future__ import annotations

from typing import Any

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field, ValidationError

from ..backup_service import BackupService
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_filesystem_error, raise_validation_error
from ..models._project_id import validate_project_id
from ..restore_service import validate_restored_copy
from .dependencies import get_diagnostics, get_settings

router = APIRouter(prefix="/backups", tags=["backups"])


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


class BackupCreateRequest(BaseModel):
    projectId: str


class BackupRestoreRequest(BaseModel):
    projectId: str
    backupName: str
    restoreAsNew: bool = Field(..., description="Always create a new project folder")


@router.post("", status_code=status.HTTP_200_OK)
async def create_backup(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    try:
        request_model = BackupCreateRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid backup request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = settings.project_base_dir / request_model.projectId
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"projectId": request_model.projectId},
            diagnostics=diagnostics,
            project_root=None,
        )

    backup_service = BackupService(settings=settings, diagnostics=diagnostics)
    try:
        return backup_service.create_backup(project_id=request_model.projectId)
    except OSError as exc:
        raise_filesystem_error(
            exc,
            message="Failed to write backup bundle.",
            details={"projectId": request_model.projectId},
            diagnostics=diagnostics,
            project_root=project_root,
        )


@router.get("", status_code=status.HTTP_200_OK)
async def list_backups(
    projectId: str = Query(..., alias="projectId"),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> list[dict[str, str]]:
    try:
        validated_id = validate_project_id(projectId)
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
            details={"projectId": validated_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    backup_service = BackupService(settings=settings, diagnostics=diagnostics)
    return backup_service.list_backups(project_id=validated_id)


@router.post("/restore", status_code=status.HTTP_200_OK)
async def restore_backup(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    try:
        request_model = BackupRestoreRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid backup restore request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=None,
        )

    backup_service = BackupService(settings=settings, diagnostics=diagnostics)
    try:
        result = await run_in_threadpool(
            backup_service.restore_backup,
            project_id=request_model.projectId,
            backup_name=request_model.backupName,
            restore_as_new=request_model.restoreAsNew,
            selection_mode="named",
        )
        restored_path_value = result.get("restored_path")
        if isinstance(restored_path_value, str):
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
        if result.get("status") != "ok":
            raise_validation_error(
                message=result.get("message") or "Backup restore failed.",
                details={
                    "backupName": request_model.backupName,
                    "projectId": request_model.projectId,
                    "operation": result.get("operation"),
                    "eligibility_decision": result.get("eligibility_decision"),
                    "blocked_reasons": (result.get("eligibility_decision") or {}).get(
                        "blocked_reasons", []
                    ),
                },
                diagnostics=diagnostics,
                project_root=None,
            )
        result["restore_observation"] = _restore_observation(
            claim_scope="restored-copy-materialized-from-backup-archive"
        )
        result["restore_semantic_context"] = _restore_semantic_context(
            claim_scope="restored-copy-materialized-from-backup-archive",
            restored_copy_materialized=result.get("status") == "ok",
            browseable_path_available=bool(result.get("restored_path")),
            degraded_reasons=(result.get("operation") or {}).get("degraded_reasons"),
        )
        return result
    except FileNotFoundError as exc:
        raise_validation_error(
            message="Backup bundle not found.",
            details={"backupName": request_model.backupName},
            diagnostics=diagnostics,
            project_root=None,
        )
    except ValueError as exc:
        raise_validation_error(
            message=str(exc),
            details={"backupName": request_model.backupName},
            diagnostics=diagnostics,
            project_root=None,
        )
    except OSError as exc:
        raise_filesystem_error(
            exc,
            message="Failed to restore backup bundle.",
            details={"backupName": request_model.backupName},
            diagnostics=diagnostics,
            project_root=None,
        )
