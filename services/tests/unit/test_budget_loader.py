"""Unit tests for project budget state helpers."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.budgeting import (
    ProjectBudgetState,
    load_project_budget_state,
    persist_project_budget as _persist_project_budget,
)
from blackskies.services.constants import (
    DEFAULT_HARD_BUDGET_LIMIT_USD,
    DEFAULT_SOFT_BUDGET_LIMIT_USD,
)
from blackskies.services.diagnostics import DiagnosticLogger


@pytest.fixture()
def diagnostics() -> DiagnosticLogger:
    return DiagnosticLogger()


@pytest.fixture()
def project_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_project_file(project_root: Path, payload: dict[str, object]) -> None:
    project_file = project_root / "project.json"
    project_file.write_text(json.dumps(payload), encoding="utf-8")


def _read_project_payload(project_root: Path) -> dict[str, object]:
    project_file = project_root / "project.json"
    return json.loads(project_file.read_text(encoding="utf-8"))


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

    state = load_project_budget_state(project_root, diagnostics)

    assert state.hard_limit == pytest.approx(2500.0)
    assert state.soft_limit == pytest.approx(2500.0)
    assert state.spent_usd == pytest.approx(1200.75)

    diagnostics_dir = project_root / "history" / "diagnostics"
    assert not diagnostics_dir.exists() or not any(diagnostics_dir.iterdir())


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

    state = load_project_budget_state(project_root, diagnostics)

    assert state.soft_limit == DEFAULT_SOFT_BUDGET_LIMIT_USD
    assert state.hard_limit == DEFAULT_HARD_BUDGET_LIMIT_USD
    assert state.spent_usd == 0.0

    diagnostics_dir = project_root / "history" / "diagnostics"
    logs = sorted(diagnostics_dir.glob("*.json"))
    assert len(logs) == 3

    logged_fields = {
        json.loads(path.read_text(encoding="utf-8"))["details"].get("field") for path in logs
    }
    assert {"soft", "hard", "spent_usd"}.issubset(logged_fields)


def test_persist_project_budget_rounds_and_clamps(tmp_path: Path) -> None:
    project_root = tmp_path
    state = ProjectBudgetState(
        project_root=project_root,
        metadata={"project_id": "proj", "budget": {}},
        soft_limit=5.6789,
        hard_limit=10.234,
        spent_usd=1.0,
        project_path=project_root / "project.json",
    )

    _persist_project_budget(state, new_spent_usd=-3.14159)

    payload = _read_project_payload(project_root)
    budget = payload["budget"]

    assert budget["soft"] == pytest.approx(5.68)
    assert budget["hard"] == pytest.approx(10.23)
    assert budget["spent_usd"] == pytest.approx(0.0)
    assert payload["project_id"] == "proj"


def test_persist_project_budget_updates_spend(tmp_path: Path) -> None:
    project_root = tmp_path
    state = ProjectBudgetState(
        project_root=project_root,
        metadata={"project_id": "proj", "budget": {"soft": 4.0, "hard": 9.0}},
        soft_limit=4.0,
        hard_limit=9.0,
        spent_usd=4.0,
        project_path=project_root / "project.json",
    )

    _persist_project_budget(state, new_spent_usd=12.345)

    payload = _read_project_payload(project_root)
    budget = payload["budget"]
    assert budget["soft"] == pytest.approx(4.0)
    assert budget["hard"] == pytest.approx(9.0)
    assert budget["spent_usd"] == pytest.approx(12.35)
    assert payload["project_id"] == "proj"

    assert (project_root / "project.json").exists()
