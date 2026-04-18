"""Validation helpers for Memory Lab configuration thresholds."""

from __future__ import annotations


def validate_memory_thresholds(
    *,
    fading_threshold: float,
    suppressed_threshold: float,
    archived_threshold: float,
    min_weight: float | None = None,
) -> None:
    if not (archived_threshold < suppressed_threshold < fading_threshold):
        raise ValueError(
            "memory thresholds must satisfy archived_threshold < suppressed_threshold < fading_threshold"
        )
    if min_weight is not None and min_weight > archived_threshold:
        raise ValueError("memory thresholds must satisfy min_weight <= archived_threshold")
