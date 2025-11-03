"""Proxy module exposing the stdlib :mod:`os` namespace.

The persistence package historically exposed ``os`` so callers (including tests)
could monkeypatch ``fsync`` without reaching into implementation details.
This module restores that behaviour by re-exporting the attributes from
Python's standard :mod:`os`.
"""

from __future__ import annotations

import os as _os

__all__ = [name for name in dir(_os)]

for name in __all__:
    globals()[name] = getattr(_os, name)

del name
