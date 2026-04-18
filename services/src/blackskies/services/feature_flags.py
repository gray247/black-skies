"""Feature-state helpers for optional and deferred runtime surfaces.

Current baseline:
- analytics is part of the shipped backend surface and defaults on
- voice notes remain deferred and require an explicit opt-in flag
- plugin execution is implemented but non-baseline and requires an explicit opt-in flag
"""

from __future__ import annotations

import os

os.environ.setdefault("BLACKSKIES_ENABLE_ANALYTICS", "1")


def voice_notes_enabled() -> bool:
    """Return True only when the deferred voice-note workflow is explicitly enabled."""

    return os.environ.get("BLACKSKIES_ENABLE_VOICE_NOTES") == "1"


def plugins_enabled() -> bool:
    """Return True only when the non-baseline plugin execution path is explicitly enabled."""

    return os.environ.get("BLACKSKIES_ENABLE_PLUGINS") == "1"


def analytics_enabled() -> bool:
    """Return True when baseline analytics remains enabled for the current runtime."""

    return os.environ.get("BLACKSKIES_ENABLE_ANALYTICS") == "1"
