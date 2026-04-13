from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.schemas import (
    InterpretationGroup,
    MemoryArtifact,
    MemoryLedgerEntry,
    ReinforcementEvent,
)
from blackskies.services.memory_lab.storage import (
    anchor_index_path,
    append_reinforcement_event,
    artifact_path,
    load_interpretation_group,
    list_ledger_entries,
    load_ledger_entry,
    load_reinforcement_events,
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
