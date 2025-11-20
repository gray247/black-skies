"""Unit tests covering the Phase 5 integrity validator."""

from __future__ import annotations

import json
from pathlib import Path

from blackskies.services.config import ServiceSettings
from blackskies.services.integrity import validate_project


CHAPTER_ID = "ch_1000"


def _write_outline(project_root: Path, scenes: list[tuple[str, int, str]]) -> None:
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_999",
        "acts": ["Act I"],
        "chapters": [{"id": CHAPTER_ID, "order": 1, "title": "Integrity"}],
        "scenes": [
            {
                "id": scene_id,
                "order": order,
                "title": title,
                "chapter_id": CHAPTER_ID,
            }
            for scene_id, order, title in scenes
        ],
    }
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "outline.json").write_text(json.dumps(outline, indent=2), encoding="utf-8")


def _write_scene(project_root: Path, scene_id: str, title: str, order: int) -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    metadata = (
        f"---\n"
        f"id: {scene_id}\n"
        f"title: {title}\n"
        f"order: {order}\n"
        f"chapter_id: {CHAPTER_ID}\n"
        f"---\n\n"
    )
    (drafts_dir / f"{scene_id}.md").write_text(metadata + "body\n", encoding="utf-8")


def _write_manifest(project_root: Path, project_id: str) -> None:
    manifest = {
        "project_id": project_id,
        "name": "Integrity Sample",
    }
    (project_root / "project.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def _create_project(project_root: Path, project_id: str, scenes: list[tuple[str, int, str]]) -> None:
    _write_outline(project_root, scenes)
    _write_manifest(project_root, project_id)
    for scene_id, order, title in scenes:
        _write_scene(project_root, scene_id, title, order)


def test_validate_project_success(tmp_path: Path) -> None:
    project_id = "intact"
    project_root = tmp_path / project_id
    scenes = [("sc_1001", 1, "Start"), ("sc_1002", 2, "Middle")]
    _create_project(project_root, project_id, scenes)
    settings = ServiceSettings(project_base_dir=tmp_path)

    result = validate_project(settings, project_id=project_id)

    assert result.is_ok
    assert result.errors == []
    assert "drafts/ directory is missing." not in result.errors


def test_validate_project_missing_project_json(tmp_path: Path) -> None:
    project_id = "no-manifest"
    project_root = tmp_path / project_id
    scenes = [("sc_2001", 1, "Solo")]
    _create_project(project_root, project_id, scenes)
    (project_root / "project.json").unlink()
    settings = ServiceSettings(project_base_dir=tmp_path)

    result = validate_project(settings, project_id=project_id)

    assert not result.is_ok
    assert "project.json is missing." in result.errors


def test_validate_project_duplicate_scene_ids(tmp_path: Path) -> None:
    project_id = "dupe-scenes"
    project_root = tmp_path / project_id
    scenes = [("sc_3001", 1, "First"), ("sc_3001", 2, "Repeat")]
    _create_project(project_root, project_id, scenes)
    settings = ServiceSettings(project_base_dir=tmp_path)

    result = validate_project(settings, project_id=project_id)

    assert not result.is_ok
    assert any("Outline artifact failed schema validation." in error for error in result.errors)


def test_validate_project_missing_draft(tmp_path: Path) -> None:
    project_id = "missing-draft"
    project_root = tmp_path / project_id
    scenes = [("sc_4001", 1, "Scene A"), ("sc_4002", 2, "Scene B")]
    _create_project(project_root, project_id, scenes)
    (project_root / "drafts" / "sc_4002.md").unlink()
    settings = ServiceSettings(project_base_dir=tmp_path)

    result = validate_project(settings, project_id=project_id)

    assert not result.is_ok
    assert any("sc_4002" in error for error in result.errors)


def test_validate_project_invalid_project_json(tmp_path: Path) -> None:
    project_id = "corrupt-json"
    project_root = tmp_path / project_id
    scenes = [("sc_5001", 1, "Alone")]
    _create_project(project_root, project_id, scenes)
    (project_root / "project.json").write_text('{"project_id": "corrupt"', encoding="utf-8")
    settings = ServiceSettings(project_base_dir=tmp_path)

    result = validate_project(settings, project_id=project_id)

    assert not result.is_ok
    assert "project.json contains invalid JSON." in result.errors
