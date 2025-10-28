"""Pydantic models for draft critique requests."""

from __future__ import annotations

import re
from typing import ClassVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

_DRAFT_ID_PATTERN = r"^dr_[A-Za-z0-9_-]{3,64}$"
_UNIT_ID_PATTERN = r"^sc_\d{4}$"


class DraftCritiqueRequest(BaseModel):
    """Request payload submitted to the draft critique endpoint."""

    model_config = ConfigDict(extra="forbid")

    draft_id: str = Field(pattern=_DRAFT_ID_PATTERN)
    unit_id: str = Field(pattern=_UNIT_ID_PATTERN)
    rubric: list[str] = Field(min_length=1)
    rubric_id: str | None = None

    _MAX_RUBRIC_LENGTH: ClassVar[int] = 40
    _RUBRIC_PATTERN: ClassVar[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9 ,.&:/'-]+$")
    _RUBRIC_ID_PATTERN: ClassVar[re.Pattern[str]] = re.compile(r"^[a-z0-9._-]{3,64}$")

    @classmethod
    def _normalise_category(cls, value: str) -> str:
        """Return a cleaned rubric label preserving author intent where possible."""

        cleaned = re.sub(r"\s+", " ", value.strip())
        if not cleaned:
            msg = "rubric entries must be non-empty strings."
            raise ValueError(msg)
        if len(cleaned) > cls._MAX_RUBRIC_LENGTH:
            msg = f"rubric entries must be at most {cls._MAX_RUBRIC_LENGTH} characters."
            raise ValueError(msg)
        if not cls._RUBRIC_PATTERN.fullmatch(cleaned):
            msg = (
                "rubric entries may only include letters, numbers, spaces, and basic punctuation "
                "(- . , & : / ')."
            )
            raise ValueError(msg)

        return cleaned

    @field_validator("rubric")
    @classmethod
    def _validate_rubric(cls, value: list[str]) -> list[str]:
        """Ensure rubric categories are non-empty, de-duplicated, and well formed."""

        if not value:
            msg = "rubric must include at least one category."
            raise ValueError(msg)

        cleaned: list[str] = []
        seen: set[str] = set()
        for entry in value:
            if not isinstance(entry, str):
                msg = "rubric entries must be strings."
                raise ValueError(msg)
            normalized = cls._normalise_category(entry)
            key = normalized.casefold()
            if key in seen:
                continue
            cleaned.append(normalized)
            seen.add(key)

        if not cleaned:
            msg = "rubric must include at least one distinct category."
            raise ValueError(msg)

        return cleaned

    @field_validator("rubric_id")
    @classmethod
    def _validate_rubric_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        candidate = value.strip().lower()
        if not cls._RUBRIC_ID_PATTERN.fullmatch(candidate):
            msg = "rubric_id must be 3-64 characters using lowercase, digits, '.', '_', or '-'."
            raise ValueError(msg)
        return candidate


__all__ = ["DraftCritiqueRequest"]
