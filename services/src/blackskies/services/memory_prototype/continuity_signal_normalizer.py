"""Continuity signal normalization for Memory Prototype v1 M3."""

from __future__ import annotations

from .schemas import ContinuitySignal, ContinuitySignalArtifact, SceneDeltaArtifact

_SEVERITIES = {"info", "warning", "conflict"}


class ContinuitySignalNormalizer:
    """Normalize advisory findings into stable continuity signal records."""

    def normalize(self, deltas: SceneDeltaArtifact) -> ContinuitySignalArtifact:
        signals: list[ContinuitySignal] = []
        for candidate in deltas.candidates:
            signal_type = self._signal_type(candidate.category)
            severity = self._severity_for_candidate(candidate.category, candidate.value)
            confidence = max(0.0, min(1.0, candidate.confidence))
            signal = ContinuitySignal(
                type=signal_type,
                entities=candidate.entities,
                scope=f"scene:{deltas.unit_id}",
                severity=severity,
                confidence=confidence,
                anchor=candidate.anchor,
                metadata={"category": candidate.category, "candidate_value": candidate.value[:240]},
            )
            self._validate_signal(signal)
            signals.append(signal)
        return ContinuitySignalArtifact(unit_id=deltas.unit_id, signals=tuple(signals))

    @staticmethod
    def _signal_type(category: str) -> str:
        mapping = {
            "entity_participation": "entity_presence",
            "location_change": "location_shift",
            "relationship_change": "relationship_shift",
            "injury_status_change": "status_shift",
            "introduced_fact": "new_fact",
            "thread_advancement": "thread_progress",
        }
        return mapping.get(category, "advisory_delta")

    @staticmethod
    def _severity_for_candidate(category: str, value: str) -> str:
        lower = value.lower()
        if category == "injury_status_change" and ("dead" in lower and "alive" in lower):
            return "conflict"
        if category in {"injury_status_change", "relationship_change", "location_change"}:
            return "warning"
        return "info"

    @staticmethod
    def _validate_signal(signal: ContinuitySignal) -> None:
        if not signal.type:
            raise ValueError("continuity signal type is required")
        if not signal.scope:
            raise ValueError("continuity signal scope is required")
        if signal.severity not in _SEVERITIES:
            raise ValueError(f"invalid continuity signal severity: {signal.severity}")
        if signal.confidence < 0.0 or signal.confidence > 1.0:
            raise ValueError("continuity signal confidence must be within [0, 1]")
        if not signal.anchor.excerpt:
            raise ValueError("continuity signal anchor excerpt is required")

