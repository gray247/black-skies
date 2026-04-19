"""Contract-safety tests for advisory fracture exposure surfaces."""

from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.config import ServiceSettings
from blackskies.services.persistence import DraftPersistence

API_PREFIX = "/api/v1"


def _write_project_budget(base_dir: Path, project_id: str) -> None:
    project_root = base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    payload = {
        "project_id": project_id,
        "name": f"Project {project_id}",
        "budget": {"soft": 5.0, "hard": 10.0, "spent_usd": 0.0},
    }
    (project_root / "project.json").write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )


def _bootstrap_outline(base_dir: Path, project_id: str, scene_count: int = 1) -> list[str]:
    _write_project_budget(base_dir, project_id)
    project_root = base_dir / project_id
    scene_ids: list[str] = []
    scenes: list[dict[str, object]] = []
    for index in range(scene_count):
        order = index + 1
        scene_id = f"sc_{order:04d}"
        scene_ids.append(scene_id)
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
    (project_root / "outline.json").write_text(
        json.dumps(outline, indent=2),
        encoding="utf-8",
    )
    return scene_ids


def _build_critique_payload(unit_id: str) -> dict[str, object]:
    return {
        "draft_id": "dr_004",
        "unit_id": unit_id,
        "rubric": ["Logic", "Continuity", "Character"],
    }


def _write_scene_with_body(tmp_path: Path, project_id: str, unit_id: str, body: str) -> None:
    settings = ServiceSettings(project_base_dir=tmp_path)
    persistence = DraftPersistence(settings=settings)
    front_matter = {
        "id": unit_id,
        "slug": unit_id.replace("sc_", "scene-"),
        "title": "Scene 1",
        "order": 1,
        "chapter_id": "ch_0001",
        "purpose": "setup",
        "emotion_tag": "tension",
        "pov": "Mara",
        "beats": ["inciting"],
    }
    persistence.write_scene(project_id, front_matter, body)


def test_draft_generate_exposes_fractures_as_additive_diagnostics(
    test_client, tmp_path: Path
) -> None:
    project_id = "proj_fracture_generate_exposure"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)

    response = test_client.post(
        f"{API_PREFIX}/draft/generate",
        json={"project_id": project_id, "unit_scope": "scene", "unit_ids": scene_ids},
    )
    assert response.status_code == 200
    payload = response.json()

    assert set(payload) >= {
        "project_id",
        "unit_scope",
        "unit_ids",
        "draft_id",
        "schema_version",
        "units",
        "model",
        "budget",
    }
    fractures = payload["diagnostics"]["fractures"]
    assert fractures["exposure"] == "advisory_unstable_v1"
    assert fractures["diagnostics_only"] is True
    assert fractures["advisory"] is True
    assert fractures["non_blocking"] is True
    assert fractures["reports"]
    severities = {
        fracture["severity"]
        for item in fractures["reports"]
        if isinstance(item, dict) and isinstance(item.get("report"), dict)
        for fracture in item["report"].get("fractures", [])
        if isinstance(fracture, dict) and "severity" in fracture
    }
    assert severities
    assert severities.issubset({"low", "medium", "high"})


def test_draft_critique_exposes_fractures_as_additive_diagnostics(
    test_client, tmp_path: Path
) -> None:
    project_id = "proj_fracture_critique_exposure"
    scene_ids = _bootstrap_outline(tmp_path, project_id, scene_count=1)
    _write_scene_with_body(
        tmp_path,
        project_id,
        scene_ids[0],
        (
            "Scene title: Storm Cellar\n"
            "POV: Mara\n"
            "Goal: Reach the relay room.\n"
            "Conflict: Lights fail every minute."
        ),
    )

    payload = _build_critique_payload(unit_id=scene_ids[0])
    payload["project_id"] = project_id
    response = test_client.post(f"{API_PREFIX}/draft/critique", json=payload)
    assert response.status_code == 200
    result = response.json()

    assert set(result) >= {
        "unit_id",
        "summary",
        "line_comments",
        "priorities",
        "suggested_edits",
        "severity",
        "model",
        "heuristics",
        "schema_version",
        "rubric",
    }
    fractures = result["diagnostics"]["fractures"]
    assert fractures["exposure"] == "advisory_unstable_v1"
    assert fractures["diagnostics_only"] is True
    assert fractures["advisory"] is True
    assert fractures["non_blocking"] is True
    assert fractures["report"]["diagnostics_only"] is True
    assert fractures["report"]["fractures"]
    severities = {entry["severity"] for entry in fractures["report"]["fractures"]}
    assert severities.issubset({"low", "medium", "high"})
