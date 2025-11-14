"""Shared helpers for budget classification and persistence."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator, Tuple

from ..budgeting import (
    classify_budget,
    edit_project_budget_state,
    load_project_budget_state,
    persist_project_budget,
    ProjectBudgetState,
)
from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger


@dataclass(slots=True)
class BudgetSummary:
    """Structured view of a budget classification."""

    estimated_usd: float
    status: str
    message: str
    soft_limit_usd: float
    hard_limit_usd: float
    spent_usd: float
    total_after_usd: float

    def as_dict(self) -> dict[str, Any]:
        return {
            "estimated_usd": self.estimated_usd,
            "status": self.status,
            "message": self.message,
            "soft_limit_usd": self.soft_limit_usd,
            "hard_limit_usd": self.hard_limit_usd,
            "spent_usd": self.spent_usd,
            "total_after_usd": self.total_after_usd,
        }


class BudgetService:
    """Centralise budget state loading, classification, and persistence."""

    def __init__(self, *, settings: ServiceSettings, diagnostics: DiagnosticLogger) -> None:
        self._settings = settings
        self._diagnostics = diagnostics

    def load_state(self, project_root: Path) -> ProjectBudgetState:
        """Load budget state for the given project root."""

        return load_project_budget_state(project_root, self._diagnostics)

    def classify(
        self,
        *,
        state: ProjectBudgetState,
        estimated_cost: float,
    ) -> Tuple[str, str, float]:
        """Return classification tuple for the proposed run."""

        return classify_budget(
            estimated_cost,
            soft_limit=state.soft_limit,
            hard_limit=state.hard_limit,
            current_spend=state.spent_usd,
        )

    def build_summary(
        self,
        *,
        state: ProjectBudgetState,
        estimated_cost: float,
        total_after: float,
        spent_override: float | None = None,
        status: str,
        message: str,
    ) -> BudgetSummary:
        """Produce a summary payload for API responses."""

        spent_value = spent_override if spent_override is not None else state.spent_usd
        return BudgetSummary(
            estimated_usd=round(estimated_cost, 2),
            status=status,
            message=message,
            soft_limit_usd=round(state.soft_limit, 2),
            hard_limit_usd=round(state.hard_limit, 2),
            spent_usd=round(spent_value, 2),
            total_after_usd=round(total_after, 2),
        )

    def persist_spend(self, state: ProjectBudgetState, new_spent_usd: float) -> None:
        """Persist the new spend total to the project metadata."""

        persist_project_budget(state, new_spent_usd)

    @contextmanager
    def edit_state(self, project_root: Path) -> Iterator[ProjectBudgetState]:
        """Context manager that locks the budget state for read/write operations."""

        with edit_project_budget_state(project_root, self._diagnostics) as state:
            yield state


__all__ = ["BudgetService", "BudgetSummary"]
