"""Unit tests for the Phase 5 project export service."""

from __future__ import annotations

import asyncio
import json
import zipfile
from pathlib import Path

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.export_service import ExportFormat, ProjectExportService


def _write_outline(project_root: Path) -> None:
    """Create a minimal outline artifact for export."""

    payload = {
        "schema_version": "OutlineSchema v1",
        "outline_id": "out_001",
        "acts": ["Act I"],
        "chapters": [{"id": "ch_0001", "order": 1, "title": "Act One"}],
        "scenes": [
            {"id": "sc_0001", "order": 1, "title": "Opening Scene", "chapter_id": "ch_0001"},
            {"id": "sc_0002", "order": 2, "title": "Middle Scene", "chapter_id": "ch_0001"},
        ],
    }
    project_root.mkdir(parents=True, exist_ok=True)
    (project_root / "outline.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _write_scene(project_root: Path, scene_id: str, title: str, order: int, body: str) -> None:
    """Persist a scene markdown file required for exports."""

    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    content = (
        f"---\n"
        f"id: {scene_id}\n"
        f"title: {title}\n"
        f"order: {order}\n"
        f"chapter_id: ch_0001\n"
        f"---\n"
        f"\n"
        f"{body}\n"
    )
    (drafts_dir / f"{scene_id}.md").write_text(content, encoding="utf-8")


def _prepare_project(tmp_path: Path, project_id: str) -> Path:
    project_root = tmp_path / project_id
    _write_outline(project_root)
    _write_scene(project_root, "sc_0001", "Opening Scene", 1, "First scene body.")
    _write_scene(project_root, "sc_0002", "Middle Scene", 2, "Second scene body.")
    (project_root / "project.json").write_text(
        json.dumps({"project_id": project_id, "name": "Sample Project"}, indent=2),
        encoding="utf-8",
    )
    return project_root


def _run_export(project_root: Path, project_id: str, fmt: ExportFormat) -> dict[str, object]:
    settings = ServiceSettings(project_base_dir=project_root.parent)
    diagnostics = DiagnosticLogger()
    service = ProjectExportService(settings=settings, diagnostics=diagnostics)
    result = asyncio.run(
        service.export(
            project_id=project_id,
            format=fmt,
        )
    )
    return result.payload


def test_project_export_service_writes_markdown(tmp_path: Path) -> None:
    project_id = "export-test"
    project_root = _prepare_project(tmp_path, project_id)

    payload = _run_export(project_root, project_id, ExportFormat.MD)

    assert payload["project_id"] == project_id
    assert payload["format"] == ExportFormat.MD.value
    assert payload["chapters"] == 1
    assert payload["scenes"] == 2
    exported_path = project_root / payload["path"]
    assert exported_path.exists()

    content = exported_path.read_text(encoding="utf-8")
    assert content.startswith("# Act One")
    assert "## Opening Scene" in content
    assert "First scene body." in content
    assert "Middle Scene" in content


def test_project_export_service_writes_plain_text(tmp_path: Path) -> None:
    project_id = "export-txt"
    project_root = _prepare_project(tmp_path, project_id)

    payload = _run_export(project_root, project_id, ExportFormat.TXT)

    assert payload["project_id"] == project_id
    assert payload["format"] == ExportFormat.TXT.value
    exported_path = project_root / payload["path"]
    assert exported_path.exists()
    assert exported_path.suffix == ".txt"

    content = exported_path.read_text(encoding="utf-8")
    assert "# Act One" in content
    assert "First scene body." in content
    assert "Middle Scene" in content


def test_project_export_service_writes_zip(tmp_path: Path) -> None:
    project_id = "export-zip"
    project_root = _prepare_project(tmp_path, project_id)

    payload = _run_export(project_root, project_id, ExportFormat.ZIP)

    assert payload["project_id"] == project_id
    assert payload["format"] == ExportFormat.ZIP.value
    exported_path = project_root / payload["path"]
    assert exported_path.exists()
    assert zipfile.is_zipfile(exported_path)

    with zipfile.ZipFile(exported_path) as archive:
        members = set(archive.namelist())
        assert "project.json" in members
        assert "outline.json" in members
        assert "drafts/sc_0001.md" in members
        assert "manifest.json" in members
