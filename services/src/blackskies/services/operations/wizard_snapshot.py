"""Service layer for wizard snapshot orchestration."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi.concurrency import run_in_threadpool

from ..diagnostics import DiagnosticLogger
from ..models.wizard import WizardLockSnapshotRequest
from ..snapshots import create_wizard_lock_snapshot


@dataclass(slots=True)
class WizardSnapshotResult:
    """Response payload for wizard snapshot operations."""

    snapshot: dict[str, Any]


class WizardSnapshotService:
    """Create wizard lock snapshots while recording diagnostics."""

    def __init__(
        self,
        *,
        diagnostics: DiagnosticLogger,
        snapshot_persistence,
    ) -> None:
        self._diagnostics = diagnostics
        self._snapshot_persistence = snapshot_persistence

    async def create_lock_snapshot(
        self,
        *,
        project_root: Path,
        request: WizardLockSnapshotRequest,
        label: str,
        includes: list[str] | None,
    ) -> WizardSnapshotResult:
        """Persist a wizard lock snapshot and return metadata."""

        snapshot_info = await run_in_threadpool(
            create_wizard_lock_snapshot,
            project_id=request.project_id,
            step=request.step,
            label=label,
            includes=includes,
            project_root=project_root,
            diagnostics=self._diagnostics,
            snapshot_persistence=self._snapshot_persistence,
        )

        return WizardSnapshotResult(snapshot=snapshot_info)
