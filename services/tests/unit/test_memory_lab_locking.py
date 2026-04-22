from __future__ import annotations

from pathlib import Path

import blackskies.services.memory_lab.locking as locking_module


class _StubFcntl:
    LOCK_EX = 1
    LOCK_UN = 2

    def __init__(self) -> None:
        self.calls: list[tuple[int, int]] = []

    def flock(self, fd: int, op: int) -> None:
        self.calls.append((fd, op))


class _StubMsvcrt:
    LK_LOCK = 1
    LK_UNLCK = 2

    def __init__(self) -> None:
        self.calls: list[tuple[int, int, int]] = []

    def locking(self, fd: int, mode: int, size: int) -> None:
        self.calls.append((fd, mode, size))


def test_acquire_project_lock_prefers_fcntl(tmp_path: Path, monkeypatch) -> None:
    stub_fcntl = _StubFcntl()
    monkeypatch.setattr(locking_module, "_fcntl", stub_fcntl)
    monkeypatch.setattr(locking_module, "_msvcrt", None)

    with locking_module.acquire_project_lock(tmp_path / "project") as state:
        assert state.lock_acquired is True
        assert state.lock_is_effective is True
        assert state.lock_mode == "fcntl"

    assert len(stub_fcntl.calls) == 2
    assert stub_fcntl.calls[0][1] == stub_fcntl.LOCK_EX
    assert stub_fcntl.calls[1][1] == stub_fcntl.LOCK_UN


def test_acquire_project_lock_uses_msvcrt_when_fcntl_missing(tmp_path: Path, monkeypatch) -> None:
    stub_msvcrt = _StubMsvcrt()
    monkeypatch.setattr(locking_module, "_fcntl", None)
    monkeypatch.setattr(locking_module, "_msvcrt", stub_msvcrt)

    with locking_module.acquire_project_lock(tmp_path / "project") as state:
        assert state.lock_acquired is True
        assert state.lock_is_effective is True
        assert state.lock_mode == "msvcrt"

    assert len(stub_msvcrt.calls) == 2
    assert stub_msvcrt.calls[0][1] == stub_msvcrt.LK_LOCK
    assert stub_msvcrt.calls[1][1] == stub_msvcrt.LK_UNLCK


def test_acquire_project_lock_noop_fallback_when_no_backend(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(locking_module, "_fcntl", None)
    monkeypatch.setattr(locking_module, "_msvcrt", None)

    with locking_module.acquire_project_lock(tmp_path / "project") as state:
        assert state.lock_acquired is True
        assert state.lock_is_effective is False
        assert state.lock_mode == "no_op_fallback"
