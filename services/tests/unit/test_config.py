"""Tests for service configuration loading."""

from __future__ import annotations

import builtins
import importlib
import sys
import textwrap

import pytest


def _load_service_settings():
    from blackskies.services.config import ServiceSettings

    return ServiceSettings


def test_from_environment_supports_export_and_quotes(tmp_path, monkeypatch):
    """Ensure `.env` parsing honours export prefixes and quoted values with spaces."""

    project_dir = tmp_path / "Projects" / "Black Skies"
    project_dir.mkdir(parents=True)

    env_content = textwrap.dedent(
        """
        # comment line
          export BLACKSKIES_PROJECT_BASE_DIR="{}"
        """
    ).strip().format(project_dir)

    (tmp_path / ".env").write_text(env_content, encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("BLACKSKIES_PROJECT_BASE_DIR", raising=False)

    settings = _load_service_settings().from_environment()

    assert settings.project_base_dir == project_dir


def test_from_environment_validates_project_dir(tmp_path, monkeypatch):
    """An invalid project directory raises a validation error."""

    missing_dir = tmp_path / "missing space"
    env_content = f'BLACKSKIES_PROJECT_BASE_DIR="{missing_dir}"\n'
    (tmp_path / ".env").write_text(env_content, encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("BLACKSKIES_PROJECT_BASE_DIR", raising=False)

    with pytest.raises(ValueError):
        _load_service_settings().from_environment()


def test_missing_dependency_raises_actionable_message(monkeypatch):
    """Surface a helpful instruction when optional tooling is not installed."""

    original_import = builtins.__import__

    def _raise_for_pydantic_settings(
        name: str,
        globals: dict[str, object] | None = None,
        locals: dict[str, object] | None = None,
        fromlist: tuple[str, ...] = (),
        level: int = 0,
    ):
        if name == "pydantic_settings":
            raise ModuleNotFoundError("No module named 'pydantic_settings'")
        return original_import(name, globals, locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", _raise_for_pydantic_settings)
    sys.modules.pop("blackskies.services.config", None)

    with pytest.raises(ModuleNotFoundError) as exc_info:
        importlib.import_module("blackskies.services.config")

    message = str(exc_info.value)
    assert "pydantic-settings" in message
    assert "Activate the Black Skies virtual environment" in message

    # Restore the real module for subsequent tests.
    monkeypatch.setattr(builtins, "__import__", original_import)
    importlib.import_module("blackskies.services.config")
