from __future__ import annotations

from typing import Dict

import pytest
from tenacity import RetryError

from black_skies.agents.base import AgentError, DraftAgent


def test_agent_retries_and_succeeds():
    attempts: Dict[str, int] = {"count": 0}

    def worker(payload):
        attempts["count"] += 1
        if attempts["count"] < 2:
            raise RuntimeError("transient error")
        return {"ok": True}

    agent = DraftAgent(worker)
    result = agent.run({"unit": "sc_1"})
    assert result["ok"] is True
    assert attempts["count"] == 2


def test_agent_exhausts_retries():
    def worker(payload):
        raise RuntimeError("always failing")

    agent = DraftAgent(worker)
    with pytest.raises(AgentError):
        agent.run({"unit": "sc_1"})
