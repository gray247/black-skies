from __future__ import annotations

from fastapi.testclient import TestClient

from black_skies.main import app


client = TestClient(app)


def test_healthz() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "version" in payload


def test_outline_endpoint() -> None:
    response = client.post(
        "/outline",
        json={"project_id": "proj_001", "wizard_locks": {}, "metadata": {"seed": 1}},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == "proj_001"
    assert data["status"] == "queued"


def test_draft_endpoint() -> None:
    response = client.post(
        "/draft",
        json={"project_id": "proj_002", "unit_ids": ["sc_0001", "sc_0002"]},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["project_id"] == "proj_002"
    assert len(data["units"]) == 2


def test_rewrite_endpoint() -> None:
    response = client.post(
        "/rewrite",
        json={
            "project_id": "proj_003",
            "unit_id": "sc_0001",
            "proposed_text": "Updated text",
            "message": "Incorporate feedback",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == "sc_0001"
    assert data["accepted_text"] == "Updated text"


def test_critique_endpoint() -> None:
    response = client.post(
        "/critique",
        json={
            "project_id": "proj_004",
            "unit_id": "sc_0001",
            "text": "Scene draft",
            "rubric": "default",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == "sc_0001"
    assert data["severity"] in {"low", "medium", "high"}
