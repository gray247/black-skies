"""Shared helpers across draft router modules."""

from __future__ import annotations

import hashlib


def _compute_sha256(value: str) -> str:
    """Return the SHA-256 digest for the supplied string."""

    return hashlib.sha256(value.encode("utf-8")).hexdigest()


__all__ = ["_compute_sha256"]
