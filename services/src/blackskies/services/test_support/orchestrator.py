"""Test-support tool and worker facade.

This module is intentionally outside the runtime control plane. It exists for
unit tests and isolated experiments only.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from functools import wraps
from typing import Any, Callable, Dict, Mapping

from .agents import BaseAgent, CritiqueAgent, DraftAgent, OutlineAgent, RewriteAgent
from ..tools.base import ToolContext
from ..tools.registry import ToolRegistry
from ..tools.resilience import ToolResilienceConfig, ToolRunner
from ..settings import Settings, get_settings

OperationPayload = Dict[str, Any]
OperationResult = Dict[str, Any]


class ToolNotPermittedError(PermissionError):
    """Raised when a tool invocation is blocked by the registry."""


class AgentOrchestrator:
    """Test-support facade for workers and gated tools.

    This is not the production control plane. `create_app()` wires the real
    runtime services directly. This class does not own policy, budget,
    lifecycle, coordination, or job supervision.
    """

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
        tool_resilience_config: ToolResilienceConfig | None = None,
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
        self._tool_runner = ToolRunner(config=tool_resilience_config)
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
        """Register the supported worker wrappers by operation name."""

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
        tool_impl = self._tools[canonical]

        @wraps(tool_impl)
        def _call(*args: Any, **kwargs: Any) -> Any:
            context: ToolContext | None = None
            if args and isinstance(args[0], ToolContext):
                context = args[0]

            def _operation() -> Any:
                return tool_impl(*args, **kwargs)

            return self._tool_runner.execute(
                canonical,
                _operation,
                context=context,
            )

        for attr in ("metadata", "name", "context"):
            if hasattr(tool_impl, attr):
                setattr(_call, attr, getattr(tool_impl, attr))
        _call.__wrapped__ = tool_impl  # type: ignore[attr-defined]
        return _call

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
        """Run draft and critique sequentially."""

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
            return futures["outline"].result(), futures["draft"].result()

    def _run_agent(self, name: str, payload: OperationPayload) -> OperationResult:
        """Dispatch to a registered agent by name."""

        try:
            runner = self._agents[name]
        except KeyError as exc:
            raise ValueError(f"Unknown agent operation '{name}'.") from exc
        return runner(payload)


__all__ = ["AgentOrchestrator", "ToolNotPermittedError"]
