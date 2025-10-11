"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

import asyncio
import errno
import hashlib
import json
import threading
from pathlib import Path
from typing import Any
from uuid import UUID

import httpx
import pytest

try:
    from fastapi import status
    from fastapi.testclient import TestClient
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    pytest.skip(f"fastapi is required for service tests: {exc}", allow_module_level=True)

try:
    import yaml
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    pytest.skip(f"yaml is required for service tests: {exc}", allow_module_level=True)

from blackskies.services.app import SERVICE_VERSION, BuildTracker
from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence, SnapshotPersistence
from blackskies.services.routers.recovery import RecoveryTracker

TRACE_HEADER = "x-trace-id"
API_PREFIX = "/api/v1"
CONTRACT_FIXTURES_DIR = Path(__file__).parent / "contracts"


def _assert_trace_header(response: Any) -> str:
    """Ensure the response includes a valid trace identifier header."""

    trace_id = response.headers.get(TRACE_HEADER)
    assert trace_id is not None
    UUID(trace_id)
    return trace_id


def _read_error(response: Any) -> dict[str, object]:
    """Return the structured error payload with validated trace metadata."""

    payload = response.json()
    trace_id = _assert_trace_header(response)
    assert payload["trace_id"] == trace_id
    return payload


def test_service_index_reports_manifest(test_client: TestClient) -> None:
    """Root endpoint returns a manifest to aid manual verification."""

    response = test_client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "service": "black-skies",
        "version": SERVICE_VERSION,
        "api_base": "/api/v1",
    }
    _assert_trace_header(response)


def test_favicon_placeholder_returns_no_content(test_client: TestClient) -> None:
    """Favicon requests return a no-content response instead of 404."""

    response = test_client.get("/favicon.ico")
    assert response.status_code == 204
    assert response.content == b""
    _assert_trace_header(response)


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
                {
                    "title": "Storm Cellar",
                    "chapter_index": 1,
                    "beat_refs": ["inciting"],
                },
                {"title": "Radio", "chapter_index": 2, "beat_refs": ["twist"]},
            ],
        },
    }


def _load_contract_snapshot(name: str) -> dict[str, Any]:
    """Load a contract snapshot from disk for response comparison."""

    snapshot_path = CONTRACT_FIXTURES_DIR / f"{name}.json"
    with snapshot_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _build_critique_payload(
    *,
    draft_id: str = "dr_004",
    unit_id: str = "sc_0001",
    rubric: list[str] | None = None,
) -> dict[str, Any]:
    """Return a critique request payload matching the rubric specification."""

    rubric_values = (
        rubric
        if rubric is not None
        else [
            "Logic",
            "Continuity",
            "Character",
        ]
    )
    return {"draft_id": draft_id, "unit_id": unit_id, "rubric": rubric_values}


def _build_contract_outline_request(project_id: str) -> dict[str, Any]:
    """Return a wizard lock payload matching the docs contract."""

    return {
        "project_id": project_id,
        "force_rebuild": False,
        "wizard_locks": {
            "acts": [
                {"title": "Act I"},
                {"title": "Act II"},
                {"title": "Act III"},
            ],
            "chapters": [
                {"title": "Arrival", "act_index": 1},
            ],
            "scenes": [
                {
                    "title": "Storm Cellar",
                    "chapter_index": 1,
                    "beat_refs": ["inciting"],
                }
            ],
        },
    }


def _write_project_budget(
    base_dir: Path,
    project_id: str,
    *,
    soft_limit: float = 5.0,
    hard_limit: float = 10.0,
    spent_usd: float = 0.0,
) -> Path:
    """Create or overwrite the project budget configuration."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    project_path = project_dir / "project.json"
    payload = {
        "project_id": project_id,
        "name": f"Project {project_id}",
        "budget": {
            "soft": soft_limit,
            "hard": hard_limit,
            "spent_usd": spent_usd,
        },
    }
    with project_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
    return project_path


def _bootstrap_outline(
    base_dir: Path,
    project_id: str,
    scene_count: int = 2,
    *,
    soft_limit: float = 5.0,
    hard_limit: float = 10.0,
    spent_usd: float = 0.0,
) -> list[str]:
    """Write a minimal outline artifact for draft generation tests."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    outline_path = project_dir / "outline.json"

    _write_project_budget(
        base_dir,
        project_id,
        soft_limit=soft_limit,
        hard_limit=hard_limit,
        spent_usd=spent_usd,
    )

    scenes: list[dict[str, object]] = []
    for index in range(scene_count):
        order = index + 1
        scene_id = f"sc_{order:04d}"
        scenes.append(
            {
                "id": scene_id,
                "order": order,
                "title": f"Scene {order}",
                "chapter_id": "ch_0001",
                "beat_refs": ["inciting"] if index == 0 else [],
            }
        )

    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Chapter 1"}],
        "scenes": scenes,
    }

    with outline_path.open("w", encoding="utf-8") as handle:
        json.dump(outline, handle, indent=2)

    return [scene["id"] for scene in scenes]


