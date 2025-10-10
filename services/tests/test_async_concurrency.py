"""Integration tests verifying long-running draft operations yield to other requests."""

from __future__ import annotations

import asyncio
import time
from pathlib import Path
from typing import Any

import pytest

httpx = pytest.importorskip("httpx")

from blackskies.services.critique import CritiqueService
from blackskies.services.draft_synthesizer import DraftSynthesizer

from test_app import API_PREFIX, SERVICE_VERSION, _bootstrap_outline, _build_critique_payload

pytestmark = pytest.mark.anyio("asyncio")


@pytest.fixture()
def anyio_backend() -> str:
    """Ensure AnyIO uses the asyncio event loop backend."""

    return "asyncio"


async def test_generate_allows_concurrent_health(
    async_client: httpx.AsyncClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Draft generation completes while concurrent health checks stay responsive."""

    project_id = "proj_async_generate"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    original_synthesize = DraftSynthesizer.synthesize

    def slow_synthesize(*args: Any, **kwargs: Any) -> Any:
        time.sleep(0.2)
        return original_synthesize(*args, **kwargs)

    monkeypatch.setattr(DraftSynthesizer, "synthesize", slow_synthesize)

    async def invoke_generate() -> dict[str, object]:
        response = await async_client.post(f"{API_PREFIX}/draft/generate", json=payload)
        assert response.status_code == 200, response.json()
        return response.json()

    generate_task = asyncio.create_task(invoke_generate())
    await asyncio.sleep(0)
    assert not generate_task.done()

    health_response = await async_client.get("/healthz")
    assert health_response.status_code == 200, health_response.text
    assert health_response.json() == {"status": "ok", "version": SERVICE_VERSION}

    result = await generate_task
    assert result["project_id"] == project_id
    assert len(result["units"]) == len(scene_ids)


async def test_critique_allows_concurrent_health(
    async_client: httpx.AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Draft critique yields to concurrent health checks while executing."""

    payload = _build_critique_payload()

    original_run = CritiqueService.run

    def slow_run(*args: Any, **kwargs: Any) -> Any:
        time.sleep(0.2)
        return original_run(*args, **kwargs)

    monkeypatch.setattr(CritiqueService, "run", slow_run)

    async def invoke_critique() -> dict[str, object]:
        response = await async_client.post(f"{API_PREFIX}/draft/critique", json=payload)
        assert response.status_code == 200, response.json()
        return response.json()

    critique_task = asyncio.create_task(invoke_critique())
    await asyncio.sleep(0)
    assert not critique_task.done()

    health_response = await async_client.get("/healthz")
    assert health_response.status_code == 200, health_response.text
    assert health_response.json() == {"status": "ok", "version": SERVICE_VERSION}

    result = await critique_task
    assert result["unit_id"] == payload["unit_id"]
