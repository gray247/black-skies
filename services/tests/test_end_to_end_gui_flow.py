"""End-to-end service flow mirroring the GUI wizard → draft → critique pipeline."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
import httpx

from test_app import API_PREFIX, SERVICE_VERSION, _build_payload, _write_project_budget

pytestmark = pytest.mark.anyio("asyncio")


@pytest.fixture()
def anyio_backend() -> str:
    """Force AnyIO to use the asyncio backend."""

    return "asyncio"


async def test_full_gui_flow(async_client: httpx.AsyncClient, tmp_path: Path) -> None:
    """Build outline, preflight, generate, critique, accept, export."""

    # Outline build
    project_id = "proj_gui_flow"
    payload_outline = _build_payload()
    payload_outline["wizard_locks"]["scenes"] = payload_outline["wizard_locks"]["scenes"][:1]
    payload_outline["project_id"] = project_id
    response = await async_client.post(f"{API_PREFIX}/outline/build", json=payload_outline)
    assert response.status_code == 200, response.json()
    outline = response.json()
    assert outline["schema_version"] == "OutlineSchema v1"

    # Preflight
    _write_project_budget(tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=0.0)
    payload_preflight = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": ["sc_0001"],
        "overrides": {"sc_0001": {"word_target": 6000}},
    }
    response = await async_client.post(
        f"{API_PREFIX}/draft/preflight", json=payload_preflight
    )
    assert response.status_code == 200, response.json()
    preflight = response.json()
    assert preflight["budget"]["status"] in {"ok", "soft-limit"}

    # Generate draft
    response = await async_client.post(f"{API_PREFIX}/draft/generate", json=payload_preflight)
    assert response.status_code == 200, response.json()
    draft_data = response.json()
    assert draft_data["schema_version"] == "DraftUnitSchema v1"
    scene_path = tmp_path / project_id / "drafts" / "sc_0001.md"
    assert scene_path.exists()
    original_text = draft_data["units"][0]["text"]
    full_scene_content = scene_path.read_text(encoding="utf-8")

    # Critique (uses canned response)
    response = await async_client.post(f"{API_PREFIX}/draft/critique")
    assert response.status_code == 200, response.json()
    critique = response.json()
    assert critique["schema_version"].startswith("CritiqueOutputSchema")

    # Accept updates and snapshot
    def compute_sha256(value: str) -> str:
        import hashlib

        normalized = value.replace("\r\n", "\n").strip()
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    accepted_text = original_text + "\n\nAccepted revision."

    payload_accept = {
        "project_id": project_id,
        "draft_id": draft_data["draft_id"],
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": compute_sha256(original_text),
            "text": accepted_text,
            "meta": draft_data["units"][0].get("meta"),
        },
        "message": "Applying critique suggestion.",
        "snapshot_label": "accept",
    }
    response = await async_client.post(f"{API_PREFIX}/draft/accept", json=payload_accept)
    assert response.status_code == 200, response.json()
    accept_result = response.json()
    snapshot_path = accept_result["snapshot"]["path"]
    assert snapshot_path.startswith("history/snapshots/")

    # Recovery status reflects snapshot
    response = await async_client.get(
        f"{API_PREFIX}/draft/recovery", params={"project_id": project_id}
    )
    assert response.status_code == 200, response.json()
    recovery = response.json()
    assert recovery["status"] == "idle"
    assert recovery["last_snapshot"]["snapshot_id"] == accept_result["snapshot"]["snapshot_id"]

    # Corrupt draft + restore
    # Export manuscript
    response = await async_client.post(
        f"{API_PREFIX}/draft/export", json={"project_id": project_id}
    )
    assert response.status_code == 200, response.json()
    export_payload = response.json()
    assert export_payload["path"] == "draft_full.md"
    manuscript = (tmp_path / project_id / "draft_full.md").read_text(encoding="utf-8")
    assert "Storm Cellar" in manuscript

    # Quick health check
    response = await async_client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["version"] == SERVICE_VERSION
