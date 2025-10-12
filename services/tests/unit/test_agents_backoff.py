from __future__ import annotations

import pytest

from blackskies.services.agents.base import AgentError, BaseAgent, ExponentialBackoff


class _FlakyAgent(BaseAgent):
    def __init__(self, failures: int, *, max_attempts: int | None = None) -> None:
        attempts = max_attempts if max_attempts is not None else failures + 1
        super().__init__(
            max_attempts=attempts,
            backoff=ExponentialBackoff(multiplier=0.1),
            sleep=lambda _: None,
        )
        self._remaining_failures = failures

    def run_once(self, payload: dict[str, str]) -> dict[str, str]:
        if self._remaining_failures > 0:
            self._remaining_failures -= 1
            raise ValueError('intentional failure')
        return {"status": "ok"}


def test_exponential_backoff_bounds() -> None:
    backoff = ExponentialBackoff(multiplier=0.5, min_interval=0.5, max_interval=4.0)
    assert backoff.compute(1) == pytest.approx(0.5)
    assert backoff.compute(3) == pytest.approx(2.0)
    assert backoff.compute(5) <= 4.0


def test_agent_retries_until_success() -> None:
    agent = _FlakyAgent(failures=2)
    result = agent.run({})
    assert result["status"] == "ok"


def test_agent_raises_after_exhausting_attempts() -> None:
    agent = _FlakyAgent(failures=3, max_attempts=3)
    with pytest.raises(AgentError):
        agent.run({})
