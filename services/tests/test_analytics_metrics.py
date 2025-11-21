"""Unit tests for the Phase 6 analytics metric helpers."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.analytics_stub import get_project_summary, get_scene_metrics
from blackskies.services.config import ServiceSettings


def _seed_project(base_dir: Path, project_id: str) -> Path:
    project_root = base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    project_root.joinpath("project.json").write_text(
        '{"project_id": "%s", "name": "Metric Test"}' % project_id, encoding="utf-8"
    )
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": [
            {"id": "sc_0001", "order": 1, "title": "First Scene", "chapter_id": "ch_0001"},
            {"id": "sc_0002", "order": 2, "title": "Second Scene", "chapter_id": "ch_0001"},
        ],
    }
    project_root.joinpath("outline.json").write_text(
        json.dumps(outline, indent=2), encoding="utf-8"
    )
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(exist_ok=True)
    drafts_dir.joinpath("sc_0001.md").write_text(
        "---\nid: sc_0001\ntitle: First Scene\norder: 1\n---\n\"Hello world.\"\nNarration line.\n",
        encoding="utf-8",
    )
    drafts_dir.joinpath("sc_0002.md").write_text(
        "---\nid: sc_0002\ntitle: Second Scene\norder: 2\n---\nNarration again.\n\"Echo.\"",
        encoding="utf-8",
    )
    return project_root


def _rewrite_draft(project_root: Path, scene_id: str, body: str) -> None:
    draft_file = project_root / "drafts" / f"{scene_id}.md"
    header = f"---\nid: {scene_id}\ntitle: {scene_id}\norder: {1 if scene_id.endswith('1') else 2}\n---\n"
    draft_file.write_text(f"{header}{body}", encoding="utf-8")


def _find_scene(payload: dict[str, list], scene_id: str) -> dict:
    for scene in payload["scenes"]:
        if scene["sceneId"] == scene_id:
            return scene
    raise AssertionError(f"Scene {scene_id} not found in payload.")


@pytest.fixture()
def settings(tmp_path: Path) -> ServiceSettings:
    return ServiceSettings(project_base_dir=tmp_path)


def test_project_summary_counts(settings: ServiceSettings) -> None:
    project_id = "metrics-summary"
    _seed_project(settings.project_base_dir, project_id)
    summary = get_project_summary(settings, project_id)
    assert summary["projectId"] == project_id
    assert summary["scenes"] == 2
    assert summary["wordCount"] > 0
    assert summary["avgReadability"] is not None


def test_scene_metrics_structure(settings: ServiceSettings) -> None:
    project_id = "metrics-scenes"
    _seed_project(settings.project_base_dir, project_id)
    payload = get_scene_metrics(settings, project_id)
    assert payload["projectId"] == project_id
    assert payload["scenes"]
    first_scene = payload["scenes"][0]
    assert first_scene["sceneId"]
    assert isinstance(first_scene["wordCount"], int)
    density = first_scene["density"]
    assert 0.0 <= density["dialogueRatio"] <= 1.0
    assert 0.0 <= density["narrationRatio"] <= 1.0
    assert pytest.approx(
        1.0, rel=1e-2
    ) == density["dialogueRatio"] + density["narrationRatio"]


def test_empty_scene_body_yields_safe_metrics(settings: ServiceSettings) -> None:
    project_id = "metrics-empty"
    project_root = _seed_project(settings.project_base_dir, project_id)
    _rewrite_draft(project_root, "sc_0001", "")
    scenes = get_scene_metrics(settings, project_id)
    scene = _find_scene(scenes, "sc_0001")
    assert scene["wordCount"] == 0
    assert scene["readability"] is None
    density = scene["density"]
    assert density["dialogueRatio"] == pytest.approx(0.0)
    assert density["narrationRatio"] == pytest.approx(0.0)


def test_scene_without_delimiters_still_has_readability(settings: ServiceSettings) -> None:
    project_id = "metrics-nodelim"
    project_root = _seed_project(settings.project_base_dir, project_id)
    dense_text = "Just words with no punctuation but plenty of tokens"
    _rewrite_draft(project_root, "sc_0002", dense_text)
    scene_payload = get_scene_metrics(settings, project_id)
    scene = _find_scene(scene_payload, "sc_0002")
    assert scene["readability"] is not None
    assert scene["readability"] > 0


def test_dialogue_only_scene_records_full_dialogue_ratio(settings: ServiceSettings) -> None:
    project_id = "metrics-dialogue"
    project_root = _seed_project(settings.project_base_dir, project_id)
    dialogue_text = '"Hello."\n"Another line."\n"Final beat."'
    _rewrite_draft(project_root, "sc_0001", dialogue_text)
    scene_payload = get_scene_metrics(settings, project_id)
    scene = _find_scene(scene_payload, "sc_0001")
    assert scene["density"]["dialogueRatio"] == pytest.approx(1.0)
    assert scene["density"]["narrationRatio"] == pytest.approx(0.0)
    assert scene["readability"] is not None
