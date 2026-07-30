from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence
from blackskies.services.routers.draft.common import _compute_sha256

API_PREFIX = "/api/v1"


def _bootstrap_scene(tmp_path: Path, *, project_id: str, body: str = "Original body line.") -> str:
    persistence = DraftPersistence(settings=ServiceSettings(project_base_dir=tmp_path))
    persistence.write_scene(
        project_id,
        {
            "id": "sc_0001",
            "title": "Scene",
            "order": 1,
            "chapter_id": "ch_0001",
        },
        body,
    )
    return body


def test_accept_snapshot_path_uses_history_authority(tmp_path: Path) -> None:
    project_id = "proj_snapshot_authority_accept"
    baseline_body = _bootstrap_scene(tmp_path, project_id=project_id)

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)
    response = client.post(
        f"{API_PREFIX}/draft/accept",
        json={
            "project_id": project_id,
            "draft_id": "dr_snapshot_authority",
            "unit_id": "sc_0001",
            "unit": {
                "id": "sc_0001",
                "previous_sha256": _compute_sha256(baseline_body),
                "text": f"{baseline_body}\n\nAccepted.",
                "meta": {},
            },
            "message": "Snapshot authority check.",
        },
    )
    assert response.status_code == 200
    snapshot_path = response.json()["snapshot"]["path"]
    assert snapshot_path.startswith("history/snapshots/")
    assert not snapshot_path.startswith(".snapshots/")


def test_recovery_status_does_not_source_last_snapshot_from_dot_snapshots(tmp_path: Path) -> None:
    project_id = "proj_snapshot_authority_recovery_status"
    project_root = tmp_path / project_id
    _bootstrap_scene(tmp_path, project_id=project_id)

    legacy_snapshot_dir = project_root / ".snapshots" / "ss_20250101T000000Z"
    legacy_snapshot_dir.mkdir(parents=True, exist_ok=True)
    (legacy_snapshot_dir / "manifest.json").write_text(
        json.dumps({"snapshot_id": "ss_20250101T000000Z"})
    )

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)
    response = client.get(f"{API_PREFIX}/draft/recovery", params={"project_id": project_id})

    assert response.status_code == 200
    payload = response.json()
    assert payload["last_snapshot"] is None


def test_recovery_restore_rejects_snapshot_ids_present_only_in_dot_snapshots(
    tmp_path: Path,
) -> None:
    project_id = "proj_snapshot_authority_recovery_restore"
    project_root = tmp_path / project_id
    _bootstrap_scene(tmp_path, project_id=project_id)

    legacy_snapshot_id = "20250101T000000Z"
    legacy_snapshot_dir = project_root / ".snapshots" / legacy_snapshot_id
    legacy_snapshot_dir.mkdir(parents=True, exist_ok=True)
    (legacy_snapshot_dir / "metadata.json").write_text(
        json.dumps({"snapshot_id": legacy_snapshot_id, "project_id": project_id}),
        encoding="utf-8",
    )

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)
    response = client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id, "snapshot_id": legacy_snapshot_id},
    )

    assert response.status_code == 400
    raw_payload = response.json()
    payload = raw_payload.get("detail", raw_payload)
    assert payload["code"] == "VALIDATION"
    assert payload["message"] == "Snapshot not found."
