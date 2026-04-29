"""HTTP-level tests for the draft scene read endpoint."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TypedDict, cast

from httpx import Response
from fastapi.testclient import TestClient


API_PREFIX = "/api/v1"


class _DraftReadSceneResponse(TypedDict):
    sceneId: str
    title: str
    text: str


class _ErrorDetails(TypedDict):
    project_id: str
    scene_id: str


class _ErrorResponse(TypedDict):
    code: str
    message: str
    details: _ErrorDetails
    trace_id: str


def _seed_project(client: TestClient, project_id: str) -> Path:
    base_dir = Path(client.app.state.settings.project_base_dir)
    project_root = base_dir / project_id
    project_root.mkdir(parents=True)
    project_root.joinpath("project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Draft Read Endpoint"}),
        encoding="utf-8",
    )
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": [
            {"id": "sc_0001", "order": 1, "title": "Scene One", "chapter_id": "ch_0001"},
            {"id": "sc_0002", "order": 2, "title": "Scene Two", "chapter_id": "ch_0001"},
        ],
    }
    project_root.joinpath("outline.json").write_text(
        json.dumps(outline, indent=2), encoding="utf-8"
    )
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir()
    drafts_dir.joinpath("sc_0001.md").write_text(
        "---\n"
        "id: sc_0001\n"
        "title: Scene One\n"
        "order: 1\n"
        "chapter_id: ch_0001\n"
        "---\n\n"
        "Draft body for scene one.\n",
        encoding="utf-8",
    )
    return project_root


def _read_error(response: Response) -> _ErrorResponse:
    payload = cast(_ErrorResponse, response.json())
    assert "trace_id" in payload
    return payload


def test_draft_read_endpoint_returns_scene_text(test_client: TestClient) -> None:
    project_id = "proj_draft_read_ok"
    _seed_project(test_client, project_id)

    response = test_client.get(
        f"{API_PREFIX}/draft/sc_0001",
        params={"project_id": project_id},
    )
    assert response.status_code == 200
    payload = cast(_DraftReadSceneResponse, response.json())
    assert payload == {
        "sceneId": "sc_0001",
        "title": "Scene One",
        "text": "---\n"
        "id: sc_0001\n"
        "title: Scene One\n"
        "order: 1\n"
        "chapter_id: ch_0001\n"
        "---\n\n"
        "Draft body for scene one.\n",
    }


def test_draft_read_endpoint_rejects_invalid_project_id(test_client: TestClient) -> None:
    response = test_client.get(
        f"{API_PREFIX}/draft/sc_0001",
        params={"project_id": "bad/project"},
    )
    assert response.status_code == 400
    payload = _read_error(response)
    assert payload["code"] == "VALIDATION"
    assert payload["message"] == "Invalid project id."
    details = payload["details"]
    assert details["project_id"] == "bad/project"
    assert details["scene_id"] == "sc_0001"


def test_draft_read_endpoint_returns_404_for_missing_project(test_client: TestClient) -> None:
    response = test_client.get(
        f"{API_PREFIX}/draft/sc_0001",
        params={"project_id": "proj_missing_draft_read"},
    )
    assert response.status_code == 404
    payload = _read_error(response)
    assert payload["code"] == "PROJECT_NOT_FOUND"
    assert payload["message"] == "Project does not exist."
    details = payload["details"]
    assert details["project_id"] == "proj_missing_draft_read"


def test_draft_read_endpoint_returns_404_for_missing_scene_draft(test_client: TestClient) -> None:
    project_id = "proj_draft_read_missing_scene_draft"
    _seed_project(test_client, project_id)

    response = test_client.get(
        f"{API_PREFIX}/draft/sc_0002",
        params={"project_id": project_id},
    )
    assert response.status_code == 404
    payload = _read_error(response)
    assert payload["code"] == "DRAFT_NOT_FOUND"
    assert payload["message"] == "Draft scene markdown is missing."
    details = payload["details"]
    assert details["project_id"] == project_id
    assert details["scene_id"] == "sc_0002"
