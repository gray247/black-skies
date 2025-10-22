"""Service configuration utilities."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, ClassVar, cast

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

    ENV_PREFIX: ClassVar[str] = "BLACKSKIES_"
    ENV_FILE: ClassVar[str | None] = ".env"
    ENV_FILE_ENCODING: ClassVar[str] = "utf-8"

    model_config: ClassVar[ConfigDict] = ConfigDict(
        extra="ignore",
        env_prefix=ENV_PREFIX,
    )

    project_base_dir: Path = Field(
        default_factory=_default_project_dir,
        description="Base directory containing project folders.",
    )
    max_request_body_bytes: int = Field(
        default=512 * 1024,
        ge=16 * 1024,
        description="Maximum allowed size in bytes for incoming request bodies.",
    )

    @field_validator("project_base_dir")
    @classmethod
    def _ensure_project_dir_exists(cls, value: Path) -> Path:
        """Validate that the configured project directory exists."""

        if not value.exists():
            raise ValueError(f"Project base directory does not exist: {value}")
        return value

    @field_validator("max_request_body_bytes")
    @classmethod
    def _validate_body_limit(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("max_request_body_bytes must be positive")
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

        env_prefix = cls.ENV_PREFIX
        env_file_name = cls.ENV_FILE
        env_encoding = cls.ENV_FILE_ENCODING

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

        typed_overrides = cast(dict[str, Any], overrides)
        return cls(**typed_overrides)


__all__: list[str] = ["ServiceSettings"]
