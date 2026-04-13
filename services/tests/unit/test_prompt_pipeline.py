from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.schemas import MemoryArtifact, MemoryLedgerEntry, ResolvedMemoryPacket
from blackskies.services.memory_lab.storage import write_ledger_entry
from blackskies.services.models.draft import DraftUnitOverrides
from blackskies.services.models.outline import OutlineScene
from blackskies.services.prompt_pipeline import (
    assemble_scene_context,
    compile_draft_prompt,
    evaluate_draft_quality,
    is_usable_draft,
    select_profile,
)


def _scene() -> OutlineScene:
    return OutlineScene(
        id="sc_0002",
        order=2,
        title="Locked Parlor",
        chapter_id="ch_0001",
        beat_refs=["turn"],
    )


def test_scene_context_includes_prior_and_locked(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_context"
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "---\n"
        "id: sc_0001\n"
        "---\n"
        "The floorboards creak.\n"
        "Dust hangs in the air.\n",
        encoding="utf-8",
    )
    locked_path = project_root / ".blackskies"
    locked_path.mkdir(parents=True, exist_ok=True)
    (locked_path / "locked_facts.json").write_text(
        json.dumps(["The house is sealed."], indent=2),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "schema_version": "OutlineSchema v1",
                "outline_id": "out_001",
                "acts": ["Act I: Gathered Storm"],
                "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter One"}],
                "scenes": [
                    {
                        "id": "sc_0001",
                        "order": 1,
                        "title": "Basement Pulse",
                        "chapter_id": "ch_0001",
                        "beat_refs": ["inciting"],
                    },
                    {
                        "id": "sc_0002",
                        "order": 2,
                        "title": "Locked Parlor",
                        "chapter_id": "ch_0001",
                        "beat_refs": ["turn"],
                    },
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    lookup = {
        "sc_0001": OutlineScene(
            id="sc_0001",
            order=1,
            title="Basement Pulse",
            chapter_id="ch_0001",
            beat_refs=["inciting"],
        ),
        "sc_0002": _scene(),
    }
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={
            "pov": "Mara",
            "purpose": "setup",
            "pacing_target": "steady",
            "goal": "find the source",
            "conflict": "locked door",
            "turn": "a whisper answers",
            "emotion_tag": "dread",
            "word_target": 900,
        },
        overrides=None,
        project_root=project_root,
        scene_lookup=lookup,
    )

    assert context.prior_context is not None
    assert "floorboards" in context.prior_context
    assert context.locked_facts == ["The house is sealed."]
    assert context.chapter_title == "Chapter One"
    assert context.chapter_context == "Act I: Gathered Storm - Chapter One"


def test_compile_draft_prompt_shape() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara", "word_target": 900},
        overrides=DraftUnitOverrides(word_target=800),
        project_root=None,
        scene_lookup={"sc_0002": _scene()},
    )
    prompt = compile_draft_prompt(context, profile=select_profile("ollama"))

    assert "Write immersive scene prose" in prompt
    assert "Scene title: Locked Parlor" in prompt
    assert "Beats: turn" in prompt
    assert "Return plain text only" in prompt
    assert "Chapter:" in prompt


