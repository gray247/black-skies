"""Service helpers for draft acceptance workflows."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from fastapi.concurrency import run_in_threadpool

from ..budgeting import (
    derive_accept_unit_cost,
    load_project_budget_state,
    persist_project_budget,
)
from ..diagnostics import DiagnosticLogger
from ..diff_engine import compute_diff
from ..models.accept import DraftAcceptRequest
from ..persistence import DraftPersistence, SnapshotPersistence
from ..snapshots import create_accept_snapshot


@dataclass(slots=True)
class DraftAcceptanceResult:
    """Aggregated response data for an accepted draft unit."""

    response: dict[str, Any]


class DraftAcceptancePersistenceError(RuntimeError):
    """Raised when persisting the accepted draft scene fails."""

    def __init__(self, *, unit_id: str, error: str) -> None:
        super().__init__(error)
        self.unit_id = unit_id
        self.error = error


class DraftAcceptService:
    """Coordinate scene persistence, snapshotting, and budget updates for accepts."""

    def __init__(
        self,
        *,
        settings,
        diagnostics: DiagnosticLogger,
        snapshot_persistence: SnapshotPersistence,
        recovery_tracker,
    ) -> None:
        self._diagnostics = diagnostics
        self._snapshot_persistence = snapshot_persistence
        self._recovery_tracker = recovery_tracker
        self._persistence = DraftPersistence(settings=settings)

    async def accept(
        self,
        *,
        request: DraftAcceptRequest,
        project_root: Path,
        updated_front_matter: dict[str, Any],
        normalized_text: str,
        current_normalized: str,
    ) -> DraftAcceptanceResult:
        """Persist the accepted draft, snapshot history, and update budgets."""

        try:
            await run_in_threadpool(
                self._persistence.write_scene,
                request.project_id,
                updated_front_matter,
                normalized_text,
            )
        except OSError as exc:
            self._diagnostics.log(
                project_root,
                code="INTERNAL",
                message="Failed to persist accepted scene.",
                details={"unit_id": request.unit_id, "error": str(exc)},
            )
            raise DraftAcceptancePersistenceError(
                unit_id=request.unit_id,
                error=str(exc),
            ) from exc

        diff_payload = compute_diff(current_normalized, normalized_text)

        snapshot_info = await run_in_threadpool(
            create_accept_snapshot,
            request.project_id,
            request.snapshot_label,
            snapshot_persistence=self._snapshot_persistence,
            recovery_tracker=self._recovery_tracker,
        )

        budget_state = load_project_budget_state(project_root, self._diagnostics)
        accept_cost = derive_accept_unit_cost(
            budget_state=budget_state,
            request=request,
            normalized_text=normalized_text,
            project_root=project_root,
            diagnostics=self._diagnostics,
        )
        new_spent_total = budget_state.spent_usd + accept_cost
        await run_in_threadpool(persist_project_budget, budget_state, new_spent_total)

        response = {
            "project_id": request.project_id,
            "unit_id": request.unit_id,
            "status": "accepted",
            "snapshot": snapshot_info,
            "diff": {
                "added": diff_payload.added,
                "removed": diff_payload.removed,
                "changed": diff_payload.changed,
                "anchors": diff_payload.anchors,
            },
            "budget": {
                "soft_limit_usd": round(budget_state.soft_limit, 2),
                "hard_limit_usd": round(budget_state.hard_limit, 2),
                "spent_usd": round(new_spent_total, 2),
            },
            "schema_version": "DraftAcceptResult v1",
        }

        return DraftAcceptanceResult(response=response)
