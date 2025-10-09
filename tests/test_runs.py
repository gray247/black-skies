from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services import runs


def test_start_run_creates_ledger(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(runs, "RUNS_ROOT", runs_root, raising=False)
    metadata = runs.start_run("draft", {"unit_id": "sc_0001"})

    ledger_path = runs_root / metadata["run_id"] / "run.json"
    assert ledger_path.exists()
    stored = json.loads(ledger_path.read_text("utf-8"))
    assert stored["status"] == "running"
    assert stored["events"] == []


def test_append_event_updates_ledger(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(runs, "RUNS_ROOT", runs_root, raising=False)
    metadata = runs.start_run("outline", {"project_id": "proj_001"})
    event = runs.append_event(metadata["run_id"], "step", {"detail": "outline"})

    ledger_path = runs_root / metadata["run_id"] / "run.json"
    stored = json.loads(ledger_path.read_text("utf-8"))
    assert stored["events"][0]["type"] == "step"
    assert event["id"] == 1


def test_finalize_run_marks_completed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(runs, "RUNS_ROOT", runs_root, raising=False)
    metadata = runs.start_run("critique", {"unit_id": "sc_0002"})
    runs.append_event(metadata["run_id"], "step", {"detail": "critique"})
    final = runs.finalize_run(metadata["run_id"], result={"summary": "ok"})

    ledger_path = runs_root / metadata["run_id"] / "run.json"
    stored = json.loads(ledger_path.read_text("utf-8"))
    assert stored["status"] == "completed"
    assert stored["result"] == {"summary": "ok"}
    assert final["status"] == "completed"
