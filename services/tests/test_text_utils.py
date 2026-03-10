import pytest

from blackskies.services.analytics import text_utils


def test_split_sentences_basic():
    text = "This is sentence one. And another! What about ellipses... Or Mr. Smith?"
    result = text_utils.split_sentences(text)
    assert len(result) >= 4
    assert result[0].startswith("This is sentence one")
    assert "Mr. Smith?" in result[-1]


def test_tokenize_words():
    tokens = text_utils.tokenize_words("Hello, world! This 123 is-code.")
    assert tokens == ["hello", "world", "this", "123", "is", "code"]


def test_is_long_sentence():
    sentence = "word " * 31
    assert text_utils.is_long_sentence(sentence, threshold=30)
    assert not text_utils.is_long_sentence("short sentence")


def test_type_token_ratio():
    tokens = ["a", "b", "c", "a"]
    assert text_utils.type_token_ratio(tokens) == pytest.approx(3 / 4)
    assert text_utils.type_token_ratio([]) == 0.0


def test_extract_quoted_spans():
    text = 'He said, "hello there". And then \'goodbye\'. Broken "quote only.'
    spans = text_utils.extract_quoted_spans(text)
    assert len(spans) == 2
    assert spans[0].text == "hello there"
    assert spans[1].text == "goodbye"


def test_character_token_counts():
    assert text_utils.count_characters("abc") == 3
    assert text_utils.count_tokens(["a", "b"]) == 2


def test_compute_readability_metrics():
    text = "Short sentence. This one is definitely longer with more than thirty words added just to verify the threshold works! Tiny."
    metrics = text_utils.compute_readability_metrics(text)
    assert metrics["bucket"] in {"Moderate", "Dense", "Easy"}
    assert metrics["avg_sentence_len"] > 0
    assert 0.0 <= metrics["pct_long_sentences"] <= 1.0
    assert 0.0 <= metrics["ttr"] <= 1.0


def test_compute_readability_metrics_buckets():
    easy_text = "Nice day. Short read."
    moderate_text = " ".join(["word"] * 15) + ". " + " ".join(["word"] * 15) + "."
    dense_text = " ".join(["word"] * 100)
    assert text_utils.compute_readability_metrics(easy_text)["bucket"] == "Easy"
    bucket = text_utils.compute_readability_metrics(moderate_text)["bucket"]
    assert bucket == "Moderate"
    assert text_utils.compute_readability_metrics(dense_text)["bucket"] == "Dense"


def test_compute_dialogue_narration_metrics():
    text = 'She whispered, "hello world." Then the narrator continued.'
    metrics = text_utils.compute_dialogue_narration_metrics(text)
    assert metrics["dialogue_ratio"] > 0
    assert metrics["narration_ratio"] <= 1
    assert metrics["dialogue_ratio"] + metrics["narration_ratio"] <= 1.01


def test_score_scene_pacing():
    entries = [
        ("scene-1", 100, 0.1),
        ("scene-2", 50, 0.0),
        ("scene-3", 200, 0.5),
    ]
    results = text_utils.score_scene_pacing(entries)
    assert len(results) == 3
    assert any(item["pacing_bucket"] == "Slow" for item in results)
    assert any(item["pacing_bucket"] == "Fast" for item in results)
