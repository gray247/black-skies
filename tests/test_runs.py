from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services import runs


def test_start_run_creates_ledger(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    project_root = tmp_path / "proj"
    project_root.mkdir()
    metadata = runs.start_run("draft", {"unit_id": "sc_0001"}, project_root=project_root)

    ledger_path = project_root / "history" / "runs" / metadata["run_id"] / "run.json"
    assert "/history/runs/" in str(ledger_path).replace("\\", "/")
    assert "/history/runs/" in str(ledger_path).replace("\\", "/")
    assert ledger_path.exists()
    stored = json.loads(ledger_path.read_text("utf-8"))
    assert stored["status"] == "running"
    assert stored["events"] == []


def test_append_event_updates_ledger(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    project_root = tmp_path / "proj"
    project_root.mkdir()
    metadata = runs.start_run(
        "outline",
        {"project_id": "proj_001"},
        project_root=project_root,
    )
    event = runs.append_event(
        metadata["run_id"], "step", {"detail": "outline"}, project_root=project_root
    )

    ledger_path = project_root / "history" / "runs" / metadata["run_id"] / "run.json"
    assert "/history/runs/" in str(ledger_path).replace("\\", "/")
    stored = json.loads(ledger_path.read_text("utf-8"))
    assert stored["events"][0]["type"] == "step"
    assert event["id"] == 1


def test_finalize_run_marks_completed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    project_root = tmp_path / "proj"
    project_root.mkdir()
    metadata = runs.start_run("critique", {"unit_id": "sc_0002"}, project_root=project_root)
    runs.append_event(
        metadata["run_id"], "step", {"detail": "critique"}, project_root=project_root
    )
    final = runs.finalize_run(metadata["run_id"], result={"summary": "ok"}, project_root=project_root)

    ledger_path = project_root / "history" / "runs" / metadata["run_id"] / "run.json"
    stored = json.loads(ledger_path.read_text("utf-8"))
    assert stored["status"] == "completed"
    assert stored["result"] == {"summary": "ok"}
    assert final["status"] == "completed"
