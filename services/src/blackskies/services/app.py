"""FastAPI application object for the Black Skies service stack."""

from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from importlib import resources
from typing import Any, AsyncIterator, Final, cast

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, status
from pydantic import ValidationError

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .models.wizard import OutlineBuildRequest
from .outline_builder import MissingLocksError, OutlineBuilder
from .persistence import OutlinePersistence

LOGGER = logging.getLogger(__name__)

SERVICE_VERSION: Final[str] = "0.1.0"
_FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"


def _load_fixture(name: str) -> dict[str, Any]:
    """Load a JSON fixture bundled with the package."""

    try:
        fixture_path = resources.files(_FIXTURE_PACKAGE).joinpath(name)
    except (FileNotFoundError, ModuleNotFoundError) as exc:  # pragma: no cover - importlib guards
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture namespace is unavailable.",
                "details": {"fixture": name},
            },
        ) from exc

    try:
        with fixture_path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        LOGGER.exception("Fixture %s is missing", name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture not found.",
                "details": {"fixture": name},
            },
        ) from exc
    except json.JSONDecodeError as exc:
        LOGGER.exception("Fixture %s contains invalid JSON", name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "INTERNAL",
                "message": "Fixture data is invalid JSON.",
                "details": {"fixture": name},
            },
        ) from exc


class BuildInProgressError(RuntimeError):
    """Raised when a project already has an active outline build."""

    def __init__(self, project_id: str) -> None:
        super().__init__(f"Outline build already running for project {project_id}.")
        self.project_id = project_id


class BuildTracker:
    """Coordinate outline build concurrency per project."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._active: set[str] = set()

    async def begin(self, project_id: str) -> None:
        """Mark a project as actively building an outline."""

        async with self._lock:
            if project_id in self._active:
                raise BuildInProgressError(project_id)
            self._active.add(project_id)

    async def end(self, project_id: str) -> None:
        """Release an outline build reservation for the project."""

        async with self._lock:
            self._active.discard(project_id)

    @asynccontextmanager
    async def track(self, project_id: str) -> AsyncIterator[None]:
        """Async context manager for outline build reservations."""

        await self.begin(project_id)
        try:
            yield
        finally:
            await self.end(project_id)


def get_settings(request: Request) -> ServiceSettings:
    """Retrieve the shared service settings from the FastAPI app state."""

    return cast(ServiceSettings, request.app.state.settings)


def get_build_tracker(request: Request) -> BuildTracker:
    """Retrieve the build tracker from app state."""

    return cast(BuildTracker, request.app.state.build_tracker)


def get_diagnostics(request: Request) -> DiagnosticLogger:
    """Retrieve the diagnostic logger from app state."""

    return cast(DiagnosticLogger, request.app.state.diagnostics)


def get_outline_builder() -> OutlineBuilder:
    """Provide an outline builder instance."""

    return OutlineBuilder()


def get_persistence(settings: ServiceSettings = Depends(get_settings)) -> OutlinePersistence:
    """Provide an outline persistence helper bound to the current settings."""

    return OutlinePersistence(settings=settings)


def _register_routes(api: FastAPI) -> None:
    """Attach all routers to the provided FastAPI app."""

    @api.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        """Simple readiness probe for the desktop app."""

        return {"status": "ok", "version": SERVICE_VERSION}

    outline_router = APIRouter(prefix="/outline", tags=["outline"])

    @outline_router.post("/build")
    async def build_outline(
        request_model: OutlineBuildRequest,
        tracker: BuildTracker = Depends(get_build_tracker),
        builder: OutlineBuilder = Depends(get_outline_builder),
        persistence: OutlinePersistence = Depends(get_persistence),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        """Build, validate, and persist an outline artifact."""

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
                details={"project_id": request_model.project_id, "errors": exc.errors()},
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

    api.include_router(outline_router)

    draft_router = APIRouter(prefix="/draft", tags=["draft"])

    @draft_router.post("/generate")
    async def generate_draft() -> dict[str, Any]:
        """Return a stubbed draft generation response."""

        return _load_fixture("draft_generate.json")

    @draft_router.post("/rewrite")
    async def rewrite_draft() -> dict[str, Any]:
        """Return a stubbed draft rewrite response."""

        return _load_fixture("draft_rewrite.json")

    @draft_router.post("/critique")
    async def critique_draft() -> dict[str, Any]:
        """Return a stubbed draft critique response."""

        return _load_fixture("draft_critique.json")

    api.include_router(draft_router)


def create_app(settings: ServiceSettings | None = None) -> FastAPI:
    """Construct the FastAPI application."""

    application = FastAPI(title="Black Skies Services", version=SERVICE_VERSION)
    application.state.settings = settings or ServiceSettings.from_environment()
    application.state.build_tracker = BuildTracker()
    application.state.diagnostics = DiagnosticLogger()
    _register_routes(application)
    return application


app = create_app()

__all__ = [
    "app",
    "create_app",
    "SERVICE_VERSION",
    "BuildTracker",
    "BuildInProgressError",
]
