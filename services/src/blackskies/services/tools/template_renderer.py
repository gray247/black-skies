"""Render templates stored in the project data directory."""

from __future__ import annotations

from pathlib import Path
from string import Template
from typing import Any, Mapping

from .. import storage
from ..config import ServiceSettings
from .base import (
    ToolContext,
    ToolExecutionResult,
    ToolInvocationContext,
    ToolMetadata,
    log_tool_complete,
    log_tool_start,
)


class TemplateRendererTool:
    """Adapter that retrieves template definitions via :mod:`blackskies.services.storage`."""

    name = "template_renderer"
    metadata = ToolMetadata(
        name=name,
        model="black-skies.template-renderer",
        cost_estimate="cpu-only",
    )

    def __init__(
        self,
        *,
        base_dir: Path | None = None,
        settings: ServiceSettings | None = None,
    ) -> None:
        if base_dir is not None and settings is not None:
            raise ValueError("Provide either base_dir or settings, not both.")
        if settings is None:
            settings = ServiceSettings.from_environment()
        self._base_dir = base_dir or settings.project_base_dir

    def context(
        self, *, trace_id: str | None = None, metadata: Mapping[str, Any] | None = None
    ) -> ToolInvocationContext:
        return ToolInvocationContext(name=self.name, trace_id=trace_id, metadata=metadata or {})

    def render(
        self, context: ToolContext, template_id: str, variables: Mapping[str, Any]
    ) -> ToolExecutionResult[str]:
        """Render a stored template with the provided variables."""

        if not isinstance(template_id, str) or not template_id:
            raise ValueError("template_id must be a non-empty string.")
        if not isinstance(variables, Mapping):
            raise TypeError("variables must be a mapping.")

        operation_payload = {"operation": "render", "template_id": template_id}
        log_tool_start(context, **operation_payload)
        try:
            record = storage.load("template", template_id, base_dir=self._base_dir)
        except Exception as exc:
            log_tool_complete(
                context,
                **{
                    **operation_payload,
                    "status": "error",
                    "error_type": exc.__class__.__name__,
                    "message": str(exc),
                },
            )
            raise

        body = record.get("body")
        if not isinstance(body, str) or not body:
            log_tool_complete(
                context,
                **{
                    **operation_payload,
                    "status": "error",
                    "error_type": "InvalidTemplate",
                    "message": "missing body",
                },
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
                **{
                    **operation_payload,
                    "status": "error",
                    "error_type": exc.__class__.__name__,
                    "message": str(exc),
                },
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
        return ToolExecutionResult(
            value=rendered, metadata={"template_id": template_id, "length": len(rendered)}
        )
