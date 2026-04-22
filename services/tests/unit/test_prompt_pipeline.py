from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path
from unittest.mock import Mock

from blackskies.services.config import ServiceSettings
from blackskies.services.memory_lab.constants import MEMORY_LAB_SCHEMA_VERSION
from blackskies.services.memory_lab.schemas import (
    MemoryArtifact,
    MemoryLedgerEntry,
    ResolvedMemoryPacket,
)
from blackskies.services.memory_lab.storage import write_ledger_entry
from blackskies.services.memory_lab import resolver as resolver_module
from blackskies.services.models.draft import DraftUnitOverrides
from blackskies.services.models.outline import OutlineScene
from blackskies.services.prompt_pipeline import (
    assemble_scene_context,
    compile_draft_prompt,
    evaluate_draft_quality,
    is_usable_draft,
    select_profile,
)
from blackskies.services.continuity_context_builder import build_continuity_context
import blackskies.services.advisory_memory_resolver as advisory_memory_resolver_module
import blackskies.services.prompt_pipeline as prompt_pipeline_module


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
        "---\n" "id: sc_0001\n" "---\n" "The floorboards creak.\n" "Dust hangs in the air.\n",
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


def test_build_continuity_context_separates_scene_memory_inputs(tmp_path: Path) -> None:
    project_root = tmp_path / "proj_continuity_builder"
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "The floorboards creak.\nDust hangs in the air.\n",
        encoding="utf-8",
    )
    (project_root / ".blackskies").mkdir(parents=True, exist_ok=True)
    (project_root / ".blackskies" / "locked_facts.json").write_text(
        json.dumps({"facts": ["The house is sealed."]}, indent=2),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps(
            {
                "acts": ["Act I: Gathered Storm"],
                "chapters": [{"id": "ch_0001", "title": "Chapter One"}],
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

    payload = build_continuity_context(
        scene=_scene(),
        project_root=project_root,
        scene_lookup=lookup,
    )

    assert payload.prior_scene_id == "sc_0001"
    assert payload.prior_context is not None
    assert "floorboards" in payload.prior_context
    assert payload.locked_facts == ["The house is sealed."]
    assert payload.chapter_title == "Chapter One"
    assert payload.chapter_context == "Act I: Gathered Storm - Chapter One"
    assert payload.memory_packet.locked_facts == ["The house is sealed."]


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


def test_prompt_contract_surfaces_alternate_when_within_budget() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara", "word_target": 900},
        overrides=None,
        project_root=None,
        scene_lookup={"sc_0002": _scene()},
    )
    resolved = ResolvedMemoryPacket(
        selected_summary="winner summary",
        selected_unresolved_tensions=[],
        selected_emotional_carryover=None,
        selected_location_state=None,
        alternate_interpretation="close alternate",
        selected_artifact_ids=["a"],
        resolver_notes=[],
    )
    prompt = compile_draft_prompt(
        replace(context, resolved_memory=resolved), profile=select_profile("ollama")
    )
    assert "Prior outcome: winner summary" in prompt
    assert "Alternate reading: close alternate" in prompt


def test_prompt_contract_drops_alternate_first_when_budget_exceeded() -> None:
    context = assemble_scene_context(
        scene=_scene(),
        front_matter={"pov": "Mara", "word_target": 900},
        overrides=None,
        project_root=None,
        scene_lookup={"sc_0002": _scene()},
    )
    huge_alternate = " ".join(["alt"] * 200)
    resolved = ResolvedMemoryPacket(
        selected_summary="winner summary",
        selected_unresolved_tensions=[],
        selected_emotional_carryover=None,
        selected_location_state=None,
        alternate_interpretation=huge_alternate,
        selected_artifact_ids=["a"],
        resolver_notes=[],
    )
    prompt = compile_draft_prompt(
        replace(context, resolved_memory=resolved), profile=select_profile("ollama")
    )
    assert "Prior outcome: winner summary" in prompt
    assert "Alternate reading:" not in prompt


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
        memory_lab_options=ServiceSettings(
            project_base_dir=tmp_path,
            memory_lab_enabled=True,
        ).memory_lab_runtime_options(),
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
        memory_lab_options=ServiceSettings(
            project_base_dir=tmp_path,
            memory_lab_enabled=True,
        ).memory_lab_runtime_options(),
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
        'She whispered, "Who\'s there?" The reply was only the soft shiver of curtains. '
        "A cold draft curled around her wrists, carrying the smell of old rain."
    )
    metrics = evaluate_draft_quality(prose)
    assert metrics["usable"] is True
    assert metrics["dialogue"] is True


def test_select_profile_prefers_openai() -> None:
    profile = select_profile("openai")
    assert profile.name == "remote_openai_heavy_draft"


def test_select_profile_uses_prompt_profile_key() -> None:
    profile = select_profile("local_ollama_fast_draft")
    assert profile.name == "local_ollama_fast_draft"


def test_current_scene_order_is_threaded_into_memory_resolution(
    monkeypatch, tmp_path: Path
) -> None:
    captured: dict[str, int | float | str | bool | None] = {}

    def _stub_orchestrate_memory_resolution(
        *,
        project_root,
        current_scene_id,
        current_chapter_id,
        current_scene_order,
        options,
        **_kwargs,
    ):
        _ = project_root
        captured["current_scene_id"] = current_scene_id
        captured["current_chapter_id"] = current_chapter_id
        captured["current_scene_order"] = current_scene_order
        captured["max_unresolved"] = options.max_unresolved
        captured["alternate_interpretation_threshold"] = options.alternate_interpretation_threshold
        captured["reinforcement_enabled"] = options.reinforcement_enabled
        captured["decay_enabled"] = options.decay_enabled
        captured["low_confidence_fallback_threshold"] = (
            options.decay_low_confidence_fallback_threshold
        )
        return (
            ResolvedMemoryPacket(
                selected_summary=None,
                selected_unresolved_tensions=[],
                selected_emotional_carryover=None,
                selected_location_state=None,
                alternate_interpretation=None,
                selected_artifact_ids=[],
                resolver_notes=[],
            ),
            Mock(),
        )

    monkeypatch.setattr(
        advisory_memory_resolver_module,
        "orchestrate_memory_resolution",
        _stub_orchestrate_memory_resolution,
    )
    options = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_enabled=True,
        memory_lab_max_candidates=12,
        memory_lab_max_unresolved=4,
        memory_lab_alternate_interpretation_threshold=0.11,
        memory_lab_reinforcement_enabled=True,
        memory_lab_anchor_enabled=True,
        memory_lab_anchor_auto_threshold=3,
        memory_lab_decay_enabled=True,
        memory_lab_decay_base_rate=0.03,
        memory_lab_decay_min_weight=0.05,
        memory_lab_decay_fading_threshold=0.40,
        memory_lab_decay_suppressed_threshold=0.20,
        memory_lab_decay_archived_threshold=0.10,
        memory_lab_decay_log_anchor_protection=False,
        memory_lab_decay_allow_revival=True,
        memory_lab_decay_suppressed_fallback_enabled=True,
        memory_lab_decay_low_confidence_fallback_threshold=0.27,
        memory_lab_reinforcement_event_retention_limit=200,
        memory_lab_decay_event_retention_limit=200,
        memory_lab_debug_logging=False,
    ).memory_lab_runtime_options()

    scene = OutlineScene(
        id="sc_0100",
        order=42,
        title="Signal Chamber",
        chapter_id="ch_0007",
        beat_refs=["turn"],
    )
    project_root = tmp_path / "proj_scene_order"
    write_ledger_entry(
        project_root,
        MemoryLedgerEntry(
            scene_id="sc_0099",
            chapter_id="ch_0007",
            schema_version=MEMORY_LAB_SCHEMA_VERSION,
            artifacts=[
                MemoryArtifact(
                    artifact_id="art_0099",
                    schema_version="memory_artifact_v2",
                    artifact_type="summary",
                    scene_id="sc_0099",
                    chapter_id="ch_0007",
                    source_excerpt=None,
                    content="Prior summary",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=41,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                )
            ],
            source_summary=None,
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )
    context = assemble_scene_context(
        scene=scene,
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=project_root,
        scene_lookup={scene.id: scene},
        memory_lab_options=options,
    )

    assert context.scene_id == "sc_0100"
    assert captured["current_scene_id"] == "sc_0100"
    assert captured["current_chapter_id"] == "ch_0007"
    assert captured["current_scene_order"] == 42
    assert captured["max_unresolved"] == 4
    assert captured["alternate_interpretation_threshold"] == 0.11
    assert captured["reinforcement_enabled"] is True
    assert captured["decay_enabled"] is True
    assert captured["low_confidence_fallback_threshold"] == 0.27


def test_resolve_memory_lab_packet_returns_none_when_disabled_even_if_ledger_exists(
    monkeypatch, tmp_path: Path
) -> None:
    project_root = tmp_path / "proj_disabled_gate"
    write_ledger_entry(
        project_root,
        MemoryLedgerEntry(
            scene_id="sc_0001",
            chapter_id="ch_0001",
            schema_version=MEMORY_LAB_SCHEMA_VERSION,
            artifacts=[
                MemoryArtifact(
                    artifact_id="art_001",
                    schema_version="memory_artifact_v2",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="resolver summary should not be used",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=1,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                )
            ],
            source_summary=None,
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )
    options = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_enabled=False,
    ).memory_lab_runtime_options()

    orchestrator_spy = Mock(
        side_effect=AssertionError("orchestrator should not be called when disabled")
    )
    monkeypatch.setattr(
        advisory_memory_resolver_module, "orchestrate_memory_resolution", orchestrator_spy
    )

    packet = prompt_pipeline_module._resolve_memory_lab_packet(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        memory_lab_options=options,
    )

    assert packet is None
    orchestrator_spy.assert_not_called()


def test_enabled_false_uses_legacy_continuity_only_even_when_ledger_exists(
    monkeypatch, tmp_path: Path
) -> None:
    project_root = tmp_path / "proj_legacy_only"
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text("Prior scene body.\n", encoding="utf-8")

    continuity_dir = project_root / ".blackskies" / "continuity"
    continuity_dir.mkdir(parents=True, exist_ok=True)
    (continuity_dir / "sc_0001.json").write_text(
        json.dumps(
            {
                "schema_version": "SceneMemoryPacket v1",
                "summary": "LEGACY summary should win.",
                "unresolved": ["LEGACY unresolved should win."],
                "emotional_carryover": "LEGACY emotional should win.",
                "location_state": "LEGACY location should win.",
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
                    schema_version="memory_artifact_v2",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="RESOLVED summary should NOT win.",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=10,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                )
            ],
            source_summary=None,
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )

    scene = OutlineScene(
        id="sc_0002",
        order=2,
        title="Locked Parlor",
        chapter_id="ch_0001",
        beat_refs=["turn"],
    )
    lookup = {
        "sc_0001": OutlineScene(
            id="sc_0001",
            order=1,
            title="Basement Pulse",
            chapter_id="ch_0001",
            beat_refs=["inciting"],
        ),
        "sc_0002": scene,
    }

    options = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_enabled=False,
    ).memory_lab_runtime_options()
    orchestrator_spy = Mock(
        side_effect=AssertionError("orchestrator should not be called when disabled")
    )
    monkeypatch.setattr(
        advisory_memory_resolver_module, "orchestrate_memory_resolution", orchestrator_spy
    )

    context = assemble_scene_context(
        scene=scene,
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=project_root,
        scene_lookup=lookup,
        memory_lab_options=options,
    )
    prompt = compile_draft_prompt(context, profile=select_profile("ollama"))

    assert context.resolved_memory is None
    assert "Prior outcome: LEGACY summary should win." in prompt
    assert "RESOLVED summary should NOT win." not in prompt
    orchestrator_spy.assert_not_called()


