"""Tests for service configuration loading."""

from __future__ import annotations

import builtins
import importlib
import sys
import textwrap

from pathlib import Path

import pytest


def _load_service_settings():
    from blackskies.services.config import ServiceSettings

    return ServiceSettings


def test_from_environment_supports_export_and_quotes(tmp_path, monkeypatch):
    """Ensure `.env` parsing honours export prefixes and quoted values with spaces."""

    project_dir = tmp_path / "Projects" / "Black Skies"
    project_dir.mkdir(parents=True)

    env_content = (
        textwrap.dedent(
            """
        # comment line
          export BLACKSKIES_PROJECT_BASE_DIR="{}"
        """
        )
        .strip()
        .format(project_dir)
    )

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


def test_service_settings_module_has_no_optional_dependency(monkeypatch):
    """Ensure importing the module does not require `pydantic-settings`."""

    original_import = builtins.__import__

    def _block_pydantic_settings(
        name: str,
        globals: dict[str, object] | None = None,
        locals: dict[str, object] | None = None,
        fromlist: tuple[str, ...] = (),
        level: int = 0,
    ):
        if name == "pydantic_settings":
            raise ModuleNotFoundError("No module named 'pydantic_settings'")
        return original_import(name, globals, locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", _block_pydantic_settings)
    sys.modules.pop("blackskies.services.config", None)

    module = importlib.import_module("blackskies.services.config")
    settings_cls = module.ServiceSettings

    assert settings_cls.from_environment().project_base_dir.exists()
