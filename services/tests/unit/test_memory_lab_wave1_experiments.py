from __future__ import annotations

from dataclasses import asdict
import json
from pathlib import Path

import pytest

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.options import MemoryLabRuntimeOptions
from blackskies.services.memory_lab.orchestrator import orchestrate_memory_resolution
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry
from blackskies.services.memory_lab.storage import (
    load_reinforcement_events,
    write_ledger_entry,
)


def _artifact(
    *,
    artifact_id: str,
    artifact_type: str,
    scene_id: str,
    chapter_id: str = "ch_0001",
    content: str,
    recency_order: int,
    confidence: float = 1.0,
    weight: float = 1.0,
    interpretation_group_id: str | None = None,
    interpretation_label: str | None = None,
    source_kind: str | None = None,
    source_ref: str | None = None,
    reinforcement_count: int = 0,
    selection_count: int = 0,
) -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id=artifact_id,
        schema_version="memory_artifact_v2",
        artifact_type=artifact_type,
        scene_id=scene_id,
        chapter_id=chapter_id,
        source_excerpt=None,
        content=content,
        weight=weight,
        confidence=confidence,
        recency_order=recency_order,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-15T00:00:00Z",
        interpretation_group_id=interpretation_group_id,
        interpretation_label=interpretation_label,
        source_kind=source_kind,
        source_ref=source_ref,
        reinforcement_count=reinforcement_count,
        selection_count=selection_count,
    )


def _entry(scene_id: str, artifacts: list[MemoryArtifact]) -> MemoryLedgerEntry:
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id="ch_0001",
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=artifacts,
        source_summary=None,
        source_unresolved=[],
        source_emotional_carryover=None,
        source_location_state=None,
    )


def _options(
    *, experimental_enabled: bool = False, active: tuple[str, ...] = ()
) -> MemoryLabRuntimeOptions:
    return MemoryLabRuntimeOptions(
        enabled=True,
        max_candidates=20,
        max_unresolved=7,
        alternate_interpretation_threshold=0.08,
        weight_max=2.0,
        reinforcement_enabled=True,
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
        contested_event_retention_limit=200,
        diagnostics_level="standard",
        profile_name="stable_default",
        profile_version="1.0.0",
        experimental_enabled=experimental_enabled,
        experimental_active_experiments=active,
        experimental_fail_closed=True,
        experimental_log_events=True,
        debug_logging=False,
    )


def _seed_wave1_candidates(project_root: Path) -> None:
    write_ledger_entry(
        project_root,
        _entry(
            "sc_0001",
            [
                _artifact(
                    artifact_id="sum_a",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    content="Mara blocked the path to protect the crew.",
                    recency_order=20,
                    interpretation_group_id="grp_sum",
                    interpretation_label="protective",
                    source_kind="scene",
                    source_ref="sc_0001",
                ),
                _artifact(
                    artifact_id="sum_b",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    content="Mara blocked the path to control the crew.",
                    recency_order=19,
                    interpretation_group_id="grp_sum",
                    interpretation_label="controlling",
                    source_kind="scene",
                    source_ref="sc_0001",
                ),
                _artifact(
                    artifact_id="emo_a",
                    artifact_type="emotional_state",
                    scene_id="sc_0001",
                    content="Everyone keeps a lid on panic.",
                    recency_order=18,
                ),
                _artifact(
                    artifact_id="emo_b",
                    artifact_type="emotional_state",
                    scene_id="sc_0001",
                    content="Panic is close to spilling over.",
                    recency_order=17,
                ),
                _artifact(
                    artifact_id="loc_a",
                    artifact_type="location_state",
                    scene_id="sc_0001",
                    content="The corridor remains sealed and crowded.",
                    recency_order=16,
                ),
                _artifact(
                    artifact_id="loc_b",
                    artifact_type="location_state",
                    scene_id="sc_0001",
                    content="The corridor briefly clears near the hatch.",
                    recency_order=15,
                ),
            ],
        ),
    )
    unresolved = [
        _artifact(
            artifact_id=f"un_{index}",
            artifact_type="unresolved_tension",
            scene_id="sc_0002",
            content=f"Unresolved thread {index}",
            recency_order=14 - index,
        )
        for index in range(8)
    ]
    write_ledger_entry(project_root, _entry("sc_0002", unresolved))


