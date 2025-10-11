"""Tests for snapshot persistence orchestration helpers."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import yaml

from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import (
    DraftPersistence,
    SNAPSHOT_ID_PATTERN,
    SnapshotPersistence,
)


def _setup_project(tmp_path: Path) -> tuple[ServiceSettings, str, Path]:
    project_base = tmp_path / "projects"
    project_base.mkdir()
    settings = ServiceSettings(project_base_dir=project_base)

    project_id = "novel-alpha"
    project_root = project_base / project_id
    project_root.mkdir()

    (project_root / "project.json").write_text(
        json.dumps({"title": "Test Project", "version": 1}),
        encoding="utf-8",
    )

    outline_payload = {
        "scenes": [
            {"id": "scene-1", "title": "Opening"},
        ]
    }
    (project_root / "outline.json").write_text(
        json.dumps(outline_payload),
        encoding="utf-8",
    )

    DraftPersistence(settings=settings).write_scene(
        project_id,
        front_matter={"id": "scene-1", "title": "Opening", "order": 1},
        body="Once upon a time...",
    )

    return settings, project_id, project_root


def test_snapshot_creation_writes_manifest(tmp_path: Path) -> None:
    settings, project_id, project_root = _setup_project(tmp_path)
    persistence = SnapshotPersistence(settings=settings)

    snapshot = persistence.create_snapshot(project_id, label="Checkpoint 1")

    assert SNAPSHOT_ID_PATTERN.fullmatch(snapshot["snapshot_id"])
    assert snapshot["label"] == "Checkpoint-1"  # label sanitised to filesystem friendly form
    assert sorted(snapshot["includes"]) == ["drafts", "outline.json", "project.json"]

    snapshots_dir = project_root / "history" / "snapshots"
    snapshot_dir = snapshots_dir / f"{snapshot['snapshot_id']}_{snapshot['label']}"
    metadata_path = snapshot_dir / "metadata.json"
    manifest_path = snapshot_dir / "snapshot.yaml"

    assert metadata_path.exists()
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert metadata["includes"] == snapshot["includes"]

    assert manifest_path.exists()
    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    assert manifest["schema_version"] == "SnapshotManifest v1"
    assert manifest["snapshot_id"] == snapshot["snapshot_id"]
    assert manifest["includes"] == snapshot["includes"]

    drafts = {entry["id"]: entry for entry in manifest["drafts"]}
    assert "scene-1" in drafts
    assert drafts["scene-1"]["path"] == "drafts/scene-1.md"


def test_restore_snapshot_uses_default_includes(tmp_path: Path) -> None:
    settings, project_id, project_root = _setup_project(tmp_path)
    persistence = SnapshotPersistence(settings=settings)

    snapshot = persistence.create_snapshot(project_id, label="restore-test")

    snapshot_dir = project_root / "history" / "snapshots" / f"{snapshot['snapshot_id']}_{snapshot['label']}"
    metadata_path = snapshot_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata["includes"] = []  # ensure restore falls back to default include set
    metadata_path.write_text(json.dumps(metadata), encoding="utf-8")

    shutil.rmtree(project_root / "drafts")
    (project_root / "outline.json").unlink()
    (project_root / "project.json").write_text(
        json.dumps({"title": "mutated"}),
        encoding="utf-8",
    )

    restore_result = persistence.restore_snapshot(project_id, snapshot["snapshot_id"])

    assert sorted(restore_result["includes"]) == ["drafts", "outline.json", "project.json"]
    restored_scene = (project_root / "drafts" / "scene-1.md").read_text(encoding="utf-8")
    assert "Opening" in restored_scene
    assert json.loads((project_root / "project.json").read_text(encoding="utf-8"))["title"] == "Test Project"

