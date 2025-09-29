"""Pydantic models for draft generation requests."""

from __future__ import annotations

import re
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from ._project_id import validate_project_id


class DraftUnitScope(str, Enum):
    """Supported unit scopes for draft generation."""

    SCENE = "scene"
    CHAPTER = "chapter"


class DraftUnitOverrides(BaseModel):
    """Optional overrides applied when generating a draft unit."""

    order: int | None = Field(default=None, ge=1)
    purpose: Literal["setup", "escalation", "payoff", "breath"] | None = None
    emotion_tag: (
        Literal["dread", "tension", "respite", "revelation", "aftermath"] | None
    ) = None
    pov: str | None = None
    goal: str | None = None
    conflict: str | None = None
    turn: str | None = None
    word_target: int | None = Field(default=None, ge=0)


class DraftGenerateRequest(BaseModel):
    """Request payload for the /draft/generate endpoint."""

    project_id: str
    unit_scope: DraftUnitScope
    unit_ids: list[str] = Field(min_length=1)
    temperature: float | None = Field(default=0.7, ge=0.0, le=1.0)
    seed: int | None = Field(default=None, ge=0)
    overrides: dict[str, DraftUnitOverrides] = Field(default_factory=dict)

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)

    @model_validator(mode="after")
    def _validate_units(self) -> "DraftGenerateRequest":
        if self.unit_scope is DraftUnitScope.SCENE:
            if len(self.unit_ids) > 5:
                msg = "Scene requests must specify at most 5 scene IDs."
                raise ValueError(msg)
            pattern = re.compile(r"^sc_\d{4}$")
        else:
            if len(self.unit_ids) != 1:
                msg = "Chapter requests must specify exactly one chapter ID."
                raise ValueError(msg)
            pattern = re.compile(r"^ch_\d{4}$")

        seen: set[str] = set()
        for unit_id in self.unit_ids:
            if unit_id in seen:
                msg = "Unit IDs must be unique."
                raise ValueError(msg)
            seen.add(unit_id)
            if not pattern.match(unit_id):
                msg = f"Invalid {self.unit_scope.value} identifier: {unit_id}."
                raise ValueError(msg)

        for override_key in self.overrides.keys():
            if not re.match(r"^sc_\d{4}$", override_key):
                msg = (
                    f"Override keys must be scene identifiers (found '{override_key}')."
                )
                raise ValueError(msg)

        return self


__all__ = [
    "DraftGenerateRequest",
    "DraftUnitOverrides",
    "DraftUnitScope",
]
