"""Contract checks for analytics project_id validation and error shaping."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


def _seed_project(client: TestClient, project_id: str) -> None:
    base_dir = Path(client.app.state.settings.project_base_dir)
    project_root = base_dir / project_id
    project_root.mkdir(parents=True)
    project_root.joinpath("project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Contract Metrics"}),
        encoding="utf-8",
    )
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": [
            {"id": "sc_0001", "order": 1, "title": "Scene One", "chapter_id": "ch_0001"},
        ],
    }
    project_root.joinpath("outline.json").write_text(json.dumps(outline), encoding="utf-8")
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir()
    drafts_dir.joinpath("sc_0001.md").write_text(
        "---\nid: sc_0001\ntitle: Scene One\norder: 1\n---\n\"Hello.\"",
        encoding="utf-8",
    )


@pytest.mark.parametrize(
    ("path", "status_code", "expected_code"),
    [
        ("/api/v1/analytics/summary", 400, "VALIDATION"),
        ("/api/v1/analytics/scenes", 400, "VALIDATION"),
        ("/api/v1/analytics/relationships", 400, "VALIDATION"),
        ("/api/v1/analytics/budget", 400, "VALIDATION"),
    ],
)
def test_analytics_rejects_invalid_project_id(
    test_client: TestClient, path: str, status_code: int, expected_code: str
) -> None:
    response = test_client.get(path, params={"project_id": "../bad"})
    assert response.status_code == status_code
    payload = response.json()
    assert payload["code"] == expected_code
    assert payload["message"]
    assert "project_id" in payload["details"]


@pytest.mark.parametrize(
    ("path", "status_code", "expected_code"),
    [
        ("/api/v1/analytics/summary", 404, "FILESYSTEM_NOT_FOUND"),
        ("/api/v1/analytics/scenes", 404, "FILESYSTEM_NOT_FOUND"),
        ("/api/v1/analytics/relationships", 404, "FILESYSTEM_NOT_FOUND"),
        ("/api/v1/analytics/budget", 404, "FILESYSTEM_NOT_FOUND"),
    ],
)
def test_analytics_reports_missing_project_root_cleanly(
    test_client: TestClient, path: str, status_code: int, expected_code: str
) -> None:
    response = test_client.get(path, params={"project_id": "proj_missing"})
    assert response.status_code == status_code
    payload = response.json()
    assert payload["code"] == expected_code
    assert payload["message"]
    assert payload["details"]["project_id"] == "proj_missing"


def test_analytics_summary_success_still_works(test_client: TestClient) -> None:
    project_id = "proj_analytics_contract_ok"
    _seed_project(test_client, project_id)
    response = test_client.get("/api/v1/analytics/summary", params={"project_id": project_id})
    assert response.status_code == 200
    payload = response.json()
    assert payload["projectId"] == project_id


def test_analytics_summary_missing_outline_is_clean_4xx(test_client: TestClient) -> None:
    project_id = "proj_analytics_missing_outline"
    base_dir = Path(test_client.app.state.settings.project_base_dir)
    project_root = base_dir / project_id
    project_root.mkdir(parents=True)
    project_root.joinpath("project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Missing Outline"}),
        encoding="utf-8",
    )

    response = test_client.get("/api/v1/analytics/summary", params={"project_id": project_id})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
