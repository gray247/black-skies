from __future__ import annotations

from dataclasses import replace

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
    status: str = "active",
    last_touch_scene_order: int | None = None,
    source_kind: str | None = None,
    source_ref: str | None = None,
    artifact_scene_order: int | None = None,
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
        created_at="2026-04-12T00:00:00Z",
        is_anchor=is_anchor,
        reinforcement_count=reinforcement_count,
        selection_count=selection_count,
        interpretation_group_id=interpretation_group_id,
        interpretation_label=interpretation_label,
        status=status,
        last_touch_scene_order=last_touch_scene_order,
        source_kind=source_kind,
        source_ref=source_ref,
        artifact_scene_order=artifact_scene_order,
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
    unresolved_slot_rows = [
        item for item in packet.selection_slot_diagnostics if str(item["slot"]).startswith("unresolved_tension:")
    ]
    assert len(unresolved_slot_rows) == 3
    assert all(isinstance(item["winner"], str) for item in unresolved_slot_rows)


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
                    source_kind="scene",
                    source_ref="sc_interp",
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
                    source_kind="scene",
                    source_ref="sc_interp",
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
                    source_kind="scene",
                    source_ref="sc_interp",
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
                    source_kind="scene",
                    source_ref="sc_interp",
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


def test_resolver_does_not_write_when_reinforcement_flags_are_set(tmp_path) -> None:
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
    assert events == []


def test_archived_artifacts_are_excluded_from_selection() -> None:
    archived = replace(
        _artifact(
            artifact_id="sum_archived",
            artifact_type="summary",
            scene_id="sc_archived",
            chapter_id="ch_0010",
            content="archived summary",
            recency_order=10,
            weight=1.5,
        ),
        status="archived",
    )
    entries = [
        _entry(
            "sc_archived",
            "ch_0010",
            [archived],
        ),
        _entry(
            "sc_active",
            "ch_0010",
            [
                _artifact(
                    artifact_id="sum_active",
                    artifact_type="summary",
                    scene_id="sc_active",
                    chapter_id="ch_0010",
                    content="active summary",
                    recency_order=1,
                    weight=0.2,
                )
            ],
        ),
    ]

    packet, reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    assert packet.selected_summary == "active summary"
    assert all(reason.artifact_id != "sum_archived" for reason in reasons)


def test_suppressed_fallback_lane_can_select_suppressed_candidate() -> None:
    suppressed = _artifact(
        artifact_id="sum_suppressed",
        artifact_type="summary",
        scene_id="sc_old_suppressed",
        chapter_id="ch_0010",
        content="suppressed summary revives",
        recency_order=10,
        weight=0.19,
        confidence=1.0,
        reinforcement_count=3,
        status="suppressed",
    )
    weak_active = _artifact(
        artifact_id="sum_weak",
        artifact_type="summary",
        scene_id="sc_old_weak",
        chapter_id="ch_0009",
        content="weak active summary",
        recency_order=0,
        weight=0.0,
        confidence=0.0,
        status="active",
    )
    entry_suppressed = _entry("sc_old_suppressed", "ch_0010", [suppressed])
    entry_weak = _entry("sc_old_weak", "ch_0010", [weak_active])

    packet, _reasons = resolve_memory_packet(
        entries=[entry_suppressed, entry_weak],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
        current_scene_order=12,
        reinforcement_enabled=True,
        decay_allow_revival=True,
        suppressed_fallback_enabled=True,
        low_confidence_fallback_threshold=0.35,
    )

    assert packet.selected_summary == "suppressed summary revives"
    summary_diag = next(item for item in packet.selection_slot_diagnostics if item["slot"] == "summary")
    assert summary_diag["winner"] == "sum_suppressed"
    assert summary_diag["used_fallback"] is True
    assert isinstance(summary_diag["score_delta"], float)
    assert isinstance(summary_diag["tie_break_rationale"], str)

def test_fading_artifact_is_selectable_when_it_scores_best() -> None:
    fading = _artifact(
        artifact_id="sum_fading",
        artifact_type="summary",
        scene_id="sc_old_fading",
        chapter_id="ch_0010",
        content="fading summary recovers",
        recency_order=10,
        weight=0.39,
        confidence=1.0,
        status="fading",
    )
    entry = _entry("sc_old_fading", "ch_0010", [fading])

    packet, _reasons = resolve_memory_packet(
        entries=[entry],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
        current_scene_order=20,
        reinforcement_enabled=True,
        decay_allow_revival=True,
        suppressed_fallback_enabled=True,
        low_confidence_fallback_threshold=0.35,
    )

    assert packet.selected_summary == "fading summary recovers"


