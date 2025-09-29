"""Shared project identifier validation helpers."""

from __future__ import annotations

import os
from pathlib import Path


def validate_project_id(value: str) -> str:
    """Ensure a project identifier is a safe single path segment."""

    if not isinstance(value, str):
        raise ValueError("Project ID must be a string.")

    candidate = value
    if candidate.strip() != candidate:
        raise ValueError("Project ID must not contain leading or trailing whitespace.")

    if candidate == "":
        raise ValueError("Project ID must not be empty.")

    if candidate in {".", ".."}:
        raise ValueError("Project ID is invalid.")

    separators = {os.sep}
    if os.altsep:
        separators.add(os.altsep)
    if any(sep in candidate for sep in separators):
        raise ValueError("Project ID must not contain path separators.")

    if any(ord(char) < 32 for char in candidate):
        raise ValueError("Project ID contains invalid control characters.")

    if os.name == "nt" and len(candidate) >= 2 and candidate[1] == ":":
        raise ValueError("Project ID must not include drive specifiers.")

    if Path(candidate).is_absolute():
        raise ValueError("Project ID must be a relative name.")

    return candidate


__all__ = ["validate_project_id"]
