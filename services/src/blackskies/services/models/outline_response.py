"""Response models for outline operations."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .outline import OutlineChapter, OutlineScene


class OutlineBuildResponse(BaseModel):
    """Structured payload returned by the outline build endpoint."""

    schema_version: Literal["OutlineSchema v1"] = "OutlineSchema v1"
    outline_id: str = Field(pattern=r"^out_\d{3}$")
    acts: list[str] = Field(default_factory=list)
    chapters: list[OutlineChapter] = Field(default_factory=list)
    scenes: list[OutlineScene] = Field(default_factory=list)


__all__ = ["OutlineBuildResponse"]
