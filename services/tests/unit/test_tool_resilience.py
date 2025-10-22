from __future__ import annotations

import time

import pytest

from blackskies.services.tools.resilience import (
    ToolCircuitOpenError,
    ToolExecutionError,
    ToolResilienceConfig,
    ToolRunner,
    ToolTimeoutError,
)


def test_tool_runner_retries_until_success() -> None:
    attempts: list[int] = []

    def flaky() -> str:
        attempts.append(len(attempts) + 1)
        if len(attempts) < 3:
            raise ValueError("boom")
        return "ok"

    runner = ToolRunner(
        config=ToolResilienceConfig(
            timeout_seconds=1.0,
            max_attempts=4,
            backoff_seconds=0.0,
            circuit_failure_threshold=5,
            circuit_reset_seconds=30.0,
        ),
        sleep=lambda _: None,
    )

    result = runner.execute("flaky", flaky)
    assert result == "ok"
    assert len(attempts) == 3


def test_tool_runner_times_out() -> None:
    def slow() -> None:
        time.sleep(0.2)

    runner = ToolRunner(
        config=ToolResilienceConfig(
            timeout_seconds=0.05,
            max_attempts=1,
            backoff_seconds=0.0,
            circuit_failure_threshold=2,
            circuit_reset_seconds=30.0,
        ),
        sleep=lambda _: None,
    )

    with pytest.raises(ToolTimeoutError):
        runner.execute("slow", slow)


def test_tool_runner_opens_circuit_after_failures() -> None:
    def broken() -> None:
        raise RuntimeError("fail")

    runner = ToolRunner(
        config=ToolResilienceConfig(
            timeout_seconds=1.0,
            max_attempts=1,
            backoff_seconds=0.0,
            circuit_failure_threshold=1,
            circuit_reset_seconds=60.0,
        ),
        sleep=lambda _: None,
    )

    with pytest.raises(ToolExecutionError):
        runner.execute("broken", broken)

    with pytest.raises(ToolCircuitOpenError):
        runner.execute("broken", broken)
