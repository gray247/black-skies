"""Application configuration for Black Skies services."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import BaseSettings, Field, ValidationError


def _default_project_root() -> Path:
    """Compute the bundled sample project path as a fallback."""

    sample_root = Path(__file__).resolve().parents[5] / "sample_project" / "Esther_Estate"
    return sample_root


class Settings(BaseSettings):
    """Runtime configuration for the service layer."""

    project_root: Annotated[
        Path,
        Field(
            description="Path to the active project folder.",
            default_factory=_default_project_root,
        ),
    ]

    model_config = {
        "env_prefix": "BLACKSKIES_",
        "env_file": ".env",
        "frozen": True,
    }

    @property
    def drafts_directory(self) -> Path:
        """Return the directory containing project draft files."""

        return self.project_root / "drafts"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Load settings from environment and cache the result for reuse."""

    try:
        return Settings()
    except ValidationError as exc:  # pragma: no cover - raised during startup misconfiguration
        raise RuntimeError("Invalid service configuration") from exc


def reset_settings_cache() -> None:
    """Clear the cached settings; intended for tests."""

    get_settings.cache_clear()
