"""Continuity-to-advisory ingestion bridge for Memory Lab.

Memory Lab owns advisory artifacts, ledger entry schemas, and advisory
selection state. It does not own scene continuity persistence. This module is
the explicit bridge that turns continuity carryover payloads into advisory
ledger entries.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from .constants import MEMORY_LAB_SCHEMA_VERSION
from .extractor import build_memory_artifacts
from .schemas import MemoryLedgerEntry
from .storage import write_ledger_entry


def build_memory_lab_entry_from_carryover(
    *,
    scene_id: str,
    chapter_id: str | None,
    text: str,
    carryover_payload: dict[str, Any],
    recency_order: int,
    interpretations_enabled: bool = False,
    max_interpretations_per_group: int = 2,
) -> MemoryLedgerEntry:
    """Translate continuity carryover into a Memory Lab ledger entry.

    This is an ingestion step only. It must not make advisory selection
    decisions or mutate continuity storage.
    """

    artifacts = build_memory_artifacts(
        scene_id=scene_id,
        chapter_id=chapter_id,
        text=text,
        carryover_payload=carryover_payload,
        recency_order=recency_order,
        interpretations_enabled=interpretations_enabled,
        max_interpretations_per_group=max_interpretations_per_group,
    )
    return MemoryLedgerEntry(
        scene_id=scene_id,
        chapter_id=chapter_id,
        schema_version=MEMORY_LAB_SCHEMA_VERSION,
        artifacts=artifacts,
        source_summary=_as_optional_str(carryover_payload.get("summary")),
        source_unresolved=_as_string_list(carryover_payload.get("unresolved")),
        source_emotional_carryover=_as_optional_str(carryover_payload.get("emotional_carryover")),
        source_location_state=_as_optional_str(carryover_payload.get("location_state")),
    )


def persist_scene_advisory_entry(
    *,
    project_root: Path,
    scene_id: str,
    chapter_id: str | None,
    text: str,
    carryover_payload: dict[str, Any],
    recency_order: int,
    interpretations_enabled: bool = False,
    max_interpretations_per_group: int = 2,
) -> None:
    """Persist a Memory Lab advisory entry derived from continuity carryover."""

    entry = build_memory_lab_entry_from_carryover(
        scene_id=scene_id,
        chapter_id=chapter_id,
        text=text,
        carryover_payload=carryover_payload,
        recency_order=recency_order,
        interpretations_enabled=interpretations_enabled,
        max_interpretations_per_group=max_interpretations_per_group,
    )
    write_ledger_entry(project_root, entry)


def _as_optional_str(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    if not cleaned:
        return None
    return cleaned


def _as_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    output: list[str] = []
    for item in value:
        cleaned = _as_optional_str(item)
        if cleaned:
            output.append(cleaned)
    return output


__all__ = [
    "build_memory_lab_entry_from_carryover",
    "persist_scene_advisory_entry",
]
