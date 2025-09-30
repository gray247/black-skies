"""Response models for draft rewrite operations."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .draft_response_shared import ModelDescriptor


class DiffAnchors(BaseModel):
    """Character offsets preserved on both sides of the diff."""

    left: int = Field(ge=0)
    right: int = Field(ge=0)


class DiffAddition(BaseModel):
    """Inserted text with the range where it was added."""

    range: tuple[int, int]
    text: str


class DiffRemoval(BaseModel):
    """Removed text described by a source range."""

    range: tuple[int, int]


class DiffChange(BaseModel):
    """Replacement text applied to an existing range."""

    range: tuple[int, int]
    replacement: str


class DraftRewriteDiff(BaseModel):
    """Structured diff payload returned by /draft/rewrite."""

    added: list[DiffAddition] = Field(default_factory=list)
    removed: list[DiffRemoval] = Field(default_factory=list)
    changed: list[DiffChange] = Field(default_factory=list)
    anchors: DiffAnchors


class DraftRewriteResponse(BaseModel):
    """Payload returned when a draft unit is rewritten."""

    unit_id: str = Field(pattern=r"^(sc|ch)_\d{4}$")
    revised_text: str
    diff: DraftRewriteDiff
    schema_version: Literal["DraftUnitSchema v1"] = "DraftUnitSchema v1"
    model: ModelDescriptor


__all__ = [
    "DiffAddition",
    "DiffAnchors",
    "DiffChange",
    "DiffRemoval",
    "DraftRewriteDiff",
    "DraftRewriteResponse",
]
