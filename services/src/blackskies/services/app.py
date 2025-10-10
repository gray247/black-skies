"""FastAPI application factory for the Black Skies services."""

from __future__ import annotations

import logging
from typing import Any, Awaitable, Callable, Final, ParamSpec, TypeVar

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
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
from .outline_builder import OutlineBuilder
from .persistence import OutlinePersistence, SnapshotPersistence
from .routers import api_router
from .routers.draft import (
    HARD_BUDGET_LIMIT_USD,
    SOFT_BUDGET_LIMIT_USD,
    _build_meta_header,
    _load_project_budget_state,
    accept_draft,
    critique_draft,
    export_manuscript,
    generate_draft,
    preflight_draft,
    rewrite_draft,
)
from .routers.health import router as health_router
from .routers.outline import (
    BuildInProgressError,
    BuildTracker,
    build_outline,
    get_outline_builder,
    get_persistence as get_outline_persistence,
)
from .routers.recovery import RecoveryTracker, recovery_restore, recovery_status
from .routers.dependencies import (
    get_build_tracker,
    get_diagnostics,
    get_recovery_tracker,
    get_settings,
    get_snapshot_persistence,
)
from .models.wizard import OutlineBuildRequest
from .critique import CritiqueService

LOGGER = logging.getLogger(__name__)

SERVICE_VERSION: Final[str] = "1.0.0-rc1"

LEGACY_DEPRECATION_HEADER: Final[str] = "true"
LEGACY_SUNSET_HEADER: Final[str] = "Mon, 29 Sep 2025 00:00:00 GMT"


P = ParamSpec("P")
T = TypeVar("T")


def _resolve_active_trace_id(request: Request) -> str:
    """Return the trace identifier attached by the middleware."""

    trace_id = getattr(request.state, "trace_id", "")  # type: ignore[attr-defined]
    if trace_id:
        return trace_id
    header_trace = request.headers.get(TRACE_ID_HEADER)
    if header_trace:
        return header_trace
    return ensure_trace_id()


def _apply_legacy_headers(response: Response, trace_id: str) -> None:
    """Attach legacy sunset metadata to shim responses."""

    response.headers[TRACE_ID_HEADER] = trace_id
    response.headers["Deprecation"] = LEGACY_DEPRECATION_HEADER
    response.headers["Sunset"] = LEGACY_SUNSET_HEADER


def _apply_legacy_headers_to_exception(exc: HTTPException, trace_id: str) -> None:
    """Ensure error responses for shims include sunset metadata."""

    headers = dict(exc.headers or {})
    headers.setdefault(TRACE_ID_HEADER, trace_id)
    headers.setdefault("Deprecation", LEGACY_DEPRECATION_HEADER)
    headers.setdefault("Sunset", LEGACY_SUNSET_HEADER)
    exc.headers = headers


async def _legacy_alias(
    core: Callable[P, Awaitable[T]],
    *,
    request: Request,
    response: Response,
    args: P.args,
    kwargs: P.kwargs,
) -> T:
    """Execute a legacy shim endpoint with uniform header handling."""

    trace_id = _resolve_active_trace_id(request)
    try:
        result = await core(*args, **kwargs)
    except HTTPException as exc:
        _apply_legacy_headers_to_exception(exc, trace_id)
        raise
    _apply_legacy_headers(response, trace_id)
    return result


