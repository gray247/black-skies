"""Business logic for draft generation."""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Sequence

from fastapi import HTTPException, status

from .models.draft import DraftGenerateRequest
from .project_repository import ProjectRepository, SceneSummary
from .settings import ServiceSettings
from .synthesizer import SynthesizedScene, derive_unit_seed, synthesize_scene

LOGGER = logging.getLogger(__name__)


def generate_draft_payload(request: DraftGenerateRequest, settings: ServiceSettings) -> dict[str, Any]:
    """Generate draft units and write scene files to disk."""

    repository = ProjectRepository.from_settings(settings, request.project_id)
    project = repository.data

    if request.unit_scope == "scene":
        scene_summaries = project.outline.scenes_for_ids(request.unit_ids)
    else:
        chapter_id = request.unit_ids[0]
        scene_summaries = project.outline.scenes_for_chapter(chapter_id)
        if not scene_summaries:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION",
                    "message": "Requested chapter does not contain any scenes.",
                    "details": {"chapter_id": chapter_id},
                },
            )

    units = [
        _generate_unit(repository, summary, request, settings)
        for summary in scene_summaries
    ]

    draft_id = _derive_draft_id(
        project.metadata.project_id,
        [summary.id for summary in scene_summaries],
        request.seed,
        request.temperature,
    )

    payload: dict[str, Any] = {
        "draft_id": draft_id,
        "schema_version": "DraftUnitSchema v1",
        "units": units,
        "budget": {"estimated_usd": 0.0},
    }
    LOGGER.info(
        "Generated draft payload for project %s with %d units", request.project_id, len(scene_summaries)
    )
    return payload


def _generate_unit(
    repository: ProjectRepository,
    summary: SceneSummary,
    request: DraftGenerateRequest,
    settings: ServiceSettings,
) -> dict[str, Any]:
    project = repository.data
    derived_seed = derive_unit_seed(project.metadata.project_id, summary.id, request.seed)
    synthesized: SynthesizedScene = synthesize_scene(
        project,
        summary,
        derived_seed,
        request.temperature,
    )
    repository.write_scene(summary, synthesized.meta, synthesized.body)

    unit_payload: dict[str, Any] = {
        "id": summary.id,
        "text": synthesized.body,
        "meta": {
            "pov": synthesized.meta.pov,
            "purpose": synthesized.meta.purpose,
            "emotion_tag": synthesized.meta.emotion_tag,
            "word_target": synthesized.meta.word_target,
        },
        "prompt_fingerprint": _build_prompt_fingerprint(
            project.metadata.project_id,
            summary.id,
            derived_seed,
            request.temperature,
        ),
        "model": {"name": settings.model_name, "provider": settings.model_provider},
        "seed": derived_seed,
    }
    return unit_payload


def _build_prompt_fingerprint(
    project_id: str,
    scene_id: str,
    derived_seed: int,
    temperature: float | None,
) -> str:
    payload = {
        "project_id": project_id,
        "scene_id": scene_id,
        "seed": derived_seed,
        "temperature": temperature,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def _derive_draft_id(
    project_id: str,
    scene_ids: Sequence[str],
    request_seed: int | None,
    temperature: float | None,
) -> str:
    payload = {
        "project_id": project_id,
        "scene_ids": list(scene_ids),
        "seed": request_seed,
        "temperature": temperature,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"dr_{digest[:8]}"


__all__ = ["generate_draft_payload"]
