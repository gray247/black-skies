"""Helpers for working with filesystem paths."""

from __future__ import annotations

from pathlib import Path
from typing import Union

PathLike = Union[str, Path]

def to_posix(path: PathLike) -> str:
    """Return a forward-slash string regardless of host platform."""
    return Path(path).as_posix()
