"""Service configuration utilities."""

from __future__ import annotations

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class ServiceSettings(BaseSettings):
    """Runtime configuration for the FastAPI services."""

    model_config = SettingsConfigDict(
        env_prefix="BLACKSKIES_",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    project_base_dir: Path = Field(
        default_factory=lambda: Path.cwd() / "sample_project",
        description="Base directory containing project folders.",
    )

    @field_validator("project_base_dir")
    @classmethod
    def _ensure_project_dir_exists(cls, value: Path) -> Path:
        """Validate that the configured project directory exists."""

        if not value.exists():
            raise ValueError(f"Project base directory does not exist: {value}")
        return value

    @classmethod
    def from_environment(cls) -> "ServiceSettings":
        """Load settings from environment variables or a `.env` file."""

        return cls()


__all__ = ["ServiceSettings"]
