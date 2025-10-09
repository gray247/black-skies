from __future__ import annotations

from pathlib import Path

import pytest

from blackskies.services.tools import MarkdownSearchTool


@pytest.mark.unit
def test_search_returns_ranked_results(tmp_path: Path) -> None:
    data_root = tmp_path / "md"
    data_root.mkdir()
    (data_root / "alpha.md").write_text(
        "Alpha mission control handles alpha operations. Mission-critical updates live here.",
        encoding="utf-8",
    )
    (data_root / "beta.md").write_text(
        "Search mission logs include mission context for analysts.",
        encoding="utf-8",
    )
    (data_root / "gamma.md").write_text(
        "Completely unrelated content without the target keywords.",
        encoding="utf-8",
    )

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context(trace_id="search-1")

    result = tool.search(context, "alpha mission", limit=5)

    assert result.ok
    assert len(result.value) == 2
    assert result.value[0]["path"] == "alpha.md"
    assert result.value[0]["score"] > result.value[1]["score"]
    assert "mission" in result.value[0]["excerpt"].lower()


@pytest.mark.unit
def test_search_handles_empty_corpus(tmp_path: Path) -> None:
    data_root = tmp_path / "empty"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    result = tool.search(context, "solitary", limit=3)

    assert result.ok
    assert result.value == []


@pytest.mark.unit
def test_search_rejects_oversized_query(tmp_path: Path) -> None:
    data_root = tmp_path / "guard"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(ValueError):
        tool.search(context, "x" * 300)


@pytest.mark.unit
def test_search_requires_string_query(tmp_path: Path) -> None:
    data_root = tmp_path / "type"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(TypeError):
        tool.search(context, 123)  # type: ignore[arg-type]


@pytest.mark.unit
def test_search_requires_positive_limit(tmp_path: Path) -> None:
    data_root = tmp_path / "limit"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(ValueError):
        tool.search(context, "keyword", limit=0)


@pytest.mark.unit
def test_search_rejects_non_integer_limit(tmp_path: Path) -> None:
    data_root = tmp_path / "limit-type"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(TypeError):
        tool.search(context, "keyword", limit=2.5)  # type: ignore[arg-type]


@pytest.mark.unit
def test_search_rejects_empty_query(tmp_path: Path) -> None:
    data_root = tmp_path / "empty-query"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(ValueError):
        tool.search(context, "   ")


@pytest.mark.unit
def test_search_requires_keywords_after_tokenization(tmp_path: Path) -> None:
    data_root = tmp_path / "tokens"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(ValueError):
        tool.search(context, "!!!")


@pytest.mark.unit
def test_search_rejects_excessive_limit(tmp_path: Path) -> None:
    data_root = tmp_path / "limit-high"
    data_root.mkdir()

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    with pytest.raises(ValueError):
        tool.search(context, "keyword", limit=100)


@pytest.mark.unit
def test_search_handles_unreadable_files(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    data_root = tmp_path / "io"
    data_root.mkdir()
    good_file = data_root / "good.md"
    bad_file = data_root / "bad.md"
    good_file.write_text("Readable keyword content.", encoding="utf-8")
    bad_file.write_text("This will fail.", encoding="utf-8")

    tool = MarkdownSearchTool(data_root=data_root)
    context = tool.context()

    original_read_text = Path.read_text

    def fake_read_text(self: Path, *args: object, **kwargs: object) -> str:
        if self == bad_file:
            raise OSError("boom")
        return original_read_text(self, *args, **kwargs)

    monkeypatch.setattr(Path, "read_text", fake_read_text)

    result = tool.search(context, "keyword")
    assert result.ok
    assert len(result.value) == 1
    assert result.value[0]["path"] == "good.md"
