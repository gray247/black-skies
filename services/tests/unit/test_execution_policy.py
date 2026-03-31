from __future__ import annotations

import asyncio
import threading

import pytest

from blackskies.services import execution_policy as execution_policy_module
from blackskies.services.execution_policy import (
    ExecutionPolicy,
    ExecutionPolicyRunner,
    ExecutionPolicyTimeoutError,
)


@pytest.mark.anyio("asyncio")
async def test_execution_policy_runner_async_retries_and_reports_attempts() -> None:
    policy = ExecutionPolicy(
        name="async-policy",
        timeout_seconds=0.0,
        max_attempts=3,
        backoff_seconds=0.0,
    )
    runner = ExecutionPolicyRunner(policy)
    attempts: list[int] = []
    failures: list[tuple[int, str]] = []
    retries: list[tuple[int, str]] = []

    def operation() -> str:
        attempts.append(len(attempts) + 1)
        if len(attempts) < 3:
            raise ValueError(f"boom-{len(attempts)}")
        return "ok"

    result = await runner.run_async(
        operation,
        on_failure=lambda attempt, error: failures.append((attempt, str(error))),
        on_retry=lambda attempt, error: retries.append((attempt, str(error))),
    )

    assert result == "ok"
    assert attempts == [1, 2, 3]
    assert failures == [(1, "boom-1"), (2, "boom-2")]
    assert retries == [(1, "boom-1"), (2, "boom-2")]


@pytest.mark.anyio("asyncio")
async def test_execution_policy_runner_async_cancellation_propagates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    policy = ExecutionPolicy(
        name="async-cancel",
        timeout_seconds=1.0,
        max_attempts=1,
        backoff_seconds=0.0,
    )
    runner = ExecutionPolicyRunner(policy)
    started = asyncio.Event()
    blocker = asyncio.Event()

    async def fake_to_thread(operation):
        started.set()
        await blocker.wait()
        return operation()

    monkeypatch.setattr(execution_policy_module.asyncio, "to_thread", fake_to_thread)

    task = asyncio.create_task(runner.run_async(lambda: "done"))
    await started.wait()
    task.cancel()

    with pytest.raises(asyncio.CancelledError):
        await task


def test_execution_policy_runner_sync_retries_and_backoff() -> None:
    sleep_calls: list[float] = []
    policy = ExecutionPolicy(
        name="sync-policy",
        timeout_seconds=0.0,
        max_attempts=3,
        backoff_seconds=0.25,
    )
    runner = ExecutionPolicyRunner(policy, sleep=lambda delay: sleep_calls.append(delay))
    attempts: list[int] = []
    failures: list[tuple[int, str]] = []
    retries: list[tuple[int, str]] = []

    def operation() -> str:
        attempts.append(len(attempts) + 1)
        if len(attempts) < 3:
            raise ValueError(f"boom-{len(attempts)}")
        return "ok"

    result = runner.run_sync(
        operation,
        on_failure=lambda attempt, error: failures.append((attempt, str(error))),
        on_retry=lambda attempt, error: retries.append((attempt, str(error))),
    )

    assert result == "ok"
    assert attempts == [1, 2, 3]
    assert failures == [(1, "boom-1"), (2, "boom-2")]
    assert retries == [(1, "boom-1"), (2, "boom-2")]
    assert sleep_calls == [0.25, 0.25]


def test_execution_policy_runner_sync_timeout_raises() -> None:
    policy = ExecutionPolicy(
        name="sync-timeout",
        timeout_seconds=0.01,
        max_attempts=1,
        backoff_seconds=0.0,
    )
    runner = ExecutionPolicyRunner(policy)

    def operation() -> str:
        threading.Event().wait(0.05)
        return "never"

    with pytest.raises(ExecutionPolicyTimeoutError, match="sync-timeout"):
        runner.run_sync(operation)
