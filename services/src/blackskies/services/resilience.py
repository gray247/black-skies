"""Resilience helpers for long-running service routines."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, Callable, Dict, Generic, TypeVar

from .tools.resilience import ToolCircuitBreaker

LOGGER = logging.getLogger("blackskies.services.resilience")

T = TypeVar("T")


class CircuitOpenError(RuntimeError):
    """Raised when a service circuit breaker refuses new work."""


@dataclass(frozen=True)
class ResiliencePolicy:
    """Configuration for service retries, timeouts, and circuit breaking."""

    name: str
    timeout_seconds: float
    max_attempts: int = 1
    backoff_seconds: float = 0.5
    circuit_failure_threshold: int = 3
    circuit_reset_seconds: float = 30.0


class ServiceResilienceExecutor(Generic[T]):
    """Execute synchronous service operations with resilience controls."""

    def __init__(self, policy: ResiliencePolicy) -> None:
        if policy.max_attempts <= 0:
            raise ValueError("policy.max_attempts must be at least 1")
        if policy.timeout_seconds is not None and policy.timeout_seconds < 0:
            raise ValueError("policy.timeout_seconds may not be negative")
        self._policy = policy
        self._breaker = ToolCircuitBreaker(
            failure_threshold=policy.circuit_failure_threshold,
            reset_seconds=policy.circuit_reset_seconds,
        )

    async def run(self, *, label: str | None = None, operation: Callable[[], T]) -> T:
        """Execute ``operation`` honoring retry, timeout, and circuit breaker rules."""

        name = label or self._policy.name
        if not self._breaker.allow():
            LOGGER.warning("service.circuit_open", extra={"extra_payload": {"service": name}})
            raise CircuitOpenError(f"Service '{name}' circuit is open")

        attempts = self._policy.max_attempts
        timeout = self._policy.timeout_seconds
        backoff = max(0.0, self._policy.backoff_seconds)
        last_error: BaseException | None = None

        for attempt in range(1, attempts + 1):
            try:
                if timeout and timeout > 0:
                    async with asyncio.timeout(timeout):
                        result = await asyncio.to_thread(operation)
                else:
                    result = await asyncio.to_thread(operation)
            except asyncio.CancelledError:
                raise
            except asyncio.TimeoutError as exc:
                last_error = exc
                self._breaker.record_failure()
                LOGGER.warning(
                    "service.timeout",
                    extra={
                        "extra_payload": {
                            "service": name,
                            "attempt": attempt,
                            "timeout_seconds": timeout,
                        }
                    },
                )
            except Exception as exc:  # noqa: BLE001 - funnel through retries
                last_error = exc
                self._breaker.record_failure()
                LOGGER.warning(
                    "service.failure",
                    extra={
                        "extra_payload": {
                            "service": name,
                            "attempt": attempt,
                            "error": str(exc),
                        }
                    },
                )
            else:
                self._breaker.record_success()
                return result

            if attempt < attempts and backoff:
                await asyncio.sleep(backoff * attempt)

        assert last_error is not None
        raise last_error


class ServiceResilienceRegistry:
    """Registry of resilience executors keyed by service name."""

    def __init__(self, policies: Dict[str, ResiliencePolicy]) -> None:
        self._executors: Dict[str, ServiceResilienceExecutor[Any]] = {
            name: ServiceResilienceExecutor(policy) for name, policy in policies.items()
        }

    def get(self, name: str) -> ServiceResilienceExecutor[Any]:
        try:
            return self._executors[name]
        except KeyError as exc:
            raise KeyError(f"No resilience policy registered for service '{name}'") from exc

    def __getitem__(self, name: str) -> ServiceResilienceExecutor[Any]:
        return self.get(name)

    @property
    def analytics(self) -> ServiceResilienceExecutor[Any]:
        return self.get("analytics")

    @property
    def critique(self) -> ServiceResilienceExecutor[Any]:
        return self.get("critique")


__all__ = [
    "CircuitOpenError",
    "ResiliencePolicy",
    "ServiceResilienceExecutor",
    "ServiceResilienceRegistry",
]
