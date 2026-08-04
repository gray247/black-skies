"""Feature maturity helpers for optional and deferred runtime surfaces.

Maturity applies only to user-meaningful feature surfaces and subsystem
exposure. It does not replace ordinary operational toggles.
"""

from __future__ import annotations

import os
from enum import Enum



class FeatureMaturity(str, Enum):
    """Feature exposure maturity for user-meaningful subsystems.

    Definitions:
    - ``off``: not active, not exposed
    - ``experimental``: intentionally unstable, non-baseline
    - ``internal``: usable internally/testing only, not product surface
    - ``partial``: visible seam exists, incomplete contract
    - ``production``: stable, baseline-supported surface
    """

    OFF = "off"
    EXPERIMENTAL = "experimental"
    INTERNAL = "internal"
    PARTIAL = "partial"
    PRODUCTION = "production"

    @property
    def is_active(self) -> bool:
        return self is not FeatureMaturity.OFF

    @classmethod
    def parse(cls, value: str | "FeatureMaturity" | None) -> "FeatureMaturity | None":
        if value is None:
            return None
        if isinstance(value, cls):
            return value
        normalized = value.strip().lower()
        if not normalized:
            return None
        return cls(normalized)


def normalize_feature_maturity(
    explicit: FeatureMaturity | str | None,
    *,
    legacy_enabled: bool | None,
    enabled_state: FeatureMaturity,
    default_state: FeatureMaturity = FeatureMaturity.OFF,
) -> FeatureMaturity:
    """Normalize explicit maturity plus a legacy boolean into one maturity state."""

    parsed = FeatureMaturity.parse(explicit)
    if parsed is not None:
        return parsed
    if legacy_enabled is None:
        return default_state
    return enabled_state if legacy_enabled else default_state


def _maturity_from_env(
    *,
    maturity_env_var: str,
    legacy_bool_env_var: str,
    enabled_state: FeatureMaturity,
    default_state: FeatureMaturity,
) -> FeatureMaturity:
    explicit = FeatureMaturity.parse(os.environ.get(maturity_env_var))
    legacy_raw = os.environ.get(legacy_bool_env_var)
    legacy_enabled = None if legacy_raw is None else legacy_raw == "1"
    return normalize_feature_maturity(
        explicit,
        legacy_enabled=legacy_enabled,
        enabled_state=enabled_state,
        default_state=default_state,
    )


def voice_notes_maturity() -> FeatureMaturity:
    """Return maturity for the deferred voice-note workflow.

    This flag controls a deferred seam (archival verification + health
    diagnostics) and does not imply a shipped recording/transcription product
    surface.
    """

    return _maturity_from_env(
        maturity_env_var="BLACKSKIES_VOICE_NOTES_MATURITY",
        legacy_bool_env_var="BLACKSKIES_ENABLE_VOICE_NOTES",
        enabled_state=FeatureMaturity.INTERNAL,
        default_state=FeatureMaturity.OFF,
    )


def voice_notes_enabled() -> bool:
    """Return True only when the deferred voice-note workflow is explicitly enabled."""

    return voice_notes_maturity().is_active


def plugins_maturity() -> FeatureMaturity:
    """Return maturity for the optional plugin execution surface."""

    return _maturity_from_env(
        maturity_env_var="BLACKSKIES_PLUGINS_MATURITY",
        legacy_bool_env_var="BLACKSKIES_ENABLE_PLUGINS",
        enabled_state=FeatureMaturity.PARTIAL,
        default_state=FeatureMaturity.OFF,
    )


def plugins_enabled() -> bool:
    """Return True only when the non-baseline plugin execution path is explicitly enabled."""

    return plugins_maturity().is_active


def analytics_maturity() -> FeatureMaturity:
    """Return maturity for analytics exposure in the current runtime."""

    return _maturity_from_env(
        maturity_env_var="BLACKSKIES_ANALYTICS_MATURITY",
        legacy_bool_env_var="BLACKSKIES_ENABLE_ANALYTICS",
        enabled_state=FeatureMaturity.INTERNAL,
        default_state=FeatureMaturity.OFF,
    )


def analytics_enabled() -> bool:
    """Return True only when non-baseline analytics is explicitly enabled."""

    return analytics_maturity().is_active


__all__ = [
    "FeatureMaturity",
    "analytics_enabled",
    "analytics_maturity",
    "normalize_feature_maturity",
    "plugins_enabled",
    "plugins_maturity",
    "voice_notes_enabled",
    "voice_notes_maturity",
]
