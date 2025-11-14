"""Project-specific heuristics used for scene metadata generation."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Sequence, Tuple

import yaml

from .constants import (
    DRAFT_EMOTIONS,
    DRAFT_GOAL_CANDIDATES,
    DRAFT_POV_CANDIDATES,
    DRAFT_PURPOSES,
    DRAFT_TURN_CANDIDATES,
    WORD_TARGET_BASE,
    WORD_TARGET_PER_ORDER,
)


@dataclass(frozen=True)
class ConflictOption:
    description: str
    type: str


@dataclass(frozen=True)
class Heuristics:
    povs: Tuple[str, ...]
    goals: Tuple[str, ...]
    conflict_options: Tuple[ConflictOption, ...]
    turns: Tuple[str, ...]
    purposes: Tuple[str, ...]
    emotions: Tuple[str, ...]
    word_target_base: int = WORD_TARGET_BASE
    word_target_step: int = WORD_TARGET_PER_ORDER
    pacing_thresholds: Tuple[float, float] = (1.1, 0.9)


_DEFAULT_CONFLICTS: Tuple[ConflictOption, ...] = (
    ConflictOption("humidity chews through every circuit", "environmental"),
    ConflictOption("alarms cascade in the empty halls", "environmental"),
    ConflictOption("footsteps echo from nowhere", "environmental"),
    ConflictOption("the blackout shutters seize mid-drop", "environmental"),
    ConflictOption("radio static lances through the air", "environmental"),
    ConflictOption("old floorboards complain at every move", "environmental"),
)


def _normalize_strings(value: Any) -> Tuple[str, ...]:
    if isinstance(value, Sequence) and not isinstance(value, str):
        normalized: list[str] = []
        for entry in value:
            if entry is None:
                continue
            candidate = str(entry).strip()
            if candidate:
                normalized.append(candidate)
        return tuple(normalized)
    return tuple()


def _normalize_conflicts(value: Any) -> Tuple[ConflictOption, ...]:
    if isinstance(value, Sequence) and not isinstance(value, str):
        normalized: list[ConflictOption] = []
        for entry in value:
            if isinstance(entry, ConflictOption):
                normalized.append(entry)
                continue
            if isinstance(entry, Mapping):
                description = str(entry.get("description") or entry.get("text") or "")
                ctype = str(entry.get("type") or entry.get("category") or "custom")
                description = description.strip()
                if description:
                    normalized.append(ConflictOption(description, ctype))
                continue
            candidate = str(entry).strip()
            if candidate:
                normalized.append(ConflictOption(candidate, "custom"))
        if normalized:
            return tuple(normalized)
    return tuple()


def _load_yaml(path: Path) -> Mapping[str, Any] | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            loaded = yaml.safe_load(handle)
            if isinstance(loaded, Mapping):
                return loaded
    except Exception:
        pass
    return None


def load_project_heuristics(project_root: Path | None) -> Heuristics:
    if project_root is None:
        return DEFAULT_HEURISTICS

    heuristic_path = project_root / ".blackskies" / "heuristics.yaml"
    data: Mapping[str, Any] | None = None
    if heuristic_path.exists():
        data = _load_yaml(heuristic_path)

    povs = _normalize_strings(data.get("povs")) if data else tuple()
    goals = _normalize_strings(data.get("goals")) if data else tuple()
    conflicts = _normalize_conflicts(data.get("conflicts")) if data else tuple()
    turns = _normalize_strings(data.get("turns")) if data else tuple()
    purposes = _normalize_strings(data.get("purposes")) if data else tuple()
    emotions = _normalize_strings(data.get("emotions")) if data else tuple()

    if not povs:
        povs = DRAFT_POV_CANDIDATES
    if not goals:
        goals = DRAFT_GOAL_CANDIDATES
    if not conflicts:
        conflicts = _DEFAULT_CONFLICTS
    if not turns:
        turns = DRAFT_TURN_CANDIDATES
    if not purposes:
        purposes = DRAFT_PURPOSES
    if not emotions:
        emotions = DRAFT_EMOTIONS

    word_target_base = WORD_TARGET_BASE
    word_target_step = WORD_TARGET_PER_ORDER
    pacing_thresholds = (1.1, 0.9)

    if data:
        word_target = data.get("word_target")
        if isinstance(word_target, Mapping):
            base = word_target.get("base")
            step = word_target.get("per_order")
            if isinstance(base, (int, float)):
                word_target_base = max(0, int(base))
            if isinstance(step, (int, float)):
                word_target_step = max(0, int(step))
        pacing = data.get("pacing_thresholds")
        if isinstance(pacing, Sequence) and len(pacing) >= 2:
            try:
                slow = float(pacing[0])
                fast = float(pacing[1])
                pacing_thresholds = (slow, fast)
            except (TypeError, ValueError):
                pass

    return Heuristics(
        povs=povs,
        goals=goals,
        conflict_options=conflicts,
        turns=turns,
        purposes=purposes,
        emotions=emotions,
        word_target_base=word_target_base,
        word_target_step=word_target_step,
        pacing_thresholds=pacing_thresholds,
    )


DEFAULT_HEURISTICS = Heuristics(
    povs=DRAFT_POV_CANDIDATES,
    goals=DRAFT_GOAL_CANDIDATES,
    conflict_options=_DEFAULT_CONFLICTS,
    turns=DRAFT_TURN_CANDIDATES,
    purposes=DRAFT_PURPOSES,
    emotions=DRAFT_EMOTIONS,
)

__all__ = ["ConflictOption", "Heuristics", "load_project_heuristics", "DEFAULT_HEURISTICS"]
