"""Deterministic critique analyzer operating on Markdown scenes."""

from __future__ import annotations

import logging
import math
import re
from bisect import bisect_right
from dataclasses import dataclass
from typing import Sequence

from .config import Settings
from .models import (
    CritiqueOutput,
    LineComment,
    ModelInfo,
    SuggestedEdit,
)

LOGGER = logging.getLogger(__name__)

WORD_PATTERN = re.compile(r"\b[\w']+\b")
SENTENCE_PATTERN = re.compile(r"[^.!?]+[.!?]")
REPEATED_WORD_PATTERN = re.compile(r"\b(\w+)\b\s+\b\1\b", re.IGNORECASE)
HORROR_LEXICON = {
    "blood",
    "bloody",
    "bone",
    "crypt",
    "dark",
    "dread",
    "echo",
    "ghost",
    "gore",
    "grit",
    "night",
    "rot",
    "shadow",
    "shiver",
    "shriek",
    "scream",
    "specter",
    "teeth",
    "terror",
    "whisper",
}
SENSORY_LEXICON = {
    "pulse",
    "hum",
    "static",
    "vibrate",
    "copper",
    "wet",
    "cold",
    "sickly",
    "metallic",
    "ozone",
}


class SceneNotFoundError(RuntimeError):
    """Raised when a scene file cannot be located."""


@dataclass(slots=True)
class Sentence:
    """Metadata for a detected sentence."""

    text: str
    start: int
    end: int
    word_count: int
    line_number: int


@dataclass(slots=True)
class Paragraph:
    """Metadata for a paragraph span."""

    start_line: int
    end_line: int
    word_count: int
    text: str


@dataclass(slots=True)
class RepeatedWord:
    """Details for a detected repeated word sequence."""

    word: str
    start: int
    end: int
    line_number: int


@dataclass(slots=True)
class SceneDocument:
    """Parsed Markdown scene ready for analysis."""

    unit_id: str
    front_matter: dict[str, str]
    body_lines: list[str]
    body_start_line: int
    line_offsets: list[int]

    @property
    def body_text(self) -> str:
        """Concatenate body lines preserving newlines."""

        return "\n".join(self.body_lines)

    def line_number_for_offset(self, offset: int) -> int:
        """Convert a character offset within the body to a source line number."""

        if not self.line_offsets:
            return self.body_start_line
        index = bisect_right(self.line_offsets, max(0, offset)) - 1
        if index < 0:
            index = 0
        if index >= len(self.line_offsets):
            index = len(self.line_offsets) - 1
        return self.body_start_line + index


@dataclass(slots=True)
class SceneMetrics:
    """Computed metrics describing a scene."""

    word_count: int
    average_sentence_length: float
    sentences: list[Sentence]
    paragraphs: list[Paragraph]
    longest_sentence: Sentence | None
    repeated_word: RepeatedWord | None
    longest_line_number: int | None
    longest_line_length: int
    horror_word_count: int
    sensory_hits: int


