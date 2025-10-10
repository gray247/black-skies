"""Wizard snapshot locking endpoint."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import Depends, HTTPException, status
from pydantic import ValidationError

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...http import raise_validation_error
from ...models.wizard import WizardLockSnapshotRequest
from ...persistence import SnapshotPersistence
from ...snapshots import SnapshotIncludesError, SnapshotPersistenceError
from ..dependencies import get_diagnostics, get_settings, get_snapshot_persistence
from . import router
from ...operations.wizard_snapshot import WizardSnapshotService


@router.post("/wizard/lock")
async def lock_wizard_step(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
) -> dict[str, Any]:
    """Create a snapshot when a Wizard step is locked."""

    try:
        request_model = WizardLockSnapshotRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid wizard lock payload.",
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

    label = request_model.label or f"wizard-{request_model.step}"
    include_entries = request_model.includes or None

    snapshot_service = WizardSnapshotService(
        diagnostics=diagnostics,
        snapshot_persistence=snapshot_persistence,
    )

    try:
        result = await snapshot_service.create_lock_snapshot(
            project_root=project_root,
            request=request_model,
            label=label,
            includes=include_entries,
        )
    except SnapshotIncludesError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except SnapshotPersistenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": str(exc),
                "details": exc.details,
            },
        ) from exc

    return result.snapshot


__all__ = ["lock_wizard_step"]
