"""HTTP utilities shared across the Black Skies service stack."""

from __future__ import annotations

import logging
from contextvars import ContextVar
from pathlib import Path
import errno
from typing import Any, Final, NoReturn
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .diagnostics import DiagnosticLogger
from .models.errors import ErrorResponse
from .service_errors import DEFAULT_ERROR_DEFINITION, ERROR_DEFINITIONS, ServiceError

LOGGER = logging.getLogger(__name__)

TRACE_ID_HEADER: Final[str] = "x-trace-id"
_TRACE_ID_CONTEXT: ContextVar[str] = ContextVar("blackskies_trace_id", default="")

DEFAULT_ERROR_RESPONSES: Final[dict[int | str, dict[str, Any]]] = {
    status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
    status.HTTP_402_PAYMENT_REQUIRED: {"model": ErrorResponse},
    status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    status.HTTP_500_INTERNAL_SERVER_ERROR: {"model": ErrorResponse},
}


def default_error_responses() -> dict[int | str, dict[str, Any]]:
    """Return a copy of the default error response mapping for routers."""

    return {status_code: dict(schema) for status_code, schema in DEFAULT_ERROR_RESPONSES.items()}


def resolve_trace_id(candidate: str | None) -> str:
    """Return a valid UUIDv4 string, preferring the provided candidate."""

    if candidate:
        try:
            UUID(candidate)
            return candidate
        except ValueError:
            LOGGER.debug("Ignoring invalid trace identifier: %s", candidate)
    return str(uuid4())


def ensure_trace_id() -> str:
    """Return the active trace identifier, creating one if absent."""

    trace_id = _TRACE_ID_CONTEXT.get()
    if not trace_id:
        trace_id = str(uuid4())
        _TRACE_ID_CONTEXT.set(trace_id)
    return trace_id


def get_trace_context() -> ContextVar[str]:
    """Expose the trace identifier context variable for middleware use."""

    return _TRACE_ID_CONTEXT


def build_error_payload(
    *, code: str, message: str, details: dict[str, Any], trace_id: str
) -> ErrorResponse:
    """Construct an error payload following the locked contract."""

    return ErrorResponse(code=code, message=message, details=details, trace_id=trace_id)


def http_exception_to_response(exc: HTTPException, trace_id: str) -> JSONResponse:
    """Translate an ``HTTPException`` into a JSON response with trace headers."""

    headers = dict(exc.headers or {})
    headers.setdefault(TRACE_ID_HEADER, trace_id)

    detail = exc.detail
    if isinstance(detail, ErrorResponse):
        payload = detail
    elif isinstance(detail, dict):
        payload_data = dict(detail)
        payload_data.setdefault("code", "INTERNAL")
        payload_data.setdefault("message", "Internal server error.")
        payload_data.setdefault("details", {})
        payload_data["trace_id"] = trace_id
        payload = ErrorResponse.model_validate(payload_data)
    else:
        payload = ErrorResponse(
            code="INTERNAL",
            message=str(detail),
            details={},
            trace_id=trace_id,
        )

    return JSONResponse(
        status_code=exc.status_code,
        content=payload.model_dump(),
        headers=headers,
    )


def request_validation_response(exc: RequestValidationError, trace_id: str) -> JSONResponse:
    """Render request validation failures using the shared error model."""

    payload = build_error_payload(
        code="VALIDATION",
        message="Request validation failed.",
        details={"errors": exc.errors()},
        trace_id=trace_id,
    )
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=payload.model_dump(),
        headers={TRACE_ID_HEADER: trace_id},
    )


def internal_error_response(trace_id: str) -> JSONResponse:
    """Generate a generic internal error response with trace context."""

    payload = build_error_payload(
        code="INTERNAL",
        message="Internal server error.",
        details={},
        trace_id=trace_id,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=payload.model_dump(),
        headers={TRACE_ID_HEADER: trace_id},
    )


