from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.schemas import (
    ContestedOutcomeEvent,
    DecayEvent,
    InterpretationGroup,
    MemoryArtifact,
    MemoryLedgerEntry,
    ReinforcementEvent,
)
from blackskies.services.memory_lab.storage import (
    anchor_index_path,
    append_contested_outcome_event,
    append_decay_event,
    append_reinforcement_event,
    artifact_path,
    decay_events_path,
    detect_event_file_corruption,
    legacy_reinforcement_events_path,
    load_interpretation_group,
    load_contested_outcome_events,
    load_decay_events,
    list_ledger_entries,
    load_ledger_entry,
    load_reinforcement_events,
    reinforcement_events_path,
    rebuild_anchor_index,
    write_interpretation_group,
    write_ledger_entry,
)


def _entry(scene_id: str) -> MemoryLedgerEntry:
    artifact = MemoryArtifact(
        artifact_id=f"art_{scene_id}",
        schema_version="memory_artifact_v1",
        artifact_type="summary",
        scene_id=scene_id,
        chapter_id="ch_0001",
        source_excerpt="Short excerpt",
        content=f"Summary for {scene_id}",
        weight=0.8,
        confidence=0.9,
        recency_order=1,
        tags=["carryover"],
        derived_from="unit-test",
        created_at="2026-04-12T00:00:00Z",
    )
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id="ch_0001",
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=[artifact],
        source_summary=f"Source summary {scene_id}",
        source_unresolved=["Question A"],
        source_emotional_carryover="anxious",
        source_location_state="cellar",
    )


def test_write_then_load_roundtrip(tmp_path: Path) -> None:
    root = tmp_path / "project"
    entry = _entry("sc_0002")

    write_ledger_entry(root, entry)
    loaded = load_ledger_entry(root, "sc_0002")

    assert loaded is not None
    assert loaded == entry