def test_resolve_memory_lab_packet_preserves_enabled_behavior(monkeypatch, tmp_path: Path) -> None:
    project_root = tmp_path / "proj_enabled_gate"
    write_ledger_entry(
        project_root,
        MemoryLedgerEntry(
            scene_id="sc_0001",
            chapter_id="ch_0001",
            schema_version=MEMORY_LAB_SCHEMA_VERSION,
            artifacts=[
                MemoryArtifact(
                    artifact_id="art_001",
                    schema_version="memory_artifact_v2",
                    artifact_type="summary",
                    scene_id="sc_0001",
                    chapter_id="ch_0001",
                    source_excerpt=None,
                    content="resolver summary should be used",
                    weight=1.0,
                    confidence=1.0,
                    recency_order=1,
                    tags=[],
                    derived_from="unit-test",
                    created_at="2026-04-12T00:00:00Z",
                )
            ],
            source_summary=None,
            source_unresolved=[],
            source_emotional_carryover=None,
            source_location_state=None,
        ),
    )
    options = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_enabled=True,
        memory_lab_max_unresolved=2,
    ).memory_lab_runtime_options()

    orchestrator_spy = Mock(
        return_value=(
            ResolvedMemoryPacket(
                selected_summary="resolver summary should be used",
                selected_unresolved_tensions=[],
                selected_emotional_carryover=None,
                selected_location_state=None,
                alternate_interpretation=None,
                selected_artifact_ids=["art_001"],
                resolver_notes=[],
            ),
            Mock(),
        )
    )
    monkeypatch.setattr(
        advisory_memory_resolver_module, "orchestrate_memory_resolution", orchestrator_spy
    )

    packet = prompt_pipeline_module._resolve_memory_lab_packet(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        memory_lab_options=options,
    )

    assert packet is not None
    assert packet.selected_summary == "resolver summary should be used"
    orchestrator_spy.assert_called_once()


