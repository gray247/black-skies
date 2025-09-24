"""Pydantic models for draft generation endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DraftGenerateRequest(BaseModel):
    """Request payload for `/draft/generate`."""

    project_id: str = Field(min_length=1)
    unit_scope: Literal["scene", "chapter"]
    unit_ids: list[str] = Field(min_length=1)
    temperature: float | None = None
    seed: int | None = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def _enforce_limits(self) -> "DraftGenerateRequest":
        """Ensure the request respects scope limits and deduplicate IDs."""

        unique_unit_ids = list(dict.fromkeys(self.unit_ids))
        if self.unit_scope == "scene" and len(unique_unit_ids) > 5:
            msg = "Requests may include at most 5 scenes per call."
            raise ValueError(msg)
        if self.unit_scope == "chapter" and len(unique_unit_ids) != 1:
            msg = "Chapter scope requests must include exactly one chapter ID."
            raise ValueError(msg)

        self.unit_ids = unique_unit_ids
        return self


__all__ = ["DraftGenerateRequest"]
