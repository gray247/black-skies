from __future__ import annotations

import pytest

from blackskies.services.agents.base import AgentError, BaseAgent, ExponentialBackoff


class RecordingAgent(BaseAgent):
    def __init__(self, outcomes: list[object], **kwargs) -> None:
        super().__init__(**kwargs)
        self._outcomes = list(outcomes)
        self.call_count = 0

    def run_once(self, payload: dict[str, object]) -> dict[str, object]:
        self.call_count += 1
        outcome = self._outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return {"payload": payload, "result": outcome}


def _sleep_recorder(recorder: list[float]) -> callable:
    def _sleep(delay: float) -> None:
        recorder.append(delay)

    return _sleep


def test_agent_run_success_without_retries() -> None:
    agent = RecordingAgent([{"ok": True}])
    payload = {"value": 1}

    result = agent.run(payload)

    assert result["payload"] == payload
    assert result["result"] == {"ok": True}
    assert agent.call_count == 1


def test_agent_runs_with_retry_and_backoff() -> None:
    sleeps: list[float] = []
    agent = RecordingAgent(
        [RuntimeError("boom"), {"ok": True}],
        sleep=_sleep_recorder(sleeps),
        backoff=ExponentialBackoff(multiplier=0.25, min_interval=0.1, max_interval=2.0),
    )

    result = agent.run({"value": "retry"})

    assert result["result"] == {"ok": True}
    assert sleeps == [0.25]  # multiplier * 2 ** (attempt-1)
    assert agent.call_count == 2


def test_agent_raises_after_exhausting_attempts() -> None:
    agent = RecordingAgent(
        [RuntimeError("fail"), RuntimeError("fail")],
        max_attempts=2,
        sleep=_sleep_recorder([]),
    )

    with pytest.raises(AgentError):
        agent.run({"value": "fail"})

    assert agent.call_count == 2


def test_agent_rejects_invalid_attempt_configuration() -> None:
    with pytest.raises(ValueError):
        RecordingAgent([{"irrelevant": True}], max_attempts=0)
