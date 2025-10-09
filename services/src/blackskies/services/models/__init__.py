"""Pydantic models and dataclasses for service IO."""

from .legacy import Critique, Draft
from .critique import DraftCritiqueRequest
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
    "Draft",
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
