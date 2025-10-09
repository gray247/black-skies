"""YAML utilities delegating to the bundled safe YAML implementation."""

from __future__ import annotations

import importlib
import importlib.util
import json
from types import ModuleType
from typing import Any, Callable

_yaml_spec = importlib.util.find_spec("yaml")
_yaml: ModuleType | None
if _yaml_spec is not None:
    _yaml = importlib.import_module("yaml")
else:
    _yaml = None

_DumpStrategy = Callable[[Any, bool, bool, int], str]


def _dump_with_yaml(data: Any, sort_keys: bool, allow_unicode: bool, indent: int) -> str:
    assert _yaml is not None
    return _yaml.safe_dump(  # type: ignore[no-any-return]
        data,
        sort_keys=sort_keys,
        allow_unicode=allow_unicode,
        indent=indent,
    )


def _dump_with_json(data: Any, sort_keys: bool, allow_unicode: bool, indent: int) -> str:
    return json.dumps(
        data,
        sort_keys=sort_keys,
        ensure_ascii=not allow_unicode,
        indent=indent,
    )


def safe_dump(
    data: Any,
    *,
    sort_keys: bool = False,
    allow_unicode: bool = True,
    indent: int = 2,
) -> str:
    """Serialize ``data`` to a YAML string, falling back to JSON when unavailable."""

    dump: _DumpStrategy = _dump_with_yaml if _yaml is not None else _dump_with_json
    serialized = dump(data, sort_keys, allow_unicode, indent)
    if not serialized.endswith("\n"):
        serialized = f"{serialized}\n"
    return serialized


__all__ = ["safe_dump", "_yaml"]
