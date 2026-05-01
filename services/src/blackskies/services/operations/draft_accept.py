"""Service helpers for draft acceptance workflows."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from time import perf_counter

from fastapi.concurrency import run_in_threadpool

from ..budgeting import (
    ProjectBudgetState,
    derive_accept_unit_cost,
    edit_project_budget_state,
    persist_project_budget,
)
from ..diagnostics import DiagnosticLogger
from ..diff_engine import compute_diff
from ..e2e_mode import allow_e2e_synthetic_mode
from ..models.accept import DraftAcceptRequest
from ..persistence import DraftPersistence, SnapshotPersistence
from ..snapshots import create_accept_snapshot


@dataclass(slots=True)
class DraftAcceptanceResult:
    """Aggregated response data for an accepted draft unit."""

    response: dict[str, Any]
    timings: dict[str, float] = field(default_factory=dict)


class DraftAcceptancePersistenceError(RuntimeError):
    """Raised when persisting the accepted draft scene fails."""

    def __init__(self, *, unit_id: str, error: str, original_exc: OSError | None = None) -> None:
        super().__init__(error)
        self.unit_id = unit_id
        self.error = error
        self.original_exc = original_exc


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

        started_at = perf_counter()
        timings: dict[str, float] = {}
        durable_writes = not allow_e2e_synthetic_mode()

        scene_write_started = perf_counter()
        try:
            await run_in_threadpool(
                self._persistence.write_scene,
                request.project_id,
                updated_front_matter,
                normalized_text,
                durable=durable_writes,
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
                original_exc=exc,
            ) from exc
        timings["audited_chain_write_ms"] = (perf_counter() - scene_write_started) * 1000.0

        diff_started = perf_counter()
        diff_payload = compute_diff(current_normalized, normalized_text)
        timings["diff_ms"] = (perf_counter() - diff_started) * 1000.0

        snapshot_timings: dict[str, float] = {}

        def _capture_snapshot_timings(timing_snapshot: dict[str, float]) -> None:
            snapshot_timings.clear()
            snapshot_timings.update(timing_snapshot)

        snapshot_started = perf_counter()
        snapshot_info = await run_in_threadpool(
            create_accept_snapshot,
            request.project_id,
            request.snapshot_label,
            snapshot_persistence=self._snapshot_persistence,
            recovery_tracker=self._recovery_tracker,
            timing_hook=_capture_snapshot_timings,
            durable=durable_writes,
        )
        timings["snapshot_create_ms"] = (perf_counter() - snapshot_started) * 1000.0
        timings.update(snapshot_timings)

        budget_started = perf_counter()
        def _update_budget() -> tuple[ProjectBudgetState, float, float]:
            with edit_project_budget_state(project_root, self._diagnostics) as budget_state:
                accept_cost = derive_accept_unit_cost(
                    budget_state=budget_state,
                    request=request,
                    normalized_text=normalized_text,
                    project_root=project_root,
                    diagnostics=self._diagnostics,
                )
                new_spent_total = budget_state.spent_usd + accept_cost
                persist_project_budget(
                    budget_state,
                    new_spent_total,
                    durable=durable_writes,
                )
                return budget_state, new_spent_total, accept_cost

        budget_state, new_spent_total, accept_cost = await run_in_threadpool(_update_budget)
        timings["budget_update_ms"] = (perf_counter() - budget_started) * 1000.0

        response_started = perf_counter()

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
        timings["response_assembly_ms"] = (perf_counter() - response_started) * 1000.0
        timings["accept_apply_ms"] = (perf_counter() - started_at) * 1000.0

        return DraftAcceptanceResult(response=response, timings=timings)
