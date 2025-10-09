"""Pydantic schemas for the Black Skies service surface."""

from __future__ import annotations

from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field


class OutlineRequest(BaseModel):
    project_id: str = Field(..., description="Identifier for the project requesting an outline.")
    wizard_locks: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class OutlineResponse(BaseModel):
    outline_id: str
    project_id: str
    status: Literal["queued", "ready"]
    created_at: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)


class DraftUnit(BaseModel):
    unit_id: str
    title: str
    text: str


class DraftRequest(BaseModel):
    project_id: str
    unit_ids: List[str] = Field(default_factory=list)
    temperature: float = Field(0.0, ge=0.0, le=1.0)


class DraftResponse(BaseModel):
    draft_id: str
    project_id: str
    generated_at: datetime
    units: List[DraftUnit]


class RewriteRequest(BaseModel):
    project_id: str
    unit_id: str
    proposed_text: str
    message: Optional[str] = None


class RewriteResponse(BaseModel):
    project_id: str
    unit_id: str
    accepted_text: str
    previous_text: Optional[str] = None
    accepted_at: datetime


class CritiqueRequest(BaseModel):
    project_id: str
    unit_id: str
    text: str
    rubric: Optional[str] = None


class CritiqueResponse(BaseModel):
    project_id: str
    unit_id: str
    summary: str
    severity: Literal["low", "medium", "high"]
    recommendations: List[str]
    generated_at: datetime


__all__ = [
    "OutlineRequest",
    "OutlineResponse",
    "DraftUnit",
    "DraftRequest",
    "DraftResponse",
    "RewriteRequest",
    "RewriteResponse",
    "CritiqueRequest",
    "CritiqueResponse",
]
