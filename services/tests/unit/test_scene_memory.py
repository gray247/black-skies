from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.models.outline import OutlineScene
from blackskies.services.scene_memory import (
    SceneMemoryPacket,
    assemble_scene_memory_packet,
    evaluate_continuity,
    extract_carryover,
)


def _scene() -> OutlineScene:
    return OutlineScene(
        id="sc_0002",
        order=2,
        title="Locked Parlor",
        chapter_id="ch_0001",
        beat_refs=["turn"],
    )


def test_assemble_scene_memory_packet_loads_carryover(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_memory"
    memory_dir = project_root / ".blackskies" / "continuity"
    memory_dir.mkdir(parents=True, exist_ok=True)
    (memory_dir / "sc_0001.json").write_text(
        json.dumps(
            {
                "schema_version": "SceneMemoryPacket v1",
                "summary": "Mara forced the door open.",
                "unresolved": ["The whisper still lingered."],
                "emotional_carryover": "Mara is rattled but determined.",
                "location_state": "Basement hallway remains dim.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    packet = assemble_scene_memory_packet(
        project_root=project_root,
        scene=_scene(),
        prior_scene_id="sc_0001",
        prior_excerpt="The basement smelled of rust.",
        chapter_context="Act I - Chapter One",
        locked_facts=["The house is sealed."],
    )

    assert packet.prior_summary == "Mara forced the door open."
    assert packet.unresolved_tensions == ["The whisper still lingered."]
    assert packet.emotional_carryover == "Mara is rattled but determined."
    assert packet.location_state == "Basement hallway remains dim."
    assert packet.locked_facts == ["The house is sealed."]
    assert packet.chapter_context == "Act I - Chapter One"


def test_extract_carryover_summarizes_changes() -> None:
    text = (
        "Mara forced the door open. "
        "She discovered a cracked mirror. "
        "But the whisper still lingered in the hall."
    )
    payload = extract_carryover(text)
    assert payload["summary"] == "Mara forced the door open"
    assert payload["reveals"]
    assert payload["unresolved"]


def test_evaluate_continuity_flags_issues() -> None:
    memory = SceneMemoryPacket(
        prior_excerpt="rusted door shuddered",
        prior_summary="Mara forced the door open.",
        unresolved_tensions=["The whisper still lingered."],
        emotional_carryover="Mara is rattled.",
        location_state="Basement hallway remains dim.",
        locked_facts=["The house is sealed"],
        chapter_context="Act I - Chapter One",
    )
    text = "I remember that previously, Mara said the house is not the house is sealed."
    report = evaluate_continuity(text=text, pov="Mara", memory=memory)
    assert report["has_issues"] is True
    assert "pov_mismatch" in report["issues"]
    assert "locked_fact_contradiction" in report["issues"]
    assert "reset_scaffold" in report["issues"]
