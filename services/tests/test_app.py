"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import SERVICE_VERSION, create_app


@pytest.fixture()
def client() -> Iterator[TestClient]:
    """Provide a TestClient bound to the FastAPI app."""

    app = create_app()
    with TestClient(app) as client:
        yield client


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
