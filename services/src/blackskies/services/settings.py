"""Service configuration powered by Pydantic settings."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ServiceSettings(BaseSettings):
    """Runtime configuration for the FastAPI services."""

    projects_root: Path = Field(
        default_factory=lambda: Path.cwd(),
        description="Root directory that contains one or more project folders.",
    )
    model_name: str = Field(
        default="draft_synth_v1",
        description="Identifier for the deterministic draft synthesizer.",
    )
    model_provider: str = Field(
        default="local",
        description="Provider label recorded with generated artifacts.",
    )

    model_config = SettingsConfigDict(
        env_prefix="BLACKSKIES_",
        env_file=".env",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> ServiceSettings:
    """Return cached service settings loaded from the environment."""

    return ServiceSettings()


__all__ = ["ServiceSettings", "get_settings"]
