"""Text helper utilities for analytics processors."""

from __future__ import annotations

import re
import string
from statistics import mean
from typing import Iterable, List, NamedTuple, Tuple


ConversationSpan = NamedTuple(
    "ConversationSpan",
    [
        ("start", int),
        ("end", int),
        ("text", str),
    ],
)

_ABBREVIATIONS = {
    "mr",
    "mrs",
    "ms",
    "dr",
    "prof",
    "capt",
    "lt",
    "etc",
    "jr",
    "sr",
    "vs",
    "e.g",
    "i.e",
}

_SENTENCE_BOUNDARY = re.compile(
    r"""
    (?P<sentence>          # capture the candidate sentence
        .*?                # minimal chars
        [.!?]+             # terminal punctuation
        (?:
            ['"]?          # optional quote
        )
    )
    (?=\s+|$)              # lookahead ensures boundary
    """,
    re.VERBOSE | re.MULTILINE,
)

_QUOTED_SPAN = re.compile(r'(["\'])(.+?)\1', re.DOTALL)

_TOKEN_BASIC = re.compile(r"[A-Za-z0-9]+")


def _normalize_token(token: str) -> str:
    return token.strip().lower()


def split_sentences(text: str) -> List[str]:
    """Split text into sentences while honoring common abbreviations."""

    if not text:
        return []

    candidate = text.replace("\n", " ").strip()
    if not candidate:
        return []

    sentences: List[str] = []
    buffer = []
    last_pos = 0
    for match in re.finditer(r"[.!?]+", candidate):
        end = match.end()
        segment = candidate[last_pos:end].strip()
        if not segment:
            last_pos = end
            continue
        last_word = segment.rstrip(".!?\"'").split()[-1] if segment.split() else ""
        normalized = last_word.rstrip(".").lower()
        if normalized in _ABBREVIATIONS:
            buffer.append(segment)
            last_pos = end
            continue
        if buffer:
            buffer.append(segment)
            sentences.append(" ".join(buffer).strip())
            buffer = []
        else:
            sentences.append(segment)
        last_pos = end

    tail = candidate[last_pos:].strip()
    if tail:
        if buffer:
            buffer.append(tail)
            sentences.append(" ".join(buffer).strip())
        else:
            sentences.append(tail)
    return [sentence for sentence in sentences if sentence]


def tokenize_words(text: str) -> List[str]:
    """Return lowercase alphanumeric tokens extracted from the text."""

    if not text:
        return []
    matches = _TOKEN_BASIC.findall(text)
    return [_normalize_token(match) for match in matches if match.strip()]


def is_long_sentence(sentence: str, threshold: int = 30) -> bool:
    """Return True if a sentence exceeds the word threshold."""

    return len(tokenize_words(sentence)) >= threshold


def type_token_ratio(tokens: Iterable[str]) -> float:
    """Compute type-token ratio; return 0 for empty token lists."""

    token_list = [tok for tok in tokens if tok]
    if not token_list:
        return 0.0
    unique = len(set(token_list))
    total = len(token_list)
    return unique / total if total > 0 else 0.0


def extract_quoted_spans(text: str) -> List[ConversationSpan]:
    """Return strict double/single quoted spans (dialogue only)."""

    spans: List[ConversationSpan] = []
    for match in _QUOTED_SPAN.finditer(text):
        start, end = match.span()
        content = match.group(2).strip()
        if not content:
            continue
        spans.append(ConversationSpan(start, end, content))
    return spans


def count_characters(text: str) -> int:
    """Return number of characters in given text."""

    return len(text)


def count_tokens(tokens: Iterable[str]) -> int:
    """Return token count for an iterable of tokens."""

    return sum(1 for _ in tokens)


def _classify_readability_bucket(avg_len: float, pct_long: float) -> str:
    if avg_len < 14.0 and pct_long < 0.10:
        return "Easy"
    if (14.0 <= avg_len <= 20.0) or (0.10 <= pct_long <= 0.20):
        return "Moderate"
    return "Dense"


