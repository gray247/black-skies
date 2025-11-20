"""HTTP-level tests for the Phase 5 export endpoints."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

from fastapi.testclient import TestClient


def _write_outline(project_root: Path) -> None:
    outline = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_002",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_1000", "order": 1, "title": "Main Act"}],
        "scenes": [
            {"id": "sc_1001", "order": 1, "title": "Opening", "chapter_id": "ch_1000"},
            {"id": "sc_1002", "order": 2, "title": "Momentum", "chapter_id": "ch_1000"},
        ],
    }
    (project_root / "outline.json").write_text(json.dumps(outline, indent=2), encoding="utf-8")


def _write_scene(project_root: Path, scene_id: str, title: str, order: int, body: str) -> None:
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    metadata = (
        f"---\n"
        f"id: {scene_id}\n"
        f"title: {title}\n"
        f"order: {order}\n"
        f"chapter_id: ch_1000\n"
        f"---\n\n"
    )
    (drafts_dir / f"{scene_id}.md").write_text(metadata + body + "\n", encoding="utf-8")


def _prepare_project(project_base_dir: Path, project_id: str) -> Path:
    project_root = project_base_dir / project_id
    project_root.mkdir(parents=True, exist_ok=True)
    _write_outline(project_root)
    _write_scene(project_root, "sc_1001", "Opening Scene", 1, "First paragraph body.")
    _write_scene(project_root, "sc_1002", "Momentum Scene", 2, "Second paragraph body.")
    project_manifest = {
        "project_id": project_id,
        "name": "Phase 5 Export Sample",
        "description": "Used by export endpoint tests.",
    }
    (project_root / "project.json").write_text(json.dumps(project_manifest, indent=2), encoding="utf-8")
    return project_root


def _project_base_dir(client: TestClient) -> Path:
    return Path(client.app.state.settings.project_base_dir)


def _run_export(client: TestClient, project_id: str, export_format: str) -> dict[str, object]:
    response = client.post("/api/v1/export", json={"project_id": project_id, "format": export_format})
    assert response.status_code == 200
    payload = response.json()
    assert payload["project_id"] == project_id
    assert payload["format"] == export_format
    assert payload["schema_version"] == "ProjectExportResult v1"
    return payload


def test_export_txt_endpoint_generates_plain_text(test_client: TestClient) -> None:
    project_id = "txt-export"
    project_root = _prepare_project(_project_base_dir(test_client), project_id)

    payload = _run_export(test_client, project_id, "txt")

    exported_path = project_root / payload["path"]
    assert exported_path.exists()
    assert exported_path.suffix == ".txt"
    content = exported_path.read_text(encoding="utf-8").strip()
    assert "Opening Scene" in content
    assert "First paragraph body." in content


def test_export_markdown_endpoint_generates_markdown(test_client: TestClient) -> None:
    project_id = "md-export"
    project_root = _prepare_project(_project_base_dir(test_client), project_id)

    payload = _run_export(test_client, project_id, "md")

    exported_path = project_root / payload["path"]
    assert exported_path.exists()
    assert exported_path.suffix == ".md"
    content = exported_path.read_text(encoding="utf-8")
    assert content.startswith("# Main Act")
    assert "## Opening" in content
    assert "## Momentum" in content


def test_export_zip_endpoint_creates_project_archive(test_client: TestClient) -> None:
    project_id = "zip-export"
    project_root = _prepare_project(_project_base_dir(test_client), project_id)

    payload = _run_export(test_client, project_id, "zip")

    exported_path = project_root / payload["path"]
    assert exported_path.exists()
    assert zipfile.is_zipfile(exported_path)

    with zipfile.ZipFile(exported_path) as archive:
        members = set(archive.namelist())
        assert "project.json" in members
        assert "outline.json" in members
        assert "drafts/sc_1001.md" in members
        assert "drafts/sc_1002.md" in members
        assert "manifest.json" in members


def test_export_endpoint_fails_when_scene_draft_missing(test_client: TestClient) -> None:
    project_id = "missing-draft-export"
    project_root = _prepare_project(_project_base_dir(test_client), project_id)
    (project_root / "drafts" / "sc_1002.md").unlink()

    response = test_client.post("/api/v1/export", json={"project_id": project_id, "format": "md"})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert payload["message"] == "Project integrity check failed."
    assert any("sc_1002" in err for err in payload["details"]["errors"])


def test_export_endpoint_returns_validation_for_missing_project(test_client: TestClient) -> None:
    response = test_client.post("/api/v1/export", json={"project_id": "missing-export", "format": "md"})
    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "VALIDATION"
    assert payload["message"] == "Project root is missing."
    assert payload["details"]["project_id"] == "missing-export"
