"""Application settings and configuration helpers for Black Skies."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any, Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)

SettingsBase: type[BaseModel]
SettingsConfigDict: ConfigDict

try:  # pragma: no branch - deterministic import guard
    from pydantic_settings import BaseSettings as _PydanticBaseSettings
    from pydantic_settings import SettingsConfigDict as _PydanticSettingsConfigDict
except ModuleNotFoundError:  # pragma: no cover - behaviour asserted via tests
    logger.warning(
        "Optional dependency 'pydantic-settings' is missing. "
        "Install it for full configuration support: pip install pydantic-settings",
    )

    class _FallbackSettings(BaseModel):
        """Fallback settings implementation using a plain Pydantic model."""

        model_config = ConfigDict(extra="ignore")

    SettingsBase = _FallbackSettings
    SettingsConfigDict = ConfigDict
else:
    SettingsBase = _PydanticBaseSettings
    SettingsConfigDict = _PydanticSettingsConfigDict


BaseSettings = SettingsBase


Mode = Literal["offline", "live", "mock", "companion"]
VALID_MODES: tuple[Mode, ...] = ("offline", "live", "mock", "companion")


class Settings(SettingsBase):
    """Pydantic-based configuration for orchestrating agents and services."""

    openai_api_key: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices(
            "BLACK_SKIES_OPENAI_API_KEY",
            "OPENAI_API_KEY",
        ),
    )
    black_skies_mode: Mode = Field(
        default="offline",
        validation_alias=AliasChoices(
            "BLACK_SKIES_MODE",
            "BLACK_SKIES_BLACK_SKIES_MODE",
        ),
    )
    request_timeout_seconds: float = Field(
        default=30.0,
        validation_alias=AliasChoices(
            "BLACK_SKIES_REQUEST_TIMEOUT_SECONDS",
            "REQUEST_TIMEOUT_SECONDS",
        ),
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("black_skies_mode", mode="before")
    @classmethod
    def _normalise_mode(cls, value: object) -> Mode | object:
        """Normalise mode strings to recognised literal values."""

        if isinstance(value, str):
            candidate = value.strip().lower()
            if candidate in VALID_MODES:
                return candidate
        return value

    def model_post_init(self, __context: Any) -> None:
        """Inject compatibility for legacy environment variables after validation."""

        super().model_post_init(__context)

        new_key = "BLACK_SKIES_MODE"
        legacy_key = "BLACK_SKIES_BLACK_SKIES_MODE"

        if os.getenv(legacy_key) and not os.getenv(new_key):
            logger.warning(
                "Environment variable '%s' is deprecated. Rename it to '%s'.",
                legacy_key,
                new_key,
            )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


__all__ = ["Settings", "get_settings", "Mode", "BaseSettings"]
