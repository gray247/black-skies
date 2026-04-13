from __future__ import annotations

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.resolver import resolve_memory_packet
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
    chapter_id: str | None,
    content: str,
    recency_order: int,
    weight: float = 1.0,
    confidence: float = 1.0,
    is_anchor: bool = False,
    reinforcement_count: int = 0,
    selection_count: int = 0,
    interpretation_group_id: str | None = None,
    interpretation_label: str | None = None,
) -> MemoryArtifact:
    return MemoryArtifact(
        artifact_id=artifact_id,
        schema_version="memory_artifact_v1",
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
        created_at="2026-04-12T00:00:00Z",
        is_anchor=is_anchor,
        reinforcement_count=reinforcement_count,
        selection_count=selection_count,
        interpretation_group_id=interpretation_group_id,
        interpretation_label=interpretation_label,
    )


def _entry(scene_id: str, chapter_id: str | None, artifacts: list[MemoryArtifact]) -> MemoryLedgerEntry:
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id=chapter_id,
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=artifacts,
        source_summary=None,
        source_unresolved=[],
        source_emotional_carryover=None,
        source_location_state=None,
    )


def test_resolver_prefers_same_chapter_over_other_chapter() -> None:
    entries = [
        _entry(
            "sc_old_same",
            "ch_0010",
            [_artifact(artifact_id="a1", artifact_type="summary", scene_id="sc_old_same", chapter_id="ch_0010", content="same-chapter summary", recency_order=3)],
        ),
        _entry(
            "sc_new_other",
            "ch_0009",
            [_artifact(artifact_id="a2", artifact_type="summary", scene_id="sc_new_other", chapter_id="ch_0009", content="other-chapter summary", recency_order=10)],
        ),
    ]

    packet, reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    assert packet.selected_summary == "same-chapter summary"
    assert reasons[0].artifact_id == "a1"


def test_resolver_prefers_newer_recency_order_when_chapter_equal() -> None:
    entries = [
        _entry(
            "sc_old",
            "ch_0010",
            [_artifact(artifact_id="s_old", artifact_type="emotional_state", scene_id="sc_old", chapter_id="ch_0010", content="older emotion", recency_order=1)],
        ),
        _entry(
            "sc_new",
            "ch_0010",
            [_artifact(artifact_id="s_new", artifact_type="emotional_state", scene_id="sc_new", chapter_id="ch_0010", content="newer emotion", recency_order=9)],
        ),
    ]

    packet, reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    assert packet.selected_emotional_carryover == "newer emotion"
    chosen = next(reason for reason in reasons if reason.artifact_type == "emotional_state")
    assert chosen.artifact_id == "s_new"


def test_resolver_caps_unresolved_and_ignores_current_scene_artifacts() -> None:
    entries = [
        _entry(
            "sc_current",
            "ch_0010",
            [
                _artifact(
                    artifact_id="cur_u1",
                    artifact_type="unresolved_tension",
                    scene_id="sc_current",
                    chapter_id="ch_0010",
                    content="current scene unresolved",
                    recency_order=10,
                )
            ],
        ),
        _entry(
            "sc_0001",
            "ch_0010",
            [
                _artifact(artifact_id="u1", artifact_type="unresolved_tension", scene_id="sc_0001", chapter_id="ch_0010", content="u1", recency_order=1),
                _artifact(artifact_id="u2", artifact_type="unresolved_tension", scene_id="sc_0001", chapter_id="ch_0010", content="u2", recency_order=2),
                _artifact(artifact_id="u3", artifact_type="unresolved_tension", scene_id="sc_0001", chapter_id="ch_0010", content="u3", recency_order=3),
                _artifact(artifact_id="u4", artifact_type="unresolved_tension", scene_id="sc_0001", chapter_id="ch_0010", content="u4", recency_order=4),
            ],
        ),
    ]

    packet, reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
        max_unresolved=3,
    )

    assert len(packet.selected_unresolved_tensions) == 3
    assert "current scene unresolved" not in packet.selected_unresolved_tensions
    assert all(artifact_id != "cur_u1" for artifact_id in packet.selected_artifact_ids)
    unresolved_reasons = [reason for reason in reasons if reason.artifact_type == "unresolved_tension"]
    assert len(unresolved_reasons) == 3


