import asyncio
from collections.abc import Callable
from pathlib import Path

import pytest

from blackskies.services.resilience import (
    CircuitOpenError,
    ResiliencePolicy,
    ServiceResilienceExecutor,
)
from blackskies.services import resilience as resilience_module


def test_service_resilience_executor_retries_then_succeeds(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sleep_calls: list[float] = []

    async def fake_sleep(delay: float) -> None:
        sleep_calls.append(delay)

    monkeypatch.setattr(resilience_module.asyncio, "sleep", fake_sleep)

    policy = ResiliencePolicy(
        name="retry-demo",
        timeout_seconds=0.0,
        max_attempts=3,
        backoff_seconds=0.1,
        circuit_failure_threshold=5,
        circuit_reset_seconds=60.0,
    )

    executor = ServiceResilienceExecutor(policy)
    attempts: list[int] = []

    def flaky_operation() -> str:
        attempts.append(len(attempts))
        if len(attempts) < 3:
            raise ValueError("boom")
        return "ok"

    result = asyncio.run(executor.run(operation=flaky_operation))

    assert result == "ok"
    assert len(attempts) == 3
    assert sleep_calls == [0.1, 0.2]
    # Circuit should be closed after a successful invocation.
    assert executor._breaker.allow()  # type: ignore[attr-defined]


def test_service_resilience_executor_opens_circuit_after_failures() -> None:
    policy = ResiliencePolicy(
        name="failing-service",
        timeout_seconds=0.0,
        max_attempts=2,
        backoff_seconds=0.0,
        circuit_failure_threshold=2,
        circuit_reset_seconds=600.0,
    )
    executor = ServiceResilienceExecutor(policy)

    def failing_operation() -> None:
        raise RuntimeError("nope")

    with pytest.raises(RuntimeError):
        asyncio.run(executor.run(operation=failing_operation))

    with pytest.raises(CircuitOpenError):
        asyncio.run(executor.run(operation=failing_operation))


def test_service_resilience_executor_honors_timeouts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_to_thread(operation: Callable[[], str]) -> str:
        await asyncio.sleep(0.05)
        return operation()

    monkeypatch.setattr(resilience_module.asyncio, "to_thread", fake_to_thread)

    policy = ResiliencePolicy(
        name="timeout-service",
        timeout_seconds=0.01,
        max_attempts=1,
        backoff_seconds=0.0,
        circuit_failure_threshold=3,
        circuit_reset_seconds=600.0,
    )
    executor = ServiceResilienceExecutor(policy)

    def fast_operation() -> str:
        return "done"

    with pytest.raises(asyncio.TimeoutError):
        asyncio.run(executor.run(operation=fast_operation))


def test_persistent_circuit_state_shared_across_executors(tmp_path: Path) -> None:
    policy = ResiliencePolicy(
        name="shared-service",
        timeout_seconds=0.0,
        max_attempts=1,
        backoff_seconds=0.0,
        circuit_failure_threshold=1,
        circuit_reset_seconds=600.0,
    )
    state_path = tmp_path / "shared-service.json"
    executor_a = ServiceResilienceExecutor(policy, state_path=state_path)

    def failing_operation() -> None:
        raise RuntimeError("fail")

    with pytest.raises(RuntimeError):
        asyncio.run(executor_a.run(operation=failing_operation))

    executor_b = ServiceResilienceExecutor(policy, state_path=state_path)
    with pytest.raises(CircuitOpenError):
        asyncio.run(executor_b.run(operation=failing_operation))
