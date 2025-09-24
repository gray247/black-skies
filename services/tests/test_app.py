"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from blackskies.services.app import SERVICE_VERSION, create_app


@pytest.fixture()
async def async_client() -> AsyncIterator[AsyncClient]:
    """Provide an AsyncClient bound to the FastAPI app."""
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.mark.anyio()
async def test_health(async_client: AsyncClient) -> None:
    """The health endpoint returns the expected payload."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": SERVICE_VERSION}


@pytest.mark.anyio()
async def test_outline_build_stub(async_client: AsyncClient) -> None:
    """The outline build endpoint returns fixture data."""
    payload = {"project_id": "proj_123", "force_rebuild": False}
    response = await async_client.post("/outline/build", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["schema_version"] == "OutlineSchema v1"
    assert data["outline_id"] == "out_001"
    assert data["acts"] == ["Act I", "Act II", "Act III"]