def test_anchor_beats_non_anchor_when_scores_are_close() -> None:
    entries = [
        _entry(
            "sc_anchor",
            "ch_0010",
            [
                _artifact(
                    artifact_id="sum_anchor",
                    artifact_type="summary",
                    scene_id="sc_anchor",
                    chapter_id="ch_0010",
                    content="anchored summary",
                    recency_order=8,
                    weight=1.0,
                    confidence=1.0,
                    is_anchor=True,
                )
            ],
        ),
        _entry(
            "sc_plain",
            "ch_0010",
            [
                _artifact(
                    artifact_id="sum_plain",
                    artifact_type="summary",
                    scene_id="sc_plain",
                    chapter_id="ch_0010",
                    content="plain summary",
                    recency_order=9,
                    weight=1.0,
                    confidence=1.0,
                    is_anchor=False,
                )
            ],
        ),
    ]

    packet, reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    assert packet.selected_summary == "anchored summary"
    assert packet.anchor_artifact_ids == ["sum_anchor"]
    assert reasons[0].artifact_id == "sum_anchor"


def test_reinforced_artifact_beats_weaker_artifact_when_relevant() -> None:
    entries = [
        _entry(
            "sc_reinforced",
            "ch_0010",
            [
                _artifact(
                    artifact_id="emo_reinforced",
                    artifact_type="emotional_state",
                    scene_id="sc_reinforced",
                    chapter_id="ch_0010",
                    content="reinforced emotion",
                    recency_order=6,
                    reinforcement_count=3,
                )
            ],
        ),
        _entry(
            "sc_weaker",
            "ch_0010",
            [
                _artifact(
                    artifact_id="emo_weaker",
                    artifact_type="emotional_state",
                    scene_id="sc_weaker",
                    chapter_id="ch_0010",
                    content="weaker emotion",
                    recency_order=7,
                    reinforcement_count=0,
                )
            ],
        ),
    ]

    packet, reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    assert packet.selected_emotional_carryover == "reinforced emotion"
    chosen = next(reason for reason in reasons if reason.artifact_type == "emotional_state")
    assert chosen.artifact_id == "emo_reinforced"


def test_competing_interpretations_choose_only_one_winner() -> None:
    entries = [
        _entry(
            "sc_interp",
            "ch_0010",
            [
                _artifact(
                    artifact_id="sum_interp_a",
                    artifact_type="summary",
                    scene_id="sc_interp",
                    chapter_id="ch_0010",
                    content="Mara prevented the exit.",
                    recency_order=8,
                    interpretation_group_id="grp_001",
                    interpretation_label="protective",
                ),
                _artifact(
                    artifact_id="sum_interp_b",
                    artifact_type="summary",
                    scene_id="sc_interp",
                    chapter_id="ch_0010",
                    content="Mara prevented the exit.",
                    recency_order=8,
                    interpretation_group_id="grp_001",
                    interpretation_label="controlling",
                ),
            ],
        ),
    ]

    packet, _reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    assert len(packet.selected_artifact_ids) == 1
    assert packet.selected_interpretations == ["protective"]
    assert packet.suppressed_artifact_ids == ["sum_interp_b"]


def test_close_second_in_group_becomes_alternate_interpretation() -> None:
    entries = [
        _entry(
            "sc_interp",
            "ch_0010",
            [
                _artifact(
                    artifact_id="sum_interp_a",
                    artifact_type="summary",
                    scene_id="sc_interp",
                    chapter_id="ch_0010",
                    content="Same base content",
                    recency_order=9,
                    confidence=1.0,
                    interpretation_group_id="grp_010",
                    interpretation_label="friendly",
                ),
                _artifact(
                    artifact_id="sum_interp_b",
                    artifact_type="summary",
                    scene_id="sc_interp",
                    chapter_id="ch_0010",
                    content="Same base content",
                    recency_order=8,
                    confidence=1.0,
                    interpretation_group_id="grp_010",
                    interpretation_label="threatening",
                ),
            ],
        ),
    ]

    packet, _reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
        alternate_interpretation_threshold=0.30,
    )

    assert packet.selected_interpretations == ["friendly"]
    assert packet.alternate_interpretation == "threatening"


def test_reinforcement_updates_selected_artifact_and_persists_event(tmp_path) -> None:
    root = tmp_path / "project"
    entry = _entry(
        "sc_old",
        "ch_0010",
        [
            _artifact(
                artifact_id="sum_reinforce",
                artifact_type="summary",
                scene_id="sc_old",
                chapter_id="ch_0010",
                content="stable summary",
                recency_order=5,
            )
        ],
    )
    write_ledger_entry(root, entry)

    packet, _reasons = resolve_memory_packet(
        entries=[entry],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
        reinforcement_enabled=True,
        project_root=root,
        now_iso="2026-04-13T10:00:00Z",
    )

    assert packet.selected_summary == "stable summary"
    events = load_reinforcement_events(root, "sum_reinforce")
    assert len(events) == 1
    assert events[0].event_type == "selection"
