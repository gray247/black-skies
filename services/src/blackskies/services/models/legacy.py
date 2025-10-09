"""Lightweight dataclasses retained for backward-compatible helpers."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict


def _now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


@dataclass
class Draft:
    """Client-submitted draft unit."""

    unit_id: str
    title: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=_now_utc)


@dataclass
class Critique:
    """Critique result produced by rubric evaluation."""

    unit_id: str
    summary: str
    line_comments: list[dict[str, Any]]
    priorities: list[str]
    suggested_edits: list[dict[str, Any]]
    severity: str
    model: dict[str, str]
    schema_version: str = "CritiqueOutputSchema v1"

    def to_dict(self) -> dict[str, Any]:
        return {
            "unit_id": self.unit_id,
            "summary": self.summary,
            "line_comments": self.line_comments,
            "priorities": self.priorities,
            "suggested_edits": self.suggested_edits,
            "severity": self.severity,
            "model": self.model,
            "schema_version": self.schema_version,
        }


__all__ = ["Draft", "Critique"]
