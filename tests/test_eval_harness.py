import json
from pathlib import Path
from typing import Callable

import pytest

from blackskies.services import runs
from blackskies.services.eval import EvalTask, EvalTaskFlow
from blackskies.services.tools.registry import ToolRegistry
from scripts import check_slo, eval as eval_cli


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
    assert "result" in ledger
    metrics = ledger["result"]["metrics"]
    slo = ledger["result"]["slo"]
    assert metrics["pass_rate"] == pytest.approx(1.0)
    assert metrics["error_budget_remaining"] == pytest.approx(0.0)
    assert metrics["error_budget_consumed"] == pytest.approx(0.0)
    assert "p99_latency_ms" in metrics
    assert metrics["p99_latency_ms"] >= 0.0
    assert slo["status"] == "ok"
    assert slo["error_budget_remaining"] == pytest.approx(0.0)
    assert slo["error_budget_consumed"] == pytest.approx(0.0)
    assert not slo["violations"]
    assert ledger["events"]
    assert ledger["events"][-1]["type"] == "eval.metrics"
    assert check_slo.main([str(ledgers[0])]) == 0


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
    assert "result" in ledger
    metrics = ledger["result"]["metrics"]
    slo = ledger["result"]["slo"]
    pass_rate = report["metrics"]["pass_rate"]
    assert metrics["pass_rate"] == pytest.approx(pass_rate)
    assert metrics["error_budget_remaining"] == pytest.approx(0.0)
    assert metrics["error_budget_consumed"] == pytest.approx(1.0 - pass_rate)
    assert "p99_latency_ms" in metrics
    assert metrics["p99_latency_ms"] >= 0.0
    assert slo["status"] == "breached"
    assert slo["error_budget_remaining"] == pytest.approx(0.0)
    assert slo["error_budget_consumed"] == pytest.approx(1.0 - pass_rate)
    assert slo["violations"] == payload["regressions"]
    assert ledger["events"]
    assert ledger["events"][-1]["type"] == "eval.metrics"
    assert check_slo.main([str(ledgers[0])]) == 1
