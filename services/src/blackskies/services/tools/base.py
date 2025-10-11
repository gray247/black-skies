"""Shared contracts and helpers for Black Skies tool adapters."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, Generic, Mapping, Protocol, TypeVar, runtime_checkable

ResultT = TypeVar("ResultT")
ResultT_co = TypeVar("ResultT_co", covariant=True)

# The tools package uses a dedicated logger so callers can subscribe to tool telemetry.
tool_logger = logging.getLogger("blackskies.services.tools")


@runtime_checkable
class ToolContext(Protocol):
    """Typed protocol describing the metadata provided to a tool invocation."""

    @property
    def name(self) -> str:
        """Human-readable name of the tool being invoked."""

    @property
    def trace_id(self) -> str | None:
        """Optional trace identifier for correlating tool telemetry."""

    @property
    def metadata(self) -> Mapping[str, Any]:
        """Arbitrary contextual metadata associated with the invocation."""

    def extra_payload(self, **updates: Any) -> Dict[str, Any]:
        """Return a dict suitable for structured logging payloads."""


@runtime_checkable
class ToolResult(Protocol[ResultT_co]):
    """Protocol capturing the outcome of invoking a tool."""

    @property
    def ok(self) -> bool:
        """Whether the tool completed successfully."""

    @property
    def value(self) -> ResultT_co | None:
        """Value returned by the tool when successful."""

    @property
    def error(self) -> Exception | None:
        """Exception raised by the tool, if any."""

    @property
    def metadata(self) -> Mapping[str, Any]:
        """Additional metadata supplied by the tool implementation."""


@dataclass(slots=True, frozen=True)
class ToolMetadata:
    """Static metadata describing a tool adapter."""

    name: str
    model: str
    cost_estimate: str


@dataclass(slots=True)
class ToolInvocationContext:
    """Concrete ToolContext implementation used by tests and adapters."""

    name: str
    trace_id: str | None = None
    metadata: Mapping[str, Any] = field(default_factory=dict)

    def extra_payload(self, **updates: Any) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"tool": self.name, **self.metadata}
        if self.trace_id is not None:
            payload["trace_id"] = self.trace_id
        payload.update(updates)
        return payload


@dataclass(slots=True)
class ToolExecutionResult(Generic[ResultT], ToolResult[ResultT]):
    """Concrete ToolResult implementation returned by adapters."""

    value: ResultT | None = None
    error: Exception | None = None
    metadata: Mapping[str, Any] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return self.error is None

    def __bool__(self) -> bool:  # pragma: no cover - convenience guard
        return self.ok


def log_tool_event(
    event: str, *, context: ToolContext, payload: Mapping[str, Any] | None = None
) -> None:
    """Emit a structured log entry for a tool event."""

    base_payload = context.extra_payload()
    if payload:
        extra_data: Dict[str, Any] = dict(payload)
        base_payload.update(extra_data)
    tool_logger.info(event, extra={"extra_payload": base_payload})


def log_tool_start(context: ToolContext, **payload: Any) -> None:
    """Log the start of a tool operation."""

    log_tool_event("tool.start", context=context, payload=payload)


def log_tool_complete(context: ToolContext, **payload: Any) -> None:
    """Log the completion of a tool operation."""

    log_tool_event("tool.complete", context=context, payload=payload)
