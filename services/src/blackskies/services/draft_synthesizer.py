"""Deterministic draft synthesis utilities."""

from __future__ import annotations

import hashlib
import json
import random
import re
from dataclasses import dataclass
from typing import Any

from .models.draft import DraftGenerateRequest, DraftUnitOverrides
from .models.outline import OutlineScene


@dataclass
class SynthesisResult:
    """Container for synthesized draft unit artifacts."""

    unit: dict[str, Any]
    front_matter: dict[str, Any]
    body: str


class DraftSynthesizer:
    """Deterministically synthesize draft units from outline metadata."""

    _MODEL = {"name": "draft-synthesizer-v1", "provider": "black-skies-local"}
    _POVS = [
        "Mara Ibarra",
        "Ezra Cole",
        "Jun Park",
        "Sasha Reed",
        "Luis Navarro",
        "Rin Okada",
        "Kira Beaumont",
        "Elior Shaw",
    ]
    _GOALS = [
        "stabilize the perimeter sensors",
        "recover the coded broadcast",
        "map the estate's sealed corridors",
        "extract the survivor logs",
        "keep the generator coil alive",
        "decode the warding sigils",
    ]
    _CONFLICTS = [
        "humidity chews through every circuit",
        "alarms cascade in the empty halls",
        "footsteps echo from nowhere",
        "the blackout shutters seize mid-drop",
        "radio static lances through the air",
        "old floorboards complain at every move",
    ]
    _TURNS = [
        "a hidden relay spits out fresh co-ordinates",
        "an old ally speaks through the static",
        "the house remembers a forgotten route",
        "a vault door seals with new intent",
        "a warning flare cuts across the bay",
        "the diary on the desk updates itself",
    ]
    _PURPOSES = ["setup", "escalation", "payoff", "breath"]
    _EMOTIONS = ["dread", "tension", "respite", "revelation", "aftermath"]

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
            for key in ("pov", "purpose", "emotion_tag", "word_target")
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
        purpose = (
            overrides.purpose
            if overrides and overrides.purpose
            else self._select(self._PURPOSES, scene.order)
        )
        emotion_tag = (
            overrides.emotion_tag
            if overrides and overrides.emotion_tag
            else self._select(self._EMOTIONS, scene.order + 1)
        )
        pov = (
            overrides.pov
            if overrides and overrides.pov
            else self._select(self._POVS, scene.order, rng)
        )
        goal = (
            overrides.goal
            if overrides and overrides.goal
            else self._select(self._GOALS, scene.order + 2, rng)
        )
        conflict = (
            overrides.conflict
            if overrides and overrides.conflict
            else self._select(self._CONFLICTS, scene.order + 3, rng)
        )
        turn = (
            overrides.turn
            if overrides and overrides.turn
            else self._select(self._TURNS, scene.order + 4, rng)
        )
        order_value = overrides.order if overrides and overrides.order is not None else scene.order
        word_target = (
            overrides.word_target
            if overrides and overrides.word_target is not None
            else 850 + (order_value * 40)
        )
        beats = list(scene.beat_refs)
        if overrides and overrides.beats is not None:
            beats = [beat for beat in overrides.beats]

        meta = {
            "id": scene.id,
            "slug": self._slugify(scene.title),
            "title": scene.title,
            "pov": pov,
            "purpose": purpose,
            "goal": goal,
            "conflict": conflict,
            "turn": turn,
            "emotion_tag": emotion_tag,
            "word_target": word_target,
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
            "turn": meta.get("turn"),
            "emotion_tag": meta.get("emotion_tag"),
            "word_target": meta.get("word_target"),
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
    def _select(options: list[str], key: int, rng: random.Random | None = None) -> str:
        if not options:
            return ""
        if rng is None:
            index = key % len(options)
        else:
            index = rng.randrange(len(options))
        return options[index]


__all__ = ["DraftSynthesizer", "SynthesisResult"]
