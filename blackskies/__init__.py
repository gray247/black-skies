"""Namespace package shim for running services from the repository root."""

from __future__ import annotations

import pkgutil
from pathlib import Path

__path__ = pkgutil.extend_path(__path__, __name__)  # type: ignore[name-defined]

_repo_root = Path(__file__).resolve().parent.parent
_services_pkg = _repo_root / "services" / "src" / "blackskies"

if _services_pkg.is_dir():
    candidate = str(_services_pkg)
    if candidate not in __path__:
        __path__.insert(0, candidate)  # type: ignore[attr-defined]
