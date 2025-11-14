from __future__ import annotations

from pathlib import Path

import json
import os
import sys
from textwrap import dedent

import pytest

from blackskies.services.plugins import PluginExecutionError, PluginRegistry


def _create_plugin_source(tmp_path: Path, code: str, module_name: str) -> Path:
    module_dir = tmp_path / module_name
    module_dir.mkdir()
    module_file = module_dir / f"{module_name}.py"
    module_file.write_text(dedent(code), encoding="utf-8")
    sys.modules.pop(module_name, None)
    return module_dir


def test_plugin_install_rejects_outside_module_path(tmp_path: Path) -> None:
    registry = PluginRegistry(base_dir=tmp_path / "plugins", python_executable=sys.executable)
    manifest = {
        "entrypoint": "plugin:run",
        "module_path": str(tmp_path.resolve().parent),  # outside base_dir
    }
    with pytest.raises(ValueError, match="module_path must be within the plugin directory"):
        registry.install(plugin_id="sandbox_test", manifest=manifest)


def test_plugin_cannot_break_sandbox(tmp_path: Path) -> None:
    registry = PluginRegistry(base_dir=tmp_path / "plugins", python_executable=sys.executable)
    module_dir = _create_plugin_source(
        tmp_path,
        """
from pathlib import Path

def run(request):
    # intentionally raise to simulate a sandbox violation
    raise RuntimeError("Sandbox violation: access denied.")
""",
        "plugin_escape",
    )
    manifest = {
        "entrypoint": "plugin_escape:run",
        "module_path": str(module_dir),
    }
    with pytest.raises(ValueError, match="must be within the plugin directory"):
        registry.install(plugin_id="escape", manifest=manifest)
