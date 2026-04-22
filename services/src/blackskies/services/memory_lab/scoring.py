"""Scoring helpers for Memory Lab artifact selection."""

from __future__ import annotations

from .schemas import MemoryArtifact


def compute_relevance_score(artifact: MemoryArtifact, *, current_chapter_id: str | None) -> float:
    if artifact.chapter_id is not None and current_chapter_id is not None:
        return 1.0 if artifact.chapter_id == current_chapter_id else 0.5
    if artifact.chapter_id is None and current_chapter_id is None:
        return 1.0
    return 0.5


def compute_recency_score(artifact: MemoryArtifact, *, max_recency_order: int) -> float:
    if max_recency_order <= 0:
        return 1.0
    clamped = max(0, min(artifact.recency_order, max_recency_order))
    return clamped / float(max_recency_order)


def compute_weight_score(artifact: MemoryArtifact) -> float:
    return _normalize_clamped_0_1_5(artifact.weight)


def compute_confidence_score(artifact: MemoryArtifact) -> float:
    return _normalize_clamped_0_1_5(artifact.confidence)


def compute_anchor_score(artifact: MemoryArtifact) -> float:
    return 1.0 if artifact.is_anchor else 0.0


def compute_reinforcement_score(artifact: MemoryArtifact) -> float:
    # Saturating score that treats >=3 selections/reinforcements as fully reinforced.
    reinforced_count = max(int(artifact.reinforcement_count), int(artifact.selection_count))
    return min(reinforced_count, 3) / 3.0


def compute_status_multiplier(artifact: MemoryArtifact) -> float:
    status = artifact.status
    if status == "active":
        return 1.0
    if status == "fading":
        return 0.75
    if status == "suppressed":
        return 0.25
    if status == "archived":
        return 0.0
    return 1.0


def compute_total_score(
    artifact: MemoryArtifact,
    *,
    current_chapter_id: str | None,
    max_recency_order: int,
) -> tuple[float, float, float, float, float, float, float]:
    relevance = compute_relevance_score(artifact, current_chapter_id=current_chapter_id)
    recency = compute_recency_score(artifact, max_recency_order=max_recency_order)
    weight = compute_weight_score(artifact)
    confidence = compute_confidence_score(artifact)
    anchor = compute_anchor_score(artifact)
    reinforcement = compute_reinforcement_score(artifact)
    base_total = (
        (relevance * 0.32)
        + (recency * 0.18)
        + (weight * 0.20)
        + (confidence * 0.12)
        + (anchor * 0.10)
        + (reinforcement * 0.08)
    )
    total = base_total * compute_status_multiplier(artifact)
    return total, relevance, recency, weight, confidence, anchor, reinforcement


def _normalize_clamped_0_1_5(value: float) -> float:
    clamped = max(0.0, min(float(value), 1.5))
    return clamped / 1.5
