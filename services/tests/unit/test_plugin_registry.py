from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

from blackskies.services.plugins import PluginExecutionError, PluginRegistry


@pytest.fixture()
def plugin_manifest(tmp_path: Path) -> tuple[str, Path, Path]:
    plugin_id = "sample"
    plugin_dir = tmp_path / "plugin_src"
    plugin_dir.mkdir()
    module_path = plugin_dir / "example.py"
    module_path.write_text(
        """
from __future__ import annotations

def run(request: dict[str, object]) -> dict[str, object]:
    value = request.get("value")
    return {"value": value, "module": __name__}
""",
        encoding="utf-8",
    )
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(
        json.dumps({
            "entrypoint": "example:run",
            "module_path": str(plugin_dir),
        }),
        encoding="utf-8",
    )
    return plugin_id, manifest_path, plugin_dir


def test_plugin_registry_execute(plugin_manifest: tuple[str, Path, Path], tmp_path: Path) -> None:
    plugin_id, manifest_path, _ = plugin_manifest
    registry = PluginRegistry(base_dir=tmp_path / "registry", python_executable=sys.executable)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    registry.install(plugin_id=plugin_id, manifest=manifest, source_path=None)

    response = registry.execute(plugin_id, {"value": 42})
    assert response == {"value": 42, "module": "example"}


def test_plugin_registry_disable(plugin_manifest: tuple[str, Path, Path], tmp_path: Path) -> None:
    plugin_id, manifest_path, _ = plugin_manifest
    registry = PluginRegistry(base_dir=tmp_path / "registry", python_executable=sys.executable)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    registry.install(plugin_id=plugin_id, manifest=manifest)
    registry.set_enabled(plugin_id, False)

    with pytest.raises(PluginExecutionError):
        registry.execute(plugin_id, {})
