"""Render templates stored in the project data directory."""

from __future__ import annotations

from string import Template
from typing import Mapping

from .. import storage
from .base import (
    ToolContext,
    ToolExecutionResult,
    ToolInvocationContext,
    log_tool_complete,
    log_tool_start,
)


class TemplateRendererTool:
    """Adapter that retrieves template definitions via :mod:`black_skies.storage`."""

    name = "template_renderer"

    def context(self, *, trace_id: str | None = None, metadata: Mapping[str, Any] | None = None) -> ToolInvocationContext:
        return ToolInvocationContext(name=self.name, trace_id=trace_id, metadata=metadata or {})

    def render(self, context: ToolContext, template_id: str, variables: Mapping[str, Any]) -> ToolExecutionResult[str]:
        """Render a stored template with the provided variables."""

        if not isinstance(template_id, str) or not template_id:
            raise ValueError("template_id must be a non-empty string.")
        if not isinstance(variables, Mapping):
            raise TypeError("variables must be a mapping.")

        operation_payload = {"operation": "render", "template_id": template_id}
        log_tool_start(context, **operation_payload)
        try:
            record = storage.load("template", template_id)
        except Exception as exc:
            log_tool_complete(
                context,
                **{**operation_payload, "status": "error", "error_type": exc.__class__.__name__, "message": str(exc)},
            )
            raise

        body = record.get("body")
        if not isinstance(body, str) or not body:
            log_tool_complete(
                context,
                **{**operation_payload, "status": "error", "error_type": "InvalidTemplate", "message": "missing body"},
            )
            raise ValueError("Template record must include a non-empty 'body' string.")

        try:
            rendered = Template(body).substitute(**dict(variables))
        except KeyError as exc:
            log_tool_complete(
                context,
                **{
                    **operation_payload,
                    "status": "error",
                    "error_type": "MissingVariable",
                    "missing": exc.args[0],
                },
            )
            raise ValueError(f"Missing template variable: {exc.args[0]}") from exc
        except Exception as exc:
            log_tool_complete(
                context,
                **{**operation_payload, "status": "error", "error_type": exc.__class__.__name__, "message": str(exc)},
            )
            raise

        log_tool_complete(
            context,
            **{
                **operation_payload,
                "status": "success",
                "length": len(rendered),
            },
        )
        return ToolExecutionResult(value=rendered, metadata={"template_id": template_id, "length": len(rendered)})

