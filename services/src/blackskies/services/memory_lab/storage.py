"""Filesystem storage helpers for Memory Lab ledger artifacts."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

from blackskies.services.io import atomic_write_json

from .schemas import InterpretationGroup, MemoryArtifact, MemoryLedgerEntry, ReinforcementEvent


def memory_lab_root(project_root: Path) -> Path:
    return project_root / ".blackskies" / "memory_lab"


def artifact_path(project_root: Path, scene_id: str) -> Path:
    return memory_lab_root(project_root) / "artifacts" / f"{scene_id}.json"


def status_path(project_root: Path) -> Path:
    return memory_lab_root(project_root) / "status.json"


def interpretation_group_path(project_root: Path, group_id: str) -> Path:
    return memory_lab_root(project_root) / "interpretations" / f"{group_id}.json"


def reinforcement_events_path(project_root: Path, artifact_id: str) -> Path:
    return memory_lab_root(project_root) / "events" / f"{artifact_id}.json"


def anchor_index_path(project_root: Path) -> Path:
    return memory_lab_root(project_root) / "index" / "anchors.json"


def write_ledger_entry(project_root: Path, entry: MemoryLedgerEntry) -> None:
    target = artifact_path(project_root, entry.scene_id)
    atomic_write_json(target, asdict(entry))


def load_ledger_entry(project_root: Path, scene_id: str) -> MemoryLedgerEntry | None:
    target = artifact_path(project_root, scene_id)
    if not target.exists() or not target.is_file():
        return None
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return _ledger_from_payload(payload)


def list_ledger_entries(project_root: Path) -> list[MemoryLedgerEntry]:
    artifacts_dir = memory_lab_root(project_root) / "artifacts"
    if not artifacts_dir.exists() or not artifacts_dir.is_dir():
        return []

    entries: list[MemoryLedgerEntry] = []
    for path in artifacts_dir.glob("*.json"):
        scene_id = path.stem
        entry = load_ledger_entry(project_root, scene_id)
        if entry is not None:
            entries.append(entry)
    return sorted(entries, key=lambda item: item.scene_id)


def write_interpretation_group(project_root: Path, group: InterpretationGroup) -> None:
    target = interpretation_group_path(project_root, group.group_id)
    atomic_write_json(target, asdict(group))


def load_interpretation_group(project_root: Path, group_id: str) -> InterpretationGroup | None:
    target = interpretation_group_path(project_root, group_id)
    if not target.exists() or not target.is_file():
        return None
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    return _interpretation_group_from_payload(payload)


def append_reinforcement_event(project_root: Path, event: ReinforcementEvent) -> None:
    target = reinforcement_events_path(project_root, event.artifact_id)
    events = load_reinforcement_events(project_root, event.artifact_id)
    events.append(event)
    atomic_write_json(target, [asdict(item) for item in events])


def load_reinforcement_events(project_root: Path, artifact_id: str) -> list[ReinforcementEvent]:
    target = reinforcement_events_path(project_root, artifact_id)
    if not target.exists() or not target.is_file():
        return []
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    if not isinstance(payload, list):
        return []

    events: list[ReinforcementEvent] = []
    for item in payload:
        event = _reinforcement_event_from_payload(item)
        if event is None:
            return []
        events.append(event)
    return events


def rebuild_anchor_index(project_root: Path) -> list[str]:
    anchor_ids = sorted(
        artifact.artifact_id
        for entry in list_ledger_entries(project_root)
        for artifact in entry.artifacts
        if artifact.is_anchor
    )
    atomic_write_json(anchor_index_path(project_root), anchor_ids)
    return anchor_ids


def _ledger_from_payload(payload: Any) -> MemoryLedgerEntry | None:
    if not isinstance(payload, dict):
        return None
    try:
        artifacts_raw = payload["artifacts"]
        if not isinstance(artifacts_raw, list):
            return None
        artifacts: list[MemoryArtifact] = []
        for item in artifacts_raw:
            artifact = _artifact_from_payload(item)
            if artifact is None:
                return None
            artifacts.append(artifact)

        source_unresolved = payload["source_unresolved"]
        if not isinstance(source_unresolved, list) or not all(
            isinstance(item, str) for item in source_unresolved
        ):
            return None

        return MemoryLedgerEntry(
            scene_id=str(payload["scene_id"]),
            chapter_id=_optional_str(payload.get("chapter_id")),
            schema_version=str(payload["schema_version"]),
            artifacts=artifacts,
            source_summary=_optional_str(payload.get("source_summary")),
            source_unresolved=list(source_unresolved),
            source_emotional_carryover=_optional_str(payload.get("source_emotional_carryover")),
            source_location_state=_optional_str(payload.get("source_location_state")),
        )
    except (KeyError, TypeError, ValueError):
        return None


def _artifact_from_payload(payload: Any) -> MemoryArtifact | None:
    if not isinstance(payload, dict):
        return None
    try:
        tags = payload["tags"]
        if not isinstance(tags, list) or not all(isinstance(item, str) for item in tags):
            return None

        return MemoryArtifact(
            artifact_id=str(payload["artifact_id"]),
            schema_version=str(payload["schema_version"]),
            artifact_type=str(payload["artifact_type"]),
            scene_id=str(payload["scene_id"]),
            chapter_id=_optional_str(payload.get("chapter_id")),
            source_excerpt=_optional_str(payload.get("source_excerpt")),
            content=str(payload["content"]),
            weight=float(payload["weight"]),
            confidence=float(payload["confidence"]),
            recency_order=int(payload["recency_order"]),
            tags=list(tags),
            derived_from=str(payload["derived_from"]),
            created_at=str(payload["created_at"]),
            is_anchor=bool(payload.get("is_anchor", False)),
            anchor_reason=_optional_str(payload.get("anchor_reason")),
            reinforcement_count=int(payload.get("reinforcement_count", 0)),
            selection_count=int(payload.get("selection_count", 0)),
            last_selected_at=_optional_str(payload.get("last_selected_at")),
            interpretation_group_id=_optional_str(payload.get("interpretation_group_id")),
            interpretation_label=_optional_str(payload.get("interpretation_label")),
            parent_artifact_id=_optional_str(payload.get("parent_artifact_id")),
            status=str(payload.get("status", "active")),
        )
    except (KeyError, TypeError, ValueError):
        return None


def _interpretation_group_from_payload(payload: Any) -> InterpretationGroup | None:
    if not isinstance(payload, dict):
        return None
    try:
        artifact_ids = payload["artifact_ids"]
        if not isinstance(artifact_ids, list) or not all(isinstance(item, str) for item in artifact_ids):
            return None
        return InterpretationGroup(
            group_id=str(payload["group_id"]),
            scene_id=str(payload["scene_id"]),
            chapter_id=_optional_str(payload.get("chapter_id")),
            entity_ref=_optional_str(payload.get("entity_ref")),
            event_ref=_optional_str(payload.get("event_ref")),
            schema_version=str(payload["schema_version"]),
            artifact_ids=list(artifact_ids),
            created_at=str(payload["created_at"]),
        )
    except (KeyError, TypeError, ValueError):
        return None


def _reinforcement_event_from_payload(payload: Any) -> ReinforcementEvent | None:
    if not isinstance(payload, dict):
        return None
    try:
        return ReinforcementEvent(
            event_id=str(payload["event_id"]),
            artifact_id=str(payload["artifact_id"]),
            event_type=str(payload["event_type"]),
            delta_weight=float(payload["delta_weight"]),
            created_at=str(payload["created_at"]),
            notes=_optional_str(payload.get("notes")),
        )
    except (KeyError, TypeError, ValueError):
        return None


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    raise ValueError("expected string or None")