def _bootstrap_scene(
    tmp_path: Path,
    project_id: str,
    scene_id: str = "sc_0001",
    *,
    order: int = 1,
    body: str | None = None,
) -> str:
    """Write a canonical scene markdown file for rewrite tests."""

    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = DraftPersistence(settings=settings)
    front_matter = {
        "id": scene_id,
        "slug": scene_id.replace("sc_", "scene-"),
        "title": f"Scene {order}",
        "order": order,
        "chapter_id": "ch_0001",
        "purpose": "setup",
        "emotion_tag": "tension",
        "pov": "Mara",
        "beats": ["inciting"],
    }
    scene_body = body or "The cellar hums with static and distant thunder."
    persistence.write_scene(project_id, front_matter, scene_body)
    return scene_body


def _compute_sha256(content: str) -> str:
    """Return the SHA-256 hex digest of normalised markdown text."""

    normalized = content.replace("\r\n", "\n").strip()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def test_health(test_client: TestClient) -> None:
    """The versioned health endpoint returns the expected payload."""

    response = test_client.get(f"{API_PREFIX}/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": SERVICE_VERSION}
    _assert_trace_header(response)


def test_metrics_endpoint(test_client: TestClient) -> None:
    """Metrics endpoint returns Prometheus-formatted content with trace headers."""

    test_client.get(f"{API_PREFIX}/healthz")
    response = test_client.get(f"{API_PREFIX}/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; version=0.0.4"
    body = response.text
    assert "blackskies_requests_total" in body
    assert "blackskies_service_info" in body
    _assert_trace_header(response)


@pytest.mark.contract
def test_contract_outline_build(test_client: TestClient, tmp_path: Path) -> None:
    """Outline build matches the golden contract snapshot."""

    project_id = "proj_contract_outline"
    payload = _build_contract_outline_request(project_id)

    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert response.status_code == 200
    assert response.json() == _load_contract_snapshot("outline_build")
    _assert_trace_header(response)

    outline_path = tmp_path / project_id / "outline.json"
    assert outline_path.exists()


def test_outline_build_success(test_client: TestClient, tmp_path: Path) -> None:
    """Building an outline persists an OutlineSchema artifact."""

    payload = _build_payload()
    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
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

    response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    assert response.status_code == 400
    detail = _read_error(response)
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
        response = test_client.post(f"{API_PREFIX}/outline/build", json=payload)
    finally:
        asyncio.run(tracker.end(payload["project_id"]))

    assert response.status_code == 409
    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"

    diagnostics_dir = tmp_path / payload["project_id"] / "history" / "diagnostics"
    files = list(diagnostics_dir.glob("*.json"))
    assert len(files) == 1
    with files[0].open("r", encoding="utf-8") as handle:
        diagnostic = json.load(handle)
    assert diagnostic["code"] == "CONFLICT"


def test_draft_generate_scene_success(test_client: TestClient, tmp_path: Path) -> None:
    """Draft generation writes Markdown and returns deterministic metadata."""

    project_id = "proj_draft_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "seed": 11,
        "overrides": {
            scene_ids[0]: {
                "purpose": "escalation",
                "emotion_tag": "tension",
                "order": 3,
            }
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "DraftUnitSchema v1"
    assert data["draft_id"].startswith("dr_")
    assert len(data["units"]) == len(scene_ids)

    first_unit = data["units"][0]
    assert first_unit["id"] == scene_ids[0]
    assert first_unit["meta"]["purpose"] == "escalation"
    assert first_unit["meta"]["emotion_tag"] == "tension"
    assert first_unit["seed"] == payload["seed"]
    assert first_unit["prompt_fingerprint"].startswith("sha256:")

    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    assert draft_path.exists()
    content = draft_path.read_text(encoding="utf-8")
    assert "purpose: escalation" in content
    assert "emotion_tag: tension" in content
    assert "order: 3" in content
    assert "Scene 1" in content

    snapshots_dir = tmp_path / project_id / "history" / "snapshots"
    assert not snapshots_dir.exists()
    budget = data["budget"]
    assert budget["estimated_usd"] >= 0.0
    assert budget["status"] == "ok"
    assert budget["soft_limit_usd"] == pytest.approx(5.0)
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["spent_usd"] == pytest.approx(budget["estimated_usd"])

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(budget["spent_usd"])


def test_draft_generate_rehydrates_cached_units(test_client: TestClient, tmp_path: Path) -> None:
    """Cached draft responses rewrite missing scene files before being returned."""

    project_id = "proj_draft_rehydrate"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    first_response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert first_response.status_code == 200
    first_data = first_response.json()

    scene_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    original_content = scene_path.read_text(encoding="utf-8")
    scene_path.unlink()

    second_response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert second_response.status_code == 200
    second_data = second_response.json()

    assert second_data == first_data
    assert scene_path.exists()
    regenerated = scene_path.read_text(encoding="utf-8")
    assert regenerated == original_content

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(
        first_data["budget"]["spent_usd"]
    )


def test_draft_generate_scene_limit(test_client: TestClient, tmp_path: Path) -> None:
    """Scene batches above the limit are rejected with validation errors."""

    project_id = "proj_draft_limit"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=6)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids[:6],
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    errors = detail["details"]["errors"]
    assert any("at most 5" in error["msg"] for error in errors)

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(0.0)


def test_draft_generate_missing_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Unknown scene identifiers surface a validation error with context."""

    project_id = "proj_draft_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["missing_scene_ids"] == ["sc_9999"]

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(0.0)


def test_draft_generate_budget_blocked(test_client: TestClient, tmp_path: Path) -> None:
    """Generation refuses to run when the hard budget would be exceeded."""

    project_id = "proj_draft_blocked"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1, spent_usd=9.75)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 30000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 402

    detail = _read_error(response)
    assert detail["code"] == "BUDGET_EXCEEDED"

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(9.75)


def test_draft_generate_soft_limit_status(test_client: TestClient, tmp_path: Path) -> None:
    """Generation succeeds but surfaces soft-limit status when nearing the cap."""

    project_id = "proj_draft_soft_limit"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1, spent_usd=4.9)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 10000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/generate", json=payload)
    assert response.status_code == 200

    data = response.json()
    budget = data["budget"]
    assert budget["status"] == "soft-limit"
    assert budget["soft_limit_usd"] == pytest.approx(5.0)
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["spent_usd"] > 5.0
    assert budget["spent_usd"] == pytest.approx(budget["estimated_usd"] + 4.9)

    project_config = tmp_path / project_id / "project.json"
    with project_config.open("r", encoding="utf-8") as handle:
        project_meta = json.load(handle)
    assert project_meta["budget"]["spent_usd"] == pytest.approx(budget["spent_usd"])


@pytest.mark.contract
def test_contract_draft_preflight_ok(test_client: TestClient, tmp_path: Path) -> None:
    """Draft preflight matches the documented ok contract payload."""

    project_id = "proj_contract_preflight_ok"
    build_payload = _build_contract_outline_request(project_id)
    build_response = test_client.post(f"{API_PREFIX}/outline/build", json=build_payload)
    assert build_response.status_code == 200

    _write_project_budget(
        tmp_path,
        project_id,
        soft_limit=5.0,
        hard_limit=10.0,
        spent_usd=0.18,
    )

    request_payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": ["sc_0001"],
        "overrides": {"sc_0001": {"word_target": 62000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=request_payload)
    assert response.status_code == 200
    assert response.json() == _load_contract_snapshot("draft_preflight_ok")
    _assert_trace_header(response)


@pytest.mark.contract
def test_contract_draft_critique(test_client: TestClient) -> None:
    """Draft critique endpoint returns the documented fixture payload."""

    payload = _build_critique_payload()
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 200
    assert response.json() == _load_contract_snapshot("draft_critique")
    _assert_trace_header(response)


def test_draft_critique_validation_unknown_category(test_client: TestClient) -> None:
    """Critique rejects requests with rubric entries outside the specification."""

    payload = _build_critique_payload(rubric=["Logic", "Unknown"])
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    errors = detail["details"]["errors"]
    assert any("Unknown rubric categories" in error["msg"] for error in errors)


def test_draft_preflight_success(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight returns an estimate within budget for valid scenes."""

    project_id = "proj_preflight_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200

    data = response.json()
    budget = data["budget"]
    assert data["project_id"] == project_id
    assert data["model"]["name"] == "draft-synthesizer-v1"
    assert data["model"]["provider"] == "black-skies-local"
    assert len(data["scenes"]) == len(scene_ids)
    assert data["scenes"][0]["id"] == scene_ids[0]
    assert data["scenes"][0]["title"].startswith("Scene ")
    assert budget["status"] == "ok"
    assert budget["estimated_usd"] > 0
    assert budget["soft_limit_usd"] == 5.0
    assert budget["hard_limit_usd"] == 10.0
    assert budget["spent_usd"] == pytest.approx(0.0)
    assert budget["total_after_usd"] == pytest.approx(budget["estimated_usd"])


def test_draft_preflight_soft_limit(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight surfaces a soft limit warning when estimate crosses the threshold."""

    project_id = "proj_preflight_soft"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 300000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200

    payload = response.json()
    budget = payload["budget"]
    assert payload["model"]["name"] == "draft-synthesizer-v1"
    assert len(payload["scenes"]) == 1
    assert budget["status"] == "soft-limit"
    assert budget["estimated_usd"] >= 5.0
    assert budget["soft_limit_usd"] == pytest.approx(5.0)
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["spent_usd"] == pytest.approx(0.0)
    assert budget["total_after_usd"] == pytest.approx(budget["estimated_usd"])


def test_draft_preflight_blocked(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight reports blocked status when hard limit would be exceeded."""

    project_id = "proj_preflight_blocked"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {scene_ids[0]: {"word_target": 600000}},
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 200

    payload = response.json()
    budget = payload["budget"]
    assert payload["model"]["name"] == "draft-synthesizer-v1"
    assert len(payload["scenes"]) == 1
    assert budget["status"] == "blocked"
    assert budget["estimated_usd"] >= 10.0
    assert budget["hard_limit_usd"] == pytest.approx(10.0)
    assert budget["total_after_usd"] >= budget["hard_limit_usd"] - 1e-6
    assert budget["spent_usd"] == pytest.approx(0.0)


def test_draft_preflight_missing_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight returns validation error when scenes are missing from outline."""

    project_id = "proj_preflight_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/preflight", json=payload)
    assert response.status_code == 400

    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["missing_scene_ids"] == ["sc_9999"]


def test_draft_rewrite_success(test_client: TestClient, tmp_path: Path) -> None:
    """Rewriting a scene updates markdown and returns a structured diff."""

    project_id = "proj_rewrite_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    original_body = _bootstrap_scene(tmp_path, project_id, scene_ids[0])

    revised_body = f"{original_body}\n\nNew beat emerges along the stairwell."
    payload = {
        "project_id": project_id,
        "draft_id": "dr_101",
        "unit_id": scene_ids[0],
        "instructions": "Tighten the close.",
        "new_text": revised_body,
        "unit": {
            "id": scene_ids[0],
            "text": original_body,
            "meta": {"purpose": "payoff", "emotion_tag": "revelation"},
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["schema_version"] == "DraftUnitSchema v1"
    assert data["model"]["name"] == "draft-rewriter-v1"
    assert data["unit_id"] == scene_ids[0]
    assert data["revised_text"].endswith("New beat emerges along the stairwell.")

    diff = data["diff"]
    assert isinstance(diff["anchors"], dict)
    assert diff["anchors"]["left"] >= 0
    assert diff["anchors"]["right"] >= 0
    assert diff["added"] or diff["changed"]

    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    content = draft_path.read_text(encoding="utf-8")
    assert "purpose: payoff" in content
    assert "emotion_tag: revelation" in content
    assert "New beat emerges" in content


def test_draft_rewrite_conflict(test_client: TestClient, tmp_path: Path) -> None:
    """Conflicting rewrites surface 409 responses and diagnostics."""

    project_id = "proj_rewrite_conflict"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    original_body = _bootstrap_scene(tmp_path, project_id, scene_ids[0])

    draft_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    draft_path.write_text(
        draft_path.read_text(encoding="utf-8") + "\nExternal edit.",
        encoding="utf-8",
    )

    payload = {
        "project_id": project_id,
        "draft_id": "dr_202",
        "unit_id": scene_ids[0],
        "instructions": "Reword the last line.",
        "new_text": original_body + "\n\nA controlled cadence takes hold.",
        "unit": {"id": scene_ids[0], "text": original_body},
    }

    response = test_client.post(f"{API_PREFIX}/draft/rewrite", json=payload)
    assert response.status_code == 409

    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    assert diagnostics_dir.exists()
    assert list(diagnostics_dir.glob("*.json"))


def test_draft_rewrite_validation_error(test_client: TestClient) -> None:
    """Malformed rewrite payloads raise validation errors."""

    response = test_client.post(f"{API_PREFIX}/draft/rewrite", json={"project_id": "proj_bad"})
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"


def test_draft_accept_success_creates_snapshot(test_client: TestClient, tmp_path: Path) -> None:
    """Accepting a critique updates the scene and writes a snapshot."""

    project_id = "proj_accept_success"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    accepted_text = f"{scene_body}\n\nShe braces for the next surge."
    checksum = _compute_sha256(scene_body)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_301",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
            "meta": {"purpose": "payoff"},
        },
        "message": "Applying critique suggestions.",
        "snapshot_label": "accept",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["unit_id"] == "sc_0001"
    assert data["snapshot"]["snapshot_id"]
    assert data["snapshot"]["path"].startswith("history/snapshots/")

    scene_path = tmp_path / project_id / "drafts" / "sc_0001.md"
    content = scene_path.read_text(encoding="utf-8")
    assert "She braces for the next surge." in content

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    assert state_path.exists()
    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["status"] == "idle"
    assert state["needs_recovery"] is False
    assert state["last_snapshot"]["snapshot_id"] == data["snapshot"]["snapshot_id"]

    snapshot_dir = tmp_path / project_id / data["snapshot"]["path"]
    assert snapshot_dir.exists()
    metadata_path = snapshot_dir / "metadata.json"
    assert metadata_path.exists()
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert metadata["snapshot_id"] == data["snapshot"]["snapshot_id"]

    manifest_path = snapshot_dir / "snapshot.yaml"
    assert manifest_path.exists()
    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    assert manifest["schema_version"] == "SnapshotManifest v1"
    assert manifest["snapshot_id"] == data["snapshot"]["snapshot_id"]
    drafts = manifest.get("drafts")
    assert isinstance(drafts, list)
    draft_entry = next(item for item in drafts if item.get("id") == "sc_0001")
    assert draft_entry["path"].startswith("drafts/")
    assert draft_entry["purpose"] == "payoff"
    assert "missing_drafts" not in manifest


def test_draft_accept_ignores_tampered_cost(test_client: TestClient, tmp_path: Path) -> None:
    """Accept uses server-side estimates even if the request zeros out cost."""

    project_id = "proj_accept_budget_guard"
    draft_id = "dr_secure_001"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)

    project_path = _write_project_budget(
        tmp_path, project_id, soft_limit=5.0, hard_limit=10.0, spent_usd=1.0
    )
    metadata = json.loads(project_path.read_text(encoding="utf-8"))
    metadata.setdefault("budget", {})["last_generate_response"] = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": ["sc_0001"],
        "draft_id": draft_id,
        "schema_version": "DraftUnitSchema v1",
        "units": [
            {
                "id": "sc_0001",
                "text": scene_body,
                "meta": {
                    "word_target": 1500,
                    "order": 1,
                    "chapter_id": "ch_0001",
                },
            }
        ],
        "budget": {
            "estimated_usd": 0.03,
            "status": "ok",
            "message": "Estimate within budget.",
            "soft_limit_usd": 5.0,
            "hard_limit_usd": 10.0,
            "spent_usd": 1.03,
            "total_after_usd": 1.03,
        },
    }
    project_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    payload = {
        "project_id": project_id,
        "draft_id": draft_id,
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": f"{scene_body}\n\nAccepted text.",
            "meta": {"purpose": "setup"},
            "estimated_cost_usd": 0.0,
        },
        "message": "Tamper attempt should be ignored.",
        "snapshot_label": "accept",  # ensure snapshot flow still succeeds
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["budget"]["spent_usd"] == pytest.approx(1.03)

    persisted_meta = json.loads(project_path.read_text(encoding="utf-8"))
    assert persisted_meta["budget"]["spent_usd"] == pytest.approx(1.03)


def test_draft_accept_snapshot_conflict(
    test_client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Snapshot persistence conflicts return a structured 409 response."""

    project_id = "proj_accept_conflict_snapshot"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)

    def _raise_snapshot(*args: Any, **kwargs: Any) -> dict[str, Any]:  # pragma: no cover - stub
        raise OSError(errno.EEXIST, "snapshot exists")

    monkeypatch.setattr(SnapshotPersistence, "create_snapshot", _raise_snapshot)

    payload = {
        "project_id": project_id,
        "draft_id": "dr_401",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": scene_body,
            "meta": {"purpose": "setup"},
        },
        "message": "Testing snapshot conflict.",
        "snapshot_label": "accept",
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == status.HTTP_409_CONFLICT

    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"
    assert detail["details"]["project_id"] == project_id

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    entries = sorted(diagnostics_dir.glob("*.json"))
    assert entries, "Expected diagnostics to record the conflict"
    last_entry = json.loads(entries[-1].read_text(encoding="utf-8"))
    assert last_entry["code"] == "CONFLICT"


def test_wizard_lock_creates_snapshot(test_client: TestClient, tmp_path: Path) -> None:
    """Locking a wizard step writes a snapshot for the project."""

    project_id = "proj_wizard_lock"
    _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id)

    payload = {
        "project_id": project_id,
        "step": "structure",
        "label": "wizard-structure",
        "includes": ["outline.json"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/wizard/lock", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["snapshot_id"]
    assert data["label"] == "wizard-structure"
    assert data["path"].startswith("history/snapshots/")

    snapshot_dir = tmp_path / project_id / data["path"]
    assert snapshot_dir.exists()
    metadata_path = snapshot_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    assert metadata["snapshot_id"] == data["snapshot_id"]


def test_wizard_lock_missing_project_returns_validation_error(
    test_client: TestClient,
) -> None:
    """Locking fails when the project folder is absent."""

    payload = {"project_id": "proj_missing", "step": "themes"}
    response = test_client.post(f"{API_PREFIX}/draft/wizard/lock", json=payload)
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"


def test_wizard_lock_rejects_malicious_include(test_client: TestClient, tmp_path: Path) -> None:
    """Wizard lock snapshots reject include paths that escape the project."""

    project_id = "proj_wizard_escape"
    _bootstrap_scene(tmp_path, project_id)

    payload = {
        "project_id": project_id,
        "step": "structure",
        "label": "wizard-structure",
        "includes": ["../outside.txt"],
    }

    response = test_client.post(f"{API_PREFIX}/draft/wizard/lock", json=payload)
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"

    outside_path = tmp_path / "outside.txt"
    assert not outside_path.exists()

    snapshots_dir = tmp_path / project_id / "history" / "snapshots"
    assert snapshots_dir.exists()
    assert list(snapshots_dir.iterdir()) == []


def test_draft_accept_conflict_on_checksum(test_client: TestClient, tmp_path: Path) -> None:
    """Out-of-date accept requests return a conflict."""

    project_id = "proj_accept_conflict"
    _bootstrap_scene(tmp_path, project_id)
    payload = {
        "project_id": project_id,
        "draft_id": "dr_302",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": "0" * 64,
            "text": "Stale text",
        },
    }

    response = test_client.post(f"{API_PREFIX}/draft/accept", json=payload)
    assert response.status_code == 409
    detail = _read_error(response)
    assert detail["code"] == "CONFLICT"

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    assert not state_path.exists()


def test_recovery_status_marks_needs_recovery(test_client: TestClient, tmp_path: Path) -> None:
    """Stale in-progress markers are promoted to a recovery state."""

    project_id = "proj_recovery_status"
    _bootstrap_scene(tmp_path, project_id)
    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(
        json.dumps({"status": "accept-in-progress", "pending_unit_id": "sc_0001"}),
        encoding="utf-8",
    )

    response = test_client.get(f"{API_PREFIX}/draft/recovery", params={"project_id": project_id})
    assert response.status_code == 200
    data = response.json()
    assert data["needs_recovery"] is True
    assert data["status"] == "needs-recovery"

    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["status"] == "needs-recovery"
    assert state["needs_recovery"] is True


def test_recovery_tracker_normalises_legacy_state(tmp_path: Path) -> None:
    """Legacy recovery files with only `needs_recovery` are normalised."""

    project_id = "proj_recovery_legacy"
    project_root = tmp_path / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    state_path = project_root / "history" / "recovery" / "state.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps({"needs_recovery": True}), encoding="utf-8")

    settings = ServiceSettings(project_base_dir=tmp_path)
    tracker = RecoveryTracker(settings)
    snapshots = SnapshotPersistence(settings)

    state = tracker.status(project_id, snapshots)
    assert state["status"] == "needs-recovery"
    assert state["needs_recovery"] is True

    persisted = json.loads(state_path.read_text(encoding="utf-8"))
    assert persisted["status"] == "needs-recovery"
    assert persisted["needs_recovery"] is True


@pytest.mark.anyio
async def test_recovery_restore_runs_in_threadpool(
    async_client: "httpx.AsyncClient",
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Recovery restores execute outside the event loop thread."""

    project_id = "proj_recovery_thread"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    accepted_text = f"{scene_body}\n\nThreaded restore text."

    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_thread_001",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
        },
    }

    accept_response = await async_client.post(
        f"{API_PREFIX}/draft/accept",
        json=accept_payload,
    )
    assert accept_response.status_code == status.HTTP_200_OK

    loop_thread = threading.current_thread()
    captured_threads: list[threading.Thread] = []

    original_restore = SnapshotPersistence.restore_snapshot

    def _capture_thread(
        self: SnapshotPersistence,
        project: str,
        snapshot: str,
    ) -> dict[str, Any]:
        captured_threads.append(threading.current_thread())
        return original_restore(self, project, snapshot)

    monkeypatch.setattr(SnapshotPersistence, "restore_snapshot", _capture_thread)

    restore_response = await async_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id},
    )
    assert restore_response.status_code == status.HTTP_200_OK
    assert captured_threads, "Restore should execute exactly once"
    assert captured_threads[0] is not loop_thread


def test_recovery_restore_overwrites_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Restoring recovery snapshots rehydrates the latest accepted content."""

    project_id = "proj_recovery_restore"
    scene_body = _bootstrap_scene(tmp_path, project_id)
    checksum = _compute_sha256(scene_body)
    accepted_text = f"{scene_body}\n\nRestored text ready."

    accept_payload = {
        "project_id": project_id,
        "draft_id": "dr_303",
        "unit_id": "sc_0001",
        "unit": {
            "id": "sc_0001",
            "previous_sha256": checksum,
            "text": accepted_text,
        },
    }

    accept_response = test_client.post(f"{API_PREFIX}/draft/accept", json=accept_payload)
    assert accept_response.status_code == 200
    snapshot_rel_path = accept_response.json()["snapshot"]["path"]

    scene_path = tmp_path / project_id / "drafts" / "sc_0001.md"
    scene_path.write_text("Corrupted content", encoding="utf-8")

    restore_response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id},
    )
    assert restore_response.status_code == 200
    restore_data = restore_response.json()
    assert restore_data["status"] == "idle"
    assert restore_data["needs_recovery"] is False
    assert (
        restore_data["last_snapshot"]["snapshot_id"]
        == accept_response.json()["snapshot"]["snapshot_id"]
    )
    restored = scene_path.read_text(encoding="utf-8")
    assert "Restored text ready." in restored

    state_path = tmp_path / project_id / "history" / "recovery" / "state.json"
    state = json.loads(state_path.read_text(encoding="utf-8"))
    assert state["status"] == "idle"
    assert state["needs_recovery"] is False
    assert state["last_snapshot"]["path"] == snapshot_rel_path


