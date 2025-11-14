"""Central service error definitions and helper exception types."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from fastapi import status


@dataclass(frozen=True)
class ErrorDefinition:
    code: str
    message: str
    status_code: int


ERROR_DEFINITIONS: Dict[str, ErrorDefinition] = {
    "INTERNAL": ErrorDefinition("INTERNAL", "Internal server error.", status.HTTP_500_INTERNAL_SERVER_ERROR),
    "VALIDATION": ErrorDefinition("VALIDATION", "Validation failed.", status.HTTP_400_BAD_REQUEST),
    "CONFLICT": ErrorDefinition("CONFLICT", "Conflict occurred.", status.HTTP_409_CONFLICT),
    "RATE_LIMIT": ErrorDefinition("RATE_LIMIT", "Rate limit exceeded.", status.HTTP_429_TOO_MANY_REQUESTS),
    "IO_READ_FAILED": ErrorDefinition("IO_READ_FAILED", "Failed to read required data.", status.HTTP_500_INTERNAL_SERVER_ERROR),
    "MODEL_ERROR": ErrorDefinition("MODEL_ERROR", "Model execution failed.", status.HTTP_502_BAD_GATEWAY),
    "ROUTING_FAILURE": ErrorDefinition("ROUTING_FAILURE", "Operation could not be routed.", status.HTTP_503_SERVICE_UNAVAILABLE),
    "CRITIQUE_FAILURE": ErrorDefinition("CRITIQUE_FAILURE", "Critique evaluation failed.", status.HTTP_500_INTERNAL_SERVER_ERROR),
    "DRAFT_FALLBACK_FAILED": ErrorDefinition("DRAFT_FALLBACK_FAILED", "Draft fallback could not retrieve cached data.", status.HTTP_500_INTERNAL_SERVER_ERROR),
    "TIMEOUT": ErrorDefinition("TIMEOUT", "Operation timed out.", status.HTTP_504_GATEWAY_TIMEOUT),
    "BUDGET_EXCEEDED": ErrorDefinition("BUDGET_EXCEEDED", "Budget limit exceeded.", status.HTTP_402_PAYMENT_REQUIRED),
    "FILESYSTEM_DENIED": ErrorDefinition("FILESYSTEM_DENIED", "Filesystem permission denied.", status.HTTP_403_FORBIDDEN),
    "FILESYSTEM_NOT_FOUND": ErrorDefinition("FILESYSTEM_NOT_FOUND", "Filesystem resource not found.", status.HTTP_404_NOT_FOUND),
    "FILESYSTEM_CONFLICT": ErrorDefinition("FILESYSTEM_CONFLICT", "Filesystem conflict (already exists).", status.HTTP_409_CONFLICT),
    "FILESYSTEM_FULL": ErrorDefinition("FILESYSTEM_FULL", "Filesystem full.", status.HTTP_507_INSUFFICIENT_STORAGE),
    "FILESYSTEM_READONLY": ErrorDefinition("FILESYSTEM_READONLY", "Filesystem read-only.", status.HTTP_403_FORBIDDEN),
}

DEFAULT_ERROR_DEFINITION = ErrorDefinition(
    "UNEXPECTED_ERROR",
    "Unexpected error occurred.",
    status.HTTP_500_INTERNAL_SERVER_ERROR,
)


class ServiceError(Exception):
    """Structured error for router responses."""

    def __init__(
        self,
        *,
        code: str,
        status_code: int,
        message: str,
        details: dict[str, Any] | None = None,
        project_root: Path | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = status_code
        self.project_root = project_root
