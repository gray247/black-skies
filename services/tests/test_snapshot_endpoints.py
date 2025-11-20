"""API-level tests for Phase 5 manual snapshots."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from blackskies.services import snapshots as snapshot_module


def _project_base_dir(client: TestClient) -> Path:
    return Path(client.app.state.settings.project_base_dir)


def _create_sample_project(base_dir: Path, project_id: str) -> Path:
    """Create the minimal files that snapshot creation expects."""

    project_root = base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)

    project_data = {
        "project_id": project_id,
        "name": f"Snapshot Sample {project_id}",
        "description": "Used by snapshot endpoint tests.",
    }
    (project_root / "project.json").write_text(json.dumps(project_data, indent=2), encoding="utf-8")

    outline_data = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_snapshot",
        "acts": ["Act I"],
        "chapters": [
            {"id": "ch_0001", "order": 1, "title": "Opening Act"},
        ],
        "scenes": [
            {"id": "sc_0001", "order": 1, "title": "Scene One", "chapter_id": "ch_0001"},
        ],
    }
    (project_root / "outline.json").write_text(json.dumps(outline_data, indent=2), encoding="utf-8")

    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    (drafts_dir / "sc_0001.md").write_text(
        "---\nid: sc_0001\n---\nSnapshot test content.\n", encoding="utf-8"
    )

    return project_root


def _call_create_snapshot(client: TestClient, project_id: str, path: str = "/api/v1/snapshots") -> dict[str, object]:
    response = client.post(path, json={"project_id": project_id})
    assert response.status_code == 200
    payload = response.json()
    assert "snapshot_id" in payload
    assert payload["path"].startswith(".snapshots/")
    return payload


def test_snapshot_creation_endpoint_writes_manifest_and_files(test_client: TestClient) -> None:
    project_id = "proj_snapshot_create"
    project_root = _create_sample_project(_project_base_dir(test_client), project_id)

    payload = _call_create_snapshot(test_client, project_id)

    snapshot_dir = project_root / payload["path"]
    manifest_path = snapshot_dir / "manifest.json"
    assert manifest_path.exists()

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    included_paths = [entry["path"] for entry in manifest.get("files_included", [])]
    assert "project.json" in included_paths
    assert "outline.json" in included_paths
    assert "drafts/sc_0001.md" in included_paths

    assert (snapshot_dir / "project.json").exists()
    assert (snapshot_dir / "outline.json").exists()
    assert (snapshot_dir / "drafts" / "sc_0001.md").exists()


def test_snapshot_restore_endpoint_reapplies_verified_state(test_client: TestClient) -> None:
    project_id = "proj_snapshot_restore"
    project_root = _create_sample_project(_project_base_dir(test_client), project_id)

    project_json = project_root / "project.json"
    drafts_dir = project_root / "drafts"
    original_project = json.loads(project_json.read_text(encoding="utf-8"))
    original_draft = (drafts_dir / "sc_0001.md").read_text(encoding="utf-8")

    # Build a fake snapshot inside history/snapshots/20250101T000000Z_accept
    snapshot_dir = project_root / "history" / "snapshots" / "20250101T000000Z_accept"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "project.json").write_text(json.dumps(original_project, indent=2), encoding="utf-8")
    (snapshot_dir / "outline.json").write_text(
        json.dumps({"schema_version": "OutlineSchema v1", "outline_id": "out_snapshot"}, indent=2),
        encoding="utf-8",
    )
    snapshot_drafts = snapshot_dir / "drafts"
    snapshot_drafts.mkdir(parents=True, exist_ok=True)
    (snapshot_drafts / "sc_0001.md").write_text(original_draft, encoding="utf-8")

    metadata = {
        "snapshot_id": "20250101T000000Z",
        "project_id": project_id,
        "label": "accept",
        "created_at": "2025-01-01T00:00:00Z",
        "includes": ["project.json", "outline.json", "drafts"],
    }
    (snapshot_dir / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")

    # Mutate the project so restore is meaningful.
    tampered_project = dict(original_project)
    tampered_project["name"] = "Mutated Name"
    project_json.write_text(json.dumps(tampered_project, indent=2), encoding="utf-8")
    (drafts_dir / "sc_0001.md").write_text("Corrupted snapshot text.", encoding="utf-8")

    response = test_client.post(
        "/api/v1/draft/recovery/restore",
        json={"project_id": project_id, "snapshot_id": "20250101T000000Z"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["last_snapshot"]["snapshot_id"] == "20250101T000000Z"

    restored_project = json.loads(project_json.read_text(encoding="utf-8"))
    restored_draft = (drafts_dir / "sc_0001.md").read_text(encoding="utf-8")
    assert restored_project == original_project
    assert restored_draft == original_draft


def test_snapshot_retention_prunes_old_entries(
    test_client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    project_id = "proj_snapshot_retention"
    project_root = _create_sample_project(_project_base_dir(test_client), project_id)

    created_ids: list[str] = []
    counter = {"value": 0}

    def fake_timestamp() -> str:
        counter["value"] += 1
        return f"ss_20250101T000000{counter['value']:02d}Z"

    monkeypatch.setattr("blackskies.services.snapshots._timestamp", fake_timestamp)

    for _ in range(snapshot_module.SNAPSHOT_RETENTION + 1):
        payload = _call_create_snapshot(test_client, project_id)
        created_ids.append(payload["snapshot_id"])

    snapshot_root = project_root / ".snapshots"
    assert snapshot_root.exists()
    directories = sorted(entry.name for entry in snapshot_root.iterdir() if entry.is_dir())
    assert len(directories) == snapshot_module.SNAPSHOT_RETENTION
    assert created_ids[0] not in directories
    for snapshot_id in created_ids[-snapshot_module.SNAPSHOT_RETENTION :]:
        assert snapshot_id in directories
