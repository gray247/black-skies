"""Compatibility shim for repo-local pytest basetemp on sandboxed Windows hosts.

HARNESS_ONLY
Reason: Some sandboxed Windows environments deny directory iteration on pytest's
repo-local basetemp during session teardown. This shim preserves strict repo-local
temp usage while preventing teardown-only false negatives.
Owner: verification
Retire when: host allows cleanup_dead_symlinks() on repo-local basetemp paths.
"""

from __future__ import annotations

import os

import _pytest.pathlib as pytest_pathlib
import _pytest.tmpdir as pytest_tmpdir

_original_cleanup_dead_symlinks = pytest_pathlib.cleanup_dead_symlinks
_original_getbasetemp = pytest_tmpdir.TempPathFactory.getbasetemp
_original_make_numbered_dir = pytest_pathlib.make_numbered_dir


def _safe_cleanup_dead_symlinks(root) -> None:  # pragma: no cover - host behavior dependent
    try:
        _original_cleanup_dead_symlinks(root)
    except PermissionError:
        # Teardown-only host restriction; do not convert a fully-executed lane
        # into a false negative when repo-local basetemp is otherwise valid.
        return


def pytest_configure(config) -> None:  # pragma: no cover - exercised via pytest startup
    pytest_pathlib.cleanup_dead_symlinks = _safe_cleanup_dead_symlinks
    pytest_tmpdir.cleanup_dead_symlinks = _safe_cleanup_dead_symlinks

    def _safe_make_numbered_dir(root, prefix, mode=0o700):  # pragma: no cover
        numbered_dir = _original_make_numbered_dir(root=root, prefix=prefix, mode=0o777)
        try:
            os.chmod(numbered_dir, 0o777)
        except PermissionError:
            pass
        return numbered_dir

    pytest_pathlib.make_numbered_dir = _safe_make_numbered_dir
    pytest_tmpdir.make_numbered_dir = _safe_make_numbered_dir

    def _safe_getbasetemp(self):  # pragma: no cover - exercised via pytest startup
        if self._basetemp is not None:
            return self._basetemp
        if self._given_basetemp is not None:
            basetemp = self._given_basetemp
            if basetemp.exists():
                pytest_tmpdir.rm_rf(basetemp)
            basetemp.mkdir(parents=True, exist_ok=True)
            try:
                os.chmod(basetemp, 0o777)
            except PermissionError:
                pass
            basetemp = basetemp.resolve()
            self._basetemp = basetemp
            return basetemp
        return _original_getbasetemp(self)

    pytest_tmpdir.TempPathFactory.getbasetemp = _safe_getbasetemp