def test_a1_exposure_only_increases_alternates_without_winner_or_comparator_mutation(
    tmp_path: Path,
) -> None:
    baseline_root = tmp_path / "baseline_project"
    a1_root = tmp_path / "a1_project"
    _seed_wave1_candidates(baseline_root)
    _seed_wave1_candidates(a1_root)

    baseline_packet, baseline_diag = orchestrate_memory_resolution(
        project_root=baseline_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=25,
        options=_options(experimental_enabled=False),
        now_iso="2026-04-15T12:00:00Z",
    )
    assert baseline_packet is not None
    assert baseline_diag.experimental_metrics == {}

    a1_packet, a1_diag = orchestrate_memory_resolution(
        project_root=a1_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=25,
        options=_options(experimental_enabled=True, active=("A1",)),
        now_iso="2026-04-15T12:00:01Z",
    )
    assert a1_packet is not None

    # Exposure-only constraint: winner selection and comparator diagnostics are unchanged.
    assert a1_packet.selected_artifact_ids == baseline_packet.selected_artifact_ids
    assert a1_packet.selection_slot_diagnostics == baseline_packet.selection_slot_diagnostics

    # Alternate surfacing is allowed to increase but must remain bounded.
    baseline_alternates = len(baseline_packet.alternate_interpretations_by_slot)
    experimental_alternates = len(a1_packet.alternate_interpretations_by_slot)
    assert experimental_alternates >= baseline_alternates

    metrics = a1_diag.experimental_metrics
    assert metrics["a1_enabled"] is True
    assert metrics["b1_enabled"] is False
    assert float(metrics["measurements"]["a1.alternate_surfacing_delta"]) <= 0.15
    assert float(metrics["measurements"]["a1.prompt_token_growth"]) <= 0.20
    assert float(metrics["measurements"]["determinism.winner_drift_count"]) == 0.0
    assert float(metrics["measurements"]["determinism.alternate_drift_count"]) == 0.0
    assert a1_diag.experimental_guardrail_passed is True


def test_b1_reinforcement_saturation_changes_delta_curve_and_respects_bounds(
    tmp_path: Path,
) -> None:
    project_root = tmp_path / "project"
    write_ledger_entry(
        project_root,
        _entry(
            "sc_0001",
            [
                _artifact(
                    artifact_id="sum_sat",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    content="Saturation target summary",
                    recency_order=10,
                    reinforcement_count=8,
                    selection_count=8,
                )
            ],
        ),
    )

    baseline_packet, _baseline_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=11,
        options=_options(experimental_enabled=False, active=()),
        now_iso="2026-04-15T12:10:00Z",
    )
    assert baseline_packet is not None
    baseline_events = load_reinforcement_events(project_root, "sum_sat")
    assert baseline_events and baseline_events[-1].delta_weight == 0.03

    b1_packet, b1_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0003",
        current_chapter_id="ch_0001",
        current_scene_order=12,
        options=_options(experimental_enabled=True, active=("B1",)),
        now_iso="2026-04-15T12:10:01Z",
    )
    assert b1_packet is not None
    saturated_events = load_reinforcement_events(project_root, "sum_sat")
    assert saturated_events
    assert saturated_events[-1].delta_weight == 0.003

    metrics = b1_diag.experimental_metrics
    assert metrics["a1_enabled"] is False
    assert metrics["b1_enabled"] is True
    assert float(metrics["measurements"]["b1.event_growth"]) <= 0.10
    assert float(metrics["measurements"]["b1.latency_growth"]) <= 0.10
    assert float(metrics["measurements"]["b1.prompt_growth_from_saturation_logic"]) == 0.0
    assert float(metrics["measurements"]["determinism.winner_drift_count"]) == 0.0
    assert b1_diag.experimental_guardrail_passed is True


