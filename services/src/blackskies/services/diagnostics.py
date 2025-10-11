"""Diagnostic logging utilities for service errors."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import re
from pathlib import Path
from typing import Any

from .persistence import dump_diagnostic


@dataclass
class DiagnosticLogger:
    """Write structured diagnostics to the project history folder."""

    def log(
        self,
        project_root: Path,
        *,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> Path:
        diagnostics_dir = project_root / "history" / "diagnostics"
        diagnostics_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        slug = _normalise_code(code)
        filename = f"{timestamp}_{slug}.json"
        path = diagnostics_dir / filename
        suffix = 1
        while path.exists():
            filename = f"{timestamp}_{slug}_{suffix}.json"
            path = diagnostics_dir / filename
            suffix += 1

        payload = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
            "code": code,
            "message": message,
            "details": details or {},
        }
        dump_diagnostic(path, payload)
        return path


def _normalise_code(code: str) -> str:
    """Return a filesystem-safe slug for the diagnostic code."""

    lowered = code.lower()
    without_separators = re.sub(r"[\\/]+", "-", lowered)
    cleaned = re.sub(r"[^a-z0-9_-]+", "-", without_separators)
    normalised = re.sub(r"-+", "-", cleaned).strip("-")
    return normalised or "diagnostic"


__all__ = ["DiagnosticLogger"]
