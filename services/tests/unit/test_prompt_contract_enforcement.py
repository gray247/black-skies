from __future__ import annotations

from dataclasses import replace

from blackskies.services.memory_lab.schemas import ResolvedMemoryPacket
from blackskies.services.models.outline import OutlineScene
from blackskies.services.prompt_pipeline import assemble_scene_context, compile_draft_prompt, select_profile


def _scene() -> OutlineScene:
    return OutlineScene(
        id="sc_0100",
        order=100,
        title="Contested Room",
        chapter_id="ch_0001",
        beat_refs=["turn"],
    )


def test_prompt_contract_winner_always_surfaced() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=None,
        scene_lookup={"sc_0100": _scene()},
    )
    resolved = ResolvedMemoryPacket(
        selected_summary="winner summary",
        selected_unresolved_tensions=[],
        selected_emotional_carryover=None,
        selected_location_state=None,
        alternate_interpretation=None,
        selected_artifact_ids=["winner"],
        resolver_notes=[],
    )
    prompt = compile_draft_prompt(replace(context, resolved_memory=resolved), profile=select_profile("ollama"))
    assert "Prior outcome: winner summary" in prompt


def test_prompt_contract_alternate_surfaced_when_qualified_and_within_budget() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=None,
        scene_lookup={"sc_0100": _scene()},
    )
    resolved = ResolvedMemoryPacket(
        selected_summary="winner summary",
        selected_unresolved_tensions=[],
        selected_emotional_carryover=None,
        selected_location_state=None,
        alternate_interpretation="close alternate",
        selected_artifact_ids=["winner"],
        resolver_notes=[],
    )
    prompt = compile_draft_prompt(replace(context, resolved_memory=resolved), profile=select_profile("ollama"))
    assert "Prior outcome: winner summary" in prompt
    assert "Alternate reading: close alternate" in prompt


def test_prompt_contract_drops_alternate_first_under_budget_pressure() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=None,
        scene_lookup={"sc_0100": _scene()},
    )
    large_alternate = " ".join(["alternate"] * 400)
    resolved = ResolvedMemoryPacket(
        selected_summary="winner summary",
        selected_unresolved_tensions=[],
        selected_emotional_carryover=None,
        selected_location_state=None,
        alternate_interpretation=large_alternate,
        selected_artifact_ids=["winner"],
        resolver_notes=[],
    )
    prompt = compile_draft_prompt(replace(context, resolved_memory=resolved), profile=select_profile("ollama"))
    assert "Prior outcome: winner summary" in prompt
    assert "Alternate reading:" not in prompt
