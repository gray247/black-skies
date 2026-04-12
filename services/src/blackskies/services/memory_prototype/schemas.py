"""Common data envelopes for Memory Prototype v1 scaffolding."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class CanonicalLineageKey:
    """Canonical lineage identity for prototype reads."""

    project_id: str
    unit_id: str
    snapshot_id: str


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