def _sanitize_details(details: Any) -> Any:
    """Convert exception instances inside details into serialisable values."""

    if isinstance(details, Exception):
        return str(details)
    if isinstance(details, dict):
        return {key: _sanitize_details(value) for key, value in details.items()}
    if isinstance(details, list):
        return [_sanitize_details(item) for item in details]
    return details


def raise_service_error(
    *,
    status_code: int | None = None,
    code: str,
    message: str | None,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> NoReturn:
    """Raise a structured ``ServiceError`` and log diagnostics."""

    safe_details = _sanitize_details(details)
    definition = ERROR_DEFINITIONS.get(code, DEFAULT_ERROR_DEFINITION)
    payload_message = message or definition.message
    final_status = status_code or definition.status_code
    if project_root is not None:
        diagnostics.log(project_root, code=code, message=payload_message, details=safe_details)
    raise ServiceError(
        code=code,
        status_code=final_status,
        message=payload_message,
        details=safe_details,
        project_root=project_root,
    )


def raise_conflict_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> NoReturn:
    """Log and raise a conflict response."""

    raise_service_error(
        code="CONFLICT",
        message=message,
        details=details,
        diagnostics=diagnostics,
        project_root=project_root,
    )


def raise_validation_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> NoReturn:
    """Raise a validation error and optionally log diagnostics."""

    raise_service_error(
        code="VALIDATION",
        message=message,
        details=details,
        diagnostics=diagnostics,
        project_root=project_root,
    )


def raise_budget_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> NoReturn:
    """Raise a ``BUDGET_EXCEEDED`` error and log it."""

    raise_service_error(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        code="BUDGET_EXCEEDED",
        message=message,
        details=details,
        diagnostics=diagnostics,
        project_root=project_root,
    )


def _classify_filesystem_error(exc: OSError) -> tuple[int, str]:
    errno_value = getattr(exc, "errno", None)
    if isinstance(exc, FileNotFoundError):
        return status.HTTP_404_NOT_FOUND, "FILESYSTEM_NOT_FOUND"
    if errno_value in _FILESYSTEM_ERROR_MAP:
        return _FILESYSTEM_ERROR_MAP[errno_value]
    if isinstance(exc, PermissionError):
        return status.HTTP_403_FORBIDDEN, "FILESYSTEM_DENIED"
    return status.HTTP_500_INTERNAL_SERVER_ERROR, "FILESYSTEM_ERROR"


def raise_filesystem_error(
    exc: OSError,
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> NoReturn:
    """Raise an HTTP error that reflects the filesystem failure."""

    status_code, code = _classify_filesystem_error(exc)
    fs_details = dict(details)
    fs_details.setdefault("errno", getattr(exc, "errno", None))
    fs_details.setdefault("error", str(exc))
    raise_service_error(
        status_code=status_code,
        code=code,
        message=message,
        details=fs_details,
        diagnostics=diagnostics,
        project_root=project_root,
    )


__all__: list[str] = [
    "DEFAULT_ERROR_RESPONSES",
    "TRACE_ID_HEADER",
    "build_error_payload",
    "default_error_responses",
    "ensure_trace_id",
    "get_trace_context",
    "http_exception_to_response",
    "internal_error_response",
    "request_validation_response",
    "resolve_trace_id",
    "raise_service_error",
    "raise_conflict_error",
    "raise_validation_error",
    "raise_budget_error",
    "raise_filesystem_error",
]
_FILESYSTEM_ERROR_MAP: dict[int, tuple[int, str]] = {
    errno.EACCES: (status.HTTP_403_FORBIDDEN, "FILESYSTEM_DENIED"),
    errno.EPERM: (status.HTTP_403_FORBIDDEN, "FILESYSTEM_DENIED"),
    errno.ENOENT: (status.HTTP_404_NOT_FOUND, "FILESYSTEM_NOT_FOUND"),
    errno.EEXIST: (status.HTTP_409_CONFLICT, "FILESYSTEM_CONFLICT"),
    errno.ENOSPC: (status.HTTP_507_INSUFFICIENT_STORAGE, "FILESYSTEM_FULL"),
    errno.EROFS: (status.HTTP_403_FORBIDDEN, "FILESYSTEM_READONLY"),
}
