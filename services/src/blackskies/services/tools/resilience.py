"""Resilience helpers for tool execution (timeouts, retries, circuit breakers)."""

from __future__ import annotations

import concurrent.futures
import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Optional

from .base import ToolContext

__all__ = [
    "ToolTimeoutError",
    "ToolCircuitOpenError",
    "ToolExecutionError",
    "ToolResilienceConfig",
    "ToolCircuitBreaker",
    "ToolRunner",
]


class ToolExecutionError(RuntimeError):
    """Base error raised when a tool fails unrecoverably."""

    def __init__(self, message: str, *, cause: BaseException | None = None) -> None:
        super().__init__(message)
        self.cause = cause


class ToolTimeoutError(ToolExecutionError):
    """Raised when a tool exceeds the configured timeout."""


class ToolCircuitOpenError(ToolExecutionError):
    """Raised when a tool's circuit breaker is open."""


@dataclass(frozen=True)
class ToolResilienceConfig:
    """Configuration for tool retry, timeout, and circuit breaker controls."""

    timeout_seconds: float = 5.0
    max_attempts: int = 3
    backoff_seconds: float = 0.25
    circuit_failure_threshold: int = 5
    circuit_reset_seconds: float = 30.0


class ToolCircuitBreaker:
    """Simple circuit breaker state machine."""

    def __init__(self, *, failure_threshold: int, reset_seconds: float) -> None:
        if failure_threshold <= 0:
            raise ValueError("failure_threshold must be greater than zero.")
        if reset_seconds < 0:
            raise ValueError("reset_seconds may not be negative.")
        self._failure_threshold = failure_threshold
        self._reset_seconds = reset_seconds
        self._failure_count = 0
        self._state = "closed"
        self._opened_at = 0.0
        self._lock = threading.Lock()

    def allow(self) -> bool:
        with self._lock:
            if self._state == "open":
                if self._reset_seconds == 0 or (
                    time.monotonic() - self._opened_at >= self._reset_seconds
                ):
                    self._state = "half-open"
                    return True
                return False
            return True

    def record_success(self) -> None:
        with self._lock:
            self._failure_count = 0
            self._state = "closed"

    def record_failure(self) -> None:
        with self._lock:
            self._failure_count += 1
            if self._failure_count >= self._failure_threshold:
                self._state = "open"
                self._opened_at = time.monotonic()


_CALL_EXECUTOR = concurrent.futures.ThreadPoolExecutor(max_workers=8, thread_name_prefix="tool")


class ToolRunner:
    """Execute tool callables with retry, timeout, and circuit breaker guards."""

    def __init__(
        self,
        *,
        config: ToolResilienceConfig | None = None,
        sleep: Callable[[float], None] | None = None,
    ) -> None:
        self._config = config or ToolResilienceConfig()
        self._sleep = sleep or time.sleep
        self._breakers: dict[str, ToolCircuitBreaker] = {}
        self._lock = threading.Lock()

    def execute(
        self,
        tool_name: str,
        operation: Callable[[], Any],
        *,
        context: Optional[ToolContext] = None,
    ) -> Any:
        """Execute ``operation`` enforcing resilience policies."""

        breaker = self._get_breaker(tool_name)
        if not breaker.allow():
            raise ToolCircuitOpenError(
                f"Tool '{tool_name}' circuit is open; refusing execution.",
            )

        last_exc: BaseException | None = None
        for attempt in range(1, self._config.max_attempts + 1):
            try:
                result = self._call_with_timeout(operation)
            except ToolTimeoutError as exc:
                last_exc = exc
                breaker.record_failure()
                if attempt >= self._config.max_attempts:
                    raise exc
                self._backoff(attempt)
                continue
            except ToolCircuitOpenError:
                # This should not occur mid-execution because allow() guards upfront,
                # but treat defensively.
                raise
            except Exception as exc:  # noqa: BLE001 - propagate after retries
                last_exc = exc
                breaker.record_failure()
                if attempt >= self._config.max_attempts:
                    raise ToolExecutionError(
                        f"Tool '{tool_name}' failed after {attempt} attempts.", cause=exc
                    ) from exc
                self._backoff(attempt)
                continue
            else:
                breaker.record_success()
                return result

        # If we exit the loop without returning or raising, raise final error.
        raise ToolExecutionError(
            f"Tool '{tool_name}' failed after {self._config.max_attempts} attempts.",
            cause=last_exc,
        )

    def _call_with_timeout(self, operation: Callable[[], Any]) -> Any:
        if self._config.timeout_seconds is None or self._config.timeout_seconds <= 0:
            return operation()
        future = _CALL_EXECUTOR.submit(operation)
        try:
            return future.result(timeout=self._config.timeout_seconds)
        except concurrent.futures.TimeoutError as exc:
            future.cancel()
            raise ToolTimeoutError(
                "Tool execution exceeded timeout.", cause=exc
            ) from exc

    def _backoff(self, attempt: int) -> None:
        delay = max(0.0, self._config.backoff_seconds * attempt)
        if delay:
            self._sleep(delay)

    def _get_breaker(self, tool_name: str) -> ToolCircuitBreaker:
        with self._lock:
            breaker = self._breakers.get(tool_name)
            if breaker is None:
                breaker = ToolCircuitBreaker(
                    failure_threshold=self._config.circuit_failure_threshold,
                    reset_seconds=self._config.circuit_reset_seconds,
                )
                self._breakers[tool_name] = breaker
            return breaker
