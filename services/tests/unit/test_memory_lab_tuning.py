from __future__ import annotations

from pathlib import Path

from blackskies.services.memory_lab.tuning import (
    Phase6ATuningReport,
    ReplayScenario,
    ScenarioSweepMetrics,
    StopConditionEvaluation,
    ThresholdSweepConfig,
    TRUST_BAND_CONTESTED_USEFUL,
    TRUST_BAND_STABLE,
    TRUST_BAND_UNSTABLE,
    classify_trust_band,
    evaluate_stop_condition,
    run_phase6a_threshold_sweep,
    write_phase6a_artifacts,
)


def _metrics(
    *,
    scenario_id: str,
    winner_drift: int = 0,
    alternate_drift: int = 0,
    diagnostics_drift: int = 0,
    p95_resolution_ms: float = 5.0,
    p95_slot_ms: float = 1.0,
    p95_prompt_growth: float = 0.05,
    completeness: float = 1.0,
) -> ScenarioSweepMetrics:
    return ScenarioSweepMetrics(
        scenario_id=scenario_id,
        chapter_size="short",
        contested_density="low",
        runs=2,
        winner_drift_count=winner_drift,
        alternate_drift_count=alternate_drift,
        deterministic_diagnostics_drift_count=diagnostics_drift,
        p50_resolution_ms=2.0,
        p95_resolution_ms=p95_resolution_ms,
        p99_resolution_ms=6.0,
        p95_slot_selection_ms=p95_slot_ms,
        p95_prompt_growth=p95_prompt_growth,
        diagnostics_completeness_rate=completeness,
        trust_band_counts={
            TRUST_BAND_STABLE: 1,
            TRUST_BAND_CONTESTED_USEFUL: 1,
            TRUST_BAND_UNSTABLE: 0,
        },
    )


def test_classify_trust_band_boundaries() -> None:
    assert classify_trust_band(None) == TRUST_BAND_STABLE
    assert classify_trust_band(0.13) == TRUST_BAND_STABLE
    assert classify_trust_band(0.12) == TRUST_BAND_CONTESTED_USEFUL
    assert classify_trust_band(0.04) == TRUST_BAND_CONTESTED_USEFUL
    assert classify_trust_band(0.03) == TRUST_BAND_UNSTABLE


def test_run_phase6a_threshold_sweep_executes_minimal_matrix(tmp_path: Path) -> None:
    config = ThresholdSweepConfig(
        threshold_values=(0.08, 0.12),
        baseline_threshold=0.08,
        runs_supported=2,
        runs_best_effort=1,
    )
    scenarios = (ReplayScenario("short", "low", 3, 1),)

    report = run_phase6a_threshold_sweep(project_root=tmp_path, config=config, scenarios=scenarios)

    assert report.threshold_values == [0.08, 0.12]
    assert len(report.results) == 2
    assert all(len(result.scenario_metrics) == 1 for result in report.results)
    assert report.stop_condition.recommended_threshold is not None
    assert report.stop_condition.conservative_fallback_threshold is not None


def test_phase6a_detects_determinism_regression_vs_baseline(monkeypatch, tmp_path: Path) -> None:
    import blackskies.services.memory_lab.tuning as tuning

    monkeypatch.setattr(
        tuning, "supported_deterministic_environment", lambda _root: (True, "fcntl", True)
    )

    def fake_run_threshold_for_scenario(
        *, scenario: ReplayScenario, threshold: float, runs: int
    ) -> ScenarioSweepMetrics:
        # Baseline is deterministic; candidate regresses on winner drift.
        return _metrics(
            scenario_id=scenario.scenario_id, winner_drift=(1 if threshold == 0.12 else 0)
        )

    monkeypatch.setattr(tuning, "_run_threshold_for_scenario", fake_run_threshold_for_scenario)

    config = ThresholdSweepConfig(
        threshold_values=(0.08, 0.12),
        baseline_threshold=0.08,
        runs_supported=2,
        runs_best_effort=1,
    )
    scenarios = (ReplayScenario("short", "low", 3, 1),)
    report = tuning.run_phase6a_threshold_sweep(
        project_root=tmp_path, config=config, scenarios=scenarios
    )

    regressed = next(result for result in report.results if result.threshold == 0.12)
    assert regressed.blocker is True
    assert "winner_drift_regression_vs_baseline" in regressed.blocker_reasons


