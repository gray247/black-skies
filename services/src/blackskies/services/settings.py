"""Pydantic settings helpers for agent orchestration services."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, ClassVar, Literal, Optional

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


def _default_project_dir() -> Path:
    """Determine a sensible default project directory."""

    cwd_candidate = Path.cwd() / "sample_project"
    if cwd_candidate.exists():
        return cwd_candidate

    module_path = Path(__file__).resolve()
    for parent in module_path.parents:
        candidate = parent / "sample_project"
        if candidate.exists():
            return candidate

    return cwd_candidate


Mode = Literal["offline", "live", "mock", "companion"]
VALID_MODES: tuple[Mode, ...] = ("offline", "live", "mock", "companion")


class Settings(BaseSettings):
    """Pydantic-based configuration for orchestrating agents and services."""

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

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
    project_base_dir: Path = Field(
        default_factory=_default_project_dir,
        validation_alias=AliasChoices(
            "BLACK_SKIES_PROJECT_BASE_DIR",
            "PROJECT_BASE_DIR",
        ),
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


__all__ = ["Settings", "get_settings", "Mode"]
