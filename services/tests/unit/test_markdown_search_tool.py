from __future__ import annotations

from pathlib import Path

import pytest

from blackskies.services.tools.search import (
    DEFAULT_MAX_QUERY_LENGTH,
    DEFAULT_MAX_RESULTS,
    MarkdownSearchTool,
)


def test_search_rejects_queries_exceeding_length(tmp_path: Path) -> None:
    tool = MarkdownSearchTool(data_root=tmp_path)
    long_query = "x" * (DEFAULT_MAX_QUERY_LENGTH + 1)

    with pytest.raises(ValueError, match="exceeds maximum length"):
        tool.search(tool.context(), long_query)


def test_search_rejects_excessive_limits(tmp_path: Path) -> None:
    tool = MarkdownSearchTool(data_root=tmp_path)

    with pytest.raises(ValueError, match=str(DEFAULT_MAX_RESULTS)):
        tool.search(tool.context(), "alpha", limit=DEFAULT_MAX_RESULTS + 1)


def test_search_returns_expected_hits(tmp_path: Path) -> None:
    content = """# Title\n\nAlpha beta gamma.\nAlpha delta."""
    (tmp_path / "sample.md").write_text(content, encoding="utf-8")
    tool = MarkdownSearchTool(data_root=tmp_path, excerpt_padding=10, fallback_excerpt=20)

    result = tool.search(tool.context(), "alpha", limit=1)

    assert len(result.value) == 1
    hit = result.value[0]
    assert hit["path"] == "sample.md"
    assert hit["score"] == 2
    # Excerpt should contain keyword even with customised padding.
    assert "alpha" in hit["excerpt"].lower()
