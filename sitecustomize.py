"""Project-level sitecustomize to expose the services src directory."""

from __future__ import annotations

import sys
from pathlib import Path


def _add_services_src() -> None:
    """Ensure ``services/src`` is importable when running from the repo root."""

    repo_root = Path(__file__).resolve().parent
    services_src = repo_root / "services" / "src"
    if not services_src.is_dir():
        return

    candidate = str(services_src)
    if candidate not in sys.path:
        sys.path.insert(0, candidate)


_add_services_src()
