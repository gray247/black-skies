"""API tests that cover the Phase 5 backup bundle surface."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

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
        json.dumps(
            {
                "schema_version": "OutlineSchema v1",
                "outline_id": "out_001",
                "acts": ["Act I"],
                "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
                "scenes": [
                    {
                        "id": "sc_0001",
                        "order": 1,
                        "title": "Scene 1",
                        "chapter_id": "ch_0001",
                        "beat_refs": [],
                    }
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "\n".join(
            [
                "---",
                "id: sc_0001",
                "slug: scene-0001",
                "title: Scene 1",
                "order: 1",
                "chapter_id: ch_0001",
                "purpose: setup",
                "emotion_tag: tension",
                "pov: Mara",
                "beats:",
                "  - inciting",
                "---",
                "",
                "Scene body for backups.",
                "",
            ]
        ),
        encoding="utf-8",
    )
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
    assert payload["operation"]["completion_status"] == "completed"
    assert payload["operation"]["archive_size_bytes"] > 0
    assert payload["operation"]["file_count"] >= 3


def test_backup_restore_creates_restored_project(test_client: TestClient) -> None:
    project_id = "proj_backup_restore"
    project_root = _seed_project(_project_base_dir(test_client), project_id)

    payload = _create_backup(test_client, project_id)
    backup_name = Path(payload["path"]).name

    restore_response = test_client.post(
        "/api/v1/backups/restore",
        json={"projectId": project_id, "backupName": backup_name, "restoreAsNew": True},
    )
    assert restore_response.status_code == 200
    restored = restore_response.json()

    restored_slug = restored["restored_project_slug"]
    assert restored_slug.startswith(f"{project_id}_restored_")
    assert restored["restore_observation"]["claim_scope"] == (
        "restored-copy-materialized-from-backup-archive"
    )
    assert restored["restore_observation"]["historical_only"] is False
    assert restored["restore_semantic_context"]["current_project_files_replaced"] is False
    assert restored["restore_semantic_context"]["restored_copy_materialized"] is True
    assert restored["operation"]["source_kind"] == "backup-bundle"
    assert restored["operation"]["completion_status"] == "validated-success"
    assert restored["operation"]["validation_status"] == "passed"

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


def test_backup_listing_orders_latest_first_for_project_restore_alignment(
    test_client: TestClient,
) -> None:
    project_id = "proj_backup_latest"
    project_root = _seed_project(_project_base_dir(test_client), project_id)

    with patch(
        "blackskies.services.backup_service._timestamp",
        side_effect=["20260510_012515", "20260510_012516"],
    ):
        first_payload = _create_backup(test_client, project_id)
        (project_root / "drafts" / "sc_0002.md").write_text("Later scene body.\n", encoding="utf-8")
        second_payload = _create_backup(test_client, project_id)

    response = test_client.get("/api/v1/backups", params={"projectId": project_id})
    assert response.status_code == 200
    entries = response.json()

    assert entries[0]["filename"] == second_payload["filename"]
    assert entries[1]["filename"] == first_payload["filename"]


def test_backup_restore_rejects_bundle_without_checksums(test_client: TestClient) -> None:
    project_id = "proj_bad_bundle"
    backups_dir = _project_base_dir(test_client) / "backups"
    backups_dir.mkdir(parents=True, exist_ok=True)
    archive_path = backups_dir / "BS_20260516_010101.zip"
    with zipfile.ZipFile(archive_path, "w") as archive:
        archive.writestr("project.json", json.dumps({"project_id": project_id}))
        archive.writestr("outline.json", json.dumps({"schema_version": "OutlineSchema v1"}))

    response = test_client.post(
        "/api/v1/backups/restore",
        json={
            "projectId": project_id,
            "backupName": archive_path.name,
            "restoreAsNew": True,
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert payload["message"] == "Backup bundle is missing checksums.json"
    assert "checksum_unavailable" in payload["details"]["eligibility_decision"]["blocked_reasons"]


def test_backup_restore_blocks_scope_mismatch(test_client: TestClient) -> None:
    project_id = "proj_backup_scope"
    backups_dir = _project_base_dir(test_client) / "backups"
    backups_dir.mkdir(parents=True, exist_ok=True)
    archive_path = backups_dir / "BS_20260516_010102.zip"
    with zipfile.ZipFile(archive_path, "w") as archive:
        archive.writestr(
            "checksums.json",
            json.dumps(
                {
                    "schema_version": "BackupChecksums v1",
                    "project_id": "proj_other",
                    "created_at": "2026-05-16T01:01:02Z",
                    "files": [
                        {"path": "project.json", "checksum": "deadbeef"},
                        {"path": "outline.json", "checksum": "deadbeef"},
                    ],
                }
            ),
        )
        archive.writestr("project.json", json.dumps({"project_id": "proj_other"}))
        archive.writestr("outline.json", json.dumps({"schema_version": "OutlineSchema v1"}))

    response = test_client.post(
        "/api/v1/backups/restore",
        json={
            "projectId": project_id,
            "backupName": archive_path.name,
            "restoreAsNew": True,
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert "scope_mismatch" in payload["details"]["eligibility_decision"]["blocked_reasons"]


def test_backup_restore_cleans_invalid_materialized_copy(
    test_client: TestClient, monkeypatch
) -> None:
    project_id = "proj_backup_invalid_cleanup"
    project_root = _seed_project(_project_base_dir(test_client), project_id)
    payload = _create_backup(test_client, project_id)
    backup_name = Path(payload["path"]).name

    monkeypatch.setattr(
        "blackskies.services.restore_service.validate_project",
        lambda *_args, **_kwargs: SimpleNamespace(
            is_ok=False,
            errors=["outline mismatch"],
            warnings=["restored draft missing index"],
        ),
    )

    restore_response = test_client.post(
        "/api/v1/backups/restore",
        json={"projectId": project_id, "backupName": backup_name, "restoreAsNew": True},
    )

    assert restore_response.status_code == 400
    detail = restore_response.json()
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["operation"]["cleanup_status"] == "completed"
    assert detail["details"]["operation"]["completion_status"] == "failed-cleaned"
    assert not any(project_root.parent.glob(f"{project_id}_restored_*"))
