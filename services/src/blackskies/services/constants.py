"""Shared baseline constants for Black Skies services."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Final, Mapping, Tuple

import yaml

LOGGER = logging.getLogger(__name__)

_DEFAULT_CONFIG: Mapping[str, Any] = {
    "service": {
        "port_range": {"min": 43750, "max": 43850},
        "health_probe": {
            "max_attempts": 40,
            "base_delay_ms": 250,
            "max_delay_ms": 2000,
        },
        "allowed_python_executables": ["python", "python3", "python.exe"],
        "bundled_python_path": "",
    },
    "budget": {
        "soft_limit_usd": 5.0,
        "hard_limit_usd": 10.0,
        "cost_per_1000_words_usd": 0.02,
    },
    "analytics": {
        "emotion_intensity": {
            "dread": 1.0,
            "tension": 0.85,
            "revelation": 0.65,
            "aftermath": 0.45,
            "respite": 0.25,
        },
        "default_emotion_intensity": 0.5,
        "pace": {
            "slow_threshold": 1.2,
            "fast_threshold": 0.8,
        },
    },
    "draft_synthesizer": {
        "povs": [
            "Mara Ibarra",
            "Ezra Cole",
            "Jun Park",
            "Sasha Reed",
            "Luis Navarro",
            "Rin Okada",
            "Kira Beaumont",
            "Elior Shaw",
        ],
        "goals": [
            "stabilize the perimeter sensors",
            "recover the coded broadcast",
            "map the estate's sealed corridors",
            "extract the survivor logs",
            "keep the generator coil alive",
            "decode the warding sigils",
        ],
        "conflicts": [
            "humidity chews through every circuit",
            "alarms cascade in the empty halls",
            "footsteps echo from nowhere",
            "the blackout shutters seize mid-drop",
            "radio static lances through the air",
            "old floorboards complain at every move",
        ],
        "turns": [
            "a hidden relay spits out fresh co-ordinates",
            "an old ally speaks through the static",
            "the house remembers a forgotten route",
            "a vault door seals with new intent",
            "a warning flare cuts across the bay",
            "the diary on the desk updates itself",
        ],
        "purposes": ["setup", "escalation", "payoff", "breath"],
        "emotions": ["dread", "tension", "respite", "revelation", "aftermath"],
        "word_target": {"base": 850, "per_order": 40},
    },
}


def _config_path() -> Path:
    env_path = os.getenv("BLACKSKIES_CONFIG_PATH")
    if env_path:
        return Path(env_path)
    return Path(__file__).resolve().parents[4] / "config" / "runtime.yaml"


@lru_cache(maxsize=1)
def load_runtime_config() -> Mapping[str, Any]:
    path = _config_path()
    if not path.exists():
        return _DEFAULT_CONFIG
    try:
        with path.open("r", encoding="utf-8") as handle:
            loaded = yaml.safe_load(handle) or {}
            if isinstance(loaded, dict):
                return loaded
            LOGGER.warning("Runtime config at %%s is not a mapping; using defaults.", path)
    except Exception as exc:  # pragma: no cover - defensive log
        LOGGER.warning("Failed to load runtime config from %%s: %%s", path, exc)
    return _DEFAULT_CONFIG


_RUNTIME_CONFIG = load_runtime_config()

def _safe_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int) -> int:
    try:
        parsed = int(value)
        return parsed
    except (TypeError, ValueError):
        return default


_budget = _DEFAULT_CONFIG["budget"].copy()
_budget.update(_RUNTIME_CONFIG.get("budget", {}))

DEFAULT_SOFT_BUDGET_LIMIT_USD: Final[float] = _safe_float(
    _budget.get("soft_limit_usd"), 5.0
)
DEFAULT_HARD_BUDGET_LIMIT_USD: Final[float] = _safe_float(
    _budget.get("hard_limit_usd"), 10.0
)
COST_PER_1000_WORDS_USD: Final[float] = _safe_float(
    _budget.get("cost_per_1000_words_usd"), 0.02
)

_service = _DEFAULT_CONFIG["service"].copy()
_service.update(_RUNTIME_CONFIG.get("service", {}))

_port_range = _service.get("port_range", {})
SERVICE_PORT_RANGE: Final[Tuple[int, int]] = (
    _safe_int(_port_range.get("min"), 43750),
    _safe_int(_port_range.get("max"), 43850),
)

_health_probe = _service.get("health_probe", {})
HEALTH_MAX_ATTEMPTS: Final[int] = max(1, _safe_int(_health_probe.get("max_attempts"), 40))
HEALTH_BASE_DELAY_MS: Final[int] = max(50, _safe_int(_health_probe.get("base_delay_ms"), 250))
HEALTH_MAX_DELAY_MS: Final[int] = max(
    HEALTH_BASE_DELAY_MS, _safe_int(_health_probe.get("max_delay_ms"), 2000)
)

_allowed_execs = _service.get("allowed_python_executables", [])
ALLOWED_PYTHON_EXECUTABLES: Final[Tuple[str, ...]] = tuple(
    str(entry).lower() for entry in _allowed_execs
)

_BUNDLED_PATH = str(_service.get("bundled_python_path", ""))
BUNDLED_PYTHON_PATH: Final[str] = _BUNDLED_PATH if _BUNDLED_PATH else ""

_analytics = _DEFAULT_CONFIG["analytics"].copy()
_custom_analytics = _RUNTIME_CONFIG.get("analytics", {})
for key, value in _custom_analytics.items():
    if isinstance(value, dict):
        base = _analytics.get(key, {})
        if isinstance(base, dict):
            merged = base.copy()
            merged.update(value)
            _analytics[key] = merged
        else:
            _analytics[key] = value
    else:
        _analytics[key] = value

_DEFAULT_EMOTION_MAP = _DEFAULT_CONFIG["analytics"]["emotion_intensity"]
_raw_emotions = _analytics.get("emotion_intensity", {})
EMOTION_INTENSITY_MAP: Final[Mapping[str, float]] = {
    **_DEFAULT_EMOTION_MAP,
    **{
        key: _safe_float(value, _DEFAULT_EMOTION_MAP.get(key, 0.5))
        for key, value in _raw_emotions.items()
        if isinstance(key, str)
    },
}

DEFAULT_EMOTION_INTENSITY: Final[float] = _safe_float(
    _analytics.get("default_emotion_intensity"), 0.5
)

_pace = _analytics.get("pace", {})
PACE_SLOW_THRESHOLD: Final[float] = _safe_float(_pace.get("slow_threshold"), 1.2)
PACE_FAST_THRESHOLD: Final[float] = _safe_float(_pace.get("fast_threshold"), 0.8)

_allowed_purposes = {"setup", "escalation", "payoff", "breath"}
_allowed_emotions = {"dread", "tension", "respite", "revelation", "aftermath"}


def _normalize_entries(value: Any) -> list[str]:
    if isinstance(value, (list, tuple, set)):
        normalized: list[str] = []
        for entry in value:
            if entry is None:
                continue
            text = str(entry).strip()
            if text:
                normalized.append(text)
        return normalized
    return []


def _resolve_heuristic_list(
    key: str,
    *,
    allowed: set[str] | None = None,
) -> tuple[str, ...]:
    runtime_section = _RUNTIME_CONFIG.get("draft_synthesizer", {})
    if isinstance(runtime_section, dict):
        entries = _normalize_entries(runtime_section.get(key))
        if allowed is not None:
            entries = [entry for entry in entries if entry in allowed]
        if entries:
            return tuple(entries)

    defaults = _normalize_entries(_DEFAULT_CONFIG["draft_synthesizer"].get(key))
    if allowed is not None:
        defaults = [entry for entry in defaults if entry in allowed]
    return tuple(defaults)


def _word_target_config() -> dict[str, Any]:
    runtime_section = _RUNTIME_CONFIG.get("draft_synthesizer", {})
    if isinstance(runtime_section, dict):
        candidate = runtime_section.get("word_target")
        if isinstance(candidate, dict):
            return candidate
    return _DEFAULT_CONFIG["draft_synthesizer"]["word_target"]


DRAFT_POV_CANDIDATES: Final[tuple[str, ...]] = _resolve_heuristic_list("povs")
DRAFT_GOAL_CANDIDATES: Final[tuple[str, ...]] = _resolve_heuristic_list("goals")
DRAFT_CONFLICT_CANDIDATES: Final[tuple[str, ...]] = _resolve_heuristic_list("conflicts")
DRAFT_TURN_CANDIDATES: Final[tuple[str, ...]] = _resolve_heuristic_list("turns")
DRAFT_PURPOSES: Final[tuple[str, ...]] = _resolve_heuristic_list(
    "purposes", allowed=_allowed_purposes
)
DRAFT_EMOTIONS: Final[tuple[str, ...]] = _resolve_heuristic_list(
    "emotions", allowed=_allowed_emotions
)

_word_target = _word_target_config()
WORD_TARGET_BASE: Final[int] = max(0, _safe_int(_word_target.get("base"), 850))
WORD_TARGET_PER_ORDER: Final[int] = max(0, _safe_int(_word_target.get("per_order"), 40))

__all__ = [
    "DEFAULT_SOFT_BUDGET_LIMIT_USD",
    "DEFAULT_HARD_BUDGET_LIMIT_USD",
    "COST_PER_1000_WORDS_USD",
    "SERVICE_PORT_RANGE",
    "HEALTH_MAX_ATTEMPTS",
    "HEALTH_BASE_DELAY_MS",
    "HEALTH_MAX_DELAY_MS",
    "ALLOWED_PYTHON_EXECUTABLES",
    "BUNDLED_PYTHON_PATH",
    "EMOTION_INTENSITY_MAP",
    "DEFAULT_EMOTION_INTENSITY",
    "PACE_SLOW_THRESHOLD",
    "PACE_FAST_THRESHOLD",
    "DRAFT_POV_CANDIDATES",
    "DRAFT_GOAL_CANDIDATES",
    "DRAFT_CONFLICT_CANDIDATES",
    "DRAFT_TURN_CANDIDATES",
    "DRAFT_PURPOSES",
    "DRAFT_EMOTIONS",
    "WORD_TARGET_BASE",
    "WORD_TARGET_PER_ORDER",
    "load_runtime_config",
]
