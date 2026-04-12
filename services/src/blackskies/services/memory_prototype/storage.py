"""Advisory-only storage writer for Memory Prototype v1."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from typing import Any

from blackskies.services.io import atomic_write_json

from .schemas import AdvisoryArtifactEnvelope, CanonicalLineageKey, PROTOTYPE_VERSION, SCHEMA_VERSION


class AdvisoryStorageError(ValueError):
    """Raised when advisory storage invariants are violated."""


@dataclass(frozen=True)
class MemoryPrototypeStorage:
    """Filesystem helper for prototype-only advisory artifacts."""

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
                "schema_version": SCHEMA_VERSION,
                "prototype_version": PROTOTYPE_VERSION,
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
                "note": "M2 advisory storage initialized",
            },
        )

    def write_advisory_artifact(
        self,
        *,
        category: str,
        lineage: CanonicalLineageKey,
        payload: dict[str, Any],
        source_hashes: dict[str, str],
        artifact_name: str | None = None,
    ) -> Path:
        """Write an advisory artifact under .blackskies/memory with required envelope."""

        self.ensure_scaffold()
        target_dir = self._memory_category_dir(category)
        lineage_token = self._lineage_token(lineage)
        filename = artifact_name or f"{lineage_token}.json"
        target = target_dir / filename
        self._assert_allowed_write(target)
        self._assert_no_fallback_overwrite(lineage=lineage, target=target)

        envelope = AdvisoryArtifactEnvelope.for_lineage(
            lineage=lineage,
            source_hashes=source_hashes,
        ).as_dict()
        blob = {"envelope": envelope, "payload": payload, "advisory": True}
        atomic_write_json(target, blob)
        return target

    def write_diagnostic(
        self,
        *,
        lineage: CanonicalLineageKey,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> Path:
        """Write a prototype diagnostic record under history/memory_prototype/diagnostics."""

        self.ensure_scaffold()
        timestamp = _now_iso().replace(":", "").replace("-", "")
        target = self.history_root / "diagnostics" / f"{timestamp}_{lineage.unit_id}.json"
        self._assert_allowed_write(target)
        atomic_write_json(
            target,
            {
                "schema_version": SCHEMA_VERSION,
                "prototype_version": PROTOTYPE_VERSION,
                "project_id": lineage.project_id,
                "unit_id": lineage.unit_id,
                "lineage_key": lineage.key,
                "generated_at": _now_iso(),
                "source_hashes": {},
                "advisory": True,
                "code": code,
                "message": message,
                "details": details or {},
            },
        )
        return target

    def write_status(
        self,
        *,
        status: str,
        last_error_code: str | None = None,
        last_error_message: str | None = None,
        affected_components: list[str] | None = None,
        retry_after_seconds: int = 0,
    ) -> Path:
        """Write degraded/ok status under the authoritative prototype status path."""

        self.ensure_scaffold()
        target = self.history_root / "status.json"
        self._assert_allowed_write(target)
        previous = read_json_if_exists(target)
        consecutive_failures = int(previous.get("consecutive_failures", 0)) if isinstance(previous, dict) else 0
        if status == "degraded":
            consecutive_failures += 1
        else:
            consecutive_failures = 0
        payload: dict[str, Any] = {
            "status": status,
            "updated_at": _now_iso(),
            "last_success_at": _now_iso() if status == "ok" else previous.get("last_success_at"),
            "last_error_code": last_error_code,
            "last_error_message": last_error_message,
            "consecutive_failures": consecutive_failures,
            "retry_after_seconds": retry_after_seconds,
            "affected_components": affected_components or [],
        }
        atomic_write_json(target, payload)
        return target

    def read_bookkeeping(self, relative_path: str) -> dict[str, Any] | None:
        """Read prototype outputs for idempotency bookkeeping only."""

        target = (self.memory_root / relative_path).resolve()
        if not target.exists():
            return None
        if not target.is_file():
            raise AdvisoryStorageError(f"bookkeeping path must be a file: {target}")
        if not target.is_relative_to(self.memory_root.resolve()):
            raise AdvisoryStorageError("bookkeeping reads are limited to .blackskies/memory")
        with target.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if isinstance(payload, dict):
            return payload
        return None

    def _memory_category_dir(self, category: str) -> Path:
        categories = {
            "ledger": self.memory_root / "ledger",
            "deltas": self.memory_root / "deltas",
            "packets": self.memory_root / "packets",
            "drift": self.memory_root / "drift",
        }
        if category not in categories:
            raise AdvisoryStorageError(f"unsupported advisory category: {category}")
        return categories[category]

    def _assert_allowed_write(self, path: Path) -> None:
        resolved = path.resolve()
        memory_root = self.memory_root.resolve()
        history_root = self.history_root.resolve()
        if resolved.is_relative_to(memory_root) or resolved.is_relative_to(history_root):
            return
        raise AdvisoryStorageError(
            f"prototype advisory storage cannot write outside allowed roots: {resolved}"
        )

    @staticmethod
    def _lineage_token(lineage: CanonicalLineageKey) -> str:
        return sha256(lineage.key.encode("utf-8")).hexdigest()[:16]

    @staticmethod
    def _assert_no_fallback_overwrite(*, lineage: CanonicalLineageKey, target: Path) -> None:
        if not lineage.is_fallback or not target.exists():
            return
        with target.open("r", encoding="utf-8") as handle:
            existing = json.load(handle)
        if not isinstance(existing, dict):
            return
        envelope = existing.get("envelope")
        if not isinstance(envelope, dict):
            return
        prior_lineage_key = str(envelope.get("lineage_key", ""))
        if prior_lineage_key and ":fallback:" not in prior_lineage_key:
            raise AdvisoryStorageError(
                "fallback lineage artifacts must not overwrite snapshot-based lineage artifacts"
            )


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def read_json_if_exists(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if isinstance(payload, dict):
        return payload
    return {}
