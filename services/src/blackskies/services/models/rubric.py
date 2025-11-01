"""Pydantic models describing rubric definitions and steps."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

_RUBRIC_ID_PATTERN = re.compile(r"^[a-z0-9._-]{3,64}$")
_CATEGORY_PATTERN = re.compile(r"^[A-Za-z0-9 ,.&:/'-]+$")


class RubricStep(BaseModel):
    """Single rubric step applied during critique."""

    model_config = ConfigDict(extra="forbid")

    title: str
    prompt: str
    severity: Literal["info", "warning", "error"] = "info"

    @field_validator("title", "prompt")
    @classmethod
    def _validate_non_empty(cls, value: str) -> str:
        candidate = value.strip()
        if not candidate:
            msg = "Rubric steps must include non-empty title and prompt."
            raise ValueError(msg)
        return candidate


class RubricDefinition(BaseModel):
    """Structured rubric definition loaded from fixtures or project metadata."""

    model_config = ConfigDict(extra="forbid")

    rubric_id: str = Field(
        validation_alias=AliasChoices("id", "rubric_id"),
        alias="rubric_id",
    )
    label: str
    description: str | None = None
    categories: list[str] = Field(default_factory=list)
    steps: list[RubricStep] = Field(default_factory=list)
    blocked_categories: list[str] = Field(default_factory=list)

    @field_validator("rubric_id")
    @classmethod
    def _validate_rubric_id(cls, value: str) -> str:
        candidate = value.strip().lower()
        if not _RUBRIC_ID_PATTERN.fullmatch(candidate):
            msg = "Rubric identifier must be 3-64 characters (lowercase, digits, '.', '_', '-')."
            raise ValueError(msg)
        return candidate

    @field_validator("label")
    @classmethod
    def _validate_label(cls, value: str) -> str:
        candidate = value.strip()
        if not candidate:
            msg = "Rubric label must be a non-empty string."
            raise ValueError(msg)
        return candidate

    @field_validator("categories")
    @classmethod
    def _validate_categories(cls, categories: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for entry in categories:
            if not isinstance(entry, str):
                msg = "Rubric categories must be strings."
                raise ValueError(msg)
            candidate = re.sub(r"\s+", " ", entry.strip())
            if not candidate:
                msg = "Rubric categories must be non-empty."
                raise ValueError(msg)
            if not _CATEGORY_PATTERN.fullmatch(candidate):
                msg = (
                    "Rubric categories may only contain letters, numbers, spaces, and "
                    "basic punctuation (- . , & : / ')."
                )
                raise ValueError(msg)
            key = candidate.casefold()
            if key in seen:
                continue
            seen.add(key)
            cleaned.append(candidate)
        return cleaned

    @field_validator("blocked_categories")
    @classmethod
    def _validate_blocked(cls, entries: list[str]) -> list[str]:
        return [entry.strip().casefold() for entry in entries if entry.strip()]


__all__ = ["RubricDefinition", "RubricStep"]
