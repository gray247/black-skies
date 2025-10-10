"""Outline-related API routes."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from ..config import ServiceSettings
from ..diagnostics import DiagnosticLogger
from ..http import default_error_responses
from ..models.wizard import OutlineBuildRequest
from ..outline_builder import MissingLocksError, OutlineBuilder
from ..persistence import OutlinePersistence
from .dependencies import get_build_tracker, get_diagnostics, get_settings

LOGGER = logging.getLogger(__name__)

__all__ = [
    "BuildInProgressError",
    "BuildTracker",
    "get_outline_builder",
    "get_persistence",
    "router",
]


class BuildInProgressError(RuntimeError):
    """Raised when attempting to launch a duplicate outline build."""


class BuildTracker:
    """Coordinate concurrent outline builds per project."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._active: set[str] = set()

    async def begin(self, project_id: str) -> None:
        async with self._lock:
            if project_id in self._active:
                raise BuildInProgressError(project_id)
            self._active.add(project_id)

    async def end(self, project_id: str) -> None:
        async with self._lock:
            self._active.discard(project_id)

    @asynccontextmanager
    async def track(self, project_id: str) -> AsyncIterator[None]:
        await self.begin(project_id)
        try:
            yield
        finally:
            await self.end(project_id)


def get_outline_builder() -> OutlineBuilder:
    """Provide an outline builder instance for request handling."""

    return OutlineBuilder()


def get_persistence(
    settings: ServiceSettings = Depends(get_settings),
) -> OutlinePersistence:
    """Resolve the outline persistence helper."""

    return OutlinePersistence(settings=settings)


router = APIRouter(
    prefix="/outline",
    tags=["outline"],
    responses=default_error_responses(),
)


@router.post("/build")
async def build_outline(
    request_model: OutlineBuildRequest,
    tracker: BuildTracker = Depends(get_build_tracker),
    builder: OutlineBuilder = Depends(get_outline_builder),
    persistence: OutlinePersistence = Depends(get_persistence),
    diagnostics: DiagnosticLogger = Depends(get_diagnostics),
) -> dict[str, object]:
    """Build and persist an outline for the requested project."""

    project_root = persistence.ensure_project_root(request_model.project_id)

    try:
        async with tracker.track(request_model.project_id):
            outline = builder.build(request_model)
            persistence.write_outline(request_model.project_id, outline)
            response_payload = outline.model_dump(mode="json")
    except BuildInProgressError as exc:
        LOGGER.warning("Outline build conflict for project %s", request_model.project_id)
        diagnostics.log(
            project_root,
            code="CONFLICT",
            message="Outline build already running.",
            details={"project_id": request_model.project_id},
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONFLICT",
                "message": "An outline build is already in progress for this project.",
                "details": {"project_id": request_model.project_id},
            },
        ) from exc
    except MissingLocksError as exc:
        LOGGER.warning("Outline build missing locks for project %s", request_model.project_id)
        diagnostics.log(
            project_root,
            code="VALIDATION",
            message=str(exc),
            details={"project_id": request_model.project_id, **exc.details},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION",
                "message": str(exc),
                "details": {"project_id": request_model.project_id, **exc.details},
            },
        ) from exc
    except ValidationError as exc:
        LOGGER.exception("Outline validation failed for project %s", request_model.project_id)
        diagnostics.log(
            project_root,
            code="VALIDATION",
            message="OutlineSchema validation failed.",
            details={
                "project_id": request_model.project_id,
                "errors": exc.errors(),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION",
                "message": "Generated outline failed schema validation.",
                "details": {"project_id": request_model.project_id},
            },
        ) from exc

    return response_payload
