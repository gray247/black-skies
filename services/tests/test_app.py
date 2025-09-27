"""Tests for the Black Skies FastAPI application."""

from __future__ import annotations

import asyncio
import json
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import SERVICE_VERSION, BuildTracker, create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence


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

def _bootstrap_outline(base_dir: Path, project_id: str, scene_count: int = 2) -> list[str]:
    """Write a minimal outline artifact for draft generation tests."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    outline_path = project_dir / "outline.json"

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

    response = test_client.post("/draft/generate", json=payload)
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
    assert data["budget"]["estimated_usd"] >= 0.0


def test_draft_generate_scene_limit(test_client: TestClient, tmp_path: Path) -> None:
    """Scene batches above the limit are rejected with validation errors."""

    project_id = "proj_draft_limit"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=6)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids[:6],
    }

    response = test_client.post("/draft/generate", json=payload)
    assert response.status_code == 400

    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION"
    errors = detail["details"]["errors"]
    assert any("at most 5" in error["msg"] for error in errors)

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()


def test_draft_generate_missing_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Unknown scene identifiers surface a validation error with context."""

    project_id = "proj_draft_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = test_client.post("/draft/generate", json=payload)
    assert response.status_code == 400

    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION"
    assert detail["details"]["missing_scene_ids"] == ["sc_9999"]

    drafts_dir = tmp_path / project_id / "drafts"
    assert not drafts_dir.exists()




def test_draft_preflight_success(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight returns an estimate within budget for valid scenes."""

    project_id = "proj_preflight_success"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=2)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
    }

    response = test_client.post("/draft/preflight", json=payload)
    assert response.status_code == 200

    data = response.json()
    budget = data["budget"]
    assert data["project_id"] == project_id
    assert budget["status"] == "ok"
    assert budget["estimated_usd"] > 0
    assert budget["soft_limit_usd"] == 5.0
    assert budget["hard_limit_usd"] == 10.0


def test_draft_preflight_soft_limit(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight surfaces a soft limit warning when estimate crosses the threshold."""

    project_id = "proj_preflight_soft"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {
            scene_ids[0]: {"word_target": 300000}
        },
    }

    response = test_client.post("/draft/preflight", json=payload)
    assert response.status_code == 200

    budget = response.json()["budget"]
    assert budget["status"] == "soft-limit"
    assert budget["estimated_usd"] >= 5.0


def test_draft_preflight_blocked(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight reports blocked status when hard limit would be exceeded."""

    project_id = "proj_preflight_blocked"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": scene_ids,
        "overrides": {
            scene_ids[0]: {"word_target": 600000}
        },
    }

    response = test_client.post("/draft/preflight", json=payload)
    assert response.status_code == 200

    budget = response.json()["budget"]
    assert budget["status"] == "blocked"
    assert budget["estimated_usd"] >= 10.0


def test_draft_preflight_missing_scene(test_client: TestClient, tmp_path: Path) -> None:
    """Preflight returns validation error when scenes are missing from outline."""

    project_id = "proj_preflight_missing"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    payload = {
        "project_id": project_id,
        "unit_scope": "scene",
        "unit_ids": [scene_ids[0], "sc_9999"],
    }

    response = test_client.post("/draft/preflight", json=payload)
    assert response.status_code == 400

    detail = response.json()["detail"]
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

    response = test_client.post("/draft/rewrite", json=payload)
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

    response = test_client.post("/draft/rewrite", json=payload)
    assert response.status_code == 409

    detail = response.json()["detail"]
    assert detail["code"] == "CONFLICT"

    diagnostics_dir = tmp_path / project_id / "history" / "diagnostics"
    assert diagnostics_dir.exists()
    assert list(diagnostics_dir.glob("*.json"))


def test_draft_rewrite_validation_error(test_client: TestClient) -> None:
    """Malformed rewrite payloads raise validation errors."""

    response = test_client.post("/draft/rewrite", json={"project_id": "proj_bad"})
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["code"] == "VALIDATION"
