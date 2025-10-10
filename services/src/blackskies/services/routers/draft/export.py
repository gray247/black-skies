"""Draft export endpoint and schema."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel, ValidationError, field_validator

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...export import compile_manuscript, load_outline_artifact
from ...http import raise_validation_error
from ...models._project_id import validate_project_id
from ...persistence import write_text_atomic
from ...scene_docs import DraftRequestError
from ...utils.paths import to_posix
from ..dependencies import get_diagnostics, get_settings
from ..shared import utc_timestamp
from . import router


class DraftExportRequest(BaseModel):
    project_id: str
    include_meta_header: bool = False

    @field_validator("project_id")
    @classmethod
    def _validate_project_id(cls, value: str) -> str:
        """Ensure export requests use a safe single-segment project identifier."""

        return validate_project_id(value)


@router.post("/export")
async def export_manuscript(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Compile the manuscript to disk with optional metadata headers."""

    try:
        request_model = DraftExportRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid export request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        outline = load_outline_artifact(project_root)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    try:
        manuscript, chapter_count, scene_count = compile_manuscript(
            project_root,
            outline,
            include_meta_header=request_model.include_meta_header,
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    target_path = project_root / "draft_full.md"
    try:
        write_text_atomic(target_path, manuscript)
    except OSError as exc:
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to write draft_full.md.",
            details={"error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to write draft_full.md.",
                "details": {"project_id": request_model.project_id},
            },
        ) from exc

    try:
        relative_path = target_path.relative_to(project_root)
        export_path = to_posix(relative_path)
    except ValueError:
        export_path = to_posix(target_path)

    return {
        "project_id": request_model.project_id,
        "path": export_path,
        "chapters": chapter_count,
        "scenes": scene_count,
        "meta_header": request_model.include_meta_header,
        "exported_at": utc_timestamp(),
        "schema_version": "DraftExportResult v1",
    }


__all__ = ["export_manuscript", "DraftExportRequest"]
