"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import SERVICE_VERSION, create_app
from blackskies.services.config import reset_settings_cache


@pytest.fixture(autouse=True)
def configure_project_root(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Configure the project root to the bundled sample project."""

    sample_project = Path(__file__).resolve().parents[3] / "sample_project" / "Esther_Estate"
    monkeypatch.setenv("BLACKSKIES_PROJECT_ROOT", str(sample_project))
    reset_settings_cache()
    yield
    reset_settings_cache()


@pytest.fixture()
def client(configure_project_root: None) -> Iterator[TestClient]:
    """Provide a TestClient bound to the FastAPI app."""

    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_health(client: TestClient) -> None:
    """The health endpoint returns the expected payload."""

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": SERVICE_VERSION}


def test_outline_build_stub(client: TestClient) -> None:
    """The outline build endpoint returns fixture data."""

    payload = {"project_id": "proj_123", "force_rebuild": False}
    response = client.post("/outline/build", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["schema_version"] == "OutlineSchema v1"
    assert data["outline_id"] == "out_001"
    assert data["acts"] == ["Act I", "Act II", "Act III"]


def test_critique_success(client: TestClient) -> None:
    """Critique endpoint returns deterministic analysis for a known scene."""

    payload = {
        "draft_id": "dr_004",
        "unit_id": "sc_0001",
        "rubric": ["Logic", "Continuity", "Character", "Pacing", "Prose", "Horror"],
    }
    response = client.post("/draft/critique", json=payload)
    assert response.status_code == 200

    body = response.json()
    assert "results" in body
    assert len(body["results"]) == 1

    critique = body["results"][0]
    assert critique["unit_id"] == "sc_0001"
    assert critique["schema_version"] == "CritiqueOutputSchema v1"
    assert critique["summary"]
    assert critique["line_comments"]
    assert critique["priorities"]
    assert critique["suggested_edits"]
    assert critique["model"] == {"name": "heuristic_critique_v1", "provider": "local"}

    first_comment = critique["line_comments"][0]
    assert first_comment["line"] >= 1

    first_edit = critique["suggested_edits"][0]
    assert len(first_edit["range"]) == 2


def test_critique_invalid_rubric(client: TestClient) -> None:
    """Unknown rubric categories are rejected with a validation error."""

    payload = {"draft_id": "dr_004", "unit_id": "sc_0001", "rubric": ["Logic", "Magic"]}
    response = client.post("/draft/critique", json=payload)
    assert response.status_code == 400

    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["invalid_categories"] == ["Magic"]


def test_critique_batch_limit_exceeded(client: TestClient) -> None:
    """Requests exceeding the batch limit receive a validation error."""

    payload = {
        "draft_id": "dr_004",
        "unit_ids": ["sc_0001", "sc_0002", "sc_0003", "sc_0004"],
        "rubric": ["Logic"],
    }
    response = client.post("/draft/critique", json=payload)
    assert response.status_code == 400

    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION"
    assert "at most 3 units" in detail["message"]