def test_resolve_memory_lab_packet_none_options_disables_advisory_path(
    monkeypatch, tmp_path: Path
) -> None:
    project_root = tmp_path / "proj_none_options"
    orchestrator_spy = Mock(
        side_effect=AssertionError("orchestrator should not be called without options")
    )
    monkeypatch.setattr(
        advisory_memory_resolver_module, "orchestrate_memory_resolution", orchestrator_spy
    )

    packet = prompt_pipeline_module._resolve_memory_lab_packet(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        memory_lab_options=None,
    )

    assert packet is None
    orchestrator_spy.assert_not_called()


def test_options_omitted_adds_visibility_note_and_skips_advisory(
    monkeypatch, tmp_path: Path
) -> None:
    orchestrator_spy = Mock(
        side_effect=AssertionError("orchestrator should not be called without options")
    )
    monkeypatch.setattr(
        advisory_memory_resolver_module, "orchestrate_memory_resolution", orchestrator_spy
    )
    scene = _scene()

    context = assemble_scene_context(
        scene=scene,
        front_matter={"pov": "Mara"},
        overrides=None,
        project_root=tmp_path / "proj_omitted_options",
        scene_lookup={scene.id: scene},
        memory_lab_options=None,
    )

    assert context.resolved_memory is None
    assert any("options omitted" in note.lower() for note in context.notes)
    orchestrator_spy.assert_not_called()


