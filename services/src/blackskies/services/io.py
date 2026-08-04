"""I/O helpers used by services to persist JSON safely."""

from __future__ import annotations

import json
import os
import tempfile
import time
from threading import Lock, RLock
from pathlib import Path
from typing import Any

_write_locks_guard = Lock()
_write_locks: dict[str, RLock] = {}
_WINDOWS_REPLACE_RETRY_ERRORS = {5, 32}
_WINDOWS_REPLACE_ATTEMPTS = 5


def atomic_write_lock(path: Path) -> RLock:
    """Return the process-local write lock for one canonical JSON destination."""

    key = str(path.resolve()).casefold()
    with _write_locks_guard:
        return _write_locks.setdefault(key, RLock())


def _replace_atomically(temp_path: str, path: Path) -> None:
    """Replace a JSON file, tolerating only transient Windows share violations."""

    for attempt in range(_WINDOWS_REPLACE_ATTEMPTS):
        try:
            os.replace(temp_path, path)
            return
        except PermissionError as error:
            if os.name != "nt" or error.winerror not in _WINDOWS_REPLACE_RETRY_ERRORS:
                raise
            if attempt == _WINDOWS_REPLACE_ATTEMPTS - 1:
                raise
            time.sleep(0.01 * (attempt + 1))


def atomic_write_json(path: Path, payload: Any) -> None:
    """Write JSON content atomically."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with atomic_write_lock(path):
        fd, temp_path = tempfile.mkstemp(
            dir=str(path.parent), prefix=f"{path.name}.", suffix=".tmp"
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump(payload, handle, ensure_ascii=False, indent=2)
            _replace_atomically(temp_path, path)
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass


def read_json(path: Path) -> dict[str, Any]:
    """Load JSON content from disk."""

    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)
