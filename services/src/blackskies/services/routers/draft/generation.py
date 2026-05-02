"""Draft generation and preflight endpoints."""

from __future__ import annotations

import logging
from pathlib import Path
from time import perf_counter
from typing import Any

from fastapi import Depends, HTTPException, status
from pydantic import ValidationError

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...export import load_outline_artifact
from ...http import ensure_trace_id, raise_service_error, raise_validation_error
from ...models.draft import DraftGenerateRequest
from ...scene_docs import DraftRequestError
from ...service_errors import ServiceError
from ..dependencies import get_diagnostics, get_settings, get_model_router
from ...operations.draft_generation import (
    DraftGenerationService,
    DraftGenerationTimeoutError,
    resolve_requested_scenes,
)
from ...model_router import ModelRouter
from . import router
from ...e2e_mode import (
    allow_e2e_synthetic_mode,
    e2e_generate_response,
    e2e_preflight_response,
)

LOGGER = logging.getLogger(__name__)


def _preflight_log(trace_id: str, message: str, **details: Any) -> None:
    LOGGER.info("[preflight][%s] %s %s", trace_id, message, details)


@router.post("/generate")
async def generate_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    model_router: ModelRouter = Depends(get_model_router),
) -> dict[str, Any]:
    """Synthesize a draft by walking the outline and writing scene documents."""

    project_root: Path | None = None
    try:
        request_model = DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        _preflight_log(
            trace_id,
            "validation-error",
            error_count=len(exc.errors()),
        )
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        if isinstance(project_id, str):
            project_root = settings.project_base_dir / project_id
        raise_validation_error(
            message="Invalid draft generation request.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )

    resolved_project_root = settings.project_base_dir / request_model.project_id
    try:
        outline = load_outline_artifact(resolved_project_root)
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )

    if allow_e2e_synthetic_mode():
        return e2e_generate_response(
            project_root=resolved_project_root,
            project_id=request_model.project_id,
            unit_scope=request_model.unit_scope,
            unit_ids=request_model.unit_ids,
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

    generation_service = DraftGenerationService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=model_router,
    )
    try:
        result = await generation_service.generate(
            request_model,
            scene_summaries,
            project_root=resolved_project_root,
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except DraftGenerationTimeoutError as exc:
        diagnostics.log(
            resolved_project_root,
            code="TIMEOUT",
            message="Draft generation timed out.",
            details={"error": str(exc)},
        )
        raise_service_error(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="TIMEOUT",
            message="Draft generation timed out.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )
    except HTTPException:
        raise
    except ServiceError:
        raise
    except Exception as exc:  # pragma: no cover - surfaced via diagnostics
        diagnostics.log(
            resolved_project_root,
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
            project_root=resolved_project_root,
            cause=exc,
        )
    return result.response


@router.post("/preflight")
async def preflight_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    model_router: ModelRouter = Depends(get_model_router),
) -> dict[str, Any]:
    """Return metadata and budget projections for a prospective draft."""

    trace_id = ensure_trace_id()
    route_started = perf_counter()
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

    resolved_project_root = settings.project_base_dir / request_model.project_id
    _preflight_log(
        trace_id,
        "route-start",
        project_id=request_model.project_id,
        unit_scope=request_model.unit_scope.value,
        unit_count=len(request_model.unit_ids),
    )
    outline_started = perf_counter()
    try:
        outline = load_outline_artifact(resolved_project_root)
    except DraftRequestError as exc:
        _preflight_log(
            trace_id,
            "outline-load-error",
            duration_ms=round((perf_counter() - outline_started) * 1000, 2),
            project_id=request_model.project_id,
            error=str(exc),
        )
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )
    _preflight_log(
        trace_id,
        "outline-load",
        duration_ms=round((perf_counter() - outline_started) * 1000, 2),
        project_id=request_model.project_id,
        scene_count=len(outline.scenes),
        chapter_count=len(outline.chapters),
    )

    if allow_e2e_synthetic_mode():
        _preflight_log(
            trace_id,
            "synthetic-response",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
        )
        _preflight_log(
            trace_id,
            "route-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            scene_count=len(request_model.unit_ids),
        )
        return e2e_preflight_response(
            project_id=request_model.project_id,
            unit_scope=request_model.unit_scope,
            unit_ids=request_model.unit_ids,
        )

    validation_started = perf_counter()
    try:
        scene_summaries = resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        _preflight_log(
            trace_id,
            "scene-validation-error",
            duration_ms=round((perf_counter() - validation_started) * 1000, 2),
            project_id=request_model.project_id,
            error=str(exc),
        )
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    _preflight_log(
        trace_id,
        "scene-validation",
        duration_ms=round((perf_counter() - validation_started) * 1000, 2),
        project_id=request_model.project_id,
        scene_count=len(scene_summaries),
    )
    generation_service = DraftGenerationService(
        settings=settings,
        diagnostics=diagnostics,
        model_router=model_router,
    )
    service_started = perf_counter()
    try:
        result = await generation_service.preflight(
            request_model,
            scene_summaries,
            project_root=resolved_project_root,
        )
    except DraftRequestError as exc:
        _preflight_log(
            trace_id,
            "service-error",
            duration_ms=round((perf_counter() - service_started) * 1000, 2),
            project_id=request_model.project_id,
            error=str(exc),
        )
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except DraftGenerationTimeoutError as exc:
        _preflight_log(
            trace_id,
            "service-timeout",
            duration_ms=round((perf_counter() - service_started) * 1000, 2),
            project_id=request_model.project_id,
            error=str(exc),
        )
        diagnostics.log(
            resolved_project_root,
            code="TIMEOUT",
            message="Draft preflight timed out.",
            details={"error": str(exc)},
        )
        raise_service_error(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="TIMEOUT",
            message="Draft preflight timed out.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )
    except Exception as exc:  # pragma: no cover - surfaced via diagnostics
        _preflight_log(
            trace_id,
            "service-error",
            duration_ms=round((perf_counter() - service_started) * 1000, 2),
            project_id=request_model.project_id,
            error=str(exc),
        )
        diagnostics.log(
            resolved_project_root,
            code="INTERNAL",
            message="Draft preflight failed.",
            details={"error": str(exc)},
        )
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to compute draft preflight.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )

    _preflight_log(
        trace_id,
        "route-exit",
        duration_ms=round((perf_counter() - route_started) * 1000, 2),
        project_id=request_model.project_id,
        scene_count=len(scene_summaries),
    )
    return result.payload


__all__ = ["generate_draft", "preflight_draft"]