def test_summary_slot_diagnostics_include_winner_loser_and_delta() -> None:
    entries = [
        _entry(
            "sc_a",
            "ch_0010",
            [
                _artifact(
                    artifact_id="sum_a",
                    artifact_type="summary",
                    scene_id="sc_a",
                    chapter_id="ch_0010",
                    content="a",
                    recency_order=10,
                ),
                _artifact(
                    artifact_id="sum_b",
                    artifact_type="summary",
                    scene_id="sc_a",
                    chapter_id="ch_0010",
                    content="b",
                    recency_order=8,
                ),
            ],
        ),
    ]

    packet, _reasons = resolve_memory_packet(
        entries=entries,
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )

    summary_diag = next(item for item in packet.selection_slot_diagnostics if item["slot"] == "summary")
    assert summary_diag["winner"] == "sum_a"
    assert summary_diag["top_loser"] == "sum_b"
    assert isinstance(summary_diag["score_delta"], float)
    assert summary_diag["used_fallback"] is False
    assert isinstance(summary_diag["tie_break_tuple"], tuple)
    assert isinstance(summary_diag["tie_break_rationale"], str)


def test_contested_grouping_uses_canonical_metadata_and_emits_alternate() -> None:
    a = _artifact(
        artifact_id="sum_grp_a",
        artifact_type="summary",
        scene_id="sc_a",
        chapter_id="ch_0010",
        content="summary a",
        recency_order=7,
        interpretation_group_id="grp-1",
        interpretation_label="protective reading",
        source_kind="scene",
        source_ref="sc_a",
    )
    b = _artifact(
        artifact_id="sum_grp_b",
        artifact_type="summary",
        scene_id="sc_b",
        chapter_id="ch_0010",
        content="summary b",
        recency_order=7,
        interpretation_group_id="grp-1",
        interpretation_label="controlling reading",
        source_kind="scene",
        source_ref="sc_a",
    )
    packet, _reasons = resolve_memory_packet(
        entries=[_entry("sc_a", "ch_0010", [a]), _entry("sc_b", "ch_0010", [b])],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
        alternate_interpretation_threshold=0.25,
    )
    assert packet.selected_summary in {"summary a", "summary b"}
    assert packet.alternate_interpretation is not None
    assert packet.alternate_interpretations_by_slot.get("summary")


def test_invalid_contested_metadata_falls_back_to_non_contested_path() -> None:
    valid = _artifact(
        artifact_id="sum_valid",
        artifact_type="summary",
        scene_id="sc_valid",
        chapter_id="ch_0010",
        content="valid",
        recency_order=5,
        interpretation_group_id="grp-2",
        interpretation_label="valid interp",
        source_kind="scene",
        source_ref="sc_valid",
    )
    invalid = _artifact(
        artifact_id="sum_invalid",
        artifact_type="summary",
        scene_id="sc_invalid",
        chapter_id="ch_0010",
        content="invalid",
        recency_order=4,
        interpretation_group_id="grp-2",
        interpretation_label="invalid interp",
        source_kind=None,
        source_ref=None,
    )
    packet, _reasons = resolve_memory_packet(
        entries=[_entry("sc_valid", "ch_0010", [valid]), _entry("sc_invalid", "ch_0010", [invalid])],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )
    assert any("invalid_contested_group_metadata" in note for note in packet.resolver_notes)


def test_comparator_uses_anchor_recency_reinforcement_then_artifact_id() -> None:
    left = _artifact(
        artifact_id="a_artifact",
        artifact_type="summary",
        scene_id="sc_l",
        chapter_id="ch_0010",
        content="left",
        recency_order=3,
        weight=1.0,
        confidence=1.0,
        is_anchor=True,
        reinforcement_count=2,
        last_touch_scene_order=3,
    )
    right = _artifact(
        artifact_id="b_artifact",
        artifact_type="summary",
        scene_id="sc_r",
        chapter_id="ch_0010",
        content="right",
        recency_order=3,
        weight=1.0,
        confidence=1.0,
        is_anchor=True,
        reinforcement_count=2,
        last_touch_scene_order=3,
    )
    packet, _reasons = resolve_memory_packet(
        entries=[_entry("sc_l", "ch_0010", [left]), _entry("sc_r", "ch_0010", [right])],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )
    # Equal scores -> artifact_id ascending tie-break.
    assert packet.selected_artifact_ids[0] == "a_artifact"


def test_loser_has_no_explicit_penalty_in_resolver() -> None:
    winner = _artifact(
        artifact_id="sum_win",
        artifact_type="summary",
        scene_id="sc_w",
        chapter_id="ch_0010",
        content="winner",
        recency_order=10,
        interpretation_group_id="grp-x",
        source_kind="scene",
        source_ref="sc_w",
        status="active",
        weight=1.0,
    )
    loser = _artifact(
        artifact_id="sum_lose",
        artifact_type="summary",
        scene_id="sc_l",
        chapter_id="ch_0010",
        content="loser",
        recency_order=9,
        interpretation_group_id="grp-x",
        source_kind="scene",
        source_ref="sc_w",
        status="active",
        weight=0.99,
    )
    _packet, _reasons = resolve_memory_packet(
        entries=[_entry("sc_w", "ch_0010", [winner]), _entry("sc_l", "ch_0010", [loser])],
        current_scene_id="sc_current",
        current_chapter_id="ch_0010",
    )
    assert loser.status == "active"
