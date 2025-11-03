"""Shared atomic file write utilities for persistence modules."""

from __future__ import annotations

import errno
import json
import os
import time
from contextlib import contextmanager
from pathlib import Path
from threading import Lock, RLock
from typing import IO, Any, Iterator
from uuid import uuid4

_PATH_LOCKS: dict[str, RLock] = {}
_PATH_LOCKS_GUARD = Lock()


@contextmanager
def locked_path(target: Path) -> Iterator[None]:
    """Serialise access to ``target`` to avoid rename conflicts on Windows."""

    key = str(target)
    with _PATH_LOCKS_GUARD:
        lock = _PATH_LOCKS.get(key)
        if lock is None:
            lock = RLock()
            _PATH_LOCKS[key] = lock
    lock.acquire()
    try:
        yield
    finally:
        lock.release()


def flush_handle(handle: IO[Any], *, durable: bool) -> None:
    """Flush file buffers and optionally fsync for durability."""

    handle.flush()
    if durable:
        os.fsync(handle.fileno())


_TRANSIENT_ERRNOS = {errno.EACCES, errno.EPERM}
_TRANSIENT_WINERRORS = {5, 32}


def replace_file(
    temp_path: Path,
    target_path: Path,
    *,
    attempts: int = 5,
    delay: float = 0.05,
) -> None:
    """Atomically replace ``target_path`` with retry support on Windows."""

    last_error: OSError | None = None
    for attempt in range(attempts):
        try:
            temp_path.replace(target_path)
            return
        except OSError as exc:
            winerror = getattr(exc, "winerror", None)
            if exc.errno not in _TRANSIENT_ERRNOS and winerror not in _TRANSIENT_WINERRORS:
                raise
            last_error = exc
            if attempt == attempts - 1:
                break
            time.sleep(delay * (attempt + 1))
    if last_error is not None:
        raise last_error


def write_json_atomic(path: Path, payload: dict[str, Any], *, durable: bool = True) -> None:
    """Write JSON to disk using an atomic rename."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with locked_path(path):
        temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
        with temp_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)
            flush_handle(handle, durable=durable)
        replace_file(temp_path, path)


def write_text_atomic(path: Path, content: str, *, durable: bool = True) -> None:
    """Write UTF-8 text to disk atomically with normalised newlines."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with locked_path(path):
        temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
        normalized = content.replace("\r\n", "\n")
        if not normalized.endswith("\n"):
            normalized = f"{normalized}\n"
        with temp_path.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(normalized)
            flush_handle(handle, durable=durable)
        replace_file(temp_path, path)


def dump_diagnostic(path: Path, payload: dict[str, Any]) -> None:
    """Write a JSON diagnostic payload to disk."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with locked_path(path):
        temp_path = path.parent / f".{path.name}.{uuid4().hex}.tmp"
        with temp_path.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)
            flush_handle(handle, durable=True)
        replace_file(temp_path, path)


# Backwards compatibility for modules that still import the underscored names.
_locked_path = locked_path
_flush_handle = flush_handle
_replace_file = replace_file

__all__ = [
    "dump_diagnostic",
    "flush_handle",
    "locked_path",
    "replace_file",
    "write_json_atomic",
    "write_text_atomic",
]
