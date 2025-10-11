"""Service configuration utilities."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, ClassVar, Mapping, cast

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class ServiceSettings(BaseModel):
    """Runtime configuration for the FastAPI services."""

    model_config: ClassVar[ConfigDict] = ConfigDict(
        env_prefix="BLACKSKIES_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_base_dir: Path = Field(
        default_factory=_default_project_dir,
        description="Base directory containing project folders.",
    )

    @field_validator("project_base_dir")
    @classmethod
    def _ensure_project_dir_exists(cls, value: Path) -> Path:
        """Validate that the configured project directory exists."""

        if not value.exists():
            raise ValueError(f"Project base directory does not exist: {value}")
        return value

    @staticmethod
    def _parse_env_file(path: Path, encoding: str) -> dict[str, str]:
        """Parse an environment file supporting `export` and quoted values."""

        parsed: dict[str, str] = {}

        for raw_line in path.read_text(encoding=encoding).splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export ") :].strip()

            if "=" not in line:
                continue

            key, raw_value = line.split("=", 1)
            key = key.strip()
            value = raw_value.strip()

            if value and value[0] == value[-1] and value[0] in {'"', "'"}:
                value = value[1:-1]

            parsed[key] = value

        return parsed

    @classmethod
    def from_environment(cls) -> "ServiceSettings":
        """Load settings from environment variables or a `.env` file."""

        config: Mapping[str, Any] = cast(Mapping[str, Any], cls.model_config)
        env_prefix = str(config.get("env_prefix", ""))
        env_file_name = config.get("env_file")
        env_encoding = str(config.get("env_file_encoding", "utf-8"))

        file_values: dict[str, str] = {}
        if env_file_name:
            env_file_path = Path(env_file_name)
            if not env_file_path.is_absolute():
                env_file_path = Path.cwd() / env_file_path
            if env_file_path.exists():
                file_values = cls._parse_env_file(env_file_path, env_encoding)

        overrides: dict[str, str] = {}
        for field_name in cls.model_fields:
            env_key = f"{env_prefix}{field_name.upper()}"
            if env_key in os.environ:
                overrides[field_name] = os.environ[env_key]
            elif env_key in file_values:
                overrides[field_name] = file_values[env_key]

        return cls(**overrides)


__all__ = ["ServiceSettings"]