def test_invalid_json_returns_none(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = artifact_path(root, "sc_bad")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("{not valid json", encoding="utf-8")

    assert load_ledger_entry(root, "sc_bad") is None


def test_legacy_artifact_payload_without_b3_fields_loads_with_defaults(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = artifact_path(root, "sc_legacy")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(
            {
                "scene_id": "sc_legacy",
                "chapter_id": "ch_0001",
                "schema_version": MEMORY_LAB_SCHEMA_VERSION,
                "artifacts": [
                    {
                        "artifact_id": "art_legacy",
                        "schema_version": "memory_artifact_v1",
                        "artifact_type": "summary",
                        "scene_id": "sc_legacy",
                        "chapter_id": "ch_0001",
                        "source_excerpt": "legacy excerpt",
                        "content": "legacy content",
                        "weight": 1.0,
                        "confidence": 1.0,
                        "recency_order": 2,
                        "tags": [],
                        "derived_from": "legacy-test",
                        "created_at": "2026-04-13T00:00:00Z",
                        "status": "active",
                    }
                ],
                "source_summary": "legacy summary",
                "source_unresolved": [],
                "source_emotional_carryover": None,
                "source_location_state": None,
            }
        ),
        encoding="utf-8",
    )

    loaded = load_ledger_entry(root, "sc_legacy")

    assert loaded is not None
    assert len(loaded.artifacts) == 1
    artifact = loaded.artifacts[0]
    assert artifact.artifact_id == "art_legacy"
    assert artifact.last_reinforced_scene_order is None
    assert artifact.last_touch_scene_order is None
    assert artifact.last_decay_scene_order is None
    assert artifact.last_decay_at is None
    assert artifact.decay_count == 0
    assert artifact.suppressed_at is None
    assert artifact.archived_at is None


def test_list_ledger_entries_returns_sorted_by_scene_id(tmp_path: Path) -> None:
    root = tmp_path / "project"
    write_ledger_entry(root, _entry("sc_0010"))
    write_ledger_entry(root, _entry("sc_0001"))
    write_ledger_entry(root, _entry("sc_0003"))

    entries = list_ledger_entries(root)

    assert [entry.scene_id for entry in entries] == ["sc_0001", "sc_0003", "sc_0010"]

    # Confirm files are human-readable JSON.
    payload = json.loads(artifact_path(root, "sc_0001").read_text(encoding="utf-8"))
    assert payload["scene_id"] == "sc_0001"


def test_interpretation_group_roundtrip(tmp_path: Path) -> None:
    root = tmp_path / "project"
    group = InterpretationGroup(
        group_id="sc_0001:interp_group:abc123",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        entity_ref="ent_mara",
        event_ref=None,
        schema_version="memory_artifact_v1",
        artifact_ids=["art_001", "art_002"],
        created_at="2026-04-13T00:00:00Z",
    )

    write_interpretation_group(root, group)
    loaded = load_interpretation_group(root, group.group_id)

    assert loaded == group


def test_reinforcement_event_append_and_load_roundtrip(tmp_path: Path) -> None:
    root = tmp_path / "project"
    event_one = ReinforcementEvent(
        event_id="re_001",
        artifact_id="art_001",
        event_type="selection",
        delta_weight=0.03,
        created_at="2026-04-13T00:01:00Z",
        notes=None,
    )
    event_two = ReinforcementEvent(
        event_id="re_002",
        artifact_id="art_001",
        event_type="survival",
        delta_weight=0.05,
        created_at="2026-04-13T00:02:00Z",
        notes="carried forward",
    )

    append_reinforcement_event(root, event_one)
    append_reinforcement_event(root, event_two)
    loaded = load_reinforcement_events(root, "art_001")

    assert loaded == [event_one, event_two]


def test_reinforcement_load_falls_back_to_legacy_events_path(tmp_path: Path) -> None:
    root = tmp_path / "project"
    legacy_target = legacy_reinforcement_events_path(root, "art_legacy")
    legacy_target.parent.mkdir(parents=True, exist_ok=True)
    legacy_payload = [
        {
            "event_id": "re_legacy",
            "artifact_id": "art_legacy",
            "event_type": "selection",
            "delta_weight": 0.03,
            "created_at": "2026-04-13T00:01:00Z",
            "notes": None,
        }
    ]
    legacy_target.write_text(json.dumps(legacy_payload), encoding="utf-8")

    loaded = load_reinforcement_events(root, "art_legacy")

    assert len(loaded) == 1
    assert loaded[0].event_id == "re_legacy"


def test_reinforcement_write_uses_new_path_only(tmp_path: Path) -> None:
    root = tmp_path / "project"
    event = ReinforcementEvent(
        event_id="re_new",
        artifact_id="art_001",
        event_type="selection",
        delta_weight=0.03,
        created_at="2026-04-13T00:01:00Z",
        notes=None,
    )

    append_reinforcement_event(root, event)

    assert reinforcement_events_path(root, "art_001").exists()
    assert not legacy_reinforcement_events_path(root, "art_001").exists()


def test_decay_event_append_and_load_roundtrip(tmp_path: Path) -> None:
    root = tmp_path / "project"
    event_one = DecayEvent(
        event_id="de_001",
        schema_version="memory_decay_event_v1",
        artifact_id="art_001",
        event_type="decayed",
        old_weight=1.0,
        new_weight=0.9,
        old_status="active",
        new_status="fading",
        scene_order=10,
        created_at="2026-04-13T00:03:00Z",
        notes=None,
    )
    event_two = DecayEvent(
        event_id="de_002",
        schema_version="memory_decay_event_v1",
        artifact_id="art_001",
        event_type="suppressed",
        old_weight=0.3,
        new_weight=0.19,
        old_status="fading",
        new_status="suppressed",
        scene_order=11,
        created_at="2026-04-13T00:04:00Z",
        notes="crossed suppressed threshold",
    )

    append_decay_event(root, event_one)
    append_decay_event(root, event_two)
    loaded = load_decay_events(root, "art_001")

    assert loaded == [event_one, event_two]


def test_malformed_decay_event_file_fails_soft(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = decay_events_path(root, "art_bad")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("{bad json", encoding="utf-8")

    assert load_decay_events(root, "art_bad") == []


def test_contested_outcome_event_roundtrip(tmp_path: Path) -> None:
    root = tmp_path / "project"
    event = ContestedOutcomeEvent(
        event_id="co_001",
        schema_version="memory_contested_event_v1",
        created_at="2026-04-13T00:00:00Z",
        scene_order=12,
        chapter_id="ch_0001",
        slot_type="summary",
        contested_key="ch_0001|summary|scene|sc_0001|grp_1",
        winner_artifact_id="art_w",
        winner_score=0.91,
        runner_up_artifact_id="art_l",
        runner_up_score=0.88,
        score_delta=0.03,
        alternate_included=True,
        alternate_threshold=0.08,
        fallback_used=False,
        tie_break_applied=True,
        tie_break_basis="(-final_total, -anchor_status, -recency, -reinforcement_count, artifact_id)",
    )
    append_contested_outcome_event(root, "sc_0012", event)
    loaded = load_contested_outcome_events(root, "sc_0012")
    assert loaded == [event]


def test_mixed_valid_invalid_reinforcement_events_keep_valid_items(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = reinforcement_events_path(root, "art_mixed")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(
            [
                {
                    "event_id": "re_ok_1",
                    "artifact_id": "art_mixed",
                    "event_type": "selection",
                    "delta_weight": 0.03,
                    "created_at": "2026-04-13T00:00:00Z",
                    "notes": None,
                },
                {
                    "event_id": "re_bad_missing_fields",
                    "artifact_id": "art_mixed",
                },
                {
                    "event_id": "re_ok_2",
                    "artifact_id": "art_mixed",
                    "event_type": "selection",
                    "delta_weight": 0.03,
                    "created_at": "2026-04-13T00:01:00Z",
                    "notes": None,
                },
            ]
        ),
        encoding="utf-8",
    )

    loaded = load_reinforcement_events(root, "art_mixed")

    assert [event.event_id for event in loaded] == ["re_ok_1", "re_ok_2"]


def test_append_decay_event_preserves_malformed_entries_in_existing_file(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = decay_events_path(root, "art_mixed")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps(
            [
                {"event_id": "broken"},
                {
                    "event_id": "de_ok_1",
                    "schema_version": "memory_decay_event_v1",
                    "artifact_id": "art_mixed",
                    "event_type": "decayed",
                    "old_weight": 1.0,
                    "new_weight": 0.9,
                    "old_status": "active",
                    "new_status": "fading",
                    "scene_order": 10,
                    "created_at": "2026-04-13T00:00:00Z",
                    "notes": None,
                },
            ]
        ),
        encoding="utf-8",
    )
    new_event = DecayEvent(
        event_id="de_new",
        schema_version="memory_decay_event_v1",
        artifact_id="art_mixed",
        event_type="decayed",
        old_weight=0.9,
        new_weight=0.8,
        old_status="fading",
        new_status="fading",
        scene_order=11,
        created_at="2026-04-13T00:02:00Z",
        notes=None,
    )

    append_decay_event(root, new_event)

    raw = json.loads(target.read_text(encoding="utf-8"))
    assert len(raw) == 3
    assert raw[0] == {"event_id": "broken"}
    assert raw[-1]["event_id"] == "de_new"


def test_append_reinforcement_event_does_not_overwrite_unreadable_file(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = reinforcement_events_path(root, "art_unreadable")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("{bad json", encoding="utf-8")
    before = target.read_text(encoding="utf-8")

    with pytest.raises(ValueError, match="failed to parse event file"):
        append_reinforcement_event(
            root,
            ReinforcementEvent(
                event_id="re_new",
                artifact_id="art_unreadable",
                event_type="selection",
                delta_weight=0.03,
                created_at="2026-04-13T00:02:00Z",
                notes=None,
            ),
        )

    assert target.read_text(encoding="utf-8") == before


def test_append_decay_event_does_not_overwrite_non_list_file(tmp_path: Path) -> None:
    root = tmp_path / "project"
    target = decay_events_path(root, "art_non_list")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"unexpected": "shape"}), encoding="utf-8")
    before = target.read_text(encoding="utf-8")

    with pytest.raises(ValueError, match="event file payload must be a list"):
        append_decay_event(
            root,
            DecayEvent(
                event_id="de_new",
                schema_version="memory_decay_event_v1",
                artifact_id="art_non_list",
                event_type="decayed",
                old_weight=1.0,
                new_weight=0.9,
                old_status="active",
                new_status="fading",
                scene_order=12,
                created_at="2026-04-13T00:03:00Z",
                notes=None,
            ),
        )

    assert target.read_text(encoding="utf-8") == before