class CritiqueAnalyzer:
    """Generate deterministic critique suggestions for a scene."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def analyze_unit(self, unit_id: str, rubric: Sequence[str]) -> CritiqueOutput:
        """Return a critique artifact for the requested unit."""

        document = self._load_scene(unit_id)
        metrics = self._compute_metrics(document)
        summary = self._build_summary(document, metrics, rubric)
        line_comments = self._build_line_comments(document, metrics, rubric)
        priorities = self._build_priorities(document, metrics, rubric)
        suggested_edits = self._build_suggested_edits(document, metrics, rubric)

        return CritiqueOutput(
            unit_id=unit_id,
            summary=summary,
            line_comments=line_comments,
            priorities=priorities,
            suggested_edits=suggested_edits,
            model=ModelInfo(name="heuristic_critique_v1", provider="local"),
        )

    def _load_scene(self, unit_id: str) -> SceneDocument:
        """Load and parse the Markdown scene associated with the unit."""

        scene_path = self._settings.drafts_directory / f"{unit_id}.md"
        try:
            raw_text = scene_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise SceneNotFoundError(f"Scene {unit_id} not found") from exc

        lines = raw_text.splitlines()
        front_matter: dict[str, str] = {}
        body_lines: list[str]
        body_start_line = 1

        if lines and lines[0].strip() == "---":
            try:
                end_index = lines[1:].index("---") + 1
            except ValueError:
                LOGGER.warning("Scene %s front matter not closed; treating entire file as body", unit_id)
                end_index = -1
            if end_index > 0:
                front_matter = self._parse_front_matter(lines[1:end_index])
                body_lines = lines[end_index + 1 :]
                body_start_line = end_index + 2
            else:
                body_lines = lines[1:]
        else:
            body_lines = lines

        line_offsets = self._compute_line_offsets(body_lines)
        return SceneDocument(
            unit_id=unit_id,
            front_matter=front_matter,
            body_lines=body_lines,
            body_start_line=body_start_line,
            line_offsets=line_offsets,
        )

    @staticmethod
    def _parse_front_matter(lines: Sequence[str]) -> dict[str, str]:
        """Parse simple YAML-style key/value front matter."""

        data: dict[str, str] = {}
        for entry in lines:
            stripped = entry.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if ":" not in stripped:
                continue
            key, value = stripped.split(":", 1)
            data[key.strip()] = value.strip()
        return data

    @staticmethod
    def _compute_line_offsets(body_lines: Sequence[str]) -> list[int]:
        """Compute cumulative offsets for each body line."""

        offsets: list[int] = []
        cursor = 0
        for index, line in enumerate(body_lines):
            offsets.append(cursor)
            cursor += len(line)
            if index != len(body_lines) - 1:
                cursor += 1
        return offsets

    def _compute_metrics(self, document: SceneDocument) -> SceneMetrics:
        """Compute aggregate metrics that feed the critique heuristics."""

        body_text = document.body_text
        words = WORD_PATTERN.findall(body_text)
        sentences = self._extract_sentences(document, body_text)
        longest_sentence = max(sentences, key=lambda item: item.word_count, default=None)

        paragraphs = self._extract_paragraphs(document)
        repeated_word = self._detect_repeated_word(document, body_text)
        longest_line_number, longest_line_length = self._detect_longest_line(document)
        horror_word_count = sum(1 for word in words if word.lower() in HORROR_LEXICON)
        sensory_hits = sum(1 for word in words if word.lower() in SENSORY_LEXICON)
        avg_sentence_length = 0.0
        if sentences:
            avg_sentence_length = sum(sentence.word_count for sentence in sentences) / len(sentences)

        return SceneMetrics(
            word_count=len(words),
            average_sentence_length=avg_sentence_length,
            sentences=sentences,
            paragraphs=paragraphs,
            longest_sentence=longest_sentence,
            repeated_word=repeated_word,
            longest_line_number=longest_line_number,
            longest_line_length=longest_line_length,
            horror_word_count=horror_word_count,
            sensory_hits=sensory_hits,
        )

    def _extract_sentences(self, document: SceneDocument, body_text: str) -> list[Sentence]:
        """Tokenise body text into sentences."""

        sentences: list[Sentence] = []
        for match in SENTENCE_PATTERN.finditer(body_text):
            text = match.group().strip()
            if not text:
                continue
            words = WORD_PATTERN.findall(text)
            if not words:
                continue
            start, end = match.span()
            line_number = document.line_number_for_offset(start)
            sentences.append(Sentence(text=text, start=start, end=end, word_count=len(words), line_number=line_number))

        stripped = body_text.strip()
        if not sentences and stripped:
            start = body_text.find(stripped)
            end = start + len(stripped)
            line_number = document.line_number_for_offset(start)
            word_count = len(WORD_PATTERN.findall(stripped))
            sentences.append(Sentence(text=stripped, start=start, end=end, word_count=word_count, line_number=line_number))

        return sentences

    def _extract_paragraphs(self, document: SceneDocument) -> list[Paragraph]:
        """Identify paragraph ranges within the body lines."""

        paragraphs: list[Paragraph] = []
        if not document.body_lines:
            return paragraphs

        start_index: int | None = None
        word_count = 0
        for index, line in enumerate(document.body_lines):
            if line.strip():
                if start_index is None:
                    start_index = index
                    word_count = 0
                word_count += len(WORD_PATTERN.findall(line))
            else:
                if start_index is not None:
                    start_line = document.body_start_line + start_index
                    end_line = document.body_start_line + index - 1
                    text = "\n".join(document.body_lines[start_index:index]).strip()
                    paragraphs.append(Paragraph(start_line, end_line, word_count, text))
                    start_index = None
        if start_index is not None:
            start_line = document.body_start_line + start_index
            end_line = document.body_start_line + len(document.body_lines) - 1
            text = "\n".join(document.body_lines[start_index:]).strip()
            paragraphs.append(Paragraph(start_line, end_line, word_count, text))
        return paragraphs

    def _detect_repeated_word(self, document: SceneDocument, body_text: str) -> RepeatedWord | None:
        """Find the first occurrence of an immediate repeated word."""

        match = REPEATED_WORD_PATTERN.search(body_text)
        if not match:
            return None
        start, end = match.span()
        line_number = document.line_number_for_offset(start)
        return RepeatedWord(word=match.group(1), start=start, end=end, line_number=line_number)

    def _detect_longest_line(self, document: SceneDocument) -> tuple[int | None, int]:
        """Identify the longest line length and number."""

        longest_length = 0
        longest_number: int | None = None
        for index, line in enumerate(document.body_lines):
            length = len(line)
            if length > longest_length:
                longest_length = length
                longest_number = document.body_start_line + index
        return longest_number, longest_length

    def _build_summary(
        self,
        document: SceneDocument,
        metrics: SceneMetrics,
        rubric: Sequence[str],
    ) -> str:
        """Create a concise summary referencing key metrics."""

        purpose = document.front_matter.get("purpose", "scene").strip() or "scene"
        goal = document.front_matter.get("goal", "").strip()
        emotion = document.front_matter.get("emotion_tag", "").strip()
        paragraph_count = len(metrics.paragraphs)
        pieces: list[str] = []

        base = f"{purpose.capitalize()} scene at ~{metrics.word_count} words"
        if goal:
            base += f" pursuing {goal}."
        else:
            base += "."
        pieces.append(base)

        if paragraph_count:
            pieces.append(
                f"Structure: {paragraph_count} paragraph{'s' if paragraph_count != 1 else ''}; average sentence length {metrics.average_sentence_length:.1f} words."
            )

        if emotion:
            pieces.append(f"Tone leans {emotion} throughout.")

        if metrics.longest_sentence is not None:
            pieces.append(
                f"Longest sentence runs {metrics.longest_sentence.word_count} words near line {metrics.longest_sentence.line_number}."
            )

        if "Horror" in rubric and metrics.horror_word_count < 2:
            pieces.append("Horror rubric flag: build a sharper sensory sting in the closing beat.")

        return " ".join(pieces)

    def _build_line_comments(
        self,
        document: SceneDocument,
        metrics: SceneMetrics,
        rubric: Sequence[str],
    ) -> list[LineComment]:
        """Generate inline comments based on detected issues."""

        comments: list[LineComment] = []

        if metrics.longest_sentence is not None and metrics.longest_sentence.word_count >= 18:
            comments.append(
                LineComment(
                    line=metrics.longest_sentence.line_number,
                    note=(
                        f"Split this {metrics.longest_sentence.word_count}-word sentence to keep pacing tight."
                    ),
                )
            )

        if metrics.repeated_word is not None:
            comments.append(
                LineComment(
                    line=metrics.repeated_word.line_number,
                    note=f"Duplicate word '{metrics.repeated_word.word}' stalls the prose; trim one occurrence.",
                )
            )

        if "Horror" in rubric and metrics.horror_word_count < 2 and metrics.paragraphs:
            last_paragraph = metrics.paragraphs[-1]
            comments.append(
                LineComment(
                    line=last_paragraph.end_line,
                    note="Layer a visceral image here so the horror beat lands with force.",
                )
            )

        if not comments and document.body_lines:
            comments.append(
                LineComment(
                    line=document.body_start_line,
                    note="Open with a more specific physical detail to anchor the reader.",
                )
            )

        return comments

    def _build_priorities(
        self,
        document: SceneDocument,
        metrics: SceneMetrics,
        rubric: Sequence[str],
    ) -> list[str]:
        """Derive top priorities informed by rubric selections."""

        priorities: list[str] = []
        goal = document.front_matter.get("goal", "").strip()
        pov = document.front_matter.get("pov", "").strip()

        if goal:
            priorities.append(f"Clarify how achieving '{goal}' shifts the stakes to satisfy Logic/Continuity.")
        else:
            priorities.append("State the scene objective explicitly so the Logic beat stays clear.")

        if metrics.longest_sentence is not None and metrics.longest_sentence.word_count >= 18:
            priorities.append(
                f"Break the {metrics.longest_sentence.word_count}-word sentence near line {metrics.longest_sentence.line_number} to smooth pacing."
            )
        else:
            priorities.append("Vary sentence cadence to keep the pacing lively through the midpoint.")

        if "Horror" in rubric and metrics.horror_word_count < 2:
            priorities.append("Add at least one sensory horror cue in the closing paragraph to uphold the Horror rubric.")
        elif "Character" in rubric and pov:
            priorities.append(f"Thread more internal response from {pov} to deepen Character focus.")
        elif "Prose" in rubric:
            priorities.append("Tighten language by trimming filler words and sharpening imagery.")

        return priorities

    def _build_suggested_edits(
        self,
        document: SceneDocument,
        metrics: SceneMetrics,
        rubric: Sequence[str],
    ) -> list[SuggestedEdit]:
        """Create concrete edit suggestions derived from metrics."""

        edits: list[SuggestedEdit] = []

        if metrics.longest_sentence is not None and metrics.longest_sentence.word_count >= 18:
            replacement = self._split_sentence(metrics.longest_sentence.text)
            if replacement:
                edits.append(
                    SuggestedEdit(
                        range=(metrics.longest_sentence.start, metrics.longest_sentence.end),
                        replacement=replacement,
                    )
                )

        if metrics.repeated_word is not None:
            edits.append(
                SuggestedEdit(
                    range=(metrics.repeated_word.start, metrics.repeated_word.end),
                    replacement=metrics.repeated_word.word,
                )
            )

        if "Horror" in rubric and metrics.horror_word_count < 2 and document.body_text.strip():
            insertion_point = len(document.body_text)
            prefix = "\n\n" if document.body_text and not document.body_text.endswith("\n") else "\n"
            addition = (
                f"{prefix}A cold draft knifes through the dark, carrying a copper tang that makes her throat seize."
            )
            edits.append(
                SuggestedEdit(
                    range=(insertion_point, insertion_point),
                    replacement=addition,
                )
            )

        return edits

    @staticmethod
    def _split_sentence(sentence: str) -> str:
        """Split a long sentence into two shorter beats."""

        words = sentence.strip()
        if not words:
            return sentence
        tokens = words.split()
        if len(tokens) < 8:
            return sentence.strip()
        midpoint = math.floor(len(tokens) / 2)
        first = " ".join(tokens[:midpoint])
        second = " ".join(tokens[midpoint:])
        if not first or not second:
            return sentence.strip()
        second = second[0].upper() + second[1:] if len(second) > 1 else second
        terminal = "."
        if sentence.strip()[-1] in ".!?":
            terminal = sentence.strip()[-1]
        if not second.endswith(terminal):
            second = f"{second.rstrip(terminal)}{terminal}"
        return f"{first}. {second}"
