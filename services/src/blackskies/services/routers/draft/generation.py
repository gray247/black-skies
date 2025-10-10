"""Draft generation and preflight endpoints."""

from __future__ import annotations

import asyncio
import copy
import hashlib
import json
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import Depends
from pydantic import ValidationError

from ...budgeting import classify_budget, load_project_budget_state, persist_project_budget
from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...draft_synthesizer import DraftSynthesizer
from ...export import load_outline_artifact
from ...http import raise_budget_error, raise_validation_error
from ...models.draft import DraftGenerateRequest, DraftUnitOverrides, DraftUnitScope
from ...models.outline import OutlineArtifact, OutlineScene
from ...persistence import DraftPersistence
from ...scene_docs import DraftRequestError
from ..dependencies import get_diagnostics, get_settings
from . import router


def _resolve_requested_scenes(
    request_model: DraftGenerateRequest, outline: OutlineArtifact
) -> list[OutlineScene]:
    scenes_by_id = {scene.id: scene for scene in outline.scenes}

    if request_model.unit_scope is DraftUnitScope.SCENE:
        missing = [scene_id for scene_id in request_model.unit_ids if scene_id not in scenes_by_id]
        if missing:
            raise DraftRequestError(
                "One or more scene IDs are not present in the outline.",
                {"missing_scene_ids": missing},
            )
        return [scenes_by_id[scene_id] for scene_id in request_model.unit_ids]

    chapter_id = request_model.unit_ids[0]
    chapter_ids = {chapter.id for chapter in outline.chapters}
    if chapter_id not in chapter_ids:
        raise DraftRequestError(
            "Requested chapter is not present in the outline.",
            {"chapter_id": chapter_id},
        )

    scenes = [scene for scene in outline.scenes if scene.chapter_id == chapter_id]
    if not scenes:
        raise DraftRequestError(
            "Requested chapter does not contain any scenes.",
            {"chapter_id": chapter_id},
        )
    return scenes


def _estimate_word_target(scene: OutlineScene, overrides: DraftUnitOverrides | None) -> int:
    if overrides and overrides.word_target is not None:
        return overrides.word_target
    order_value = overrides.order if overrides and overrides.order is not None else scene.order
    return 850 + (order_value * 40)


def _fingerprint_generate_request(
    request: DraftGenerateRequest, scenes: list[OutlineScene]
) -> str:
    request_payload = request.model_dump(mode="json")
    overrides_payload = request_payload.get("overrides", {})
    if isinstance(overrides_payload, dict):
        sorted_overrides: dict[str, Any] = {}
        for key in sorted(overrides_payload.keys()):
            sorted_overrides[key] = overrides_payload[key]
        request_payload["overrides"] = sorted_overrides

    fingerprint_source = {
        "request": request_payload,
        "scenes": [scene.model_dump(mode="json") for scene in scenes],
    }
    serialized = json.dumps(fingerprint_source, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


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
        scene_summaries = _resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )

    budget_state = load_project_budget_state(project_root, diagnostics)
    budget_meta = budget_state.metadata.setdefault("budget", {})

    request_fingerprint = _fingerprint_generate_request(request_model, scene_summaries)
    cached_response = budget_meta.get("last_generate_response")
    if budget_meta.get("last_request_fingerprint") == request_fingerprint and isinstance(
        cached_response, dict
    ):
        return copy.deepcopy(cached_response)

    total_words = 0
    for scene in scene_summaries:
        overrides = request_model.overrides.get(scene.id)
        total_words += _estimate_word_target(scene, overrides)

    estimated_cost = round((total_words / 1000) * 0.02, 2)
    status_label, message, total_after = classify_budget(
        estimated_cost,
        soft_limit=budget_state.soft_limit,
        hard_limit=budget_state.hard_limit,
        current_spend=budget_state.spent_usd,
    )

    if status_label == "blocked":
        raise_budget_error(
            message=message,
            details={
                "estimated_usd": estimated_cost,
                "total_after_usd": total_after,
                "hard_limit_usd": budget_state.hard_limit,
                "soft_limit_usd": budget_state.soft_limit,
                "spent_usd": budget_state.spent_usd,
            },
            diagnostics=diagnostics,
            project_root=project_root,
        )

    def _execute_generation() -> dict[str, Any]:
        synthesizer = DraftSynthesizer()
        persistence = DraftPersistence(settings=settings)
        units: list[dict[str, Any]] = []
        for index, scene in enumerate(scene_summaries):
            overrides = request_model.overrides.get(scene.id)
            synthesis = synthesizer.synthesize(
                request=request_model,
                scene=scene,
                overrides=overrides,
                unit_index=index,
            )
            persistence.write_scene(
                request_model.project_id,
                synthesis.front_matter,
                synthesis.body,
            )
            units.append(synthesis.unit)

        draft_id = f"dr_{uuid4().hex[:8]}"

        response_payload = {
            "project_id": request_model.project_id,
            "unit_scope": request_model.unit_scope.value,
            "unit_ids": request_model.unit_ids,
            "draft_id": draft_id,
            "schema_version": "DraftUnitSchema v1",
            "units": units,
            "budget": {
                "estimated_usd": estimated_cost,
                "status": status_label,
                "message": message,
                "soft_limit_usd": round(budget_state.soft_limit, 2),
                "hard_limit_usd": round(budget_state.hard_limit, 2),
                "spent_usd": round(total_after, 2),
                "total_after_usd": round(total_after, 2),
            },
        }

        budget_meta["last_request_fingerprint"] = request_fingerprint
        budget_meta["last_generate_response"] = copy.deepcopy(response_payload)

        persist_project_budget(budget_state, total_after)

        return response_payload

    response_payload = await asyncio.to_thread(_execute_generation)
    return response_payload


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
        scene_summaries = _resolve_requested_scenes(request_model, outline)
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
        total_words += _estimate_word_target(scene, overrides)

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
