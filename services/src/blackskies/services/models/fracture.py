"""Typed advisory fracture diagnostics models.

Fractures are intentionally diagnostics-only, advisory, and non-blocking.
They surface uncertainty signals without acting as authority or runtime gates.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .advisory import AdvisoryEvidence, AdvisorySeverity


class FractureType(str, Enum):
    """Supported v1 fracture categories."""

    LOW_MEMORY_GROUNDING = "low_memory_grounding"
    CANON_COLLISION_RISK = "canon_collision_risk"
    STYLE_DRIFT_RISK = "style_drift_risk"
    UNRESOLVED_THREAD_PRESSURE = "unresolved_thread_pressure"


# Alias preserved for fracture-specific imports while sharing one vocabulary.
FractureSeverity = AdvisorySeverity


class FractureDiagnostic(BaseModel):
    """Single advisory fracture diagnostic entry."""

    model_config = ConfigDict(extra="forbid")

    fracture_type: FractureType
    severity: FractureSeverity
    rationale: str = Field(min_length=1)
    evidence: AdvisoryEvidence


class FractureReport(BaseModel):
    """Advisory fracture report envelope for internal diagnostics surfaces."""

    model_config = ConfigDict(extra="forbid")

    source: str = Field(min_length=1)
    diagnostics_only: Literal[True] = True
    advisory: Literal[True] = True
    non_blocking: Literal[True] = True
    fractures: list[FractureDiagnostic] = Field(default_factory=list)


__all__ = [
    "FractureDiagnostic",
    "FractureReport",
    "FractureSeverity",
    "FractureType",
]
