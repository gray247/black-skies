"""Local filesystem lock helpers for Memory Lab orchestration."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator

try:
    import fcntl as _fcntl  # type: ignore
except ImportError:  # pragma: no cover - non-posix fallback
    _fcntl = None

try:
    import msvcrt as _msvcrt  # type: ignore
except ImportError:  # pragma: no cover - non-windows fallback
    _msvcrt = None


@dataclass(frozen=True)
class LockState:
    lock_acquired: bool
    lock_is_effective: bool
    lock_mode: str


@contextmanager
def acquire_project_lock(project_root: Path) -> Iterator[LockState]:
    """Acquire an advisory per-project file lock for mutation flows."""

    lock_path = project_root / ".blackskies" / "memory_lab" / ".orchestrator.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    lock_file = lock_path.open("a+", encoding="utf-8")
    lock_mode = "no_op_fallback"
    lock_effective = False
    try:
        if _fcntl is not None:
            _fcntl.flock(lock_file.fileno(), _fcntl.LOCK_EX)
            lock_mode = "fcntl"
            lock_effective = True
        elif _msvcrt is not None:
            # Lock a single byte at the beginning of the lock file.
            lock_file.seek(0)
            _msvcrt.locking(lock_file.fileno(), _msvcrt.LK_LOCK, 1)
            lock_mode = "msvcrt"
            lock_effective = True
        yield LockState(
            lock_acquired=True,
            lock_is_effective=lock_effective,
            lock_mode=lock_mode,
        )
    finally:
        try:
            if lock_mode == "fcntl" and _fcntl is not None:
                _fcntl.flock(lock_file.fileno(), _fcntl.LOCK_UN)
            elif lock_mode == "msvcrt" and _msvcrt is not None:
                lock_file.seek(0)
                _msvcrt.locking(lock_file.fileno(), _msvcrt.LK_UNLCK, 1)
        finally:
            lock_file.close()
