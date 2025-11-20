"""Project export service helpers for Phase 5."""

from __future__ import annotations

import asyncio
import json
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Iterable

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .export import compile_manuscript, load_outline_artifact
from .integrity import validate_project
from .persistence import write_text_atomic
from .scene_docs import DraftRequestError
from .utils.paths import to_posix


class ExportFormat(str, Enum):
    """Formats that Phase 5 aims to support."""

    DOCX = "docx"
    PDF = "pdf"
    RTF = "rtf"
    TXT = "txt"
    MD = "md"
    ZIP = "zip"

    @classmethod
    def supported(cls) -> tuple["ExportFormat", ...]:
        return (cls.MD, cls.TXT, cls.ZIP)

    def extension(self) -> str:
        return self.value


@dataclass(slots=True)
class ProjectExportResult:
    """Return payload for completed project exports."""

    payload: dict[str, object]


class ProjectExportService:
    """Coordinate project-level exports for Phase 5."""

    def __init__(
        self,
        *,
        settings: ServiceSettings,
        diagnostics: DiagnosticLogger,
    ) -> None:
        self._settings = settings
        self._diagnostics = diagnostics

    async def export(
        self,
        *,
        project_id: str,
        format: ExportFormat,
        include_meta_header: bool = False,
    ) -> ProjectExportResult:
        project_root = self._settings.project_base_dir / project_id
        if not project_root.exists():
            raise FileNotFoundError(project_root)

        if format not in ExportFormat.supported():
            raise DraftRequestError(
                "Requested export format is not yet implemented.",
                {"format": format.value, "supported": [fmt.value for fmt in ExportFormat.supported()]},
            )

        integrity = validate_project(self._settings, project_root=project_root)
        if not integrity.is_ok:
            self._diagnostics.log(
                project_root,
                code="INTEGRITY_CHECK_FAILED",
                message="Project integrity validation failed before export.",
                details={"errors": integrity.errors, "warnings": integrity.warnings},
            )
            raise DraftRequestError(
                "Project integrity check failed.",
                {"errors": integrity.errors, "warnings": integrity.warnings},
            )

        outline = load_outline_artifact(project_root)
        manuscript, chapter_count, scene_count = await asyncio.to_thread(
            compile_manuscript,
            project_root,
            outline,
            include_meta_header=include_meta_header,
        )

        exports_dir = project_root / "exports"
        exports_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        filename = f"{project_id}_export_{timestamp}.{format.extension()}"
        target_path = exports_dir / filename

        try:
            if format == ExportFormat.ZIP:
                self._write_project_zip(project_root, target_path, manifesto=manuscript)
            else:
                write_text_atomic(target_path, manuscript)
        except OSError as exc:
            self._diagnostics.log(
                project_root,
                code="EXPORT_WRITE_FAILED",
                message="Failed to write exported manuscript.",
                details={"path": to_posix(target_path), "error": str(exc)},
            )
            raise

        payload = {
            "project_id": project_id,
            "path": self._relative_path(target_path, project_root),
            "format": format.value,
            "chapters": chapter_count,
            "scenes": scene_count,
            "meta_header": include_meta_header,
            "exported_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "schema_version": "ProjectExportResult v1",
        }
        return ProjectExportResult(payload=payload)

    @staticmethod
    def _relative_path(path: Path, project_root: Path) -> str:
        try:
            return to_posix(path.relative_to(project_root))
        except ValueError:
            return to_posix(path)

    def _write_project_zip(self, project_root: Path, target_path: Path, *, manifesto: str) -> None:
        """Create a ZIP archive containing the core project files."""

        entries: list[str] = []
        with zipfile.ZipFile(target_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in project_root.rglob("*"):
                if not path.is_file():
                    continue
                relative = path.relative_to(project_root)
                if relative.parts and relative.parts[0] == "exports":
                    continue
                arcname = relative.as_posix()
                archive.write(path, arcname)
                entries.append(arcname)

            manifest = {
                "schema_version": "ProjectZipManifest v1",
                "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "entries": sorted(entries),
                "manuscript_preview": manifesto.splitlines()[:3],
            }
            archive.writestr("manifest.json", json.dumps(manifest, indent=2))


__all__ = [
    "ExportFormat",
    "ProjectExportResult",
    "ProjectExportService",
]
