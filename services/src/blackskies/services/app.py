"""FastAPI application factory for the Black Skies services."""

from __future__ import annotations

import logging
from contextvars import ContextVar
from typing import Awaitable, Callable, Final

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .budgeting import (
    HARD_BUDGET_LIMIT_USD,
    SOFT_BUDGET_LIMIT_USD,
    load_project_budget_state,
)
from .config import ServiceSettings
from .diagnostics import DiagnosticLogger
from .export import build_meta_header
from .http import (
    TRACE_ID_HEADER,
    default_error_responses,
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
from .routers.health import router as health_router
from .routers.outline import BuildInProgressError, BuildTracker
from .routers.recovery import RecoveryTracker
from .critique import CritiqueService

LOGGER = logging.getLogger(__name__)

SERVICE_VERSION: Final[str] = "1.0.0-rc1"


class TraceMiddleware:
    """ASGI middleware that applies trace IDs and unified error handling."""

    def __init__(self, app: ASGIApp, *, trace_context: ContextVar[str]) -> None:
        self.app = app
        self._trace_context = trace_context

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        trace_id = resolve_trace_id(request.headers.get(TRACE_ID_HEADER))
        token = self._trace_context.set(trace_id)
        scope.setdefault("state", {})
        scope["state"]["trace_id"] = trace_id  # type: ignore[index]

        status_holder: dict[str, int | None] = {"status": None}

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers.setdefault(TRACE_ID_HEADER, trace_id)
                status_holder["status"] = message.get("status")
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except HTTPException as exc:
            response = http_exception_to_response(exc, trace_id)
            status_holder["status"] = exc.status_code
            await response(scope, receive, send)
        except RequestValidationError as exc:
            response = request_validation_response(exc, trace_id)
            status_holder["status"] = status.HTTP_400_BAD_REQUEST
            await response(scope, receive, send)
        except Exception as exc:  # pragma: no cover - defensive guard
            LOGGER.exception(
                "Unhandled error processing %s %s",
                request.method,
                request.url.path,
                exc_info=exc,
            )
            response = internal_error_response(trace_id)
            status_holder["status"] = status.HTTP_500_INTERNAL_SERVER_ERROR
            await response(scope, receive, send)
        finally:
            self._trace_context.reset(token)
            status_code = status_holder["status"] or status.HTTP_500_INTERNAL_SERVER_ERROR
            record_request(request.method, status_code)

def create_app(settings: ServiceSettings | None = None) -> FastAPI:
    """Construct the FastAPI application."""

    application = FastAPI(
        title="Black Skies Services",
        version=SERVICE_VERSION,
        responses=default_error_responses(),
    )
    application.state.settings = settings or ServiceSettings.from_environment()
    application.state.build_tracker = BuildTracker()
    application.state.diagnostics = DiagnosticLogger()
    application.state.snapshot_persistence = SnapshotPersistence(
        settings=application.state.settings
    )
    application.state.recovery_tracker = RecoveryTracker(settings=application.state.settings)
    application.state.critique_service = CritiqueService()
    application.state.service_version = SERVICE_VERSION

    async def http_exception_handler(_: Request, exc: Exception) -> Response:
        trace_id = ensure_trace_id()
        if isinstance(exc, HTTPException):
            return http_exception_to_response(exc, trace_id)
        return internal_error_response(trace_id)

    async def validation_exception_handler(_: Request, exc: Exception) -> Response:
        trace_id = ensure_trace_id()
        if isinstance(exc, RequestValidationError):
            return request_validation_response(exc, trace_id)
        return internal_error_response(trace_id)

    application.add_exception_handler(HTTPException, http_exception_handler)
    application.add_exception_handler(RequestValidationError, validation_exception_handler)

    trace_context = get_trace_context()

    application.add_middleware(
        CORSMiddleware,
        # `allow_origin_regex` keeps local dev hosts while remaining compatible with Trio tests
        allow_origins=[],
        allow_origin_regex=r"^https?://(?:127\.0\.0\.1|localhost)(?::\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.add_middleware(
        TraceMiddleware,
        trace_context=trace_context,
    )

    application.include_router(health_router)
    application.include_router(api_router)

    @application.get("/", include_in_schema=False)
    async def service_index(request: Request) -> dict[str, str]:
        """Return a lightweight service manifest for manual probes."""

        version = getattr(request.app.state, "service_version", SERVICE_VERSION)
        return {
            "service": "black-skies",
            "version": version,
            "api_base": "/api/v1",
        }

    @application.get("/favicon.ico", include_in_schema=False)
    async def favicon_placeholder() -> Response:
        """Return an empty favicon response to avoid noisy 404s."""

        return Response(status_code=status.HTTP_204_NO_CONTENT)

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
    "build_meta_header",
    "load_project_budget_state",
]
