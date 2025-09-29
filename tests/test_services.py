from __future__ import annotations

from black_skies.services import AgentOrchestrator


def stub_worker(result):
    def _inner(payload):
        data = dict(result)
        data.update(payload)
        return data

    return _inner


def test_orchestrator_sequential(monkeypatch):
    orchestrator = AgentOrchestrator(
        outline_worker=stub_worker({"outline": "ok"}),
        draft_worker=stub_worker({"draft": "ok"}),
        rewrite_worker=stub_worker({"rewrite": "ok"}),
        critique_worker=stub_worker({"critique": "ok"}),
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
    )
    outline, draft = orchestrator.parallel_outline_and_draft({"id": "ol"}, {"id": "dr"})
    assert outline["outline"] == "ok"
    assert draft["draft"] == "ok"
