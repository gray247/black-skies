"""Pydantic models shared across service endpoints."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ModelInfo(BaseModel):
    """Metadata describing the model that produced an artifact."""

    model_config = ConfigDict(extra="forbid")

    name: str
    provider: str


class DraftUnitMeta(BaseModel):
    """Optional metadata describing a draft unit."""

    model_config = ConfigDict(extra="forbid")

    pov: str | None = None
    purpose: str | None = None
    emotion_tag: str | None = None
    word_target: int | None = Field(default=None, ge=0)


class DraftUnit(BaseModel):
    """Representation of a draft unit in an envelope."""

    model_config = ConfigDict(extra="forbid")

    id: str
    text: str
    meta: DraftUnitMeta | None = None
    prompt_fingerprint: str | None = None
    model: ModelInfo | None = None


class DraftEnvelope(BaseModel):
    """Envelope carrying the units referenced by a rewrite request."""

    model_config = ConfigDict(extra="forbid")

    draft_id: str
    schema_version: str
    units: list[DraftUnit]


class RewriteRequest(BaseModel):
    """Request body for the draft rewrite endpoint."""

    model_config = ConfigDict(extra="forbid")

    draft_id: str
    unit_id: str
    instructions: str | None = None
    new_text: str
    envelope: DraftEnvelope


class DiffAnchors(BaseModel):
    """Context window lengths for diff visualization anchoring."""

    model_config = ConfigDict(extra="forbid")

    left: int
    right: int


class AddedDiff(BaseModel):
    """A contiguous segment inserted into the revised text."""

    model_config = ConfigDict(extra="forbid")

    range: tuple[int, int]
    text: str


class RemovedDiff(BaseModel):
    """A contiguous segment removed from the original text."""

    model_config = ConfigDict(extra="forbid")

    range: tuple[int, int]


class ChangedDiff(BaseModel):
    """A segment replaced in the revised text."""

    model_config = ConfigDict(extra="forbid")

    range: tuple[int, int]
    replacement: str


class DiffPayload(BaseModel):
    """Structured diff payload emitted by rewrite operations."""

    model_config = ConfigDict(extra="forbid")

    added: list[AddedDiff]
    removed: list[RemovedDiff]
    changed: list[ChangedDiff]
    anchors: DiffAnchors


class RewriteResponse(BaseModel):
    """Response body for the draft rewrite endpoint."""

    model_config = ConfigDict(extra="forbid")

    unit_id: str
    revised_text: str
    diff: DiffPayload
    schema_version: str
    model: ModelInfo


ErrorDetail = dict[str, Any]
