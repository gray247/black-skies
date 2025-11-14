"""Diagnostic logging utilities for service errors."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import re
from pathlib import Path
from typing import Any

from .persistence import dump_diagnostic

_SENSITIVE_DETAIL_KEYWORDS = ("path", "project", "snapshot", "note", "file")

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

        sanitized_details = _sanitize_details(details)
        payload = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
            "code": code,
            "message": message,
            "details": sanitized_details,
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


def _sanitize_details(details: dict[str, Any] | None) -> dict[str, Any]:
    """Return a copy of details with sensitive fields redacted."""

    if not details:
        return {}

    return {key: _redact_value(key, value) for key, value in details.items()}


def _redact_value(key: str, value: Any) -> Any:
    if _should_redact(key) and isinstance(value, str):
        return "[REDACTED]"
    return value


def _should_redact(key: str) -> bool:
    lower_key = key.lower()
    return any(keyword in lower_key for keyword in _SENSITIVE_DETAIL_KEYWORDS)


__all__ = ["DiagnosticLogger"]
