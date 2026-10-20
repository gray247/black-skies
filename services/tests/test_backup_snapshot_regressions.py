"""Regression tests for snapshot/backup roundtrips and integrity."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

import pytest

from blackskies.services import snapshot_includes

from blackskies.services.snapshots import SNAPSHOT_RETENTION, create_snapshot, list_snapshots, prune_snapshots
from blackskies.services.export_service import ExportFormat, ProjectExportService
from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.export import compile_manuscript, load_outline_artifact
from blackskies.services.export_service import ProjectExportResult


def _write_outline(project_root: Path) -> None:
    payload = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": [
            {"id": "sc_0001", "order": 1, "title": "Opening Scene", "chapter_id": "ch_0001"}
        ],
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
    mutated_body.write_text(
        mutated_body.read_text(encoding="utf-8") + "\nExtra line.", encoding="utf-8"
    )

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
        monkeypatch.setattr(
            "blackskies.services.snapshots._timestamp", lambda i=index: f"snap_{i:02d}"
        )
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


def _restore_fixture(tmp_path: Path) -> tuple[Path, Path]:
    snapshot = tmp_path / "snapshot"
    project = tmp_path / "project"
    (snapshot / "drafts").mkdir(parents=True)
    (project / "drafts").mkdir(parents=True)
    (snapshot / "drafts/scene.md").write_text("archived replacement", encoding="utf-8")
    (project / "drafts/scene.md").write_text("previously saved prose", encoding="utf-8")
    return snapshot, project


def _restore_drafts(snapshot: Path, project: Path) -> None:
    snapshot_includes.restore_include_entries(
        snapshot_dir=snapshot,
        snapshot_dir_resolved=snapshot.resolve(),
        project_root=project,
        project_root_resolved=project.resolve(),
        include_entries=["drafts"],
    )


def test_directory_restore_preserves_prior_prose_when_commit_fails(tmp_path: Path, monkeypatch) -> None:
    snapshot, project = _restore_fixture(tmp_path)
    replace = snapshot_includes.replace_file

    def fail_commit(source: Path, target: Path) -> None:
        if source.name.endswith(".restore"):
            raise PermissionError("synthetic commit lock")
        replace(source, target)

    monkeypatch.setattr(snapshot_includes, "replace_file", fail_commit)
    with pytest.raises(PermissionError, match="synthetic commit lock"):
        _restore_drafts(snapshot, project)

    assert (project / "drafts/scene.md").read_text(encoding="utf-8") == "previously saved prose"
    assert (snapshot / "drafts/scene.md").read_text(encoding="utf-8") == "archived replacement"
    assert not list(project.glob(".*.restore"))
    assert not list(project.glob(".*.backup"))


def test_directory_restore_retains_recoverable_backup_when_rollback_fails(tmp_path: Path, monkeypatch) -> None:
    snapshot, project = _restore_fixture(tmp_path)
    replace = snapshot_includes.replace_file

    def fail_commit_and_rollback(source: Path, target: Path) -> None:
        if source.name.endswith((".restore", ".backup")):
            raise PermissionError("synthetic persistent lock")
        replace(source, target)

    monkeypatch.setattr(snapshot_includes, "replace_file", fail_commit_and_rollback)
    with pytest.raises(OSError, match="original preserved at") as failure:
        _restore_drafts(snapshot, project)

    backups = list(project.glob(".*.backup"))
    assert len(backups) == 1
    assert str(backups[0]) in str(failure.value)
    assert (backups[0] / "scene.md").read_text(encoding="utf-8") == "previously saved prose"
    assert not list(project.glob(".*.restore"))


def test_directory_restore_does_not_remove_prior_prose_when_backup_move_fails(tmp_path: Path, monkeypatch) -> None:
    snapshot, project = _restore_fixture(tmp_path)
    replace = snapshot_includes.replace_file

    def fail_backup(source: Path, target: Path) -> None:
        if source == project / "drafts":
            raise PermissionError("synthetic backup lock")
        replace(source, target)

    monkeypatch.setattr(snapshot_includes, "replace_file", fail_backup)
    with pytest.raises(PermissionError, match="synthetic backup lock"):
        _restore_drafts(snapshot, project)

    assert (project / "drafts/scene.md").read_text(encoding="utf-8") == "previously saved prose"
    assert not list(project.glob(".*.restore"))


def test_directory_restore_commits_replacement_and_removes_only_its_backup(tmp_path: Path) -> None:
    snapshot, project = _restore_fixture(tmp_path)
    retained = project / ".unrelated.backup"
    retained.mkdir()
    (retained / "keep.txt").write_text("unrelated recovery content", encoding="utf-8")

    _restore_drafts(snapshot, project)

    assert (project / "drafts/scene.md").read_text(encoding="utf-8") == "archived replacement"
    assert (retained / "keep.txt").read_text(encoding="utf-8") == "unrelated recovery content"
    assert list(project.glob(".*.backup")) == [retained]
    assert not list(project.glob(".*.restore"))


def _seed_snapshot_retention_fixture(project: Path) -> None:
    for snapshot_id in ["ss_20200101", "ss_20200102", "zz_in_progress.tmp"]:
        directory = project / ".snapshots" / snapshot_id
        directory.mkdir(parents=True)
        (directory / "manifest.json").write_text(
            json.dumps({"snapshot_id": snapshot_id}), encoding="utf-8"
        )


def test_snapshot_listing_does_not_publish_an_uncommitted_directory(tmp_path: Path) -> None:
    _seed_snapshot_retention_fixture(tmp_path)
    assert [row["snapshot_id"] for row in list_snapshots(tmp_path)] == ["ss_20200102", "ss_20200101"]


def test_snapshot_retention_does_not_count_or_delete_an_uncommitted_directory(tmp_path: Path) -> None:
    _seed_snapshot_retention_fixture(tmp_path)
    prune_snapshots(tmp_path, keep=1)
    assert (tmp_path / ".snapshots/zz_in_progress.tmp/manifest.json").is_file()
    assert (tmp_path / ".snapshots/ss_20200102/manifest.json").is_file()
    assert not (tmp_path / ".snapshots/ss_20200101").exists()
