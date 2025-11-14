from __future__ import annotations

import sys
from pathlib import Path
from textwrap import dedent

import pytest

from blackskies.services.plugins.runner import execute_plugin


def _write_plugin(tmp_path: Path, code: str, module_name: str) -> tuple[Path, str]:
    module_dir = tmp_path / module_name
    module_dir.mkdir()
    module_file = module_dir / f"{module_name}.py"
    module_file.write_text(dedent(code), encoding="utf-8")
    sys.modules.pop(module_name, None)
    return module_dir, module_name


def test_execute_plugin_loads_from_module_path(tmp_path: Path) -> None:
    module_dir, module_name = _write_plugin(
        tmp_path,
        """
VALUE = 2

def run(request):
    return {"total": request.get("value", 0) + VALUE}
""",
        "plugin_add",
    )

    manifest = {"entrypoint": f"{module_name}:run", "module_path": str(module_dir)}
    result = execute_plugin(manifest, {"value": 40})

    assert result == {"total": 42}


def test_execute_plugin_requires_dict_response(tmp_path: Path) -> None:
    module_dir, module_name = _write_plugin(
        tmp_path,
        """
def run(request):
    return 123
""",
        "plugin_non_dict",
    )

    manifest = {"entrypoint": f"{module_name}:run", "module_path": str(module_dir)}

    with pytest.raises(RuntimeError, match="must return a dictionary"):
        execute_plugin(manifest, {})


def test_execute_plugin_uses_default_run_callable(tmp_path: Path) -> None:
    module_dir, module_name = _write_plugin(
        tmp_path,
        """
def run(request):
    return {"status": "ok"}
""",
        "plugin_default_entry",
    )

    # Intentionally omit attr after colon to exercise the default lookup.
    manifest = {"entrypoint": module_name, "module_path": str(module_dir)}
    result = execute_plugin(manifest, {})

    assert result == {"status": "ok"}
