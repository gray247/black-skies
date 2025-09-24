"""Tests covering the draft rewrite endpoint."""

from __future__ import annotations

import shutil
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from blackskies.services.app import create_app
from blackskies.services.config import Settings, reset_settings_cache, get_settings


def _read_scene_body(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        delimiter = "\n---\n"
        marker = text.find(delimiter, len("---"))
        assert marker != -1, "Scene file missing closing delimiter"
        body = text[marker + len(delimiter) :]
    else:
        body = text
    return body.replace("\r\n", "\n").rstrip("\n")


@pytest.fixture()
def project_root(tmp_path: Path) -> Path:
    """Return a temporary copy of the sample project."""

    source = Path("sample_project/Esther_Estate")
    target = tmp_path / "project"
    shutil.copytree(source, target)
    return target


@pytest.fixture()
def rewrite_client(project_root: Path) -> Iterator[TestClient]:
    """Provide a client bound to the rewrite-enabled app."""

    reset_settings_cache()
    app = create_app()
    settings = Settings(project_root=project_root)
    app.dependency_overrides[get_settings] = lambda: settings
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_rewrite_happy_path(rewrite_client: TestClient, project_root: Path) -> None:
    """A rewrite request updates disk and returns a structured diff."""

    unit_path = project_root / "drafts" / "sc_0001.md"
    original_body = _read_scene_body(unit_path)
    new_text = (
        "Mara sealed the hatch as the surge battered the cellar lights.\n\n"
        "Static bloomed, then coordinates crackled through before silence swallowed the room."
    )

    payload = {
        "draft_id": "dr_001",
        "unit_id": "sc_0001",
        "instructions": "Tighten pacing across both paragraphs.",
        "new_text": new_text,
        "envelope": {
            "draft_id": "dr_001",
            "schema_version": "DraftUnitSchema v1",
            "units": [
                {
                    "id": "sc_0001",
                    "text": original_body,
                }
            ],
        },
    }

    response = rewrite_client.post("/draft/rewrite", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["unit_id"] == "sc_0001"
    assert data["schema_version"] == "DraftUnitSchema v1"
    assert data["revised_text"] == new_text.replace("\r\n", "\n").rstrip("\n")
    diff = data["diff"]
    assert diff["anchors"]["left"] >= 0
    assert diff["anchors"]["right"] >= 0
    assert diff["changed"] or diff["added"] or diff["removed"]

    updated_body = _read_scene_body(unit_path)
    assert updated_body == new_text.replace("\r\n", "\n").rstrip("\n")


def test_rewrite_conflict_on_stale_version(
    rewrite_client: TestClient, project_root: Path
) -> None:
    """If disk content diverges from the envelope the rewrite is rejected."""

    unit_path = project_root / "drafts" / "sc_0001.md"
    original_body = _read_scene_body(unit_path)

    # Simulate an external edit to the scene.
    unit_path.write_text(
        unit_path.read_text(encoding="utf-8") + "\nA fresh interruption rattled the beams.\n",
        encoding="utf-8",
    )

    payload = {
        "draft_id": "dr_001",
        "unit_id": "sc_0001",
        "instructions": "noop",
        "new_text": original_body,
        "envelope": {
            "draft_id": "dr_001",
            "schema_version": "DraftUnitSchema v1",
            "units": [
                {
                    "id": "sc_0001",
                    "text": original_body,
                }
            ],
        },
    }

    response = rewrite_client.post("/draft/rewrite", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["code"] == "CONFLICT"
    assert data["details"]["unit_id"] == "sc_0001"


def test_rewrite_validation_for_multiple_units(
    rewrite_client: TestClient, project_root: Path
) -> None:
    """Requests including multiple units are rejected with validation error."""

    unit_path = project_root / "drafts" / "sc_0001.md"
    original_body = _read_scene_body(unit_path)

    payload = {
        "draft_id": "dr_001",
        "unit_id": "sc_0001",
        "instructions": "noop",
        "new_text": original_body,
        "envelope": {
            "draft_id": "dr_001",
            "schema_version": "DraftUnitSchema v1",
            "units": [
                {"id": "sc_0001", "text": original_body},
                {"id": "sc_0002", "text": "Other"},
            ],
        },
    }

    response = rewrite_client.post("/draft/rewrite", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "VALIDATION"
    assert "exactly one unit" in data["message"]
