"""Keyword search tool for Markdown files stored under the data directory."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Mapping, TypedDict

from .base import (
    ToolContext,
    ToolExecutionResult,
    ToolInvocationContext,
    ToolMetadata,
    log_tool_complete,
    log_tool_start,
)

_WORD_RE = re.compile(r"[A-Za-z0-9']+")


class SearchHit(TypedDict):
    path: str
    score: int
    excerpt: str


class MarkdownSearchTool:
    """Simple offline keyword search implementation."""

    name = "markdown_search"
    metadata = ToolMetadata(
        name=name,
        model="black-skies.keyword-search",
        cost_estimate="filesystem-scan",
    )

    _MAX_QUERY_LENGTH = 256
    _MAX_LIMIT = 25

    def __init__(self, data_root: str | Path | None = None) -> None:
        self._data_root = Path(data_root) if data_root is not None else Path("data")
        self._data_root.mkdir(parents=True, exist_ok=True)

    def context(
        self,
        *,
        trace_id: str | None = None,
        metadata: Mapping[str, object] | None = None,
    ) -> ToolInvocationContext:
        return ToolInvocationContext(name=self.name, trace_id=trace_id, metadata=metadata or {})

    def search(
        self,
        context: ToolContext,
        query: str,
        *,
        limit: int = 5,
    ) -> ToolExecutionResult[list[SearchHit]]:
        """Search Markdown files for ``query`` terms."""

        if not isinstance(query, str):
            raise TypeError("query must be a string.")
        if not isinstance(limit, int):
            raise TypeError("limit must be an integer.")
        if limit <= 0:
            raise ValueError("limit must be greater than zero.")
        if limit > self._MAX_LIMIT:
            raise ValueError(f"limit must be less than or equal to {self._MAX_LIMIT}.")

        stripped_query = query.strip()
        if not stripped_query:
            raise ValueError("query must not be empty.")
        if len(stripped_query) > self._MAX_QUERY_LENGTH:
            raise ValueError("query exceeds maximum length.")

        terms = list(self._tokenize(stripped_query))
        if not terms:
            raise ValueError("query must include at least one keyword.")

        operation_payload = {
            "operation": "search",
            "query_terms": len(terms),
            "limit": limit,
        }
        log_tool_start(context, **operation_payload)

        hits = self._gather_hits(terms)
        hits.sort(key=lambda item: (-item["score"], item["path"]))
        limited_hits = hits[:limit]

        log_tool_complete(
            context,
            **{
                **operation_payload,
                "status": "success",
                "results": len(limited_hits),
            },
        )
        return ToolExecutionResult(
            value=limited_hits, metadata={"results": len(limited_hits), "limit": limit}
        )

    def _tokenize(self, text: str) -> Iterable[str]:
        for match in _WORD_RE.finditer(text.lower()):
            token = match.group(0)
            if token:
                yield token

    def _gather_hits(self, terms: list[str]) -> list[SearchHit]:
        hits: list[SearchHit] = []
        for path in sorted(self._data_root.rglob("*.md")):
            try:
                content = path.read_text(encoding="utf-8")
            except OSError:
                continue
            score = self._score_content(content, terms)
            if score == 0:
                continue
            excerpt = self._build_excerpt(content, terms)
            hits.append(
                {
                    "path": str(path.relative_to(self._data_root)),
                    "score": score,
                    "excerpt": excerpt,
                }
            )
        return hits

    def _score_content(self, content: str, terms: list[str]) -> int:
        lowered = content.lower()
        return sum(lowered.count(term) for term in terms)

    def _build_excerpt(self, content: str, terms: list[str]) -> str:
        lowered = content.lower()
        for term in terms:
            index = lowered.find(term)
            if index != -1:
                start = max(0, index - 40)
                end = min(len(content), index + len(term) + 40)
                snippet = content[start:end].replace("\n", " ").strip()
                prefix = "…" if start > 0 else ""
                suffix = "…" if end < len(content) else ""
                return f"{prefix}{snippet}{suffix}"
        snippet = content[:80].replace("\n", " ").strip()
        if len(content) > 80:
            return f"{snippet}…"
        return snippet
