"""Validation tests for project metadata models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from blackskies.services.models.project import ProjectBudget


def test_project_budget_rejects_soft_above_hard() -> None:
    with pytest.raises(ValidationError) as exc:
        ProjectBudget(soft=15.0, hard=10.0, spent_usd=5.0)

    assert "Soft limit must not exceed hard limit." in str(exc.value)


def test_project_budget_rejects_spent_above_hard() -> None:
    with pytest.raises(ValidationError) as exc:
        ProjectBudget(soft=10.0, hard=12.0, spent_usd=15.0)

    assert "Spent total exceeds hard limit." in str(exc.value)

