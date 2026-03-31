"""Shared execution-policy helpers for service work."""

from __future__ import annotations

import asyncio
import concurrent.futures
import time
from dataclasses import dataclass
from typing import Callable, TypeVar

T = TypeVar("T")

_EXECUTOR = concurrent.futures.ThreadPoolExecutor(
    max_workers=8,
    thread_name_prefix="execution-policy",
)


class ExecutionPolicyError(RuntimeError):
    """Base error raised by the shared execution-policy layer."""


class ExecutionPolicyTimeoutError(ExecutionPolicyError):
    """Raised when a policy-bound operation exceeds its timeout."""


@dataclass(frozen=True)
class ExecutionPolicy:
    """Policy settings for retries, timeouts, and backoff."""

    name: str
    timeout_seconds: float
    max_attempts: int = 1
    backoff_seconds: float = 0.0


class ExecutionPolicyRunner:
    """Run synchronous service work under one retry/timeout policy."""

    def __init__(self, policy: ExecutionPolicy, *, sleep: Callable[[float], None] | None = None) -> None:
        if policy.max_attempts <= 0:
            raise ValueError("policy.max_attempts must be at least 1")
        if policy.timeout_seconds < 0:
            raise ValueError("policy.timeout_seconds may not be negative")
        if policy.backoff_seconds < 0:
            raise ValueError("policy.backoff_seconds may not be negative")
        self._policy = policy
        self._sleep = sleep or time.sleep

    @property
    def policy(self) -> ExecutionPolicy:
        return self._policy

    async def run_async(
        self,
        operation: Callable[[], T],
        *,
        retryable: Callable[[BaseException], bool] | None = None,
        on_retry: Callable[[int, BaseException], None] | None = None,
        on_failure: Callable[[int, BaseException], None] | None = None,
    ) -> T:
        """Execute a synchronous operation on a worker thread with retries."""

        return await self._run_async(
            operation,
            retryable=retryable,
            on_retry=on_retry,
            on_failure=on_failure,
        )

    def run_sync(
        self,
        operation: Callable[[], T],
        *,
        retryable: Callable[[BaseException], bool] | None = None,
        on_retry: Callable[[int, BaseException], None] | None = None,
        on_failure: Callable[[int, BaseException], None] | None = None,
    ) -> T:
        """Execute a synchronous operation in a background thread with retries."""

        return self._run_sync(
            operation,
            retryable=retryable,
            on_retry=on_retry,
            on_failure=on_failure,
        )

    async def _run_async(
        self,
        operation: Callable[[], T],
        *,
        retryable: Callable[[BaseException], bool] | None = None,
        on_retry: Callable[[int, BaseException], None] | None = None,
        on_failure: Callable[[int, BaseException], None] | None = None,
    ) -> T:
        retryable = retryable or (lambda _error: True)
        last_error: BaseException | None = None

        for attempt in range(1, self._policy.max_attempts + 1):
            try:
                if self._policy.timeout_seconds > 0:
                    async with asyncio.timeout(self._policy.timeout_seconds):
                        return await asyncio.to_thread(operation)
                return await asyncio.to_thread(operation)
            except asyncio.CancelledError:
                raise
            except asyncio.TimeoutError as exc:
                last_error = ExecutionPolicyTimeoutError(
                    f"Operation '{self._policy.name}' timed out after {self._policy.timeout_seconds} seconds."
                )
                if on_failure is not None:
                    on_failure(attempt, last_error)
                if attempt >= self._policy.max_attempts or not retryable(last_error):
                    raise last_error from exc
                if on_retry is not None:
                    on_retry(attempt, last_error)
            except BaseException as exc:
                if isinstance(exc, Exception):
                    last_error = exc
                    if on_failure is not None:
                        on_failure(attempt, exc)
                    if attempt >= self._policy.max_attempts or not retryable(exc):
                        raise
                    if on_retry is not None:
                        on_retry(attempt, exc)
                else:
                    raise

            if attempt < self._policy.max_attempts:
                await asyncio.sleep(max(0.0, self._policy.backoff_seconds))

        assert last_error is not None
        raise last_error

    def _run_sync(
        self,
        operation: Callable[[], T],
        *,
        retryable: Callable[[BaseException], bool] | None = None,
        on_retry: Callable[[int, BaseException], None] | None = None,
        on_failure: Callable[[int, BaseException], None] | None = None,
    ) -> T:
        retryable = retryable or (lambda _error: True)
        last_error: BaseException | None = None

        for attempt in range(1, self._policy.max_attempts + 1):
            future = _EXECUTOR.submit(operation)
            try:
                if self._policy.timeout_seconds > 0:
                    return future.result(timeout=self._policy.timeout_seconds)
                return future.result()
            except concurrent.futures.TimeoutError as exc:
                future.cancel()
                last_error = ExecutionPolicyTimeoutError(
                    f"Operation '{self._policy.name}' timed out after {self._policy.timeout_seconds} seconds."
                )
                if on_failure is not None:
                    on_failure(attempt, last_error)
                if attempt >= self._policy.max_attempts or not retryable(last_error):
                    raise last_error from exc
                if on_retry is not None:
                    on_retry(attempt, last_error)
            except BaseException as exc:
                if isinstance(exc, Exception):
                    last_error = exc
                    if on_failure is not None:
                        on_failure(attempt, exc)
                    if attempt >= self._policy.max_attempts or not retryable(exc):
                        raise
                    if on_retry is not None:
                        on_retry(attempt, exc)
                else:
                    raise

            if attempt < self._policy.max_attempts:
                self._sleep(max(0.0, self._policy.backoff_seconds))

        assert last_error is not None
        raise last_error


__all__ = [
    "ExecutionPolicy",
    "ExecutionPolicyError",
    "ExecutionPolicyRunner",
    "ExecutionPolicyTimeoutError",
]
