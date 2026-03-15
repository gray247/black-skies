from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.long_form import (
    ChapterMemoryPacket,
    LongFormChunk,
    aggregate_long_form_budget,
    assemble_chapter_memory,
    assemble_continuation_packet,
    evaluate_long_form_output,
    trim_initial_reasoning_block,
    extract_narrative_prose,
    normalize_long_form_output,
    load_long_form_chunk,
    persist_long_form_chunk,
    persist_long_form_text,
)


def test_assemble_chapter_memory_aggregates(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_chapter"
    continuity = project_root / ".blackskies" / "continuity"
    continuity.mkdir(parents=True, exist_ok=True)
    (continuity / "sc_0001.json").write_text(
        json.dumps(
            {
                "summary": "Mara forced the door open.",
                "unresolved": ["The whisper still lingered."],
                "emotional_carryover": "Mara is rattled.",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (continuity / "sc_0002.json").write_text(
        json.dumps(
            {
                "summary": "The parlor lights flickered.",
                "unresolved": ["A shadow moved in the hall."],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (project_root / "locked_facts.json").write_text(
        json.dumps(["The house is sealed."]),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "acts": ["Act I: Gathered Storm"],
                "chapters": [{"id": "ch_0001", "title": "Chapter One"}],
            }
        ),
        encoding="utf-8",
    )

    memory = assemble_chapter_memory(
        project_root=project_root,
        chapter_id="ch_0001",
        scene_ids=["sc_0001", "sc_0002"],
    )

    assert memory.accumulated_summaries == [
        "Mara forced the door open.",
        "The parlor lights flickered.",
    ]
    assert memory.unresolved_tensions == [
        "The whisper still lingered.",
        "A shadow moved in the hall.",
    ]
    assert memory.emotional_carryover == "Mara is rattled."
    assert memory.locked_facts == ["The house is sealed."]
    assert memory.chapter_context == "Act I: Gathered Storm - Chapter One"


def test_continuation_packet_uses_prior_summary() -> None:
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context=None,
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
    )
    previous_chunk = LongFormChunk(
        chunk_id="lf_001",
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        order=1,
        continuation_of=None,
        prompt_fingerprint="sha256:test",
        provider="ollama",
        model="qwen3:4b",
        continuity_snapshot={"summary": "Mara forced the door open."},
        budget_snapshot={"estimated_usd": 0.5},
    )
    packet = assemble_continuation_packet(
        chunk_id="lf_002",
        chapter_id="ch_0001",
        order=2,
        previous_chunk=previous_chunk,
        previous_text="The door shuddered.",
        chapter_memory=chapter_memory,
        target_words=900,
    )

    assert packet.prior_summary == "Mara forced the door open."
    assert packet.prior_excerpt is not None


def test_continuation_packet_falls_back_to_text_summary() -> None:
    chapter_memory = ChapterMemoryPacket(
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        chapter_context=None,
        locked_facts=[],
        accumulated_summaries=[],
        unresolved_tensions=[],
        emotional_carryover=None,
        pacing_carryover=None,
    )
    packet = assemble_continuation_packet(
        chunk_id="lf_002",
        chapter_id="ch_0001",
        order=2,
        previous_chunk=None,
        previous_text="Mara stepped into the hall. Shadows moved.",
        chapter_memory=chapter_memory,
        target_words=None,
        constraints=["Keep the tone tense."],
    )

    assert packet.prior_summary == "Mara stepped into the hall"
    assert packet.constraints == ["Keep the tone tense."]


def test_long_form_validation_rejects_meta_summary() -> None:
    text = "Summary: The scene will introduce the conflict."
    report = evaluate_long_form_output(text)
    assert report["usable"] is False
    assert report["meta_summary"] is True


def test_long_form_validation_accepts_prose() -> None:
    text = (
        "Mara pushed the door, and the hinges groaned. " * 10
        + "\n\n"
        + "The hallway breathed cold air around her boots. " * 8
    )
    report = evaluate_long_form_output(text, prior_excerpt="door hinges groaned")
    assert report["usable"] is True


def test_long_form_validation_rejects_short_prose() -> None:
    text = "Mara listened to the rain on the window and kept her hand on the latch. " * 6
    report = evaluate_long_form_output(text)
    assert report["usable"] is False


def test_normalize_long_form_output_strips_prompt_headers() -> None:
    raw = (
        "Chapter: Act I - The Summons\n"
        "Scene ids: sc_0001\n"
        "Prior summary: Mara forced the door.\n"
        "\n"
        "Mara stepped into the hall, the air cold and damp. "
        "Mara stepped into the hall, the air cold and damp. "
        "Mara stepped into the hall, the air cold and damp.\n"
    )
    cleaned = normalize_long_form_output(raw)
    assert cleaned is not None
    assert "Chapter:" not in cleaned
    assert "Scene ids:" not in cleaned
    assert "Prior summary:" not in cleaned


def test_extract_narrative_prose_skips_reasoning_paragraph() -> None:
    raw = (
        "Okay, the user wants me to write an immersive scene.\n\n"
        "Mara stepped into the hall, the air cold and damp. "
        "Mara stepped into the hall, the air cold and damp. "
        "Mara stepped into the hall, the air cold and damp.\n\n"
        "The floorboards creaked beneath her boots."
    )
    cleaned = extract_narrative_prose(raw)
    assert cleaned is not None
    assert cleaned.startswith("Mara stepped into the hall")


def test_extract_narrative_prose_trims_single_paragraph_reasoning() -> None:
    raw = (
        "Okay, the user wants me to write an immersive scene. "
        "Mara stepped into the hall, the air cold and damp. "
        "The floorboards creaked beneath her boots."
    )
    cleaned = extract_narrative_prose(raw)
    assert cleaned is not None
    assert cleaned.startswith("Mara stepped into the hall")


def test_extract_narrative_prose_drops_planning_only_output() -> None:
    raw = (
        "The user wants me to write an immersive scene. "
        "The word count should be between 540-660 words. "
        "No headings or meta commentary."
    )
    cleaned = extract_narrative_prose(raw)
    assert cleaned == ""


def test_trim_initial_reasoning_block_removes_preface() -> None:
    raw = (
        "Okay, I should write the scene now.\n\n"
        "Mara stepped into the hall, the air cold and damp. "
        "The floorboards creaked beneath her boots."
    )
    cleaned, applied = trim_initial_reasoning_block(raw)
    assert applied is True
    assert cleaned is not None
    assert cleaned.startswith("Mara stepped into the hall")


def test_trim_initial_reasoning_block_keeps_narrative() -> None:
    raw = (
        "Mara stepped into the hall, the air cold and damp.\n\n"
        "The floorboards creaked beneath her boots."
    )
    cleaned, applied = trim_initial_reasoning_block(raw)
    assert applied is False
    assert cleaned == raw


def test_chunk_persistence_and_budget_aggregation(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_chunks"
    chunk = LongFormChunk(
        chunk_id="lf_001",
        chapter_id="ch_0001",
        scene_ids=["sc_0001"],
        order=1,
        continuation_of=None,
        prompt_fingerprint="sha256:test",
        provider="ollama",
        model="qwen3:4b",
        continuity_snapshot={"summary": "Mara forced the door open."},
        budget_snapshot={"estimated_usd": 0.4},
    )
    persist_long_form_chunk(project_root, chunk)
    loaded = load_long_form_chunk(project_root, "lf_001")

    assert loaded is not None
    assert loaded.chunk_id == "lf_001"
    summary = aggregate_long_form_budget([loaded])
    assert summary["estimated_usd"] == 0.4


def test_long_form_text_round_trip_utf8(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_text"
    text = "Mara’s door — “shut,” she whispered."
    path = persist_long_form_text(project_root, "lf_utf8", text)
    assert path.read_text(encoding="utf-8-sig") == text
