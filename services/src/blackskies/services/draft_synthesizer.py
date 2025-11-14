"""Deterministic draft synthesis utilities."""

from __future__ import annotations

import hashlib
import json
import random
import re
from dataclasses import dataclass
from typing import Any, Sequence

from .heuristics import DEFAULT_HEURISTICS, Heuristics
from .models.draft import DraftGenerateRequest, DraftUnitOverrides
from .models.outline import OutlineScene
from .constants import WORD_TARGET_BASE, WORD_TARGET_PER_ORDER


@dataclass
class SynthesisResult:
    """Container for synthesized draft unit artifacts."""

    unit: dict[str, Any]
    front_matter: dict[str, Any]
    body: str


class DraftSynthesizer:
    """Deterministically synthesize draft units from outline metadata."""

    _MODEL = {"name": "draft-synthesizer-v1", "provider": "black-skies-local"}

    def __init__(self, heuristics: Heuristics | None = None) -> None:
        self._heuristics = heuristics or DEFAULT_HEURISTICS

    def synthesize(
        self,
        *,
        request: DraftGenerateRequest,
        scene: OutlineScene,
        overrides: DraftUnitOverrides | None,
        unit_index: int,
    ) -> SynthesisResult:
        base_seed = request.seed
        derived_seed = self._derive_seed(request.project_id, scene.id, base_seed, unit_index)
        rng = random.Random(derived_seed)

        meta = self._build_meta(scene, overrides, rng)
        body = self._build_body(scene, meta)
        front_matter = self._build_front_matter(scene, meta)
        prompt_fingerprint = self._fingerprint(
            project_id=request.project_id,
            scene_id=scene.id,
            seed=derived_seed,
            purpose=meta["purpose"],
            emotion=meta["emotion_tag"],
        )

        response_meta = {
            key: meta[key]
            for key in ("pov", "purpose", "emotion_tag", "word_target", "conflict", "conflict_type", "pacing_target")
            if meta.get(key) is not None
        }
        response_meta["order"] = meta["order"]
        response_meta["chapter_id"] = scene.chapter_id

        unit = {
            "id": scene.id,
            "text": body,
            "meta": response_meta,
            "prompt_fingerprint": prompt_fingerprint,
            "model": self._MODEL.copy(),
            "seed": derived_seed,
        }

        return SynthesisResult(unit=unit, front_matter=front_matter, body=body)

    @staticmethod
    def _derive_seed(project_id: str, scene_id: str, base_seed: int | None, unit_index: int) -> int:
        if base_seed is None:
            digest = hashlib.sha256(f"{project_id}:{scene_id}".encode("utf-8")).hexdigest()
            base_seed = int(digest[:8], 16)
        return base_seed + unit_index

    def _build_meta(
        self,
        scene: OutlineScene,
        overrides: DraftUnitOverrides | None,
        rng: random.Random,
    ) -> dict[str, Any]:
        purpose: str = (
            overrides.purpose
            if overrides and overrides.purpose
            else self._select(self._heuristics.purposes, scene.order)
        )
        emotion_tag: str = (
            overrides.emotion_tag
            if overrides and overrides.emotion_tag
            else self._select(self._heuristics.emotions, scene.order + 1)
        )
        pov: str = (
            overrides.pov
            if overrides and overrides.pov
            else self._select(self._heuristics.povs, scene.order, rng)
        )
        goal: str = (
            overrides.goal
            if overrides and overrides.goal
            else self._select(self._heuristics.goals, scene.order + 2, rng)
        )
        conflict_text: str
        conflict_type = "custom"
        if overrides and overrides.conflict:
            conflict_text = overrides.conflict
            conflict_type_override = getattr(overrides, "conflict_type", None)
            if conflict_type_override:
                conflict_type = conflict_type_override
        else:
            conflict_option = self._select(self._heuristics.conflict_options, scene.order + 3, rng)
            conflict_text = conflict_option.description
            conflict_type = conflict_option.type
        turn = (
            overrides.turn
            if overrides and overrides.turn
            else self._select(self._heuristics.turns, scene.order + 4, rng)
        )
        order_value = overrides.order if overrides and overrides.order is not None else scene.order
        word_target = (
            overrides.word_target
            if overrides and overrides.word_target is not None
            else self._heuristics.word_target_base + (order_value * self._heuristics.word_target_step)
        )
        beats = list(scene.beat_refs)
        if overrides and overrides.beats is not None:
            beats = [beat for beat in overrides.beats]

        pacing_target = self._pacing_label(word_target, order_value)

        meta = {
            "id": scene.id,
            "slug": self._slugify(scene.title),
            "title": scene.title,
            "pov": pov,
            "purpose": purpose,
            "goal": goal,
            "conflict": conflict_text,
            "turn": turn,
            "emotion_tag": emotion_tag,
            "word_target": word_target,
            "conflict_type": conflict_type,
            "pacing_target": pacing_target,
            "order": order_value,
            "chapter_id": scene.chapter_id,
            "beats": beats,
        }
        return meta

    @staticmethod
    def _build_body(scene: OutlineScene, meta: dict[str, Any]) -> str:
        paragraphs = [
            (
                f"{meta['pov']} enters {scene.title} to {meta['goal']}. "
                f"The atmosphere leans toward {meta['emotion_tag']} as {meta['conflict']}."
            ),
            (
                f"The beat shifts when {meta['turn']}, keeping the scene in {meta['purpose']} mode "
                f"and aiming for roughly {meta['word_target']} words."
            ),
        ]
        return "\n\n".join(paragraphs)

    @staticmethod
    def _build_front_matter(scene: OutlineScene, meta: dict[str, Any]) -> dict[str, Any]:
        front_matter = {
            "id": meta["id"],
            "slug": meta["slug"],
            "title": meta["title"],
            "pov": meta.get("pov"),
            "purpose": meta.get("purpose"),
            "goal": meta.get("goal"),
            "conflict": meta.get("conflict"),
            "conflict_type": meta.get("conflict_type"),
            "turn": meta.get("turn"),
            "emotion_tag": meta.get("emotion_tag"),
            "word_target": meta.get("word_target"),
            "pacing_target": meta.get("pacing_target"),
            "order": meta.get("order"),
            "chapter_id": meta.get("chapter_id"),
            "beats": meta.get("beats", []),
        }
        return front_matter

    @staticmethod
    def _fingerprint(
        *, project_id: str, scene_id: str, seed: int, purpose: str, emotion: str
    ) -> str:
        payload = json.dumps(
            {
                "project_id": project_id,
                "scene_id": scene_id,
                "seed": seed,
                "purpose": purpose,
                "emotion": emotion,
            },
            sort_keys=True,
        ).encode("utf-8")
        digest = hashlib.sha256(payload).hexdigest()
        return f"sha256:{digest}"

    @staticmethod
    def _slugify(value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
        return slug or "scene"

    @staticmethod
    def _select(options: Sequence[Any], key: int, rng: random.Random | None = None) -> Any:
        if not options:
            raise ValueError("Heuristic options list is empty.")
        if rng is None:
            index = key % len(options)
        else:
            index = rng.randrange(len(options))
        return options[index]

    def _pacing_label(self, word_target: int, order_value: int) -> str:
        expected = (
            self._heuristics.word_target_base
            + (order_value * self._heuristics.word_target_step)
        )
        if expected <= 0:
            return "steady"
        ratio = word_target / expected
        slow_threshold, fast_threshold = self._heuristics.pacing_thresholds
        if ratio >= slow_threshold:
            return "slow"
        if ratio <= fast_threshold:
            return "fast"
        return "steady"


__all__ = ["DraftSynthesizer", "SynthesisResult"]
