"""Tool adapter interfaces and implementations for Black Skies."""

from .base import (
    ToolContext,
    ToolExecutionResult,
    ToolInvocationContext,
    ToolMetadata,
    ToolResult,
    log_tool_complete,
    log_tool_event,
    log_tool_start,
    tool_logger,
)
from .file_store import FileStoreTool
from .search import MarkdownSearchTool
from .summarizer import SummarizerTool
from .template_renderer import TemplateRendererTool

__all__ = [
    "FileStoreTool",
    "MarkdownSearchTool",
    "SummarizerTool",
    "TemplateRendererTool",
    "ToolContext",
    "ToolExecutionResult",
    "ToolInvocationContext",
    "ToolMetadata",
    "ToolResult",
    "log_tool_complete",
    "log_tool_event",
    "log_tool_start",
    "tool_logger",
]
