from __future__ import annotations

from blackskies.services.memory_lab.extractor import build_memory_artifacts


def test_build_memory_artifacts_maps_types() -> None:
    payload = {
        "summary": "Scene summary.",
        "unresolved": ["Question A", "Question B"],
        "emotional_carryover": "fear",
        "location_state": "cellar",
        "reveals": ["Reveal one"],
    }

    artifacts = build_memory_artifacts(
        scene_id="sc_0001",
        chapter_id="ch_0001",
        text="Scene body text.",
        carryover_payload=payload,
        recency_order=3,
    )

    assert [item.artifact_type for item in artifacts] == [
        "summary",
        "unresolved_tension",
        "unresolved_tension",
        "emotional_state",
        "location_state",
        "reveal",
    ]


def test_build_memory_artifacts_dedupes_duplicates() -> None:
    payload = {
        "summary": "Same text",
        "unresolved": ["Same text", "Same text", "Different text"],
        "emotional_carryover": "Same text",
        "location_state": "place",
        "reveals": ["Different text", "Different text"],
    }

    artifacts = build_memory_artifacts(
        scene_id="sc_0002",
        chapter_id=None,
        text="Source excerpt text.",
        carryover_payload=payload,
        recency_order=1,
    )

    type_and_content = {(item.artifact_type, item.content) for item in artifacts}
    assert len(type_and_content) == len(artifacts)
    assert [item.content for item in artifacts if item.artifact_type == "unresolved_tension"] == [
        "Same text",
        "Different text",
    ]
    assert [item.content for item in artifacts if item.artifact_type == "reveal"] == [
        "Different text"
    ]


def test_build_memory_artifacts_skips_empty_values() -> None:
    payload = {
        "summary": "  ",
        "unresolved": ["", "   ", None],
        "emotional_carryover": None,
        "location_state": "",
        "reveals": ["\n", None, "Reveal"],
    }

    artifacts = build_memory_artifacts(
        scene_id="sc_0003",
        chapter_id=None,
        text="",
        carryover_payload=payload,
        recency_order=2,
    )

    assert len(artifacts) == 1
    assert artifacts[0].artifact_type == "reveal"
    assert artifacts[0].content == "Reveal"


def test_build_memory_artifacts_adds_deterministic_interpretations_for_would_not_let_pattern() -> (
    None
):
    payload = {
        "summary": "He would not let her leave, but he said it was for her safety.",
        "unresolved": [],
        "emotional_carryover": None,
        "location_state": None,
        "reveals": [],
    }

    artifacts = build_memory_artifacts(
        scene_id="sc_0100",
        chapter_id="ch_0001",
        text="Scene body text.",
        carryover_payload=payload,
        recency_order=1,
        interpretations_enabled=True,
    )

    summary_artifacts = [item for item in artifacts if item.artifact_type == "summary"]
    assert len(summary_artifacts) == 3
    base = next(item for item in summary_artifacts if item.interpretation_label is None)
    variant_labels = [
        item.interpretation_label
        for item in summary_artifacts
        if item.interpretation_label is not None
    ]
    assert variant_labels == ["protective", "controlling"]
    for variant in summary_artifacts:
        if variant.interpretation_label is None:
            continue
        assert variant.parent_artifact_id == base.artifact_id


def test_build_memory_artifacts_adds_deterministic_interpretations_for_smiled_wrong_pattern() -> (
    None
):
    payload = {
        "summary": "She smiled while everything felt wrong.",
        "unresolved": [],
        "emotional_carryover": None,
        "location_state": None,
        "reveals": [],
    }

    artifacts = build_memory_artifacts(
        scene_id="sc_0101",
        chapter_id="ch_0001",
        text="Scene body text.",
        carryover_payload=payload,
        recency_order=1,
        interpretations_enabled=True,
    )

    summary_artifacts = [item for item in artifacts if item.artifact_type == "summary"]
    assert len(summary_artifacts) == 3
    variant_labels = [
        item.interpretation_label
        for item in summary_artifacts
        if item.interpretation_label is not None
    ]
    assert variant_labels == ["friendly", "threatening"]


def test_build_memory_artifacts_caps_interpretations_at_two() -> None:
    payload = {
        "summary": "He would not let her leave while he helped her even as she was afraid.",
        "unresolved": [],
        "emotional_carryover": None,
        "location_state": None,
        "reveals": [],
    }

    artifacts = build_memory_artifacts(
        scene_id="sc_0102",
        chapter_id="ch_0001",
        text="Scene body text.",
        carryover_payload=payload,
        recency_order=1,
        interpretations_enabled=True,
    )

    variant_labels = [
        item.interpretation_label for item in artifacts if item.interpretation_label is not None
    ]
    assert variant_labels == ["protective", "controlling"]
