"""Anchor candidate helpers for Memory Lab artifacts."""

from __future__ import annotations

from dataclasses import replace

from .schemas import MemoryArtifact

_ANCHOR_ELIGIBLE_TYPES = {
    "summary",
    "unresolved_tension",
    "emotional_state",
    "location_state",
}


def is_anchor_candidate(artifact: MemoryArtifact, *, min_threshold: int = 3) -> bool:
    if artifact.artifact_type not in _ANCHOR_ELIGIBLE_TYPES:
        return False
    threshold = max(1, int(min_threshold))
    return artifact.reinforcement_count >= threshold or artifact.selection_count >= threshold


def promote_anchor_candidate(artifact: MemoryArtifact, reason: str) -> MemoryArtifact:
    return replace(
        artifact,
        is_anchor=True,
        anchor_reason=reason,
    )
