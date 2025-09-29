"""Agent base classes for Black Skies orchestration."""

from __future__ import annotations

import abc
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable

logger = logging.getLogger("black_skies.agents")


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

    def __init__(self, *, max_attempts: int = 3, backoff: ExponentialBackoff | None = None) -> None:
        self._max_attempts = max_attempts
        self._backoff = backoff or ExponentialBackoff()

    @abc.abstractmethod
    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute a single attempt and return the result."""

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute with retries and exponential backoff."""

        logger.info(
            "agent.run",
            extra={"extra_payload": {"agent": self.__class__.__name__, "payload": payload}},
        )

        last_exc: BaseException | None = None
        for attempt in range(1, self._max_attempts + 1):
            try:
                result = self.run_once(payload)
            except Exception as exc:  # noqa: BLE001 - propagate as AgentError with context
                last_exc = exc
                logger.warning(
                    "agent.retry",
                    extra={
                        "extra_payload": {
                            "agent": self.__class__.__name__,
                            "attempt": attempt,
                            "max_attempts": self._max_attempts,
                            "error": str(exc),
                        }
                    },
                )
                if attempt >= self._max_attempts:
                    break
                delay = self._backoff.compute(attempt)
                if delay > 0:
                    time.sleep(delay)
            else:
                logger.info(
                    "agent.success",
                    extra={"extra_payload": {"agent": self.__class__.__name__}},
                )
                return result

        logger.error(
            "agent.failure",
            extra={"extra_payload": {"agent": self.__class__.__name__, "error": str(last_exc)}},
        )
        raise AgentError("Agent exceeded retry attempts") from last_exc


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
