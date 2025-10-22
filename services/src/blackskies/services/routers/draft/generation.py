"""Draft generation and preflight endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import Depends, HTTPException, status
from pydantic import ValidationError

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...export import load_outline_artifact
from ...http import raise_service_error, raise_validation_error
from ...models.draft import DraftGenerateRequest
from ...scene_docs import DraftRequestError
from ..dependencies import get_diagnostics, get_settings
from ...operations.draft_generation import (
    DraftGenerationService,
    estimate_word_target,
    resolve_requested_scenes,
)
from ...draft_synthesizer import DraftSynthesizer
from ...budgeting import classify_budget, load_project_budget_state
from . import router


@router.post("/generate")
async def generate_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Synthesize a draft by walking the outline and writing scene documents."""

    project_root: Path | None = None
    try:
        request_model = DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft generation request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
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
        scene_summaries = resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    generation_service = DraftGenerationService(settings=settings, diagnostics=diagnostics)
    try:
        result = await generation_service.generate(
            request_model,
            scene_summaries,
            project_root=project_root,
        )
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - surfaced via diagnostics
        diagnostics.log(
            project_root,
            code="INTERNAL",
            message="Draft generation failed.",
            details={"error": str(exc)},
        )
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to generate draft units.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )
    return result.response


@router.post("/preflight")
async def preflight_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, Any]:
    """Return metadata and budget projections for a prospective draft."""

    project_root: Path | None = None
    try:
        request_model = DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft preflight request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
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
        scene_summaries = resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    budget_state = load_project_budget_state(project_root, diagnostics)

    total_words = 0
    for scene in scene_summaries:
        overrides = request_model.overrides.get(scene.id)
        total_words += estimate_word_target(scene, overrides)

    estimated_cost = round((total_words / 1000) * 0.02, 2)
    status_label, message, total_after = classify_budget(
        estimated_cost,
        soft_limit=budget_state.soft_limit,
        hard_limit=budget_state.hard_limit,
        current_spend=budget_state.spent_usd,
    )

    synthesizer = DraftSynthesizer()
    scenes_payload: list[dict[str, Any]] = []
    for scene in scene_summaries:
        scene_payload: dict[str, Any] = {
            "id": scene.id,
            "title": scene.title,
            "order": scene.order,
        }
        if scene.chapter_id is not None:
            scene_payload["chapter_id"] = scene.chapter_id
        if scene.beat_refs:
            scene_payload["beat_refs"] = list(scene.beat_refs)
        scenes_payload.append(scene_payload)

    return {
        "project_id": request_model.project_id,
        "unit_scope": request_model.unit_scope.value,
        "unit_ids": request_model.unit_ids,
        "model": dict(synthesizer._MODEL),
        "scenes": scenes_payload,
        "budget": {
            "estimated_usd": estimated_cost,
            "status": status_label,
            "message": message,
            "soft_limit_usd": round(budget_state.soft_limit, 2),
            "hard_limit_usd": round(budget_state.hard_limit, 2),
            "spent_usd": round(budget_state.spent_usd, 2),
            "total_after_usd": round(total_after, 2),
        },
    }


__all__ = ["generate_draft", "preflight_draft"]
