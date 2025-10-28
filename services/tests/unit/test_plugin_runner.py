from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

from blackskies.services.plugins.host import PluginExecutionError, launch_plugin


@pytest.fixture()
def sample_plugin(tmp_path: Path) -> Path:
    plugin_dir = tmp_path / "sample_plugin"
    plugin_dir.mkdir()
    module_path = plugin_dir / "plugin_module.py"
    module_path.write_text(
        """
from __future__ import annotations

def run(request: dict[str, object]) -> dict[str, object]:
    return {"echo": request.get("payload"), "invoked": True}
""",
        encoding="utf-8",
    )
    manifest = {
        "entrypoint": "plugin_module:run",
        "module_path": str(plugin_dir),
    }
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    return manifest_path


def test_launch_plugin_success(sample_plugin: Path) -> None:
    response = launch_plugin(
        manifest_path=sample_plugin,
        request_payload={"payload": "hello"},
        python_executable=sys.executable,
    )
    assert response == {"echo": "hello", "invoked": True}


def test_launch_plugin_failure(sample_plugin: Path, tmp_path: Path) -> None:
    bad_manifest = tmp_path / "bad_manifest.json"
    bad_manifest.write_text(json.dumps({"entrypoint": "plugin_module"}), encoding="utf-8")
    with pytest.raises(PluginExecutionError):
        launch_plugin(
            manifest_path=bad_manifest,
            request_payload={},
            python_executable=sys.executable,
        )
