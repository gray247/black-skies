"""Service orchestration utilities for Black Skies agents."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Dict, Mapping

from .agents.base import BaseAgent, CritiqueAgent, DraftAgent, OutlineAgent, RewriteAgent
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
        self._agents: Dict[str, Callable[[OperationPayload], OperationResult]] = {}
        self._register_agents(
            outline=OutlineAgent(outline_worker),
            draft=DraftAgent(draft_worker),
            rewrite=RewriteAgent(rewrite_worker),
            critique=CritiqueAgent(critique_worker),
        )
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

    def _register_agents(self, **agents: BaseAgent) -> None:
        """Register the orchestrated agents by operation name."""

        for name, agent in agents.items():
            self._agents[name] = agent.run

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
        return self._run_agent("outline", payload)

    def generate_draft(self, payload: OperationPayload) -> OperationResult:
        return self._run_agent("draft", payload)

    def apply_rewrite(self, payload: OperationPayload) -> OperationResult:
        return self._run_agent("rewrite", payload)

    def run_critique(self, payload: OperationPayload) -> OperationResult:
        return self._run_agent("critique", payload)

    def draft_and_critique(
        self, draft_payload: OperationPayload, critique_payload: OperationPayload
    ) -> tuple[OperationResult, OperationResult]:
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

        operations = {
            "outline": ("outline", outline_payload),
            "draft": ("draft", draft_payload),
        }
        with ThreadPoolExecutor(max_workers=len(operations)) as executor:
            futures = {
                name: executor.submit(self._run_agent, agent_name, payload)
                for name, (agent_name, payload) in operations.items()
            }
            # Always return results in outline->draft order for stable callers.
            return futures["outline"].result(), futures["draft"].result()

    def _run_agent(self, name: str, payload: OperationPayload) -> OperationResult:
        """Dispatch to a registered agent by name."""

        try:
            runner = self._agents[name]
        except KeyError as exc:
            raise ValueError(f"Unknown agent operation '{name}'.") from exc
        return runner(payload)


__all__ = ["AgentOrchestrator", "ToolNotPermittedError"]
