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


class LongFormRetryLocalRepairRequest(BaseModel):
    """Request payload for a bounded retry of local rescue on an existing chunk."""

    model_config = ConfigDict(extra="forbid")

    project_id: str | None = None
    project_path: str | None = None
    chunk_id: str

    @field_validator("project_id")
    @classmethod
    def _validate_optional_project_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_project_id(value)

    @model_validator(mode="after")
    def _validate_retry_identifiers(self) -> "LongFormRetryLocalRepairRequest":
        if not self.project_id and not self.project_path:
            msg = "Either project_id or project_path is required."
            raise ValueError(msg)
        if not re.match(r"^lf_[a-z0-9]{8}$", self.chunk_id):
            msg = f"Invalid chunk identifier: {self.chunk_id}."
            raise ValueError(msg)
        return self


__all__ = ["LongFormExecuteRequest", "LongFormRetryLocalRepairRequest"]
