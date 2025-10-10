"""Request models describing Wizard locks for outline builds."""

from __future__ import annotations

from pathlib import PurePosixPath, PureWindowsPath
from typing import Literal

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
    chapter_index: int = Field(ge=1, description="1-based index into the chapters array.")
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


WIZARD_LOCK_STEPS: tuple[str, ...] = (
    "input_scope",
    "framing",
    "structure",
    "scenes",
    "characters",
    "conflict",
    "beats",
    "pacing",
    "chapters",
    "themes",
    "finalize",
)


class WizardLockSnapshotRequest(BaseModel):
    """Request payload for creating Wizard lock snapshots."""

    project_id: str
    step: Literal[
        "input_scope",
        "framing",
        "structure",
        "scenes",
        "characters",
        "conflict",
        "beats",
        "pacing",
        "chapters",
        "themes",
        "finalize",
    ]
    label: str | None = None
    includes: list[str] = Field(default_factory=list)

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)

    @field_validator("includes")
    @classmethod
    def _sanitize_includes(cls, value: list[str]) -> list[str]:
        sanitized: list[str] = []
        for raw in value:
            if not isinstance(raw, str):
                continue
            candidate = raw.strip()
            if not candidate:
                continue

            posix_path = PurePosixPath(candidate)
            windows_path = PureWindowsPath(candidate)
            for variant in (posix_path, windows_path):
                if variant.is_absolute() or variant.anchor:
                    raise ValueError(f"Include path {candidate!r} must be relative.")
                if any(part in ("..", "") for part in variant.parts):
                    raise ValueError(
                        f"Include path {candidate!r} may not traverse parent directories."
                    )

            posix_parts = [part for part in posix_path.parts if part not in (".", "")]
            windows_parts = [part for part in windows_path.parts if part not in (".", "")]
            if "\\" in candidate and windows_parts:
                normalized_parts = windows_parts
            else:
                normalized_parts = posix_parts

            if not normalized_parts:
                raise ValueError(f"Include path {candidate!r} is not valid.")

            sanitized.append("/".join(normalized_parts))

        return sanitized


__all__ = [
    "OutlineBuildRequest",
    "WizardActLock",
    "WizardChapterLock",
    "WizardLocks",
    "WizardSceneLock",
    "WizardLockSnapshotRequest",
    "WIZARD_LOCK_STEPS",
]
