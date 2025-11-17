"""Pydantic models for the Phase 4 critique and rewrite loop."""

from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class CritiqueMode(str, Enum):
    """Named critique flavors available in the mock loop."""

    line_edit = "line_edit"
    big_picture = "big_picture"
    pacing = "pacing"
    tone = "tone"


class Phase4CritiqueRequest(BaseModel):
    """Request payload for the mock Phase 4 critique endpoint."""

    project_id: str = Field(min_length=1)
    scene_id: str = Field(min_length=1)
    text: str = Field(min_length=1)
    mode: CritiqueMode


class Phase4Issue(BaseModel):
    """Individual issue reported by the mock critique flow."""

    line: int | None = None
    type: str
    message: str


class Phase4CritiqueResponse(BaseModel):
    """Response shape returned by the mock critique endpoint."""

    summary: str
    issues: List[Phase4Issue]
    suggestions: List[str]


class Phase4RewriteRequest(BaseModel):
    """Request payload for the mock rewrite operation."""

    project_id: str = Field(min_length=1)
    scene_id: str = Field(min_length=1)
    original_text: str = Field(min_length=1)
    instructions: str | None = None


class Phase4RewriteResponse(BaseModel):
    """Response payload for the rewrite endpoint."""

    revised_text: str


__all__ = [
    "CritiqueMode",
    "Phase4CritiqueRequest",
    "Phase4CritiqueResponse",
    "Phase4Issue",
    "Phase4RewriteRequest",
    "Phase4RewriteResponse",
]
