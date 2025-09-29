"""Service orchestration utilities for Black Skies agents."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, Mapping

from .agents.base import CritiqueAgent, DraftAgent, OutlineAgent, RewriteAgent
from .settings import Settings, get_settings
from .tools.registry import ToolRegistry

OperationPayload = Dict[str, Any]
OperationResult = Dict[str, Any]


class ToolNotPermittedError(PermissionError):
    """Raised when a tool invocation is blocked by the registry."""


class AgentOrchestrator:
    """Coordinate agents with shared settings and gated tool access."""

    def __init__(
        self,
        outline_worker: Callable[[OperationPayload], OperationResult],
        draft_worker: Callable[[OperationPayload], OperationResult],
        rewrite_worker: Callable[[OperationPayload], OperationResult],
        critique_worker: Callable[[OperationPayload], OperationResult],
        *,
        tool_registry: ToolRegistry,
        tools: Mapping[str, Callable[..., Any]] | None = None,
        settings: Settings | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.outline_agent = OutlineAgent(outline_worker)
        self.draft_agent = DraftAgent(draft_worker)
        self.rewrite_agent = RewriteAgent(rewrite_worker)
        self.critique_agent = CritiqueAgent(critique_worker)
        self._tool_registry = tool_registry
        self._tools: Dict[str, Callable[..., Any]] = {}
        if tools:
            for name, tool in tools.items():
                self.register_tool(name, tool)

    @property
    def tool_registry(self) -> ToolRegistry:
        return self._tool_registry

    def register_tool(self, name: str, tool: Callable[..., Any]) -> None:
        """Register or update a tool implementation."""

        canonical = self._tool_registry.canonical_name(name)
        self._tools[canonical] = tool

    def resolve_tool(
        self,
        name: str,
        *,
        run_id: str,
        checklist_item: str | None = None,
        metadata: Mapping[str, Any] | None = None,
    ) -> Callable[..., Any]:
        """Return a registered tool after passing registry permission checks."""

        canonical = self._tool_registry.canonical_name(name)
        if canonical not in self._tools:
            raise KeyError(f"Tool '{name}' is not registered")
        decision = self._tool_registry.check_permission(
            name,
            run_id=run_id,
            checklist_item=checklist_item,
            metadata=metadata,
        )
        if not decision.allowed:
            raise ToolNotPermittedError(decision.reason)
        return self._tools[canonical]

    def build_outline(self, payload: OperationPayload) -> OperationResult:
        return self.outline_agent.run(payload)

    def generate_draft(self, payload: OperationPayload) -> OperationResult:
        return self.draft_agent.run(payload)

    def apply_rewrite(self, payload: OperationPayload) -> OperationResult:
        return self.rewrite_agent.run(payload)

    def run_critique(self, payload: OperationPayload) -> OperationResult:
        return self.critique_agent.run(payload)

    def draft_and_critique(self, draft_payload: OperationPayload, critique_payload: OperationPayload) -> tuple[OperationResult, OperationResult]:
        """Run draft and critique sequentially, respecting settings."""

        draft_result = self.generate_draft(draft_payload)
        critique_result = self.run_critique(critique_payload)
        return draft_result, critique_result

    def parallel_outline_and_draft(
        self,
        outline_payload: OperationPayload,
        draft_payload: OperationPayload,
    ) -> tuple[OperationResult, OperationResult]:
        """Run outline and draft in parallel using a thread pool."""

        with ThreadPoolExecutor(max_workers=2) as executor:
            outline_future = executor.submit(self.build_outline, outline_payload)
            draft_future = executor.submit(self.generate_draft, draft_payload)
            return outline_future.result(), draft_future.result()


__all__ = ["AgentOrchestrator", "ToolNotPermittedError"]
