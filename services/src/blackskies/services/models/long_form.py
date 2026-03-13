"""Pydantic models for long-form execution requests."""

from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ._project_id import validate_project_id


class LongFormExecuteRequest(BaseModel):
    """Request payload for the long-form execution endpoint."""

    model_config = ConfigDict(extra="forbid")

    project_id: str
    chapter_id: str
    scene_ids: list[str] = Field(min_length=1)
    chunk_size: int = Field(default=1, ge=1, le=10)
    target_words_per_chunk: int | None = Field(default=None, ge=100)
    enabled: bool = Field(default=False)

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)

    @model_validator(mode="after")
    def _validate_identifiers(self) -> "LongFormExecuteRequest":
        if not re.match(r"^ch_\d{4}$", self.chapter_id):
            msg = f"Invalid chapter identifier: {self.chapter_id}."
            raise ValueError(msg)
        seen: set[str] = set()
        for scene_id in self.scene_ids:
            if scene_id in seen:
                msg = "Scene IDs must be unique."
                raise ValueError(msg)
            seen.add(scene_id)
            if not re.match(r"^sc_\d{4}$", scene_id):
                msg = f"Invalid scene identifier: {scene_id}."
                raise ValueError(msg)
        return self


__all__ = ["LongFormExecuteRequest"]