def test_recovery_restore_rejects_malicious_include(
    test_client: TestClient, tmp_path: Path
) -> None:
    """Recovery restore refuses to apply snapshots with unsafe includes."""

    project_id = "proj_recovery_escape"
    _bootstrap_scene(tmp_path, project_id)

    snapshot_dir = tmp_path / project_id / "history" / "snapshots" / "20240101T000000Z_accept"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = snapshot_dir / "metadata.json"
    metadata_path.write_text(
        json.dumps(
            {
                "snapshot_id": "20240101T000000Z",
                "project_id": project_id,
                "label": "accept",
                "created_at": "2024-01-01T00:00:00Z",
                "includes": ["../outside.txt"],
            }
        ),
        encoding="utf-8",
    )

    response = test_client.post(
        f"{API_PREFIX}/draft/recovery/restore",
        json={"project_id": project_id, "snapshot_id": "20240101T000000Z"},
    )
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"

    outside_path = tmp_path / "outside.txt"
    assert not outside_path.exists()


def test_restore_snapshot_ignores_fsync_error(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    """Snapshot restores tolerate fsync errors such as EBADF on Windows."""

    project_id = "proj_restore_fsync"
    project_root = tmp_path / project_id
    (project_root / "drafts").mkdir(parents=True, exist_ok=True)
    target_path = project_root / "drafts" / "sc_0001.md"
    target_path.write_text("stale", encoding="utf-8")

    snapshot_dir = project_root / "history" / "snapshots" / "20240101T000000Z_accept"
    (snapshot_dir / "drafts").mkdir(parents=True, exist_ok=True)
    (snapshot_dir / "drafts" / "sc_0001.md").write_text(
        "fresh",
        encoding="utf-8",
    )
    metadata = {
        "snapshot_id": "20240101T000000Z",
        "project_id": project_id,
        "label": "accept",
        "created_at": "2024-01-01T00:00:00Z",
        "includes": ["drafts"],
    }
    (snapshot_dir / "metadata.json").write_text(
        json.dumps(metadata),
        encoding="utf-8",
    )

    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = SnapshotPersistence(settings)

    def _failing_fsync(fd: int) -> None:
        raise OSError(errno.EBADF, "Bad file descriptor")

    monkeypatch.setattr("blackskies.services.persistence.os.fsync", _failing_fsync)

    result = persistence.restore_snapshot(project_id, "20240101T000000Z")
    assert result["snapshot_id"] == "20240101T000000Z"
    assert target_path.read_text(encoding="utf-8") == "fresh"


def test_draft_export_manuscript_success(test_client: TestClient, tmp_path: Path) -> None:
    """Exporting a manuscript produces draft_full.md with expected content."""

    project_id = "proj_export_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    bodies = [
        "Storm cellar hums with static.",
        "Radio console crackles to life.",
    ]
    for index, (scene_id, body) in enumerate(zip(scene_ids, bodies), start=1):
        _bootstrap_scene(
            tmp_path,
            project_id,
            scene_id=scene_id,
            order=index,
            body=body,
        )

    response = test_client.post(f"{API_PREFIX}/draft/export", json={"project_id": project_id})
    assert response.status_code == 200
    data = response.json()
    assert data["schema_version"] == "DraftExportResult v1"
    assert data["chapters"] == 1
    assert data["scenes"] == 2
    assert data["meta_header"] is False
    assert data["path"] == "draft_full.md"

    export_path = tmp_path / project_id / "draft_full.md"
    assert export_path.exists()
    manuscript = export_path.read_text(encoding="utf-8")
    assert "# Chapter 1" in manuscript
    assert manuscript.count("## ") == 2
    assert "> purpose:" not in manuscript
    assert "Storm cellar hums with static." in manuscript
    assert "Radio console crackles to life." in manuscript

    response_meta = test_client.post(
        f"{API_PREFIX}/draft/export",
        json={"project_id": project_id, "include_meta_header": True},
    )
    assert response_meta.status_code == 200
    manuscript_with_meta = export_path.read_text(encoding="utf-8")
    assert "> purpose: setup · emotion: tension · pov: Mara" in manuscript_with_meta
    assert manuscript_with_meta.count("## ") == 2


