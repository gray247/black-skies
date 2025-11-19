"""FastAPI application factory for the Black Skies services."""

from __future__ import annotations

import logging
from contextvars import ContextVar
from typing import Awaitable, Callable, Final

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .backup_verifier import BackupVerificationDaemon, BackupVerifierState
from .budgeting import load_project_budget_state
from .constants import DEFAULT_HARD_BUDGET_LIMIT_USD, DEFAULT_SOFT_BUDGET_LIMIT_USD
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
    build_error_payload,
)
from .middleware import BodySizeLimitMiddleware
from .metrics import record_request
from .persistence import SnapshotPersistence
from .routers import api_router
from .routers.health import router as health_router
from .routers.outline import BuildInProgressError, BuildTracker
from .routers.recovery import RecoveryTracker
from .critique import CritiqueService
from .resilience import ResiliencePolicy, ServiceResilienceRegistry
from .service_errors import ServiceError
from .scheduler import VerificationScheduler

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
        except ServiceError as exc:
            payload = build_error_payload(
                code=exc.code,
                message=exc.message,
                details=exc.details,
                trace_id=trace_id,
            )
            response = JSONResponse(
                status_code=exc.status_code,
                content=payload.model_dump(),
                headers={TRACE_ID_HEADER: trace_id},
            )
            status_holder["status"] = exc.status_code
            diagnostics = getattr(scope["app"].state, "diagnostics", None)
            if diagnostics and exc.project_root is not None:
                audit_details = dict(exc.details)
                audit_details.setdefault("method", request.method)
                audit_details.setdefault("path", str(request.url.path))
                audit_details.setdefault("trace_id", trace_id)
                diagnostics.log(
                    exc.project_root,
                    code=exc.code,
                    message=exc.message,
                    details=audit_details,
                )
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

    service_settings = settings or ServiceSettings.from_environment()

    application = FastAPI(
        title="Black Skies Services",
        version=SERVICE_VERSION,
        responses=default_error_responses(),
    )
    application.state.settings = service_settings
    application.state.build_tracker = BuildTracker()
    application.state.diagnostics = DiagnosticLogger()
    application.state.snapshot_persistence = SnapshotPersistence(
        settings=application.state.settings
    )
    application.state.recovery_tracker = RecoveryTracker(settings=application.state.settings)
    application.state.critique_service = CritiqueService()
    application.state.service_version = SERVICE_VERSION
    resilience_state_dir = service_settings.project_base_dir / "_runtime" / "resilience"
    application.state.resilience_registry = ServiceResilienceRegistry(
        {
            "critique": ResiliencePolicy(
                name="critique",
                timeout_seconds=float(service_settings.critique_task_timeout_seconds),
                max_attempts=max(1, int(service_settings.critique_task_retry_attempts) + 1),
                backoff_seconds=0.5,
                circuit_failure_threshold=int(service_settings.critique_circuit_failure_threshold),
                circuit_reset_seconds=float(service_settings.critique_circuit_reset_seconds),
            ),
            "analytics": ResiliencePolicy(
                name="analytics",
                timeout_seconds=float(service_settings.analytics_task_timeout_seconds),
                max_attempts=max(1, int(service_settings.analytics_task_retry_attempts) + 1),
                backoff_seconds=0.5,
                circuit_failure_threshold=int(service_settings.analytics_circuit_failure_threshold),
                circuit_reset_seconds=float(service_settings.analytics_circuit_reset_seconds),
            ),
        },
        state_dir=resilience_state_dir,
    )

    if service_settings.backup_verifier_enabled:
        backup_verifier = BackupVerificationDaemon(
            settings=application.state.settings,
            diagnostics=application.state.diagnostics,
        )
        application.state.backup_verifier = backup_verifier
        application.state.backup_verifier_state = backup_verifier.state

        async def _start_backup_verifier() -> None:
            await backup_verifier.start()

        async def _stop_backup_verifier() -> None:
            await backup_verifier.stop()

        application.add_event_handler("startup", _start_backup_verifier)
        application.add_event_handler("shutdown", _stop_backup_verifier)
    else:
        application.state.backup_verifier = None
        application.state.backup_verifier_state = BackupVerifierState(
            enabled=False,
            status="warning",
            message="Backup verifier disabled by configuration.",
        )

    scheduler = VerificationScheduler(settings=application.state.settings)
    application.state.verification_scheduler = scheduler

    async def _start_scheduler() -> None:
        scheduler.start()

    async def _stop_scheduler() -> None:
        scheduler.shutdown()

    application.add_event_handler("startup", _start_scheduler)
    application.add_event_handler("shutdown", _stop_scheduler)

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
        BodySizeLimitMiddleware,
        limit=service_settings.max_request_body_bytes,
    )

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


# --- dev wrapper to add near the module-level app creation (paste where app = create_app() currently occurs) ---
# Dev: clearer create_app startup errors (safe, reversible)
import traceback, sys, logging
logger = logging.getLogger(__name__)

try:
    # prefer create_app() if present, otherwise use existing app object if defined earlier
    if "create_app" in globals():
        app = create_app()
    else:
        app = globals().get("app", None)
except Exception:
    # Print to console and re-raise so uvicorn shows the traceback
    logger.exception("CREATE_APP FAILED: Backend failed to initialize. Run services/tools/check_startup.py for details.")
    print("CREATE_APP FAILED — check services/tools/check_startup.py for details")
    traceback.print_exc()
    raise
# --- end patch ---


__all__ = [
    "app",
    "create_app",
    "DEFAULT_SOFT_BUDGET_LIMIT_USD",
    "DEFAULT_HARD_BUDGET_LIMIT_USD",
    "BuildTracker",
    "BuildInProgressError",
    "RecoveryTracker",
    "build_meta_header",
    "load_project_budget_state",
]
