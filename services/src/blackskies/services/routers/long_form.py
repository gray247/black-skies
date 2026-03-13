"""Long-form execution endpoints (internal)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import ValidationError

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import raise_validation_error
from ..model_router import ModelRouter
from ..models.long_form import LongFormExecuteRequest
from ..operations.long_form_execution import LongFormExecutionService
from .dependencies import get_diagnostics, get_model_router, get_settings

router = APIRouter(prefix="/long-form", tags=["long-form"])


def _chunk_to_dict(chunk) -> dict[str, Any]:
    return {
        "chunk_id": chunk.chunk_id,
        "chapter_id": chunk.chapter_id,
        "scene_ids": list(chunk.scene_ids),
        "order": chunk.order,
        "continuation_of": chunk.continuation_of,
        "prompt_fingerprint": chunk.prompt_fingerprint,
        "provider": chunk.provider,
        "model": chunk.model,
        "continuity_snapshot": chunk.continuity_snapshot,
        "budget_snapshot": chunk.budget_snapshot,
        "routing_snapshot": chunk.routing_snapshot,
    }


@router.post("/execute")
async def execute_long_form(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    model_router: ModelRouter = Depends(get_model_router),
) -> dict[str, Any]:
    """Execute a controlled long-form chunk sequence."""

    project_root: Path | None = None
    try:
        request_model = LongFormExecuteRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid long-form execution request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    project_root = settings.project_base_dir / request_model.project_id
    if not project_root.exists():
        raise_validation_error(
            message="Project not found.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    service = LongFormExecutionService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=model_router,
        enabled=request_model.enabled,
    )
    result = service.execute(
        project_root=project_root,
        chapter_id=request_model.chapter_id,
        scene_ids=request_model.scene_ids,
        chunk_size=request_model.chunk_size,
        target_words_per_chunk=request_model.target_words_per_chunk,
    )

    return {
        "project_id": request_model.project_id,
        "chapter_id": request_model.chapter_id,
        "chunks": [_chunk_to_dict(chunk) for chunk in result.chunks],
        "stopped_reason": result.stopped_reason,
        "budget_summary": result.budget_summary,
    }


__all__ = ["execute_long_form", "router"]
