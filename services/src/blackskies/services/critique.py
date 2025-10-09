"""Rubric evaluation helpers and critique service implementations."""

from __future__ import annotations

import copy
import json
from importlib import resources
from typing import Any, Final, Iterable

from .models import Critique, Draft
from .models.critique import DraftCritiqueRequest

CRITIQUE_MODEL: Final[dict[str, str]] = {
    "name": "black-skies-rubric-v1",
    "provider": "offline",
}
CATEGORIES: Final[list[str]] = [
    "Logic",
    "Continuity",
    "Character",
    "Pacing",
    "Prose",
    "Horror",
]


def _sentence_lengths(text: str) -> list[int]:
    """Return word counts for each sentence in the provided text."""

    sentences = [segment.strip() for segment in text.replace("\n", " ").split(".")]
    lengths: list[int] = []
    for sentence in sentences:
        if sentence:
            lengths.append(len(sentence.split()))
    return lengths or [0]


def _longest_line(lines: Iterable[str]) -> tuple[int, str]:
    """Return the longest line and its one-based index."""

    best_line = ""
    best_index = 0
    for index, line in enumerate(lines, start=1):
        if len(line) > len(best_line):
            best_line = line
            best_index = index
    return best_index, best_line


def apply_rubric(draft: Draft) -> Critique:
    """Evaluate a draft against the baseline rubric and produce a critique."""

    text = draft.text
    lines = text.splitlines()
    word_count = len(text.split())
    sentence_lengths = _sentence_lengths(text)
    avg_sentence = sum(sentence_lengths) / len(sentence_lengths)
    longest_sentence = max(sentence_lengths)
    line_index, longest_line = _longest_line(lines or [text])

    summary_parts = [
        f"Draft '{draft.title}' spans {word_count} words across {len(lines) or 1} line(s).",
        (
            "Average sentence length is "
            f"{avg_sentence:.1f} words; longest sentence uses {longest_sentence} words."
        ),
    ]
    if avg_sentence > 25:
        summary_parts.append("Pacing slows due to long sentences; consider strategic breaks.")
    elif avg_sentence < 8:
        summary_parts.append("Rapid-fire pacing detected; blend in longer beats for contrast.")

    line_comments: list[dict[str, Any]] = []
    if longest_line:
        line_comments.append(
            {
                "line": line_index,
                "note": "Longest line in the scene; tighten phrasing to sustain tension.",
                "excerpt": longest_line[:160],
            }
        )

    priorities = [
        "Validate logical continuity between beats.",
        "Ensure character motivation remains visible in each reversal.",
    ]
    if avg_sentence > 20:
        priorities.append("Split or tighten long sentences to restore pacing.")
    if word_count < 200:
        priorities.append("Expand atmospheric detail to deepen horror tone.")

    suggested_edits: list[dict[str, Any]] = []
    if longest_line:
        begin = text.find(longest_line)
        if begin >= 0:
            suggested_edits.append(
                {
                    "range": [begin, begin + len(longest_line)],
                    "replacement": longest_line.strip().rstrip(",.;") + ".",
                }
            )

    severity = "medium"
    if avg_sentence > 30 or word_count < 120:
        severity = "high"
    elif avg_sentence < 12 and word_count > 800:
        severity = "low"

    critique = Critique(
        unit_id=draft.unit_id,
        summary=" ".join(summary_parts),
        line_comments=line_comments,
        priorities=priorities,
        suggested_edits=suggested_edits,
        severity=severity,
        model=CRITIQUE_MODEL,
    )
    return critique


class CritiqueService:
    """Generate critique payloads compliant with CritiqueOutputSchema v1."""

    _FIXTURE_PACKAGE: Final[str] = "blackskies.services.fixtures"
    _FIXTURE_NAME: Final[str] = "draft_critique.json"
    _SCHEMA_VERSION: Final[str] = "CritiqueOutputSchema v1"

    def __init__(self, fixtures_package: str | None = None) -> None:
        self._fixtures_package = fixtures_package or self._FIXTURE_PACKAGE
        self._cached_fixture: dict[str, Any] | None = None

    def run(self, request: DraftCritiqueRequest) -> dict[str, Any]:
        """Return a critique payload tailored to the requested unit."""

        payload = copy.deepcopy(self._load_fixture())
        payload["unit_id"] = request.unit_id
        payload["schema_version"] = self._SCHEMA_VERSION
        return payload

    def _load_fixture(self) -> dict[str, Any]:
        """Load and cache the baseline critique fixture."""

        if self._cached_fixture is not None:
            return self._cached_fixture

        try:
            fixture_path = resources.files(self._fixtures_package).joinpath(self._FIXTURE_NAME)
        except (FileNotFoundError, ModuleNotFoundError) as exc:  # pragma: no cover
            msg = "Critique fixture namespace is unavailable."
            raise RuntimeError(msg) from exc

        try:
            with fixture_path.open("r", encoding="utf-8") as handle:
                self._cached_fixture = json.load(handle)
        except FileNotFoundError as exc:  # pragma: no cover - defensive guard
            msg = "Critique fixture is missing."
            raise RuntimeError(msg) from exc
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
            msg = "Critique fixture contains invalid JSON."
            raise RuntimeError(msg) from exc

        return self._cached_fixture


__all__ = ["apply_rubric", "CritiqueService", "CRITIQUE_MODEL", "CATEGORIES"]
