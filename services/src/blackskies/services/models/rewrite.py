"""Pydantic models for draft rewrite requests."""

from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, Field, model_validator

_ID_PATTERN = re.compile(r"^(sc|ch)_\d{4}$")


class DraftRewriteUnit(BaseModel):
    """Envelope describing the client-side view of a draft unit."""

    id: str = Field(pattern=r"^(sc|ch)_\d{4}$")
    text: str
    meta: dict[str, Any] = Field(default_factory=dict)
    prompt_fingerprint: str | None = None
    model: dict[str, Any] | None = None
    seed: int | None = Field(default=None, ge=0)


class DraftRewriteRequest(BaseModel):
    """Request payload for the /draft/rewrite endpoint."""

    project_id: str
    draft_id: str
    unit_id: str = Field(pattern=r"^(sc|ch)_\d{4}$")
    instructions: str | None = None
    new_text: str | None = None
    unit: DraftRewriteUnit

    @model_validator(mode="after")
    def _validate_unit(self) -> "DraftRewriteRequest":
        if self.unit.id != self.unit_id:
            msg = "unit.id must match unit_id."
            raise ValueError(msg)
        return self


__all__ = [
    "DraftRewriteRequest",
    "DraftRewriteUnit",
]
