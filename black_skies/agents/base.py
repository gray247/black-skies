"""Agent base classes for Black Skies orchestration."""

from __future__ import annotations

import abc
import logging
from typing import Any, Callable

from tenacity import RetryError, retry, stop_after_attempt, wait_exponential

logger = logging.getLogger("black_skies.agents")


class AgentError(RuntimeError):
    """Raised when an agent fails after retries."""


class BaseAgent(abc.ABC):
    """Abstract agent with retry/backoff support."""

    def __init__(self, *, max_attempts: int = 3) -> None:
        self._max_attempts = max_attempts

    @abc.abstractmethod
    def run_once(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute a single attempt and return the result."""

    def run(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Execute with retries and exponential backoff."""

        retry_policy = retry(
            stop=stop_after_attempt(self._max_attempts),
            wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
            reraise=False,
        )

        @retry_policy
        def _execute() -> dict[str, Any]:
            logger.info(
                "agent.run",
                extra={"extra_payload": {"agent": self.__class__.__name__, "payload": payload}},
            )
            return self.run_once(payload)

        try:
            result = _execute()
        except RetryError as exc:  # pragma: no cover - tenacity wraps base exception
            last_exc = exc.last_attempt.exception() if exc.last_attempt else exc
            logger.error(
                "agent.failure",
                extra={"extra_payload": {"agent": self.__class__.__name__, "error": str(last_exc)}},
            )
            raise AgentError("Agent exceeded retry attempts") from last_exc
        else:
            logger.info(
                "agent.success",
                extra={"extra_payload": {"agent": self.__class__.__name__}},
            )
            return result


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
