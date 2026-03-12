from __future__ import annotations

import json
from pathlib import Path

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
