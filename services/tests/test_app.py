"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

import json
import shutil
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient

from blackskies.services.app import SERVICE_VERSION, create_app
from blackskies.services.settings import get_settings


@pytest.fixture()
async def async_client() -> AsyncIterator[AsyncClient]:
    """Provide an AsyncClient bound to the FastAPI app."""
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


@pytest.fixture()
async def project_async_client(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> AsyncIterator[tuple[AsyncClient, Path]]:
    """Async client configured with a temporary project on disk."""

    repo_root = Path(__file__).resolve().parents[2]
    sample_project = repo_root / "sample_project" / "Esther_Estate"
    project_root = tmp_path / "Esther_Estate"
    shutil.copytree(sample_project, project_root)

    monkeypatch.setenv("BLACKSKIES_PROJECTS_ROOT", str(tmp_path))
    get_settings.cache_clear()

    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client, project_root


def _parse_scene_document(content: str) -> tuple[dict[str, Any], str]:
    """Parse YAML front matter and body from a scene file."""

    lines = content.splitlines()
    assert lines[0] == "---", "Scene file must begin with front matter delimiter"
    try:
        closing_index = lines.index("---", 1)
    except ValueError as exc:  # pragma: no cover - guard for corrupted files
        raise AssertionError("Scene file missing closing front matter delimiter") from exc

    front_matter_lines = lines[1:closing_index]
    front: dict[str, Any] = {}
    for line in front_matter_lines:
        key, raw_value = line.split(":", 1)
        key = key.strip()
        value = raw_value.strip()
        if value.startswith(("[", "{")) or value.startswith("\""):
            front[key] = json.loads(value)
        else:
            try:
                front[key] = int(value)
            except ValueError:
                front[key] = value

    body = "\n".join(lines[closing_index + 1 :]).strip()
    return front, body


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


@pytest.mark.anyio()
async def test_draft_generate_success(
    project_async_client: tuple[AsyncClient, Path]
) -> None:
    """Generating drafts writes Markdown files with synchronized metadata."""

    client, project_root = project_async_client
    payload = {
        "project_id": "proj_esther_estate",
        "unit_scope": "scene",
        "unit_ids": ["sc_0001", "sc_0002"],
        "temperature": 0.65,
        "seed": 7,
    }

    response = await client.post("/draft/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "DraftUnitSchema v1"
    assert data["draft_id"].startswith("dr_")

    units = {unit["id"]: unit for unit in data["units"]}
    assert set(units) == {"sc_0001", "sc_0002"}

    for scene_id, unit in units.items():
        assert unit["prompt_fingerprint"].startswith("sha256:")
        assert unit["model"] == {"name": "draft_synth_v1", "provider": "local"}
        assert isinstance(unit["seed"], int)

        scene_path = project_root / "drafts" / f"{scene_id}.md"
        assert scene_path.exists()
        front, body = _parse_scene_document(scene_path.read_text(encoding="utf-8"))

        assert front["id"] == scene_id
        assert front["purpose"] == unit["meta"]["purpose"]
        assert front["emotion_tag"] == unit["meta"]["emotion_tag"]
        assert front["word_target"] == unit["meta"]["word_target"]
        assert front["order"] >= 1
        assert front.get("chapter_id") == "ch_0001"
        assert body == unit["text"]


@pytest.mark.anyio()
async def test_draft_generate_unknown_scene(
    project_async_client: tuple[AsyncClient, Path]
) -> None:
    """Requests referencing unknown scenes return a VALIDATION error."""

    client, _ = project_async_client
    payload = {
        "project_id": "proj_esther_estate",
        "unit_scope": "scene",
        "unit_ids": ["sc_9999"],
    }
    response = await client.post("/draft/generate", json=payload)
    assert response.status_code == 400

    detail = response.json()
    assert detail["code"] == "VALIDATION"
    assert detail["details"] == {"scene_ids": ["sc_9999"]}


@pytest.mark.anyio()
async def test_draft_generate_scene_limit_exceeded(
    project_async_client: tuple[AsyncClient, Path]
) -> None:
    """Scene-scoped requests reject batches larger than five scenes."""

    client, _ = project_async_client
    payload = {
        "project_id": "proj_esther_estate",
        "unit_scope": "scene",
        "unit_ids": [f"sc_{index:04d}" for index in range(1, 7)],
    }

    response = await client.post("/draft/generate", json=payload)
    assert response.status_code == 400

    detail = response.json()
    assert detail["code"] == "VALIDATION"
    assert any("at most 5 scenes" in error["msg"] for error in detail["details"])