def test_compile_prompt_includes_memory_packet(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_memory"
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "The basement smelled of rust.\nThe door shuddered.\n",
        encoding="utf-8",
    )
    memory_dir = project_root / ".blackskies" / "continuity"
    memory_dir.mkdir(parents=True, exist_ok=True)
    (memory_dir / "sc_0001.json").write_text(
        json.dumps(
            {
                "schema_version": "SceneMemoryPacket v1",
                "summary": "Mara forced the door open.",
                "reveals": ["The lock was broken."],
                "unresolved": ["The whisper still lingered."],
                "emotional_carryover": "Mara is rattled but determined.",
                "location_state": "Basement hallway remains dim.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    lookup = {
        "sc_0001": OutlineScene(
            id="sc_0001",
            order=1,
            title="Basement Pulse",
            chapter_id="ch_0001",
            beat_refs=["inciting"],
        ),
        "sc_0002": _scene(),
    }
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=project_root,
        scene_lookup=lookup,
    )
    prompt = compile_draft_prompt(context, profile=select_profile("ollama"))

    assert "Prior outcome: Mara forced the door open." in prompt
    assert "Unresolved tensions: The whisper still lingered." in prompt
    assert "Emotional carryover: Mara is rattled but determined." in prompt
    assert "Location state: Basement hallway remains dim." in prompt


def test_compile_prompt_prefers_resolved_memory_packet_when_available(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_resolved_memory"
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "Legacy prior context line one.\nLegacy prior context line two.\n",
        encoding="utf-8",
    )
    continuity_dir = project_root / ".blackskies" / "continuity"
    continuity_dir.mkdir(parents=True, exist_ok=True)
    (continuity_dir / "sc_0001.json").write_text(
        json.dumps(
            {
                "schema_version": "SceneMemoryPacket v1",
                "summary": "LEGACY summary should not win.",
                "unresolved": ["LEGACY unresolved should not win."],
                "emotional_carryover": "LEGACY emotional should not win.",
                "location_state": "LEGACY location should not win.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    write_ledger_entry(
        project_root,
        MemoryLedgerEntry(
            scene_id="sc_0001",
            chapter_id="ch_0001",
            schema_version=MEMORY_LAB_SCHEMA_VERSION,
            artifacts=[
                MemoryArtifact(
                    artifact_id="a_summary",
                    schema_version="memory_artifact_v1",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="RESOLVED summary wins.",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=10,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                ),
                MemoryArtifact(
                    artifact_id="a_unresolved",
                    schema_version="memory_artifact_v1",
                    artifact_type="unresolved_tension",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="RESOLVED unresolved wins.",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=10,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                ),
                MemoryArtifact(
                    artifact_id="a_emotion",
                    schema_version="memory_artifact_v1",
                    artifact_type="emotional_state",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="RESOLVED emotional wins.",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=10,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                ),
                MemoryArtifact(
                    artifact_id="a_location",
                    schema_version="memory_artifact_v1",
                    artifact_type="location_state",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="RESOLVED location wins.",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=10,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                ),
            ],
            source_summary=None,
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )

    lookup = {
        "sc_0001": OutlineScene(
            id="sc_0001",
            order=1,
            title="Basement Pulse",
            chapter_id="ch_0001",
            beat_refs=["inciting"],
        ),
        "sc_0002": _scene(),
    }
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=project_root,
        scene_lookup=lookup,
    )
    prompt = compile_draft_prompt(context, profile=select_profile("ollama"))

    assert "Prior outcome: RESOLVED summary wins." in prompt
    assert "Unresolved tensions: RESOLVED unresolved wins." in prompt
    assert "Emotional carryover: RESOLVED emotional wins." in prompt
    assert "Location state: RESOLVED location wins." in prompt
    assert "LEGACY summary should not win." not in prompt


def test_compile_prompt_includes_compact_interpretation_lines() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara", "word_target": 900},
        overrides=DraftUnitOverrides(word_target=800),
        project_root=None,
        scene_lookup={"sc_0002": _scene()},
    )
    context_with_resolved = replace(
        context,
        resolved_memory=ResolvedMemoryPacket(
            selected_summary="Summary",
            selected_unresolved_tensions=[],
            selected_emotional_carryover=None,
            selected_location_state=None,
            alternate_interpretation="threatening",
            selected_artifact_ids=["a1"],
            resolver_notes=[],
            selected_interpretations=["friendly", "protective"],
        ),
    )

    prompt = compile_draft_prompt(context_with_resolved, profile=select_profile("ollama"))

    assert "Narrative interpretation pressure: friendly" in prompt
    assert "Alternate reading: threatening" in prompt
    assert "Narrative interpretation pressure: protective" not in prompt


def test_is_usable_draft_filters_scaffold() -> None:
    scaffold = "Scene title: Locked Parlor\nPOV: Mara\nGoal: Find the key."
    assert is_usable_draft(scaffold) is False

    prose = "Mara stepped into the parlor, the air thick with dust and old varnish. " * 4
    assert is_usable_draft(prose) is True


def test_evaluate_draft_quality_flags_meta_summary() -> None:
    scaffold = "Scene title: Locked Parlor\nPOV: Mara\nGoal: Find the key."
    metrics = evaluate_draft_quality(scaffold)
    assert metrics["usable"] is False
    assert metrics["meta_summary"] is True


def test_evaluate_draft_quality_accepts_prose() -> None:
    prose = (
        "Mara stepped into the parlor, the air thick with dust and old varnish. "
        "Her breath caught as the chandelier swayed. "
        "She whispered, \"Who's there?\" The reply was only the soft shiver of curtains. "
        "A cold draft curled around her wrists, carrying the smell of old rain."
    )
    metrics = evaluate_draft_quality(prose)
    assert metrics["usable"] is True
    assert metrics["dialogue"] is True


def test_select_profile_prefers_openai() -> None:
    profile = select_profile("openai")
    assert profile.name == "remote_openai_heavy_draft"
