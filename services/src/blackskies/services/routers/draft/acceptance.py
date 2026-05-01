"""Draft acceptance endpoint leveraging the service layer."""

from __future__ import annotations

from typing import Any
from time import perf_counter

from fastapi import Depends, HTTPException, status
from pydantic import ValidationError

from ...config import ServiceSettings
from ...diagnostics import DiagnosticLogger
from ...export import merge_front_matter, normalize_markdown
from ...http import (
    raise_conflict_error,
    raise_filesystem_error,
    raise_service_error,
    raise_validation_error,
)
from ...models.accept import DraftAcceptRequest
from ...persistence import SnapshotPersistence
from ...scene_docs import DraftRequestError, read_scene_document
from ...snapshots import SnapshotPersistenceError, log_accept_timing_snapshot
from ..dependencies import (
    get_diagnostics,
    get_recovery_tracker,
    get_settings,
    get_snapshot_persistence,
)
from . import router
from .common import _compute_sha256, normalize_submitted_scene_body
from ...operations.draft_accept import (
    DraftAcceptService,
    DraftAcceptancePersistenceError,
)


@router.post("/accept")
async def accept_draft(
    payload: dict[str, Any],
    settings: ServiceSettings = Depends(get_settings),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
    recovery_tracker=Depends(get_recovery_tracker),
) -> dict[str, Any]:
    """Persist an accepted draft unit and snapshot the project state."""

    request_started = perf_counter()
    timings: dict[str, float] = {}

    validation_started = perf_counter()
    try:
        request_model = DraftAcceptRequest.model_validate(payload)
    except ValidationError as exc:
        project_id = payload.get("project_id") if isinstance(payload, dict) else None
        project_root = (
            settings.project_base_dir / project_id if isinstance(project_id, str) else None
        )
        raise_validation_error(
            message="Invalid accept payload.",
            details={"errors": exc.errors()},
            diagnostics=diagnostics,
            project_root=project_root,
        )
    timings["request_validation_ms"] = (perf_counter() - validation_started) * 1000.0

    lookup_started = perf_counter()
    resolved_project_root = settings.project_base_dir / request_model.project_id
    if not resolved_project_root.exists():
        raise_validation_error(
            message="Project root is missing.",
            details={"project_id": request_model.project_id},
            diagnostics=diagnostics,
            project_root=None,
        )

    try:
        _, front_matter, current_body = read_scene_document(
            resolved_project_root, request_model.unit_id
        )
    except DraftRequestError as exc:
        raise_validation_error(
            message=str(exc),
            details=exc.details,
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )

    current_normalized = normalize_markdown(current_body)
    current_digest = _compute_sha256(current_body)
    if current_digest != request_model.unit.previous_sha256:
        raise_conflict_error(
            message="The submitted draft unit is out of date.",
            details={"unit_id": request_model.unit_id},
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )
    timings["draft_lookup_ms"] = (perf_counter() - lookup_started) * 1000.0

    recovery_tracker.mark_in_progress(
        request_model.project_id,
        unit_id=request_model.unit_id,
        draft_id=request_model.draft_id,
        message=request_model.message,
    )

    updated_front_matter = merge_front_matter(front_matter, request_model.unit.meta)
    updated_front_matter["id"] = request_model.unit_id
    normalized_text = normalize_submitted_scene_body(request_model.unit.text)

    accept_service = DraftAcceptService(
        settings=settings,
        diagnostics=diagnostics,
        snapshot_persistence=snapshot_persistence,
        recovery_tracker=recovery_tracker,
    )

    accept_started = perf_counter()
    try:
        acceptance = await accept_service.accept(
            request=request_model,
            project_root=resolved_project_root,
            updated_front_matter=updated_front_matter,
            normalized_text=normalized_text,
            current_normalized=current_normalized,
        )
    except DraftAcceptancePersistenceError as exc:
        original_error = getattr(exc, "original_exc", None)
        if isinstance(original_error, OSError):
            raise_filesystem_error(
                original_error,
                message="Failed to persist accepted scene.",
                details={"unit_id": exc.unit_id},
                diagnostics=diagnostics,
                project_root=resolved_project_root,
            )
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to persist accepted scene.",
            details={"unit_id": exc.unit_id, "error": exc.error},
            diagnostics=diagnostics,
            project_root=resolved_project_root,
        )
    except SnapshotPersistenceError as exc:
        diagnostics.log(
            resolved_project_root,
            code="CONFLICT",
            message=str(exc),
            details=exc.details or {"project_id": request_model.project_id},
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": str(exc),
                "details": exc.details,
            },
        ) from exc
    except Exception as exc:  # pragma: no cover - defensive logging for unexpected failures
        diagnostics.log(
            resolved_project_root,
            code="INTERNAL",
            message="Draft accept pipeline raised an unexpected error.",
            details={"error": str(exc), "unit_id": request_model.unit_id},
        )
        raise_service_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL",
            message="Failed to accept draft unit.",
            details={"unit_id": request_model.unit_id, "error": str(exc)},
            diagnostics=diagnostics,
            project_root=resolved_project_root,
            cause=exc,
        )

    timings.update(acceptance.timings)
    timings["accept_apply_ms"] = timings.get(
        "accept_apply_ms",
        (perf_counter() - accept_started) * 1000.0,
    )
    timings["total_ms"] = (perf_counter() - request_started) * 1000.0
    snapshot_info = acceptance.response.get("snapshot")
    snapshot_id = snapshot_info.get("snapshot_id") if isinstance(snapshot_info, dict) else None
    log_accept_timing_snapshot(
        project_id=request_model.project_id,
        unit_id=request_model.unit_id,
        draft_id=request_model.draft_id,
        snapshot_id=snapshot_id if isinstance(snapshot_id, str) else None,
        timings=timings,
    )

    return acceptance.response


__all__ = ["accept_draft"]
