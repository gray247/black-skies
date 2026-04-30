"""Unit tests for snapshot helpers."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.models.wizard import WizardLockSnapshotRequest
import blackskies.services.snapshots as snapshots_module
from blackskies.services.snapshots import (
    create_snapshot,
    create_wizard_lock_snapshot,
    list_snapshots,
)


def _build_project(tmp_path: Path) -> Path:
    project_root = tmp_path / "snapshot-project"
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        json.dumps({"project_id": "snapshot-project", "name": "Snapshot Sample"}, indent=2),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps({"schema_version": "OutlineSchema v1", "outline_id": "out_001"}, indent=2),
        encoding="utf-8",
    )
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    for scene_id in ("sc_0001", "sc_0002"):
        (drafts_dir / f"{scene_id}.md").write_text(
            f"---\nid: {scene_id}\n---\nScene body", encoding="utf-8"
        )
    return project_root


def test_create_snapshot_produces_manifest(tmp_path: Path) -> None:
    project_root = _build_project(tmp_path)
    metadata = create_snapshot(project_root)

    assert "snapshot_id" in metadata
    assert "created_at" in metadata
    assert metadata["files_included"]

    snapshots = list_snapshots(project_root)
    assert snapshots
    snapshot = snapshots[0]
    assert snapshot["snapshot_id"] == metadata["snapshot_id"]
    assert "files_included" in snapshot
    assert snapshot["files_included"][0]["path"]

    manifest_path = project_root / snapshot["path"] / "manifest.json"
    assert manifest_path.exists()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["snapshot_id"] == metadata["snapshot_id"]
    assert "files_included" in manifest


def test_wizard_lock_logs_slow_snapshot_timings(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    project_root = _build_project(tmp_path)
    recorded_messages: list[str] = []

    class _Persistence:
        def create_snapshot(
            self,
            project_id: str,
            *,
            label: str | None = None,
            include_entries: list[str] | None = None,
            timing_hook=None,
        ) -> dict[str, str]:
            if timing_hook is not None:
                timing_hook(
                    {
                        "allocate_ms": 4.0,
                        "include_ms": 8.0,
                        "copy_ms": 12.0,
                        "metadata_ms": 6.0,
                        "manifest_ms": 9.0,
                        "total_ms": 140.0,
                    }
                )
            return {
                "snapshot_id": "ss_20260430T000000Z",
                "label": label or "wizard-structure",
                "created_at": "2026-04-30T00:00:00Z",
                "path": "history/snapshots/ss_20260430T000000Z_wizard-structure",
                "includes": include_entries or [],
            }

    payload = {"project_id": "snapshot-project", "step": "structure", "label": "wizard-structure"}
    request = WizardLockSnapshotRequest.model_validate(payload)

    monkeypatch.setattr(
        snapshots_module.LOGGER,
        "warning",
        lambda message, *args: recorded_messages.append(message % args if args else message),
    )

    result = create_wizard_lock_snapshot(
        project_id=request.project_id,
        step=request.step,
        label="wizard-structure",
        includes=None,
        project_root=project_root,
        diagnostics=DiagnosticLogger(),
        snapshot_persistence=_Persistence(),
    )

    assert result["snapshot_id"] == "ss_20260430T000000Z"
    assert recorded_messages
    assert (
        "Slow wizard lock snapshot request path=/api/v1/draft/wizard/lock" in recorded_messages[0]
    )
    assert "total_ms=140.00" in recorded_messages[0]
