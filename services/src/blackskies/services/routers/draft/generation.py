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
    DraftGenerationProviderTimeoutError,
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


def _generate_log(trace_id: str, message: str, **details: Any) -> None:
    LOGGER.info("[draft-generate][%s] draft-generate:%s %s", trace_id, message, details)


@router.post("/generate")
async def generate_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    model_router: ModelRouter = Depends(get_model_router),
) -> dict[str, Any]:
    """Synthesize a draft by walking the outline and writing scene documents."""

    trace_id = ensure_trace_id()
    route_started = perf_counter()
    project_root: Path | None = None
    if isinstance(payload, dict):
        unit_ids_value = payload.get("unit_ids")
        _generate_log(
            trace_id,
            "route-enter",
            payload_keys=sorted(str(key) for key in payload.keys()),
            has_project_id=isinstance(payload.get("project_id"), str),
            unit_ids_count=len(unit_ids_value) if isinstance(unit_ids_value, list) else None,
        )
    else:
        _generate_log(trace_id, "route-enter", payload_type=type(payload).__name__)
    try:
        request_model = DraftGenerateRequest.model_validate(payload)
    except ValidationError as exc:
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            phase="validation",
            error_count=len(exc.errors()),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            status="error",
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
    _generate_log(
        trace_id,
        "backend-enter",
        project_id=request_model.project_id,
        unit_scope=request_model.unit_scope.value,
        unit_count=len(request_model.unit_ids),
    )
    _generate_log(
        trace_id,
        "request-validated",
        project_id=request_model.project_id,
        unit_scope=request_model.unit_scope.value,
        unit_count=len(request_model.unit_ids),
    )
    try:
        outline = load_outline_artifact(resolved_project_root)
    except DraftRequestError as exc:
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="outline-load",
            error=str(exc),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )

    if allow_e2e_synthetic_mode():
        response = e2e_generate_response(
            project_root=resolved_project_root,
            project_id=request_model.project_id,
            unit_scope=request_model.unit_scope,
            unit_ids=request_model.unit_ids,
        )
        _generate_log(
            trace_id,
            "response",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            unit_count=len(request_model.unit_ids),
            draft_id=response.get("draft_id"),
            mode="synthetic",
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            unit_count=len(request_model.unit_ids),
            status="ok",
            mode="synthetic",
        )
        return response

    try:
        scene_summaries = resolve_requested_scenes(request_model, outline)
    except DraftRequestError as exc:
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="scene-validation",
            error=str(exc),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
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
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="service",
            error=str(exc),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except DraftGenerationTimeoutError as exc:
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="service-timeout",
            error=str(exc),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
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
    except DraftGenerationProviderTimeoutError as exc:
        route_decision = getattr(generation_service, "_last_route", None)
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="provider-timeout",
            error=str(exc),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
        diagnostics.log(
            resolved_project_root,
            code="PROVIDER_TIMEOUT",
            message="Draft provider timed out.",
            details={"error": str(exc)},
        )
        raise_service_error(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="PROVIDER_TIMEOUT",
            message="Provider/model timed out.",
            details={
                "project_id": request_model.project_id,
                "provider": route_decision.provider if route_decision else None,
                "model": route_decision.model.name if route_decision else None,
            },
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )
    except HTTPException:
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="http-exception",
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
        raise
    except ServiceError:
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="service-error",
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
        raise
    except Exception as exc:  # pragma: no cover - surfaced via diagnostics
        _generate_log(
            trace_id,
            "backend-error",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            phase="internal",
            error=str(exc),
        )
        _generate_log(
            trace_id,
            "backend-exit",
            duration_ms=round((perf_counter() - route_started) * 1000, 2),
            project_id=request_model.project_id,
            status="error",
        )
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
    _generate_log(
        trace_id,
        "draft-assembly",
        project_id=request_model.project_id,
        unit_count=len(scene_summaries),
        draft_id=result.response.get("draft_id"),
    )
    _generate_log(
        trace_id,
        "response",
        duration_ms=round((perf_counter() - route_started) * 1000, 2),
        project_id=request_model.project_id,
        unit_count=len(scene_summaries),
        draft_id=result.response.get("draft_id"),
    )
    _generate_log(
        trace_id,
        "backend-exit",
        duration_ms=round((perf_counter() - route_started) * 1000, 2),
        project_id=request_model.project_id,
        unit_count=len(scene_summaries),
        status="ok",
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
