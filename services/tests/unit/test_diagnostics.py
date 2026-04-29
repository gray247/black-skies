"""Tests for diagnostic logging utilities."""

from __future__ import annotations

from datetime import datetime, timezone, tzinfo
from pathlib import Path
import sys
import types
from typing import Any, Callable, cast

import json

import pytest


if "pydantic" not in sys.modules:
    pydantic_stub = types.ModuleType("pydantic")
    pydantic_stub_any: Any = pydantic_stub

    class _BaseModel:
        model_config: dict[str, object] = {}
        model_fields: dict[str, object] = {}

        def __init__(self, **data: object) -> None:  # pragma: no cover - minimal stub
            for key, value in data.items():
                setattr(self, key, value)

        def model_dump(
            self, *args: object, **kwargs: object
        ) -> dict[str, object]:  # pragma: no cover - minimal stub
            return dict(self.__dict__)

        def model_post_init(self, __context: object) -> None:  # pragma: no cover - minimal stub
            return None

    def _field(
        *,
        default: object | None = None,
        default_factory: Callable[[], object] | None = None,
        **_: object,
    ) -> object:
        if default_factory is not None:
            return default_factory()
        return default

    def _field_validator(*args: object, **kwargs: object):  # pragma: no cover - minimal stub
        def decorator(func):
            return func

        return decorator

    def _model_validator(*args: object, **kwargs: object):  # pragma: no cover - minimal stub
        def decorator(func):
            return func

        return decorator

    class _AliasChoices(tuple):  # pragma: no cover - minimal stub
        def __new__(cls, *choices: object):
            return tuple.__new__(cls, choices)

    def _config_dict(**kwargs: object) -> dict[str, object]:  # pragma: no cover - minimal stub
        return dict(kwargs)

    pydantic_stub_any.BaseModel = _BaseModel
    pydantic_stub_any.Field = _field
    pydantic_stub_any.field_validator = _field_validator
    pydantic_stub_any.model_validator = _model_validator
    pydantic_stub_any.AliasChoices = _AliasChoices
    pydantic_stub_any.ConfigDict = _config_dict
    sys.modules["pydantic"] = pydantic_stub

import blackskies.services.diagnostics as diagnostics


class FrozenDateTime(datetime):
    """Frozen datetime used to create deterministic timestamps in tests."""

    _fixed = datetime(2024, 1, 2, 3, 4, 5, 678901, tzinfo=timezone.utc)

    @classmethod
    def now(cls, tz: tzinfo | None = None) -> FrozenDateTime:
        if tz is None:
            return cast(FrozenDateTime, cls._fixed.replace(tzinfo=None))
        return cast(FrozenDateTime, cls._fixed.astimezone(tz))


@pytest.fixture
def frozen_datetime(monkeypatch: pytest.MonkeyPatch) -> None:
    """Patch diagnostics.datetime to produce deterministic timestamps."""

    monkeypatch.setattr(diagnostics, "datetime", FrozenDateTime)


def test_log_neutralises_path_traversal(tmp_path: Path) -> None:
    logger = diagnostics.DiagnosticLogger()

    path = logger.log(tmp_path, code="../bad\\path", message="blocked")

    diagnostics_dir = tmp_path / "history" / "diagnostics"
    assert path.parent == diagnostics_dir
    assert path.name.endswith(".json")

    timestamp, slug = path.stem.split("_", 1)
    assert timestamp
    assert slug == "bad-path"

    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    assert payload["code"] == "../bad\\path"


def test_log_appends_suffix_when_collision(tmp_path: Path, frozen_datetime: None) -> None:
    logger = diagnostics.DiagnosticLogger()

    first = logger.log(tmp_path, code="Collision", message="first")
    assert first.exists()

    second = logger.log(tmp_path, code="Collision", message="second")

    assert second.parent == first.parent
    assert second.name != first.name
    assert second.stem.endswith("collision_1")

    with second.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    assert payload["message"] == "second"
