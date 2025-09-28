"""Pytest configuration for the services test suite."""

from __future__ import annotations

import sys
from pathlib import Path


def _ensure_src_on_path() -> None:
    """Add the services src directory to ``sys.path`` for imports."""

    src_dir = Path(__file__).resolve().parent.parent / "src"
    src_path = str(src_dir)
    if src_dir.is_dir() and src_path not in sys.path:
        sys.path.insert(0, src_path)


_ensure_src_on_path()
