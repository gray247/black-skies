"""Tests for the summarizer tool adapter."""

from __future__ import annotations

import pytest

from black_skies.tools import SummarizerTool


@pytest.mark.unit
def test_summarize_selects_high_scoring_sentences() -> None:
    tool = SummarizerTool()
    context = tool.context(trace_id="summarize-1")
    text = (
        "Alpha beta gamma. "
        "Alpha systems deliver alpha features. "
        "Gamma updates ensure beta alignment."
    )

    result = tool.summarize(context, text, max_sentences=2)

    assert result.ok
    assert "Alpha systems deliver alpha features." in result.value
    assert "Alpha beta gamma." in result.value
    assert result.metadata["sentences"] == 2
    assert result.metadata["original_sentences"] == 3


@pytest.mark.unit
def test_summarize_handles_empty_text() -> None:
    tool = SummarizerTool()
    context = tool.context()

    result = tool.summarize(context, "   ")

    assert result.ok
    assert result.value == ""
    assert result.metadata["sentences"] == 0


@pytest.mark.unit
def test_summarize_rejects_excessive_sentence_request() -> None:
    tool = SummarizerTool()
    context = tool.context()

    with pytest.raises(ValueError):
        tool.summarize(context, "Only one sentence.", max_sentences=50)


@pytest.mark.unit
def test_summarize_rejects_non_string_text() -> None:
    tool = SummarizerTool()
    context = tool.context()

    with pytest.raises(TypeError):
        tool.summarize(context, ["not", "text"])  # type: ignore[arg-type]


@pytest.mark.unit
def test_summarize_requires_positive_sentence_count() -> None:
    tool = SummarizerTool()
    context = tool.context()

    with pytest.raises(ValueError):
        tool.summarize(context, "Alpha.", max_sentences=0)


@pytest.mark.unit
def test_summarize_handles_stopword_only_text() -> None:
    tool = SummarizerTool()
    context = tool.context()

    result = tool.summarize(context, "The and but or.", max_sentences=2)

    assert result.ok
    assert result.value == "The and but or."
    assert result.metadata["sentences"] == 1

