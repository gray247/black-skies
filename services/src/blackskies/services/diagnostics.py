"""Diagnostic logging utilities for service errors."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
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
        filename = f"{timestamp}_{code.lower()}.json"
        path = diagnostics_dir / filename

        payload = {
            "timestamp": datetime.now(tz=timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "code": code,
            "message": message,
            "details": details or {},
        }
        dump_diagnostic(path, payload)
        return path


__all__ = ["DiagnosticLogger"]
