"""Typed Canon Court v1 candidate ruling models.

Canon Court v1 stores advisory candidate rulings separately from canonical
lore/state. These records are review artifacts only and must not mutate canon.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .advisory import AdvisoryEvidence, AdvisorySeverity

class CanonCourtContradictionType(str, Enum):
    """Conservative contradiction categories supported in v1."""

    LOCKED_FACT_CONTRADICTION = "locked_fact_contradiction"


class CanonCourtCandidateRuling(BaseModel):
    """Advisory candidate ruling record emitted by Canon Court v1."""

    model_config = ConfigDict(extra="forbid")

    contradiction_id: str = Field(min_length=1)
    contradiction_type: CanonCourtContradictionType
    severity: AdvisorySeverity
    evidence: AdvisoryEvidence
    candidate_ruling: str = Field(min_length=1)
    rationale: str = Field(min_length=1)
    project_id: str = Field(min_length=1)
    scene_id: str = Field(min_length=1)
    created_at: str = Field(min_length=1)
    diagnostics_only: Literal[True] = True
    advisory: Literal[True] = True
    non_blocking: Literal[True] = True
    metadata: dict[str, object] = Field(default_factory=dict)


__all__ = [
    "CanonCourtCandidateRuling",
    "CanonCourtContradictionType",
]
