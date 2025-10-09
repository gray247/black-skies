from __future__ import annotations

from typing import Dict

import pytest

from blackskies.services.agents.base import AgentError, DraftAgent


def test_agent_retries_and_succeeds() -> None:
    attempts: Dict[str, int] = {"count": 0}

    def worker(payload: dict[str, object]) -> dict[str, object]:
        attempts["count"] += 1
        if attempts["count"] < 2:
            raise RuntimeError("transient error")
        return {"ok": True}

    agent = DraftAgent(worker)
    result = agent.run({"unit": "sc_1"})
    assert result["ok"] is True
    assert attempts["count"] == 2


def test_agent_exhausts_retries() -> None:
    def worker(_: dict[str, object]) -> dict[str, object]:
        raise RuntimeError("always failing")

    agent = DraftAgent(worker)
    with pytest.raises(AgentError):
        agent.run({"unit": "sc_1"})
