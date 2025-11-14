"""Runtime analytics helpers for logging model call hints."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Dict, Iterable


def log_runtime_event(project_root: Path, event: Dict[str, Any]) -> None:
    analytics_dir = project_root / ".blackskies" / "analytics"
    analytics_dir.mkdir(parents=True, exist_ok=True)
    line = json.dumps(
        {
            "timestamp": time.time(),
            **event,
        },
        separators=(",", ":"),
    )
    with (analytics_dir / "runtime_calls.jsonl").open("a", encoding="utf-8") as handle:
        handle.write(line)
        handle.write("\n")


def read_runtime_events(project_root: Path) -> Iterable[Dict[str, Any]]:
    runtime_file = project_root / ".blackskies" / "analytics" / "runtime_calls.jsonl"
    if not runtime_file.exists():
        return
    with runtime_file.open("r", encoding="utf-8") as handle:
        for raw_line in handle:
            if not raw_line.strip():
                continue
            try:
                yield json.loads(raw_line)
            except json.JSONDecodeError:
                continue
