"""Frequency-based text summarization tool adapter."""

from __future__ import annotations

import re
from collections import Counter
from typing import Iterable, Mapping

from .base import (
    ToolContext,
    ToolExecutionResult,
    ToolInvocationContext,
    ToolMetadata,
    log_tool_complete,
    log_tool_start,
)

_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[A-Za-z0-9']+")
_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "of",
    "on",
    "or",
    "such",
    "that",
    "the",
    "their",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "was",
    "will",
    "with",
}


class SummarizerTool:
    """Frequency-weighted sentence extraction using only local resources."""

    name = "summarizer"
    metadata = ToolMetadata(
        name=name,
        model="black-skies.local-summarizer",
        cost_estimate="cpu-only",
    )

    _MAX_SENTENCES = 10

    def context(
        self,
        *,
        trace_id: str | None = None,
        metadata: Mapping[str, object] | None = None,
    ) -> ToolInvocationContext:
        """Convenience helper to build a :class:`ToolInvocationContext`."""

        return ToolInvocationContext(name=self.name, trace_id=trace_id, metadata=metadata or {})

    def summarize(
        self,
        context: ToolContext,
        text: str,
        *,
        max_sentences: int = 3,
    ) -> ToolExecutionResult[str]:
        """Summarize ``text`` using frequency-weighted sentence ranking."""

        if not isinstance(text, str):
            raise TypeError("SummarizerTool.summarize expects a text string.")
        if not isinstance(max_sentences, int):
            raise TypeError("max_sentences must be an integer.")
        if max_sentences <= 0:
            raise ValueError("max_sentences must be greater than zero.")
        if max_sentences > self._MAX_SENTENCES:
            raise ValueError(
                f"max_sentences exceeds supported window ({self._MAX_SENTENCES})."
            )

        normalized_text = text.strip()
        operation_payload = {
            "operation": "summarize",
            "requested_sentences": max_sentences,
            "input_length": len(text),
        }
        log_tool_start(context, **operation_payload)

        if not normalized_text:
            log_tool_complete(
                context,
                **{
                    **operation_payload,
                    "status": "success",
                    "selected_sentences": 0,
                },
            )
            return ToolExecutionResult(value="", metadata={"sentences": 0, "original_sentences": 0})

        sentences = self._split_sentences(normalized_text)
        if not sentences:
            log_tool_complete(
                context,
                **{
                    **operation_payload,
                    "status": "success",
                    "selected_sentences": 0,
                },
            )
            return ToolExecutionResult(value="", metadata={"sentences": 0, "original_sentences": 0})

        frequencies = self._calculate_frequencies(sentences)
        scores = [self._score_sentence(sentence, frequencies) for sentence in sentences]
        if any(score > 0 for score in scores):
            ranked_indices = sorted(
                range(len(sentences)),
                key=lambda idx: (-scores[idx], idx),
            )
            selected_indices = sorted(ranked_indices[: min(max_sentences, len(sentences))])
        else:
            selected_indices = list(range(min(max_sentences, len(sentences))))

        summary_sentences = [sentences[idx] for idx in selected_indices]
        summary = " ".join(summary_sentences)

        log_tool_complete(
            context,
            **{
                **operation_payload,
                "status": "success",
                "selected_sentences": len(summary_sentences),
            },
        )
        return ToolExecutionResult(
            value=summary,
            metadata={
                "sentences": len(summary_sentences),
                "original_sentences": len(sentences),
                "requested_sentences": max_sentences,
            },
        )

    def _split_sentences(self, text: str) -> list[str]:
        parts = _SENTENCE_RE.split(text)
        sentences = [part.strip() for part in parts if part.strip()]
        return sentences

    def _calculate_frequencies(self, sentences: Iterable[str]) -> Counter[str]:
        frequencies: Counter[str] = Counter()
        for sentence in sentences:
            for word in self._tokenize(sentence):
                if word not in _STOPWORDS:
                    frequencies[word] += 1
        return frequencies

    def _score_sentence(self, sentence: str, frequencies: Counter[str]) -> float:
        tokens = list(self._tokenize(sentence))
        if not tokens:
            return 0.0
        score = sum(frequencies.get(token, 0) for token in tokens)
        return score / len(tokens)

    def _tokenize(self, text: str) -> Iterable[str]:
        for match in _WORD_RE.finditer(text.lower()):
            token = match.group(0)
            if token:
                yield token

