"""Response models for draft recovery endpoints."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field

from .draft_response_shared import SnapshotInfo


class RecoveryStatus(str, Enum):
    """Enumerate the recovery tracker lifecycle states."""

    IDLE = "idle"
    NEEDS_RECOVERY = "needs-recovery"
    ACCEPT_IN_PROGRESS = "accept-in-progress"


class DraftRecoveryResponse(BaseModel):
    """Payload returned by recovery status and restore endpoints."""

    project_id: str
    status: RecoveryStatus
    needs_recovery: bool
    pending_unit_id: str | None = Field(default=None)
    draft_id: str | None = Field(default=None)
    started_at: str | None = Field(default=None)
    last_snapshot: SnapshotInfo | None = Field(default=None)
    message: str | None = Field(default=None)
    failure_reason: str | None = Field(default=None)


__all__ = ["DraftRecoveryResponse", "RecoveryStatus"]
