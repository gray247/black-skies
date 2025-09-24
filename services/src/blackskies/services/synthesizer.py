"""Deterministic text synthesis for draft generation."""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass
from typing import Iterable

from .project_repository import ProjectData, SceneMeta, SceneSummary

_PURPOSE_OPTIONS: tuple[str, ...] = ("setup", "escalation", "payoff", "breath")
_EMOTION_OPTIONS: tuple[str, ...] = ("dread", "tension", "respite", "revelation", "aftermath")


@dataclass(frozen=True)
class SynthesizedScene:
    """Container for synthesized scene data."""

    meta: SceneMeta
    body: str


def derive_unit_seed(project_id: str, scene_id: str, request_seed: int | None) -> int:
    """Derive a deterministic seed for a scene."""

    seed_material = f"{project_id}:{scene_id}:{request_seed if request_seed is not None else 'auto'}"
    digest = hashlib.sha256(seed_material.encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big")


def synthesize_scene(
    project: ProjectData,
    scene: SceneSummary,
    derived_seed: int,
    temperature: float | None,
) -> SynthesizedScene:
    """Generate deterministic front-matter metadata and prose for a scene."""

    rng = random.Random(derived_seed)
    purpose = _choose_with_rng(_PURPOSE_OPTIONS, rng)
    emotion = _choose_with_rng(_EMOTION_OPTIONS, rng)
    pov = _derive_pov(scene, rng)
    word_target = _estimate_word_target(scene, emotion)

    meta = SceneMeta(pov=pov, purpose=purpose, emotion_tag=emotion, word_target=word_target)
    body = _compose_body(project, scene, meta, derived_seed, temperature)
    return SynthesizedScene(meta=meta, body=body)


def _choose_with_rng(options: Iterable[str], rng: random.Random) -> str:
    choices = tuple(options)
    index = rng.randrange(len(choices))
    return choices[index]


def _derive_pov(scene: SceneSummary, rng: random.Random) -> str:
    tokens = [token for token in scene.title.split() if token.isalpha()]
    if not tokens:
        tokens = [scene.id.upper()]
    focus = rng.choice(tokens)
    return f"{focus} Observer"


def _estimate_word_target(scene: SceneSummary, emotion: str) -> int:
    base = 950 + scene.order * 75
    emotion_weight = 100 if emotion in {"dread", "revelation"} else 50
    beat_bonus = 40 * len(scene.beat_refs)
    return base + emotion_weight + beat_bonus


def _compose_body(
    project: ProjectData,
    scene: SceneSummary,
    meta: SceneMeta,
    derived_seed: int,
    temperature: float | None,
) -> str:
    chapter_title = "Standalone"
    if scene.chapter_id and scene.chapter_id in project.outline.chapters_by_id:
        chapter_title = project.outline.chapters_by_id[scene.chapter_id].title

    beat_fragment = "no locked beats"
    if scene.beat_refs:
        beat_fragment = ", ".join(scene.beat_refs)

    temperature_text = f"{temperature:.2f}" if temperature is not None else "default"

    paragraphs = [
        (
            f"Scene {scene.order} — {scene.title} (Chapter: {chapter_title}) anchors the {meta.purpose} "
            f"phase of {project.metadata.name}."
        ),
        (
            f"The {meta.pov} guides the moment with an emotion tag of {meta.emotion_tag}; locked beats: {beat_fragment}."
        ),
        (
            f"Deterministic seed {derived_seed} with temperature {temperature_text} crafts this pass at approximately "
            f"{meta.word_target} words."
        ),
    ]

    return "\n\n".join(paragraphs)


__all__ = [
    "SynthesizedScene",
    "derive_unit_seed",
    "synthesize_scene",
]
