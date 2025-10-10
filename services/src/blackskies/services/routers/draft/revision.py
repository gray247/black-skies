"""Draft rewrite and critique endpoints."""

from __future__ import annotations

import asyncio
import hashlib
import shutil
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from pydantic import ValidationError

from ...config import ServiceSettings
from ...critique import CritiqueService
from ...diagnostics import DiagnosticLogger
from ...diff_engine import compute_diff
from ...export import merge_front_matter, normalize_markdown
from ...http import raise_conflict_error, raise_service_error, raise_validation_error
from ...models.critique import DraftCritiqueRequest
from ...models.rewrite import DraftRewriteRequest
from ...persistence import DraftPersistence
from ...scene_docs import DraftRequestError, read_scene_document
from ..dependencies import get_critique_service, get_diagnostics, get_settings
from . import router


def _apply_rewrite_instructions(original: str, instructions: str | None) -> str:
    baseline = normalize_markdown(original)
    prompt = (instructions or "Maintain current tone.").strip()
    if not prompt:
        prompt = "Maintain current tone."
    digest = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    templates = [
        "The rhythm tightens, each beat landing with intent.",
        "A hush settles before the next wave hits.",
        "Their resolve sharpens against the gathering dark.",
        "An undercurrent of hope threads through the static.",
    ]
    closing = templates[int(digest[:8], 16) % len(templates)]
    return f"{baseline}\n\n{closing} ({prompt})"


@router.post("/rewrite")
async def rewrite_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Apply rewrite instructions and persist the revised draft unit."""

    project_root: Path | None = None
    try:
        request_model = DraftRewriteRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft rewrite request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    try:
        target_path, front_matter, current_body = read_scene_document(
            project_root, request_model.unit_id
        )
    except DraftRequestError as exc:
        raise_conflict_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    if normalize_markdown(current_body) != normalize_markdown(request_model.unit.text):
        raise_conflict_error(
            message="The scene on disk no longer matches the submitted draft unit.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    revised_text = request_model.new_text
    if revised_text is None:
        revised_text = _apply_rewrite_instructions(current_body, request_model.instructions)

    normalized_revised = normalize_markdown(revised_text)
    if not normalized_revised:
        raise_validation_error(
            message="Revised text must not be empty.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    diff_payload = compute_diff(normalize_markdown(current_body), normalized_revised)

    updated_front_matter = merge_front_matter(front_matter, request_model.unit.meta)
    updated_front_matter["id"] = request_model.unit_id

    persistence = DraftPersistence(settings=settings)
    target_path = project_root / "drafts" / f"{request_model.unit_id}.md"
    backup_path: Path | None = None
    try:
        if target_path.exists():
            backup_path = target_path.parent / f".{target_path.name}.{uuid4().hex}.bak"
            shutil.copyfile(target_path, backup_path)
        persistence.write_scene(request_model.project_id, updated_front_matter, normalized_revised)
    except OSError as exc:
        if backup_path and backup_path.exists():
            try:
                shutil.move(str(backup_path), str(target_path))
            except OSError:  # pragma: no cover - best effort restore
                pass
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Failed to persist rewritten scene.",
            details={"unit_id": request_model.unit_id, "error": str(exc)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Failed to persist rewritten scene.",
                "details": {"unit_id": request_model.unit_id},
            },
        ) from exc
    else:
        if backup_path and backup_path.exists():
            try:
                backup_path.unlink()
            except OSError:  # pragma: no cover - cleanup best effort
                pass

    return {
        "unit_id": request_model.unit_id,
        "revised_text": normalized_revised,
        "diff": {
            "added": diff_payload.added,
            "removed": diff_payload.removed,
            "changed": diff_payload.changed,
            "anchors": diff_payload.anchors,
        },
        "schema_version": "DraftUnitSchema v1",
        "model": {"name": "draft-rewriter-v1", "provider": "black-skies-local"},
    }


@router.post("/critique")
async def critique_draft(
    payload: dict[str, Any],
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    critique_service: CritiqueService = Depends(get_critique_service),
) -> dict[str, Any]:
    """Run a critique pass against the submitted draft unit."""

    try:
        request_model = DraftCritiqueRequest.model_validate(payload)
    except ValidationError as exc:
        raise_validation_error(
            message="Invalid draft critique request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        return await asyncio.to_thread(critique_service.run, request_model)
    except RuntimeError as exc:
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to produce critique.",
            details={"error": str(exc)},
            diagnostics=diagnostics,
            project_root=None,
        )


__all__ = ["rewrite_draft", "critique_draft"]
