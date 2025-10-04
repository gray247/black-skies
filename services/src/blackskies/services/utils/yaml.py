"""YAML utilities with graceful fallbacks when PyYAML is unavailable."""

from __future__ import annotations

from typing import Any

import json

try:  # pragma: no cover - exercised indirectly when dependency is present
    import yaml as _yaml
except ModuleNotFoundError:  # pragma: no cover - exercised in fallback tests
    _yaml = None


def safe_dump(
    data: Any,
    *,
    sort_keys: bool = False,
    allow_unicode: bool = True,
    indent: int = 2,
) -> str:
    """Serialize ``data`` to a YAML string.

    When PyYAML is installed we delegate to ``yaml.safe_dump`` for full YAML
    support. If the dependency is missing we emit a JSON-formatted string,
    which is a valid subset of YAML 1.2, so downstream consumers can still
    parse the manifest files without additional requirements.
    """

    if _yaml is not None:
        return _yaml.safe_dump(  # type: ignore[no-any-return]
            data,
            sort_keys=sort_keys,
            allow_unicode=allow_unicode,
            indent=indent,
        )

    serialized = json.dumps(
        data,
        sort_keys=sort_keys,
        ensure_ascii=not allow_unicode,
        indent=indent,
    )
    if not serialized.endswith("\n"):
        serialized = f"{serialized}\n"
    return serialized


__all__ = ["safe_dump"]
