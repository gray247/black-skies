"""Unit tests for the backup verification helpers."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

from blackskies.services.backup_service import BackupService
from blackskies.services.backup_verifier import run_verification
from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.persistence import write_json_atomic
from blackskies.services.snapshots import create_snapshot


def _build_project(tmp_path: Path) -> Path:
    project_root = tmp_path / "verify-project"
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text('{"project_id": "verify-project"}', encoding="utf-8")
    (project_root / "outline.json").write_text('{"schema_version": "OutlineSchema v1"}', encoding="utf-8")
    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    (project_root / "drafts" / "sc_0001.md").write_text("Scene text", encoding="utf-8")
    return project_root


def _persist_report(project_root: Path, report: dict[str, any]) -> Path:
    snapshot_dir = project_root / ".snapshots"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    target = snapshot_dir / "last_verification.json"
    write_json_atomic(target, report)
    return target


def test_verification_reports_ok(tmp_path: Path) -> None:
    project_root = _build_project(tmp_path)
    settings = ServiceSettings(project_base_dir=tmp_path)
    snapshot_meta = create_snapshot(project_root)
    backup_service = BackupService(settings=settings, diagnostics=DiagnosticLogger())
    backup_service.create_backup(project_id="verify-project")

    report = run_verification(project_root, settings=settings, latest_only=True)

    assert report["snapshots"]
    snapshot_report = report["snapshots"][0]
    assert snapshot_report["status"] == "ok"
    assert report["backups"]
    assert report["backups"][0]["status"] == "ok"
    assert report["status"] == "ok"

    target = _persist_report(project_root, report)
    loaded = json.loads(target.read_text(encoding="utf-8"))
    assert loaded["project_id"] == "verify-project"


def test_verification_reports_snapshot_corruption(tmp_path: Path) -> None:
    project_root = _build_project(tmp_path)
    settings = ServiceSettings(project_base_dir=tmp_path)
    snapshot_meta = create_snapshot(project_root)

    report = run_verification(project_root, settings=settings, latest_only=True)
    assert report["snapshots"][0]["status"] == "ok"

    snapshot_dir = project_root / snapshot_meta["path"]
    (snapshot_dir / "project.json").unlink()

    corrupted = run_verification(project_root, settings=settings, latest_only=True)
    snapshot_report = corrupted["snapshots"][0]
    assert snapshot_report["status"] == "errors"
    assert any("missing project.json" in message for message in snapshot_report["errors"])


def test_verification_detects_corrupt_backup(tmp_path: Path) -> None:
    project_root = _build_project(tmp_path)
    settings = ServiceSettings(project_base_dir=tmp_path)
    backup_dir = settings.backups_dir
    backup_dir.mkdir(parents=True, exist_ok=True)

    bad_zip = backup_dir / "BS_corrupt.zip"
    with zipfile.ZipFile(bad_zip, "w") as archive:
        archive.writestr("checksums.json", json.dumps({"project_id": "verify-project", "files": []}))

    report = run_verification(project_root, settings=settings, latest_only=True)
    assert report["backups"]
    backup_report = report["backups"][0]
    assert backup_report["status"] == "errors"
    assert any("project.json missing in archive" == error for error in backup_report["errors"])
    assert report["status"] == "error"
