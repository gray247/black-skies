"""Task packet assembly for Memory Prototype v1 M4."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from .schemas import (
    CanonicalConflict,
    CanonicalNarrativeSnapshot,
    ContinuitySignalArtifact,
    PROTOTYPE_VERSION,
    SCHEMA_VERSION,
    PacketType,
    SceneDeltaArtifact,
    TaskPacket,
)

_LOCATION_TERMS = ("cellar", "hall", "street", "roof", "kitchen", "library", "attic", "garden", "dock")
_THREAD_TERMS = ("plan", "goal", "decides", "vows", "promise", "mission", "objective", "pursue", "protect")


@dataclass(frozen=True)
class _ResolvedField:
    value: str | None
    source: str | None
    conflicts: tuple[CanonicalConflict, ...]


class TaskPacketAssembler:
    """Assemble compact lineage-safe advisory task packets."""

    def assemble(
        self,
        *,
        packet_type: PacketType,
        snapshot: CanonicalNarrativeSnapshot,
        deltas: SceneDeltaArtifact,
        signals: ContinuitySignalArtifact,
    ) -> TaskPacket:
        location = self._resolve_field("location", snapshot)
        goal = self._resolve_field("goal", snapshot)
        participants = self._participants(snapshot)

        canonical = {
            "location": location.value,
            "goal": goal.value,
            "participants": participants[:6],
            "locked_facts": self._locked_facts(snapshot)[:10],
            "draft_excerpt": snapshot.draft_text[:600],
        }
        advisory = {
            "delta_highlights": [
                {
                    "category": candidate.category,
                    "value": candidate.value[:180],
                    "confidence": candidate.confidence,
                    "anchor": candidate.anchor.as_dict(),
                }
                for candidate in deltas.candidates[:6]
            ],
            "continuity_signals": [
                {
                    "type": signal.type,
                    "severity": signal.severity,
                    "confidence": signal.confidence,
                    "entities": list(signal.entities),
                    "anchor": signal.anchor.as_dict(),
                }
                for signal in signals.signals[:6]
            ],
        }
        if packet_type == "draft":
            advisory["task_focus"] = [item["value"] for item in advisory["delta_highlights"][:3]]
        elif packet_type == "rewrite":
            advisory["task_focus"] = [
                item["type"]
                for item in advisory["continuity_signals"]
                if item["severity"] in {"warning", "conflict"}
            ][:3]
        elif packet_type == "critique":
            advisory["task_focus"] = [
                item["category"]
                for item in advisory["delta_highlights"]
                if item["confidence"] >= 0.6
            ][:3]

        conflicts = tuple(list(location.conflicts) + list(goal.conflicts))
        return TaskPacket(
            schema_version=SCHEMA_VERSION,
            prototype_version=PROTOTYPE_VERSION,
            project_id=snapshot.lineage.project_id,
            unit_id=snapshot.lineage.unit_id,
            lineage_key=snapshot.lineage.key,
            packet_type=packet_type,
            generated_at=datetime.now(UTC).isoformat(),
            source_hashes=snapshot.source_hashes,
            canonical=canonical,
            advisory=advisory,
            canonical_conflicts=conflicts,
        )

    def _resolve_field(self, field: str, snapshot: CanonicalNarrativeSnapshot) -> _ResolvedField:
        source_values = [
            ("locked_fields", self._from_locked_fields(field, snapshot)),
            ("accepted_draft", self._from_draft(field, snapshot)),
            ("accepted_outline", self._from_outline(field, snapshot)),
            ("lore_reference", self._from_lore(field, snapshot)),
        ]
        chosen_source = None
        chosen_value = None
        conflicts: list[CanonicalConflict] = []
        for source, value in source_values:
            if not value:
                continue
            if chosen_value is None:
                chosen_source = source
                chosen_value = value
                continue
            if value != chosen_value:
                conflicts.append(
                    CanonicalConflict(
                        field=field,
                        chosen_source=chosen_source or "unknown",
                        chosen_value=chosen_value,
                        conflicting_source=source,
                        conflicting_value=value,
                    )
                )
        return _ResolvedField(value=chosen_value, source=chosen_source, conflicts=tuple(conflicts))

    @staticmethod
    def _locked_facts(snapshot: CanonicalNarrativeSnapshot) -> list[str]:
        payload = snapshot.locked_fields_payload
        if isinstance(payload, list):
            return [str(item).strip() for item in payload if str(item).strip()]
        if isinstance(payload, dict):
            facts = payload.get("facts")
            if isinstance(facts, list):
                return [str(item).strip() for item in facts if str(item).strip()]
        return []

    def _from_locked_fields(self, field: str, snapshot: CanonicalNarrativeSnapshot) -> str | None:
        prefix = f"{field}:"
        for fact in self._locked_facts(snapshot):
            if fact.lower().startswith(prefix):
                value = fact.split(":", 1)[1].strip()
                if value:
                    return value
        return None

    def _from_draft(self, field: str, snapshot: CanonicalNarrativeSnapshot) -> str | None:
        text = snapshot.draft_text
        lower = text.lower()
        if field == "location":
            for token in _LOCATION_TERMS:
                if token in lower:
                    return token
            return None
        if field == "goal":
            for line in text.splitlines():
                if any(term in line.lower() for term in _THREAD_TERMS):
                    return line.strip()[:160] or None
            return None
        return None

    @staticmethod
    def _outline_scene(snapshot: CanonicalNarrativeSnapshot) -> dict[str, Any] | None:
        payload = snapshot.outline_payload
        if not isinstance(payload, dict):
            return None
        scenes = payload.get("scenes")
        if not isinstance(scenes, list):
            return None
        for scene in scenes:
            if not isinstance(scene, dict):
                continue
            if str(scene.get("id", "")) == snapshot.lineage.unit_id:
                return scene
        return None

    def _from_outline(self, field: str, snapshot: CanonicalNarrativeSnapshot) -> str | None:
        scene = self._outline_scene(snapshot)
        if not scene:
            return None
        if field == "location":
            for key in ("location", "setting", "place"):
                value = scene.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        if field == "goal":
            for key in ("goal", "objective", "purpose"):
                value = scene.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()
        return None

    def _from_lore(self, field: str, snapshot: CanonicalNarrativeSnapshot) -> str | None:
        if field == "location":
            for lore in snapshot.lore_payloads:
                value = lore.get("home_base") or lore.get("location")
                if isinstance(value, str) and value.strip():
                    return value.strip()
        if field == "goal":
            for lore in snapshot.lore_payloads:
                value = lore.get("goal") or lore.get("objective")
                if isinstance(value, str) and value.strip():
                    return value.strip()
        return None

    @staticmethod
    def _participants(snapshot: CanonicalNarrativeSnapshot) -> list[str]:
        names: set[str] = set()
        for lore in snapshot.lore_payloads:
            for key in ("name", "id", "display_name"):
                value = lore.get(key)
                if isinstance(value, str) and value.strip() and value.lower() in snapshot.draft_text.lower():
                    names.add(value.strip())
        if names:
            return sorted(names)
        inferred = re.findall(r"\b[A-Z][a-z]{2,}\b", snapshot.draft_text)
        return sorted(set(inferred[:8]))

