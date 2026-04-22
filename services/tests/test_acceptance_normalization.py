from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence
from blackskies.services.routers.draft.common import _compute_sha256
from blackskies.services.scene_docs import read_scene_document

API_PREFIX = "/api/v1"


def _bootstrap_scene(
    tmp_path: Path,
    *,
    project_id: str,
    unit_id: str = "sc_0001",
    body: str = "Original body line.",
) -> str:
    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = DraftPersistence(settings=settings)
    persistence.write_scene(
        project_id,
        {
            "id": unit_id,
            "title": "Scene",
            "order": 1,
            "chapter_id": "ch_0001",
        },
        body,
    )
    return body


def test_accept_normalizes_full_scene_submission_to_body(tmp_path: Path) -> None:
    project_id = "proj_accept_full_scene"
    scene_body = _bootstrap_scene(tmp_path, project_id=project_id)
    previous_sha256 = _compute_sha256(scene_body)
    full_scene_text = "\n".join(
        [
            "---",
            "id: sc_0001",
            "title: Scene",
            "---",
            scene_body,
            "",
        ]
    )

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)

    response = client.post(
        f"{API_PREFIX}/draft/accept",
        json={
            "project_id": project_id,
            "draft_id": "dr_accept_001",
            "unit_id": "sc_0001",
            "unit": {
                "id": "sc_0001",
                "previous_sha256": previous_sha256,
                "text": full_scene_text,
                "meta": {},
            },
            "message": "Apply accepted draft.",
        },
    )

    assert response.status_code == 200
    _, _, persisted_body = read_scene_document(tmp_path / project_id, "sc_0001")
    assert persisted_body.strip() == scene_body
    assert "\n---\n" not in persisted_body
