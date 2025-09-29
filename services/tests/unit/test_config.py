"""Tests for service configuration loading."""

from __future__ import annotations

import textwrap

import pytest

from blackskies.services.config import ServiceSettings


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

    settings = ServiceSettings.from_environment()

    assert settings.project_base_dir == project_dir


def test_from_environment_validates_project_dir(tmp_path, monkeypatch):
    """An invalid project directory raises a validation error."""

    missing_dir = tmp_path / "missing space"
    env_content = f'BLACKSKIES_PROJECT_BASE_DIR="{missing_dir}"\n'
    (tmp_path / ".env").write_text(env_content, encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("BLACKSKIES_PROJECT_BASE_DIR", raising=False)

    with pytest.raises(ValueError):
        ServiceSettings.from_environment()
