"""Deterministic precedence coverage for contested memory interpretations."""

from __future__ import annotations

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.resolver import resolve_memory_packet
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry


def _interpretation(artifact_id: str, label: str) -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id=artifact_id,
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt=None,
        content=label,
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="precedence-conflict-test",
        created_at="2026-04-13T00:00:00Z",
        interpretation_group_id="grp_0001",
        interpretation_label=label,
        source_kind="scene",
        source_ref="sc_0001",
        artifact_scene_order=1,
    )


def test_memory_precedence_conflicts_use_stable_tie_break_and_surface_loser() -> None:
    entry = MemoryLedgerEntry(
        scene_id="sc_0001",
        chapter_id="ch_0001",
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=[
            _interpretation("artifact-b", "Interpretation B"),
            _interpretation("artifact-a", "Interpretation A"),
        ],
        source_summary=None,
        source_unresolved=[],
        source_emotional_carryover=None,
        source_location_state=None,
    )

    packet, reasons = resolve_memory_packet(
        entries=[entry],
        current_scene_id="sc_9999",
        current_chapter_id="ch_0001",
        alternate_interpretation_threshold=0.08,
    )

    assert packet.selected_artifact_ids == ["artifact-a"]
    assert packet.selected_summary == "Interpretation A"
    assert packet.alternate_interpretation == "Interpretation B"
    assert packet.alternate_interpretations_by_slot == {"summary": "Interpretation B"}
    assert packet.suppressed_artifact_ids == ["artifact-b"]
    assert [reason.artifact_id for reason in reasons] == ["artifact-a"]
    assert packet.selection_slot_diagnostics[0]["tie_break_rationale"].endswith(
        "artifact_id tie-break applied"
    )
