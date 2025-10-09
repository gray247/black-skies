"""Rubric application utilities for Black Skies drafts."""

from __future__ import annotations

import math
from dataclasses import asdict
from typing import Any, Iterable

from .models import Critique, Draft

CRITIQUE_MODEL = {"name": "black-skies-rubric-v1", "provider": "offline"}
CATEGORIES = ["Logic", "Continuity", "Character", "Pacing", "Prose", "Horror"]


def _sentence_lengths(text: str) -> list[int]:
    sentences = [segment.strip() for segment in text.replace("\n", " ").split(".")]
    lengths: list[int] = []
    for sentence in sentences:
        if sentence:
            lengths.append(len(sentence.split()))
    return lengths or [0]


def _longest_line(lines: Iterable[str]) -> tuple[int, str]:
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
        f"Average sentence length is {avg_sentence:.1f} words; longest sentence uses {longest_sentence} words.",
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


__all__ = ["apply_rubric", "CRITIQUE_MODEL", "CATEGORIES"]
