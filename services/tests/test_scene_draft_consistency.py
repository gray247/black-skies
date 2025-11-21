"""Regression tests for scene/draft consistency checks."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.integrity import validate_project
from blackskies.services.scene_docs import DraftRequestError, read_scene_document


def _write_scene(project_root: Path, scene_id: str, title: str, order: int) -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    content = (
        "---\n"
        f"id: {scene_id}\n"
        f"title: {title}\n"
        f"order: {order}\n"
        "chapter_id: ch_0001\n"
        "---\n\n"
        f"{title} body.\n"
    )
    (drafts_dir / f"{scene_id}.md").write_text(content, encoding="utf-8")


def _write_outline(project_root: Path, scenes: list[dict[str, object]]) -> None:
    outline_payload = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": scenes,
    }
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "outline.json").write_text(json.dumps(outline_payload, indent=2), encoding="utf-8")
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_root.name, "name": "Scene Project"}, indent=2),
        encoding="utf-8",
    )


def test_duplicate_scene_ids_rejected(tmp_path: Path) -> None:
    project_id = "dup-scenes"
    project_root = tmp_path / project_id
    scenes = [
        {"id": "sc_0001", "order": 1, "title": "Opening", "chapter_id": "ch_0001"},
        {"id": "sc_0001", "order": 2, "title": "Repeat", "chapter_id": "ch_0001"},
    ]
    _write_outline(project_root, scenes)
    _write_scene(project_root, "sc_0001", "Opening", 1)

    settings = ServiceSettings(project_base_dir=tmp_path)
    result = validate_project(settings, project_root=project_root)

    assert not result.is_ok
    assert any("Scene IDs must be unique" in error for error in result.errors)


def test_missing_draft_detected_by_integrity(tmp_path: Path) -> None:
    project_id = "missing-draft-consistency"
    project_root = tmp_path / project_id
    scenes = [
        {"id": "sc_0001", "order": 1, "title": "Opening", "chapter_id": "ch_0001"},
        {"id": "sc_0002", "order": 2, "title": "Followup", "chapter_id": "ch_0001"},
    ]
    _write_outline(project_root, scenes)
    _write_scene(project_root, "sc_0001", "Opening", 1)
    # intentionally omit sc_0002 draft

    settings = ServiceSettings(project_base_dir=tmp_path)
    result = validate_project(settings, project_root=project_root)

    assert not result.is_ok
    assert any("sc_0002" in error and "missing" in error.lower() for error in result.errors)


def test_scene_reordering_warns_but_preserves_mapping(tmp_path: Path) -> None:
    project_id = "reorder-scenes"
    project_root = tmp_path / project_id
    scenes = [
        {"id": "sc_0002", "order": 2, "title": "Second", "chapter_id": "ch_0001"},
        {"id": "sc_0001", "order": 1, "title": "First", "chapter_id": "ch_0001"},
    ]
    _write_outline(project_root, scenes)
    _write_scene(project_root, "sc_0001", "First", 1)
    _write_scene(project_root, "sc_0002", "Second", 2)

    settings = ServiceSettings(project_base_dir=tmp_path)
    result = validate_project(settings, project_root=project_root)

    assert result.is_ok
    assert any("not ordered" in warning.lower() for warning in result.warnings)

    path, front_matter, _ = read_scene_document(project_root, "sc_0002")
    assert path.exists()
    assert front_matter["title"] == "Second"
