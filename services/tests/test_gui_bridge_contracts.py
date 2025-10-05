"""Contract-focused tests for GUI-facing FastAPI endpoints using HTTPX."""

from __future__ import annotations

from pathlib import Path

import pytest
import httpx

from test_app import (
    API_PREFIX,
    SERVICE_VERSION,
    _assert_trace_header,
    _bootstrap_outline,
    _read_error,
    _write_project_budget,
)

pytestmark = pytest.mark.anyio("asyncio")


@pytest.fixture()
def anyio_backend() -> str:
    """Force AnyIO to use the asyncio backend for these tests."""

    return "asyncio"


async def test_health_endpoint_contract(async_client: httpx.AsyncClient) -> None:
    """The health probe returns the expected payload and trace headers."""

    response = await async_client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": SERVICE_VERSION}
    _assert_trace_header(response)


async def test_preflight_success_contract(
    async_client: httpx.AsyncClient, tmp_path: Path
) -> None:
    """Preflight provides a budget estimate and scene metadata for valid projects."""

    project_id = "proj_async_preflight_ok"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _write_project_budget(tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=0.42)

    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 12_000}},
    }

    response = await async_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["project_id"] == project_id
    assert data["unit_scope"] == "scene"
    assert data["unit_ids"] == scene_ids
    assert data["model"]["name"].startswith("draft-")
    assert len(data["scenes"]) == 1
    budget = data["budget"]
    assert set(budget) >= {
        "estimated_usd",
        "status",
        "soft_limit_usd",
        "hard_limit_usd",
        "spent_usd",
        "total_after_usd",
    }
    assert budget["status"] in {"ok", "soft-limit"}
    _assert_trace_header(response)


async def test_preflight_missing_scene_contract(
    async_client: httpx.AsyncClient, tmp_path: Path
) -> None:
    """Preflight surfaces validation errors for unknown scene identifiers."""

    project_id = "proj_async_preflight_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)

    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = await async_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["missing_scene_ids"] == ["sc_9999"]


async def test_critique_contract(async_client: httpx.AsyncClient) -> None:
    """Critique endpoint returns the documented schema."""

    response = await async_client.post(f"{API_PREFIX}/draft/critique")
    assert response.status_code == 200
    payload = response.json()
    assert payload["schema_version"].startswith("CritiqueOutputSchema")
    assert payload["unit_id"]
    assert isinstance(payload.get("line_comments"), list)
    _assert_trace_header(response)


async def test_recovery_status_idle_contract(
    async_client: httpx.AsyncClient, tmp_path: Path
) -> None:
    """Recovery status endpoint reports idle projects with trace metadata."""

    project_id = "proj_async_recovery"
    _bootstrap_outline(tmp_path, project_id, scene_count=1)

    response = await async_client.get(
        f"{API_PREFIX}/draft/recovery", params={"project_id": project_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["project_id"] == project_id
    assert data["status"] == "idle"
    assert data["needs_recovery"] is False
    _assert_trace_header(response)


async def test_recovery_status_missing_project_error(async_client: httpx.AsyncClient) -> None:
    """Recovery status validates project identifiers and emits structured errors."""

    response = await async_client.get(
        f"{API_PREFIX}/draft/recovery", params={"project_id": "missing"}
    )
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert "missing" in detail["message"].lower()
