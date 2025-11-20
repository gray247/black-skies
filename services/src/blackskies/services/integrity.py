"""Project integrity validation helpers."""

from __future__ import annotations

import json
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from .config import ServiceSettings
from .export import load_outline_artifact
from .io import read_json
from .models.project import ProjectMetadata
from .scene_docs import DraftRequestError, read_scene_document


class ProjectIntegrityResult(BaseModel):
    """Structured summary describing the state of a project tree."""

    model_config = ConfigDict(extra="ignore")

    project_id: str | None = None
    project_root: str
    is_ok: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


def validate_project(
    settings: ServiceSettings,
    *,
    project_id: str | None = None,
    project_root: Path | str | None = None,
) -> ProjectIntegrityResult:
    """
    Validate the project tree rooted under either ``project_id`` or ``project_root``.

    At least one of ``project_id`` or ``project_root`` must be provided. If both are
    supplied, ``project_root`` takes precedence.
    """

    resolved_root = _resolve_project_root(settings, project_id=project_id, project_root=project_root)
    resolved_id: str | None = project_id
    errors: list[str] = []
    warnings: list[str] = []
    metadata: ProjectMetadata | None = None

    if not resolved_root.exists():
        errors.append("Project root is missing.")
        return _build_result(resolved_root, resolved_id, errors, warnings)

    project_json_path = resolved_root / "project.json"
    if not project_json_path.exists():
        errors.append("project.json is missing.")
    else:
        try:
            raw_payload = read_json(project_json_path)
        except json.JSONDecodeError:
            errors.append("project.json contains invalid JSON.")
        else:
            try:
                metadata = ProjectMetadata.model_validate(raw_payload)
            except ValidationError as exc:
                errors.append(f"project.json failed schema validation: {exc.errors()}")

    outline_path = resolved_root / "outline.json"
    outline = None
    if not outline_path.exists():
        errors.append("outline.json is missing.")
    else:
        try:
            outline = load_outline_artifact(resolved_root)
        except DraftRequestError as exc:
            errors.append(_format_draft_error("outline", exc))

    drafts_dir = resolved_root / "drafts"
    if not drafts_dir.is_dir():
        errors.append("drafts/ directory is missing.")

    if outline:
        _validate_scene_order(outline, warnings)
        if drafts_dir.is_dir():
            _validate_scene_drafts(resolved_root, outline, errors)

    if metadata:
        _validate_metadata(metadata, resolved_root.name, warnings)

    return _build_result(resolved_root, resolved_id, errors, warnings)


def _resolve_project_root(
    settings: ServiceSettings,
    *,
    project_id: str | None = None,
    project_root: Path | str | None = None,
) -> Path:
    if project_root is not None:
        return Path(project_root)
    if not project_id:
        raise ValueError("project_id or project_root must be provided")
    return settings.project_base_dir / project_id


def _validate_scene_drafts(
    project_root: Path,
    outline,
    errors: list[str],
) -> None:
    for scene in outline.scenes:
        try:
            read_scene_document(project_root, scene.id)
        except DraftRequestError as exc:
            errors.append(_format_draft_error(scene.id, exc))


def _validate_scene_order(outline, warnings: list[str]) -> None:
    chapter_order = {chapter.id: chapter.order for chapter in outline.chapters}
    sorted_scenes = sorted(
        outline.scenes,
        key=lambda scene: (chapter_order.get(scene.chapter_id, 0), scene.order),
    )
    if [scene.id for scene in sorted_scenes] != [scene.id for scene in outline.scenes]:
        warnings.append("Outline scenes are not ordered by chapter and scene order.")


def _validate_metadata(metadata: ProjectMetadata, folder_name: str, warnings: list[str]) -> None:
    if not metadata.project_id:
        warnings.append("project.json does not define a project_id.")
    elif metadata.project_id != folder_name:
        warnings.append("project.json project_id differs from directory name.")

    if not metadata.name:
        warnings.append("project.json is missing a project name/title.")


def _format_draft_error(identifier: str, exc: DraftRequestError) -> str:
    details = exc.details or {}
    if details:
        detail_payload = ", ".join(f"{key}={value}" for key, value in details.items())
        return f"{identifier}: {exc} ({detail_payload})"
    return f"{identifier}: {exc}"


def _build_result(
    project_root: Path,
    resolved_project_id: str | None,
    errors: list[str],
    warnings: list[str],
) -> ProjectIntegrityResult:
    project_id = resolved_project_id or project_root.name
    is_ok = not errors
    return ProjectIntegrityResult(
        project_id=project_id,
        project_root=str(project_root),
        is_ok=is_ok,
        errors=errors,
        warnings=warnings,
    )


__all__ = ["ProjectIntegrityResult", "validate_project"]
