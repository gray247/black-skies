"""Local development namespace package shim for in-place service runs."""

from __future__ import annotations

import pkgutil
from pathlib import Path

__path__ = pkgutil.extend_path(__path__, __name__)  # type: ignore[name-defined]

_services_root = Path(__file__).resolve().parent.parent / "src" / "blackskies"
if _services_root.is_dir():
    candidate = str(_services_root)
    if candidate not in __path__:
        __path__.insert(0, candidate)  # type: ignore[attr-defined]