def test_phase6a_marks_prompt_budget_regression(monkeypatch, tmp_path: Path) -> None:
    import blackskies.services.memory_lab.tuning as tuning

    monkeypatch.setattr(
        tuning,
        "supported_deterministic_environment",
        lambda _root: (False, "no_op_fallback", False),
    )

    def fake_run_threshold_for_scenario(
        *, scenario: ReplayScenario, threshold: float, runs: int
    ) -> ScenarioSweepMetrics:
        return _metrics(
            scenario_id=scenario.scenario_id,
            p95_prompt_growth=0.30,
        )

    monkeypatch.setattr(tuning, "_run_threshold_for_scenario", fake_run_threshold_for_scenario)

    config = ThresholdSweepConfig(
        threshold_values=(0.08,),
        baseline_threshold=0.08,
        prompt_growth_budget_p95=0.20,
    )
    report = tuning.run_phase6a_threshold_sweep(
        project_root=tmp_path,
        config=config,
        scenarios=(ReplayScenario("short", "low", 3, 1),),
    )

    assert report.results[0].blocker is True
    assert "prompt_growth_budget_exceeded" in report.results[0].blocker_reasons


def test_phase6a_marks_diagnostics_completeness_gap(monkeypatch, tmp_path: Path) -> None:
    import blackskies.services.memory_lab.tuning as tuning

    monkeypatch.setattr(
        tuning,
        "supported_deterministic_environment",
        lambda _root: (False, "no_op_fallback", False),
    )

    def fake_run_threshold_for_scenario(
        *, scenario: ReplayScenario, threshold: float, runs: int
    ) -> ScenarioSweepMetrics:
        return _metrics(scenario_id=scenario.scenario_id, completeness=0.5)

    monkeypatch.setattr(tuning, "_run_threshold_for_scenario", fake_run_threshold_for_scenario)

    config = ThresholdSweepConfig(
        threshold_values=(0.08,),
        baseline_threshold=0.08,
    )
    report = tuning.run_phase6a_threshold_sweep(
        project_root=tmp_path,
        config=config,
        scenarios=(ReplayScenario("short", "low", 3, 1),),
    )

    assert report.results[0].blocker is True
    assert "diagnostics_completeness_below_target" in report.results[0].blocker_reasons


def test_evaluate_stop_condition_requires_profiles_and_baseline() -> None:
    stop = evaluate_stop_condition(
        results=[],
        recommended_threshold=None,
        conservative_fallback_threshold=None,
        enforce_determinism=True,
        baseline_threshold=0.08,
    )

    assert stop.stop_met is False
    assert "threshold_results_missing" in stop.reasons
    assert "missing_recommended_profile" in stop.reasons
    assert "missing_conservative_fallback_profile" in stop.reasons
    assert "baseline_threshold_missing" in stop.reasons


def test_write_phase6a_artifacts_round_trip(tmp_path: Path) -> None:
    report = Phase6ATuningReport(
        environment_tier="best_effort",
        environment_metadata={
            "os": "linux",
            "cpu": "x86_64",
            "python_version": "3.11",
            "run_mode": "local",
            "lock_mode": "no_op_fallback",
            "lock_is_effective": False,
        },
        lock_mode="no_op_fallback",
        lock_is_effective=False,
        runs_per_scenario=1,
        baseline_threshold=0.08,
        threshold_values=[0.08],
        results=[],
        selected_recommended_threshold=0.08,
        selected_conservative_fallback_threshold=0.08,
        stop_condition=StopConditionEvaluation(
            stop_met=True,
            recommended_threshold=0.08,
            conservative_fallback_threshold=0.08,
            reasons=[],
        ),
    )

    results_path, decision_log_path, profile_path = write_phase6a_artifacts(
        output_dir=tmp_path, report=report
    )

    assert results_path.exists()
    assert decision_log_path.exists()
    assert profile_path.exists()
    assert "recommended_threshold" in profile_path.read_text(encoding="utf-8")
