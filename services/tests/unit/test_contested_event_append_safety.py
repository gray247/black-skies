from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.options import MemoryLabRuntimeOptions
from blackskies.services.memory_lab.orchestrator import orchestrate_memory_resolution
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry
from blackskies.services.memory_lab.storage import (
    contested_events_path,
    load_contested_outcome_events,
    write_ledger_entry,
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
        reinforcement_event_retention_limit=200,
        decay_event_retention_limit=200,
        debug_logging=False,
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


def test_contested_event_append_one_per_slot_per_decision(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    a = MemoryArtifact(
        artifact_id="sum_a",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="A",
        weight=1.0,
        confidence=1.0,
        recency_order=2,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-13T00:00:00Z",
        interpretation_group_id="grp_1",
        interpretation_label="protective",
        source_kind="scene",
        source_ref="sc_0001",
    )
    b = replace(a, artifact_id="sum_b", scene_id="sc_0002", interpretation_label="controlling", recency_order=1)
    write_ledger_entry(project_root, _entry("sc_0001", a))
    write_ledger_entry(project_root, _entry("sc_0002", b))

    packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0003",
        current_chapter_id="ch_0001",
        current_scene_order=3,
        options=_options(),
        now_iso="2026-04-13T12:00:00Z",
    )
    assert packet is not None
    events = load_contested_outcome_events(project_root, "sc_0003")
    # One event per slot decision produced by resolver packet diagnostics.
    assert len(events) == len(packet.selection_slot_diagnostics)


def test_corrupt_contested_event_file_is_not_overwritten_and_request_continues(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    corrupt = contested_events_path(project_root, "sc_0003")
    corrupt.parent.mkdir(parents=True, exist_ok=True)
    original = "{bad json"
    corrupt.write_text(original, encoding="utf-8")

    artifact = MemoryArtifact(
        artifact_id="sum_a",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="A",
        weight=1.0,
        confidence=1.0,
        recency_order=2,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-13T00:00:00Z",
    )
    write_ledger_entry(project_root, _entry("sc_0001", artifact))

    packet, diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0003",
        current_chapter_id="ch_0001",
        current_scene_order=3,
        options=_options(),
        now_iso="2026-04-13T12:00:00Z",
    )
    assert packet is not None
    assert corrupt.read_text(encoding="utf-8") == original
    assert any("append_contested_outcome_event_failed" in note for note in diagnostics.notes)
