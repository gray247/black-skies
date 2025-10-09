"""Unit tests for project budget state loader."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.app import (
    HARD_BUDGET_LIMIT_USD,
    SOFT_BUDGET_LIMIT_USD,
    _load_project_budget_state,
)
from blackskies.services.diagnostics import DiagnosticLogger


@pytest.fixture()
def diagnostics() -> DiagnosticLogger:
    return DiagnosticLogger()


def _write_project_file(project_root: Path, payload: dict[str, object]) -> None:
    project_file = project_root / "project.json"
    project_file.write_text(json.dumps(payload), encoding="utf-8")


def test_load_project_budget_state_sanitizes_currency(
    project_root: Path, diagnostics: DiagnosticLogger
) -> None:
    project_data = {
        "project_id": project_root.name,
        "budget": {
            "soft": "5,000",
            "hard": "€2500",
            "spent_usd": "$1,200.75",
        },
    }
    _write_project_file(project_root, project_data)

    state = _load_project_budget_state(project_root, diagnostics)

    assert state.hard_limit == pytest.approx(2500.0)
    assert state.soft_limit == pytest.approx(2500.0)
    assert state.spent_usd == pytest.approx(1200.75)

    diagnostics_dir = project_root / "history" / "diagnostics"
    assert not diagnostics_dir.exists() or not any(diagnostics_dir.iterdir())


@pytest.fixture()
def project_root(tmp_path: Path) -> Path:
    return tmp_path


def test_load_project_budget_state_defaults_on_invalid_values(
    project_root: Path, diagnostics: DiagnosticLogger
) -> None:
    project_data = {
        "project_id": project_root.name,
        "budget": {
            "soft": "five thousand",
            "hard": "ten euros",
            "spent_usd": "??",
        },
    }
    _write_project_file(project_root, project_data)

    state = _load_project_budget_state(project_root, diagnostics)

    assert state.soft_limit == SOFT_BUDGET_LIMIT_USD
    assert state.hard_limit == HARD_BUDGET_LIMIT_USD
    assert state.spent_usd == 0.0

    diagnostics_dir = project_root / "history" / "diagnostics"
    logs = sorted(diagnostics_dir.glob("*.json"))
    assert len(logs) == 3

    logged_fields = {
        json.loads(path.read_text(encoding="utf-8"))["details"].get("field") for path in logs
    }
    assert {"soft", "hard", "spent_usd"}.issubset(logged_fields)
