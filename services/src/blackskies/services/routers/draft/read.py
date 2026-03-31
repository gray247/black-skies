"""Draft read endpoint for scene-specific editor loading."""

from __future__ import annotations

from fastapi import Depends, Query, status

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...export import load_outline_artifact
from ...http import raise_service_error, raise_validation_error
from ...models._project_id import validate_project_id
from ..dependencies import get_diagnostics, get_settings
from . import router


@router.get("/{scene_id}")
async def read_draft(
    scene_id: str,
    *,
    project_id: str = Query(..., min_length=1),
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, str | None]:
    """Return the current draft text for a scene, or null when none exists."""

    try:
        validated_project_id = validate_project_id(project_id)
    except ValueError as exc:
        raise_validation_error(
            message="Invalid project id.",
            details={"project_id": project_id, "scene_id": scene_id},
            diagnostics=diagnostics,
        )

    project_root = settings.project_base_dir / validated_project_id
    try:
        outline = load_outline_artifact(project_root)
    except Exception as exc:
        raise_validation_error(
            message=str(exc),
            details={"project_id": validated_project_id, "scene_id": scene_id},
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
    text = draft_path.read_text(encoding="utf-8") if draft_path.exists() else None

    return {
        "sceneId": scene_id,
        "title": scene.title,
        "text": text,
    }


__all__ = ["read_draft"]
