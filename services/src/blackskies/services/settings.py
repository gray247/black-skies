"""Application settings and configuration helpers for Black Skies."""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any, ClassVar, Literal, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)

try:  # pragma: no branch - deterministic import guard
    from pydantic_settings import BaseSettings as _BaseSettings
    from pydantic_settings import SettingsConfigDict as _SettingsConfigDict
except ModuleNotFoundError:  # pragma: no cover - behaviour asserted via tests
    logger.warning(
        "Optional dependency 'pydantic-settings' is missing. "
        "Install it for full configuration support: pip install pydantic-settings",
    )

    SettingsConfigDict = dict[str, Any]

    class BaseSettings(BaseModel):
        """Fallback settings implementation using a plain Pydantic model."""

        model_config: ClassVar[dict[str, Any]] = {"extra": "ignore"}

else:
    SettingsConfigDict = _SettingsConfigDict
    BaseSettings = _BaseSettings


Mode = Literal["offline", "live", "mock", "companion"]


class Settings(BaseSettings):
    """Pydantic-based configuration for orchestrating agents and services."""

    openai_api_key: Optional[str] = None
    black_skies_mode: Mode = "offline"
    request_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="BLACK_SKIES_",
        env_file_encoding="utf-8",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


__all__ = ["Settings", "get_settings", "Mode"]
