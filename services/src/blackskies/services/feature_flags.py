"""Feature guards for deferred Phase 8 functionality."""

from __future__ import annotations

import os

os.environ.setdefault("BLACKSKIES_ENABLE_ANALYTICS", "1")


def voice_notes_enabled() -> bool:
    """Return True when voice-note recording/transcription is explicitly enabled."""

    return os.environ.get("BLACKSKIES_ENABLE_VOICE_NOTES") == "1"


def plugins_enabled() -> bool:
    """Return True when plugin execution is explicitly enabled."""

    return os.environ.get("BLACKSKIES_ENABLE_PLUGINS") == "1"


def analytics_enabled() -> bool:
    """Return True when the analytics service is explicitly enabled."""

    return os.environ.get("BLACKSKIES_ENABLE_ANALYTICS") == "1"
