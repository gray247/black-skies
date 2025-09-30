"""Response models for draft export operations."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class DraftExportResponse(BaseModel):
    """Payload describing an export result."""

    project_id: str
    path: str
    chapters: int = Field(ge=0)
    scenes: int = Field(ge=0)
    meta_header: bool
    exported_at: str
    schema_version: Literal["DraftExportResult v1"] = "DraftExportResult v1"


__all__ = ["DraftExportResponse"]
