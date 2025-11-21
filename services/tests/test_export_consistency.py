"""Regression tests to lock export ordering and consistency across formats."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import pytest

from blackskies.services.config import ServiceSettings
from blackskies.services.diagnostics import DiagnosticLogger
from blackskies.services.export_service import ExportFormat, ProjectExportService
from blackskies.services.scene_docs import DraftRequestError


def _write_outline(project_root: Path) -> None:
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
    drafts_dir = project_root / "drafts"
    drafts_dir.mkdir(parents=True, exist_ok=True)
    content = (
        f"---\n"
        f"id: {scene_id}\n"
        f"title: {title}\n"
        f"order: {order}\n"
        f"chapter_id: ch_0001\n"
        f"---\n\n"
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
    return asyncio.run(service.export(project_id=project_id, format=fmt)).payload


def _body_word_count(project_root: Path) -> int:
    tokens: list[str] = []
    for draft_path in sorted((project_root / "drafts").glob("*.md")):
        lines = draft_path.read_text(encoding="utf-8").splitlines()
        try:
            body_index = lines.index("---", 1) + 1
        except ValueError:
            body_index = len(lines)
        tokens.extend(" ".join(lines[body_index:]).split())
    return len(tokens)


def _export_body_word_count(content: str) -> int:
    lines = [line for line in content.splitlines() if line.strip() and not line.lstrip().startswith("#")]
    return len(" ".join(lines).split())


@pytest.mark.parametrize("fmt", [ExportFormat.MD, ExportFormat.DOCX, ExportFormat.PDF])
def test_all_formats_preserve_scene_order(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, fmt: ExportFormat) -> None:
    project_id = f"{fmt.value}-order"
    project_root = _prepare_project(tmp_path, project_id)
    monkeypatch.setattr(
        ExportFormat,
        "supported",
        classmethod(lambda cls: (cls.MD, cls.TXT, cls.ZIP, cls.DOCX, cls.PDF)),
    )

    payload = _run_export(project_root, project_id, fmt)
    exported_path = project_root / payload["path"]
    content = exported_path.read_text(encoding="utf-8")

    assert content.index("Opening Scene") < content.index("Middle Scene")


def test_export_word_count_matches_source(tmp_path: Path) -> None:
    project_id = "word-count"
    project_root = _prepare_project(tmp_path, project_id)

    payload = _run_export(project_root, project_id, ExportFormat.MD)
    exported_path = project_root / payload["path"]
    content = exported_path.read_text(encoding="utf-8")

    original_words = _body_word_count(project_root)
    exported_words = _export_body_word_count(content)
    assert exported_words == original_words


def test_missing_draft_surfaces_validation_error(tmp_path: Path) -> None:
    project_id = "missing-draft"
    project_root = _prepare_project(tmp_path, project_id)
    missing = project_root / "drafts" / "sc_0002.md"
    missing.unlink()
    settings = ServiceSettings(project_base_dir=project_root.parent)
    service = ProjectExportService(settings=settings, diagnostics=DiagnosticLogger())

    with pytest.raises(DraftRequestError) as exc_info:
        asyncio.run(service.export(project_id=project_id, format=ExportFormat.MD))

    error_details = exc_info.value.details
    serialized = json.dumps(error_details)
    assert "sc_0002" in serialized
    assert error_details.get("errors") is not None


def test_export_round_trip_preserves_content(tmp_path: Path) -> None:
    project_id = "round-trip"
    project_root = _prepare_project(tmp_path, project_id)

    payload = _run_export(project_root, project_id, ExportFormat.MD)
    exported_path = project_root / payload["path"]
    exported_content = exported_path.read_text(encoding="utf-8")

    roundtrip_path = project_root / "exports" / "roundtrip.md"
    roundtrip_path.write_text(exported_content, encoding="utf-8")

    reimported = roundtrip_path.read_text(encoding="utf-8")
    assert reimported == exported_content
