"""Helpers for paths within a project's `history/` tree."""

from __future__ import annotations

from pathlib import Path


def project_history_root(project_root: Path) -> Path:
    """Return the canonical history directory path for a project."""

    return project_root / "history"


def project_history_subdir(project_root: Path, *segments: str) -> Path:
    """Return a specific subdirectory under the project history folder."""

    return project_history_root(project_root).joinpath(*segments)
