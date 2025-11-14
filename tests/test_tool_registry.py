from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import List

import pytest

from blackskies.services import runs
from blackskies.services.tools.registry import ToolRegistry


@pytest.fixture
def checklist_file(tmp_path: Path) -> Path:
    content = """
- [AI] Convert raw bullets into scene cards (sc-001, sc-002…)
- [AI] Suggest scene order (chronological vs. shuffled/flashbacks)
- [AI] Pacing critique (where to slow/speed) → [H] can override
- [AI] Auto-add expansion suggestions to scene cards (toggle)
- [H] Chapter break style (cliffhanger vs. resolution)
"""
    path = tmp_path / "decision_checklist.md"
    path.write_text(content.strip(), encoding="utf-8")
    return path


@pytest.fixture
def run_factory(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    project_root = tmp_path / "proj"
    project_root.mkdir()
    runs_root = project_root / "history" / "runs"
    monkeypatch.setattr(runs, "RUNS_ROOT", runs_root, raising=False)

    def _start(kind: str = "test", params: dict | None = None):
        return runs.start_run(kind, params or {}, project_root=project_root)

    return _start


def _load_last_event(run_id: str) -> dict:
    ledger_path = runs.RUNS_ROOT / run_id / "run.json"
    data = json.loads(ledger_path.read_text("utf-8"))
    return data["events"][-1]


class _RecordHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.records: List[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord) -> None:  # pragma: no cover - trivial
        self.records.append(record)


def _capture_registry_logs() -> tuple[_RecordHandler, logging.Logger]:
    logger = logging.getLogger("blackskies.services.tool_registry")
    handler = _RecordHandler()
    logger.addHandler(handler)
    return handler, logger


def _release_registry_logs(handler: _RecordHandler, logger: logging.Logger) -> None:
    logger.removeHandler(handler)


def test_registry_allows_ai_item_by_default(checklist_file: Path, run_factory):
    registry = ToolRegistry(
        project_metadata={"project_id": "proj_test"}, checklist_path=checklist_file
    )
    run = run_factory()

    decision = registry.check_permission(
        "summarizer", run_id=run["run_id"], metadata={"unit": "sc-001"}
    )

    assert decision.allowed is True
    assert decision.source == "checklist.ai"
    event = _load_last_event(run["run_id"])
    assert event["type"] == "tool.approved"
    assert event["payload"]["tool"] == "summarizer"
    assert event["payload"]["context"] == {"unit": "sc-001"}


def test_registry_denies_via_project_override(checklist_file: Path, run_factory):
    registry = ToolRegistry(
        project_metadata={"project_id": "proj_test", "tools": {"deny": ["summarizer"]}},
        checklist_path=checklist_file,
    )
    run = run_factory()

    handler, logger = _capture_registry_logs()
    try:
        registry.check_permission("summarizer", run_id=run["run_id"])
    finally:
        _release_registry_logs(handler, logger)

    event = _load_last_event(run["run_id"])
    assert event["type"] == "tool.denied"
    assert event["payload"]["tool"] == "summarizer"
    assert any(record.getMessage() == "tool.denied" for record in handler.records)
    assert any(
        getattr(record, "extra_payload", {}).get("tool") == "summarizer"
        for record in handler.records
    )


def test_registry_denies_human_only_item(checklist_file: Path, run_factory):
    registry = ToolRegistry(
        project_metadata={"project_id": "proj_test"}, checklist_path=checklist_file
    )
    run = run_factory()

    handler, logger = _capture_registry_logs()
    try:
        registry.check_permission(
            "template_renderer",
            run_id=run["run_id"],
            checklist_item="Chapter break style (cliffhanger vs. resolution)",
        )
    finally:
        _release_registry_logs(handler, logger)

    event = _load_last_event(run["run_id"])
    assert event["type"] == "tool.denied"
    assert event["payload"]["checklist_item"].startswith("Chapter break style")
    assert any(record.getMessage() == "tool.denied" for record in handler.records)
