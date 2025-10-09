from __future__ import annotations

import sys
from importlib import util
from pathlib import Path
from types import ModuleType

import yaml


def _load_fallback_module() -> ModuleType:
    module_path = Path(__file__).resolve().parents[1] / "yaml" / "__init__.py"
    spec = util.spec_from_file_location("yaml_fallback", module_path)
    if spec is None or spec.loader is None:  # pragma: no cover - defensive
        raise RuntimeError("Unable to load fallback YAML module")
    module = util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


fallback_yaml = _load_fallback_module()


def test_safe_load_parses_nested_mapping() -> None:
    document = """
    root:
      child: value
      list:
        - id: sc_0001
          title: "Scene One"
        - name: Example
    """

    loaded = fallback_yaml.safe_load(document)

    assert isinstance(loaded, dict)
    assert loaded["root"]["child"] == "value"
    assert loaded["root"]["list"][0]["id"] == "sc_0001"
    assert loaded["root"]["list"][1]["name"] == "Example"


def test_safe_load_handles_json_documents() -> None:
    document = '{"project": {"id": "proj_123"}}'

    loaded = fallback_yaml.safe_load(document)

    assert loaded == {"project": {"id": "proj_123"}}


def test_safe_load_all_yields_multiple_documents() -> None:
    document = """
    ---
    first: 1
    ---
    second: 2
    """

    documents = list(fallback_yaml.safe_load_all(document))

    assert documents == [{"first": 1}, {"second": 2}]


def test_global_yaml_import_available() -> None:
    assert hasattr(yaml, "safe_load")
