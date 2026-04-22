"""Continuity signal normalization for Memory Prototype v1 M3."""

from __future__ import annotations

import re

from .schemas import (
    ContinuitySignal,
    ContinuitySignalArtifact,
    SceneDeltaArtifact,
    SceneDeltaCandidate,
)

_SEVERITIES = {"info", "warning", "conflict"}
_STATUS_ALIVE = "alive"
_STATUS_DEAD = "dead"


class ContinuitySignalNormalizer:
    """Normalize advisory findings into stable continuity signal records."""

    def normalize(self, deltas: SceneDeltaArtifact) -> ContinuitySignalArtifact:
        signals: list[ContinuitySignal] = []
        status_candidates = []
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
            if candidate.category == "injury_status_change":
                status_candidates.append(candidate)

        signals.extend(self._status_conflicts(unit_id=deltas.unit_id, candidates=status_candidates))
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
        if category == "injury_status_change" and (
            _STATUS_DEAD in lower and _STATUS_ALIVE in lower
        ):
            return "conflict"
        if category in {"injury_status_change", "relationship_change", "location_change"}:
            return "warning"
        return "info"

    @staticmethod
    def _status_conflicts(
        *, unit_id: str, candidates: list[SceneDeltaCandidate]
    ) -> list[ContinuitySignal]:
        grouped: dict[str, dict[str, object]] = {}
        for candidate in candidates:
            statuses = ContinuitySignalNormalizer._extract_statuses(candidate.value)
            if not statuses:
                continue
            entities = candidate.entities if candidate.entities else ("__scene__",)
            for entity in entities:
                bucket = grouped.setdefault(
                    entity, {"statuses": set(), "anchor": None, "confidence": 0.0}
                )
                bucket["statuses"].update(statuses)
                bucket["confidence"] = max(float(bucket["confidence"]), float(candidate.confidence))
                if bucket["anchor"] is None:
                    bucket["anchor"] = candidate.anchor

        output: list[ContinuitySignal] = []
        for entity, bucket in grouped.items():
            statuses = bucket["statuses"]
            if _STATUS_ALIVE in statuses and _STATUS_DEAD in statuses:
                raw_anchor = bucket["anchor"]
                if raw_anchor is None:
                    continue
                entities = tuple() if entity == "__scene__" else (entity,)
                signal = ContinuitySignal(
                    type="status_contradiction",
                    entities=entities,
                    scope=f"scene:{unit_id}",
                    severity="conflict",
                    confidence=max(0.7, min(1.0, float(bucket["confidence"]))),
                    anchor=raw_anchor,
                    metadata={
                        "category": "injury_status_change",
                        "conflict_pair": [_STATUS_ALIVE, _STATUS_DEAD],
                    },
                )
                ContinuitySignalNormalizer._validate_signal(signal)
                output.append(signal)
        return output

    @staticmethod
    def _extract_statuses(value: str) -> set[str]:
        statuses: set[str] = set()
        if re.search(r"\balive\b", value, flags=re.IGNORECASE):
            statuses.add(_STATUS_ALIVE)
        if re.search(r"\bdead\b", value, flags=re.IGNORECASE):
            statuses.add(_STATUS_DEAD)
        return statuses

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
