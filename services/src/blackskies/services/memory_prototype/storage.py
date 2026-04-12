"""Advisory storage scaffolding for Memory Prototype v1."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from blackskies.services.io import atomic_write_json


@dataclass(frozen=True)
class MemoryPrototypeStorage:
    """Filesystem layout helper for prototype-only artifacts."""

    project_root: Path

    @property
    def memory_root(self) -> Path:
        return self.project_root / ".blackskies" / "memory"

    @property
    def history_root(self) -> Path:
        return self.project_root / "history" / "memory_prototype"

    def ensure_scaffold(self) -> None:
        for path in (
            self.memory_root / "ledger",
            self.memory_root / "deltas",
            self.memory_root / "packets",
            self.memory_root / "drift",
            self.history_root / "runs",
            self.history_root / "diagnostics",
            self.history_root / "eval",
        ):
            path.mkdir(parents=True, exist_ok=True)

        atomic_write_json(
            self.memory_root / "schema_version.json",
            {
                "schema_version": "memory-prototype-v1",
                "prototype_version": "m1-scaffold",
            },
        )
        atomic_write_json(
            self.history_root / "status.json",
            {
                "status": "ok",
                "updated_at": _now_iso(),
                "last_success_at": _now_iso(),
                "last_error_code": None,
                "last_error_message": None,
                "consecutive_failures": 0,
                "retry_after_seconds": 0,
                "affected_components": [],
                "note": "M1 storage scaffold initialized",
            },
        )


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def dump_json(path: Path, payload: dict[str, object]) -> None:
    """Debug-only helper for advisory artifact writes in prototype lanes."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

