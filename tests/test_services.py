from __future__ import annotations

import pytest

from black_skies.services import AgentOrchestrator, ToolNotPermittedError
from black_skies.tools import ToolDecision


def stub_worker(result):
    def _inner(payload):
        data = dict(result)
        data.update(payload)
        return data

    return _inner


class DummyRegistry:
    def __init__(self, *, allowed: bool = True) -> None:
        self.allowed = allowed

    def canonical_name(self, name: str) -> str:
        return name

    def check_permission(
        self,
        tool_name: str,
        *,
        run_id: str,
        checklist_item: str | None = None,
        metadata: dict | None = None,
    ) -> ToolDecision:
        return ToolDecision(
            tool=tool_name,
            allowed=self.allowed,
            source="test",
            reason="allowed" if self.allowed else "denied",
        )


def test_orchestrator_sequential():
    orchestrator = AgentOrchestrator(
        outline_worker=stub_worker({"outline": "ok"}),
        draft_worker=stub_worker({"draft": "ok"}),
        rewrite_worker=stub_worker({"rewrite": "ok"}),
        critique_worker=stub_worker({"critique": "ok"}),
        tool_registry=DummyRegistry(),
    )

    draft, critique = orchestrator.draft_and_critique({"a": 1}, {"b": 2})
    assert draft["draft"] == "ok"
    assert critique["critique"] == "ok"


def test_orchestrator_parallel():
    orchestrator = AgentOrchestrator(
        outline_worker=stub_worker({"outline": "ok"}),
        draft_worker=stub_worker({"draft": "ok"}),
        rewrite_worker=stub_worker({"rewrite": "ok"}),
        critique_worker=stub_worker({"critique": "ok"}),
        tool_registry=DummyRegistry(),
    )
    outline, draft = orchestrator.parallel_outline_and_draft({"id": "ol"}, {"id": "dr"})
    assert outline["outline"] == "ok"
    assert draft["draft"] == "ok"


def test_resolve_tool_denied_raises():
    orchestrator = AgentOrchestrator(
        outline_worker=stub_worker({"outline": "ok"}),
        draft_worker=stub_worker({"draft": "ok"}),
        rewrite_worker=stub_worker({"rewrite": "ok"}),
        critique_worker=stub_worker({"critique": "ok"}),
        tool_registry=DummyRegistry(allowed=False),
        tools={"summarizer": lambda payload: payload},
    )

    with pytest.raises(ToolNotPermittedError):
        orchestrator.resolve_tool("summarizer", run_id="run-test")
