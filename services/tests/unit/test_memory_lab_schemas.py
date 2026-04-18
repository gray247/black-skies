from __future__ import annotations

from blackskies.services.memory_lab.schemas import (
    DecayEvent,
    InterpretationGroup,
    MemoryArtifact,
    ReinforcementEvent,
    ResolvedMemoryPacket,
)


def test_memory_artifact_new_defaults() -> None:
    artifact = MemoryArtifact(
        artifact_id="art_001",
        schema_version="memory_artifact_v1",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt="Excerpt",
        content="Content",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=["tag"],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )

    assert artifact.is_anchor is False
    assert artifact.anchor_reason is None
    assert artifact.reinforcement_count == 0
    assert artifact.selection_count == 0
    assert artifact.last_selected_at is None
    assert artifact.last_reinforced_scene_order is None
    assert artifact.last_touch_scene_order is None
    assert artifact.last_decay_scene_order is None
    assert artifact.last_decay_at is None
    assert artifact.decay_count == 0
    assert artifact.suppressed_at is None
    assert artifact.archived_at is None
    assert artifact.interpretation_group_id is None
    assert artifact.interpretation_label is None
    assert artifact.parent_artifact_id is None
    assert artifact.status == "active"


def test_resolved_memory_packet_new_defaults() -> None:
    packet = ResolvedMemoryPacket(
        selected_summary="Summary",
        selected_unresolved_tensions=["u1"],
        selected_emotional_carryover="tense",
        selected_location_state="cellar",
        alternate_interpretation=None,
        selected_artifact_ids=["art_001"],
        resolver_notes=["note"],
    )

    assert packet.selected_interpretations == []
    assert packet.anchor_artifact_ids == []
    assert packet.suppressed_artifact_ids == []


def test_interpretation_group_and_reinforcement_event_models() -> None:
    group = InterpretationGroup(
        group_id="grp_001",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        entity_ref="ent_mara",
        event_ref="evt_lock",
        schema_version="memory_artifact_v1",
        artifact_ids=["art_001", "art_002"],
        created_at="2026-04-12T00:00:00Z",
    )
    event = ReinforcementEvent(
        event_id="re_001",
        artifact_id="art_001",
        event_type="selection",
        delta_weight=0.1,
        created_at="2026-04-12T00:01:00Z",
    )

    assert group.group_id == "grp_001"
    assert event.notes is None


def test_decay_event_model_shape() -> None:
    event = DecayEvent(
        event_id="de_001",
        schema_version="memory_decay_event_v1",
        artifact_id="art_001",
        event_type="decayed",
        old_weight=1.0,
        new_weight=0.9,
        old_status="active",
        new_status="fading",
        scene_order=12,
        created_at="2026-04-13T00:02:00Z",
        notes="unused for 3 scenes",
    )

    assert event.event_id == "de_001"
    assert event.scene_order == 12
    assert event.notes == "unused for 3 scenes"
