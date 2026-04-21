from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence

API_PREFIX = "/api/v1"

# HARNESS_ONLY seam metadata for explicit synthetic-mode coverage.
# Reason: verify e2e synthetic toggle behavior without treating synthetic mode as default truth.
# Owner: services/src/blackskies/services/e2e_mode.py
# Retire when: synthetic mode is removed from runtime/test harness paths.


def _bootstrap_outline(base_dir: Path, project_id: str, scene_count: int = 1) -> list[str]:
    """Write a minimal outline file for synthetic-mode routing checks."""

    project_dir = base_dir / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
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
    (project_dir / "outline.json").write_text(json.dumps(outline, indent=2), encoding="utf-8")
    (project_dir / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": project_id}, indent=2), encoding="utf-8"
    )
    return [scene["id"] for scene in scenes]


def _bootstrap_scene(tmp_path: Path, project_id: str, scene_id: str) -> str:
    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = DraftPersistence(settings=settings)
    scene_body = "The cellar hums with static and distant thunder."
    persistence.write_scene(
        project_id,
        {
            "id": scene_id,
            "slug": scene_id.replace("sc_", "scene-"),
            "title": "Scene 1",
            "order": 1,
            "chapter_id": "ch_0001",
            "purpose": "setup",
            "emotion_tag": "tension",
            "pov": "Mara",
            "beats": ["inciting"],
        },
        scene_body,
    )
    return scene_body


def _critique_payload(project_id: str, unit_id: str) -> dict[str, object]:
    return {
        "project_id": project_id,
        "draft_id": "dr_001",
        "unit_id": unit_id,
        "rubric": ["Logic", "Continuity"],
    }


def test_e2e_mode_uses_real_critique_path_when_synthetic_disabled(
    monkeypatch,
    tmp_path,
) -> None:
    project_id = "proj_truth_real_path"
    unit_id = _bootstrap_outline(tmp_path, project_id, scene_count=1)[0]
    _bootstrap_scene(tmp_path, project_id, scene_id=unit_id)

    monkeypatch.setenv("BLACKSKIES_E2E_MODE", "1")
    monkeypatch.setenv("BLACKSKIES_E2E_SYNTHETIC_MODE", "0")

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)
    response = client.post(
        f"{API_PREFIX}/draft/critique", json=_critique_payload(project_id, unit_id)
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["unit_id"] == unit_id
    assert payload.get("provenance", {}).get("route_name") == "draft/critique"


def test_e2e_mode_can_opt_into_synthetic_critique(
    monkeypatch,
    tmp_path,
) -> None:
    project_id = "proj_truth_synthetic_path"
    unit_id = _bootstrap_outline(tmp_path, project_id, scene_count=1)[0]
    _bootstrap_scene(tmp_path, project_id, scene_id=unit_id)

    monkeypatch.setenv("BLACKSKIES_E2E_MODE", "1")
    monkeypatch.setenv("BLACKSKIES_E2E_SYNTHETIC_MODE", "1")

    app = create_app(ServiceSettings(project_base_dir=tmp_path))
    client = TestClient(app)
    response = client.post(
        f"{API_PREFIX}/draft/critique", json=_critique_payload(project_id, unit_id)
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"].startswith("Critique summary for")
    assert "provenance" not in payload
