"""Unit tests for agent retry behavior and backoff."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any
from unittest.mock import Mock

import pytest

from blackskies.services.agents.base import (
    AgentError,
    DraftAgent,
    ExponentialBackoff,
    OutlineAgent,
)


@pytest.mark.parametrize("agent_cls", [OutlineAgent, DraftAgent])
def test_agent_run_happy_path(agent_cls: type[OutlineAgent | DraftAgent]) -> None:
    payload: dict[str, Any] = {"topic": "testing"}
    expected = {"topic": "testing", "status": "ok"}

    def worker(input_payload: dict[str, Any]) -> dict[str, Any]:
        assert input_payload == payload
        return expected

    agent = agent_cls(worker=worker)

    result = agent.run(payload)

    assert result == expected


def test_agent_run_failure_after_retries(monkeypatch: pytest.MonkeyPatch) -> None:
    payload: dict[str, Any] = {"topic": "testing"}

    sleep_mock = Mock(spec=Callable[[float], None])
    monkeypatch.setattr("blackskies.services.agents.base.time.sleep", sleep_mock)

    call_count = 0

    def failing_worker(_: dict[str, Any]) -> dict[str, Any]:
        nonlocal call_count
        call_count += 1
        raise ValueError("boom")

    agent = OutlineAgent(worker=failing_worker)

    with pytest.raises(AgentError):
        agent.run(payload)

    assert call_count == 3
    assert sleep_mock.call_count == 2


@pytest.mark.parametrize(
    "attempt, expected",
    [
        (1, 0.5),
        (2, 1.0),
        (3, 2.0),
        (4, 4.0),
        (5, 4.0),
        (6, 4.0),
    ],
)
def test_exponential_backoff_bounds(attempt: int, expected: float) -> None:
    backoff = ExponentialBackoff(multiplier=0.5, min_interval=0.5, max_interval=4.0)

    computed = backoff.compute(attempt)

    assert computed == expected
    assert backoff.min_interval <= computed <= backoff.max_interval
