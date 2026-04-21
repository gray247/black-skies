"""Advisory scene delta extraction for Memory Prototype v1 M3."""

from __future__ import annotations

import re
from dataclasses import dataclass

from .schemas import (
    CanonicalNarrativeSnapshot,
    SceneDeltaArtifact,
    SceneDeltaCandidate,
    SignalAnchor,
)

_LOCATION_TERMS = (
    "cellar",
    "hall",
    "street",
    "roof",
    "kitchen",
    "library",
    "attic",
    "garden",
    "dock",
)
_RELATION_TERMS = ("trust", "ally", "betray", "partner", "enemy", "friend")
_INJURY_TERMS = ("injured", "wounded", "bleeding", "dead", "alive", "unconscious", "exhausted")
_THREAD_TERMS = ("plan", "goal", "decides", "vows", "promise", "mission", "objective", "pursue")
_FACT_TERMS = ("reveals", "discovers", "learns", "confirms", "is", "was")


@dataclass(frozen=True)
class _Line:
    number: int
    text: str


class SceneDeltaExtractor:
    """Extract structured advisory delta candidates from accepted scene text."""

    def extract(self, snapshot: CanonicalNarrativeSnapshot) -> SceneDeltaArtifact:
        lines = self._lines(snapshot.draft_text)
        entity_tokens = self._known_entities(snapshot)
        candidates: list[SceneDeltaCandidate] = []

        for line in lines:
            lower = line.text.lower()
            anchor = SignalAnchor(
                source_path=str(snapshot.draft_path),
                unit_id=snapshot.lineage.unit_id,
                excerpt=line.text[:220],
                line_start=line.number,
                line_end=line.number,
            )
            entities = self._line_entities(line.text, entity_tokens)

            if any(term in lower for term in _LOCATION_TERMS):
                candidates.append(
                    SceneDeltaCandidate(
                        category="location_change",
                        value=line.text.strip(),
                        entities=tuple(entities),
                        confidence=0.55,
                        anchor=anchor,
                    )
                )
            if any(term in lower for term in _RELATION_TERMS):
                candidates.append(
                    SceneDeltaCandidate(
                        category="relationship_change",
                        value=line.text.strip(),
                        entities=tuple(entities),
                        confidence=0.62,
                        anchor=anchor,
                    )
                )
            if any(term in lower for term in _INJURY_TERMS):
                candidates.append(
                    SceneDeltaCandidate(
                        category="injury_status_change",
                        value=line.text.strip(),
                        entities=tuple(entities),
                        confidence=0.72,
                        anchor=anchor,
                    )
                )
            if any(term in lower for term in _THREAD_TERMS):
                candidates.append(
                    SceneDeltaCandidate(
                        category="thread_advancement",
                        value=line.text.strip(),
                        entities=tuple(entities),
                        confidence=0.6,
                        anchor=anchor,
                    )
                )
            if any(term in lower for term in _FACT_TERMS) and len(line.text.split()) >= 4:
                candidates.append(
                    SceneDeltaCandidate(
                        category="introduced_fact",
                        value=line.text.strip(),
                        entities=tuple(entities),
                        confidence=0.5,
                        anchor=anchor,
                    )
                )
            if entities:
                candidates.append(
                    SceneDeltaCandidate(
                        category="entity_participation",
                        value=line.text.strip(),
                        entities=tuple(entities),
                        confidence=0.7,
                        anchor=anchor,
                    )
                )

        deduped = self._dedupe(candidates)
        return SceneDeltaArtifact(unit_id=snapshot.lineage.unit_id, candidates=tuple(deduped))

    @staticmethod
    def _lines(text: str) -> list[_Line]:
        rows = text.splitlines()
        return [_Line(number=i + 1, text=row) for i, row in enumerate(rows) if row.strip()]

    @staticmethod
    def _known_entities(snapshot: CanonicalNarrativeSnapshot) -> set[str]:
        entities: set[str] = set()
        for lore in snapshot.lore_payloads:
            for key in ("name", "id", "display_name"):
                value = lore.get(key)
                if isinstance(value, str) and value.strip():
                    entities.add(value.strip())
        return entities

    @staticmethod
    def _line_entities(text: str, known: set[str]) -> list[str]:
        found: list[str] = []
        for candidate in known:
            if candidate and candidate.lower() in text.lower():
                found.append(candidate)
        if found:
            return sorted(set(found))

        proper_names = re.findall(r"\b[A-Z][a-z]{2,}\b", text)
        return sorted(set(proper_names[:4]))

    @staticmethod
    def _dedupe(candidates: list[SceneDeltaCandidate]) -> list[SceneDeltaCandidate]:
        seen: set[tuple[str, str, int, int]] = set()
        output: list[SceneDeltaCandidate] = []
        for candidate in candidates:
            key = (
                candidate.category,
                candidate.value.strip().lower(),
                candidate.anchor.line_start,
                candidate.anchor.line_end,
            )
            if key in seen:
                continue
            seen.add(key)
            output.append(candidate)
        return output
