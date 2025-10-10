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


def test_env_example_documents_service_settings():
    """The example env file should document every ServiceSettings field."""

    settings_cls = _load_service_settings()
    repo_root = Path(__file__).resolve().parents[3]
    env_example = repo_root / ".env.example"

    assert env_example.exists(), ".env.example is missing from the repository root"

    documented_keys: set[str] = set()
    for raw_line in env_example.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, _ = line.split("=", 1)
        documented_keys.add(key.strip())

    env_prefix = str(settings_cls.model_config.get("env_prefix", ""))
    expected_keys = {
        f"{env_prefix}{field_name.upper()}" for field_name in settings_cls.model_fields
    }

    missing = expected_keys - documented_keys
    assert not missing, f"Update .env.example to include: {sorted(missing)}"
