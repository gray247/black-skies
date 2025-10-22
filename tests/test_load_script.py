"""Unit tests for the load testing harness in ``scripts/load.py``."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pytest

import sys

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from scripts import check_slo, load


def test_load_profile_data_handles_missing_file(tmp_path: Path) -> None:
    path = tmp_path / "missing.yaml"
    assert load.load_profile_data(path) == {}


def test_load_profile_data_parses_profiles_section(tmp_path: Path) -> None:
    path = tmp_path / "profiles.yaml"
    path.write_text(
        (
            "profiles:\n"
            "  default:\n"
            "    total_cycles: 6\n"
            "    thresholds:\n"
            "      p95_ms: 1200\n"
        ),
        encoding="utf-8",
    )
    profiles = load.load_profile_data(path)
    assert profiles["default"]["total_cycles"] == 6


def test_load_profile_data_rejects_invalid_format(tmp_path: Path) -> None:
    path = tmp_path / "invalid.yaml"
    path.write_text("- just\n- a\n- list\n", encoding="utf-8")
    with pytest.raises(ValueError):
        load.load_profile_data(path)


def test_resolve_profile_returns_copy() -> None:
    profiles = {"demo": {"total_cycles": 4}}
    resolved = load.resolve_profile("demo", profiles)
    assert resolved == {"total_cycles": 4}
    assert resolved is not profiles["demo"]


def test_resolve_profile_rejects_non_mapping() -> None:
    profiles: dict[str, Any] = {"demo": ["not", "a", "mapping"]}
    with pytest.raises(TypeError):
        load.resolve_profile("demo", profiles)


def test_build_profile_applies_overrides() -> None:
    args = argparse.Namespace(
        total_cycles=10,
        concurrency=4,
        timeout=12.5,
        warmup_cycles=1,
        p95_ms=90.0,
        p99_ms=140.0,
        max_error_rate=0.2,
        max_budget_usd=7.5,
    )
    raw = {
        "total_cycles": 6,
        "concurrency": 2,
        "timeout": 30.0,
        "warmup_cycles": 0,
        "thresholds": {
            "p95_ms": 150.0,
            "p99_ms": 240.0,
            "max_error_rate": 0.05,
            "max_budget_usd": 3.0,
        },
    }

    profile = load.build_profile("demo", raw, args)
    assert profile.total_cycles == 10
    assert profile.concurrency == 4
    assert profile.timeout == pytest.approx(12.5)
    assert profile.warmup_cycles == 1
    assert profile.thresholds.p95_ms == pytest.approx(90.0)
    assert profile.thresholds.p99_ms == pytest.approx(140.0)
    assert profile.thresholds.max_error_rate == pytest.approx(0.2)
    assert profile.thresholds.max_budget_usd == pytest.approx(7.5)


def test_build_profile_validates_positive_concurrency() -> None:
    args = argparse.Namespace(
        total_cycles=None,
        concurrency=None,
        timeout=None,
        warmup_cycles=None,
        p95_ms=None,
        p99_ms=None,
        max_error_rate=None,
        max_budget_usd=None,
    )
    raw = {
        "total_cycles": 6,
        "concurrency": 0,
        "thresholds": {},
    }
    with pytest.raises(ValueError):
        load.build_profile("demo", raw, args)


def test_distribute_cycles_balances_remainder() -> None:
    assert list(load.distribute_cycles(10, 3)) == [4, 3, 3]


def test_load_metrics_computations() -> None:
    metrics = load.LoadMetrics()
    metrics.record_request(method="GET", path="/a", status=200, elapsed_ms=100.0)
    metrics.record_request(method="GET", path="/a", status=500, elapsed_ms=300.0)
    metrics.record_request(method="POST", path="/b", status=200, elapsed_ms=50.0)
    metrics.record_budget(estimated_cost_usd=0.25)
    metrics.record_budget(estimated_cost_usd=0.5)

    assert metrics.total_requests == 3
    assert metrics.error_count == 1
    assert metrics.error_rate == pytest.approx(1 / 3)
    assert metrics.total_budget == pytest.approx(0.75)
    assert metrics.percentile(95.0) == pytest.approx(280.0)
    assert metrics.average_latency() == pytest.approx(150.0)

    per_path = metrics.per_path_summary()
    assert set(per_path.keys()) == {"/a", "/b"}
    assert per_path["/a"]["count"] == 2
    assert per_path["/a"]["error_count"] == 1
    assert per_path["/b"]["p95_ms"] == pytest.approx(50.0)


def test_evaluate_thresholds_detects_violations() -> None:
    metrics = load.LoadMetrics()
    metrics.requests = [
        {"method": "GET", "path": "/a", "status": 200, "elapsed_ms": 100.0},
        {"method": "GET", "path": "/a", "status": 500, "elapsed_ms": 3000.0},
    ]
    metrics.budgets = [3.5]

    thresholds = load.Thresholds(
        p95_ms=150.0,
        p99_ms=200.0,
        max_error_rate=0.1,
        max_budget_usd=2.0,
    )

    reasons = load.evaluate_thresholds(metrics, thresholds)
    assert any("P95 latency" in reason for reason in reasons)
    assert any("P99 latency" in reason for reason in reasons)
    assert any("Error rate" in reason for reason in reasons)
    assert any("Estimated budget" in reason for reason in reasons)


def test_evaluate_thresholds_handles_empty_metrics() -> None:
    thresholds = load.Thresholds(100.0, 200.0, 0.05, 1.0)
    reasons = load.evaluate_thresholds(load.LoadMetrics(), thresholds)
    assert reasons == ["No requests were recorded during the load test."]


def test_build_result_payload_sets_slo_status() -> None:
    metrics = load.LoadMetrics()
    metrics.requests = [{"method": "GET", "path": "/a", "status": 200, "elapsed_ms": 120.0}]
    metrics.budgets = [1.25]

    thresholds = load.Thresholds(100.0, 200.0, 0.1, 5.0)
    payload = load.build_result_payload(metrics, thresholds, breaches=["p95 exceeded"])
    assert payload["slo"]["status"] == "breached"
    assert payload["metrics"]["total_requests"] == 1
    assert payload["thresholds"]["p99_ms"] == pytest.approx(200.0)


def test_main_success_path(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    profile_path = tmp_path / "profiles.yaml"
    profile_path.write_text(
        (
            "profiles:\n"
            "  demo:\n"
            "    total_cycles: 2\n"
            "    concurrency: 1\n"
            "    warmup_cycles: 0\n"
            "    thresholds:\n"
            "      p95_ms: 500\n"
            "      p99_ms: 900\n"
            "      max_error_rate: 0.2\n"
            "      max_budget_usd: 5.0\n"
        ),
        encoding="utf-8",
    )

    async def fake_run_profile(
        profile: load.LoadProfile, args: argparse.Namespace, metrics: load.LoadMetrics
    ) -> None:
        metrics.record_request(method="GET", path="/healthz", status=200, elapsed_ms=120.0)
        metrics.record_budget(estimated_cost_usd=0.5)

    monkeypatch.setattr(load, "run_profile", fake_run_profile)
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(load.runs, "RUNS_ROOT", runs_root)
    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))

    argv = [
        "--profile",
        "demo",
        "--profiles-path",
        str(profile_path),
        "--project-base-dir",
        str(tmp_path),
        "--log-level",
        "DEBUG",
    ]
    exit_code = load.main(argv)
    assert exit_code == 0

    run_ledgers = list(runs_root.glob("load-test-*/run.json"))
    assert run_ledgers, "expected a run ledger to be created"
    ledger_path = run_ledgers[0]
    ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    assert ledger["status"] == "completed"
    slo = ledger["result"]["slo"]
    assert slo["status"] == "ok"
    assert slo["violations"] == []
    assert check_slo.main([str(ledger_path), "--require", "ok"]) == 0


def test_main_handles_execution_failure(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    profile_path = tmp_path / "profiles.yaml"
    profile_path.write_text(
        (
            "profiles:\n"
            "  demo:\n"
            "    thresholds: {}\n"
        ),
        encoding="utf-8",
    )

    async def failing_run_profile(*_: Any, **__: Any) -> None:
        raise RuntimeError("boom")

    monkeypatch.setattr(load, "run_profile", failing_run_profile)
    runs_root = tmp_path / "runs"
    monkeypatch.setattr(load.runs, "RUNS_ROOT", runs_root)
    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))

    exit_code = load.main(
        [
            "--profile",
            "demo",
            "--profiles-path",
            str(profile_path),
            "--project-base-dir",
            str(tmp_path),
        ]
    )
    assert exit_code == 1

    ledgers = list(runs_root.glob("load-test-*/run.json"))
    assert ledgers, "expected a failed run ledger"
    ledger = json.loads(ledgers[0].read_text(encoding="utf-8"))
    assert ledger["status"] == "failed"
    assert ledger["result"]["error"] == "boom"
