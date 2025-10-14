"""Application settings and configuration helpers for Black Skies."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any, ClassVar, Literal, Optional

from pathlib import Path

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)

try:  # pragma: no branch - deterministic import guard
    from pydantic_settings import BaseSettings as _BaseSettings
    from pydantic_settings import SettingsConfigDict
except ModuleNotFoundError:  # pragma: no cover - behaviour asserted via tests
    logger.warning(
        "Optional dependency 'pydantic-settings' is missing. "
        "Install it for full configuration support: pip install pydantic-settings",
    )

    class _BaseSettings(BaseModel):
        """Fallback settings implementation using a plain Pydantic model."""

        model_config: ClassVar[ConfigDict] = ConfigDict(
            extra="ignore",
            populate_by_name=True,
        )

        def __init__(self, **data: Any) -> None:
            env_data = self._load_environment()
            env_data.update(data)
            super().__init__(**env_data)

        @classmethod
        def _load_environment(cls) -> dict[str, str]:
            """Load environment overrides emulating `pydantic-settings` behaviour."""

            config = cls.model_config or {}
            env_prefix = str(config.get("env_prefix", ""))
            env_file = config.get("env_file")
            encoding = str(config.get("env_file_encoding", "utf-8"))

            file_values: dict[str, str] = {}
            if env_file:
                env_path = Path(env_file)
                if not env_path.is_absolute():
                    env_path = Path.cwd() / env_path
                if env_path.exists():
                    file_values = cls._parse_env_file(env_path, encoding)

            overrides: dict[str, str] = {}
            for field_name, field_info in cls.model_fields.items():
                for candidate in cls._candidate_env_keys(field_name, field_info, env_prefix):
                    if candidate in os.environ:
                        value = cls._coerce_env_value(os.environ[candidate])
                        if value is not None:
                            overrides[field_name] = value
                            break
                    if candidate in file_values:
                        overrides[field_name] = file_values[candidate]
                        break

            return overrides

        @staticmethod
        def _parse_env_file(path: Path, encoding: str) -> dict[str, str]:
            """Parse `.env` style files with optional export statements."""

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

        @staticmethod
        def _coerce_env_value(raw_value: str) -> str | None:
            """Normalize raw environment values by trimming surrounding whitespace."""

            cleaned = raw_value.strip()
            if not cleaned:
                return None
            return cleaned

        @staticmethod
        def _candidate_env_keys(field_name: str, field_info: Any, env_prefix: str) -> list[str]:
            """Return candidate environment keys for a field ordered by preference."""

            candidates: list[str] = []
            alias = getattr(field_info, "validation_alias", None)
            if isinstance(alias, AliasChoices):
                for choice in alias.choices:
                    if isinstance(choice, str):
                        candidates.append(choice)
            elif isinstance(alias, str):
                candidates.append(alias)

            if not candidates:
                base_key = (field_info.alias or field_name).upper()
                if env_prefix and not base_key.startswith(env_prefix):
                    candidates.append(f"{env_prefix}{base_key}")
                else:
                    candidates.append(base_key)

            # Ensure we don't return duplicates while preserving order.
            seen: set[str] = set()
            ordered: list[str] = []
            for candidate in candidates:
                if candidate not in seen:
                    ordered.append(candidate)
                    seen.add(candidate)
            return ordered

    SettingsConfigDict = ConfigDict

BaseSettings = _BaseSettings

Mode = Literal["offline", "live", "mock", "companion"]
VALID_MODES: tuple[Mode, ...] = ("offline", "live", "mock", "companion")


class Settings(BaseSettings):
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

    model_config: ClassVar[ConfigDict] = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
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


__all__: list[str] = ["Settings", "get_settings", "Mode", "BaseSettings"]
