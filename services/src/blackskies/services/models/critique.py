"""Pydantic models for draft critique requests."""

from __future__ import annotations

from typing import ClassVar

from pydantic import BaseModel, Field, field_validator

_DRAFT_ID_PATTERN = r"^dr_\d{3}$"
_UNIT_ID_PATTERN = r"^sc_\d{4}$"


class DraftCritiqueRequest(BaseModel):
    """Request payload submitted to the draft critique endpoint."""

    draft_id: str = Field(pattern=_DRAFT_ID_PATTERN)
    unit_id: str = Field(pattern=_UNIT_ID_PATTERN)
    rubric: list[str] = Field(min_length=1)

    _ALLOWED_RUBRIC: ClassVar[set[str]] = {
        "Logic",
        "Continuity",
        "Character",
        "Pacing",
        "Prose",
        "Horror",
    }

    @field_validator("rubric")
    @classmethod
    def _validate_rubric(cls, value: list[str]) -> list[str]:
        """Ensure rubric categories are recognised and non-empty."""

        if not value:
            msg = "rubric must include at least one category."
            raise ValueError(msg)

        cleaned: list[str] = []
        unknown: set[str] = set()
        for entry in value:
            if not isinstance(entry, str):
                msg = "rubric entries must be strings."
                raise ValueError(msg)
            normalized = entry.strip()
            if not normalized:
                msg = "rubric entries must be non-empty strings."
                raise ValueError(msg)
            if normalized not in cls._ALLOWED_RUBRIC:
                unknown.add(normalized)
            cleaned.append(normalized)

        if unknown:
            unknown_list = ", ".join(sorted(unknown))
            msg = f"Unknown rubric categories: {unknown_list}"
            raise ValueError(msg)

        return cleaned


__all__ = ["DraftCritiqueRequest"]

