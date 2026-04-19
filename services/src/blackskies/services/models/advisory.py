"""Shared advisory diagnostics standards.

These standards are intentionally small and reused across advisory systems
such as Fracture Diagnostics and Canon Court v1.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class AdvisorySeverity(str, Enum):
    """Canonical advisory severity vocabulary.

    Keep this vocabulary stable and avoid synonym drift (for example, avoid
    introducing labels like "minor", "elevated", or "severe").
    """

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AdvisoryEvidence(BaseModel):
    """Small shared evidence shape for advisory diagnostics."""

    model_config = ConfigDict(extra="forbid")

    summary: str = Field(min_length=1)
    source_hints: list[str] = Field(default_factory=list)
    source_origins: list[str] = Field(default_factory=list)
    note: str | None = None


__all__ = ["AdvisorySeverity", "AdvisoryEvidence"]
