"""File-backed tool adapter that delegates to :mod:`black_skies.storage`."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Mapping, MutableMapping

from .. import storage
from .base import (
    ToolContext,
    ToolExecutionResult,
    ToolInvocationContext,
    ToolMetadata,
    log_tool_complete,
    log_tool_start,
)


class FileStoreTool:
    """High-level adapter around :mod:`black_skies.storage` helpers."""

    name = "file_store"
    metadata = ToolMetadata(
        name=name,
        model="black-skies.local-file-store",
        cost_estimate="filesystem-io",
    )

    def __init__(self) -> None:
        self._data_root = storage.DATA_ROOT

    def _ensure_mapping(self, obj: Mapping[str, Any] | MutableMapping[str, Any]) -> dict[str, Any]:
        if not isinstance(obj, Mapping):
            raise TypeError("FileStoreTool.save expects a mapping payload.")
        return dict(obj)

    def save(self, context: ToolContext, payload: Mapping[str, Any] | MutableMapping[str, Any]) -> ToolExecutionResult[Path]:
        """Persist an object to disk via :func:`black_skies.storage.save`."""

        data = self._ensure_mapping(payload)
        kind = data.get("kind")
        identifier = data.get("id")
        if not isinstance(kind, str) or not kind:
            raise ValueError("Payload must define a non-empty 'kind' string.")
        if not isinstance(identifier, str) or not identifier:
            raise ValueError("Payload must define a non-empty 'id' string.")

        operation_payload = {"operation": "save", "kind": kind, "id": identifier}
        log_tool_start(context, **operation_payload)
        try:
            path = storage.save(data)
        except Exception as exc:
            log_tool_complete(
                context,
                **{**operation_payload, "status": "error", "error_type": exc.__class__.__name__, "message": str(exc)},
            )
            raise
        relative_path = path.relative_to(self._data_root)
        log_tool_complete(
            context,
            **{**operation_payload, "status": "success", "path": str(relative_path)},
        )
        return ToolExecutionResult(value=path, metadata={"path": path, "relative_path": relative_path})

    def load(self, context: ToolContext, kind: str, identifier: str) -> ToolExecutionResult[dict[str, Any]]:
        """Load a stored object via :func:`black_skies.storage.load`."""

        if not isinstance(kind, str) or not kind:
            raise ValueError("'kind' must be a non-empty string.")
        if not isinstance(identifier, str) or not identifier:
            raise ValueError("'identifier' must be a non-empty string.")

        operation_payload = {"operation": "load", "kind": kind, "id": identifier}
        log_tool_start(context, **operation_payload)
        try:
            data = storage.load(kind, identifier)
        except Exception as exc:
            log_tool_complete(
                context,
                **{**operation_payload, "status": "error", "error_type": exc.__class__.__name__, "message": str(exc)},
            )
            raise
        log_tool_complete(context, **{**operation_payload, "status": "success"})
        return ToolExecutionResult(value=data, metadata={"kind": kind, "id": identifier})

    def context(self, *, trace_id: str | None = None, metadata: Mapping[str, Any] | None = None) -> ToolInvocationContext:
        """Convenience helper to build a :class:`ToolInvocationContext`."""

        return ToolInvocationContext(name=self.name, trace_id=trace_id, metadata=metadata or {})

