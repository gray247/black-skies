"""Unit tests for the load harness script."""

from __future__ import annotations

import asyncio
import importlib.util
import sys
from pathlib import Path
from types import ModuleType, SimpleNamespace

import pytest


@pytest.fixture(scope="module")
def load_script_module() -> ModuleType:
    """Load ``scripts/load.py`` as a module for direct helper testing."""

    repo_root = Path(__file__).resolve().parents[3]
    module_path = repo_root / "scripts" / "load.py"
    module_name = "tests.load_script_under_test"

    spec = importlib.util.spec_from_file_location(module_name, module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load load script module specification")

    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


def test_load_service_env_enables_synthetic_e2e_mode(load_script_module: ModuleType) -> None:
    """Self-hosted load runs should opt into the existing synthetic e2e path."""

    env = load_script_module._build_started_service_env({"PATH": "C:/bin"})

    assert env["PATH"] == "C:/bin"
    assert env["BLACKSKIES_E2E_MODE"] == "1"
    assert env["BLACKSKIES_E2E_SYNTHETIC_MODE"] == "1"


def test_load_candidate_sha_rejects_mixed_github_checkout(
    load_script_module: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    checked_out_sha = "a" * 40
    monkeypatch.setattr(
        load_script_module.subprocess,
        "check_output",
        lambda *args, **kwargs: checked_out_sha,
    )

    assert load_script_module._resolve_candidate_sha({}) == checked_out_sha
    with pytest.raises(RuntimeError, match="does not match checked-out HEAD"):
        load_script_module._resolve_candidate_sha({"GITHUB_SHA": "b" * 40})


def test_load_service_output_classifies_only_structured_warnings(
    load_script_module: ModuleType,
) -> None:
    assert load_script_module._service_output_is_warning(
        '{"level":"WARNING","message":"slow durable write"}'
    )
    assert not load_script_module._service_output_is_warning(
        '{"level":"INFO","message":"the word WARNING is data"}'
    )
    assert not load_script_module._service_output_is_warning("WARNING in unstructured tool output")


def test_load_service_warning_is_a_blocking_breach(load_script_module: ModuleType) -> None:
    evidence = load_script_module.StartedServiceEvidence(
        warning_lines=['{"level":"WARNING","message":"slow durable write"}']
    )

    assert load_script_module._service_warning_breaches(evidence) == [
        "Harness-owned service emitted 1 structured warning(s)."
    ]
    assert not load_script_module._service_warning_breaches(
        load_script_module.StartedServiceEvidence()
    )


def test_load_profile_defaults_to_one_planned_scene_per_cycle(
    load_script_module: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """Concurrent synthetic workers must not default to the same scene files."""

    requested_limits: list[int] = []
    assigned_scene_ids: list[str] = []

    def _load_scene_ids(project_root: Path, limit: int) -> list[str]:
        assert project_root == tmp_path / "proj_load"
        requested_limits.append(limit)
        return [f"sc_{index:04d}" for index in range(1, limit + 1)]

    async def _run_cycles(config, metrics=None) -> None:
        del metrics
        assigned_scene_ids.extend(config.scene_ids or ())

    monkeypatch.setattr(
        load_script_module.smoke_runner,
        "resolve_project_base_dir",
        lambda value: tmp_path,
    )
    monkeypatch.setattr(load_script_module.smoke_runner, "load_scene_ids", _load_scene_ids)
    monkeypatch.setattr(load_script_module.smoke_runner, "run_cycles", _run_cycles)

    profile = load_script_module.LoadProfile(
        name="focused",
        total_cycles=4,
        concurrency=2,
        timeout=45.0,
        thresholds=load_script_module.Thresholds(
            p95_ms=280.0,
            p99_ms=320.0,
            max_error_rate=0.0,
            max_budget_usd=5.0,
        ),
    )
    args = SimpleNamespace(
        host="127.0.0.1",
        port=8000,
        project_id="proj_load",
        project_base_dir=None,
        scene_ids=None,
        scene_count=None,
        wizard_steps=None,
    )

    asyncio.run(
        load_script_module.run_profile(
            profile,
            args,
            load_script_module.LoadMetrics(),
        )
    )

    assert requested_limits == [4]
    assert assigned_scene_ids == ["sc_0001", "sc_0002", "sc_0003", "sc_0004"]
