"""Pydantic settings helpers for agent orchestration services."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, ClassVar, Literal, Optional

from pydantic import AliasChoices, Field, field_validator

BaseSettings: type[Any]

try:  # pragma: no cover - exercised via fallback tests
    from pydantic_settings import BaseSettings as PydanticBaseSettings, SettingsConfigDict
except ModuleNotFoundError:  # pragma: no cover - exercised when optional dep is absent
    from pydantic import BaseModel, ConfigDict as SettingsConfigDict

    def _parse_env_file(path: Path, encoding: str) -> dict[str, str]:
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

    def _validation_aliases(field: Any) -> list[str]:
        alias = getattr(field, "validation_alias", None)
        if alias is None:
            return []
        choices = getattr(alias, "choices", None)
        if choices is not None:
            return [str(choice) for choice in choices]
        return [str(alias)]

    class _BaseSettings(BaseModel):
        model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
            extra="ignore",
            populate_by_name=True,
        )

        def __init__(self, **data: Any) -> None:
            values = self._resolve_settings_values(data)
            super().__init__(**values)

        @classmethod
        def _resolve_settings_values(cls, data: dict[str, Any]) -> dict[str, Any]:
            values = dict(data)
            config = cls.model_config
            env_file_name = config.get("env_file")
            env_encoding = config.get("env_file_encoding", "utf-8")
            file_values: dict[str, str] = {}

            if env_file_name:
                env_file_path = Path(env_file_name)
                if not env_file_path.is_absolute():
                    env_file_path = Path.cwd() / env_file_path
                if env_file_path.exists():
                    file_values = _parse_env_file(env_file_path, env_encoding)

            for field_name, field in cls.model_fields.items():
                if field_name in values:
                    continue
                candidates = _validation_aliases(field) or [field_name.upper()]
                for candidate in candidates:
                    if candidate in os.environ:
                        values[field_name] = os.environ[candidate].strip()
                        break
                    if candidate in file_values:
                        values[field_name] = file_values[candidate].strip()
                        break

            return values

    BaseSettings = _BaseSettings
else:
    BaseSettings = PydanticBaseSettings


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
            logging.warning(
                "Environment variable '%s' is deprecated. Rename it to '%s'.",
                legacy_key,
                new_key,
            )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()


__all__ = ["Settings", "get_settings", "Mode"]
