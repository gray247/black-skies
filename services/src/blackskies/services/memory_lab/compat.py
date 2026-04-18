"""Compatibility helpers for legacy-read / current-write memory lab storage."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

from blackskies.services.io import atomic_write_json

from .schemas import ContestedOutcomeEvent, DecayEvent, MemoryLedgerEntry, ReinforcementEvent
from .storage import (
    contested_events_path,
    decay_events_path,
    legacy_reinforcement_events_path,
    load_decay_events,
    load_reinforcement_events,
    list_ledger_entries,
    reinforcement_events_path,
    write_ledger_entry,
)


def load_entries_compat(project_root: Path) -> list[MemoryLedgerEntry]:
    return list_ledger_entries(project_root)


def write_entry_current(project_root: Path, entry: MemoryLedgerEntry) -> None:
    write_ledger_entry(project_root, entry)


def load_reinforcement_events_compat(project_root: Path, artifact_id: str) -> list[ReinforcementEvent]:
    # storage.load_reinforcement_events already handles legacy fallback:
    # reinforcement_events/<id>.json first, then events/<id>.json
    return load_reinforcement_events(project_root, artifact_id)


def append_reinforcement_event_current(
    project_root: Path,
    event: ReinforcementEvent,
    *,
    retention_limit: int,
) -> None:
    target = reinforcement_events_path(project_root, event.artifact_id)
    payload = _load_raw_reinforcement_payload(project_root, event.artifact_id)
    payload.append(asdict(event))
    trimmed = payload[-max(1, int(retention_limit)) :]
    atomic_write_json(target, trimmed)


def load_decay_events_current(project_root: Path, artifact_id: str) -> list[DecayEvent]:
    return load_decay_events(project_root, artifact_id)


def append_decay_event_current(
    project_root: Path,
    event: DecayEvent,
    *,
    retention_limit: int,
) -> None:
    target = decay_events_path(project_root, event.artifact_id)
    payload = _load_raw_event_payload(target) if target.exists() and target.is_file() else []
    payload.append(asdict(event))
    trimmed = payload[-max(1, int(retention_limit)) :]
    atomic_write_json(target, trimmed)


def append_contested_outcome_event_current(
    project_root: Path,
    scene_id: str,
    event: ContestedOutcomeEvent,
    *,
    retention_limit: int,
) -> None:
    target = contested_events_path(project_root, scene_id)
    payload = _load_raw_event_payload(target) if target.exists() and target.is_file() else []
    payload.append(asdict(event))
    trimmed = payload[-max(1, int(retention_limit)) :]
    atomic_write_json(target, trimmed)


def _load_raw_reinforcement_payload(project_root: Path, artifact_id: str) -> list[Any]:
    target = reinforcement_events_path(project_root, artifact_id)
    if target.exists() and target.is_file():
        return _load_raw_event_payload(target)
    legacy_target = legacy_reinforcement_events_path(project_root, artifact_id)
    if legacy_target.exists() and legacy_target.is_file():
        return _load_raw_event_payload(legacy_target)
    return []


def _load_raw_event_payload(target: Path) -> list[Any]:
    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ValueError(f"failed to parse event file at {target}") from exc
    if not isinstance(payload, list):
        raise ValueError(f"event file payload must be a list at {target}")
    return list(payload)
