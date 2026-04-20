from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence
from blackskies.services.routers.draft.common import _compute_sha256, normalize_submitted_scene_body
from blackskies.services.scene_docs import read_scene_document

API_PREFIX = "/api/v1"


def _workspace_temp_dir() -> Path:
    root = Path.cwd() / ".tmp" / f"blackskies-norm-{uuid4().hex}"
    root.mkdir(parents=True, exist_ok=False)
    return root


def _bootstrap_scene(
    tmp_path: Path,
    *,
    project_id: str,
    body: str = "Original body line.\nSecond line.",
) -> str:
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


@pytest.mark.parametrize(
    ("label", "submitted_text_factory"),
    [
        ("body_only", lambda body: body),
        (
            "full_scene",
            lambda body: "\n".join(
                [
                    "---",
                    "id: sc_0001",
                    "title: Scene",
                    "---",
                    body,
                    "",
                ]
            ),
        ),
    ],
)
def test_normalization_contract_shared_between_helper_rewrite_and_accept(
    label: str,
    submitted_text_factory,
) -> None:
    tmp_path = _workspace_temp_dir()
    try:
        expected_body = _bootstrap_scene(tmp_path, project_id=f"proj_norm_{label}")
        submitted_text = submitted_text_factory(expected_body)
        normalized_by_helper = normalize_submitted_scene_body(submitted_text)

        assert normalized_by_helper.strip() == expected_body.strip()

        app = create_app(ServiceSettings(project_base_dir=tmp_path))
        client = TestClient(app)
        project_id = f"proj_norm_{label}"

        rewrite_response = client.post(
            f"{API_PREFIX}/draft/rewrite",
            json={
                "project_id": project_id,
                "draft_id": "dr_norm_rewrite",
                "unit_id": "sc_0001",
                "instructions": "Tighten pacing.",
                "new_text": "Rewritten output line.",
                "unit": {
                    "id": "sc_0001",
                    "text": submitted_text,
                    "meta": {},
                },
            },
        )
        assert rewrite_response.status_code == 200
        assert rewrite_response.json()["provenance"]["route_name"] == "draft/rewrite"

        # Restore the source body so accept can validate previous_sha256 against baseline content.
        persistence = DraftPersistence(settings=ServiceSettings(project_base_dir=tmp_path))
        persistence.write_scene(
            project_id,
            {
                "id": "sc_0001",
                "title": "Scene",
                "order": 1,
                "chapter_id": "ch_0001",
            },
            expected_body,
        )
        accept_response = client.post(
            f"{API_PREFIX}/draft/accept",
            json={
                "project_id": project_id,
                "draft_id": "dr_norm_accept",
                "unit_id": "sc_0001",
                "unit": {
                    "id": "sc_0001",
                    "previous_sha256": _compute_sha256(expected_body),
                    "text": submitted_text,
                    "meta": {},
                },
                "message": "Normalization regression guard.",
            },
        )
        assert accept_response.status_code == 200
        _, _, persisted_body = read_scene_document(tmp_path / project_id, "sc_0001")
        assert persisted_body.strip() == normalized_by_helper.strip()
    finally:
        shutil.rmtree(tmp_path, ignore_errors=True)
