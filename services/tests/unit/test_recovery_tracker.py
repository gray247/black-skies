"""Unit tests for :mod:`blackskies.services.routers.recovery` helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.routers.recovery import RecoveryTracker


class _SnapshotStub:
    """Simple snapshot persistence stub for tracker tests."""

    def __init__(self, latest: dict[str, Any] | None = None) -> None:
        self._latest = latest

    def latest_snapshot(self, project_id: str) -> dict[str, Any] | None:  # noqa: D401
        return self._latest


@pytest.fixture()
def tracker(tmp_path: Path) -> RecoveryTracker:
    project_id = "proj-123"
    (tmp_path / project_id / "history" / "recovery").mkdir(parents=True)
    settings = ServiceSettings(project_base_dir=tmp_path)
    tracker = RecoveryTracker(settings)
    # Prime the state file to ensure consistent structure for tests
    tracker.mark_completed(project_id, {"snapshot_id": "snap-000", "path": "dummy"})
    return tracker


@pytest.fixture()
def project_id() -> str:
    return "proj-123"


def test_status_accept_in_progress_recent(tracker: RecoveryTracker, project_id: str) -> None:
    tracker.mark_in_progress(project_id, unit_id="unit-1", draft_id="draft-1")

    status = tracker.status(project_id, _SnapshotStub())

    assert status["status"] == "accept-in-progress"
    assert status.get("failure_reason") is None


def test_status_accept_in_progress_with_timeout(tracker: RecoveryTracker, project_id: str) -> None:
    tracker.mark_in_progress(project_id, unit_id="unit-1", draft_id="draft-1")
    stale_started_at = datetime.now(timezone.utc) - timedelta(minutes=10)
    state = tracker._read_state(project_id)
    state["started_at"] = stale_started_at.isoformat().replace("+00:00", "Z")
    tracker._write_state(project_id, state)

    status = tracker.status(project_id, _SnapshotStub())

    assert status["status"] == "needs-recovery"
    assert status.get("failure_reason") == "Accept operation timed out."


def test_status_accept_in_progress_with_failure_reason(
    tracker: RecoveryTracker, project_id: str
) -> None:
    tracker.mark_in_progress(project_id, unit_id="unit-1", draft_id="draft-1")
    state = tracker._read_state(project_id)
    state["failure_reason"] = "Filesystem write failed"
    tracker._write_state(project_id, state)

    status = tracker.status(project_id, _SnapshotStub())

    assert status["status"] == "needs-recovery"
    assert status.get("failure_reason") == "Filesystem write failed"


def test_status_accept_in_progress_with_invalid_timestamp(
    tracker: RecoveryTracker, project_id: str
) -> None:
    tracker.mark_in_progress(project_id, unit_id="unit-1", draft_id="draft-1")
    state = tracker._read_state(project_id)
    state["started_at"] = "not-a-timestamp"
    tracker._write_state(project_id, state)

    status = tracker.status(project_id, _SnapshotStub())

    assert status["status"] == "needs-recovery"
    assert status.get("failure_reason") == "Accept operation timestamp invalid."


def test_mark_in_progress_clears_existing_failure_reason(
    tracker: RecoveryTracker, project_id: str
) -> None:
    tracker.mark_needs_recovery(project_id, reason="Disk full")

    tracker.mark_in_progress(project_id, unit_id="unit-1", draft_id="draft-1")
    status = tracker.status(project_id, _SnapshotStub())

    assert status["status"] == "accept-in-progress"
    assert status.get("failure_reason") is None


def test_synthetic_mode_uses_non_durable_recovery_writes(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path)
    tracker = RecoveryTracker(settings)
    project_id = "proj-123"
    captured: list[bool] = []

    def fake_write_json_atomic(
        path: Path, payload: dict[str, Any], *, durable: bool = True
    ) -> None:
        captured.append(durable)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("{}", encoding="utf-8")

    monkeypatch.setattr(
        "blackskies.services.routers.recovery.allow_e2e_synthetic_mode",
        lambda: True,
    )
    monkeypatch.setattr(
        "blackskies.services.routers.recovery.write_json_atomic", fake_write_json_atomic
    )

    tracker.mark_in_progress(project_id, unit_id="unit-1", draft_id="draft-1")
    tracker.mark_completed(project_id, {"snapshot_id": "snap-001", "path": "dummy"})

    assert captured and all(flag is False for flag in captured)
