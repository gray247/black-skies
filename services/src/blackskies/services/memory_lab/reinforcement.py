"""Reinforcement updates for Memory Lab artifact weights."""

from __future__ import annotations

from dataclasses import replace
from uuid import uuid4

from .schemas import MemoryArtifact, ReinforcementEvent

_MIN_WEIGHT = 0.10
_MAX_WEIGHT = 2.00


def reinforce_artifact(
    artifact: MemoryArtifact,
    *,
    delta: float,
    event_type: str,
    now_iso: str,
) -> tuple[MemoryArtifact, ReinforcementEvent]:
    new_weight = _clamp_weight(artifact.weight + float(delta))
    updated = replace(
        artifact,
        weight=new_weight,
        reinforcement_count=artifact.reinforcement_count + 1,
    )
    event = ReinforcementEvent(
        event_id=f"re_{uuid4().hex[:12]}",
        artifact_id=artifact.artifact_id,
        event_type=event_type,
        delta_weight=float(delta),
        created_at=now_iso,
        notes=None,
    )
    return updated, event


def selection_delta() -> float:
    return 0.03


def survival_delta() -> float:
    return 0.05


def author_confirm_delta() -> float:
    return 0.10


def _clamp_weight(value: float) -> float:
    return max(_MIN_WEIGHT, min(_MAX_WEIGHT, value))

