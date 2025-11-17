"""Unit tests for the backup verification helpers."""

from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.backup_verifier import run_verification
from blackskies.services.snapshots import create_snapshot


def _build_project(tmp_path: Path) -> Path:
    project_root = tmp_path / "verify-project"
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text('{"project_id": "verify-project"}', encoding="utf-8")
    (project_root / "outline.json").write_text('{"schema_version": "OutlineSchema v1"}', encoding="utf-8")
    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    (project_root / "drafts" / "sc_0001.md").write_text("Scene text", encoding="utf-8")
    return project_root


def test_verification_reports_ok(tmp_path: Path) -> None:
    project_root = _build_project(tmp_path)
    snapshot_meta = create_snapshot(project_root)
    report = run_verification(project_root, latest_only=True)

    assert report["snapshots"]
    snapshot_report = report["snapshots"][0]
    assert snapshot_report["status"] == "ok"

    snapshot_dir = project_root / snapshot_meta["path"]
    target = snapshot_dir / "project.json"
    target.unlink()

    report_after_corruption = run_verification(project_root, latest_only=True)
    snapshot_report = report_after_corruption["snapshots"][0]
    assert snapshot_report["status"] == "errors"
    assert any("missing project.json" in message for message in snapshot_report["errors"])