def test_enabled_path_calls_orchestrator_not_direct_resolver(monkeypatch, tmp_path: Path) -> None:
    project_root = tmp_path / "proj_single_path"
    options = ServiceSettings(
        project_base_dir=tmp_path,
        memory_lab_enabled=True,
    ).memory_lab_runtime_options()

    orchestrator_spy = Mock(
        return_value=(
            ResolvedMemoryPacket(
                selected_summary="from orchestrator",
                selected_unresolved_tensions=[],
                selected_emotional_carryover=None,
                selected_location_state=None,
                alternate_interpretation=None,
                selected_artifact_ids=["art_001"],
                resolver_notes=[],
            ),
            Mock(),
        )
    )

    resolver_spy = Mock(
        side_effect=AssertionError("prompt pipeline must not call resolver directly")
    )
    monkeypatch.setattr(
        advisory_memory_resolver_module, "orchestrate_memory_resolution", orchestrator_spy
    )
    monkeypatch.setattr(resolver_module, "resolve_memory_packet", resolver_spy)

    packet = prompt_pipeline_module._resolve_memory_lab_packet(
        project_root=project_root,
        current_scene_id="sc_0002",
        current_chapter_id="ch_0001",
        current_scene_order=2,
        memory_lab_options=options,
    )

    assert packet is not None
    assert packet.selected_summary == "from orchestrator"
    orchestrator_spy.assert_called_once()
    resolver_spy.assert_not_called()
