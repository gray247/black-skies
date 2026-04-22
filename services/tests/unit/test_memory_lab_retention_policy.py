from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from blackskies.services.memory_lab.compat import (
    append_contested_outcome_event_current,
    append_decay_event_current,
    append_reinforcement_event_current,
)
from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.options import MemoryLabRuntimeOptions
from blackskies.services.memory_lab.orchestrator import orchestrate_memory_resolution
from blackskies.services.memory_lab.schemas import (
    ContestedOutcomeEvent,
    DecayEvent,
    MemoryArtifact,
    MemoryLedgerEntry,
    ReinforcementEvent,
)
from blackskies.services.memory_lab.storage import (
    load_contested_outcome_events,
    load_decay_events,
    load_reinforcement_events,
    write_ledger_entry,
)


def _entry(scene_id: str, artifact: MemoryArtifact) -> MemoryLedgerEntry:
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
        reinforcement_enabled=True,
        anchor_enabled=True,
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
        reinforcement_event_retention_limit=2,
        decay_event_retention_limit=2,
        contested_event_retention_limit=1,
        debug_logging=False,
    )


def test_reinforcement_retention_enforced_per_artifact(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    for idx in range(3):
        append_reinforcement_event_current(
            project_root,
            ReinforcementEvent(
                event_id=f"re_{idx}",
                artifact_id="art_a",
                event_type="selection",
                delta_weight=0.01,
                created_at=f"2026-04-14T00:00:0{idx}Z",
            ),
            retention_limit=2,
        )

    events = load_reinforcement_events(project_root, "art_a")
    assert [item.event_id for item in events] == ["re_1", "re_2"]


def test_decay_retention_enforced_per_artifact(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    for idx in range(3):
        append_decay_event_current(
            project_root,
            DecayEvent(
                event_id=f"de_{idx}",
                schema_version="memory_decay_event_v1",
                artifact_id="art_a",
                event_type="decayed",
                old_weight=1.0,
                new_weight=0.9,
                old_status="active",
                new_status="active",
                scene_order=idx,
                created_at=f"2026-04-14T00:00:0{idx}Z",
            ),
            retention_limit=2,
        )

    events = load_decay_events(project_root, "art_a")
    assert [item.event_id for item in events] == ["de_1", "de_2"]


def test_contested_retention_enforced_per_scene(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    for idx in range(3):
        append_contested_outcome_event_current(
            project_root,
            "sc_0009",
            ContestedOutcomeEvent(
                event_id=f"co_{idx}",
                schema_version="memory_contested_event_v1",
                created_at=f"2026-04-14T00:00:0{idx}Z",
                scene_order=9,
                chapter_id="ch_0001",
                slot_type="summary",
                contested_key="ch_0001|summary|scene|sc_0001|grp_1",
                winner_artifact_id="a",
                winner_score=1.0,
                runner_up_artifact_id="b",
                runner_up_score=0.95,
                score_delta=0.05,
                alternate_included=True,
                alternate_threshold=0.08,
                fallback_used=False,
                tie_break_applied=True,
                tie_break_basis="sorted comparator",
            ),
            retention_limit=2,
        )

    events = load_contested_outcome_events(project_root, "sc_0009")
    assert [item.event_id for item in events] == ["co_1", "co_2"]


def test_orchestrator_uses_contested_retention_limit(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    artifact = MemoryArtifact(
        artifact_id="sum_a",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
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
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    opts = _options()
    orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=opts,
        now_iso="2026-04-14T12:00:00Z",
    )
    orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=replace(opts, debug_logging=True),
        now_iso="2026-04-14T12:00:01Z",
    )

    events = load_contested_outcome_events(project_root, "sc_0002")
    assert len(events) == 1
