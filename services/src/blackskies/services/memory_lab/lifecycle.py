"""Lifecycle state helpers for Memory Lab artifact decay."""

from __future__ import annotations


def derive_memory_status(
    weight: float,
    *,
    fading_threshold: float,
    suppressed_threshold: float,
    archived_threshold: float,
) -> str:
    if weight < archived_threshold:
        return "archived"
    if weight < suppressed_threshold:
        return "suppressed"
    if weight < fading_threshold:
        return "fading"
    return "active"


def derive_next_decay_status(
    current_status: str,
    *,
    weight: float,
    fading_threshold: float,
    suppressed_threshold: float,
    archived_threshold: float,
) -> str:
    target = derive_memory_status(
        weight,
        fading_threshold=fading_threshold,
        suppressed_threshold=suppressed_threshold,
        archived_threshold=archived_threshold,
    )

    if current_status == "archived":
        return "archived"
    if current_status == "suppressed":
        return "archived" if target == "archived" else "suppressed"
    if current_status == "fading":
        return "suppressed" if target in {"suppressed", "archived"} else "fading"
    if current_status == "active":
        return "fading" if target in {"fading", "suppressed", "archived"} else "active"
    raise ValueError(f"unsupported memory status: {current_status}")
