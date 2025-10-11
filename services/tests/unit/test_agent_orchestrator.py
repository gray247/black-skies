from __future__ import annotations

from typing import Any, Callable, Dict, Mapping

import pytest

from blackskies.services.services import AgentOrchestrator, ToolNotPermittedError


class DummyRegistry:
    """Minimal registry used to exercise the orchestrator in isolation."""

    def __init__(self, *, allow: bool = True) -> None:
        self._allow = allow

    @staticmethod
    def canonical_name(name: str) -> str:
        return name.lower()

    def check_permission(
        self,
        name: str,
        *,
        run_id: str,
        checklist_item: str | None = None,
        metadata: Mapping[str, Any] | None = None,
    ) -> "Decision":
        if self._allow:
            return Decision(tool=name, allowed=True, source="test", reason="allowed")
        return Decision(tool=name, allowed=False, source="test", reason="denied")


class Decision:
    def __init__(self, *, tool: str, allowed: bool, source: str, reason: str) -> None:
        self.tool = tool
        self.allowed = allowed
        self.source = source
        self.reason = reason
        self.checklist_item = None
        self.checklist_slug = None


def _make_workers() -> Dict[str, Callable[[Dict[str, Any]], Dict[str, Any]]]:
    def _worker_factory(label: str) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
        def _worker(payload: Dict[str, Any]) -> Dict[str, Any]:
            return {"label": label, "payload": payload}

        return _worker

    return {
        "outline": _worker_factory("outline"),
        "draft": _worker_factory("draft"),
        "rewrite": _worker_factory("rewrite"),
        "critique": _worker_factory("critique"),
    }


def test_agent_orchestrator_runs_individual_agents() -> None:
    workers = _make_workers()
    orchestrator = AgentOrchestrator(
        workers["outline"],
        workers["draft"],
        workers["rewrite"],
        workers["critique"],
        tool_registry=DummyRegistry(),
    )

    assert orchestrator.build_outline({"id": 1})["label"] == "outline"
    assert orchestrator.generate_draft({"id": 2})["label"] == "draft"
    assert orchestrator.apply_rewrite({"id": 3})["label"] == "rewrite"
    assert orchestrator.run_critique({"id": 4})["label"] == "critique"


def test_agent_orchestrator_runs_parallel_operations() -> None:
    workers = _make_workers()
    orchestrator = AgentOrchestrator(
        workers["outline"],
        workers["draft"],
        workers["rewrite"],
        workers["critique"],
        tool_registry=DummyRegistry(),
    )

    outline_result, draft_result = orchestrator.parallel_outline_and_draft(
        {"value": "outline"}, {"value": "draft"}
    )

    assert outline_result["label"] == "outline"
    assert draft_result["label"] == "draft"
    assert outline_result["payload"] == {"value": "outline"}
    assert draft_result["payload"] == {"value": "draft"}


def test_orchestrator_tool_registry_enforced() -> None:
    workers = _make_workers()
    orchestrator = AgentOrchestrator(
        workers["outline"],
        workers["draft"],
        workers["rewrite"],
        workers["critique"],
        tool_registry=DummyRegistry(allow=True),
    )
    orchestrator.register_tool("echo", lambda value: value)
    tool = orchestrator.resolve_tool("echo", run_id="run-1")
    assert tool("value") == "value"

    orchestrator_denied = AgentOrchestrator(
        workers["outline"],
        workers["draft"],
        workers["rewrite"],
        workers["critique"],
        tool_registry=DummyRegistry(allow=False),
    )
    orchestrator_denied.register_tool("blocked", lambda: None)
    with pytest.raises(ToolNotPermittedError):
        orchestrator_denied.resolve_tool("blocked", run_id="run-1")


def test_unknown_operation_raises() -> None:
    workers = _make_workers()
    orchestrator = AgentOrchestrator(
        workers["outline"],
        workers["draft"],
        workers["rewrite"],
        workers["critique"],
        tool_registry=DummyRegistry(),
    )

    with pytest.raises(ValueError, match="Unknown agent operation"):
        orchestrator._run_agent("unknown", {"id": 1})