def test_combined_mode_emits_machine_readable_metrics_and_preserves_canon(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    _seed_wave1_candidates(project_root)
    accepted_scene = project_root / "accepted_scenes" / "sc_0001.md"
    accepted_scene.parent.mkdir(parents=True, exist_ok=True)
    accepted_scene.write_text("canon stays intact", encoding="utf-8")
    locked_facts = project_root / "locked_facts.json"
    locked_facts.write_text('["fact"]', encoding="utf-8")
    outline = project_root / "outline.json"
    outline.write_text('{"chapters":[],"scenes":[]}', encoding="utf-8")
    before = (
        accepted_scene.read_text(encoding="utf-8"),
        locked_facts.read_text(encoding="utf-8"),
        outline.read_text(encoding="utf-8"),
    )

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=30,
        options=_options(experimental_enabled=True, active=("A1", "B1")),
        now_iso="2026-04-15T12:20:00Z",
    )
    assert packet is not None
    after = (
        accepted_scene.read_text(encoding="utf-8"),
        locked_facts.read_text(encoding="utf-8"),
        outline.read_text(encoding="utf-8"),
    )
    assert before == after

    metrics = diagnostics.experimental_metrics
    assert metrics["a1_enabled"] is True and metrics["b1_enabled"] is True
    assert float(metrics["measurements"]["combined.prompt_growth"]) <= 0.20
    assert float(metrics["measurements"]["combined.event_growth"]) <= 0.15
    assert float(metrics["measurements"]["combined.latency_growth"]) <= 0.15
    assert float(metrics["measurements"]["determinism.winner_drift_count"]) == 0.0
    assert float(metrics["measurements"]["determinism.alternate_drift_count"]) == 0.0
    assert diagnostics.experimental_guardrail_passed is True

    # Machine-readable output contract: JSON-serializable and stable-keyed.
    serialized = json.dumps(metrics, sort_keys=True)
    assert "measurements" in serialized


def test_wave1_single_flag_disable_restores_baseline_in_one_run(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    _seed_wave1_candidates(project_root)

    enabled_packet, enabled_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=31,
        options=_options(experimental_enabled=True, active=("A1",)),
        now_iso="2026-04-15T12:30:00Z",
    )
    assert enabled_packet is not None
    assert enabled_diag.experimental_ran is True

    disabled_packet, disabled_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=31,
        options=_options(experimental_enabled=False, active=("A1",)),
        now_iso="2026-04-15T12:30:01Z",
    )
    baseline_packet, _baseline_diag = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=31,
        options=_options(experimental_enabled=False, active=()),
        now_iso="2026-04-15T12:30:02Z",
    )
    assert disabled_packet is not None and baseline_packet is not None
    assert disabled_diag.experimental_ran is False
    assert asdict(disabled_packet) == asdict(baseline_packet)


def test_wave1_guardrail_violation_is_logged_and_marks_failure(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    project_root = tmp_path / "project"
    _seed_wave1_candidates(project_root)

    import blackskies.services.memory_lab.orchestrator as orchestrator_module

    original_apply = orchestrator_module.apply_a1_exploration_pressure

    def _forced_violation(*, packet, entries, alternate_interpretation_threshold):  # type: ignore[no-untyped-def]
        updated_packet, _metrics, elapsed = original_apply(
            packet=packet,
            entries=entries,
            alternate_interpretation_threshold=alternate_interpretation_threshold,
        )
        metrics = {
            "baseline_alternate_count": 0.0,
            "experimental_alternate_count": 10.0,
            "alternate_surfacing_delta": 0.5,  # intentional guardrail breach
            "eligible_slots": 10.0,
            "added_slots": 10.0,
        }
        return updated_packet, metrics, elapsed

    monkeypatch.setattr(orchestrator_module, "apply_a1_exploration_pressure", _forced_violation)

    _packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_current",
        current_chapter_id="ch_0001",
        current_scene_order=32,
        options=_options(experimental_enabled=True, active=("A1",)),
        now_iso="2026-04-15T12:40:00Z",
    )

    assert diagnostics.experimental_guardrail_passed is False
    assert diagnostics.experimental_guardrail_violations
    assert any("wave1_guardrail_violation" in item for item in diagnostics.failure_entries)
