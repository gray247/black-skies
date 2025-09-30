"""Response models for draft generation."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .draft_response_shared import (
    DraftBudgetSummary,
    DraftUnitModel,
    ModelDescriptor,
)


class GeneratedDraftUnit(BaseModel):
    """Single draft unit returned from generation."""

    id: str = Field(pattern=r"^(sc|ch)_\d{4}$")
    text: str
    meta: DraftUnitModel = Field(default_factory=DraftUnitModel)
    prompt_fingerprint: str
    model: ModelDescriptor
    seed: int | None = Field(default=None, ge=0)


class DraftGenerateResponse(BaseModel):
    """Structured payload returned by /draft/generate."""

    schema_version: Literal["DraftUnitSchema v1"] = "DraftUnitSchema v1"
    draft_id: str = Field(pattern=r"^dr_\d{3,}$")
    units: list[GeneratedDraftUnit] = Field(default_factory=list)
    budget: DraftBudgetSummary


__all__ = ["DraftGenerateResponse", "GeneratedDraftUnit"]
