"""Unit tests for snapshot helpers."""

from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.snapshots import create_snapshot, list_snapshots


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
        (drafts_dir / f"{scene_id}.md").write_text(f"---\nid: {scene_id}\n---\nScene body", encoding="utf-8")
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
