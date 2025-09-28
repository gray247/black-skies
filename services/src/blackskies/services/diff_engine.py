"""Utility helpers for computing diff payloads."""

from __future__ import annotations

import difflib
from dataclasses import dataclass
from typing import Any, Literal


@dataclass
class DiffPayload:
    """Structured diff matching DraftUnitSchema expectations."""

    added: list[dict[str, Any]]
    removed: list[dict[str, Any]]
    changed: list[dict[str, Any]]
    anchors: dict[Literal["left", "right"], int]


def compute_diff(original: str, revised: str) -> DiffPayload:
    """Compute a structured diff description between two strings."""

    original = original or ""
    revised = revised or ""

    matcher = difflib.SequenceMatcher(a=original, b=revised)

    added: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []
    changed: list[dict[str, Any]] = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        if tag == "replace":
            changed.append({"range": [i1, i2], "replacement": revised[j1:j2]})
        elif tag == "delete":
            removed.append({"range": [i1, i2]})
        elif tag == "insert":
            added.append({"range": [i1, i1], "text": revised[j1:j2]})

    anchors = {
        "left": _matching_prefix_length(original, revised),
        "right": _matching_suffix_length(original, revised),
    }

    return DiffPayload(added=added, removed=removed, changed=changed, anchors=anchors)


def _matching_prefix_length(left: str, right: str) -> int:
    limit = min(len(left), len(right))
    count = 0
    for idx in range(limit):
        if left[idx] != right[idx]:
            break
        count += 1
    return count


def _matching_suffix_length(left: str, right: str) -> int:
    limit = min(len(left), len(right))
    count = 0
    for idx in range(1, limit + 1):
        if left[-idx] != right[-idx]:
            break
        count += 1
    return count


__all__ = ["DiffPayload", "compute_diff"]
