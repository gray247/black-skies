"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

import asyncio
import json
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import SERVICE_VERSION, BuildTracker, create_app


def _build_payload() -> dict[str, object]:
    """Return a representative outline build payload."""

    return {
        "project_id": "proj_123",
        "force_rebuild": False,
        "wizard_locks": {
            "acts": [{"title": "Act I"}, {"title": "Act II"}, {"title": "Act III"}],
            "chapters": [
                {"title": "Arrival", "act_index": 1},
                {"title": "Storm", "act_index": 2},
            ],
            "scenes": [
                {"title": "Storm Cellar", "chapter_index": 1, "beat_refs": ["inciting"]},
                {"title": "Radio", "chapter_index": 2, "beat_refs": ["twist"]},
            ],
        },
    }


@pytest.fixture()
def test_client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    """Provide a TestClient bound to the FastAPI app."""

    monkeypatch.setenv("BLACKSKIES_PROJECT_BASE_DIR", str(tmp_path))
    app = create_app()
    with TestClient(app) as client:
        client.app = app  # type: ignore[attr-defined]
        yield client


def test_health(test_client: TestClient) -> None:
    """The health endpoint returns the expected payload."""

    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": SERVICE_VERSION}


def test_outline_build_success(test_client: TestClient, tmp_path: Path) -> None:
    """Building an outline persists an OutlineSchema artifact."""

    payload = _build_payload()
    response = test_client.post("/outline/build", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "OutlineSchema v1"
    assert data["outline_id"] == "out_001"
    assert data["acts"] == ["Act I", "Act II", "Act III"]
    assert data["chapters"][0]["id"] == "ch_0001"
    assert data["scenes"][0]["beat_refs"] == ["inciting"]

    outline_path = tmp_path / payload["project_id"] / "outline.json"
    assert outline_path.exists()
    with outline_path.open("r", encoding="utf-8") as handle:
        persisted = json.load(handle)
    assert persisted == data


def test_outline_build_missing_locks(test_client: TestClient, tmp_path: Path) -> None:
    """Missing wizard locks are rejected with validation errors and diagnostics."""

    project_id = "proj_missing"
    payload = {
        "project_id": project_id,
        "force_rebuild": False,
        "wizard_locks": {"acts": [{"title": "Act I"}], "chapters": [], "scenes": []},
    }

    response = test_client.post("/outline/build", json=payload)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION"
    assert "missing" in detail["details"]

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert len(files) == 1
    with files[0].open("r", encoding="utf-8") as handle:
        diagnostic = json.load(handle)
    assert diagnostic["code"] == "VALIDATION"


def test_outline_build_conflict(test_client: TestClient, tmp_path: Path) -> None:
    """Concurrent outline builds return a conflict and log diagnostics."""

    payload = _build_payload()
    payload["project_id"] = "proj_conflict"

    tracker: BuildTracker = test_client.app.state.build_tracker  # type: ignore[attr-defined]
    asyncio.run(tracker.begin(payload["project_id"]))
    try:
        response = test_client.post("/outline/build", json=payload)
    finally:
        asyncio.run(tracker.end(payload["project_id"]))

    assert response.status_code == 409
    detail = response.json()["detail"]
    assert detail["code"] == "CONFLICT"

    diagnostics_dir = tmp_path / payload["project_id"] / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert len(files) == 1
    with files[0].open("r", encoding="utf-8") as handle:
        diagnostic = json.load(handle)
    assert diagnostic["code"] == "CONFLICT"

