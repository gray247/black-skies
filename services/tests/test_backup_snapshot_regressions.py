"""Regression tests for snapshot/backup roundtrips and integrity."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

from blackskies.services.snapshots import SNAPSHOT_RETENTION, create_snapshot, list_snapshots
from blackskies.services.export_service import ExportFormat, ProjectExportService
from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.export import compile_manuscript, load_outline_artifact
from blackskies.services.export_service import ProjectExportResult
from blackskies.services.persistence import SnapshotPersistence


def _write_outline(project_root: Path) -> None:
    payload = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": [{"id": "sc_0001", "order": 1, "title": "Opening Scene", "chapter_id": "ch_0001"}],
    }
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "outline.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _write_scene(project_root: Path, body: str) -> None:
    draft_path = project_root / "drafts"
    draft_path.mkdir(parents=True, exist_ok=True)
    content = (
        "---\n"
        "id: sc_0001\n"
        "title: Opening Scene\n"
        "order: 1\n"
        "chapter_id: ch_0001\n"
        "---\n\n"
        f"{body}\n"
    )
    (draft_path / "sc_0001.md").write_text(content, encoding="utf-8")


def _bootstrap_project(tmp_path: Path, project_id: str) -> Path:
    project_root = tmp_path / project_id
    _write_outline(project_root)
    _write_scene(project_root, "Initial draft body.")
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Snapshot Project"}, indent=2),
        encoding="utf-8",
    )
    return project_root


def test_snapshot_roundtrip_preserves_content(tmp_path: Path) -> None:
    project_id = "snap-roundtrip"
    project_root = _bootstrap_project(tmp_path, project_id)
    snapshot_meta = create_snapshot(project_root)

    manifest_path = project_root / snapshot_meta["path"] / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["snapshot_id"] == snapshot_meta["snapshot_id"]
    assert manifest["files_included"]

    # Mutate draft then restore from snapshot archive
    mutated_body = project_root / "drafts" / "sc_0001.md"
    mutated_body.write_text(mutated_body.read_text(encoding="utf-8") + "\nExtra line.", encoding="utf-8")

    # Restore manually by copying archived file back
    archived_draft = project_root / snapshot_meta["path"] / "drafts" / "sc_0001.md"
    mutated_body.write_text(archived_draft.read_text(encoding="utf-8"), encoding="utf-8")

    restored = mutated_body.read_text(encoding="utf-8")
    assert "Extra line." not in restored


def test_backup_zip_contains_manifest_and_files(tmp_path: Path) -> None:
    project_id = "backup-zip"
    project_root = _bootstrap_project(tmp_path, project_id)
    snapshot_meta = create_snapshot(project_root)

    snapshot_root = Path(snapshot_meta["path"].split("/", 1)[0])
    assert snapshot_root.name == ".snapshots"

    # Create a zip backup of the snapshot directory
    snapshot_dir = project_root / snapshot_meta["path"]
    backup_path = project_root / "backup.zip"
    with zipfile.ZipFile(backup_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in snapshot_dir.rglob("*"):
            archive.write(path, path.relative_to(project_root))

    with zipfile.ZipFile(backup_path) as archive:
        members = set(archive.namelist())
        assert f"{snapshot_meta['path']}/manifest.json" in members
        assert f"{snapshot_meta['path']}/drafts/sc_0001.md" in members


def test_snapshot_ids_increase_monotonically(tmp_path: Path, monkeypatch) -> None:
    project_id = "snapshot-ids"
    project_root = _bootstrap_project(tmp_path, project_id)

    ids: list[str] = []
    for index in range(SNAPSHOT_RETENTION):
        monkeypatch.setattr("blackskies.services.snapshots._timestamp", lambda i=index: f"snap_{i:02d}")
        ids.append(create_snapshot(project_root)["snapshot_id"])

    assert ids == sorted(ids)
    listed = [entry["snapshot_id"] for entry in list_snapshots(project_root)]
    assert listed == sorted(listed, reverse=True)


def test_restore_and_export_integrity(tmp_path: Path) -> None:
    project_id = "snapshot-export"
    project_root = _bootstrap_project(tmp_path, project_id)
    snapshot_meta = create_snapshot(project_root)

    # Simulate restore by overwriting the draft then reloading outline/draft for export
    mutated_body = project_root / "drafts" / "sc_0001.md"
    mutated_body.write_text("Corrupted content", encoding="utf-8")
    archived_draft = project_root / snapshot_meta["path"] / "drafts" / "sc_0001.md"
    mutated_body.write_text(archived_draft.read_text(encoding="utf-8"), encoding="utf-8")

    outline = load_outline_artifact(project_root)
    manuscript, chapter_count, scene_count = compile_manuscript(project_root, outline)
    assert chapter_count == 1
    assert scene_count == 1
    assert "Opening Scene" in manuscript

    settings = ServiceSettings(project_base_dir=project_root.parent)
    service = ProjectExportService(settings=settings, diagnostics=DiagnosticLogger())
    result: ProjectExportResult = __import__("asyncio").run(
        service.export(project_id=project_id, format=ExportFormat.MD, include_meta_header=False)
    )
    payload = result.payload
    exported_path = project_root / payload["path"]
    assert exported_path.exists()
    assert "Opening Scene" in exported_path.read_text(encoding="utf-8")

    snapshots = list_snapshots(project_root)
    assert snapshots
    assert snapshots[0]["snapshot_id"] == snapshot_meta["snapshot_id"]
