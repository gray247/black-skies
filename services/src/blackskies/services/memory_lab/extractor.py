"""Artifact extraction from scene carryover payloads for Memory Lab."""

from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
from typing import Any

from .constants import MEMORY_ARTIFACT_SCHEMA_VERSION
from .interpretations import create_interpretation_variants
from .schemas import MemoryArtifact
from .types import ArtifactType


def build_memory_artifacts(
    *,
    scene_id: str,
    chapter_id: str | None,
    text: str,
    carryover_payload: dict[str, Any],
    recency_order: int,
    interpretations_enabled: bool = False,
    max_interpretations_per_group: int = 2,
) -> list[MemoryArtifact]:
    created_at = datetime.now(UTC).isoformat()
    seen: set[tuple[str, str]] = set()
    artifacts: list[MemoryArtifact] = []

    def add(artifact_type: ArtifactType, raw: Any) -> MemoryArtifact | None:
        content = _clean(raw)
        if not content:
            return None
        key = (artifact_type, content)
        if key in seen:
            return None
        seen.add(key)
        artifact = MemoryArtifact(
            artifact_id=_artifact_id(
                scene_id=scene_id, artifact_type=artifact_type, content=content
            ),
            schema_version=MEMORY_ARTIFACT_SCHEMA_VERSION,
            artifact_type=artifact_type,
            scene_id=scene_id,
            chapter_id=chapter_id,
            source_excerpt=_excerpt(text),
            content=content,
            weight=1.0,
            confidence=1.0,
            recency_order=recency_order,
            tags=[],
            derived_from="scene_memory_v1",
            created_at=created_at,
            source_kind="scene",
            source_ref=scene_id,
            artifact_scene_order=recency_order,
        )
        artifacts.append(artifact)
        return artifact

    summary_artifact = add("summary", carryover_payload.get("summary"))
    if (
        summary_artifact
        and interpretations_enabled
        and _contains_ambiguity_cue(summary_artifact.content)
    ):
        labels = _deterministic_labels_for_summary(summary_artifact.content)
        _group, variants = create_interpretation_variants(
            scene_id=scene_id,
            chapter_id=chapter_id,
            base_artifact=summary_artifact,
            labels=labels,
            created_at=created_at,
            max_variants=max_interpretations_per_group,
        )
        artifacts.extend(variants)
    for item in _as_list(carryover_payload.get("unresolved")):
        add("unresolved_tension", item)
    add("emotional_state", carryover_payload.get("emotional_carryover"))
    add("location_state", carryover_payload.get("location_state"))
    for item in _as_list(carryover_payload.get("reveals")):
        add("reveal", item)

    return artifacts


def _artifact_id(*, scene_id: str, artifact_type: ArtifactType, content: str) -> str:
    digest = sha256(content.encode("utf-8")).hexdigest()[:12]
    return f"{scene_id}:{artifact_type}:{digest}"


def _excerpt(text: str) -> str | None:
    cleaned = _clean(text)
    if cleaned is None:
        return None
    return cleaned[:200]


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    return cleaned


def _as_list(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    return []


def _contains_ambiguity_cue(text: str) -> bool:
    lowered = text.lower()
    cues = ("but", "though", "even as", "while", "felt", "seemed")
    return any(cue in lowered for cue in cues)


def _deterministic_labels_for_summary(text: str) -> list[str]:
    lowered = text.lower()
    labels: list[str] = []
    mappings: tuple[tuple[tuple[str, ...], tuple[str, ...]], ...] = (
        (("would not let",), ("protective", "controlling")),
        (("kept from leaving",), ("protective", "controlling")),
        (("smiled", "wrong"), ("friendly", "threatening")),
        (("helped", "afraid"), ("protective", "fearful")),
    )
    for triggers, mapped_labels in mappings:
        if all(trigger in lowered for trigger in triggers):
            for label in mapped_labels:
                if label in labels:
                    continue
                labels.append(label)
                if len(labels) >= 2:
                    return labels
    return labels
