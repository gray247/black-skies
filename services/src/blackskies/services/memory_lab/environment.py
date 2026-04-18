"""Environment-tier helpers for runtime governance (Phase 6B)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .locking import acquire_project_lock

_SUPPORTED_LOCK_MODES = {"fcntl", "fcntl_posix"}


@dataclass(frozen=True)
class MemoryLabEnvironmentTier:
    tier: str
    lock_mode: str
    lock_is_effective: bool

    @property
    def is_supported_deterministic(self) -> bool:
        return self.tier == "supported_deterministic"



def detect_environment_tier(project_root: Path) -> MemoryLabEnvironmentTier:
    with acquire_project_lock(project_root) as state:
        supported = bool(state.lock_is_effective and state.lock_mode in _SUPPORTED_LOCK_MODES)
        return MemoryLabEnvironmentTier(
            tier="supported_deterministic" if supported else "best_effort",
            lock_mode=state.lock_mode,
            lock_is_effective=state.lock_is_effective,
        )
