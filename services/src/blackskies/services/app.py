"""FastAPI application factory for the Black Skies services."""

from __future__ import annotations

import logging
from typing import Awaitable, Callable, Final

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .http import (
    TRACE_ID_HEADER,
    ensure_trace_id,
    get_trace_context,
    http_exception_to_response,
    internal_error_response,
    request_validation_response,
    resolve_trace_id,
)
from .metrics import record_request
from .persistence import SnapshotPersistence
from .routers import api_router
from .routers.draft import (
    HARD_BUDGET_LIMIT_USD,
    SOFT_BUDGET_LIMIT_USD,
    _build_meta_header,
    _load_project_budget_state,
)
from .routers.health import router as health_router
from .routers.outline import BuildInProgressError, BuildTracker
from .routers.recovery import RecoveryTracker

LOGGER = logging.getLogger(__name__)

SERVICE_VERSION: Final[str] = "0.1.0"


def create_app(settings: ServiceSettings | None = None) -> FastAPI:
    """Construct the FastAPI application."""

    application = FastAPI(title="Black Skies Services", version=SERVICE_VERSION)
    application.state.settings = settings or ServiceSettings.from_environment()
    application.state.build_tracker = BuildTracker()
    application.state.diagnostics = DiagnosticLogger()
    application.state.snapshot_persistence = SnapshotPersistence(
        settings=application.state.settings
    )
    application.state.recovery_tracker = RecoveryTracker(
        settings=application.state.settings
    )
    application.state.service_version = SERVICE_VERSION

    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        trace_id = ensure_trace_id()
        return http_exception_to_response(exc, trace_id)

    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        trace_id = ensure_trace_id()
        return request_validation_response(exc, trace_id)

    application.add_exception_handler(HTTPException, http_exception_handler)
    application.add_exception_handler(
        RequestValidationError, validation_exception_handler
    )

    trace_context = get_trace_context()

    @application.middleware("http")
    async def apply_trace_id(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Attach trace identifiers, metrics, and uniform error handling."""

        trace_id = resolve_trace_id(request.headers.get(TRACE_ID_HEADER))
        token = trace_context.set(trace_id)
        request.state.trace_id = trace_id  # type: ignore[attr-defined]

        try:
            response = await call_next(request)
        except HTTPException as exc:
            response = http_exception_to_response(exc, trace_id)
        except RequestValidationError as exc:
            response = request_validation_response(exc, trace_id)
        except Exception as exc:  # pragma: no cover - defensive guard
            LOGGER.exception(
                "Unhandled error processing %s %s",
                request.method,
                request.url.path,
                exc_info=exc,
            )
            response = internal_error_response(trace_id)
        finally:
            trace_context.reset(token)

        record_request(request.method, response.status_code)
        response.headers.setdefault(TRACE_ID_HEADER, trace_id)
        return response

    application.include_router(health_router)
    application.include_router(api_router)

    return application


app = create_app()

__all__ = [
    "app",
    "create_app",
    "SERVICE_VERSION",
    "SOFT_BUDGET_LIMIT_USD",
    "HARD_BUDGET_LIMIT_USD",
    "BuildTracker",
    "BuildInProgressError",
    "RecoveryTracker",
    "_build_meta_header",
    "_load_project_budget_state",
]

