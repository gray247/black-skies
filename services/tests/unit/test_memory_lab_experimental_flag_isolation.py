from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.experimental import (
    ExperimentDescriptor,
    ExperimentEvaluationInput,
    clear_experiment_registry,
    evaluate_experiment_outcome,
    register_experiment,
)
from blackskies.services.memory_lab.options import MemoryLabRuntimeOptions
from blackskies.services.memory_lab.orchestrator import orchestrate_memory_resolution
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry
from blackskies.services.memory_lab.storage import write_ledger_entry


def _entry(scene_id: str) -> MemoryLedgerEntry:
    artifact = MemoryArtifact(
        artifact_id="art_1",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id=scene_id,
        chapter_id="ch_0001",
        source_excerpt=None,
        content="summary",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-14T00:00:00Z",
    )
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id="ch_0001",
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=[artifact],
        source_summary=None,
        source_unresolved=[],
        source_emotional_carryover=None,
        source_location_state=None,
    )


def _options() -> MemoryLabRuntimeOptions:
    return MemoryLabRuntimeOptions(
        enabled=True,
        max_candidates=8,
        max_unresolved=3,
        alternate_interpretation_threshold=0.08,
        weight_max=2.0,
        reinforcement_enabled=False,
        anchor_enabled=False,
        anchor_auto_threshold=3,
        decay_enabled=False,
        decay_base_rate=0.03,
        decay_min_weight=0.05,
        decay_fading_threshold=0.40,
        decay_suppressed_threshold=0.20,
        decay_archived_threshold=0.10,
        decay_log_anchor_protection=False,
        decay_allow_revival=True,
        decay_suppressed_fallback_enabled=True,
        decay_low_confidence_fallback_threshold=0.35,
        reinforcement_event_retention_limit=200,
        decay_event_retention_limit=200,
        debug_logging=False,
    )


def test_experimental_framework_does_not_run_when_flag_off(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    write_ledger_entry(project_root, _entry("sc_0001"))

    clear_experiment_registry()
    register_experiment(
        ExperimentDescriptor(
            name="exp_observe",
            hypothesis="observe only",
            metrics=("winner_drift",),
            guardrails=("no_core_mutation",),
            regression_budget={"latency_delta": 0.1},
            success_criteria=("none",),
        )
    )

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=replace(
            _options(),
            experimental_enabled=False,
            experimental_active_experiments=("exp_observe",),
        ),
        now_iso="2026-04-14T12:00:00Z",
    )

    assert packet is not None
    assert diagnostics.experimental_framework_enabled is False
    assert diagnostics.experimental_ran is False
    assert diagnostics.experimental_outcomes == []


def test_rollback_disable_restores_stable_behavior_immediately(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    write_ledger_entry(project_root, _entry("sc_0001"))

    clear_experiment_registry()
    register_experiment(
        ExperimentDescriptor(
            name="exp_observe",
            hypothesis="observe only",
            metrics=("winner_drift",),
            guardrails=("no_core_mutation",),
            regression_budget={"latency_delta": 0.1},
            success_criteria=("none",),
        )
    )

    enabled_packet, enabled_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=replace(
            _options(),
            experimental_enabled=True,
            experimental_active_experiments=("exp_observe",),
        ),
        now_iso="2026-04-14T12:00:00Z",
    )
    disabled_packet, disabled_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=replace(
            _options(),
            experimental_enabled=False,
            experimental_active_experiments=("exp_observe",),
        ),
        now_iso="2026-04-14T12:00:01Z",
    )

    assert enabled_packet is not None and disabled_packet is not None
    assert enabled_packet.selected_artifact_ids == disabled_packet.selected_artifact_ids
    assert enabled_diag.experimental_ran is True
    assert disabled_diag.experimental_ran is False


def test_promotion_defer_kill_rubric_is_measurable() -> None:
    promote = evaluate_experiment_outcome(
        ExperimentEvaluationInput(
            no_canon_mutation=True,
            deterministic_gates_passed=True,
            prompt_budget_ok=True,
            event_growth_ok=True,
            diagnostics_slo_ok=True,
            meaningful_improvement=True,
        )
    )
    defer = evaluate_experiment_outcome(
        ExperimentEvaluationInput(
            no_canon_mutation=True,
            deterministic_gates_passed=True,
            prompt_budget_ok=True,
            event_growth_ok=True,
            diagnostics_slo_ok=True,
            meaningful_improvement=False,
        )
    )
    kill = evaluate_experiment_outcome(
        ExperimentEvaluationInput(
            no_canon_mutation=True,
            deterministic_gates_passed=False,
            prompt_budget_ok=False,
            event_growth_ok=False,
            diagnostics_slo_ok=False,
            meaningful_improvement=False,
            isolation_violation=True,
        )
    )

    assert promote == "promote"
    assert defer == "defer"
    assert kill == "kill"
