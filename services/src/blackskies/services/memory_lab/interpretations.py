"""Interpretation variant builders for Memory Lab artifacts."""

from __future__ import annotations

from hashlib import sha256

from .schemas import InterpretationGroup, MemoryArtifact

_DEFAULT_LABEL_CAP = 2
_INTERPRETATION_ELIGIBLE_TYPES = {"summary", "interpretation_hint", "emotional_state"}


def build_interpretation_group_id(scene_id: str, base_content: str) -> str:
    """Build a stable interpretation group ID from scene and source content."""
    normalized_content = base_content.strip()
    digest = sha256(f"{scene_id}:{normalized_content}".encode("utf-8")).hexdigest()[:12]
    return f"{scene_id}:interp_group:{digest}"


def create_interpretation_variants(
    *,
    scene_id: str,
    chapter_id: str | None,
    base_artifact: MemoryArtifact,
    labels: list[str],
    created_at: str,
) -> tuple[InterpretationGroup, list[MemoryArtifact]]:
    """Create interpretation variants from supplied labels without generating new labels."""
    group_id = build_interpretation_group_id(scene_id=scene_id, base_content=base_artifact.content)
    normalized_labels = _normalized_labels(labels)

    if not normalized_labels or base_artifact.artifact_type not in _INTERPRETATION_ELIGIBLE_TYPES:
        group = InterpretationGroup(
            group_id=group_id,
            scene_id=scene_id,
            chapter_id=chapter_id,
            entity_ref=None,
            event_ref=None,
            schema_version=base_artifact.schema_version,
            artifact_ids=[],
            created_at=created_at,
        )
        return group, []

    variants: list[MemoryArtifact] = []
    for label in normalized_labels:
        variant_id = _build_variant_id(base_artifact_id=base_artifact.artifact_id, label=label)
        variants.append(
            MemoryArtifact(
                artifact_id=variant_id,
                schema_version=base_artifact.schema_version,
                artifact_type=base_artifact.artifact_type,
                scene_id=scene_id,
                chapter_id=chapter_id,
                source_excerpt=base_artifact.source_excerpt,
                content=base_artifact.content,
                weight=base_artifact.weight,
                confidence=base_artifact.confidence,
                recency_order=base_artifact.recency_order,
                tags=list(base_artifact.tags),
                derived_from=base_artifact.derived_from,
                created_at=created_at,
                interpretation_group_id=group_id,
                interpretation_label=label,
                parent_artifact_id=base_artifact.artifact_id,
            )
        )

    group = InterpretationGroup(
        group_id=group_id,
        scene_id=scene_id,
        chapter_id=chapter_id,
        entity_ref=None,
        event_ref=None,
        schema_version=base_artifact.schema_version,
        artifact_ids=[variant.artifact_id for variant in variants],
        created_at=created_at,
    )
    return group, variants


def _normalized_labels(labels: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for label in labels:
        cleaned = label.strip()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        normalized.append(cleaned)
        if len(normalized) >= _DEFAULT_LABEL_CAP:
            break
    return normalized


def _build_variant_id(*, base_artifact_id: str, label: str) -> str:
    digest = sha256(label.encode("utf-8")).hexdigest()[:10]
    return f"{base_artifact_id}:interp:{digest}"
