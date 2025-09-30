"""Response models for draft critique operations."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .draft_response_shared import ModelDescriptor


class CritiqueLineComment(BaseModel):
    """Inline comment returned by the critique rubric."""

    line: int = Field(ge=1)
    note: str


class CritiqueSuggestedEdit(BaseModel):
    """Suggested text replacement for a range."""

    range: tuple[int, int]
    replacement: str


class DraftCritiqueResponse(BaseModel):
    """Payload returned by /draft/critique."""

    unit_id: str = Field(pattern=r"^(sc|ch)_\d{4}$")
    schema_version: Literal["CritiqueOutputSchema v1"] = "CritiqueOutputSchema v1"
    summary: str
    line_comments: list[CritiqueLineComment] = Field(default_factory=list)
    priorities: list[str] = Field(default_factory=list)
    suggested_edits: list[CritiqueSuggestedEdit] = Field(default_factory=list)
    model: ModelDescriptor


__all__ = [
    "CritiqueLineComment",
    "CritiqueSuggestedEdit",
    "DraftCritiqueResponse",
]
