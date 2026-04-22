"""Continuity context assembly for scene-draft prompts."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .advisory_memory_resolver import resolve_advisory_memory_packet
from .memory_lab.options import MemoryLabRuntimeOptions
from .memory_lab.schemas import ResolvedMemoryPacket
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
    resolved_memory: ResolvedMemoryPacket | None


@dataclass(frozen=True)
class ContinuityContextPayload:
    prior_context: str | None
    prior_scene_id: str | None
    chapter_title: str | None
    chapter_context: str | None
    locked_facts: list[str]
    memory_packet: SceneMemoryPacket


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


def _read_outline_context(project_root: Path | None) -> tuple[dict[str, str], list[str]]:
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
    if lines and lines[0].strip() == "---":
        try:
            end_index = lines[1:].index("---") + 1
            lines = lines[end_index + 1 :]
        except ValueError:
            pass
    excerpt = " ".join(lines[:5]).strip()
    return (excerpt or None), prior_scene.id


def build_continuity_context(
    *,
    scene: OutlineScene,
    project_root: Path | None,
    scene_lookup: dict[str, OutlineScene],
) -> ContinuityContextPayload:
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
    return ContinuityContextPayload(
        prior_context=prior_context,
        prior_scene_id=prior_scene_id,
        chapter_title=chapter_title,
        chapter_context=chapter_context,
        locked_facts=locked_facts,
        memory_packet=memory_packet,
    )


def assemble_scene_context(
    *,
    scene: OutlineScene,
    front_matter: dict[str, Any],
    overrides: DraftUnitOverrides | None,
    project_root: Path | None,
    scene_lookup: dict[str, OutlineScene],
    memory_lab_options: MemoryLabRuntimeOptions | None = None,
) -> SceneContext:
    notes: list[str] = []
    if overrides and overrides.purpose:
        notes.append(f"Purpose override: {overrides.purpose}")
    if overrides and overrides.emotion_tag:
        notes.append(f"Emotion override: {overrides.emotion_tag}")
    if overrides and overrides.word_target is not None:
        notes.append(f"Word target override: {overrides.word_target}")

    continuity = build_continuity_context(
        scene=scene,
        project_root=project_root,
        scene_lookup=scene_lookup,
    )
    if memory_lab_options is None:
        notes.append("Memory Lab options omitted; advisory memory skipped.")
        resolved_memory = None
    elif not memory_lab_options.enabled:
        resolved_memory = None
    else:
        resolved_memory = resolve_advisory_memory_packet(
            project_root=project_root,
            current_scene_id=scene.id,
            current_chapter_id=scene.chapter_id,
            current_scene_order=scene.order,
            memory_lab_options=memory_lab_options,
        )

    return SceneContext(
        scene_id=scene.id,
        title=scene.title,
        chapter_id=scene.chapter_id,
        chapter_title=continuity.chapter_title,
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
        prior_context=continuity.prior_context,
        chapter_context=continuity.chapter_context,
        locked_facts=continuity.locked_facts,
        notes=notes,
        memory=continuity.memory_packet,
        resolved_memory=resolved_memory,
    )


__all__ = [
    "SceneContext",
    "ContinuityContextPayload",
    "build_continuity_context",
    "assemble_scene_context",
]
