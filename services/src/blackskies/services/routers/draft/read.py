"""Draft scene read endpoint.

This endpoint is intentionally small and backend-only: it returns the on-disk
draft markdown for a single scene under a canonical project_id.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import Depends, Query, status

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...export import load_outline_artifact
from ...http import raise_filesystem_error, raise_service_error, raise_validation_error
from ...models._project_id import validate_project_id
from ...scene_docs import DraftRequestError
from ..dependencies import get_diagnostics, get_settings
from . import router


@router.get("/{scene_id}")
def read_draft_scene(
    scene_id: str,
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, str | None]:
    """Return the current draft markdown for a scene."""

    try:
        validated_project_id = validate_project_id(project_id)
    except ValueError:
        raise_validation_error(
            message="Invalid project id.",
            details={"project_id": project_id, "scene_id": scene_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    project_root = Path(settings.project_base_dir) / validated_project_id
    if not project_root.exists():
        raise_service_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="PROJECT_NOT_FOUND",
            message="Project does not exist.",
            details={"project_id": validated_project_id},
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

    scene = next((item for item in outline.scenes if item.id == scene_id), None)
    if scene is None:
        raise_service_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="SCENE_NOT_FOUND",
            message="Scene does not exist in this project.",
            details={"project_id": validated_project_id, "scene_id": scene_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    draft_path = project_root / "drafts" / f"{scene_id}.md"
    if not draft_path.exists():
        raise_service_error(
            status_code=status.HTTP_404_NOT_FOUND,
            code="DRAFT_NOT_FOUND",
            message="Draft scene markdown is missing.",
            details={"project_id": validated_project_id, "scene_id": scene_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    try:
        text = draft_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        raise_validation_error(
            message="Draft scene markdown contains invalid UTF-8.",
            details={"project_id": validated_project_id, "scene_id": scene_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except OSError as exc:
        raise_filesystem_error(
            exc,
            message="Failed to read draft scene markdown.",
            details={"project_id": validated_project_id, "scene_id": scene_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    return {
        "sceneId": scene_id,
        "title": scene.title,
        "text": text,
    }


__all__ = ["read_draft_scene"]
