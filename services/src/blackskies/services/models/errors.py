"""Shared error response models."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

ErrorCode = Literal[
    "VALIDATION",
    "RATE_LIMIT",
    "BUDGET_EXCEEDED",
    "CONFLICT",
    "INTERNAL",
]


class ErrorDetail(BaseModel):
    """Structured error payload returned by service endpoints."""

    code: ErrorCode
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    trace_id: str


__all__ = ["ErrorCode", "ErrorDetail"]
