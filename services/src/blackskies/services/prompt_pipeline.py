"""Prompt pipeline utilities for provider-backed generation."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from .models.draft import DraftUnitOverrides
from .models.outline import OutlineScene
from .scene_memory import SceneMemoryPacket, assemble_scene_memory_packet


@dataclass(frozen=True)
class SceneContext:
    """Structured context packet for scene draft prompts."""

    scene_id: str
    title: str
    chapter_id: str | None
    chapter_title: str | None
    order: int
    pov: str | None
    purpose: str | None
    pacing_target: str | None
    beat_refs: list[str]
    goal: str | None
    conflict: str | None
    turn: str | None
    emotion: str | None
    word_target: int | None
    prior_context: str | None
    chapter_context: str | None
    locked_facts: list[str]
    notes: list[str]
    memory: SceneMemoryPacket | None


def _read_locked_facts(project_root: Path | None) -> list[str]:
    if project_root is None:
        return []
    candidates = [
        project_root / "locked_facts.json",
        project_root / ".blackskies" / "locked_facts.json",
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(payload, list):
            return [str(item).strip() for item in payload if str(item).strip()]
        if isinstance(payload, dict):
            facts = payload.get("facts")
            if isinstance(facts, list):
                return [str(item).strip() for item in facts if str(item).strip()]
    return []


def _read_outline_context(
    project_root: Path | None,
) -> tuple[dict[str, str], list[str]]:
    if project_root is None:
        return {}, []
    outline_path = project_root / "outline.json"
    if not outline_path.exists():
        return {}, []
    try:
        payload = json.loads(outline_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}, []
    if not isinstance(payload, dict):
        return {}, []
    chapters = payload.get("chapters")
    chapter_lookup: dict[str, str] = {}
    if isinstance(chapters, list):
        for entry in chapters:
            if not isinstance(entry, dict):
                continue
            chapter_id = entry.get("id")
            title = entry.get("title")
            if isinstance(chapter_id, str) and isinstance(title, str):
                chapter_lookup[chapter_id] = title
    acts = payload.get("acts")
    act_titles: list[str] = []
    if isinstance(acts, list):
        act_titles = [str(item).strip() for item in acts if str(item).strip()]
    return chapter_lookup, act_titles


def _resolve_prior_context(
    project_root: Path | None,
    scene: OutlineScene,
    scene_lookup: dict[str, OutlineScene],
) -> tuple[str | None, str | None]:
    if project_root is None:
        return None, None
    previous = [
        candidate
        for candidate in scene_lookup.values()
        if candidate.chapter_id == scene.chapter_id and candidate.order == scene.order - 1
    ]
    if not previous:
        return None, None
    prior_scene = previous[0]
    draft_path = project_root / "drafts" / f"{prior_scene.id}.md"
    if not draft_path.exists():
        return None, prior_scene.id
    try:
        content = draft_path.read_text(encoding="utf-8")
    except OSError:
        return None, prior_scene.id
    lines = [line for line in content.splitlines() if line.strip()]
    # Skip front-matter if present.
    if lines and lines[0].strip() == "---":
        try:
            end_index = lines[1:].index("---") + 1
            lines = lines[end_index + 1 :]
        except ValueError:
            pass
    excerpt = " ".join(lines[:5]).strip()
    return (excerpt or None), prior_scene.id


def assemble_scene_context(
    *,
    scene: OutlineScene,
    front_matter: dict[str, Any],
    overrides: DraftUnitOverrides | None,
    project_root: Path | None,
    scene_lookup: dict[str, OutlineScene],
) -> SceneContext:
    notes: list[str] = []
    if overrides and overrides.purpose:
        notes.append(f"Purpose override: {overrides.purpose}")
    if overrides and overrides.emotion_tag:
        notes.append(f"Emotion override: {overrides.emotion_tag}")
    if overrides and overrides.word_target is not None:
        notes.append(f"Word target override: {overrides.word_target}")

    prior_context, prior_scene_id = _resolve_prior_context(project_root, scene, scene_lookup)
    locked_facts = _read_locked_facts(project_root)
    chapter_lookup, act_titles = _read_outline_context(project_root)
    chapter_title = chapter_lookup.get(scene.chapter_id) if scene.chapter_id else None
    chapter_context = None
    if chapter_title:
        chapter_context = chapter_title
        if act_titles:
            chapter_context = f"{act_titles[0]} - {chapter_title}"

    memory_packet = assemble_scene_memory_packet(
        project_root=project_root,
        scene=scene,
        prior_scene_id=prior_scene_id,
        prior_excerpt=prior_context,
        chapter_context=chapter_context,
        locked_facts=locked_facts,
    )

    return SceneContext(
        scene_id=scene.id,
        title=scene.title,
        chapter_id=scene.chapter_id,
        chapter_title=chapter_title,
        order=scene.order,
        pov=front_matter.get("pov"),
        purpose=front_matter.get("purpose"),
        pacing_target=front_matter.get("pacing_target"),
        beat_refs=list(scene.beat_refs),
        goal=front_matter.get("goal"),
        conflict=front_matter.get("conflict"),
        turn=front_matter.get("turn"),
        emotion=front_matter.get("emotion_tag"),
        word_target=front_matter.get("word_target"),
        prior_context=prior_context,
        chapter_context=chapter_context,
        locked_facts=locked_facts,
        notes=notes,
        memory=memory_packet,
    )


@dataclass(frozen=True)
class ProviderProfile:
    name: str
    draft_style: list[str]


LOCAL_OLLAMA_FAST_DRAFT = ProviderProfile(
    name="local_ollama_fast_draft",
    draft_style=[
        "Write immersive scene prose, not a summary or outline.",
        "Anchor every paragraph in concrete sensory detail and physical action.",
        "Stay inside the POV character's immediate perceptions and inner reactions.",
        "Let dialogue appear naturally when characters are present.",
        "Avoid headings, bullet points, or meta commentary.",
        "Write in continuous paragraphs with natural scene flow.",
    ],
)

LOCAL_OLLAMA_STRUCTURED_EVAL = ProviderProfile(
    name="local_ollama_structured_eval",
    draft_style=[
        "Write a clean scene draft with clear beats and readable pacing.",
        "Keep prose grounded in action and sensory detail, avoid summarizing.",
        "Use short dialogue exchanges sparingly to break up narration.",
        "Avoid headings, bullet points, or meta commentary.",
        "Write in continuous paragraphs with natural scene flow.",
    ],
)

REMOTE_OPENAI_HEAVY_DRAFT = ProviderProfile(
    name="remote_openai_heavy_draft",
    draft_style=[
        "Write immersive, high-fidelity scene prose (not a summary).",
        "Emphasize vivid sensory grounding, subtext, and internal POV.",
        "Balance action beats with reflective interiority and dialogue.",
        "Avoid headings, bullet points, or meta commentary.",
        "Write in continuous paragraphs with natural scene flow.",
    ],
)

DEFAULT_PROFILE = LOCAL_OLLAMA_FAST_DRAFT


def select_profile(provider_name: str | None) -> ProviderProfile:
    if provider_name == "ollama":
        return LOCAL_OLLAMA_FAST_DRAFT
    if provider_name == "openai":
        return REMOTE_OPENAI_HEAVY_DRAFT
    return DEFAULT_PROFILE


def compile_draft_prompt(context: SceneContext, profile: ProviderProfile | None = None) -> str:
    profile = profile or DEFAULT_PROFILE
    beat_line = ", ".join(context.beat_refs) if context.beat_refs else "None"
    notes_line = " | ".join(context.notes) if context.notes else "None"
    locked_line = "; ".join(context.locked_facts) if context.locked_facts else "None"
    memory = context.memory

    lines: list[str] = []
    lines.extend(profile.draft_style)
    lines.extend(
        [
            f"Scene title: {context.title}",
            f"Chapter: {context.chapter_context or context.chapter_id}",
            f"POV: {context.pov}",
            f"Purpose: {context.purpose}",
            f"Goal: {context.goal}",
            f"Conflict: {context.conflict}",
            f"Turn: {context.turn}",
            f"Emotion: {context.emotion}",
            f"Target words: {context.word_target}",
            f"Pacing target: {context.pacing_target}",
            f"Beats: {beat_line}",
            f"Locked facts: {locked_line}",
            f"Notes: {notes_line}",
        ]
    )
    if memory:
        if memory.prior_summary:
            lines.append(f"Prior outcome: {memory.prior_summary}")
        if memory.unresolved_tensions:
            lines.append(f"Unresolved tensions: {', '.join(memory.unresolved_tensions)}")
        if memory.emotional_carryover:
            lines.append(f"Emotional carryover: {memory.emotional_carryover}")
        if memory.location_state:
            lines.append(f"Location state: {memory.location_state}")
    if context.prior_context:
        lines.append(f"Prior context: {context.prior_context}")
    lines.append("Return plain text only, no markdown fences.")
    return "\n".join(lines)


def _meta_summary_detected(text: str) -> bool:
    lowered = text.lower()
    markers = [
        "scene title:",
        "pov:",
        "goal:",
        "conflict:",
        "turn:",
        "emotion:",
        "beats:",
        "notes:",
        "summary:",
    ]
    if any(marker in lowered for marker in markers):
        return True
    list_lines = [line for line in text.splitlines() if line.strip().startswith(("-", "*"))]
    if list_lines and len(list_lines) >= max(2, len(text.splitlines()) // 2):
        return True
    return False


def _dialogue_presence(text: str) -> bool:
    return "\"" in text


def _sensory_presence(text: str) -> bool:
    tokens = {token.strip(".,;:!?").lower() for token in text.split()}
    sensory = {"cold", "warm", "heat", "damp", "scent", "smell", "sour", "sweet", "bitter", "metal", "metallic", "echo", "glow", "shadow", "dark", "light", "whisper", "thud", "hiss"}
    return bool(tokens.intersection(sensory))


def evaluate_draft_quality(text: str | None) -> dict[str, Any]:
    if not isinstance(text, str):
        return {"usable": False, "reason": "not_text"}
    stripped = text.strip()
    if not stripped:
        return {"usable": False, "reason": "empty"}
    words = [token for token in stripped.split() if token]
    word_count = len(words)
    meta = _meta_summary_detected(stripped)
    dialogue = _dialogue_presence(stripped)
    sensory = _sensory_presence(stripped)
    prose_density = word_count / max(len(stripped.splitlines()), 1)
    usable = word_count >= 40 and not meta
    return {
        "usable": usable,
        "word_count": word_count,
        "prose_density": prose_density,
        "meta_summary": meta,
        "dialogue": dialogue,
        "sensory": sensory,
    }


def is_usable_draft(text: str | None) -> bool:
    if not isinstance(text, str):
        return False
    stripped = text.strip()
    if not stripped:
        return False
    words = [token for token in stripped.split() if token]
    if len(words) < 40:
        return False
    if _meta_summary_detected(stripped):
        return False
    return True


__all__ = [
    "SceneContext",
    "ProviderProfile",
    "LOCAL_OLLAMA_FAST_DRAFT",
    "LOCAL_OLLAMA_STRUCTURED_EVAL",
    "REMOTE_OPENAI_HEAVY_DRAFT",
    "select_profile",
    "assemble_scene_context",
    "compile_draft_prompt",
    "is_usable_draft",
    "evaluate_draft_quality",
]
