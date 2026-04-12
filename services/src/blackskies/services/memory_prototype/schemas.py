"""Common data envelopes for Memory Prototype v1."""

from __future__ import annotations

from dataclasses import asdict
from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "memory-prototype-v1"
PROTOTYPE_VERSION = "m2-reader-storage"


@dataclass(frozen=True)
class CanonicalLineageKey:
    """Canonical lineage identity for prototype reads.

    Primary lineage: project_id + unit_id + snapshot_id
    Fallback lineage: project_id + unit_id + accepted_source_hash
    """

    project_id: str
    unit_id: str
    snapshot_id: str | None = None
    accepted_source_hash: str | None = None
    context: str = "replay"

    def __post_init__(self) -> None:
        if not self.project_id.strip():
            raise ValueError("project_id is required for lineage keys")
        if not self.unit_id.strip():
            raise ValueError("unit_id is required for lineage keys")
        if self.snapshot_id and self.accepted_source_hash:
            raise ValueError("lineage key cannot include both snapshot_id and accepted_source_hash")
        if not self.snapshot_id and not self.accepted_source_hash:
            raise ValueError("lineage key requires snapshot_id or accepted_source_hash")
        if self.context not in {"live_accept", "replay", "eval"}:
            raise ValueError("context must be one of: live_accept, replay, eval")
        if self.context == "live_accept" and self.accepted_source_hash:
            raise ValueError("fallback lineage is forbidden in live_accept context")

    @property
    def is_primary(self) -> bool:
        return self.snapshot_id is not None

    @property
    def is_fallback(self) -> bool:
        return self.accepted_source_hash is not None

    @property
    def key(self) -> str:
        if self.snapshot_id:
            return f"{self.project_id}:{self.unit_id}:{self.snapshot_id}"
        assert self.accepted_source_hash is not None
        return f"{self.project_id}:{self.unit_id}:fallback:{self.accepted_source_hash}"

    def as_dict(self) -> dict[str, str]:
        payload = {
            "project_id": self.project_id,
            "unit_id": self.unit_id,
            "context": self.context,
            "lineage_key": self.key,
        }
        if self.snapshot_id is not None:
            payload["snapshot_id"] = self.snapshot_id
        if self.accepted_source_hash is not None:
            payload["accepted_source_hash"] = self.accepted_source_hash
        return payload

    @classmethod
    def from_snapshot(
        cls,
        *,
        project_id: str,
        unit_id: str,
        snapshot_id: str,
        context: str,
    ) -> "CanonicalLineageKey":
        return cls(project_id=project_id, unit_id=unit_id, snapshot_id=snapshot_id, context=context)

    @classmethod
    def from_fallback_hash(
        cls,
        *,
        project_id: str,
        unit_id: str,
        accepted_source_hash: str,
        context: str,
    ) -> "CanonicalLineageKey":
        if context == "live_accept":
            raise ValueError("fallback lineage is not allowed for live_accept context")
        return cls(
            project_id=project_id,
            unit_id=unit_id,
            accepted_source_hash=accepted_source_hash,
            context=context,
        )


@dataclass(frozen=True)
class CanonicalNarrativeSnapshot:
    """Read-only canonical snapshot assembled for memory processing."""

    lineage: CanonicalLineageKey
    draft_path: Path
    draft_text: str
    locked_fields_source: Path | None
    locked_fields_payload: list[str] | dict[str, object] | None
    outline_source: Path | None
    outline_payload: dict[str, object] | None
    lore_sources: tuple[Path, ...]
    lore_payloads: tuple[dict[str, object], ...]
    source_hashes: dict[str, str]
    excluded_inputs_checked: tuple[str, ...]


@dataclass(frozen=True)
class AdvisoryArtifactEnvelope:
    """Required schema envelope for non-canonical prototype artifacts."""

    schema_version: str
    prototype_version: str
    project_id: str
    unit_id: str | None
    lineage_key: str
    generated_at: str
    source_hashes: dict[str, str]
    advisory: bool = True

    @classmethod
    def for_lineage(
        cls,
        *,
        lineage: CanonicalLineageKey,
        source_hashes: dict[str, str],
    ) -> "AdvisoryArtifactEnvelope":
        return cls(
            schema_version=SCHEMA_VERSION,
            prototype_version=PROTOTYPE_VERSION,
            project_id=lineage.project_id,
            unit_id=lineage.unit_id,
            lineage_key=lineage.key,
            generated_at=datetime.now(UTC).isoformat(),
            source_hashes=source_hashes,
        )

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def sha256_text(text: str) -> str:
    return sha256(text.encode("utf-8")).hexdigest()
