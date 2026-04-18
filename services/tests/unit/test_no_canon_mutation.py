from __future__ import annotations

from dataclasses import replace
from pathlib import Path

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.options import MemoryLabRuntimeOptions
from blackskies.services.memory_lab.orchestrator import orchestrate_memory_resolution
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry
from blackskies.services.memory_lab.storage import write_ledger_entry


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


def test_no_canon_mutation_during_contested_runtime_flow(tmp_path: Path) -> None:
    project_root = tmp_path / "project"
    accepted_scene = project_root / "accepted_scenes" / "sc_0001.md"
    accepted_scene.parent.mkdir(parents=True, exist_ok=True)
    accepted_scene.write_text("canon scene text", encoding="utf-8")
    locked_facts = project_root / "locked_facts.json"
    locked_facts.write_text('["canon_fact"]', encoding="utf-8")
    outline = project_root / "outline.json"
    outline.write_text('{"chapters":[{"id":"ch_0001"}],"scenes":[{"id":"sc_0001"}]}', encoding="utf-8")

    a = MemoryArtifact(
        artifact_id="sum_a",
        schema_version="memory_artifact_v2",
        artifact_type="summary",
        scene_id="sc_0000",
        chapter_id="ch_0001",
        source_excerpt=None,
        content="contested A",
        weight=1.0,
        confidence=1.0,
        recency_order=1,
        tags=[],
        derived_from="unit-test",
        created_at="2026-04-13T00:00:00Z",
        interpretation_group_id="grp_1",
        interpretation_label="protective",
        source_kind="scene",
        source_ref="sc_0000",
    )
    b = replace(a, artifact_id="sum_b", interpretation_label="controlling", recency_order=0)
    write_ledger_entry(project_root, _entry("sc_0000", a))
    write_ledger_entry(project_root, _entry("sc_0002", b))

    before = (
        accepted_scene.read_text(encoding="utf-8"),
        locked_facts.read_text(encoding="utf-8"),
        outline.read_text(encoding="utf-8"),
    )

    packet, _diagnostics = orchestrate_memory_resolution(
        project_root=project_root,
        current_scene_id="sc_0001",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        options=_options(),
        now_iso="2026-04-13T12:00:00Z",
    )
    assert packet is not None

    after = (
        accepted_scene.read_text(encoding="utf-8"),
        locked_facts.read_text(encoding="utf-8"),
        outline.read_text(encoding="utf-8"),
    )
    assert before == after
