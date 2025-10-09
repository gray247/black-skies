"""HTTP utilities shared across the Black Skies service stack."""

from __future__ import annotations

import logging
from contextvars import ContextVar
from pathlib import Path
from typing import Any, Final
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .diagnostics import DiagnosticLogger

LOGGER = logging.getLogger(__name__)

TRACE_ID_HEADER: Final[str] = "x-trace-id"
_TRACE_ID_CONTEXT: ContextVar[str] = ContextVar("blackskies_trace_id", default="")


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
) -> dict[str, Any]:
    """Construct an error payload following the locked contract."""

    return {
        "code": code,
        "message": message,
        "details": details,
        "trace_id": trace_id,
    }


def http_exception_to_response(exc: HTTPException, trace_id: str) -> JSONResponse:
    """Translate an ``HTTPException`` into a JSON response with trace headers."""

    headers = dict(exc.headers or {})
    headers.setdefault(TRACE_ID_HEADER, trace_id)

    detail = exc.detail
    if isinstance(detail, dict):
        payload = dict(detail)
        payload.setdefault("code", "INTERNAL")
        payload.setdefault("message", "Internal server error.")
        payload.setdefault("details", {})
    else:
        payload = {
            "code": "INTERNAL",
            "message": str(detail),
            "details": {},
        }
    payload["trace_id"] = trace_id

    return JSONResponse(status_code=exc.status_code, content=payload, headers=headers)


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
        content=payload,
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
        content=payload,
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
    status_code: int,
    code: str,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> None:
    """Raise an ``HTTPException`` with shared error formatting and logging."""

    safe_details = _sanitize_details(details)
    if project_root is not None:
        diagnostics.log(project_root, code=code, message=message, details=safe_details)
    trace_id = ensure_trace_id()
    raise HTTPException(
        status_code=status_code,
        detail=build_error_payload(
            code=code, message=message, details=safe_details, trace_id=trace_id
        ),
        headers={TRACE_ID_HEADER: trace_id},
    )


def raise_conflict_error(
    *,
    message: str,
    details: dict[str, Any],
    diagnostics: DiagnosticLogger,
    project_root: Path | None,
) -> None:
    """Log and raise a conflict response."""

    raise_service_error(
        status_code=status.HTTP_409_CONFLICT,
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
) -> None:
    """Raise a validation error and optionally log diagnostics."""

    raise_service_error(
        status_code=status.HTTP_400_BAD_REQUEST,
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
) -> None:
    """Raise a ``BUDGET_EXCEEDED`` error and log it."""

    raise_service_error(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        code="BUDGET_EXCEEDED",
        message=message,
        details=details,
        diagnostics=diagnostics,
        project_root=project_root,
    )


__all__ = [
    "TRACE_ID_HEADER",
    "build_error_payload",
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
]
