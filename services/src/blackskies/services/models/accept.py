"""Pydantic models for critique accept requests."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ._project_id import validate_project_id

_ID_PATTERN = r"^(sc|ch)_\d{4}$"
_SHA256_PATTERN = r"^[0-9a-f]{64}$"


class DraftAcceptUnit(BaseModel):
    """Client representation of an accepted draft unit."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=_ID_PATTERN)
    previous_sha256: str = Field(pattern=_SHA256_PATTERN)
    text: str
    meta: dict[str, Any] = Field(default_factory=dict)
    estimated_cost_usd: float | None = Field(default=None, ge=0)


class DraftAcceptRequest(BaseModel):
    """Request payload for the /draft/accept endpoint."""

    model_config = ConfigDict(extra="forbid")

    project_id: str
    draft_id: str
    unit_id: str = Field(pattern=_ID_PATTERN)
    unit: DraftAcceptUnit
    message: str | None = None
    snapshot_label: str | None = Field(default=None, max_length=64)

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        return validate_project_id(value)

    @model_validator(mode="after")
    def _validate_unit(self) -> "DraftAcceptRequest":
        if self.unit.id != self.unit_id:
            raise ValueError("unit.id must match unit_id.")
        return self


__all__ = [
    "DraftAcceptRequest",
    "DraftAcceptUnit",
]