def compute_readability_metrics(text: str) -> dict[str, float | str]:
    """Compute readability composite values for a scene."""

    sentences = split_sentences(text)
    num_sentences = len(sentences)
    long_sentences = 0
    total_words = 0
    for sentence in sentences:
        tokens = tokenize_words(sentence)
        if len(tokens) >= 30:
            long_sentences += 1
        total_words += len(tokens)

    if num_sentences == 0:
        avg_sentence_len = 0.0
        pct_long_sentences = 0.0
    else:
        avg_sentence_len = total_words / num_sentences
        pct_long_sentences = long_sentences / num_sentences

    tokens = tokenize_words(text)
    ttr = type_token_ratio(tokens)
    bucket = _classify_readability_bucket(avg_sentence_len, pct_long_sentences)
    return {
        "avg_sentence_len": round(avg_sentence_len, 2),
        "pct_long_sentences": round(pct_long_sentences, 3),
        "ttr": round(ttr, 3),
        "bucket": bucket,
    }


def compute_dialogue_narration_metrics(text: str) -> dict[str, float]:
    """Extract dialogue vs narration ratios based on strict quoted spans."""

    dialogue_tokens = 0
    dialogue_chars = 0
    total_tokens = 0
    total_chars = count_characters(text)

    tokens = tokenize_words(text)
    total_tokens = len(tokens)

    for span in extract_quoted_spans(text):
        span_tokens = tokenize_words(span.text)
        dialogue_tokens += len(span_tokens)
        dialogue_chars += count_characters(span.text)

    narration_tokens = max(total_tokens - dialogue_tokens, 0)
    narration_chars = max(total_chars - dialogue_chars, 0)
    dialogue_ratio = dialogue_tokens / total_tokens if total_tokens > 0 else 0.0
    narration_ratio = narration_tokens / total_tokens if total_tokens > 0 else 0.0

    # ensure ratios sum to approx 1
    if total_tokens > 0:
        gap = 1.0 - (dialogue_ratio + narration_ratio)
        if gap > 0:
            narration_ratio += gap

    return {
        "dialogue_tokens": dialogue_tokens,
        "narration_tokens": narration_tokens,
        "dialogue_chars": dialogue_chars,
        "narration_chars": narration_chars,
        "dialogue_ratio": round(min(max(dialogue_ratio, 0.0), 1.0), 3),
        "narration_ratio": round(min(max(narration_ratio, 0.0), 1.0), 3),
    }


def compute_structural_pacing_score(word_count: int, dialogue_ratio: float) -> float:
    """Compute structural pacing score (word count plus dialogue influence)."""

    base = max(word_count, 0)
    scale = max(min(dialogue_ratio, 1.0), 0.0)
    return round(base * (1 + scale), 2)


def classify_pacing_bucket(score: float, mean_score: float) -> str:
    """Classify pacing as Slow/Neutral/Fast using mean-based thresholds."""

    if mean_score <= 0:
        return "Neutral"
    slow_threshold = mean_score * 0.9
    fast_threshold = mean_score * 1.1
    if score <= slow_threshold:
        return "Slow"
    if score >= fast_threshold:
        return "Fast"
    return "Neutral"


def score_scene_pacing(
    entries: Iterable[tuple[str, int, float]]
) -> list[dict[str, object]]:
    """Return pacing scores and buckets for a sequence of scenes."""

    scored = []
    scores = []
    for scene_id, word_count, dialogue_ratio in entries:
        score = compute_structural_pacing_score(word_count, dialogue_ratio)
        scored.append((scene_id, word_count, dialogue_ratio, score))
        scores.append(score)

    mean_score = mean(scores) if scores else 0.0
    results: list[dict[str, object]] = []
    for scene_id, word_count, dialogue_ratio, score in scored:
        bucket = classify_pacing_bucket(score, mean_score)
        results.append(
            {
                "scene_id": scene_id,
                "word_count": word_count,
                "dialogue_ratio": round(dialogue_ratio, 3),
                "structural_score": score,
                "pacing_bucket": bucket,
            }
        )
    return results
