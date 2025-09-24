"""Pydantic models for critique requests and responses."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Annotated, Literal

from pydantic import AliasChoices, BaseModel, Field, field_validator

ALLOWED_RUBRIC_CATEGORIES: frozenset[str] = frozenset(
    {"Logic", "Continuity", "Character", "Pacing", "Prose", "Horror"}
)


class LineComment(BaseModel):
    """A comment anchored to a specific line in the Markdown source."""

    line: Annotated[int, Field(ge=1)]
    note: Annotated[str, Field(min_length=1)]


class SuggestedEdit(BaseModel):
    """A suggested edit represented as a replacement range."""

    range: Annotated[tuple[int, int], Field(min_length=2, max_length=2)]
    replacement: Annotated[str, Field(min_length=1)]


class ModelInfo(BaseModel):
    """Metadata about the generator producing the critique."""

    name: Annotated[str, Field(min_length=1)]
    provider: Annotated[str, Field(min_length=1)]


class CritiqueOutput(BaseModel):
    """Schema-aligned critique output for a single unit."""

    unit_id: Annotated[str, Field(min_length=1)]
    schema_version: Literal["CritiqueOutputSchema v1"] = "CritiqueOutputSchema v1"
    summary: Annotated[str, Field(min_length=1)]
    line_comments: list[LineComment]
    priorities: list[str]
    suggested_edits: list[SuggestedEdit]
    model: ModelInfo


class CritiqueBatchResponse(BaseModel):
    """Envelope returned from the critique service."""

    results: list[CritiqueOutput]


class CritiqueRequest(BaseModel):
    """Request payload accepted by the critique endpoint."""

    draft_id: Annotated[str, Field(min_length=1)]
    rubric: Annotated[list[str], Field(min_length=1)]
    unit_ids: Annotated[list[str], Field(min_length=1)] = Field(
        validation_alias=AliasChoices("unit_ids", "unit_id")
    )

    @field_validator("rubric")
    @classmethod
    def _validate_rubric(cls, value: list[str]) -> list[str]:
        """Ensure rubric entries are non-empty strings."""

        cleaned: list[str] = []
        for entry in value:
            trimmed = entry.strip()
            if not trimmed:
                raise ValueError("rubric entries must be non-empty")
            cleaned.append(trimmed)
        return cleaned

    @field_validator("unit_ids", mode="before")
    @classmethod
    def _coerce_unit_ids(cls, value: str | Sequence[str]) -> list[str]:
        """Normalise scalar unit identifiers into a list."""

        if isinstance(value, str):
            return [value]
        if isinstance(value, Sequence):
            return list(value)
        raise TypeError("unit_ids must be provided.")

    @field_validator("unit_ids")
    @classmethod
    def _validate_unit_ids(cls, value: list[str]) -> list[str]:
        """Ensure IDs are non-empty and deduplicated preserving order."""

        seen: set[str] = set()
        cleaned: list[str] = []
        for unit in value:
            trimmed = unit.strip()
            if not trimmed:
                raise ValueError("unit_ids entries must not be empty.")
            if trimmed not in seen:
                seen.add(trimmed)
                cleaned.append(trimmed)
        return cleaned

    def resolved_unit_ids(self) -> list[str]:
        """Return the validated unit identifiers."""

        return list(self.unit_ids)
