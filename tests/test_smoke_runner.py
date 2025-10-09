from __future__ import annotations

import json
from pathlib import Path

import pytest

from blackskies.services.routers.draft import _compute_sha256
from blackskies.services.scene_docs import read_scene_document

from scripts import smoke_runner


@pytest.fixture
def sample_project_root(tmp_path: Path) -> Path:
    project_root = tmp_path / "proj_demo"
    project_root.mkdir(parents=True)
    outline = {
        "scenes": [
            {"id": "sc_0001"},
            {"id": "sc_0002"},
        ]
    }
    (project_root / "outline.json").write_text(json.dumps(outline), encoding="utf-8")

    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir()
    (drafts_dir / "sc_0001.md").write_text("---\nid: sc_0001\n---\nBody one\n", encoding="utf-8")
    return project_root


def test_load_scene_ids_returns_expected_order(sample_project_root: Path) -> None:
    scene_ids = smoke_runner.load_scene_ids(sample_project_root, 3)
    assert scene_ids == ["sc_0001", "sc_0002", "sc_0001"]


def test_compute_scene_sha_matches_expected(sample_project_root: Path) -> None:
    digest = smoke_runner.compute_scene_sha(sample_project_root, "sc_0001")
    _, _, body = read_scene_document(sample_project_root, "sc_0001")
    expected = _compute_sha256(body)
    assert digest == expected


def test_build_accept_payload_shapes_request() -> None:
    payload = smoke_runner.build_accept_payload(
        project_id="proj_demo",
        draft_id="dr_1234",
        unit={"id": "sc_0001", "text": "body", "meta": {"purpose": "setup"}},
        previous_sha="abc123",
        message="Smoke run",
        estimated_cost=1.5,
    )

    assert payload["unit_id"] == "sc_0001"
    assert payload["unit"]["previous_sha256"] == "abc123"
    assert payload["unit"]["estimated_cost_usd"] == 1.5
    assert payload["snapshot_label"] == "accept-sc_0001"
