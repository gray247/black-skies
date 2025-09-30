"""Response models for draft preflight operations."""

from __future__ import annotations

from pydantic import BaseModel, Field

from .draft import DraftUnitScope
from .draft_response_shared import (
    DraftPreflightBudget,
    DraftSceneSummary,
    ModelDescriptor,
)


class DraftPreflightResponse(BaseModel):
    """Budget estimate and scope details for a potential draft run."""

    project_id: str
    unit_scope: DraftUnitScope
    unit_ids: list[str] = Field(default_factory=list)
    model: ModelDescriptor
    scenes: list[DraftSceneSummary] = Field(default_factory=list)
    budget: DraftPreflightBudget


__all__ = ["DraftPreflightResponse"]