def create_app(settings: ServiceSettings | None = None) -> FastAPI:
    """Construct the FastAPI application."""

    application = FastAPI(title="Black Skies Services", version=SERVICE_VERSION)
    application.state.settings = settings or ServiceSettings.from_environment()
    application.state.build_tracker = BuildTracker()
    application.state.diagnostics = DiagnosticLogger()
    application.state.snapshot_persistence = SnapshotPersistence(
        settings=application.state.settings
    )
    application.state.recovery_tracker = RecoveryTracker(settings=application.state.settings)
    application.state.critique_service = CritiqueService()
    application.state.service_version = SERVICE_VERSION

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        trace_id = ensure_trace_id()
        return http_exception_to_response(exc, trace_id)

    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        trace_id = ensure_trace_id()
        return request_validation_response(exc, trace_id)

    application.add_exception_handler(HTTPException, http_exception_handler)
    application.add_exception_handler(RequestValidationError, validation_exception_handler)

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

    # TODO(P6.1): Remove legacy shim routes once the GUI migrates to /api/v1 paths.

    @application.post("/outline/build", include_in_schema=False)
    async def legacy_outline_build(
        request_model: OutlineBuildRequest,
        request: Request,
        response: Response,
        tracker: BuildTracker = Depends(get_build_tracker),
        builder: OutlineBuilder = Depends(get_outline_builder),
        persistence: OutlinePersistence = Depends(get_outline_persistence),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, object]:
        return await _legacy_alias(
            build_outline,
            request=request,
            response=response,
            args=(request_model,),
            kwargs={
                "tracker": tracker,
                "builder": builder,
                "persistence": persistence,
                "diagnostics": diagnostics,
            },
        )

    @application.post("/draft/generate", include_in_schema=False)
    async def legacy_draft_generate(
        payload: dict[str, Any],
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            generate_draft,
            request=request,
            response=response,
            args=(payload,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
            },
        )

    @application.post("/draft/preflight", include_in_schema=False)
    async def legacy_draft_preflight(
        payload: dict[str, Any],
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            preflight_draft,
            request=request,
            response=response,
            args=(payload,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
            },
        )

    @application.post("/draft/rewrite", include_in_schema=False)
    async def legacy_draft_rewrite(
        payload: dict[str, Any],
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            rewrite_draft,
            request=request,
            response=response,
            args=(payload,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
            },
        )

    @application.post("/draft/critique", include_in_schema=False)
    async def legacy_draft_critique(
        request: Request,
        response: Response,
    ) -> dict[str, Any]:
        return await _legacy_alias(
            critique_draft,
            request=request,
            response=response,
            args=(),
            kwargs={},
        )

    @application.post("/draft/accept", include_in_schema=False)
    async def legacy_draft_accept(
        payload: dict[str, Any],
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
        snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
        recovery_tracker: RecoveryTracker = Depends(get_recovery_tracker),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            accept_draft,
            request=request,
            response=response,
            args=(payload,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
                "snapshot_persistence": snapshot_persistence,
                "recovery_tracker": recovery_tracker,
            },
        )

    @application.post("/draft/export", include_in_schema=False)
    async def legacy_draft_export(
        payload: dict[str, Any],
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            export_manuscript,
            request=request,
            response=response,
            args=(payload,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
            },
        )

    @application.get("/draft/recovery", include_in_schema=False)
    async def legacy_recovery_status(
        project_id: str,
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
        recovery_tracker: RecoveryTracker = Depends(get_recovery_tracker),
        snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            recovery_status,
            request=request,
            response=response,
            args=(project_id,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
                "recovery_tracker": recovery_tracker,
                "snapshot_persistence": snapshot_persistence,
            },
        )

    @application.post("/draft/recovery/restore", include_in_schema=False)
    async def legacy_recovery_restore(
        payload: dict[str, Any],
        request: Request,
        response: Response,
        settings: ServiceSettings = Depends(get_settings),
        diagnostics: DiagnosticLogger = Depends(get_diagnostics),
        snapshot_persistence: SnapshotPersistence = Depends(get_snapshot_persistence),
        recovery_tracker: RecoveryTracker = Depends(get_recovery_tracker),
    ) -> dict[str, Any]:
        return await _legacy_alias(
            recovery_restore,
            request=request,
            response=response,
            args=(payload,),
            kwargs={
                "settings": settings,
                "diagnostics": diagnostics,
                "snapshot_persistence": snapshot_persistence,
                "recovery_tracker": recovery_tracker,
            },
        )

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
