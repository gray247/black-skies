"""Unit tests for export meta header and manuscript helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

from blackskies.services.export import (
    build_meta_header as _build_meta_header,
    compile_manuscript as _compile_manuscript,
)
from blackskies.services.models.outline import OutlineArtifact, OutlineChapter, OutlineScene
from blackskies.services.scene_docs import DraftRequestError


@pytest.mark.parametrize(
    ("front_matter", "expected"),
    [
        pytest.param({}, None, id="no-meta"),
        pytest.param(
            {"emotion_tag": "Calm"},
            "> emotion: Calm",
            id="single-field",
        ),
        pytest.param({"pov": "Third"}, None, id="pov-only-skipped"),
        pytest.param(
            {"pov": "First person", "emotion_tag": "Joy"},
            "> emotion: Joy · pov: First person",
            id="two-fields-ordering",
        ),
        pytest.param(
            {
                "pov": "  close third  ",
                "emotion_tag": " reflective  ",
                "purpose": "  introspection ",
            },
            "> purpose: introspection · emotion: reflective · pov: close third",
            id="three-fields-trimming",
        ),
    ],
)
def test_build_meta_header(front_matter: dict[str, str], expected: str | None) -> None:
    """Verify the meta header renders with the expected formatting."""

    assert _build_meta_header(front_matter) == expected


def _outline_with_chapters() -> OutlineArtifact:
    return OutlineArtifact(
        outline_id="out_001",
        acts=["Act I"],
        chapters=[
            OutlineChapter(id="ch_0002", order=2, title="Second"),
            OutlineChapter(id="ch_0001", order=1, title="First"),
        ],
        scenes=[
            OutlineScene(id="sc_0002", order=2, title="Scene Beta", chapter_id="ch_0001"),
            OutlineScene(id="sc_0001", order=1, title="Scene Alpha", chapter_id="ch_0001"),
            OutlineScene(id="sc_0003", order=1, title="Scene Gamma", chapter_id="ch_0002"),
        ],
    )


def test_compile_manuscript_orders_units_and_includes_meta(monkeypatch: pytest.MonkeyPatch) -> None:
    outline = _outline_with_chapters()
    project_root = Path("/tmp/project")

    front_matter_map: dict[str, dict[str, Any]] = {
        "sc_0001": {
            "id": "sc_0001",
            "title": "Scene Alpha",
            "order": 1,
            "purpose": "setup",
            "emotion_tag": "tense",
            "pov": "first",
        },
        "sc_0002": {
            "id": "sc_0002",
            "title": "Scene Beta",
            "order": 2,
            "purpose": "conflict",
            "emotion_tag": "angry",
        },
        "sc_0003": {
            "id": "sc_0003",
            "title": "Scene Gamma",
            "order": 1,
            "pov": "third",
        },
    }
    bodies = {
        "sc_0001": "Alpha body\nwith details",
        "sc_0002": "Beta body",
        "sc_0003": "Gamma body",
    }

    def _fake_read_scene_document(project_root_param: Path, unit_id: str) -> tuple[Path, dict[str, Any], str]:
        assert project_root_param == project_root
        return project_root / "drafts" / f"{unit_id}.md", front_matter_map[unit_id], bodies[unit_id]

    monkeypatch.setattr("blackskies.services.export.read_scene_document", _fake_read_scene_document)

    manuscript, chapter_count, scene_count = _compile_manuscript(
        project_root,
        outline,
        include_meta_header=True,
    )

    expected = (
        "# First\n\n"
        "## Scene Alpha\n"
        "> purpose: setup · emotion: tense · pov: first\n\n"
        "Alpha body\nwith details\n\n"
        "## Scene Beta\n"
        "> purpose: conflict · emotion: angry\n\n"
        "Beta body\n\n"
        "# Second\n\n"
        "## Scene Gamma\n"
        "Gamma body"
    )

    assert manuscript == expected
    assert chapter_count == 2
    assert scene_count == 3


def test_compile_manuscript_propagates_scene_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    outline = OutlineArtifact(
        outline_id="out_002",
        acts=["Act I"],
        chapters=[OutlineChapter(id="ch_0100", order=1, title="Only")],
        scenes=[OutlineScene(id="sc_0100", order=1, title="Lonely", chapter_id="ch_0100")],
    )
    project_root = Path("/tmp/project")

    def _raise(_: Path, unit_id: str) -> tuple[Path, dict[str, Any], str]:
        raise DraftRequestError("boom", {"unit_id": unit_id, "detail": "missing"})

    monkeypatch.setattr("blackskies.services.export.read_scene_document", _raise)

    with pytest.raises(DraftRequestError) as excinfo:
        _compile_manuscript(project_root, outline, include_meta_header=False)

    assert excinfo.value.details["unit_id"] == "sc_0100"
    assert excinfo.value.details["detail"] == "missing"
