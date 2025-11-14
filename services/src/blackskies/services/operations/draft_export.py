"""Service helpers for draft manuscript exports."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..resilience import ServiceResilienceExecutor
from ..export import (
    build_analytics_report,
    compile_manuscript,
    load_batch_critique_summaries,
    load_outline_artifact,
)
from ..persistence import write_text_atomic
from ..scene_docs import DraftRequestError
from ..utils.paths import to_posix
from ..routers.shared import utc_timestamp


@dataclass(slots=True)
class DraftExportResult:
    """Result payload describing exported manuscript artifacts."""

    payload: dict[str, Any]


class DraftExportService:
    """Coordinate manuscript export, analytics bundles, and critique summaries."""

    def __init__(
        self,
        *,
        settings: ServiceSettings,
        diagnostics: DiagnosticLogger,
        analytics_resilience: ServiceResilienceExecutor | None = None,
        analytics_enabled: bool = False,
    ) -> None:
        self._settings = settings
        self._diagnostics = diagnostics
        self._analytics_resilience = analytics_resilience
        self._analytics_enabled = analytics_enabled

    async def export(self, *, project_id: str, include_meta_header: bool) -> DraftExportResult:
        project_root = self._settings.project_base_dir / project_id
        if not project_root.exists():
            raise FileNotFoundError(project_root)

        outline = load_outline_artifact(project_root)
        draft_units: list[dict[str, Any]] = []

        def collect_unit(scene, meta, body_text) -> None:
            metadata = dict(meta)
            title = metadata.get("title") or scene.title
            if title:
                metadata.setdefault("title", title)
            draft_units.append(
                {
                    "id": scene.id,
                    "title": title or scene.title,
                    "text": body_text,
                    "meta": metadata,
                }
            )

        manuscript, chapter_count, scene_count = await asyncio.to_thread(
            self._compile_manuscript,
            project_root,
            outline,
            include_meta_header=include_meta_header,
            unit_collector=collect_unit,
        )

        artifacts: dict[str, str] = {}
        if self._analytics_enabled and self._analytics_resilience is not None:
            analytics_path = project_root / "analytics_report.json"
            analytics_payload = await self._run_analytics(outline, draft_units)
            await asyncio.to_thread(
                self._write_json,
                analytics_path,
                analytics_payload,
                project_root,
                "analytics_report.json",
            )
            artifacts["analytics_report"] = self._relative_path(analytics_path, project_root)

        critique_bundle_path = await asyncio.to_thread(
            self._write_critique_bundle,
            project_root,
            outline,
            default_message="No batch critiques recorded yet.",
        )

        draft_path = project_root / "draft_full.md"
        await asyncio.to_thread(
            self._write_text,
            draft_path,
            manuscript,
            project_root,
            "draft_full.md",
        )

        artifacts["critique_bundle"] = self._relative_path(critique_bundle_path, project_root)
        export_path = self._relative_path(draft_path, project_root)

        payload = {
            "project_id": project_id,
            "path": export_path,
            "chapters": chapter_count,
            "scenes": scene_count,
            "meta_header": include_meta_header,
            "exported_at": utc_timestamp(),
            "schema_version": "DraftExportResult v1",
            "artifacts": artifacts,
        }
        return DraftExportResult(payload=payload)

    async def _run_analytics(
        self,
        outline,
        draft_units: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if self._analytics_resilience is None:
            return build_analytics_report(outline, draft_units)
        return await self._analytics_resilience.run(
            label="analytics",
            operation=lambda: build_analytics_report(outline, draft_units),
        )

    def _compile_manuscript(
        self,
        project_root: Path,
        outline,
        *,
        include_meta_header: bool,
        unit_collector: Callable[[Any, dict[str, Any], str], None],
    ) -> tuple[str, int, int]:
        try:
            return compile_manuscript(
                project_root,
                outline,
                include_meta_header=include_meta_header,
                unit_collector=unit_collector,
            )
        except DraftRequestError:
            raise

    def _write_json(
        self,
        path: Path,
        payload: dict[str, Any],
        project_root: Path,
        label: str,
    ) -> None:
        try:
            write_text_atomic(
                path,
                json.dumps(payload, indent=2, ensure_ascii=False),
            )
        except OSError as exc:
            self._diagnostics.log(
                project_root,
                code="INTERNAL",
                message=f"Failed to write {label}.",
                details={"error": str(exc)},
            )
            raise

    def _write_text(self, path: Path, content: str, project_root: Path, label: str) -> None:
        try:
            write_text_atomic(path, content)
        except OSError as exc:
            self._diagnostics.log(
                project_root,
                code="INTERNAL",
                message=f"Failed to write {label}.",
                details={"error": str(exc)},
            )
            raise

    def _write_critique_bundle(
        self,
        project_root: Path,
        outline,
        *,
        default_message: str,
    ) -> Path:
        summaries = load_batch_critique_summaries(project_root, outline)
        bundle_lines = ["# Batch Critique Summary", f"_Generated {utc_timestamp()}_", ""]
        if summaries:
            for entry in summaries:
                bundle_lines.append(f"## {entry['title']} ({entry['scene_id']})")
                if entry.get("captured_at"):
                    bundle_lines.append(f"*Captured:* {entry['captured_at']}")
                rubric = entry.get("rubric") or []
                if rubric:
                    bundle_lines.append(f"*Rubric:* {', '.join(str(item) for item in rubric)}")
                summary_text = (entry.get("summary") or "").strip()
                bundle_lines.append("")
                if summary_text:
                    bundle_lines.append(summary_text)
                else:
                    bundle_lines.append("_No summary available._")
                priorities = entry.get("priorities") or []
                if priorities:
                    bundle_lines.append("")
                    bundle_lines.append("**Priorities**")
                    for priority in priorities:
                        bundle_lines.append(f"- {priority}")
                bundle_lines.append("")
        else:
            bundle_lines.append(default_message)
            bundle_lines.append("")

        bundle_text = "\n".join(line.rstrip() for line in bundle_lines).rstrip() + "\n"
        critique_bundle_path = project_root / "critique_bundle.md"
        self._write_text(critique_bundle_path, bundle_text, project_root, "critique_bundle.md")
        return critique_bundle_path

    @staticmethod
    def _relative_path(path: Path, project_root: Path) -> str:
        try:
            return to_posix(path.relative_to(project_root))
        except ValueError:
            return to_posix(path)


__all__ = ["DraftExportService", "DraftExportResult"]
