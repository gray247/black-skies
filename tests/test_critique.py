from __future__ import annotations

from black_skies.critique import CATEGORIES, apply_rubric
from black_skies.models import Draft


def test_apply_rubric_returns_required_fields() -> None:
    draft = Draft(
        unit_id="sc_0001",
        title="Storm Arrival",
        text="""The sirens howl across the ridge. Mara drags the generator cables inside.

She counts to twenty between lightning strikes, waits for the next blast, and braces.""",
        metadata={"chapter": "ch_0001"},
    )

    critique = apply_rubric(draft)
    payload = critique.to_dict()

    assert payload["unit_id"] == draft.unit_id
    assert payload["schema_version"] == "CritiqueOutputSchema v1"
    assert isinstance(payload["summary"], str) and payload["summary"]
    assert isinstance(payload["line_comments"], list)
    assert isinstance(payload["priorities"], list) and payload["priorities"]
    assert isinstance(payload["suggested_edits"], list)
    assert payload["model"]["name"] == "black-skies-rubric-v1"
    assert payload["severity"] in {"low", "medium", "high"}


def test_rubric_considers_sentence_length() -> None:
    long_sentence = " ".join(["word"] * 200)
    draft = Draft(unit_id="sc_0002", title="Long Winded", text=long_sentence)

    critique = apply_rubric(draft)
    assert "sentence" in critique.summary.lower()
    assert any("sentence" in priority.lower() for priority in critique.priorities)


def test_categories_remain_available() -> None:
    assert {"Logic", "Prose", "Horror"}.issubset(set(CATEGORIES))
