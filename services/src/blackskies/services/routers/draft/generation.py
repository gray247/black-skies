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
from ...service_errors import ServiceError
from ..dependencies import get_diagnostics, get_settings
from ...operations.draft_generation import (
    DraftGenerationService,
    DraftGenerationTimeoutError,
    resolve_requested_scenes,
)
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
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=project_root,
        )
    except DraftGenerationTimeoutError as exc:
        diagnostics.log(
            project_root,
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
            project_root=project_root,
        )
    except HTTPException:
        raise
    except ServiceError:
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

    generation_service = DraftGenerationService(settings=settings, diagnostics=diagnostics)
    try:
        result = await generation_service.preflight(
            request_model,
            scene_summaries,
            project_root=project_root,
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
            project_root,
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
            project_root=project_root,
        )
    except Exception as exc:  # pragma: no cover - surfaced via diagnostics
        diagnostics.log(
            project_root,
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
            project_root=project_root,
        )

    return result.payload


__all__ = ["generate_draft", "preflight_draft"]
