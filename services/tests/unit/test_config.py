"""Tests for service configuration loading."""

from __future__ import annotations

import builtins
import importlib
import sys
import textwrap

import logging
from pathlib import Path

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


def test_default_project_dir_falls_back_to_repo_root(monkeypatch):
    """When running inside the services directory, locate the repository sample project."""

    repo_root = Path(__file__).resolve().parents[3]
    services_dir = repo_root / "services"
    sample_project = repo_root / "sample_project"

    assert sample_project.exists()

    monkeypatch.chdir(services_dir)
    monkeypatch.delenv("BLACKSKIES_PROJECT_BASE_DIR", raising=False)

    settings = _load_service_settings().from_environment()

    assert settings.project_base_dir == sample_project


def test_missing_dependency_falls_back_to_base_model(monkeypatch, caplog):
    """Fallback to a BaseModel-powered settings implementation when optional deps are absent."""

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

    with caplog.at_level(logging.WARNING):
        module = importlib.import_module("blackskies.services.config")

    assert "pydantic-settings" in caplog.text

    settings_cls = module.ServiceSettings

    from pydantic import BaseModel

    assert issubclass(settings_cls, BaseModel)
    assert settings_cls.model_config["env_prefix"] == "BLACKSKIES_"
    assert settings_cls.from_environment().project_base_dir.exists()

    # Restore the real module for subsequent tests.
    monkeypatch.setattr(builtins, "__import__", original_import)
    sys.modules.pop("blackskies.services.config", None)
    importlib.import_module("blackskies.services.config")
