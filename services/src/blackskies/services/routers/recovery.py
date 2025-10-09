"""Recovery endpoints and helpers."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError, field_validator

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_validation_error
from ..models._project_id import validate_project_id
from ..persistence import SNAPSHOT_ID_PATTERN, SnapshotPersistence, write_json_atomic
from ..utils.paths import to_posix
from .dependencies import (
    get_diagnostics,
    get_recovery_tracker,
    get_settings,
    get_snapshot_persistence,
)
from .shared import utc_timestamp

LOGGER = logging.getLogger(__name__)

__all__ = ["RecoveryRestoreRequest", "RecoveryTracker", "router"]


class RecoveryRestoreRequest(BaseModel):
    project_id: str
    snapshot_id: str | None = None

    @field_validator("snapshot_id")
    @classmethod
    def _validate_snapshot_id(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not SNAPSHOT_ID_PATTERN.fullmatch(value):
            raise ValueError("Snapshot ID must match YYYYMMDDTHHMMSSZ pattern.")
        return value

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)


class RecoveryTracker:
    """Track accept progress and crash recovery markers per project."""

    def __init__(self, settings: ServiceSettings) -> None:
        self._settings = settings

    _VALID_STATUSES: Final[set[str]] = {
        "idle",
        "needs-recovery",
        "accept-in-progress",
    }

    @classmethod
    def _normalise_state(cls, state: dict[str, Any]) -> dict[str, Any]:
        """Ensure persisted recovery state uses the canonical schema."""

        normalised = dict(state)

        status = normalised.get("status")
        if isinstance(status, str):
            candidate = status.strip().lower()
            if candidate in cls._VALID_STATUSES:
                status = candidate
            else:
                status = "idle"
        else:
            status = None

        if status is None:
            legacy = normalised.get("needs_recovery")
            if isinstance(legacy, bool):
                status = "needs-recovery" if legacy else "idle"
            elif isinstance(legacy, str):
                candidate = legacy.strip().lower()
                if candidate in cls._VALID_STATUSES:
                    status = candidate
            if status is None:
                status = "idle"

        normalised["status"] = status
        normalised["needs_recovery"] = status == "needs-recovery"
        return normalised

    def _state_path(self, project_id: str) -> Path:
        project_root = self._settings.project_base_dir / project_id
        return project_root / "history" / "recovery" / "state.json"

    def _read_state(self, project_id: str) -> dict[str, Any]:
        path = self._state_path(project_id)
        if not path.exists():
            return self._normalise_state({"status": "idle"})
        try:
            with path.open("r", encoding="utf-8") as handle:
                raw_state = json.load(handle)
        except json.JSONDecodeError:
            raw_state = {"status": "idle"}

        normalised = self._normalise_state(raw_state)
        if normalised != raw_state:
            write_json_atomic(path, normalised)
        return normalised

    def _write_state(self, project_id: str, state: dict[str, Any]) -> dict[str, Any]:
        path = self._state_path(project_id)
        normalised = self._normalise_state(state)
        write_json_atomic(path, normalised)
        return normalised

    def mark_in_progress(
        self,
        project_id: str,
        *,
        unit_id: str,
        draft_id: str,
        message: str | None = None,
    ) -> dict[str, Any]:
        state = self._read_state(project_id)
        state.update(
            {
                "status": "accept-in-progress",
                "started_at": utc_timestamp(),
                "pending_unit_id": unit_id,
                "draft_id": draft_id,
                "message": message,
            }
        )
        return self._write_state(project_id, state)

    def mark_completed(
        self, project_id: str, snapshot_info: dict[str, Any]
    ) -> dict[str, Any]:
        state = self._read_state(project_id)
        state.update(
            {
                "status": "idle",
                "last_snapshot": snapshot_info,
                "pending_unit_id": None,
                "draft_id": None,
                "started_at": None,
                "message": None,
                "failure_reason": None,
            }
        )
        return self._write_state(project_id, state)

    def mark_needs_recovery(
        self, project_id: str, *, reason: str | None = None
    ) -> dict[str, Any]:
        state = self._read_state(project_id)
        state.update(
            {
                "status": "needs-recovery",
                "failure_reason": reason,
                "updated_at": utc_timestamp(),
            }
        )
        return self._write_state(project_id, state)

    def status(
        self, project_id: str, snapshots: SnapshotPersistence
    ) -> dict[str, Any]:
        state = self._read_state(project_id)
        if state.get("status") == "accept-in-progress":
            state = self.mark_needs_recovery(project_id)
        if not state.get("last_snapshot"):
            latest = snapshots.latest_snapshot(project_id)
            if latest:
                state["last_snapshot"] = latest

        snapshot = state.get("last_snapshot")
        if isinstance(snapshot, dict):
            raw_path = snapshot.get("path")
            if raw_path is not None:
                posix_path = to_posix(raw_path)
                if raw_path != posix_path:
                    snapshot["path"] = posix_path
                    state = self._write_state(project_id, state)
        return state


router = APIRouter(prefix="/draft/recovery", tags=["recovery"])


@router.get("")
async def recovery_status(
    project_id: str,
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    recovery_tracker: "RecoveryTracker" = Depends(get_recovery_tracker),
    snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
) -> dict[str, Any]:
    try:
        project_id = validate_project_id(project_id)
    except ValueError as exc:
        raise_validation_error(
            message="Invalid project identifier.",
            details={"project_id": project_id, "error": str(exc)},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = settings.project_base_dir / project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    state = recovery_tracker.status(project_id, snapshot_persistence)
    return {
        "project_id": project_id,
        "status": state.get("status", "idle"),
        "needs_recovery": state.get("status") == "needs-recovery",
        "pending_unit_id": state.get("pending_unit_id"),
        "draft_id": state.get("draft_id"),
        "started_at": state.get("started_at"),
        "last_snapshot": state.get("last_snapshot"),
        "message": state.get("message"),
        "failure_reason": state.get("failure_reason"),
    }


@router.post("/restore")
async def recovery_restore(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
    recovery_tracker: "RecoveryTracker" = Depends(get_recovery_tracker),
) -> dict[str, Any]:
    try:
        request_model = RecoveryRestoreRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid recovery request.",
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

    snapshot_id = request_model.snapshot_id
    if snapshot_id is None:
        latest = snapshot_persistence.latest_snapshot(request_model.project_id)
        if not latest:
            raise_validation_error(
                message="No snapshots available to restore.",
                details={"project_id": request_model.project_id},
                diagnostics=diagnostics,
                project_root=project_root,
            )
        snapshot_id = latest.get("snapshot_id")
        if not isinstance(snapshot_id, str):
            raise_validation_error(
                message="Latest snapshot metadata is invalid.",
                details={"project_id": request_model.project_id},
                diagnostics=diagnostics,
                project_root=project_root,
            )

    try:
        snapshot_info = snapshot_persistence.restore_snapshot(
            request_model.project_id, snapshot_id
        )
    except FileNotFoundError:
        raise_validation_error(
            message="Snapshot not found.",
            details={
                "project_id": request_model.project_id,
                "snapshot_id": snapshot_id,
            },
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except ValueError:
        raise_validation_error(
            message="Invalid snapshot identifier.",
            details={"snapshot_id": snapshot_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to restore snapshot.",
            details={"snapshot_id": snapshot_id, "error": str(exc)},
        )
        recovery_tracker.mark_needs_recovery(
            request_model.project_id, reason=str(exc)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to restore snapshot.",
                "details": {"snapshot_id": snapshot_id},
            },
        ) from exc

    snapshot_path = Path(snapshot_info["path"])
    try:
        snapshot_info["path"] = to_posix(snapshot_path.relative_to(project_root))
    except ValueError:
        snapshot_info["path"] = to_posix(snapshot_path)

    recovery_tracker.mark_completed(request_model.project_id, snapshot_info)

    return {
        "project_id": request_model.project_id,
        "status": "idle",
        "needs_recovery": False,
        "last_snapshot": snapshot_info,
    }
