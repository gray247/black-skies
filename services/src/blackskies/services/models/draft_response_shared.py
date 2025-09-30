"""Shared components for draft response payloads."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ModelDescriptor(BaseModel):
    """Model metadata returned alongside generated content."""

    name: str
    provider: str


class BudgetStatus(str, Enum):
    """Enumerate budget classifications surfaced to clients."""

    OK = "ok"
    SOFT_LIMIT = "soft-limit"
    BLOCKED = "blocked"


class DraftBudgetSummary(BaseModel):
    """Common budget summary included with draft operations."""

    status: BudgetStatus
    message: str
    estimated_usd: float
    soft_limit_usd: float
    hard_limit_usd: float
    spent_usd: float


class DraftPreflightBudget(DraftBudgetSummary):
    """Budget summary variant returned by the preflight endpoint."""

    total_after_usd: float


class DraftSceneSummary(BaseModel):
    """Outline scene metadata echoed in draft responses."""

    id: str = Field(pattern=r"^sc_\d{4}$")
    title: str
    order: int = Field(ge=1)
    chapter_id: str | None = Field(default=None, pattern=r"^ch_\d{4}$")
    beat_refs: list[str] = Field(default_factory=list)


class DraftUnitModel(BaseModel):
    """Front-matter metadata returned with generated units."""

    pov: str | None = None
    purpose: str | None = None
    goal: str | None = None
    conflict: str | None = None
    turn: str | None = None
    emotion_tag: str | None = None
    word_target: int | None = Field(default=None, ge=0)
    order: int | None = Field(default=None, ge=1)
    chapter_id: str | None = Field(default=None, pattern=r"^ch_\d{4}$")


class SnapshotInfo(BaseModel):
    """Snapshot metadata captured by recovery endpoints."""

    model_config = ConfigDict(extra="allow")

    snapshot_id: str
    label: str
    created_at: str
    path: str
    includes: list[str] = Field(default_factory=list)


__all__ = [
    "BudgetStatus",
    "DraftBudgetSummary",
    "DraftPreflightBudget",
    "DraftSceneSummary",
    "DraftUnitModel",
    "ModelDescriptor",
    "SnapshotInfo",
]
