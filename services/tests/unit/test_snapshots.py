"""Unit tests for snapshot orchestration helpers."""

from __future__ import annotations

import json
import errno
from pathlib import Path
from typing import Any

import pytest

from datetime import datetime, timezone

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.persistence import SnapshotPersistence
from blackskies.services.snapshots import (
    SnapshotIncludesError,
    SnapshotPersistenceError,
    create_accept_snapshot,
    create_wizard_lock_snapshot,
)


class DummySnapshotPersistence:
    def __init__(
        self, *, payload: dict[str, Any] | None = None, error: Exception | None = None
    ) -> None:
        self.payload = payload or {"snapshot_id": "snap-001"}
        self.error = error
        self.calls: list[dict[str, Any]] = []

    def create_snapshot(
        self,
        project_id: str,
        *,
        label: str | None = None,
        include_entries: list[str] | None = None,
    ) -> dict[str, Any]:
        self.calls.append(
            {
                "project_id": project_id,
                "label": label,
                "include_entries": include_entries,
            }
        )
        if self.error is not None:
            raise self.error
        return self.payload


class DummyRecoveryTracker:
    def __init__(self) -> None:
        self.in_progress: list[dict[str, Any]] = []
        self.completed: list[tuple[str, dict[str, Any]]] = []

    def mark_in_progress(
        self, *args: Any, **kwargs: Any
    ) -> None:  # pragma: no cover - not exercised
        self.in_progress.append({"args": args, "kwargs": kwargs})

    def mark_completed(self, project_id: str, payload: dict[str, Any]) -> None:
        self.completed.append((project_id, payload))


def _collect_diagnostics(project_root: Path) -> list[dict[str, Any]]:
    history_dir = project_root / "history" / "diagnostics"
    if not history_dir.exists():
        return []
    entries = []
    for path in sorted(history_dir.glob("*.json")):
        entries.append(json.loads(path.read_text(encoding="utf-8")))
    return entries


def test_create_accept_snapshot_marks_completion() -> None:
    tracker = DummyRecoveryTracker()
    persistence = DummySnapshotPersistence(payload={"snapshot_id": "snap-123"})

    snapshot = create_accept_snapshot(
        "project-alpha",
        "final",
        snapshot_persistence=persistence,
        recovery_tracker=tracker,
    )

    assert snapshot == {"snapshot_id": "snap-123"}
    assert persistence.calls == [
        {"project_id": "project-alpha", "label": "final", "include_entries": None}
    ]
    assert tracker.completed == [("project-alpha", {"snapshot_id": "snap-123"})]


def test_create_accept_snapshot_allows_missing_label() -> None:
    tracker = DummyRecoveryTracker()
    persistence = DummySnapshotPersistence()

    create_accept_snapshot(
        "project-epsilon",
        None,
        snapshot_persistence=persistence,
        recovery_tracker=tracker,
    )

    assert persistence.calls == [
        {"project_id": "project-epsilon", "label": None, "include_entries": None}
    ]


def test_create_accept_snapshot_wraps_os_error() -> None:
    tracker = DummyRecoveryTracker()
    persistence = DummySnapshotPersistence(error=OSError(errno.EEXIST, "exists"))

    with pytest.raises(SnapshotPersistenceError) as excinfo:
        create_accept_snapshot(
            "project-theta",
            "final",
            snapshot_persistence=persistence,
            recovery_tracker=tracker,
        )

    assert excinfo.value.details["project_id"] == "project-theta"
    assert excinfo.value.details["label"] == "final"
    assert excinfo.value.details["errno"] == errno.EEXIST


def test_create_wizard_lock_snapshot_writes_diagnostics(tmp_path: Path) -> None:
    diagnostics = DiagnosticLogger()
    persistence = DummySnapshotPersistence(payload={"snapshot_id": "wiz-01"})

    snapshot = create_wizard_lock_snapshot(
        project_id="project-bravo",
        step="outline",
        label="wizard-outline",
        includes=["outline.json"],
        project_root=tmp_path,
        diagnostics=diagnostics,
        snapshot_persistence=persistence,
    )

    assert snapshot == {"snapshot_id": "wiz-01"}

    entries = _collect_diagnostics(tmp_path)
    assert entries, "Expected diagnostic entry to be written"
    last_entry = entries[-1]
    assert last_entry["code"] == "SNAPSHOT"
    assert last_entry["details"].get("step") == "outline"


def test_create_wizard_lock_snapshot_invalid_includes(tmp_path: Path) -> None:
    diagnostics = DiagnosticLogger()
    persistence = DummySnapshotPersistence(error=ValueError("bad include"))

    with pytest.raises(SnapshotIncludesError) as excinfo:
        create_wizard_lock_snapshot(
            project_id="project-charlie",
            step="draft",
            label="wizard-draft",
            includes=["drafts"],
            project_root=tmp_path,
            diagnostics=diagnostics,
            snapshot_persistence=persistence,
        )

    assert excinfo.value.details["project_id"] == "project-charlie"
    assert excinfo.value.details["includes"] == ["drafts"]


def test_snapshot_persistence_retries_same_tick(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Ensure snapshot creation survives timestamp collisions within a second."""

    class FrozenDateTime(datetime):
        @classmethod
        def now(cls, tz=None):
            moment = datetime(2025, 1, 1, 12, 0, 0, 123456, tzinfo=timezone.utc)
            if tz is None:
                return moment
            return moment.astimezone(tz)

    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = SnapshotPersistence(settings=settings)

    monkeypatch.setattr(
        "blackskies.services.persistence.datetime",
        FrozenDateTime,
    )

    first = persistence.create_snapshot("proj-collision")
    second = persistence.create_snapshot("proj-collision")

    assert first["snapshot_id"] != second["snapshot_id"]

    snapshots_dir = tmp_path / "proj-collision" / "history" / "snapshots"
    snapshot_ids = {entry.name.split("_", 1)[0] for entry in snapshots_dir.iterdir()}
    assert snapshot_ids == {first["snapshot_id"], second["snapshot_id"]}


def test_create_wizard_lock_snapshot_persistence_error(tmp_path: Path) -> None:
    diagnostics = DiagnosticLogger()
    persistence = DummySnapshotPersistence(error=OSError("disk full"))

    with pytest.raises(SnapshotPersistenceError) as excinfo:
        create_wizard_lock_snapshot(
            project_id="project-delta",
            step="scene",
            label="wizard-scene",
            includes=None,
            project_root=tmp_path,
            diagnostics=diagnostics,
            snapshot_persistence=persistence,
        )

    assert excinfo.value.details == {"project_id": "project-delta", "step": "scene"}

    entries = _collect_diagnostics(tmp_path)
    assert entries, "Expected diagnostic entry for persistence error"
    assert entries[-1]["code"] == "INTERNAL"
