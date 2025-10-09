"""YAML utilities delegating to the bundled safe YAML implementation."""

from __future__ import annotations

from typing import Any

from yaml import safe_dump as _yaml_safe_dump


def safe_dump(
    data: Any,
    *,
    sort_keys: bool = False,
    allow_unicode: bool = True,
    indent: int = 2,
) -> str:
    """Serialize ``data`` to a YAML string.

    This helper retains historical behaviour by ensuring the resulting string
    always terminates with a newline, matching PyYAML's defaults.
    """

    serialized = _yaml_safe_dump(
        data,
        sort_keys=sort_keys,
        allow_unicode=allow_unicode,
        indent=indent,
    )
    if not serialized.endswith("\n"):
        serialized = f"{serialized}\n"
    return serialized


__all__ = ["safe_dump"]
