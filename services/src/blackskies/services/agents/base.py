"""Agent base classes for Black Skies orchestration."""

from __future__ import annotations

import abc
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable, Iterable

logger = logging.getLogger("blackskies.services.agents")


class AgentError(RuntimeError):
    """Raised when an agent fails after retries."""


@dataclass(frozen=True)
class ExponentialBackoff:
    """Configuration for exponential backoff timing."""

    multiplier: float = 0.5
    min_interval: float = 0.5
    max_interval: float = 4.0

    def compute(self, attempt: int) -> float:
        """Return the delay before the next attempt."""

        delay = self.multiplier * (2 ** (attempt - 1))
        bounded = max(self.min_interval, delay)
        return min(self.max_interval, bounded)


class BaseAgent(abc.ABC):
    """Abstract agent with retry/backoff support."""

    def __init__(
        self,
        *,
        max_attempts: int = 3,
        backoff: ExponentialBackoff | None = None,
        sleep: Callable[[float], None] | None = None,
    ) -> None:
        if max_attempts <= 0:
            raise ValueError("max_attempts must be greater than zero.")
        self._max_attempts = max_attempts
        self._backoff = backoff or ExponentialBackoff()
        self._sleep = sleep or time.sleep

    @abc.abstractmethod
    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute a single attempt and return the result."""

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute with retries and exponential backoff."""

        logger.info(
            "agent.run",
            extra={"extra_payload": {"agent": self.__class__.__name__, "payload": payload}},
        )

        try:
            result = self._execute_with_retries(payload)
        except AgentError:
            raise
        except Exception as exc:  # pragma: no cover - unexpected failure surface
            raise AgentError("Agent execution failed unexpectedly.") from exc

        logger.info(
            "agent.success",
            extra={"extra_payload": {"agent": self.__class__.__name__}},
        )
        return result

    # Internal helpers --------------------------------------------------

    def _execute_with_retries(self, payload: dict[str, Any]) -> dict[str, Any]:
        last_exc: BaseException | None = None
        for attempt in self._attempts():
            try:
                return self.run_once(payload)
            except Exception as exc:  # noqa: BLE001 - propagate via AgentError
                last_exc = exc
                self._log_retry(attempt, exc)
                if attempt >= self._max_attempts:
                    break
                self._backoff_sleep(attempt)

        self._log_failure(last_exc)
        raise AgentError("Agent exceeded retry attempts") from last_exc

    def _attempts(self) -> Iterable[int]:
        return range(1, self._max_attempts + 1)

    def _backoff_sleep(self, attempt: int) -> None:
        delay = max(0.0, self._backoff.compute(attempt))
        if delay:
            self._sleep(delay)

    def _log_retry(self, attempt: int, error: BaseException) -> None:
        logger.warning(
            "agent.retry",
            extra={
                "extra_payload": {
                    "agent": self.__class__.__name__,
                    "attempt": attempt,
                    "max_attempts": self._max_attempts,
                    "error": str(error),
                }
            },
        )

    def _log_failure(self, error: BaseException | None) -> None:
        logger.error(
            "agent.failure",
            extra={"extra_payload": {"agent": self.__class__.__name__, "error": str(error)}},
        )


class OutlineAgent(BaseAgent):
    def __init__(self, worker: Callable[[dict[str, Any]], dict[str, Any]]) -> None:
        super().__init__()
        self._worker = worker

    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._worker(payload)


class DraftAgent(BaseAgent):
    def __init__(self, worker: Callable[[dict[str, Any]], dict[str, Any]]) -> None:
        super().__init__()
        self._worker = worker

    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._worker(payload)


class RewriteAgent(BaseAgent):
    def __init__(self, worker: Callable[[dict[str, Any]], dict[str, Any]]) -> None:
        super().__init__()
        self._worker = worker

    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._worker(payload)


class CritiqueAgent(BaseAgent):
    def __init__(self, worker: Callable[[dict[str, Any]], dict[str, Any]]) -> None:
        super().__init__()
        self._worker = worker

    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._worker(payload)


__all__ = [
    "AgentError",
    "BaseAgent",
    "OutlineAgent",
    "DraftAgent",
    "RewriteAgent",
    "CritiqueAgent",
]
