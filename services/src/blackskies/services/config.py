"""Service configuration utilities."""

from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel, Field


class ServiceSettings(BaseModel):
    """Runtime configuration for the FastAPI services."""

    project_base_dir: Path = Field(
        default_factory=lambda: Path.cwd() / "sample_project",
        description="Base directory containing project folders.",
    )

    @classmethod
    def from_environment(cls) -> "ServiceSettings":
        """Load settings from environment variables or fall back to defaults."""

        env_value = os.getenv("BLACKSKIES_PROJECT_BASE_DIR")
        if env_value:
            return cls(project_base_dir=Path(env_value))
        env_path = Path(".env")
        if env_path.exists():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                if not line or line.strip().startswith("#"):
                    continue
                key, _, value = line.partition("=")
                if key.strip() == "BLACKSKIES_PROJECT_BASE_DIR":
                    return cls(project_base_dir=Path(value.strip()))
        return cls()


__all__ = ["ServiceSettings"]
