"""Pydantic models and dataclasses for service IO."""

from .errors import ErrorResponse
from .legacy import Critique, Draft
from .advisory import AdvisoryEvidence, AdvisorySeverity
from .canon_court import CanonCourtCandidateRuling, CanonCourtContradictionType
from .critique import DraftCritiqueRequest
from .fracture import FractureDiagnostic, FractureReport, FractureSeverity, FractureType
from .outline import OutlineArtifact, OutlineChapter, OutlineScene
from .wizard import (
    OutlineBuildRequest,
    WizardActLock,
    WizardChapterLock,
    WizardLocks,
    WizardSceneLock,
)

__all__ = [
    "Critique",
    "AdvisoryEvidence",
    "AdvisorySeverity",
    "CanonCourtCandidateRuling",
    "CanonCourtContradictionType",
    "Draft",
    "ErrorResponse",
    "FractureDiagnostic",
    "FractureReport",
    "FractureSeverity",
    "FractureType",
    "OutlineArtifact",
    "OutlineChapter",
    "OutlineScene",
    "DraftCritiqueRequest",
    "OutlineBuildRequest",
    "WizardActLock",
    "WizardChapterLock",
    "WizardLocks",
    "WizardSceneLock",
]
