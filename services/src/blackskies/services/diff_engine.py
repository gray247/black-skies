"""Token-based diff engine used by rewrite operations."""

from __future__ import annotations

from dataclasses import dataclass
from difflib import SequenceMatcher
import re
from typing import Iterable, Sequence

from .models import AddedDiff, ChangedDiff, DiffAnchors, DiffPayload, RemovedDiff

_TOKEN_PATTERN = re.compile(r"\S+|\n")


@dataclass(frozen=True)
class _TokenSpan:
    """A token along with its character span."""

    value: str
    start: int
    end: int


class DiffEngine:
    """Compute token-level diffs between two text bodies."""

    def __init__(self, anchor_window: int = 4) -> None:
        self._anchor_window = anchor_window

    def compute(self, original: str, revised: str) -> DiffPayload:
        """Return a structured diff between ``original`` and ``revised`` text."""

        original_tokens = list(_iter_tokens(original))
        revised_tokens = list(_iter_tokens(revised))

        matcher = SequenceMatcher(
            a=[token.value for token in original_tokens],
            b=[token.value for token in revised_tokens],
            autojunk=False,
        )

        added: list[AddedDiff] = []
        removed: list[RemovedDiff] = []
        changed: list[ChangedDiff] = []
        touched_ranges: list[tuple[int, int]] = []

        for tag, a0, a1, b0, b1 in matcher.get_opcodes():
            if tag == "equal":
                continue

            touched_ranges.append((a0, a1 if tag != "insert" else a0))

            if tag == "delete":
                start, end = _span_from_tokens(original_tokens, a0, a1, len(original))
                removed.append(RemovedDiff(range=(start, end)))
            elif tag == "insert":
                start, end = _span_from_tokens(revised_tokens, b0, b1, len(revised))
                text = revised[start:end]
                added.append(AddedDiff(range=(start, end), text=text))
            elif tag == "replace":
                start, end = _span_from_tokens(original_tokens, a0, a1, len(original))
                repl_start, repl_end = _span_from_tokens(revised_tokens, b0, b1, len(revised))
                replacement = revised[repl_start:repl_end]
                changed.append(ChangedDiff(range=(start, end), replacement=replacement))

        anchors = self._build_anchors(touched_ranges, len(original_tokens))
        return DiffPayload(added=added, removed=removed, changed=changed, anchors=anchors)

    def _build_anchors(self, ranges: Sequence[tuple[int, int]], token_count: int) -> DiffAnchors:
        """Compute anchor sizes based on touched token ranges."""

        if not ranges or token_count == 0:
            size = min(self._anchor_window, token_count)
            return DiffAnchors(left=size, right=size)

        min_index = min(start for start, _ in ranges)
        max_index = max(end for _, end in ranges)
        right_margin = max(0, token_count - max_index)
        left = min(self._anchor_window, min_index)
        right = min(self._anchor_window, right_margin)
        return DiffAnchors(left=left, right=right)


def _iter_tokens(text: str) -> Iterable[_TokenSpan]:
    """Yield tokens from ``text`` with their spans."""

    for match in _TOKEN_PATTERN.finditer(text):
        yield _TokenSpan(match.group(0), match.start(), match.end())


def _span_from_tokens(
    tokens: Sequence[_TokenSpan],
    start_index: int,
    end_index: int,
    fallback: int,
) -> tuple[int, int]:
    """Compute the span covering tokens between ``start_index`` and ``end_index``."""

    if start_index >= end_index or not tokens:
        return fallback, fallback

    start = tokens[start_index].start
    end = tokens[end_index - 1].end
    return start, end
