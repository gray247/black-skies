"""Shared helpers across draft router modules."""

from __future__ import annotations

import hashlib

from ...export import normalize_markdown


def _compute_sha256(value: str) -> str:
    """Return the SHA-256 digest for the supplied string."""

    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_submitted_scene_body(submitted_text: str) -> str:
    """Normalize submitted scene text to body content for draft route comparisons.

    Clients may submit either body-only text or full scene markdown with front matter.
    Draft routes compare and persist body text, so strip front matter when present.
    """

    normalized = normalize_markdown(submitted_text)
    lines = normalized.splitlines()
    if len(lines) >= 3 and lines[0].strip() == "---":
        for index in range(1, len(lines)):
            if lines[index].strip() == "---":
                return "\n".join(lines[index + 1 :])
    return normalized


__all__ = ["_compute_sha256", "normalize_submitted_scene_body"]
