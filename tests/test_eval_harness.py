"""Tests for the offline eval harness CLI."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Callable

import pytest

from black_skies import runs
from black_skies.eval import EvalTask, EvalTaskFlow
from black_skies.tools.registry import ToolRegistry
from scripts import eval as eval_cli


def _make_runner(success: bool) -> Callable[[EvalTask], tuple[bool, dict[str, object]]]:
    def _runner(
        task: EvalTask, *, registry: ToolRegistry, run_id: str
    ) -> tuple[bool, dict[str, object]]:
        assert registry is not None
        assert run_id
        return success, {"task": task.task_id}

    return _runner


@pytest.mark.eval
def test_eval_harness_generates_report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(runs, "RUNS_ROOT", runs_root, raising=False)

    html_path = tmp_path / "out" / "eval.html"
    json_path = tmp_path / "out" / "eval.json"

    monkeypatch.setitem(eval_cli.FLOW_RUNNERS, EvalTaskFlow.WIZARD, _make_runner(True))
    monkeypatch.setitem(eval_cli.FLOW_RUNNERS, EvalTaskFlow.DRAFT, _make_runner(True))
    monkeypatch.setitem(eval_cli.FLOW_RUNNERS, EvalTaskFlow.CRITIQUE, _make_runner(True))

    exit_code = eval_cli.main(["--html", str(html_path), "--json", str(json_path)])

    assert exit_code == 0

    payload = json.loads(json_path.read_text(encoding="utf-8"))
    report = payload["report"]
    assert report["metrics"]["total"] == len(report["results"])
    assert report["metrics"]["passed"] == report["metrics"]["total"]
    assert Path(html_path).read_text(encoding="utf-8").startswith("<!DOCTYPE html>")

    ledgers = list(runs_root.glob("*/run.json"))
    assert len(ledgers) == 1
    ledger = json.loads(ledgers[0].read_text(encoding="utf-8"))
    assert ledger["status"] == "completed"


@pytest.mark.eval
def test_eval_harness_threshold_failure(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(runs, "RUNS_ROOT", runs_root, raising=False)

    html_path = tmp_path / "out" / "eval.html"
    json_path = tmp_path / "out" / "eval.json"

    monkeypatch.setitem(eval_cli.FLOW_RUNNERS, EvalTaskFlow.WIZARD, _make_runner(True))
    monkeypatch.setitem(eval_cli.FLOW_RUNNERS, EvalTaskFlow.DRAFT, _make_runner(False))
    monkeypatch.setitem(eval_cli.FLOW_RUNNERS, EvalTaskFlow.CRITIQUE, _make_runner(False))

    exit_code = eval_cli.main(
        [
            "--html",
            str(html_path),
            "--json",
            str(json_path),
            "--fail-under-pass-rate",
            "1.0",
        ]
    )

    assert exit_code == 1

    payload = json.loads(json_path.read_text(encoding="utf-8"))
    assert payload["regressions"]
    report = payload["report"]
    assert report["metrics"]["failed"] >= 1

    ledgers = list(runs_root.glob("*/run.json"))
    assert len(ledgers) == 1
    ledger = json.loads(ledgers[0].read_text(encoding="utf-8"))
    assert ledger["status"] == "failed"
