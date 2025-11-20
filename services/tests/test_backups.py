"""API tests that cover the Phase 5 backup bundle surface."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient


def _project_base_dir(client: TestClient) -> Path:
    return Path(client.app.state.settings.project_base_dir)


def _seed_project(base_dir: Path, project_id: str) -> Path:
    project_root = base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": f"Backup {project_id}"}, indent=2),
        encoding="utf-8",
    )
    (project_root / "outline.json").write_text(
        json.dumps({"schema_version": "OutlineSchema v1", "outline_id": "out_backup"}, indent=2),
        encoding="utf-8",
    )
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text("Scene body for backups.\n", encoding="utf-8")
    (project_root / "history").mkdir(parents=True, exist_ok=True)
    return project_root


def _create_backup(test_client: TestClient, project_id: str) -> dict[str, str]:
    response = test_client.post("/api/v1/backups", json={"projectId": project_id})
    assert response.status_code == 200
    return response.json()


def test_backup_creation_emits_bundle_with_checksums(test_client: TestClient) -> None:
    project_id = "proj_backup_create"
    project_root = _seed_project(_project_base_dir(test_client), project_id)

    payload = _create_backup(test_client, project_id)
    backup_path = project_root.parent / payload["path"]

    assert backup_path.exists()
    assert backup_path.suffix == ".zip"

    with zipfile.ZipFile(backup_path) as archive:
        members = set(archive.namelist())
        assert "project.json" in members
        assert "outline.json" in members
        assert "drafts/sc_0001.md" in members
        assert "checksums.json" in members
        checksums = json.loads(archive.read("checksums.json").decode("utf-8"))
        assert checksums["project_id"] == project_id
        assert any(entry["path"] == "project.json" for entry in checksums["files"])


def test_backup_restore_creates_restored_project(test_client: TestClient) -> None:
    project_id = "proj_backup_restore"
    project_root = _seed_project(_project_base_dir(test_client), project_id)

    payload = _create_backup(test_client, project_id)
    backup_name = Path(payload["path"]).name

    restore_response = test_client.post(
        "/api/v1/backups/restore",
        json={"backupName": backup_name},
    )
    assert restore_response.status_code == 200
    restored = restore_response.json()

    restored_slug = restored["restored_project_slug"]
    assert restored_slug.startswith(f"{project_id}_restored_")

    restored_dir = project_root.parent / restored_slug
    assert restored_dir.exists()
    assert (restored_dir / "project.json").exists()
    assert (restored_dir / "outline.json").exists()
    assert (restored_dir / "drafts").exists()


def test_backup_listing_returns_created_entries(test_client: TestClient) -> None:
    project_id = "proj_backup_list"
    _seed_project(_project_base_dir(test_client), project_id)

    payload = _create_backup(test_client, project_id)
    response = test_client.get("/api/v1/backups", params={"projectId": project_id})

    assert response.status_code == 200
    entries = response.json()
    assert any(entry["filename"] == payload["filename"] for entry in entries)
    assert payload["path"] in [entry["path"] for entry in entries]
