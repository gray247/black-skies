"""Shared helpers used across router modules."""

from __future__ import annotations

from datetime import datetime, timezone

__all__ = ["utc_timestamp"]


def utc_timestamp() -> str:
    """Return an ISO-8601 UTC timestamp with ``Z`` suffix."""

    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")

