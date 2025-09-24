"""Application configuration and settings management."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings for the Black Skies service stack."""

    project_root: Path = Field(
        description="Filesystem path to the active Black Skies project.",
    )
    schema_version: str = Field(
        default="DraftUnitSchema v1",
        description="Schema identifier returned for draft unit payloads.",
    )
    anchor_window: int = Field(
        default=4,
        ge=0,
        description="Token context window for diff anchoring on each side.",
    )
    history_dirname: str = Field(
        default="history",
        description="Directory name for project history artifacts.",
    )
    diagnostics_dirname: str = Field(
        default="diagnostics",
        description="Subdirectory under history for diagnostics logs.",
    )

    model_config = SettingsConfigDict(
        env_prefix="BLACKSKIES_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("project_root", mode="before")
    @classmethod
    def _expand_project_root(cls, value: str | Path) -> Path:
        path = Path(value).expanduser()
        return path


@lru_cache(maxsize=1)
def _cached_settings() -> Settings:
    """Return cached settings loaded from the environment."""

    return Settings()


def get_settings() -> Settings:
    """Return the cached settings instance for FastAPI dependencies."""

    return _cached_settings()


def reset_settings_cache() -> None:
    """Reset the cached settings, useful for tests overriding environment."""

    _cached_settings.cache_clear()
