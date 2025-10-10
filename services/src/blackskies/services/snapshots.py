"""Snapshot orchestration helpers for draft workflows."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Mapping

from .diagnostics import DiagnosticLogger
from .persistence import SnapshotPersistence
from .routers.recovery import RecoveryTracker

LOGGER = logging.getLogger(__name__)


class SnapshotOperationError(RuntimeError):
    """Base error raised when snapshot orchestration fails."""

    def __init__(self, message: str, *, details: Mapping[str, Any] | None = None) -> None:
        super().__init__(message)
        self.details = dict(details or {})


class SnapshotIncludesError(SnapshotOperationError):
    """Raised when include filters are invalid for a snapshot."""


class SnapshotPersistenceError(SnapshotOperationError):
    """Raised when snapshot persistence fails."""


def create_accept_snapshot(
    project_id: str,
    snapshot_label: str | None,
    *,
    snapshot_persistence: SnapshotPersistence,
    recovery_tracker: RecoveryTracker,
) -> dict[str, Any]:
    """Create a snapshot for an accepted draft unit and record recovery state."""

    snapshot_info = snapshot_persistence.create_snapshot(project_id, label=snapshot_label)
    recovery_tracker.mark_completed(project_id, snapshot_info)
    LOGGER.debug("Created accept snapshot", extra={"project_id": project_id, **snapshot_info})
    return snapshot_info


def create_wizard_lock_snapshot(
    *,
    project_id: str,
    step: str,
    label: str,
    includes: list[str] | None,
    project_root: Path,
    diagnostics: DiagnosticLogger,
    snapshot_persistence: SnapshotPersistence,
) -> dict[str, Any]:
    """Create a snapshot for a wizard lock action with diagnostics."""

    try:
        snapshot_info = snapshot_persistence.create_snapshot(
            project_id,
            label=label,
            include_entries=includes,
        )
    except ValueError as exc:
        raise SnapshotIncludesError(
            "Invalid snapshot includes.",
            details={"project_id": project_id, "includes": includes or [], "error": str(exc)},
        ) from exc
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to create wizard snapshot.",
            details={"step": step, "error": str(exc)},
        )
        raise SnapshotPersistenceError(
            "Failed to create wizard snapshot.",
            details={"project_id": project_id, "step": step},
        ) from exc

    diagnostics.log(
        project_root,
        code="SNAPSHOT",
        message=f"Wizard step {step} locked.",
        details={"step": step, "snapshot_id": snapshot_info.get("snapshot_id")},
    )
    LOGGER.debug(
        "Wizard lock snapshot created",
        extra={"project_id": project_id, "step": step, **snapshot_info},
    )
    return snapshot_info


__all__ = [
    "SnapshotIncludesError",
    "SnapshotOperationError",
    "SnapshotPersistenceError",
    "create_accept_snapshot",
    "create_wizard_lock_snapshot",
]
