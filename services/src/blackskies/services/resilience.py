"""Resilience helpers for long-running service routines."""

from __future__ import annotations

import asyncio
import json
import logging
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Dict, Generic, TypeVar

from .persistence.atomic import write_json_atomic
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


class PersistentCircuitBreaker:
    """Circuit breaker that persists its state for cross-worker coordination."""

    def __init__(
        self,
        *,
        state_path: Path,
        failure_threshold: int,
        reset_seconds: float,
    ) -> None:
        if failure_threshold <= 0:
            raise ValueError("failure_threshold must be greater than zero.")
        if reset_seconds < 0:
            raise ValueError("reset_seconds may not be negative.")
        self._state_path = state_path
        self._failure_threshold = failure_threshold
        self._reset_seconds = reset_seconds
        self._lock = threading.Lock()

    def allow(self) -> bool:
        with self._lock:
            state = self._read_state()
            if state["state"] == "open":
                if self._reset_seconds == 0 or (
                    time.time() - state["opened_at"] >= self._reset_seconds
                ):
                    self._write_state({"state": "half-open", "failure_count": 0, "opened_at": 0.0})
                    return True
                return False
            return True

    def record_success(self) -> None:
        with self._lock:
            self._write_state({"state": "closed", "failure_count": 0, "opened_at": 0.0})

    def record_failure(self) -> None:
        with self._lock:
            state = self._read_state()
            failure_count = state["failure_count"] + 1
            if state["state"] == "half-open":
                failure_count = self._failure_threshold
            if failure_count >= self._failure_threshold:
                self._write_state(
                    {
                        "state": "open",
                        "failure_count": self._failure_threshold,
                        "opened_at": time.time(),
                    }
                )
            else:
                self._write_state(
                    {"state": "closed", "failure_count": failure_count, "opened_at": 0.0}
                )

    def _read_state(self) -> dict[str, Any]:
        default = {"state": "closed", "failure_count": 0, "opened_at": 0.0}
        try:
            if not self._state_path.exists():
                return default
            with self._state_path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
        except (OSError, json.JSONDecodeError) as exc:
            LOGGER.debug("resilience.state_load_failed", extra={"extra_payload": {"error": str(exc)}})
            return default

        state = {
            "state": data.get("state", "closed"),
            "failure_count": int(data.get("failure_count", 0) or 0),
            "opened_at": float(data.get("opened_at", 0.0) or 0.0),
        }
        if state["state"] not in {"open", "closed", "half-open"}:
            state["state"] = "closed"
        if state["failure_count"] < 0:
            state["failure_count"] = 0
        return state

    def _write_state(self, state: dict[str, Any]) -> None:
        self._state_path.parent.mkdir(parents=True, exist_ok=True)
        write_json_atomic(
            self._state_path,
            {
                "state": state.get("state", "closed"),
                "failure_count": state.get("failure_count", 0),
                "opened_at": state.get("opened_at", 0.0),
            },
            durable=False,
        )


class ServiceResilienceExecutor(Generic[T]):
    """Execute synchronous service operations with resilience controls."""

    def __init__(self, policy: ResiliencePolicy, *, state_path: Path | None = None) -> None:
        if policy.max_attempts <= 0:
            raise ValueError("policy.max_attempts must be at least 1")
        if policy.timeout_seconds is not None and policy.timeout_seconds < 0:
            raise ValueError("policy.timeout_seconds may not be negative")
        self._policy = policy
        breaker: ToolCircuitBreaker | PersistentCircuitBreaker
        if state_path is not None:
            breaker = PersistentCircuitBreaker(
                state_path=state_path,
                failure_threshold=policy.circuit_failure_threshold,
                reset_seconds=policy.circuit_reset_seconds,
            )
        else:
            breaker = ToolCircuitBreaker(
                failure_threshold=policy.circuit_failure_threshold,
                reset_seconds=policy.circuit_reset_seconds,
            )
        self._breaker = breaker

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

    def __init__(
        self,
        policies: Dict[str, ResiliencePolicy],
        *,
        state_dir: Path | None = None,
    ) -> None:
        self._executors: Dict[str, ServiceResilienceExecutor[Any]] = {}
        if state_dir is not None:
            state_dir.mkdir(parents=True, exist_ok=True)
        for name, policy in policies.items():
            state_path = state_dir.joinpath(f"{name}.json") if state_dir else None
            self._executors[name] = ServiceResilienceExecutor(policy, state_path=state_path)

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
    "PersistentCircuitBreaker",
    "ServiceResilienceExecutor",
    "ServiceResilienceRegistry",
]
