"""Error response models shared across service HTTP endpoints."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

__all__ = ["ErrorResponse"]


class ErrorResponse(BaseModel):
    """Standardised error payload emitted by Black Skies services."""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1)
    message: str = Field(min_length=1)
    details: dict[str, Any] = Field(default_factory=dict)
    trace_id: str = Field(min_length=1)