def test_draft_export_missing_front_matter_fields(test_client: TestClient, tmp_path: Path) -> None:
    """Export raises a validation error when required front-matter is missing."""

    project_id = "proj_export_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _bootstrap_scene(tmp_path, project_id, scene_id=scene_ids[0], order=1)

    scene_path = tmp_path / project_id / "drafts" / f"{scene_ids[0]}.md"
    content_lines = [
        line
        for line in scene_path.read_text(encoding="utf-8").splitlines()
        if not line.startswith("order:")
    ]
    scene_path.write_text("\n".join(content_lines) + "\n", encoding="utf-8")

    response = test_client.post(f"{API_PREFIX}/draft/export", json={"project_id": project_id})
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    assert detail["message"] == "Scene front-matter is missing required fields."
    assert detail["details"]["unit_id"] == scene_ids[0]
    assert "order" in detail["details"]["missing_fields"]


def test_draft_export_rejects_path_traversal_project_id(test_client: TestClient) -> None:
    """Traversal tokens in project identifiers are rejected during export requests."""

    response = test_client.post(
        f"{API_PREFIX}/draft/export",
        json={"project_id": "../outside"},
    )
    assert response.status_code == 400
    detail = _read_error(response)
    assert detail["code"] == "VALIDATION"
    errors = detail["details"].get("errors", [])
    assert any(
        "Project ID must not contain path separators." in error.get("msg", "") for error in errors
    )
