"""Request models describing Wizard locks for outline builds."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from ._project_id import validate_project_id


class WizardActLock(BaseModel):
    """Single act lock captured from the Wizard."""

    title: str


class WizardChapterLock(BaseModel):
    """Chapter lock referencing an act by 1-based index."""

    title: str
    act_index: int = Field(ge=1, description="1-based index into the acts array.")


class WizardSceneLock(BaseModel):
    """Scene lock referencing a chapter by 1-based index."""

    title: str
    chapter_index: int = Field(
        ge=1, description="1-based index into the chapters array."
    )
    beat_refs: list[str] = Field(default_factory=list)


class WizardLocks(BaseModel):
    """Collection of Wizard locks used to build an outline."""

    acts: list[WizardActLock] = Field(default_factory=list)
    chapters: list[WizardChapterLock] = Field(default_factory=list)
    scenes: list[WizardSceneLock] = Field(default_factory=list)


class OutlineBuildRequest(BaseModel):
    """Request payload for the outline build endpoint."""

    project_id: str
    force_rebuild: bool = False
    wizard_locks: WizardLocks

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)


__all__ = [
    "OutlineBuildRequest",
    "WizardActLock",
    "WizardChapterLock",
    "WizardLocks",
    "WizardSceneLock",
]
