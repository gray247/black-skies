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


def is_anchor_candidate(artifact: MemoryArtifact) -> bool:
    if artifact.artifact_type not in _ANCHOR_ELIGIBLE_TYPES:
        return False
    return artifact.reinforcement_count >= 3 or artifact.selection_count >= 3


def promote_anchor_candidate(artifact: MemoryArtifact, reason: str) -> MemoryArtifact:
    return replace(
        artifact,
        is_anchor=True,
        anchor_reason=reason,
    )