def test_detect_event_file_corruption_reports_unreadable_and_malformed(tmp_path: Path) -> None:
    root = tmp_path / "project"
    decay_target = decay_events_path(root, "art_unreadable")
    decay_target.parent.mkdir(parents=True, exist_ok=True)
    decay_target.write_text("{bad json", encoding="utf-8")

    reinforcement_target = reinforcement_events_path(root, "art_malformed")
    reinforcement_target.parent.mkdir(parents=True, exist_ok=True)
    reinforcement_target.write_text(
        json.dumps(
            [
                {
                    "event_id": "re_ok",
                    "artifact_id": "art_malformed",
                    "event_type": "selection",
                    "delta_weight": 0.03,
                    "created_at": "2026-04-13T00:00:00Z",
                    "notes": None,
                },
                {"event_id": "re_bad"},
            ]
        ),
        encoding="utf-8",
    )

    notes = detect_event_file_corruption(root)

    assert any("decay_events:art_unreadable.json:unreadable_json" in note for note in notes)
    assert any("reinforcement_events:art_malformed.json:malformed_items=1" in note for note in notes)


def test_rebuild_anchor_index_includes_anchor_artifacts_only(tmp_path: Path) -> None:
    root = tmp_path / "project"
    anchored = MemoryArtifact(
        artifact_id="art_anchor",
        schema_version="memory_artifact_v1",
        artifact_type="summary",
        scene_id="sc_0001",
        chapter_id="ch_0001",
        source_excerpt="Excerpt",
        content="Anchored summary",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-13T00:00:00Z",
        is_anchor=True,
    )
    non_anchor = MemoryArtifact(
        artifact_id="art_regular",
        schema_version="memory_artifact_v1",
        artifact_type="summary",
        scene_id="sc_0002",
        chapter_id="ch_0001",
        source_excerpt="Excerpt",
        content="Regular summary",
        weight=1.0,
        confidence=1.0,
        recency_order=2,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-13T00:00:00Z",
        is_anchor=False,
    )

    write_ledger_entry(
        root,
        MemoryLedgerEntry(
            scene_id="sc_0001",
            chapter_id="ch_0001",
            schema_version=MEMORY_LAB_SCHEMA_VERSION,
            artifacts=[anchored],
            source_summary="Anchored source",
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )
    write_ledger_entry(
        root,
        MemoryLedgerEntry(
            scene_id="sc_0002",
            chapter_id="ch_0001",
            schema_version=MEMORY_LAB_SCHEMA_VERSION,
            artifacts=[non_anchor],
            source_summary="Regular source",
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )

    rebuilt = rebuild_anchor_index(root)

    assert rebuilt == ["art_anchor"]
    assert json.loads(anchor_index_path(root).read_text(encoding="utf-8")) == ["art_anchor"]
