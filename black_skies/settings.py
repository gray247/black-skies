"""Application settings and configuration helpers for Black Skies."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


Mode = Literal["offline", "live", "mock"]


class Settings(BaseSettings):
    """Pydantic-based configuration for orchestrating agents and services."""

    openai_api_key: Optional[str] = None
    black_skies_mode: Mode = "offline"
    request_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(env_file=".env", env_prefix="BLACK_SKIES_", env_file_encoding="utf-8")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


__all__ = ["Settings", "get_settings", "Mode"]
